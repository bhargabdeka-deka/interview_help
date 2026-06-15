# InterviewOS - Step-by-Step Public Deployment Guide

Complete guide to deploy your app for FREE to the internet in 1 hour.

---

## PREREQUISITES

Before starting, have ready:
- GitHub account with your repo pushed
- Email address for each service
- 30 minutes free time

---

## PART 1: SETUP DATABASE (Neon) - 5 minutes

### Step 1: Create Neon Account
1. Go to https://neon.tech
2. Click **"Sign Up"**
3. Choose **"Sign up with GitHub"**
4. Authorize Neon to access GitHub
5. Click **"Create project"**

### Step 2: Create PostgreSQL Database
1. Project name: `interviewos`
2. Region: Select closest to you
3. Click **"Create project"**
4. Wait 30 seconds for database to initialize

### Step 3: Get Connection String
1. Click on your project
2. Go to **"Connection"** tab
3. Select **"Connection string"**
4. Copy the string that starts with `postgresql://`
5. **Save this** — you'll need it in 5 minutes

**Example:**
```
postgresql://user:password@ec2-xx-xxx-xxx-xx.compute-1.amazonaws.com:5432/neondb
```

---

## PART 2: SETUP CACHE (Upstash) - 5 minutes

### Step 1: Create Upstash Account
1. Go to https://upstash.com
2. Click **"Start for free"**
3. Sign up with **GitHub**
4. Authorize access

### Step 2: Create Redis Database
1. Click **"Create database"**
2. Name: `interviewos-redis`
3. Region: Select closest to you (same as Neon if possible)
4. Plan: **Free** ✅
5. Click **"Create"**
6. Wait 10 seconds

### Step 3: Get Connection String
1. Click on your database
2. Go to **"Connect"** tab
3. Copy the **REST URL** (not CLI)
4. Convert to Redis format:
   - Original: `https://default:password@host:port`
   - Redis format: `redis://default:password@host:port`
5. **Save this**

**Example:**
```
redis://default:abc123@up.railway.app:6379
```

---

## PART 3: DEPLOY BACKEND (Railway) - 10 minutes

### Step 1: Create Railway Account
1. Go to https://railway.app
2. Click **"Start for free"**
3. Click **"Deploy with GitHub"**
4. Authorize Railway to access GitHub

### Step 2: Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `interviewos` repository
4. Click **"Deploy now"**
5. Wait for build (2-3 minutes)

### Step 3: Configure Environment Variables
1. Go to **"Variables"** tab
2. Click **"Add variable"**
3. Add these one by one:

```
DATABASE_URL = postgresql://user:password@ec2-xx-xxx-xxx-xx.compute-1.amazonaws.com:5432/neondb
REDIS_URL = redis://default:password@host:port
JWT_SECRET = your-super-secret-key-123456789
OPENAI_API_KEY = sk-xxxx (if you have)
PORT = 8080
ENV = production
```

4. Click **"Save"** after each

### Step 4: Get Backend URL
1. Go to **"Deployments"** tab
2. Look for the **public URL** (should say something like `https://interviewos-prod-xxx.up.railway.app`)
3. **Copy this** — you'll need it for frontend

**Example:**
```
https://interviewos-prod-xxx.up.railway.app
```

### Step 5: Test Backend
Open in browser:
```
https://your-railway-url/health
```
You should see: `{"status":"ok"}` (or similar)

---

## PART 4: DEPLOY FRONTEND (Vercel) - 10 minutes

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Click **"Continue with GitHub"**
4. Authorize Vercel

### Step 2: Import Repository
1. Click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Find your `interviewos` repository
4. Click **"Import"**

### Step 3: Configure Project
1. **Framework Preset**: Next.js ✅ (auto-detected)
2. **Root Directory**: `./frontend`
3. Click **"Deploy"**
4. Wait 3-5 minutes for build

### Step 4: Add Environment Variables
1. Go to **Settings** → **Environment Variables**
2. Add these:

```
NEXT_PUBLIC_API_URL = https://your-railway-backend-url.up.railway.app
NEXT_PUBLIC_WS_URL = wss://your-railway-backend-url.up.railway.app
```

Replace `your-railway-backend-url` with your Railway URL from Part 3

3. Click **"Save"**
4. Go to **Deployments** → Click **"Redeploy"** for latest deployment

### Step 5: Test Frontend
1. Vercel gives you a URL like: `https://interviewos-xxx.vercel.app`
2. Open in browser
3. You should see your app!

---

## PART 5: SETUP CUSTOM DOMAIN (Optional) - 10 minutes

### Option A: Free Domain (Freenom)

1. Go to https://freenom.com
2. Click **"Find a free domain"**
3. Type your domain name, e.g., `myinterviewos`
4. Select a free extension: `.tk`, `.ga`, `.ml`
5. Click **"Check Availability"**
6. Click **"Continue"** → **"Checkout"** (free)
7. Click **"Complete Order"**

