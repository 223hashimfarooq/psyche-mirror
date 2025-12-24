# ✅ Deployment Checklist

Use this checklist to ensure you've completed all steps for deploying your Psyche Mirror application.

## 📋 Pre-Deployment

- [ ] Code is committed to GitHub repository
- [ ] All environment variables documented
- [ ] `.gitignore` includes sensitive files (`.env`, `node_modules`, etc.)
- [ ] Frontend API URL updated to use environment variable ✅ (Already done)
- [ ] Backend CORS configured for production ✅ (Already done)

## 🗄️ Database Setup (Supabase)

- [ ] Created Supabase account
- [ ] Created new project
- [ ] Saved database credentials
- [ ] Imported database schema (`view_database.sql`)
- [ ] Tested database connection

**Database Credentials to Save:**
```
Host: db.xxxxx.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: [your password]
```

## 🔧 Backend Deployment (Render)

- [ ] Created Render account (linked with GitHub)
- [ ] Created new Web Service
- [ ] Connected GitHub repository
- [ ] Configured build settings:
  - [ ] Build Command: `cd backend && npm install`
  - [ ] Start Command: `cd backend && npm start`
- [ ] Added all environment variables:
  - [ ] `PORT=10000`
  - [ ] `NODE_ENV=production`
  - [ ] `DB_HOST` (from Supabase)
  - [ ] `DB_PORT=5432`
  - [ ] `DB_NAME=postgres`
  - [ ] `DB_USER=postgres`
  - [ ] `DB_PASSWORD` (from Supabase)
  - [ ] `JWT_SECRET` (generate a strong secret)
  - [ ] `ENCRYPTION_KEY` (32-byte hex key)
  - [ ] `PYTHON_CMD=python3`
  - [ ] `FRONTEND_URL` (your frontend URL)
- [ ] Deployment successful
- [ ] Backend URL saved: `https://your-backend.onrender.com`
- [ ] Tested health endpoint: `/api/health`

## 🎨 Frontend Deployment (Vercel)

- [ ] Created Vercel account (linked with GitHub)
- [ ] Imported GitHub repository
- [ ] Configured project:
  - [ ] Framework: Create React App
  - [ ] Root Directory: `frontend`
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `build`
- [ ] Added environment variable:
  - [ ] `REACT_APP_API_URL` (your backend URL from Render)
- [ ] Deployment successful
- [ ] Frontend URL saved: `https://your-project.vercel.app`
- [ ] Tested frontend loads correctly

## 🧪 Testing

- [ ] Frontend loads without errors
- [ ] Can register a new user
- [ ] Can login
- [ ] API calls work (check browser console)
- [ ] Database operations work
- [ ] File uploads work (if applicable)
- [ ] All features tested

## 📝 Post-Deployment

- [ ] Updated README with deployment URLs
- [ ] Shared frontend URL with team/users
- [ ] Set up monitoring (optional)
- [ ] Configured custom domain (optional)

## 🔐 Security Checklist

- [ ] Strong JWT_SECRET generated
- [ ] Strong ENCRYPTION_KEY generated
- [ ] Database password is secure
- [ ] No sensitive data in code
- [ ] Environment variables properly set
- [ ] CORS configured correctly ✅ (Already done)

## 🆘 If Something Goes Wrong

1. **Backend not connecting to database:**
   - Check database credentials
   - Verify Supabase allows external connections
   - Check Render logs

2. **Frontend can't reach backend:**
   - Verify `REACT_APP_API_URL` is set correctly
   - Check CORS settings in backend
   - Check browser console for errors

3. **Build fails:**
   - Check build logs in Vercel/Render
   - Verify all dependencies in package.json
   - Check for missing environment variables

4. **Python ML not working:**
   - Check Python version in Render
   - Verify requirements.txt is correct
   - Check build logs for Python errors

---

## 🎉 Success!

Once all items are checked, your application should be live and accessible from anywhere!

**Your URLs:**
- Frontend: `https://your-project.vercel.app`
- Backend: `https://your-backend.onrender.com`
- Database: Managed by Supabase

