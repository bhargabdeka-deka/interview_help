package handlers

import (
	"fmt"
	"strings"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"interviewos/internal/db"
	"interviewos/internal/models"
)

type CreateInterviewRequest struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	ScheduledAt time.Time `json:"scheduledAt"`
	Duration    int       `json:"duration"`
	CandidateID string    `json:"candidateId"`
	Type        string    `json:"type"`
}

func GetInterviews(c *fiber.Ctx) error {
	claims := c.Locals("user").(map[string]interface{})
	userId := claims["id"].(string)

	var interviews []models.Interview
	query := db.DB.Where("host_id = ? OR candidate_id = ?", userId, userId)

	if err := query.Preload("Host").Preload("Candidate").Preload("Room").Find(&interviews).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to fetch interviews",
		})
	}

	return c.JSON(interviews)
}

func GetInterview(c *fiber.Ctx) error {
	id := c.Params("id")

	var interview models.Interview
	if err := db.DB.Preload("Host").Preload("Candidate").Preload("Room").First(&interview, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "interview not found",
		})
	}

	return c.JSON(interview)
}

func CreateInterview(c *fiber.Ctx) error {
	claims := c.Locals("user").(map[string]interface{})
	userId := claims["id"].(string)

	var req CreateInterviewRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	var candidate models.User
	if strings.Contains(req.CandidateID, "@") {
		// Candidate identifier is an email; lookup or auto-create placeholder candidate
		err := db.DB.Where("email = ?", req.CandidateID).First(&candidate).Error
		if err != nil {
			candidate = models.User{
				ID:    uuid.New().String(),
				Email: req.CandidateID,
				Name:  strings.Split(req.CandidateID, "@")[0],
				Role:  "candidate",
			}
			if err := db.DB.Create(&candidate).Error; err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"message": "failed to initialize candidate record",
				})
			}
		}
	} else {
		// Candidate identifier is assumed to be a UUID
		err := db.DB.Where("id = ?", req.CandidateID).First(&candidate).Error
		if err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
				"message": "candidate user not found",
			})
		}
	}

	// Create interview
	interview := &models.Interview{
		ID:          uuid.New().String(),
		Title:       req.Title,
		Description: req.Description,
		ScheduledAt: req.ScheduledAt,
		Duration:    req.Duration,
		HostID:      userId,
		CandidateID: candidate.ID,
		Status:      "scheduled",
		Type:        func() string { if req.Type != "" { return req.Type }; return "coding" }(),
	}

	if err := db.DB.Create(interview).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to create interview",
		})
	}

	// Create room
	room := &models.InterviewRoom{
		ID:          uuid.New().String(),
		InterviewID: interview.ID,
		Password:    fmt.Sprintf("%06d", uuid.New().ID()%1000000),
		RTCToken:    uuid.New().String(),
	}

	if err := db.DB.Create(room).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to create interview room",
		})
	}

	interview.RoomID = room.ID
	db.DB.Save(interview)

	return c.Status(fiber.StatusCreated).JSON(interview)
}

func UpdateInterview(c *fiber.Ctx) error {
	id := c.Params("id")
	claims := c.Locals("user").(map[string]interface{})
	userId := claims["id"].(string)

	var interview models.Interview
	if err := db.DB.First(&interview, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "interview not found",
		})
	}

	// Check authorization
	if interview.HostID != userId {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"message": "not authorized to update this interview",
		})
	}

	var req CreateInterviewRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	interview.Title = req.Title
	interview.Description = req.Description
	interview.ScheduledAt = req.ScheduledAt
	interview.Duration = req.Duration
	if req.Type != "" {
		interview.Type = req.Type
	}

	if err := db.DB.Save(&interview).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to update interview",
		})
	}

	return c.JSON(interview)
}

func DeleteInterview(c *fiber.Ctx) error {
	id := c.Params("id")
	claims := c.Locals("user").(map[string]interface{})
	userId := claims["id"].(string)

	var interview models.Interview
	if err := db.DB.First(&interview, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "interview not found",
		})
	}

	// Check authorization
	if interview.HostID != userId {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"message": "not authorized to delete this interview",
		})
	}

	// Delete associated room
	db.DB.Delete(&models.InterviewRoom{}, "interview_id = ?", id)

	// Delete interview
	if err := db.DB.Delete(&interview).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to delete interview",
		})
	}

	return c.JSON(fiber.Map{
		"message": "interview deleted successfully",
	})
}
