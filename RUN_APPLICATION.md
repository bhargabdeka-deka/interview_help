# Running InterviewOS Application

## 🎯 Current Status

✅ **UI Design System Updated** - Applied design.md specifications  
✅ **Color Palette Updated** - Using #2563EB primary, #0F172A secondary, #22C55E accent  
✅ **Typography Configured** - Inter, Poppins, Geist fonts with code support  
✅ **Tailwind CSS Extended** - Custom component utilities (buttons, cards, badges)  
✅ **Global Styles Enhanced** - Accessibility, animations, semantic colors

## 🚀 How to Run the Application

### Option 1: Docker Compose (Recommended)

**Prerequisites**: Docker Desktop running

```bash
# Start all services
docker-compose up

# Services will start on:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:8080
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - Piston: localhost:2000
```

**To stop**:
```bash
docker-compose down
```

### Option 2: Manual Setup (Recommended for Development)

#### Step 1: Start Backend

```bash
cd backend
go mod download
go run main.go
```

Backend will run on: `http://localhost:8080`

#### Step 2: Start Frontend (New Terminal)

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on: `http://localhost:3000`

#### Step 3: Start Database Services

Make sure PostgreSQL and Redis are running:
- **PostgreSQL**: localhost:5432 (default)
- **Redis**: localhost:6379 (default)

### Option 3: Windows One-Click Start

```bash
# Double-click this file:
ONE_CLICK_START.bat
```

This will:
1. Start Docker services
2. Start frontend dev server
3. Open Electron desktop app
4. Load application at http://localhost:3000

---

## 📋 System Requirements

| Component | Requirement |
|-----------|------------|
| Node.js | 18.0+ |
| Go | 1.21+ |
| PostgreSQL | 14+ |
| Redis | 7+ |
| Docker | 20.0+ (optional) |
| RAM | 4GB minimum, 8GB recommended |
| Storage | 2GB free |

---

## 🎨 Design Updates Applied

### Color System
```css
Primary: #2563EB (Blue)
Secondary: #0F172A (Dark Blue/Slate)
Accent: #22C55E (Green)
Background: #F8FAFC (Light Gray)
Surface: #FFFFFF (White)
Text: #111827 (Dark Gray)
```

### Typography
- **Headings**: Inter, Poppins, or Geist (sans-serif)
- **Body Text**: Inter (sans-serif)
- **Code**: JetBrains Mono or Fira Code (monospace)

### Component Styles
- **Buttons**: Rounded corners with smooth hover effects
- **Cards**: Subtle shadow with border
- **Badges**: Colored backgrounds for different states
- **Code Blocks**: Dark background with light text

### Accessibility Features
- Focus visible outlines
- Semantic color tokens
- High contrast ratios
- Keyboard navigation support

---

## 🔧 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgres://interviewos:interviewos_dev@localhost:5432/interviewos
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-key
PORT=8080
ENV=development
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

---

## 📊 Application Features

### ✅ Implemented
- User authentication (JWT)
- Interview scheduling
- WebRTC video communication
- Real-time code editor (Monaco)
- Live chat
- Audio/video controls
- Dashboard with statistics
- Role-based access (admin, recruiter, interviewer, candidate)

### 🔄 In Development
- Interview recording
- Advanced code execution
- Team collaboration features
- Analytics and reporting

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Windows - Find process using port 3000
netstat -ano | findstr :3000

# Kill process
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :3000
kill -9 <PID>
```

### Database Connection Failed
1. Ensure PostgreSQL is running
2. Check DATABASE_URL in .env
3. Verify database exists: `psql -l`
4. Create if needed: `createdb interviewos`

### Frontend Can't Connect to Backend
1. Verify backend is running: `curl http://localhost:8080/health`
2. Check NEXT_PUBLIC_API_URL is correct
3. Verify CORS is enabled in backend

### Docker Issues
```bash
# Restart Docker daemon
docker-compose restart

# View logs
docker-compose logs -f

# Force rebuild
docker-compose up --build
```

---

## 📚 Useful Commands

```bash
# Frontend
cd frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Lint code
npm run type-check   # Type check

# Backend
cd backend
go run main.go       # Run server
go test ./...        # Run tests
go build            # Build binary

# Docker
docker-compose up               # Start services
docker-compose down             # Stop services
docker-compose logs -f          # View logs
docker-compose ps               # View running services
```

---

## 🎯 Next Steps

1. **Start the application** (choose one option above)
2. **Create test account**: Go to http://localhost:3000 and sign up
3. **Schedule interview**: Create test interview from dashboard
4. **Test video**: Join interview room and test WebRTC
5. **Test code execution**: Write code and click "Run"

---

## 📞 Support

- Check [README.md](./README.md) for overview
- Check [API.md](./API.md) for API documentation
- Check [SETUP.md](./SETUP.md) for detailed setup
- Check [CI_CD_FIX.md](./CI_CD_FIX.md) for GitHub Actions setup

---

## ✨ Application Ready to Run!

Your InterviewOS application is now updated with the professional design system from design.md and ready to run. Choose your preferred startup method above and enjoy! 🚀
