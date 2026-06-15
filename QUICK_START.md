# InterviewOS - Quick Start Guide

## 🚀 **Fastest Way - ONE CLICK START** 

### **Double-click this file:**
```
ONE_CLICK_START.bat
```

This automatically:
1. ✅ Starts Docker backend services (postgres, redis, backend API)
2. ✅ Starts frontend dev server (http://localhost:3000)
3. ✅ Opens Electron desktop app
4. ✅ All connected and ready to use!

**No setup, no configuration. Just double-click!** 🎉

---

## Stop Everything

### **Double-click this file:**
```
STOP_ALL.bat
```

---

## 📍 What You'll See

After running `ONE_CLICK_START.bat`:

1. **Green terminal window** → Docker services starting
2. **Frontend window** → Next.js dev server (http://localhost:3000)
3. **Electron window** → Your desktop app with everything loaded ✅

You'll have:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- Database: PostgreSQL (internal)
- Cache: Redis (internal)
- Desktop App: Electron window

---

## Alternative: Manual Commands

**Terminal 1 - Docker & Backend:**
```bash
docker compose -f docker-compose.prod.yml up --build -d
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Electron App:**
```bash
cd electron
set ELECTRON_START_URL=http://localhost:3000
npm start
```

---

## ✅ Troubleshooting

### Docker containers won't start
- Make sure Docker Desktop is running
- Run: `docker ps` to verify

### Frontend not loading
- Check terminal window for "Ready in X.Xs"
- Port 3000 should show: http://localhost:3000

### Electron window doesn't appear
- Check if `npm start` succeeded
- Look for errors in Electron terminal window
- Try clicking the Electron window if it's behind others

### Port already in use
- Frontend uses port 3000 (adjust if needed)
- Backend uses port 8080
- If ports conflict, close other apps using those ports

---

## 📋 File Guide

| File | Purpose |
|------|---------|
| `ONE_CLICK_START.bat` | 🎯 **Best option - start everything** |
| `ONE_CLICK_START.ps1` | PowerShell version of one-click start |
| `STOP_ALL.bat` | Stop all Docker containers |
| `start-electron.bat` | Electron only (frontend must be running) |
| `docker-compose.prod.yml` | Production containers configuration |

---

## 🌐 URLs After Startup

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Electron | Desktop window (local) |

---

## 🐳 Docker Commands

```bash
# View all running containers
docker ps

# View logs for backend
docker compose -f docker-compose.prod.yml logs -f backend

# Stop all containers
docker compose -f docker-compose.prod.yml down

# View CPU/Memory usage
docker stats

# Restart a specific service
docker compose -f docker-compose.prod.yml restart backend
```

---

## 🚢 Deployment

When ready to deploy to production:

See: `DEPLOYMENT_STEPS.md`

---

## 🔧 Development

**Frontend changes:** Edit `frontend/` → Auto-reloads in browser  
**Backend changes:** Edit `backend/` → Restart Docker  
**Electron changes:** Edit `electron/` → Restart Electron

---

## 📚 Full Documentation

- `QUICK_START.md` - **You are here**
- `FREE_HOSTING_GUIDE.md` - Host for free online
- `DEPLOYMENT_STEPS.md` - Deploy to production
- `CI_CD_GUIDE.md` - Auto-deploy on git push
- `HOSTING_GUIDE.md` - All hosting options

---

**Ready to go?** 
👉 **Double-click `ONE_CLICK_START.bat`** 🚀

