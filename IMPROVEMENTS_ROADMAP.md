# InterviewOS - Comprehensive Improvements Roadmap

## 🎯 Executive Summary

Your application has **solid core features** ✅ but needs **security hardening** and **missing endpoints** before production. Below is a prioritized roadmap with code examples.

---

## 🔴 CRITICAL (Fix Before Launch)

### 1. **Fix CORS Security Vulnerability**
**Current State:** `Access-Control-Allow-Origin: *` (opens to ANY domain)

**Impact:** Cross-site attacks possible

**File:** [backend/internal/middleware/auth.go](backend/internal/middleware/auth.go#L27)

**Fix:**
```go
// File: backend/internal/middleware/cors.go (NEW)
package middleware

import (
    "strings"
    "os"
    "github.com/gofiber/fiber/v2"
)

func CORSMiddleware() fiber.Handler {
    return func(c *fiber.Ctx) error {
        origin := c.Get("Origin")
        allowedOrigins := strings.Split(os.Getenv("ALLOWED_ORIGINS"), ",")
        
        for _, allowed := range allowedOrigins {
            if strings.TrimSpace(allowed) == origin {
                c.Set("Access-Control-Allow-Origin", origin)
                break
            }
        }
        
        c.Set("Access-Control-Allow-Credentials", "true")
        c.Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        c.Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
        
        if c.Method() == "OPTIONS" {
            return c.SendStatus(200)
        }
        
        return c.Next()
    }
}
```

**Update .env:**
```env
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com
JWT_SECRET=your-strong-secret-key-min-32-chars
```

**In main.go:**
```go
import "backend/internal/middleware"

// Replace line with hardcoded CORS
app.Use(middleware.CORSMiddleware())
```

---

### 2. **Implement Missing Evaluation Endpoint**
**Current State:** Frontend calls `/api/interviews/{id}/evaluation` but backend has no handler

**File:** [backend/internal/handlers/feedback.go](backend/internal/handlers/feedback.go#L77)

**Impact:** User feedback lost when submitting evaluation

**Fix:**
```go
// Update file: backend/internal/handlers/feedback.go

// Add at the end of the file
func UpdateInterviewStatus(c *fiber.Ctx) error {
    // Get interview ID from URL
    interviewID := c.Params("id")
    
    // Parse request body
    type Request struct {
        Status string `json:"status"`
        Rating int    `json:"rating"`
        Comment string `json:"comment"`
    }
    var req Request
    if err := c.BodyParser(&req); err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Invalid request"})
    }
    
    // Get user from JWT
    claims := c.Locals("user").(*utils.JWTClaims)
    
    // Update interview status
    var interview models.Interview
    if err := db.DB.Model(&interview).
        Where("id = ? AND host_id = ?", interviewID, claims.UserID).
        Update("status", req.Status).Error; err != nil {
        return c.Status(400).JSON(fiber.Map{"error": "Failed to update status"})
    }
    
    // Save feedback if provided
    if req.Rating > 0 {
        feedback := models.Feedback{
            InterviewID: interviewID,
            Rating:      req.Rating,
            Comment:     req.Comment,
        }
        if err := db.DB.Create(&feedback).Error; err != nil {
            return c.Status(400).JSON(fiber.Map{"error": "Failed to save feedback"})
        }
    }
    
    return c.JSON(fiber.Map{"success": true})
}

// Add route in main.go:
app.Post("/api/interviews/:id/evaluation", middleware.AuthMiddleware, handlers.UpdateInterviewStatus)
```

---

### 3. **Add WebSocket Authentication**
**Current State:** Anyone with room URL can join interview

**File:** [backend/internal/handlers/websocket.go](backend/internal/handlers/websocket.go#L81-L87)

**Impact:** Unauthorized access to sensitive video/code sessions

**Fix:**
```go
// Update file: backend/internal/handlers/websocket.go (around line 81)

func WebSocketHandler(c *fiber.Ctx) error {
    // ADD TOKEN VALIDATION
    token := c.Query("token")
    if token == "" {
        return c.Status(401).JSON(fiber.Map{"error": "Missing token"})
    }
    
    claims, err := utils.VerifyToken(token)
    if err != nil {
        return c.Status(401).JSON(fiber.Map{"error": "Invalid token"})
    }
    
    roomID := c.Params("roomID")
    
    // Verify user can access this room
    var room models.InterviewRoom
    if err := db.DB.Model(&room).
        Joins("JOIN interviews ON interviews.room_id = interview_rooms.id").
        Where("interview_rooms.id = ? AND (interviews.host_id = ? OR interviews.candidate_id = ?)", 
            roomID, claims.UserID, claims.UserID).
        First(&room).Error; err != nil {
        return c.Status(403).JSON(fiber.Map{"error": "Not authorized"})
    }
    
    // ... rest of WebSocket handler
    ws.OnClose(func() {
        // cleanup
    })
    
    return nil
}
```

---

### 4. **Enforce JWT_SECRET Environment Variable**
**Current State:** Falls back to hardcoded secret if env var missing

**File:** [backend/internal/utils/jwt.go](backend/internal/utils/jwt.go#L21-L24)

**Impact:** Production uses weak default secret

**Fix:**
```go
// Update: backend/internal/utils/jwt.go

func init() {
    secret := os.Getenv("JWT_SECRET")
    if secret == "" || len(secret) < 32 {
        log.Fatal("JWT_SECRET must be set and at least 32 characters long")
    }
    JWTSecret = secret
}
```

---

### 5. **Implement JWT Refresh Endpoint**
**Current State:** 24h token expiry, no refresh capability

**File:** [backend/internal/handlers/auth.go](backend/internal/handlers/auth.go#L140-L155)

**Impact:** Session timeout after 24h with no way to refresh

**Fix:**
```go
// Add to backend/internal/handlers/auth.go

func RefreshToken(c *fiber.Ctx) error {
    // Get user from JWT (existing token still valid)
    claims := c.Locals("user").(*utils.JWTClaims)
    
    // Generate new token
    token, err := utils.GenerateToken(claims.UserID, claims.Role)
    if err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Failed to generate token"})
    }
    
    return c.JSON(fiber.Map{
        "token":  token,
        "expires_at": time.Now().Add(24 * time.Hour).Unix(),
    })
}

// Add route in main.go:
app.Post("/api/auth/refresh", middleware.AuthMiddleware, handlers.RefreshToken)
```

---

### 6. **Add Database Foreign Key Constraints**
**Current State:** No FK constraints, orphaned records possible

**File:** [backend/migrations/001_init.sql](backend/migrations/001_init.sql#L18)

**Fix:**
```sql
-- File: backend/migrations/003_add_constraints.sql (NEW)

-- Add foreign key constraints
ALTER TABLE interview_rooms 
ADD CONSTRAINT fk_interview_rooms_interview_id 
FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE;

ALTER TABLE interviews 
ADD CONSTRAINT fk_interviews_host_id 
FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE interviews 
ADD CONSTRAINT fk_interviews_candidate_id 
FOREIGN KEY (candidate_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE feedbacks 
ADD CONSTRAINT fk_feedbacks_interview_id 
FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE;

ALTER TABLE code_sessions 
ADD CONSTRAINT fk_code_sessions_interview_id 
FOREIGN KEY (interview_id) REFERENCES interviews(id) ON DELETE CASCADE;

-- Add indexes for queries
CREATE INDEX idx_interviews_host_id ON interviews(host_id);
CREATE INDEX idx_interviews_candidate_id ON interviews(candidate_id);
CREATE INDEX idx_interviews_status ON interviews(status);
CREATE INDEX idx_feedbacks_interview_id ON feedbacks(interview_id);
```

---

## 🟠 HIGH PRIORITY (Add Before MVP)

### 7. **Add Rate Limiting**
**Impact:** Prevents brute force attacks on login

**Fix:**
```go
// File: backend/internal/middleware/limiter.go (NEW)

package middleware

import (
    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/limiter"
    "time"
)

func AuthLimiter() fiber.Handler {
    return limiter.New(limiter.Config{
        Max:        5,              // 5 requests
        Expiration: 15 * time.Minute, // per 15 minutes
        KeyGenerator: func(c *fiber.Ctx) string {
            return c.IP() // Rate limit by IP
        },
        LimitReached: func(c *fiber.Ctx) error {
            return c.Status(429).JSON(fiber.Map{
                "error": "Too many login attempts. Try again in 15 minutes",
            })
        },
    })
}
```

**In main.go:**
```go
app.Post("/api/auth/login", middleware.AuthLimiter(), handlers.Login)
app.Post("/api/auth/register", middleware.AuthLimiter(), handlers.Register)
```

---

### 8. **Add Input Validation**
**Impact:** Prevents injection attacks and data corruption

**Fix:**
```go
// File: backend/internal/utils/validation.go (NEW)

package utils

import (
    "regexp"
    "errors"
)

func ValidateEmail(email string) error {
    pattern := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
    match, _ := regexp.MatchString(pattern, email)
    if !match {
        return errors.New("invalid email format")
    }
    if len(email) > 254 {
        return errors.New("email too long")
    }
    return nil
}

func ValidatePassword(password string) error {
    if len(password) < 12 {
        return errors.New("password must be at least 12 characters")
    }
    if !regexp.MustCompile(`[A-Z]`).MatchString(password) {
        return errors.New("password must contain uppercase letter")
    }
    if !regexp.MustCompile(`[0-9]`).MatchString(password) {
        return errors.New("password must contain number")
    }
    if !regexp.MustCompile(`[!@#$%^&*]`).MatchString(password) {
        return errors.New("password must contain special character (!@#$%^&*)")
    }
    return nil
}

func ValidateString(s string, minLen, maxLen int, fieldName string) error {
    if len(s) < minLen {
        return errors.New(fieldName + " too short")
    }
    if len(s) > maxLen {
        return errors.New(fieldName + " too long")
    }
    return nil
}
```

**Use in auth.go:**
```go
// In Register handler
if err := utils.ValidatePassword(req.Password); err != nil {
    return c.Status(400).JSON(fiber.Map{"error": err.Error()})
}
```

---

### 9. **Add Security Headers Middleware**
**Impact:** Prevents XSS, clickjacking, MIME sniffing

**Fix:**
```go
// File: backend/internal/middleware/security.go (NEW)

package middleware

import "github.com/gofiber/fiber/v2"

func SecurityHeaders() fiber.Handler {
    return func(c *fiber.Ctx) error {
        // Prevent clickjacking
        c.Set("X-Frame-Options", "DENY")
        
        // Prevent MIME sniffing
        c.Set("X-Content-Type-Options", "nosniff")
        
        // Enable XSS protection
        c.Set("X-XSS-Protection", "1; mode=block")
        
        // Prevent information disclosure
        c.Set("Server", "")
        
        // CSP: Only allow scripts from same origin
        c.Set("Content-Security-Policy", "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'")
        
        return c.Next()
    }
}
```

**In main.go:**
```go
app.Use(middleware.SecurityHeaders())
```

---

### 10. **Implement Pagination for Interviews**
**Impact:** Prevents loading 100K+ interviews at once

**File:** [backend/internal/handlers/interview.go](backend/internal/handlers/interview.go#L17-L31)

**Fix:**
```go
// Update: backend/internal/handlers/interview.go - GetInterviews function

func GetInterviews(c *fiber.Ctx) error {
    limit := c.QueryInt("limit", 10)
    offset := c.QueryInt("offset", 0)
    
    // Validate limits
    if limit > 100 {
        limit = 100
    }
    if limit < 1 {
        limit = 10
    }
    if offset < 0 {
        offset = 0
    }
    
    claims := c.Locals("user").(*utils.JWTClaims)
    var interviews []models.Interview
    var total int64
    
    query := db.DB.Where("host_id = ? OR candidate_id = ?", claims.UserID, claims.UserID)
    
    // Get total count
    query.Model(&models.Interview{}).Count(&total)
    
    // Get paginated results
    if err := query.
        Preload("Host").
        Preload("Candidate").
        Limit(limit).
        Offset(offset).
        Find(&interviews).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch interviews"})
    }
    
    return c.JSON(fiber.Map{
        "data": interviews,
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": (offset + limit) < int(total),
    })
}
```

---

## 🟡 MEDIUM PRIORITY (Performance & Features)

### 11. **Implement Caching with Redis**
**Impact:** 10x faster interview list queries

**File:** [backend/internal/handlers/interview.go](backend/internal/handlers/interview.go#L17)

**Fix:**
```go
// Update: backend/internal/handlers/interview.go

import (
    "encoding/json"
    "fmt"
)

func GetInterviews(c *fiber.Ctx) error {
    claims := c.Locals("user").(*utils.JWTClaims)
    cacheKey := fmt.Sprintf("interviews:%s", claims.UserID)
    
    // Try cache first
    cached, err := db.Redis.Get(context.Background(), cacheKey).Result()
    if err == nil {
        var interviews []models.Interview
        json.Unmarshal([]byte(cached), &interviews)
        return c.JSON(interviews)
    }
    
    // Fetch from DB
    var interviews []models.Interview
    if err := db.DB.Where("host_id = ? OR candidate_id = ?", claims.UserID, claims.UserID).
        Preload("Host").
        Preload("Candidate").
        Find(&interviews).Error; err != nil {
        return c.Status(500).JSON(fiber.Map{"error": "Failed to fetch interviews"})
    }
    
    // Cache for 5 minutes
    data, _ := json.Marshal(interviews)
    db.Redis.Set(context.Background(), cacheKey, data, 5*time.Minute)
    
    return c.JSON(interviews)
}
```

---

### 12. **Add Structured Logging**
**Impact:** Better debugging and monitoring

**Fix:**
```go
// File: backend/internal/utils/logger.go (NEW)

package utils

import (
    "log/slog"
    "os"
)

func InitLogger() {
    opts := &slog.HandlerOptions{
        Level: slog.LevelInfo,
    }
    handler := slog.NewJSONHandler(os.Stdout, opts)
    logger := slog.New(handler)
    slog.SetDefault(logger)
}

func LogAuth(userID, action string) {
    slog.Info("auth event", 
        "user_id", userID, 
        "action", action,
    )
}

func LogError(msg string, err error) {
    slog.Error(msg, "error", err.Error())
}
```

**In main.go:**
```go
func init() {
    utils.InitLogger()
}

// In handlers:
utils.LogAuth(claims.UserID, "login_success")
```

---

### 13. **Add Error Boundaries in Frontend**
**Impact:** Single error doesn't crash entire app

**Fix:**
```typescript
// File: frontend/components/ErrorBoundary.tsx (NEW)

'use client';

import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 border border-red-400 rounded">
          <h2 className="font-bold text-red-800">Something went wrong</h2>
          <p className="text-red-700">{this.state.error?.message}</p>
          <button 
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
            onClick={() => this.setState({ hasError: false })}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Use in layout.tsx:**
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({ children }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
```

---

### 14. **Add Loading Skeletons**
**Impact:** Better UX while data loads

**Fix:**
```typescript
// File: frontend/components/InterviewListSkeleton.tsx (NEW)

export function InterviewListSkeleton() {
  return (
    <div className="space-y-4">
      {[1,2,3].map((i) => (
        <div key={i} className="bg-gray-200 h-24 rounded animate-pulse" />
      ))}
    </div>
  );
}
```

**Use in interviews/page.tsx:**
```typescript
import { Suspense } from 'react';
import { InterviewListSkeleton } from '@/components/InterviewListSkeleton';

export default async function InterviewsPage() {
  return (
    <Suspense fallback={<InterviewListSkeleton />}>
      <InterviewList />
    </Suspense>
  );
}
```

---

### 15. **Split Large Components**
**Impact:** InterviewRoom.tsx is 900+ lines, hard to maintain

**Fix:**
```typescript
// File: frontend/components/VideoSection.tsx (NEW)
export function VideoSection({ ...props }) {
  // Move video rendering here
}

// File: frontend/components/CodeEditor.tsx (NEW)
export function CodeEditorSection({ ...props }) {
  // Move code editor here
}

// File: frontend/components/ChatDrawer.tsx (NEW)
export function ChatDrawer({ ...props }) {
  // Move chat here
}

// Use in InterviewRoom.tsx
<VideoSection />
<CodeEditorSection />
<ChatDrawer />
```

---

## ✨ NICE TO HAVE (Post-MVP)

### 16. **Interview Recording**
- Add Pion WebRTC library for recording
- Store in S3 with encryption
- Auto-delete after 30 days

### 17. **Analytics Dashboard**
- Interview completion rate
- Average interview duration
- Candidate performance trends
- Feedback ratings over time

### 18. **Calendar Integration**
- Google Calendar sync
- Timezone handling
- Auto reminders

### 19. **Email Notifications**
- Interview scheduled email
- 30min before reminder
- Results sent after completion

### 20. **ATS Integration**
- Integrate with Greenhouse, Lever, BambooHR
- Auto-sync candidates
- Auto-post results

---

## 📊 Quick Implementation Priority Matrix

| Feature | Effort | Impact | Timeline |
|---------|--------|--------|----------|
| Fix CORS | 30 min | 🔴 CRITICAL | Now |
| JWT Refresh | 1h | 🔴 CRITICAL | Now |
| Evaluation Endpoint | 1h | 🔴 CRITICAL | Now |
| WebSocket Auth | 1h | 🔴 CRITICAL | Now |
| DB Constraints | 30 min | 🔴 CRITICAL | Now |
| Rate Limiting | 1h | 🟠 HIGH | Week 1 |
| Input Validation | 2h | 🟠 HIGH | Week 1 |
| Security Headers | 30 min | 🟠 HIGH | Week 1 |
| Pagination | 2h | 🟠 HIGH | Week 1 |
| Caching (Redis) | 3h | 🟠 HIGH | Week 2 |
| Error Boundaries | 1h | 🟡 MEDIUM | Week 2 |
| Logging | 2h | 🟡 MEDIUM | Week 2 |
| Component Split | 4h | 🟡 MEDIUM | Week 2 |
| Email Notifications | 4h | ✨ NICE | Week 3 |
| Analytics | 8h | ✨ NICE | Week 4 |

---

## 🚀 Implementation Steps

1. **This Week (Critical):**
   - [ ] Fix CORS
   - [ ] Implement JWT refresh
   - [ ] Add evaluation endpoint
   - [ ] Add WebSocket auth
   - [ ] Add DB constraints

2. **Next Week (High Priority):**
   - [ ] Add rate limiting
   - [ ] Input validation
   - [ ] Security headers
   - [ ] Pagination
   - [ ] Test everything

3. **Week 3+ (Nice to Have):**
   - [ ] Caching
   - [ ] Analytics
   - [ ] Notifications
   - [ ] Recording

---

## 💾 Backup Before Changes

```bash
# Backup database
docker exec interviewos_postgres pg_dump \
  -U interviewos \
  interviewos > backup_$(date +%Y%m%d).sql

# Backup code
git commit -am "Pre-improvements backup"
git push
```

---

## 📝 Testing Improvements

After each change:

```bash
# Test backend
cd backend
go test ./...
go vet ./...

# Test frontend
cd ../frontend
npm run lint
npm run type-check

# Manual testing
# 1. Signup with weak password (should fail)
# 2. Brute force login 10x (should rate limit)
# 3. WebSocket without token (should fail)
# 4. Test pagination with offset/limit
```

---

**Questions?** Review the code comments and update CHECKLIST.md as you complete items!
