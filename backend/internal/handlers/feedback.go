package handlers

import (
	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"interviewos/internal/db"
	"interviewos/internal/models"
)

type SubmitFeedbackRequest struct {
	Rating  int    `json:"rating"`
	Comment string `json:"comment"`
}

// SubmitFeedback creates or updates feedback for an interview
func SubmitFeedback(c *fiber.Ctx) error {
	interviewId := c.Params("id")
	claims := c.Locals("user").(map[string]interface{})
	userId := claims["id"].(string)

	// Verify interview exists and user is authorized (host/interviewer of interview)
	var interview models.Interview
	if err := db.DB.First(&interview, "id = ?", interviewId).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "interview not found",
		})
	}

	if interview.HostID != userId {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"message": "not authorized to submit feedback for this interview",
		})
	}

	var req SubmitFeedbackRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	if req.Rating < 1 || req.Rating > 5 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "rating must be between 1 and 5",
		})
	}

	// Check if feedback already exists
	var feedback models.Feedback
	err := db.DB.Where("interview_id = ?", interviewId).First(&feedback).Error
	if err == nil {
		// Update existing
		feedback.Rating = req.Rating
		feedback.Comment = req.Comment
		if err := db.DB.Save(&feedback).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"message": "failed to update feedback",
			})
		}
	} else {
		// Create new
		feedback = models.Feedback{
			ID:          uuid.New().String(),
			InterviewID: interviewId,
			Rating:      req.Rating,
			Comment:     req.Comment,
		}
		if err := db.DB.Create(&feedback).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"message": "failed to create feedback",
			})
		}
	}

	return c.JSON(feedback)
}

// GetFeedback retrieves feedback for an interview
func GetFeedback(c *fiber.Ctx) error {
	interviewId := c.Params("id")
	claims := c.Locals("user").(map[string]interface{})
	userId := claims["id"].(string)

	// Verify interview exists and user has access
	var interview models.Interview
	if err := db.DB.First(&interview, "id = ?", interviewId).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "interview not found",
		})
	}

	if interview.HostID != userId && interview.CandidateID != userId {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"message": "not authorized to view feedback for this interview",
		})
	}

	// In typical setups, candidates shouldn't see raw feedback/notes unless they are shared.
	// But let's check roles: if applicant role is candidate, restrict details if required.
	// We'll allow it for now or check if it's host.
	if claims["role"].(string) == "candidate" {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"message": "candidates cannot access interviewer feedback",
		})
	}

	var feedback models.Feedback
	if err := db.DB.Where("interview_id = ?", interviewId).First(&feedback).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "feedback not found",
		})
	}

	return c.JSON(feedback)
}

// UpdateEvaluation updates interview status and saves evaluation feedback
func UpdateEvaluation(c *fiber.Ctx) error {
	interviewID := c.Params("id")
	claims := c.Locals("user").(map[string]interface{})
	userID := claims["id"].(string)

	type EvaluationRequest struct {
		Status  string `json:"status"`
		Rating  int    `json:"rating"`
		Comment string `json:"comment"`
	}

	var req EvaluationRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	// Validate status
	validStatuses := map[string]bool{
		"scheduled":   true,
		"in-progress": true,
		"completed":   true,
		"cancelled":   true,
	}
	if !validStatuses[req.Status] {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid status. Must be: scheduled, in-progress, completed, or cancelled",
		})
	}

	// Validate rating
	if req.Rating < 0 || req.Rating > 5 {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "rating must be between 0 and 5",
		})
	}

	// Verify interview exists and user is host
	var interview models.Interview
	if err := db.DB.First(&interview, "id = ?", interviewID).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "interview not found",
		})
	}

	if interview.HostID != userID {
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"message": "only the interviewer can submit evaluation",
		})
	}

	// Update interview status
	if err := db.DB.Model(&interview).Update("status", req.Status).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to update interview status",
		})
	}

	// Save feedback if rating provided
	if req.Rating > 0 {
		feedback := models.Feedback{
			ID:          uuid.New().String(),
			InterviewID: interviewID,
			Rating:      req.Rating,
			Comment:     req.Comment,
		}

		// Check if feedback exists
		var existing models.Feedback
		err := db.DB.Where("interview_id = ?", interviewID).First(&existing).Error
		if err == nil {
			// Update existing
			existing.Rating = req.Rating
			existing.Comment = req.Comment
			if err := db.DB.Save(&existing).Error; err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"message": "failed to update feedback",
				})
			}
		} else {
			// Create new
			if err := db.DB.Create(&feedback).Error; err != nil {
				return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
					"message": "failed to save feedback",
				})
			}
		}
	}

	return c.JSON(fiber.Map{
		"success": true,
		"message": "evaluation submitted successfully",
		"interview": interview,
	})
}
