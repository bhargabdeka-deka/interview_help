# InterviewOS

> A comprehensive interview platform with real-time video, collaborative coding, and seamless scheduling.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node.js-18+-green.svg)](https://nodejs.org/)
[![Go](https://img.shields.io/badge/go-1.21+-blue.svg)](https://golang.org/)
[![Docker](https://img.shields.io/badge/docker-supported-blue.svg)](https://www.docker.com/)

InterviewOS is a modern interview platform that enables recruiters and candidates to conduct secure, collaborative interviews with real-time video communication, live code editing, and comprehensive scheduling capabilities.

## 🚀 Quick Start

**Get up and running in 2 minutes with Docker:**

```bash
# Clone and navigate to project
git clone <repository-url>
cd interview_help

# Start all services
docker-compose up

# Open in browser
# Frontend: http://localhost:3000
# Backend API: http://localhost:8080
```

**Windows users can use the one-click starter:**
```
Double-click: ONE_CLICK_START.bat
```

## ✨ Features

### 🎥 **Real-time Video Interviews**
- WebRTC-powered peer-to-peer video communication
- Audio/video controls (mute, camera toggle)
- Multiple participants support
- Cross-platform compatibility

### 💻 **Collaborative Code Editor**
- Real-time code collaboration with Monaco Editor
- Multiple programming languages (JavaScript, Python, Go, Java, C++)
- Live code execution with Piston sandbox
- Syntax highlighting and auto-completion

### 📅 **Interview Management**
- Schedule interviews with calendar integration
- Email-based candidate invitations
- Interview status tracking (scheduled, in-progress, completed)
- Password-protected interview rooms

### 🔐 **Authentication & Security**
- JWT-based secure authentication
- Bcrypt password hashing
- Role-based access control (admin, recruiter, interviewer, candidate)
- CORS protection and SQL injection prevention

### 📊 **Dashboard & Analytics**
- Comprehensive interview dashboard
- User statistics and metrics
- Recent interview history
- Quick action buttons for common tasks

### 💬 **Real-time Communication**
- Live chat during interviews
- WebSocket-based messaging
- Message history and timestamps
- Participant presence indicators

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand
- **Real-time**: WebRTC + WebSockets
- **Code Editor**: Monaco Editor
- **UI Components**: Radix UI primitives

### Backend
- **Language**: Go 1.21+
- **Framework**: Fiber (high-performance web framework)
- **Database**: PostgreSQL with GORM ORM
- **Cache**: Redis
- **Authentication**: JWT tokens
- **WebSockets**: Gorilla WebSocket
- **Code Execution**: Piston sandbox

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 15
- **Cache**: Redis 7
- **Code Runner**: Piston (secure code execution)

## 📦 Installation Options

### Option 1: Docker Compose (Recommended) ⭐

**Prerequisites**: Docker & Docker Compose

```bash
# 1. Clone repository
git clone <repository-url>
cd interview_help

# 2. Start all services
docker-compose up

# 3. Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
```

**What starts automatically:**
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- Backend API (port 8080)
- Frontend app (port 3000)
- Piston code execution sandbox (port 2000)

### Option 2: Manual Development Setup

**Prerequisites**: Node.js 18+, Go 1.21+, PostgreSQL, Redis

#### Backend Setup
```bash
# 1. Navigate to backend
cd backend

# 2. Install dependencies
go mod download

# 3. Setup environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Start backend
go run main.go
```

#### Frontend Setup
```bash
# 1. Navigate to frontend (new terminal)
cd frontend

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.local.example .env.local
# Edit with API URLs

# 4. Start frontend
npm run dev
```

#### Database Setup
```bash
# Start PostgreSQL and Redis
# Database migrations run automatically on backend startup
```

### Option 3: Platform-Specific Setup

<details>
<summary><strong>Windows Setup</strong></summary>

```powershell
# 1. Install prerequisites
# - Node.js: https://nodejs.org/
# - Go: https://golang.org/dl/
# - PostgreSQL: https://www.postgresql.org/download/windows/
# - Redis: https://redis.io/docs/getting-started/installation/install-redis-on-windows/

# 2. Clone and setup
git clone <repository-url>
cd interview_help

# 3. Use batch files for easy startup
.\ONE_CLICK_START.bat
```
</details>

<details>
<summary><strong>macOS Setup</strong></summary>

```bash
# 1. Install prerequisites with Homebrew
brew install node go postgresql redis

# 2. Start services
brew services start postgresql
brew services start redis

# 3. Clone and setup
git clone <repository-url>
cd interview_help

# 4. Follow manual setup steps above
```
</details>

<details>
<summary><strong>Linux Setup</strong></summary>

```bash
# 1. Install prerequisites (Ubuntu/Debian)
sudo apt update
sudo apt install -y nodejs npm golang-go postgresql redis-server

# 2. Start services
sudo systemctl start postgresql redis-server

# 3. Clone and setup
git clone <repository-url>
cd interview_help

# 4. Follow manual setup steps above
```
</details>

## 🏗 Project Structure

```
interview_help/
├── 📁 frontend/                    # Next.js React application
│   ├── 📁 app/                    # App Router pages
│   │   ├── page.tsx               # Landing page
│   │   ├── layout.tsx             # Root layout
│   │   ├── login/                 # Authentication pages
│   │   ├── dashboard/             # Protected dashboard
│   │   └── interview/[id]/        # Video interview rooms
│   ├── 📁 components/             # React components
│   │   ├── InterviewRoom.tsx      # WebRTC video component
│   │   ├── CodeEditor.tsx         # Monaco code editor
│   │   └── ui/                    # Base UI components
│   ├── 📁 lib/                    # Utilities and configs
│   ├── 📁 store/                  # Zustand state management
│   └── 📄 package.json
│
├── 📁 backend/                     # Go backend services
│   ├── 📄 main.go                 # Application entry point
│   ├── 📄 go.mod                  # Go dependencies
│   ├── 📁 internal/
│   │   ├── handlers/              # HTTP route handlers
│   │   ├── models/                # Data models (GORM)
│   │   ├── middleware/            # Auth and CORS middleware
│   │   ├── db/                    # Database configuration
│   │   └── utils/                 # Utility functions
│   └── 📁 migrations/             # Database migrations
│
├── 📁 electron/                    # Desktop application
├── 📄 docker-compose.yml          # Docker services config
├── 📄 Makefile                    # Development commands
└── 📚 Documentation files
```

## 🔧 Development

### Environment Variables

**Backend** (`.env`):
```env
DATABASE_URL=postgres://interviewos:password@localhost:5432/interviewos
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-key
PORT=8080
ENV=development
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

### Common Commands

```bash
# Frontend development
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Lint code
npm run type-check   # TypeScript checking

# Backend development
cd backend
go run main.go       # Start server
go test ./...        # Run tests
go build            # Build binary
go fmt ./...        # Format code

# Docker operations
docker-compose up              # Start all services
docker-compose down            # Stop all services
docker-compose logs -f         # View logs
docker-compose restart backend # Restart specific service
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### Interview Management
- `GET /api/interviews` - List interviews
- `POST /api/interviews` - Create interview
- `GET /api/interviews/:id` - Get interview details
- `PUT /api/interviews/:id` - Update interview
- `DELETE /api/interviews/:id` - Delete interview
- `POST /api/interviews/:id/run` - Execute code

### Room Management
- `GET /api/rooms/:id` - Get room details
- `POST /api/rooms/join` - Join interview room
- `POST /api/rooms/:id/leave` - Leave room

### WebSocket Events
- `room:join` - Join interview room
- `code:sync` - Synchronize code changes
- `chat:message` - Send/receive chat messages
- `webrtc:offer/answer/ice` - WebRTC signaling

For complete API documentation, see [API.md](./API.md).

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find and kill process using port
lsof -i :3000        # macOS/Linux
netstat -ano | findstr :3000  # Windows
```

**Database connection failed:**
1. Verify PostgreSQL is running
2. Check `DATABASE_URL` in backend `.env`
3. Ensure database exists: `createdb interviewos`

**Frontend can't reach backend:**
1. Verify `NEXT_PUBLIC_API_URL` is correct
2. Check backend is running on port 8080
3. Verify CORS settings

**WebRTC connection issues:**
1. Check firewall settings
2. Verify browser permissions for camera/microphone
3. Test with different browser
4. Check browser console for errors

### Getting Help

- 📖 **Documentation**: Check [SETUP.md](./SETUP.md) for detailed setup
- 🐛 **Issues**: Report bugs on GitHub Issues
- 💬 **Discussions**: Ask questions in GitHub Discussions
- 📧 **Email**: Contact support team

## 🚀 Production Deployment

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd frontend
vercel
```

### Backend (Docker)
```bash
# Build production image
docker build -f backend/Dockerfile.prod -t interviewos-backend .

# Run with environment variables
docker run -p 8080:8080 --env-file .env.prod interviewos-backend
```

### Database (Production)
- Use managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
- Configure connection pooling
- Set up automated backups
- Enable SSL connections

See [DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md) for complete deployment guide.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** and add tests
4. **Commit changes**: `git commit -m 'Add amazing feature'`
5. **Push to branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Development Guidelines
- Follow existing code style and conventions
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting PR

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 📋 Roadmap

### Phase 1 (Current) ✅
- [x] User authentication and management
- [x] Interview scheduling and management
- [x] WebRTC video communication
- [x] Real-time collaborative code editor
- [x] Live chat functionality
- [x] Docker containerization

### Phase 2 (In Progress) 🚧
- [ ] Interview recording and playback
- [ ] Advanced code execution with multiple languages
- [ ] Interview feedback and rating system
- [ ] Email notifications and reminders
- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Mobile responsive improvements

### Phase 3 (Planned) 📋
- [ ] AI-powered interview insights
- [ ] Whiteboard and screen sharing
- [ ] Team collaboration features
- [ ] Advanced analytics and reporting
- [ ] Integration with ATS systems
- [ ] Multi-tenancy support

See [IMPROVEMENTS_ROADMAP.md](./IMPROVEMENTS_ROADMAP.md) for detailed feature roadmap.

## 🏆 Project Statistics

- **Frontend**: 30+ TypeScript files, 2000+ lines of code
- **Backend**: 15+ Go files, 800+ lines of code  
- **API Endpoints**: 14 implemented endpoints
- **Database Tables**: 5 core tables with relationships
- **UI Components**: 10+ custom React components
- **Docker Services**: 5 containerized services
- **Documentation**: 8 comprehensive guides

## 📄 Documentation

| Document | Description |
|----------|-------------|
| [README.md](./README.md) | **This file** - Project overview and setup |
| [QUICK_START.md](./QUICK_START.md) | Get started in 2 minutes |
| [SETUP.md](./SETUP.md) | Detailed setup for all platforms |
| [API.md](./API.md) | Complete API reference |
| [BUILD_SUMMARY.md](./BUILD_SUMMARY.md) | Development build summary |
| [IMPROVEMENTS_ROADMAP.md](./IMPROVEMENTS_ROADMAP.md) | Feature roadmap |
| [CONTRIBUTING.md](./CONTRIBUTING.md) | Contribution guidelines |
| [DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md) | Production deployment |

## 📞 Support

### Quick Links
- 🚀 **Quick Start**: [QUICK_START.md](./QUICK_START.md)
- 🔧 **Setup Help**: [SETUP.md](./SETUP.md)
- 🐛 **Bug Reports**: GitHub Issues
- 💬 **Questions**: GitHub Discussions
- 📧 **Email**: Create an issue for direct support

### System Requirements
| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 4GB | 8GB+ |
| **Storage** | 2GB free | 5GB+ free |
| **Node.js** | 18.0+ | 20.0+ |
| **Go** | 1.21+ | 1.21+ |
| **Docker** | 20.0+ | Latest |

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** - For the amazing React framework
- **Fiber Team** - For the high-performance Go web framework
- **Monaco Editor** - For the powerful code editor
- **WebRTC Community** - For real-time communication standards
- **Docker** - For containerization platform
- **PostgreSQL** - For reliable database system

---

<div align="center">

**Built with ❤️ for better interviews**

[⭐ Star this project](https://github.com/your-username/interview_help) • [🐛 Report Bug](https://github.com/your-username/interview_help/issues) • [💡 Request Feature](https://github.com/your-username/interview_help/issues)

</div>#   o n e - o n e - i n t e r v i e w - p l a t f o r m  
 #   o n e - o n e - i n t e r v i e w - p l a t f o r m  
 