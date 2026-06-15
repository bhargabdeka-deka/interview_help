package utils

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"interviewos/internal/models"
)

var jwtSecret string

// init validates JWT_SECRET on package load
func init() {
	jwtSecret = os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("CRITICAL: JWT_SECRET environment variable must be set. Refusing to start.")
	}
	if len(jwtSecret) < 32 {
		log.Fatal("CRITICAL: JWT_SECRET must be at least 32 characters long for security.")
	}
}

// GetJWTSecret returns the validated JWT secret
func GetJWTSecret() string {
	return jwtSecret
}

func GenerateToken(user *models.User) (string, error) {
	claims := jwt.MapClaims{
		"id":    user.ID,
		"email": user.Email,
		"name":  user.Name,
		"role":  user.Role,
		"exp":   time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	tokenString, err := token.SignedString([]byte(jwtSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

func VerifyToken(tokenString string) (jwt.MapClaims, error) {

	token, err := jwt.ParseWithClaims(tokenString, jwt.MapClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(jwtSecret), nil
	})

	if err != nil {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return claims, nil
}
