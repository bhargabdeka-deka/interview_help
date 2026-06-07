# InterviewOS

Lightweight interview platform (frontend: Next.js, backend: Go/Fiber).

This repository contains the InterviewOS frontend and backend and a Docker Compose setup to run everything locally.

**Contents**
- `frontend/` — Next.js 14 (TypeScript) app
- `backend/` — Go (Fiber) API server
- `docker-compose.yml` — development compose stack

## Prerequisites

- Docker & Docker Compose (recommended)
- Or: Go 1.21+, Node 18+, npm

## Quick (recommended) — Run with Docker Compose

1. Copy or set required environment variables (see `docker-compose.yml` and `backend/.env.example` if present).
2. From repository root run:

```bash
docker-compose up --build
```

The frontend will be available at http://localhost:3000 and the backend at http://localhost:8080 (see compose file for ports).

Stop the stack with:

```bash
docker-compose down
```

## Manual (no Docker)

Backend (Go):

1. Create a `.env` file in `backend/` with the required variables (example keys shown below).
2. From `backend/`:

```bash
# install modules
cd backend
go mod download
# run
go run main.go
```

Frontend (Next.js):

1. From `frontend/` install deps and start:

```bash
cd frontend
npm install
npm run dev
```

2. Open http://localhost:3000

## Environment variables (examples)

Backend (`backend/.env`):

```
DATABASE_URL=postgres://user:pass@localhost:5432/interviewos
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret
OPENAI_API_KEY=your_openai_key
PORT=8080
ENV=development
```

Frontend (`frontend/.env.local` or your environment):

```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

## Database migrations

Migrations are in `backend/migrations/`. Run your preferred migration tool or run the SQL files against your Postgres instance before starting the backend.

## Cleaning before publishing

This repo already includes a `.gitignore`. Remove local-only files (`node_modules`, build outputs, `.env`) before pushing to GitHub. Use the provided `.gitignore` patterns.

## Troubleshooting

- If ports are in use, change them in `docker-compose.yml`.
- Check backend health: `http://localhost:8080/health`
- Check Docker Compose logs:

```bash
docker-compose logs -f
```

## Contributing

1. Fork the repo and create a branch for your feature.
2. Open a pull request with a clear description and screenshots if applicable.

## License

See [LICENSE](LICENSE) for licensing information.

---
If you want, I can also:
- add a `backend/.env.example` file,
- update `frontend/README.md` with simplified start steps, or
- commit and create a GitHub repo and push for you (you will need to provide the remote URL).

# InterviewOS

A browser-based interview platform enabling recruiters, interviewers, and candidates to conduct secure and collaborative interviews with scheduling, WebRTC video/audio communication, and real-time code collaboration.

## 🚀 Quick Start

Get started in 2 minutes with Docker Compose:

```bash
docker-compose up
```

Then open:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080

