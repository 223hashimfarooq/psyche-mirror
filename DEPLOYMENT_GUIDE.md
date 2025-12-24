# 🚀 Free Deployment Guide for Psyche Mirror

This guide will help you deploy your project completely free using various free-tier hosting services.

## 📋 Overview

Your project consists of:
- **Frontend**: React app (port 3000)
- **Backend**: Node.js/Express API (port 5000)
- **Database**: PostgreSQL
- **Python ML**: TensorFlow, OpenCV, etc.

## 🎯 Recommended Free Hosting Stack

### Option 1: Easiest Setup (Recommended for Beginners)
- **Frontend**: Vercel (Free, unlimited)
- **Backend**: Render (Free tier: 750 hours/month)
- **Database**: Supabase (Free tier: 500MB)
- **Python ML**: Render (same as backend)

### Option 2: Alternative Stack
- **Frontend**: Netlify (Free tier)
- **Backend**: Railway (Free tier: $5 credit/month)
- **Database**: Neon (Free tier: 0.5GB)
- **Python ML**: Railway (same as backend)

---

## 🚀 Step-by-Step Deployment

### **STEP 1: Prepare Your Code for Deployment**

#### 1.1 Create a `.gitignore` file (if not exists)
Make sure these are ignored:
```
node_modules/
.env
.env.local
*.log
.DS_Store
build/
dist/
uploads/
temp/
```

#### 1.2 Update Frontend API Configuration
✅ **Already Done!** Your frontend has been updated to use environment variables. It will automatically use `REACT_APP_API_URL` in production and fallback to `localhost:5000` for development.

#### 1.3 Prepare Environment Variables
Create a list of all environment variables you need:
- Backend: PORT, DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD, JWT_SECRET, ENCRYPTION_KEY
- Frontend: REACT_APP_API_URL (your backend URL)

---

### **STEP 2: Deploy Database (Supabase - FREE)**

