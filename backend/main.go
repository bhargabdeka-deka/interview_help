package main

import (
	"log"
	"os"

	"github.com/gofiber/fiber/v2"
	"github.com/joho/godotenv"
	"github.com/gofiber/websocket/v2"
	"interviewos/internal/db"
	"interviewos/internal/handlers"
	"interviewos/internal/middleware"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize database
	if err := db.Init(); err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// Initialize Redis
	if err := db.InitRedis(); err != nil {
		log.Fatalf("Failed to initialize Redis: %v", err)
	}

	defer db.Close()
	defer db.CloseRedis()

	// Initialize Piston packages in the background
	go handlers.InitLanguages()

	// Create Fiber app
	app := fiber.New()

	// Middleware
	app.Use(middleware.CORSMiddleware())

	// Routes
	// Health check
	app.Get("/health", handlers.Health)

	// Auth routes
	authGroup := app.Group("/api/auth")
	authGroup.Post("/register", handlers.Register)
	authGroup.Post("/login", handlers.Login)
	authGroup.Post("/guest", handlers.GuestRegister)
	authGroup.Post("/logout", middleware.AuthMiddleware, handlers.Logout)
	authGroup.Get("/me", middleware.AuthMiddleware, handlers.GetMe)

	// Interview routes
	interviewGroup := app.Group("/api/interviews")
	interviewGroup.Use(middleware.AuthMiddleware)
	interviewGroup.Get("", handlers.GetInterviews)
	interviewGroup.Post("", handlers.CreateInterview)
	interviewGroup.Get("/:id", handlers.GetInterview)
	interviewGroup.Put("/:id", handlers.UpdateInterview)
	interviewGroup.Delete("/:id", handlers.DeleteInterview)
	interviewGroup.Post("/:id/run", handlers.RunCode)

	// Room routes
	roomGroup := app.Group("/api/rooms")
	roomGroup.Get("/:id", handlers.GetRoom)
	roomGroup.Post("/join", handlers.JoinRoom)
	roomGroup.Post("/:id/leave", middleware.AuthMiddleware, handlers.LeaveRoom)

	// Feedback routes
	app.Post("/api/interviews/:id/feedback", middleware.AuthMiddleware, handlers.SubmitFeedback)
	app.Get("/api/interviews/:id/feedback", middleware.AuthMiddleware, handlers.GetFeedback)
	app.Post("/api/interviews/:id/evaluation", middleware.AuthMiddleware, handlers.UpdateEvaluation)

	// WebSocket Upgrade & Signaling route
	app.Use("/ws", func(c *fiber.Ctx) error {
		if websocket.IsWebSocketUpgrade(c) {
			c.Locals("allowed", true)
			return c.Next()
		}
		return fiber.ErrUpgradeRequired
	})
	app.Get("/ws/:roomId", websocket.New(handlers.WebSocketHandler))

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Starting server on port %s", port)
	if err := app.Listen(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
