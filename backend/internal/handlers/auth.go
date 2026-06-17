package handlers

import (
	"fmt"
	"net/mail"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
	"interviewos/internal/db"
	"interviewos/internal/models"
	"interviewos/internal/utils"
)

type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Name     string `json:"name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string        `json:"token"`
	User  *models.User `json:"user"`
}

func Register(c *fiber.Ctx) error {
	var req RegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	// Validate email
	_, err := mail.ParseAddress(req.Email)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid email",
		})
	}

	// Check if user exists
	var existingUser models.User
	if err := db.DB.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		if existingUser.Password != "" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{
				"message": "email already registered",
			})
		}
		// Complete registration for placeholder user
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"message": "failed to register user",
			})
		}
		existingUser.Password = string(hashedPassword)
		if req.Name != "" {
			existingUser.Name = req.Name
		}
		if err := db.DB.Save(&existingUser).Error; err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"message": "failed to register user",
			})
		}
		token, err := utils.GenerateToken(&existingUser)
		if err != nil {
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"message": "failed to generate token",
			})
		}
		existingUser.Password = ""
		return c.Status(fiber.StatusCreated).JSON(AuthResponse{
			Token: token,
			User:  &existingUser,
		})
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to register user",
		})
	}

	// Create user
	user := &models.User{
		Email:    req.Email,
		Password: string(hashedPassword),
		Name:     req.Name,
		Role:     "candidate", // default role
	}

	if err := db.DB.Create(user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to create user",
		})
	}

	// Generate token
	token, err := utils.GenerateToken(user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to generate token",
		})
	}

	// Clear password before sending response
	user.Password = ""

	return c.Status(fiber.StatusCreated).JSON(AuthResponse{
		Token: token,
		User:  user,
	})
}

func Login(c *fiber.Ctx) error {
	var req LoginRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	// Find user
	var user models.User
	if err := db.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "invalid email or password",
		})
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
			"message": "invalid email or password",
		})
	}

	// Generate token
	token, err := utils.GenerateToken(&user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to generate token",
		})
	}

	// Clear password before sending response
	user.Password = ""

	return c.JSON(AuthResponse{
		Token: token,
		User:  &user,
	})
}

func Logout(c *fiber.Ctx) error {
	// In a real application, you might invalidate the token in Redis
	return c.JSON(fiber.Map{
		"message": "logged out successfully",
	})
}

func GetMe(c *fiber.Ctx) error {
	claims := c.Locals("user").(map[string]interface{})
	userId := claims["id"].(string)

	var user models.User
	if err := db.DB.First(&user, "id = ?", userId).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{
			"message": "user not found",
		})
	}

	user.Password = ""
	return c.JSON(user)
}

type GuestRegisterRequest struct {
	Name string `json:"name"`
}

func GuestRegister(c *fiber.Ctx) error {
	var req GuestRegisterRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
		})
	}

	if req.Name == "" {
		req.Name = "Guest Candidate"
	}

	// Create temporary guest user
	guestEmail := fmt.Sprintf("guest-%s@interviewos.guest", uuid.New().String()[:8])
	user := &models.User{
		ID:    uuid.New().String(),
		Email: guestEmail,
		Name:  req.Name,
		Role:  "candidate",
	}

	if err := db.DB.Create(user).Error; err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to create guest user",
		})
	}

	token, err := utils.GenerateToken(user)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to generate token",
		})
	}

	return c.JSON(AuthResponse{
		Token: token,
		User:  user,
	})
}
