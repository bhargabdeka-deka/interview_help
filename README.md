# 🎯 InterviewOS

> A modern interview platform with real-time video conferencing, collaborative coding, scheduling, live chat, and candidate management.

![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Go](https://img.shields.io/badge/Go-1.21-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![Docker](https://img.shields.io/badge/Docker-Supported-blue)

---

## 📖 Overview

InterviewOS is a full-stack interview management platform designed for recruiters, hiring managers, and candidates. It provides an all-in-one solution for conducting technical interviews with integrated video conferencing, collaborative coding environments, scheduling, and real-time communication.

The platform eliminates the need for multiple tools by bringing interview workflows into a single ecosystem.

---

## ✨ Features

### 🎥 Real-Time Video Interviews
- WebRTC-powered video conferencing
- HD audio and video support
- Multi-participant rooms
- Camera and microphone controls
- Browser-based communication

### 💻 Collaborative Code Editor
- Monaco Editor integration
- Real-time code synchronization
- Multi-language support
- Syntax highlighting
- Auto-completion
- Live code execution

### 📅 Interview Scheduling
- Schedule interviews
- Candidate invitations
- Interview reminders
- Status tracking
- Calendar integration

### 💬 Real-Time Chat
- WebSocket messaging
- Interview room chat
- Instant communication
- Message history

### 🔐 Authentication & Authorization
- JWT Authentication
- Secure Password Hashing
- Role-Based Access Control
- Protected Routes
- Session Management

### 📊 Dashboard
- Interview Analytics
- Candidate Statistics
- Interview History
- Recruiter Insights
- Performance Tracking

### 🖥 Desktop Application
- Electron Desktop Client
- Cross-platform Support
- Native Experience

---

# 🏗️ System Architecture

```text
┌──────────────────────────┐
│     Electron Desktop     │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│      Next.js Frontend    │
│  TypeScript + Tailwind   │
└─────────────┬────────────┘
              │ REST API
              ▼
┌──────────────────────────┐
│      Go Fiber Backend    │
│ Authentication & APIs    │
└──────┬────────┬──────────┘
       │        │
       ▼        ▼
┌──────────┐ ┌──────────┐
│PostgreSQL│ │  Redis   │
│ Database │ │  Cache   │
└──────────┘ └──────────┘
       │
       ▼
┌──────────────────────────┐
│     WebSocket Server     │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│      WebRTC Signaling    │
│   Video & Audio Calls    │
└──────────────────────────┘
```

---

# 📂 Project Structure

```bash
InterviewOS/
│
├── frontend/
│   ├── app/
│   │   ├── dashboard/
│   │   ├── interview/
│   │   │   └── [id]/
│   │   ├── login/
│   │   ├── register/
│   │   ├── page.tsx
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   ├── InterviewRoom.tsx
│   │   ├── CodeEditor.tsx
│   │   ├── ChatPanel.tsx
│   │   └── ui/
│   │
│   ├── hooks/
│   ├── services/
│   ├── store/
│   ├── lib/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go
│   │
│   ├── internal/
│   │   ├── auth/
│   │   ├── handlers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── websocket/
│   │   └── utils/
│   │
│   ├── migrations/
│   ├── configs/
│   ├── pkg/
│   ├── go.mod
│   └── go.sum
│
├── electron/
│   ├── main/
│   ├── preload/
│   ├── renderer/
│   └── package.json
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   ├── kubernetes/
│   └── terraform/
│
├── docs/
│   ├── API.md
│   ├── QUICK_START.md
│   ├── SETUP.md
│   ├── DEPLOYMENT.md
│   └── ROADMAP.md
│
├── scripts/
│   ├── deploy.sh
│   ├── migrate.sh
│   └── backup.sh
│
├── docker-compose.yml
├── Makefile
├── .env.example
├── .gitignore
├── LICENSE
└── README.md
```

---

# 🚀 Quick Start

## Using Docker

```bash
git clone https://github.com/yourusername/interviewos.git

cd interviewos

docker-compose up --build
```

Open:

```text
Frontend: http://localhost:3000

Backend: http://localhost:8080
```

---

## Manual Setup

### Frontend

```bash
cd frontend

npm install

npm run dev
```

### Backend

```bash
cd backend

go mod download

go run cmd/server/main.go
```

---

# ⚙️ Environment Variables

## Backend (.env)

```env
DATABASE_URL=postgres://postgres:password@localhost:5432/interviewos

REDIS_URL=redis://localhost:6379

JWT_SECRET=your-secret-key

PORT=8080
```

---

## Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8080

NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

---

# 🔧 Tech Stack

| Layer | Technology |
|---------|------------|
| Frontend | Next.js 14 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Backend | Go Fiber |
| Database | PostgreSQL |
| Cache | Redis |
| Authentication | JWT |
| Realtime | WebSocket |
| Video Calls | WebRTC |
| Code Editor | Monaco |
| Desktop | Electron |
| Containerization | Docker |
| CI/CD | GitHub Actions |

---

# 📚 API Endpoints

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/logout
```

## Interviews

```http
GET    /api/interviews
POST   /api/interviews
GET    /api/interviews/:id
PUT    /api/interviews/:id
DELETE /api/interviews/:id
```

## Rooms

```http
GET  /api/rooms/:id
POST /api/rooms/join
POST /api/rooms/leave
```

---

# 🐳 Docker Services

```yaml
Frontend
Backend
PostgreSQL
Redis
Piston
```

---

# 📈 Roadmap

### Phase 1
- User Authentication
- Interview Scheduling
- Video Interviews
- Collaborative Coding
- Live Chat

### Phase 2
- Interview Recording
- Feedback System
- Email Notifications
- Calendar Integration

### Phase 3
- AI Interview Evaluation
- ATS Integration
- Screen Sharing
- Whiteboard Support

---

# 🤝 Contributing

```bash
Fork Repository

Create Feature Branch

git checkout -b feature/new-feature

Commit Changes

git commit -m "Added new feature"

Push Branch

git push origin feature/new-feature

Create Pull Request
```

---

# 📄 License

Licensed under the MIT License.

---

# ⭐ Support

If you find this project useful:

⭐ Star the Repository

🐛 Report Issues

💡 Suggest Features

🤝 Contribute

---

<div align="center">

### Built with ❤️ for Modern Technical Interviews

</div>
