# Event Tracker - Complete Deployment Guide

## Overview
- **Frontend:** Vercel (React + Vite)
- **Backend:** Render (Node.js + Express)
- **Database:** Render PostgreSQL

---

## **PART 1: BACKEND DEPLOYMENT (RENDER)**

### Step 1.1: Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Authorize your GitHub account

### Step 1.2: Create PostgreSQL Database
1. In Render dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `event-tracker-db`
   - **Database:** `event_tracker`
   - **User:** `postgres`
   - **Region:** Choose closest to you
   - **Plan:** Free
3. Click **"Create Database"**
4. Wait 2-3 minutes for creation
5. Copy the **Internal Database URL** (looks like: `postgresql://user:pass@host:port/db`)
6. Save it for later

### Step 1.3: Create Web Service (Backend)
1. In Render dashboard, click **"New +"** → **"Web Service"**
2. **Connect Repository:**
   - Select: `rohithgowda18/Event-Tracker`
   - Click **"Connect"**
3. **Configure Web Service:**
   - **Name:** `event-tracker-api`
   - **Environment:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `node dist/index.js`
   - **Plan:** Free
4. **Add Environment Variables:**
   - Click **"Add Environment Variable"**
   - Add each variable exactly as shown in `.env.render`:
     
     | Key | Value |
     |-----|-------|
     | `NODE_ENV` | `production` |
     | `PORT` | `3000` |
     | `DATABASE_URL` | Paste the PostgreSQL Internal URL from Step 1.2 |
     | `JWT_SECRET` | `eventtracker_super_secret_123456` |
     | `VITE_APP_ID` | `event-tracker-app` |
     | `VITE_OAUTH_PORTAL_URL` | `https://event-tracker-api.onrender.com` |
     | `OAUTH_SERVER_URL` | `https://event-tracker-api.onrender.com` |
     
   **Reference:** See `.env.render` file in your GitHub repo for exact format.

5. Click **"Create Web Service"**
6. Render will auto-deploy from GitHub
7. Wait for deployment to complete (5-10 minutes)
8. Copy your **Service URL** (e.g., `https://event-tracker-api.onrender.com`)

### Step 1.4: Initialize Database
1. In Render dashboard, find your database
2. Click **"Connect"** button
3. Use the PSQL Command provided to connect
4. Run this in your database:
   ```sql
   -- Your schema will auto-create when server starts
   ```
5. The backend will create tables automatically on first run

---

## **PART 2: FRONTEND DEPLOYMENT (VERCEL)**

### Step 2.1: Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize your GitHub account

### Step 2.2: Import Project
1. In Vercel dashboard, click **"Add New"** → **"Project"**
2. **Import Git Repository:**
   - Select: `rohithgowda18/Event-Tracker`
   - Click **"Import"**

### Step 2.3: Configure Project
1. **Framework Preset:** Select **"Vite"**
2. **Root Directory:** Click **"Edit"** → select **`./client`**
3. **Build Command:** Keep as `npm run build`
4. **Output Directory:** Keep as `dist`
5. **Environment Variables:**
   - Add: `VITE_API_URL` = `https://event-tracker-api.onrender.com/api`
   (Replace with your actual Render backend URL)

### Step 2.4: Deploy
1. Click **"Deploy"**
2. Wait for build to complete (3-5 minutes)
3. You'll get a deployment URL like: `https://event-tracker.vercel.app`
4. Copy this URL

### Step 2.5: Update Backend with Frontend URL
1. Go back to Render dashboard
2. Select your `event-tracker-api` web service
3. Go to **"Environment"**
4. Update `VITE_OAUTH_PORTAL_URL` to your Vercel frontend URL
5. Update `OAUTH_SERVER_URL` to your Vercel frontend URL
6. Click **"Save"** (this auto-redeploys)

---

## **PART 3: VERIFY DEPLOYMENT**

### 3.1: Test Backend
```bash
curl https://event-tracker-api.onrender.com/api/health
```
Should return a response (no error).

### 3.2: Test Frontend
1. Open https://event-tracker.vercel.app in browser
2. You should see the login page
3. Try logging in

### 3.3: Check Database Connection
1. Go to Render backend logs
2. Look for "Database connected successfully"
3. If error, check DATABASE_URL variable

---

## **TROUBLESHOOTING**

### **Backend won't deploy**
- Check logs in Render dashboard
- Ensure all environment variables are set
- Verify GitHub connection is active

### **Frontend can't reach backend**
- Check VITE_API_URL in Vercel environment variables
- Make sure it matches your Render API URL
- Check browser console for CORS errors

### **Database connection fails**
- Verify DATABASE_URL is correct
- Check PostgreSQL is running
- Ensure IP allowlist permits your server

### **"Service not working on reloads"**
- Update API_BASE_URL in code if needed
- Check Render free tier cold starts (can be slow)

---

## **IMPORTANT NOTES**

- **Free Tiers:** Both Vercel and Render free tiers have limitations:
  - Render: Services spin down after 15 mins without traffic
  - Vercel: 6 GiB of bandwidth/month limit
  
- **Cold Starts:** Render free tier gets slow first request after idle. Upgrade to $7/month if needed.

- **Database:** Render free PostgreSQL automatically deletes after 90 days of inactivity.

- **Scaling:** As you grow, upgrade both services to paid plans.

---

## **QUICK REFERENCE**

| Service | Plan | Cost | URL Pattern |
|---------|------|------|-------------|
| Vercel | Free | $0 | `https://xxx.vercel.app` |
| Render Backend | Free | $0 | `https://xxx.onrender.com` |
| Render Database | Free | $0 | Included with backend |

---

## **NEXT STEPS**

1. ✅ Create Render account
2. ✅ Deploy PostgreSQL on Render
3. ✅ Deploy backend on Render
4. ✅ Create Vercel account
5. ✅ Deploy frontend on Vercel
6. ✅ Update environment variables
7. ✅ Test both services
8. ✅ Set up custom domain (optional)

---

## **ENVIRONMENT VARIABLES SUMMARY**

### Render Backend:
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:pass@host:port/db
JWT_SECRET=your-32-char-random-string
VITE_APP_ID=event-tracker-app
VITE_OAUTH_PORTAL_URL=https://event-tracker.vercel.app
OAUTH_SERVER_URL=https://event-tracker.vercel.app
```

### Vercel Frontend:
```
VITE_API_URL=https://event-tracker-api.onrender.com/api
```

---

**Ready to deploy? Start with Step 1.1!** 🚀
