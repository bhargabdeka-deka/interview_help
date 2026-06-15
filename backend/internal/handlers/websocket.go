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
	Conn   *websocket.Conn
	UserID string
	Name   string
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

	// SECURITY: Verify user has access to this interview room
	var interview models.Interview
	if err := db.DB.Where("id = ? AND (host_id = ? OR candidate_id = ?)", roomId, userId, userId).First(&interview).Error; err != nil {
		log.Printf("WS: User %s not authorized for room %s", userId, roomId)
		c.WriteMessage(websocket.TextMessage, []byte(`{"error":"not authorized"}`))
		c.Close()
		return
	}

	client := &Client{
		Conn:   c,
		UserID: userId,
		Name:   userName,
	}

	// Add client to Hub
	RoomHub.RegisterClient(roomId, client)

	// Clean up on disconnect
	defer func() {
		RoomHub.UnregisterClient(roomId, userId)
		c.Close()
	}()

	log.Printf("WS: User %s (%s) joined room %s", userName, userId, roomId)

	// Send current code session if it exists
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
						// Create new
						session = models.CodeSession{
							InterviewID: rId,
							Code:        code,
							Language:    lang,
						}
						db.DB.Create(&session)
					} else {
						// Update existing
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
		}
	}
}

// RegisterClient adds a client to a room and notifies existing participants
func (h *Hub) RegisterClient(roomId string, client *Client) {
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
	// Notify other peers about the new client before adding it
	joinNotify := WebSocketMessage{
		Type:       "peer-joined",
		SenderID:   client.UserID,
		SenderName: client.Name,
		Name:       client.Name,
	}
	notifyBytes, _ := json.Marshal(joinNotify)

	// Also list current peers in room to the joining client so they can initiate WebRTC peers
	type Peer struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	}
	var currentPeers []Peer

	for _, existingClient := range room.Clients {
		// Notify existing
		existingClient.Conn.WriteMessage(websocket.TextMessage, notifyBytes)

		// Collect peer
		currentPeers = append(currentPeers, Peer{ID: existingClient.UserID, Name: existingClient.Name})
	}

	// Add new client
	room.Clients[client.UserID] = client
	room.Mutex.Unlock()

	// Send current peers list to newcomer
	peersListMsg := WebSocketMessage{
		Type:  "room-users",
		Users: currentPeers,
	}
	peersBytes, _ := json.Marshal(peersListMsg)
	client.Conn.WriteMessage(websocket.TextMessage, peersBytes)
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
	_, clientExists := room.Clients[userId]
	if clientExists {
		delete(room.Clients, userId)
	}

	// If room is empty, clean it up
	if len(room.Clients) == 0 {
		h.Mutex.Lock()
		delete(h.Rooms, roomId)
		h.Mutex.Unlock()
	}
	room.Mutex.Unlock()

	if clientExists {
		// Notify others
		leaveNotify := WebSocketMessage{
			Type:     "peer-disconnected",
			UserID:   userId,
			SenderID: userId,
		}
		notifyBytes, _ := json.Marshal(leaveNotify)

		room.Mutex.Lock()
		for _, remainingClient := range room.Clients {
			remainingClient.Conn.WriteMessage(websocket.TextMessage, notifyBytes)
		}
		room.Mutex.Unlock()
	}
}

// ForwardMessage routes message to target client
func (h *Hub) ForwardMessage(roomId string, targetId string, msg WebSocketMessage) {
	h.Mutex.Lock()
	room, exists := h.Rooms[roomId]
	h.Mutex.Unlock()

	if !exists {
		return
	}

	room.Mutex.Lock()
	target, exists := room.Clients[targetId]
	if exists {
		msgBytes, err := json.Marshal(msg)
		if err == nil {
			target.Conn.WriteMessage(websocket.TextMessage, msgBytes)
		}
	}
	room.Mutex.Unlock()
}

// BroadcastMessage sends message to all clients in a room
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
		client.Conn.WriteMessage(websocket.TextMessage, msgBytes)
	}
	room.Mutex.Unlock()
}

// BroadcastMessageExcept sends message to all clients in a room except the excluded client
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
		if client.UserID != excludedUserId {
			client.Conn.WriteMessage(websocket.TextMessage, msgBytes)
		}
	}
	room.Mutex.Unlock()
}
