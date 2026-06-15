package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a system user
type User struct {
	ID        string    `gorm:"primaryKey" json:"id"`
	Email     string    `gorm:"uniqueIndex" json:"email"`
	Name      string    `json:"name"`
	Password  string    `json:"-"`
	Role      string    `json:"role"` // admin, recruiter, interviewer, candidate
	Avatar    *string   `json:"avatar"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = uuid.New().String()
	}
	return nil
}

// Interview represents an interview session
type Interview struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	ScheduledAt time.Time `json:"scheduledAt"`
	Duration    int       `json:"duration"` // in minutes
	RoomID      string    `json:"roomId"`
	HostID      string    `json:"hostId"`
	CandidateID string    `json:"candidateId"`
	Status      string    `json:"status"` // scheduled, in-progress, completed, cancelled
	Type        string    `json:"type"`   // coding, system-design
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	// Relations
	Host      *User          `json:"host,omitempty"`
	Candidate *User          `json:"candidate,omitempty"`
	Room      *InterviewRoom `json:"room,omitempty"`
}

func (i *Interview) BeforeCreate(tx *gorm.DB) error {
	if i.ID == "" {
		i.ID = uuid.New().String()
	}
	if i.Type == "" {
		i.Type = "coding"
	}
	return nil
}

// InterviewRoom represents a secure interview room
type InterviewRoom struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	InterviewID string    `json:"interviewId"`
	Password    string    `json:"password"`
	RTCToken    string    `json:"rtcToken"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	// Relations
	Interview *Interview `json:"interview,omitempty"`
}

func (r *InterviewRoom) BeforeCreate(tx *gorm.DB) error {
	if r.ID == "" {
		r.ID = uuid.New().String()
	}
	return nil
}

// Feedback represents interview feedback
type Feedback struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	InterviewID string    `json:"interviewId"`
	Rating      int       `json:"rating"` // 1-5
	Comment     string    `json:"comment"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`

	// Relations
	Interview *Interview `json:"interview,omitempty"`
}

func (f *Feedback) BeforeCreate(tx *gorm.DB) error {
	if f.ID == "" {
		f.ID = uuid.New().String()
	}
	return nil
}

// CodeSession represents a collaborative coding session
type CodeSession struct {
	ID          string    `gorm:"primaryKey" json:"id"`
	InterviewID string    `json:"interviewId"`
	Language    string    `json:"language"`
	Code        string    `json:"code"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func (c *CodeSession) BeforeCreate(tx *gorm.DB) error {
	if c.ID == "" {
		c.ID = uuid.New().String()
	}
	return nil
}
