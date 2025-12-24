# 🔧 Railway Backend Start Command Error - Fix

## ❌ The Error

```
No start command was found
Railpack detected Python but can't find how to start it
```

## 🔍 The Problem

Railway is detecting Python first (because of `requirements.txt`) and trying to run it as a Python app, but your backend is a **Node.js app** that uses Python for ML modules.

## ✅ Solution

I've created multiple configuration files to ensure Railway knows this is a Node.js app:

1. ✅ Updated `backend/nixpacks.toml` - Explicitly tells Railway it's Node.js
2. ✅ Created `backend/railway.json` - Railway-specific config
3. ✅ Created `backend/Procfile` - Alternative start command format

### **Step 1: Push the Changes**

```powershell
cd "d:\fyp\system\psyche mirror"
git add backend/nixpacks.toml backend/railway.json backend/Procfile
git commit -m "Fix Railway backend start command configuration"
git push
```

### **Step 2: Set Start Command in Railway (IMPORTANT)**

Even with the config files, you should explicitly set the start command in Railway:

1. **Go to your backend service** in Railway
2. **Click "Settings"** tab
3. **Find "Start Command"** field
4. **Set it to**: `node server.js`
5. **Save**

### **Step 3: Verify Build Command**

While you're in Settings:

1. **Check "Build Command"** field
2. **Set it to**: `npm install && pip3 install -r requirements.txt || true`
3. **Save**

### **Step 4: Redeploy**

1. Railway should auto-redeploy after you push
2. Or manually trigger: Click service → "Deployments" → "Redeploy"

---

## 📋 Alternative: Use Railway UI Settings

If the config files don't work, set these directly in Railway:

### **Backend Service Settings:**

**Settings Tab:**
- **Root Directory**: `backend` ✅
- **Build Command**: `npm install && pip3 install -r requirements.txt || true`
- **Start Command**: `node server.js`

**Variables Tab:**
- `PORT=10000`
- `NODE_ENV=production`
- `DB_HOST=${{Postgres.PGHOST}}`
- `DB_PORT=${{Postgres.PGPORT}}`
- `DB_NAME=${{Postgres.PGDATABASE}}`
- `DB_USER=${{Postgres.PGUSER}}`
- `DB_PASSWORD=${{Postgres.PGPASSWORD}}`
- `JWT_SECRET=<your-secret>`
- `ENCRYPTION_KEY=<your-key>`
- `PYTHON_CMD=python3`
- `FRONTEND_URL=${{Frontend.RAILWAY_PUBLIC_DOMAIN}}`

---

## 🎯 Why This Happens

Railway's auto-detection sees:
1. `requirements.txt` → Thinks it's a Python app
2. `package.json` → Also sees Node.js
3. Gets confused and defaults to Python

**Solution**: Explicitly tell Railway it's Node.js with:
- `nixpacks.toml` with `[providers] node = true`
- `railway.json` with explicit start command
- Manual settings in Railway UI

---

## ✅ After Fixing

Your backend should:
1. ✅ Build Node.js dependencies (`npm install`)
2. ✅ Install Python dependencies (`pip3 install`)
3. ✅ Start with `node server.js`
4. ✅ Run on port 10000 (or Railway's assigned port)

---

## 🆘 Still Not Working?

1. **Check logs**: Look at the build logs to see what Railway is trying to do
2. **Verify files**: Make sure `backend/server.js` exists
3. **Check package.json**: Verify `"main": "server.js"` is correct
4. **Manual override**: Set start command directly in Railway Settings

---

**The key is explicitly setting the start command to `node server.js` in Railway's Settings!**

