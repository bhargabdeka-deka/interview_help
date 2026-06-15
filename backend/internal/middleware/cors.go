package middleware

import (
	"os"
	"strings"

	"github.com/gofiber/fiber/v2"
)

// CORSMiddleware handles CORS with whitelist instead of allowing all origins
func CORSMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		origin := c.Get("Origin")
		allowedOriginsStr := os.Getenv("ALLOWED_ORIGINS")

		// Default allowed origins for development
		if allowedOriginsStr == "" {
			allowedOriginsStr = "http://localhost:3000,http://localhost:3001,http://localhost:3002,http://127.0.0.1:3000"
		}

		allowedOrigins := strings.Split(allowedOriginsStr, ",")

		// Check if origin is allowed
		isAllowed := false
		for _, allowed := range allowedOrigins {
			if strings.TrimSpace(allowed) == origin {
				isAllowed = true
				break
			}
		}

		if isAllowed {
			c.Set("Access-Control-Allow-Origin", origin)
		}

		c.Set("Access-Control-Allow-Credentials", "true")
		c.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
		c.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		c.Set("Access-Control-Max-Age", "86400")

		// Handle preflight requests
		if c.Method() == "OPTIONS" {
			return c.SendStatus(200)
		}

		return c.Next()
	}
}
