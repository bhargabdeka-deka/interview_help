package handlers

import (
	"encoding/json"
	"log"
	"sync"

	"interviewos/internal/db"
	"interviewos/internal/models"
	"interviewos/internal/utils"

	"github.com/gofiber/websocket/v2"
)

// Client represents a connected user in a room
type Client struct {
	Conn     *websocket.Conn
	UserID   string
	Name     string
	Approved bool // Whether this client has been approved by the host
}

// Room represents a collection of connected clients for an interview
type Room struct {
	Clients map[string]*Client // Keyed by UserID
	Mutex   sync.Mutex
}

// Hub manages all active rooms and WebSocket connections
type Hub struct {
	Rooms map[string]*Room
	Mutex sync.Mutex
}

var RoomHub = &Hub{
	Rooms: make(map[string]*Room),
}

// WebSocketMessage defines the standard JSON payload structure
type WebSocketMessage struct {
	Type       string      `json:"type"`
	RoomID     string      `json:"roomId,omitempty"`
	UserID     string      `json:"userId,omitempty"`
	Name       string      `json:"name,omitempty"`
	TargetID   string      `json:"targetId,omitempty"`
	SenderID   string      `json:"senderId,omitempty"`
	SenderName string      `json:"senderName,omitempty"`
	Offer      interface{} `json:"offer,omitempty"`
	Answer     interface{} `json:"answer,omitempty"`
	Candidate  interface{} `json:"candidate,omitempty"`
	Message    string      `json:"message,omitempty"`
	Text       string      `json:"text,omitempty"`
	Code       string      `json:"code,omitempty"`
	Language   string      `json:"language,omitempty"`
	Users      interface{} `json:"users,omitempty"`
	Data       string      `json:"data,omitempty"` // whiteboard drawing JSON data
}