### Option B: Use Railway/Vercel Subdomain (Easiest)

**For Frontend (Vercel):**
- Already have: `https://interviewos-xxx.vercel.app`
- No setup needed ✅

**For Backend (Railway):**
- Already have: `https://interviewos-prod-xxx.up.railway.app`
- No setup needed ✅

### Option C: Custom Domain with Vercel

1. Go to Vercel project **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain: `myapp.com`
4. Vercel shows DNS records to add
5. Go to your domain provider (GoDaddy, Namecheap, etc.)
6. Add those DNS records
7. Wait 24-48 hours for propagation

---

## PART 6: SETUP ELECTRON (Local) - No deployment needed

Your Electron app runs locally on user machines.

### To distribute your app:

1. **Build Electron installers:**
```bash
cd electron
npm install
npm run dist
```

2. **Upload to GitHub Releases:**
   - Go to your repo
   - Click **"Releases"**
   - Click **"Create a new release"**
   - Upload the `.exe` file from `electron/dist/`
   - Users download and run!

---

## PART 7: FINAL TESTING

### Test Everything Works Together:

1. **Open Frontend:**
   ```
   https://your-vercel-url
   ```

2. **Test Backend Connection:**
   - Open DevTools (F12)
   - Check Console for errors
   - Should connect to backend without CORS errors

3. **Test Electron Locally:**
   ```bash
   cd electron
   set ELECTRON_START_URL=https://your-vercel-url
   npm start
   ```

4. **Check Logs:**
   - **Vercel**: Settings → Analytics
   - **Railway**: Deployments → Logs
   - Look for errors, fix as needed

---

## VERIFICATION CHECKLIST

- [ ] Neon database is created and has connection string
- [ ] Upstash Redis is created and has connection string
- [ ] Railway backend is deployed and running
- [ ] Vercel frontend is deployed and running
- [ ] Frontend env vars are set with backend URL
- [ ] Frontend loads without 404 errors
- [ ] Backend responds to `/health` endpoint
- [ ] No CORS errors in browser console
- [ ] Electron app connects to backend

---

## TROUBLESHOOTING

### Frontend shows blank page
- Check browser console (F12)
- Look for CORS or 404 errors
- Verify `NEXT_PUBLIC_API_URL` is correct in Vercel

### Backend returns 502 Bad Gateway
- Check Railway logs: click deployment → view logs
- Verify `DATABASE_URL` is correct
- Verify `REDIS_URL` is correct
- Restart deployment

### Can't connect to database
- Copy `DATABASE_URL` from Neon again (make sure it's exact)
- Check for special characters that need URL encoding
- Test connection string locally first

### Redis connection fails
- Verify `REDIS_URL` format: `redis://user:pass@host:port`
- Not `https://`, must be `redis://`
- Check Upstash is in same region as Railway

### Electron can't reach backend
- Verify backend URL is accessible in browser
- Check `ELECTRON_START_URL` environment variable
- Open DevTools in Electron: Right-click → Inspect

---

## YOUR PUBLIC URLS

After deployment, you'll have:

```
Frontend:   https://your-app.vercel.app
Backend:    https://your-app.up.railway.app
Database:   neon.tech (hidden, internal)
Cache:      upstash.com (hidden, internal)
```

**Share these links with users:**
- Frontend: https://your-app.vercel.app ✅

---

## NEXT STEPS

### To keep it FREE:
- Vercel: Free tier never expires ✅
- Railway: $5/month credit (never expires) ✅
- Neon: 5GB free database ✅
- Upstash: 100k commands/month free ✅

### When you're ready to scale:
- Upgrade Railway to paid ($0.50/hour)
- Upgrade Neon database ($0.3/GB over 5GB)
- Upgrade Upstash Redis (per command)

---

## QUICK COMMAND REFERENCE

**Push code to deploy everywhere:**
```bash
git add .
git commit -m "Deploy to production"
git push origin main
```

**View Railway logs:**
```
https://railway.app → Select project → Deployments → View Logs
```

**View Vercel logs:**
```
https://vercel.com → Select project → Settings → Analytics
```

**Run Electron with production backend:**
```bash
set ELECTRON_START_URL=https://your-vercel-url
npm start
```

---

## ESTIMATED TIME

- Database setup (Neon): 5 min ✅
- Cache setup (Upstash): 5 min ✅
- Backend deploy (Railway): 10 min ✅
- Frontend deploy (Vercel): 10 min ✅
- Testing: 10 min ✅
- **Total: ~40 minutes** 🎉

---

## SUPPORT LINKS

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Neon Docs: https://neon.tech/docs
- Upstash Docs: https://upstash.com/docs

Good luck! 🚀 Let me know if you hit any issues!
