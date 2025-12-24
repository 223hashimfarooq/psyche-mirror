# 🔧 Railway Build Error - Quick Fix

## ❌ The Error You're Seeing

```
✖ Railpack could not determine how to build the app.
```

This happens because Railway is trying to build from the **root directory**, but your project has both `backend/` and `frontend/` folders.

## ✅ Solution: Set Root Directory

You need to create **separate services** for backend and frontend, each with its own **Root Directory** setting.

---

## 🚀 Step-by-Step Fix

### **Option 1: Delete Current Service and Recreate (Recommended)**

1. **In Railway Dashboard**:
   - Click on the service that's failing
   - Go to **"Settings"** tab
   - Scroll down and click **"Delete Service"**
   - Confirm deletion

2. **Create Backend Service**:
   - Click **"+ New"** in your project
   - Select **"GitHub Repo"**
   - Choose your repository: `psyche-mirror`
   - **IMPORTANT**: Before clicking "Deploy", go to **"Settings"** tab
   - Find **"Root Directory"** field
   - Set it to: `backend`
   - Click **"Deploy"**

3. **Create Frontend Service** (separate):
   - Click **"+ New"** again
   - Select **"GitHub Repo"**
   - Choose the same repository: `psyche-mirror`
   - **IMPORTANT**: Go to **"Settings"** tab
   - Set **"Root Directory"** to: `frontend`
   - Click **"Deploy"**

### **Option 2: Fix Existing Service**

1. **Go to your service** → **"Settings"** tab
2. **Find "Root Directory"** field
3. **Set it to**:
   - For backend: `backend`
   - For frontend: `frontend`
4. **Save** and Railway will redeploy

---

## 📋 Configuration Files Created

I've created `nixpacks.toml` files in both `backend/` and `frontend/` folders to help Railway understand how to build your app. These files tell Railway:

- **Backend**: Install Node.js + Python, install npm packages + pip packages, start with `npm start`
- **Frontend**: Install Node.js, build React app, serve static files

---

## ✅ Verify Settings

### Backend Service Settings:
- **Root Directory**: `backend`
- **Build Command**: (auto-detected from nixpacks.toml)
- **Start Command**: (auto-detected from nixpacks.toml)

### Frontend Service Settings:
- **Root Directory**: `frontend`
- **Build Command**: (auto-detected from nixpacks.toml)
- **Start Command**: (auto-detected from nixpacks.toml)

---

## 🔄 After Fixing

1. **Commit the new files** (nixpacks.toml files):
   ```powershell
   cd "d:\fyp\system\psyche mirror"
   git add backend/nixpacks.toml frontend/nixpacks.toml
   git commit -m "Add Railway nixpacks configuration"
   git push
   ```

2. **Railway will automatically redeploy** with the correct settings

3. **Check the build logs** - it should now work!

---

## 🆘 Still Having Issues?

### If backend still fails:
- Check that `backend/package.json` exists
- Verify `backend/server.js` exists
- Check environment variables are set

### If frontend still fails:
- Check that `frontend/package.json` exists
- Verify `frontend/public/index.html` exists
- Make sure build completes successfully

### If Python dependencies fail:
- The `nixpacks.toml` includes `|| true` so it won't fail if Python packages can't install
- You can install them manually later if needed

---

## 📝 Quick Checklist

- [ ] Root Directory set to `backend` for backend service
- [ ] Root Directory set to `frontend` for frontend service
- [ ] `nixpacks.toml` files committed and pushed
- [ ] Environment variables configured
- [ ] Build logs show successful build

---

**The key is setting the Root Directory correctly!** Railway needs to know which folder contains the service it should build.