See [QUICKSTART.md](./QUICKSTART.md) for more details.

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Development](#development)
- [Project Structure](#project-structure)
- [Getting Help](#getting-help)

## ✨ Features

- **Secure Video Interviews** - Real-time video/audio with WebRTC
- **Collaborative Code Editor** - Live code editing and sharing
- **Interview Scheduling** - Calendar-based scheduling system
- **User Authentication** - JWT-based auth with email/password
- **Real-time Communication** - WebSocket-based signaling
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Database Persistence** - PostgreSQL for data storage
- **Caching Layer** - Redis for session management

## 🛠 Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **Zustand** - State management
- **React Query** - Server state management

### Backend
- **Go 1.21+** - High-performance language
- **Fiber** - Fast web framework
- **GORM** - ORM for database
- **PostgreSQL 14+** - Relational database
- **Redis 7+** - Cache and session store
- **WebRTC** - Real-time communication

## 📦 Installation

### Prerequisites

All installation options require:
- **Git** - Version control
- **Docker & Docker Compose** (Option 1) OR
- **Node.js 18+** + **Go 1.21+** (Option 2) OR
- **Individual services** (Option 3)

### Option 1: Docker Compose (Recommended) ⭐

**Works on**: Windows, macOS, Linux

```bash
# 1. Clone or navigate to project
cd interview_help

# 2. Start all services
docker-compose up

# 3. Open in browser
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
```

**What starts automatically**:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- Backend API (port 8080)
- Frontend app (port 3000)

### Option 2: Manual Setup for Development

#### Windows (PowerShell)

```powershell
# 1. Install Prerequisites
# - Node.js: https://nodejs.org/ (LTS)
# - Go: https://golang.org/dl/
# - PostgreSQL: https://www.postgresql.org/download/windows/
# - Redis: https://github.com/microsoftarchive/redis/releases

# 2. Clone/Navigate to project
cd interview_help

# 3. Setup Environment
# Backend
cd backend
Copy-Item ".env.example" ".env"  # Edit with your credentials
go mod download

# Frontend
cd ../frontend
npm install

# 4. Start Services
# Terminal 1 - Backend
cd backend
go run main.go

# Terminal 2 - Frontend
cd frontend
npm run dev

# 5. Open Browser
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
```

#### macOS

```bash
# 1. Install Prerequisites (using Homebrew)
brew install node go postgresql redis

# 2. Start Database Services
brew services start postgresql
brew services start redis

# 3. Navigate to project
cd interview_help

# 4. Setup Backend
cd backend
cp .env.example .env
# Edit .env with your credentials
go mod download

# 5. Setup Frontend
cd ../frontend
npm install

# 6. Start Services
# Terminal 1 - Backend
cd backend
go run main.go

# Terminal 2 - Frontend
cd frontend
npm run dev

# Open Browser: http://localhost:3000
```

#### Linux (Ubuntu/Debian)

```bash
# 1. Install Prerequisites
sudo apt update
sudo apt install -y nodejs golang-go postgresql postgresql-contrib redis-server

# 2. Start Services
sudo systemctl start postgresql
sudo systemctl start redis-server

# 3. Navigate to project
cd interview_help

# 4. Setup Backend
cd backend
cp .env.example .env
# Edit .env with database credentials
go mod download

# 5. Setup Frontend
cd ../frontend
npm install

# 6. Start Services
# Terminal 1 - Backend
cd backend
go run main.go

# Terminal 2 - Frontend
cd frontend
npm run dev

# Open Browser: http://localhost:3000
```

### Option 3: Cloud Deployment

#### Deploy Frontend to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy Frontend
cd frontend
vercel

# Follow the prompts
```

#### Deploy Backend

See [SETUP.md](./SETUP.md#option-3-cloud-deployment) for AWS/Heroku/Render instructions.

## 🔧 Development

### Project Structure

```
interview_help/
├── frontend/                    # Next.js React app
│   ├── app/                    # Pages and routes
│   ├── components/             # React components
│   │   ├── CodeEditor.tsx      # Real-time code editor
│   │   ├── InterviewRoom.tsx   # WebRTC video room
│   │   └── ui/                 # Base UI components
│   ├── lib/
│   │   ├── api.ts              # API client
│   │   ├── types.ts            # TypeScript types
│   │   └── webrtc.ts           # WebRTC utilities
│   ├── store/                  # Zustand stores
│   ├── styles/                 # Global CSS
│   └── package.json
│
├── backend/                     # Go backend
│   ├── main.go                 # Entry point
│   ├── go.mod                  # Dependencies
│   ├── internal/
│   │   ├── handlers/           # HTTP handlers
│   │   ├── services/           # Business logic
│   │   ├── models/             # Data models
│   │   ├── middleware/         # Auth middleware
│   │   ├── db/                 # Database setup
│   │   └── utils/              # Utilities
│   ├── migrations/             # Database migrations
│   └── README.md               # Backend docs
│
├── docker-compose.yml          # Docker configuration
├── SETUP.md                    # Detailed setup guide
├── API.md                      # API documentation
├── ROADMAP.md                  # Feature roadmap
└── README.md                   # This file
```

### Common Development Commands

**Frontend**:
```bash
cd frontend

npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Check code quality
npm run type-check   # TypeScript checking
```

**Backend**:
```bash
cd backend

go mod download      # Download dependencies
go run main.go       # Run server
go test ./...        # Run tests
go build -o app      # Build binary
go fmt ./...         # Format code
```

**Docker**:
```bash
docker-compose up               # Start all services
docker-compose down             # Stop all services
docker-compose logs -f          # View logs
docker-compose exec postgres psql -U interviewos  # Access database
```

### Database Migrations

Migrations run automatically on backend startup. To manually create migrations:

```bash
# Create migration file in backend/migrations/
# Format: XXX_description.sql
# Example: 002_add_users_table.sql

# Backend will apply on startup
go run main.go
```

### Environment Configuration

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgres://interviewos:password@localhost:5432/interviewos
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PORT=8080
ENV=development
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Find process using port (macOS/Linux)
lsof -i :3000

# Kill process
kill -9 <PID>

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Connection Failed

1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in `backend/.env`
3. Ensure database exists: `createdb interviewos`
4. Check credentials match

### Frontend Can't Reach Backend

1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check backend is running on port 8080
3. Verify CORS settings in backend

### WebRTC Connection Issues

1. Check `NEXT_PUBLIC_WS_URL` is correct
2. Ensure firewall allows WebRTC
3. Test with another browser
4. Check browser console for errors

See [SETUP.md](./SETUP.md#troubleshooting) for more solutions.

## 📚 Documentation

- **[SETUP.md](./SETUP.md)** - Comprehensive setup guide (all platforms)
- **[QUICKSTART.md](./QUICKSTART.md)** - Get started in 2 minutes
- **[API.md](./API.md)** - Complete API reference
- **[ROADMAP.md](./ROADMAP.md)** - Feature roadmap and timeline
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history
- **[frontend/README.md](./frontend/README.md)** - Frontend-specific documentation
- **[backend/README.md](./backend/README.md)** - Backend-specific documentation

## 💻 Additional Resources

### Development Guides
- **[Makefile](./Makefile)** - Useful development commands
- **[docker-compose.yml](./docker-compose.yml)** - Local development stack
- **[.github/copilot-instructions.md](./.github/copilot-instructions.md)** - Development guidelines

### Learning Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Go Documentation](https://golang.org/doc/)
- [Fiber Framework](https://docs.gofiber.io/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Redis Docs](https://redis.io/documentation)
- [WebRTC Guide](https://webrtc.org/getting-started/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Reporting bugs
- Requesting features
- Submitting pull requests
- Code standards

## 📄 License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file for details.

## 🆘 Getting Help

### Documentation
- Check [SETUP.md](./SETUP.md) for detailed setup instructions
- Visit [API.md](./API.md) for API documentation
- Read [ROADMAP.md](./ROADMAP.md) for feature information

### Common Issues
- **Port conflicts?** → See [Troubleshooting](#troubleshooting)
- **Database issues?** → See [SETUP.md](./SETUP.md#troubleshooting)
- **WebRTC problems?** → Check firewall settings and browser console

### Community
- GitHub Issues - Report bugs and request features
- GitHub Discussions - Ask questions and discuss

## 🎯 Quick References

### First Time Setup Checklist
- [ ] Clone/navigate to project
- [ ] Choose installation method (Docker recommended)
- [ ] Run setup command
- [ ] Open http://localhost:3000
- [ ] Create test account
- [ ] Schedule a test interview

### System Requirements
| Component | Windows | macOS | Linux |
|-----------|---------|-------|-------|
| RAM | 4GB min | 4GB min | 4GB min |
| Disk Space | 2GB | 2GB | 2GB |
| Git | ✅ | ✅ | ✅ |
| Docker | ✅ | ✅ | ✅ |
| Node.js 18+ | ✅ | ✅ | ✅ |
| Go 1.21+ | ✅ | ✅ | ✅ |

### Default Ports
| Service | Port | URL |
|---------|------|-----|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 8080 | http://localhost:8080 |
| PostgreSQL | 5432 | localhost:5432 |
| Redis | 6379 | localhost:6379 |

---

**Questions?** Check [SETUP.md](./SETUP.md) or open a GitHub issue.

**Ready to contribute?** See [CONTRIBUTING.md](./CONTRIBUTING.md)!

**Want to learn more?** Check out [ROADMAP.md](./ROADMAP.md) for upcoming features.
- `POST /api/interviews` - Create interview
- `GET /api/interviews/:id` - Get interview details
- `PUT /api/interviews/:id` - Update interview
- `DELETE /api/interviews/:id` - Cancel interview

### Rooms
- `POST /api/rooms/join` - Join interview room
- `GET /api/rooms/:id` - Get room details

## WebSocket Events

### Client → Server
- `room:join` - Join interview room
- `code:update` - Update collaborative code
- `chat:message` - Send chat message
- `participant:mute` - Mute audio

### Server → Client
- `room:participant-joined` - Participant joined
- `room:participant-left` - Participant left
- `code:update` - Code updated by another participant
- `chat:new-message` - New chat message

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open a GitHub issue or contact support@interviewos.com
#   i n t e r v i e w _ O S 
 
 #   i n t e r v i e w _ O S 
 
 #   i n t e r v i e w _ O S 
 
 #   i n t e r v i e w _ h e l p  
 #   i n t e r v i e w _ h e l p  
 