1. **Sign up**: Go to [supabase.com](https://supabase.com) and create a free account

2. **Create a new project**:
   - Click "New Project"
   - Name: `psyche-mirror`
   - Database Password: (save this!)
   - Region: Choose closest to you
   - Click "Create new project"

3. **Get Database Credentials**:
   - Go to Project Settings → Database
   - Copy these values:
     - Host: `db.xxxxx.supabase.co`
     - Port: `5432`
     - Database: `postgres`
     - User: `postgres`
     - Password: (the one you set)
     - Connection String: `postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres`

4. **Run your SQL schema**:
   - Go to SQL Editor in Supabase
   - Paste your `view_database.sql` content
   - Click "Run"

---

### **STEP 3: Deploy Backend (Render - FREE)**

1. **Sign up**: Go to [render.com](https://render.com) and sign up with GitHub

2. **Create a new Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository: `psyche-mirror`

3. **Configure the service**:
   ```
   Name: psyche-mirror-backend
   Environment: Node
   Build Command: cd backend && npm install
   Start Command: cd backend && npm start
   Root Directory: (leave empty)
   ```

4. **Set Environment Variables**:
   Click "Environment" tab and add:
   ```
   PORT=10000
   NODE_ENV=production
   DB_HOST=db.xxxxx.supabase.co
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres
   DB_PASSWORD=your_supabase_password
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   ENCRYPTION_KEY=your-32-byte-hex-encryption-key
   PYTHON_CMD=python3
   ```

5. **Important for Python ML**:
   - Render supports Python, but you need to install dependencies
   - Add a `build.sh` script in your backend folder:
   ```bash
   #!/bin/bash
   cd backend
   npm install
   pip3 install -r requirements.txt
   ```

6. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Copy your backend URL: `https://psyche-mirror-backend.onrender.com`

**Note**: Free tier on Render spins down after 15 minutes of inactivity. First request may take 30-60 seconds.

---

### **STEP 4: Deploy Frontend (Vercel - FREE)**

1. **Sign up**: Go to [vercel.com](https://vercel.com) and sign up with GitHub

2. **Import your project**:
   - Click "Add New" → "Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure the project**:
   ```
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   ```

4. **Set Environment Variables**:
   Click "Environment Variables" and add:
   ```
   REACT_APP_API_URL=https://psyche-mirror-backend.onrender.com
   ```

5. **Deploy**:
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app will be live at: `https://your-project.vercel.app`

---

### **STEP 5: Update Frontend API Configuration**

✅ **Already Done!** Your frontend API configuration has been updated to use environment variables. 

**What you need to do:**
1. When deploying on Vercel, add the environment variable:
   - `REACT_APP_API_URL=https://your-backend-url.onrender.com`
2. Vercel will automatically rebuild with the new API URL
3. No code changes needed!

---

## 🔧 Additional Configuration

### CORS Configuration
✅ **Already Done!** Your backend CORS has been configured to:
- Allow requests from `localhost:3000` (development)
- Allow requests from `FRONTEND_URL` environment variable (production)
- Support Vercel and Netlify URLs automatically
- Allow all origins in development mode for easier testing

**What you need to do:**
- Add `FRONTEND_URL=https://your-project.vercel.app` to your Render environment variables

### File Uploads
If you have file uploads, you might need cloud storage:
- **Free option**: Cloudinary (free tier: 25GB storage)
- Or use Supabase Storage (free tier: 1GB)

---

## 🎯 Alternative: All-in-One Solution (Railway)

If you want everything in one place:

1. **Sign up**: [railway.app](https://railway.app) (free $5 credit/month)

2. **Create a new project**:
   - Click "New Project"
   - Deploy from GitHub repo

3. **Add services**:
   - **PostgreSQL**: Click "New" → "Database" → "Add PostgreSQL"
   - **Backend**: Click "New" → "GitHub Repo" → Select backend folder
   - **Frontend**: Click "New" → "GitHub Repo" → Select frontend folder

4. **Configure each service** with environment variables

5. **Get URLs** and update frontend API URL

---

## 📝 Quick Checklist

- [ ] Database deployed (Supabase)
- [ ] Backend deployed (Render/Railway)
- [ ] Frontend deployed (Vercel/Netlify)
- [ ] Environment variables configured
- [ ] Frontend API URL updated
- [ ] CORS configured
- [ ] Database schema imported
- [ ] Test the deployed application

---

## 🆘 Troubleshooting

### Backend not connecting to database
- Check database credentials in environment variables
- Ensure database allows external connections (Supabase does by default)
- Check firewall/network settings

### Frontend can't reach backend
- Verify CORS settings in backend
- Check backend URL in frontend environment variables
- Ensure backend is running (Render free tier spins down)

### Python ML modules not working
- Ensure Python dependencies are installed in build script
- Check Python version (Render uses Python 3.9+)
- Verify file paths are correct in production

### Slow first request (Render)
- This is normal on free tier (cold start)
- Consider upgrading to paid tier or use Railway

---

## 💡 Tips for Free Tier

1. **Render**: Free tier spins down after 15 min inactivity
   - Solution: Use a cron job to ping your backend every 10 minutes
   - Or upgrade to paid ($7/month)

2. **Database limits**: 
   - Supabase: 500MB free
   - Monitor usage in dashboard

3. **Build time limits**:
   - Vercel: 45 minutes
   - Render: 90 minutes
   - If builds fail, optimize dependencies

4. **Auto-deployment**:
   - Connect GitHub for automatic deployments
   - Every push to main branch = new deployment

---

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [Render Documentation](https://render.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Railway Documentation](https://docs.railway.app)

---

## 🎉 You're Done!

Once deployed, you can access your app from anywhere in the world! Share the frontend URL with anyone.

**Your URLs will look like:**
- Frontend: `https://psyche-mirror.vercel.app`
- Backend: `https://psyche-mirror-backend.onrender.com`
- Database: Managed by Supabase

---

**Need help?** Check the troubleshooting section or the hosting provider's documentation.

