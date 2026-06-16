package handlers

import (
	"bytes"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/gofiber/fiber/v2"
	"interviewos/internal/db"
	"interviewos/internal/models"
)

type ExecutionRequest struct {
	Language string `json:"language"`
	Code     string `json:"code"`
}

type PistonFile struct {
	Content string `json:"content"`
}

type PistonExecuteRequest struct {
	Language string       `json:"language"`
	Version  string       `json:"version"`
	Files    []PistonFile `json:"files"`
}

type PistonExecuteResponse struct {
	Language string `json:"language"`
	Version  string `json:"version"`
	Run      struct {
		Stdout   string `json:"stdout"`
		Stderr   string `json:"stderr"`
		Code     int    `json:"code"`
		Signal   string `json:"signal"`
		Output   string `json:"output"`
	} `json:"run"`
}

type PistonPackageRequest struct {
	Language string `json:"language"`
	Version  string `json:"version"`
}

// Map frontend Monaco languages to Piston identifiers
func mapLanguage(monacoLang string) (string, string) {
	switch monacoLang {
	case "javascript":
		return "node", "*"
	case "python":
		return "python", "*"
	case "go":
		return "go", "*"
	case "java":
		return "java", "*"
	case "cpp":
		return "gcc", "*"
	default:
		return monacoLang, "*"
	}
}

// RunCode proxies the execution request to the Piston container sandbox
func RunCode(c *fiber.Ctx) error {
	id := c.Params("id")
	var req ExecutionRequest
	if err := c.BodyParser(&req); err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{
			"message": "invalid request body",
			"details": err.Error(),
		})
	}

	// Basic validation
	if req.Code == "" {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"message": "code cannot be empty"})
	}

	// Verify interview exists
	var interview models.Interview
	if err := db.DB.First(&interview, "id = ?", id).Error; err != nil {
		return c.Status(fiber.StatusNotFound).JSON(fiber.Map{"message": "interview not found"})
	}

	pistonLang, version := mapLanguage(req.Language)

	pistonReq := PistonExecuteRequest{
		Language: pistonLang,
		Version:  version,
		Files: []PistonFile{{Content: req.Code}},
	}

	jsonData, err := json.Marshal(pistonReq)
	if err != nil {
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to encode execution payload",
		})
	}

	// Make call to Piston API execution endpoint with timeout
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Post("http://piston:2000/api/v2/execute", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		log.Printf("[RunCode] piston request failed: %v", err)
		return c.Status(fiber.StatusServiceUnavailable).JSON(fiber.Map{
			"message": "code execution engine is unavailable",
			"details": err.Error(),
		})
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("[RunCode] failed to read piston response: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to read sandbox output",
			"details": err.Error(),
		})
	}

	// Log raw piston response for debugging
	log.Printf("[RunCode] piston status=%d body=%s", resp.StatusCode, string(bodyBytes))

	if resp.StatusCode != http.StatusOK {
		return c.Status(resp.StatusCode).JSON(fiber.Map{
			"message": "sandbox returned error",
			"error":   string(bodyBytes),
		})
	}

	var pistonResp PistonExecuteResponse
	if err := json.Unmarshal(bodyBytes, &pistonResp); err != nil {
		log.Printf("[RunCode] failed to decode piston response: %v", err)
		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
			"message": "failed to decode execution results",
			"details": err.Error(),
		})
	}

	return c.JSON(pistonResp)
}

// InitLanguages automatically pre-installs dependencies inside Piston container on backend startup
func InitLanguages() {
	// Give Piston a few seconds to boot up first
	time.Sleep(5 * time.Second)

	languages := []string{"python", "node", "go", "java", "gcc"}
	url := "http://piston:2000/api/v2/packages"

	for _, lang := range languages {
		go func(language string) {
			retries := 5
			for i := 0; i < retries; i++ {
				reqPayload := PistonPackageRequest{
					Language: language,
					Version:  "*",
				}
				jsonData, _ := json.Marshal(reqPayload)

				resp, err := http.Post(url, "application/json", bytes.NewBuffer(jsonData))
				if err == nil {
					defer resp.Body.Close()
					if resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusConflict {
						log.Printf("[Piston] Auto-installed package %s successfully", language)
						return
					}
					// Read error body
					errBody, _ := io.ReadAll(resp.Body)
					log.Printf("[Piston] Failed installing %s: code %d, body: %s", language, resp.StatusCode, string(errBody))
				} else {
					log.Printf("[Piston] Failed connecting to container to install %s: %s (retry %d/%d)", language, err.Error(), i+1, retries)
				}
				time.Sleep(5 * time.Second)
			}
		}(lang)
	}
}