// WebSocketHandler manages WebSocket lifecycles with authentication
func WebSocketHandler(c *websocket.Conn) {
	roomId := c.Params("roomId")
	token := c.Query("token")

	// SECURITY: Validate JWT token
	if token == "" {
		log.Println("WS: Missing authentication token")
		c.WriteMessage(websocket.TextMessage, []byte(`{"error":"missing token"}`))
		c.Close()
		return
	}

	claims, err := utils.VerifyToken(token)
	if err != nil {
		log.Printf("WS: Invalid token: %v", err)
		c.WriteMessage(websocket.TextMessage, []byte(`{"error":"invalid token"}`))
		c.Close()
		return
	}

	userId, ok := claims["id"].(string)
	if !ok {
		log.Println("WS: Invalid token claims")
		c.WriteMessage(websocket.TextMessage, []byte(`{"error":"invalid claims"}`))
		c.Close()
		return
	}

	userName, _ := claims["name"].(string)

	if roomId == "" {
		log.Println("WS: Missing roomId")
		c.WriteMessage(websocket.TextMessage, []byte(`{"error":"missing roomId"}`))
		c.Close()
		return
	}

	// Verify room and interview exist
	var room models.InterviewRoom
	if err := db.DB.Where("id = ?", roomId).First(&room).Error; err != nil {
		log.Printf("WS: Room %s not found", roomId)
		c.WriteMessage(websocket.TextMessage, []byte(`{"error":"room not found"}`))
		c.Close()
		return
	}

	var interview models.Interview
	if err := db.DB.First(&interview, "id = ?", room.InterviewID).Error; err != nil {
		log.Printf("WS: Interview not found for room %s", roomId)
		c.WriteMessage(websocket.TextMessage, []byte(`{"error":"interview not found"}`))
		c.Close()
		return
	}

	isHost := interview.HostID == userId

	client := &Client{
		Conn:     c,
		UserID:   userId,
		Name:     userName,
		Approved: isHost, // Host is always approved. Candidates/Guests need approval.
	}

	// Add client to Hub
	RoomHub.RegisterClient(roomId, client, isHost)

	// Clean up on disconnect
	defer func() {
		RoomHub.UnregisterClient(roomId, userId)
		c.Close()
	}()

	log.Printf("WS: User %s (%s) joined room %s. Approved=%t", userName, userId, roomId, client.Approved)

	// Send current workspace states (only if approved)
	if client.Approved {
		var codeSession models.CodeSession
		if err := db.DB.Where("interview_id = ?", roomId).Order("updated_at desc").First(&codeSession).Error; err == nil {
			initialCodeMsg := WebSocketMessage{
				Type:     "code-sync",
				Code:     codeSession.Code,
				Language: codeSession.Language,
			}
			if msgBytes, err := json.Marshal(initialCodeMsg); err == nil {
				c.WriteMessage(websocket.TextMessage, msgBytes)
			}
		}

		var wbSession models.WhiteboardSession
		if err := db.DB.Where("interview_id = ?", roomId).First(&wbSession).Error; err == nil {
			initialWbMsg := WebSocketMessage{
				Type: "whiteboard-sync",
				Data: wbSession.Data,
			}
			if msgBytes, err := json.Marshal(initialWbMsg); err == nil {
				c.WriteMessage(websocket.TextMessage, msgBytes)
			}
		}
	}

	// Read messages loop
	for {
		_, msgBytes, err := c.ReadMessage()
		if err != nil {
			log.Printf("WS: Read error from user %s: %v", userId, err)
			break
		}

		var msg WebSocketMessage
		if err := json.Unmarshal(msgBytes, &msg); err != nil {
			log.Printf("WS: Error unmarshaling message: %v", err)
			continue
		}

		// Fill in sender info
		msg.SenderID = userId
		msg.SenderName = userName

		// Security: Check if client is approved before allowing sync messages
		var isApproved bool
		RoomHub.Mutex.Lock()
		r, exists := RoomHub.Rooms[roomId]
		if exists {
			r.Mutex.Lock()
			if cl, ok := r.Clients[userId]; ok {
				isApproved = cl.Approved
			}
			r.Mutex.Unlock()
		}
		RoomHub.Mutex.Unlock()

		// Intercept join-responses sent by the interviewer
		if msg.Type == "join-response" && isHost {
			RoomHub.HandleJoinResponse(roomId, msg.TargetID, msg.Text, userId)
			continue
		}

		// Quarantine unapproved clients
		if !isApproved {
			log.Printf("WS: Ignored message type %s from unapproved client %s", msg.Type, userId)
			continue
		}

		switch msg.Type {
		case "webrtc-offer", "webrtc-answer", "webrtc-ice":
			// Forward signaling payload directly to the target peer
			RoomHub.ForwardMessage(roomId, msg.TargetID, msg)

		case "chat-sync":
			// Broadcast chat message to all peers in the room
			RoomHub.BroadcastMessage(roomId, msg)

		case "code-sync":
			// Persist code session
			if msg.Code != "" || msg.Language != "" {
				go func(rId, code, lang string) {
					var session models.CodeSession
					if err := db.DB.Where("interview_id = ?", rId).First(&session).Error; err != nil {
						session = models.CodeSession{
							InterviewID: rId,
							Code:        code,
							Language:    lang,
						}
						db.DB.Create(&session)
					} else {
						if code != "" {
							session.Code = code
						}
						if lang != "" {
							session.Language = lang
						}
						db.DB.Save(&session)
					}
				}(roomId, msg.Code, msg.Language)
			}

			// Broadcast updated code to other peers in the room
			RoomHub.BroadcastMessageExcept(roomId, userId, msg)

		case "whiteboard-sync":
			// Persist whiteboard session
			if msg.Data != "" {
				go func(rId, drawData string) {
					var session models.WhiteboardSession
					if err := db.DB.Where("interview_id = ?", rId).First(&session).Error; err != nil {
						session = models.WhiteboardSession{
							InterviewID: rId,
							Data:        drawData,
						}
						db.DB.Create(&session)
					} else {
						session.Data = drawData
						db.DB.Save(&session)
					}
				}(roomId, msg.Data)
			}

			// Broadcast drawing details to other approved peers in the room
			RoomHub.BroadcastMessageExcept(roomId, userId, msg)
		}
	}
}

// RegisterClient adds a client to a room and handles lobby approval if needed
func (h *Hub) RegisterClient(roomId string, client *Client, isHost bool) {
	h.Mutex.Lock()
	room, exists := h.Rooms[roomId]
	if !exists {
		room = &Room{
			Clients: make(map[string]*Client),
		}
		h.Rooms[roomId] = room
	}
	h.Mutex.Unlock()

	room.Mutex.Lock()
	room.Clients[client.UserID] = client
	room.Mutex.Unlock()

	if isHost {
		log.Printf("WS: Host %s joined room %s", client.Name, roomId)

		type Peer struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		}
		var approvedPeers []Peer
		var pendingRequests []Peer

		room.Mutex.Lock()
		for _, existingClient := range room.Clients {
			if existingClient.UserID != client.UserID {
				if existingClient.Approved {
					approvedPeers = append(approvedPeers, Peer{ID: existingClient.UserID, Name: existingClient.Name})

					// Notify existing approved client that host joined
					joinNotify := WebSocketMessage{
						Type:       "peer-joined",
						SenderID:   client.UserID,
						SenderName: client.Name,
						Name:       client.Name,
					}
					notifyBytes, _ := json.Marshal(joinNotify)
					existingClient.Conn.WriteMessage(websocket.TextMessage, notifyBytes)
				} else {
					pendingRequests = append(pendingRequests, Peer{ID: existingClient.UserID, Name: existingClient.Name})
				}
			}
		}
		room.Mutex.Unlock()

		// Send approved peers to host
		peersListMsg := WebSocketMessage{
			Type:  "room-users",
			Users: approvedPeers,
		}
		peersBytes, _ := json.Marshal(peersListMsg)
		client.Conn.WriteMessage(websocket.TextMessage, peersBytes)

		// Notify host about any pending join requests
		for _, pending := range pendingRequests {
			reqMsg := WebSocketMessage{
				Type:     "join-request",
				UserID:   pending.ID,
				Name:     pending.Name,
				SenderID: pending.ID,
			}
			reqBytes, _ := json.Marshal(reqMsg)
			client.Conn.WriteMessage(websocket.TextMessage, reqBytes)
		}
	} else {
		log.Printf("WS: Candidate/Guest %s joined room %s. Awaiting approval.", client.Name, roomId)

		// Send waiting response to newcomer
		waitingMsg := WebSocketMessage{
			Type: "awaiting-approval",
		}
		waitingBytes, _ := json.Marshal(waitingMsg)
		client.Conn.WriteMessage(websocket.TextMessage, waitingBytes)

		// Send join request to host(s)
		room.Mutex.Lock()
		for _, existingClient := range room.Clients {
			if existingClient.Approved && existingClient.UserID != client.UserID {
				reqMsg := WebSocketMessage{
					Type:     "join-request",
					UserID:   client.UserID,
					Name:     client.Name,
					SenderID: client.UserID,
				}
				reqBytes, _ := json.Marshal(reqMsg)
				existingClient.Conn.WriteMessage(websocket.TextMessage, reqBytes)
			}
		}
		room.Mutex.Unlock()
	}
}

// UnregisterClient removes client and alerts other participants
func (h *Hub) UnregisterClient(roomId string, userId string) {
	h.Mutex.Lock()
	room, exists := h.Rooms[roomId]
	h.Mutex.Unlock()

	if !exists {
		return
	}

	room.Mutex.Lock()
	client, clientExists := room.Clients[userId]
	wasApproved := false
	if clientExists {
		wasApproved = client.Approved
		delete(room.Clients, userId)
	}

	// If room is empty, clean it up
	if len(room.Clients) == 0 {
		h.Mutex.Lock()
		delete(h.Rooms, roomId)
		h.Mutex.Unlock()
	}
	room.Mutex.Unlock()

	if clientExists && wasApproved {
		// Notify others
		leaveNotify := WebSocketMessage{
			Type:     "peer-disconnected",
			UserID:   userId,
			SenderID: userId,
		}
		notifyBytes, _ := json.Marshal(leaveNotify)

		room.Mutex.Lock()
		for _, remainingClient := range room.Clients {
			if remainingClient.Approved {
				remainingClient.Conn.WriteMessage(websocket.TextMessage, notifyBytes)
			}
		}
		room.Mutex.Unlock()
	}
}

// HandleJoinResponse processes interviewer's approval or rejection of a client
func (h *Hub) HandleJoinResponse(roomId string, targetId string, status string, hostId string) {
	h.Mutex.Lock()
	room, exists := h.Rooms[roomId]
	h.Mutex.Unlock()

	if !exists {
		return
	}

	room.Mutex.Lock()
	targetClient, exists := room.Clients[targetId]
	room.Mutex.Unlock()

	if !exists {
		return
	}

	if status == "approved" {
		room.Mutex.Lock()
		targetClient.Approved = true
		room.Mutex.Unlock()

		log.Printf("WS: Client %s approved to join room %s by host %s", targetClient.Name, roomId, hostId)

		// 1. Send approval notification to target client
		approvedMsg := WebSocketMessage{
			Type: "join-approved",
		}
		approvedBytes, _ := json.Marshal(approvedMsg)
		targetClient.Conn.WriteMessage(websocket.TextMessage, approvedBytes)

		// Send current code session if it exists
		var codeSession models.CodeSession
		if err := db.DB.Where("interview_id = ?", roomId).Order("updated_at desc").First(&codeSession).Error; err == nil {
			initialCodeMsg := WebSocketMessage{
				Type:     "code-sync",
				Code:     codeSession.Code,
				Language: codeSession.Language,
			}
			if msgBytes, err := json.Marshal(initialCodeMsg); err == nil {
				targetClient.Conn.WriteMessage(websocket.TextMessage, msgBytes)
			}
		}

		// Send current whiteboard session if it exists
		var wbSession models.WhiteboardSession
		if err := db.DB.Where("interview_id = ?", roomId).First(&wbSession).Error; err == nil {
			initialWbMsg := WebSocketMessage{
				Type: "whiteboard-sync",
				Data: wbSession.Data,
			}
			if msgBytes, err := json.Marshal(initialWbMsg); err == nil {
				targetClient.Conn.WriteMessage(websocket.TextMessage, msgBytes)
			}
		}

		// 2. Notify all OTHER approved clients about this new peer
		joinNotify := WebSocketMessage{
			Type:       "peer-joined",
			SenderID:   targetClient.UserID,
			SenderName: targetClient.Name,
			Name:       targetClient.Name,
		}
		notifyBytes, _ := json.Marshal(joinNotify)

		type Peer struct {
			ID   string `json:"id"`
			Name string `json:"name"`
		}
		var approvedPeers []Peer

		room.Mutex.Lock()
		for _, c := range room.Clients {
			if c.UserID != targetClient.UserID && c.Approved {
				c.Conn.WriteMessage(websocket.TextMessage, notifyBytes)
				approvedPeers = append(approvedPeers, Peer{ID: c.UserID, Name: c.Name})
			}
		}
		room.Mutex.Unlock()

		// 3. Send approved peers list to newly approved client
		peersListMsg := WebSocketMessage{
			Type:  "room-users",
			Users: approvedPeers,
		}
		peersBytes, _ := json.Marshal(peersListMsg)
		targetClient.Conn.WriteMessage(websocket.TextMessage, peersBytes)

	} else if status == "rejected" {
		log.Printf("WS: Client %s rejected to join room %s by host %s", targetClient.Name, roomId, hostId)

		rejectedMsg := WebSocketMessage{
			Type: "join-rejected",
		}
		rejectedBytes, _ := json.Marshal(rejectedMsg)
		targetClient.Conn.WriteMessage(websocket.TextMessage, rejectedBytes)

		// Remove client and close socket
		h.UnregisterClient(roomId, targetId)
		targetClient.Conn.Close()
	}
}

// ForwardMessage routes message to target client if approved
func (h *Hub) ForwardMessage(roomId string, targetId string, msg WebSocketMessage) {
	h.Mutex.Lock()
	room, exists := h.Rooms[roomId]
	h.Mutex.Unlock()

	if !exists {
		return
	}

	room.Mutex.Lock()
	target, exists := room.Clients[targetId]
	if exists && target.Approved {
		msgBytes, err := json.Marshal(msg)
		if err == nil {
			target.Conn.WriteMessage(websocket.TextMessage, msgBytes)
		}
	}
	room.Mutex.Unlock()
}

// BroadcastMessage sends message to all approved clients in a room
func (h *Hub) BroadcastMessage(roomId string, msg WebSocketMessage) {
	h.Mutex.Lock()
	room, exists := h.Rooms[roomId]
	h.Mutex.Unlock()

	if !exists {
		return
	}

	msgBytes, err := json.Marshal(msg)
	if err != nil {
		return
	}

	room.Mutex.Lock()
	for _, client := range room.Clients {
		if client.Approved {
			client.Conn.WriteMessage(websocket.TextMessage, msgBytes)
		}
	}
	room.Mutex.Unlock()
}

// BroadcastMessageExcept sends message to all approved clients except the excluded one
func (h *Hub) BroadcastMessageExcept(roomId string, excludedUserId string, msg WebSocketMessage) {
	h.Mutex.Lock()
	room, exists := h.Rooms[roomId]
	h.Mutex.Unlock()

	if !exists {
		return
	}

	msgBytes, err := json.Marshal(msg)
	if err != nil {
		return
	}

	room.Mutex.Lock()
	for _, client := range room.Clients {
		if client.UserID != excludedUserId && client.Approved {
			client.Conn.WriteMessage(websocket.TextMessage, msgBytes)
		}
	}
	room.Mutex.Unlock()
}
