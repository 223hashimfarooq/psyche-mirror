# 🔧 Fix: "Unexpected token '<', "<!doctype"..." Error

## ❌ Problem

The frontend is receiving **HTML instead of JSON** from the backend. This means:
- The API request is hitting the wrong URL (404 page)
- Or the backend isn't accessible
- Or CORS is blocking the request

## ✅ Solution

### **STEP 1: Check Frontend Environment Variable**

1. **Go to Railway Dashboard** → Your **Frontend Service**
2. **Click "Variables" tab**
3. **Check if `REACT_APP_API_URL` exists**

   **If it DOESN'T exist:**
   - Click **"+ New Variable"**
   - Name: `REACT_APP_API_URL`
   - Value: `${{your-backend-service-name.RAILWAY_PUBLIC_DOMAIN}}`
   - **Replace `your-backend-service-name`** with your actual backend service name
   - Example: `${{psyche-mirror-backend.RAILWAY_PUBLIC_DOMAIN}}`

   **If it EXISTS:**
   - Click on it to edit
   - Make sure the value is: `${{your-backend-service-name.RAILWAY_PUBLIC_DOMAIN}}`
   - **DO NOT include `/api` in the URL** - the code adds it automatically
   - **DO NOT include `https://`** - Railway adds it automatically

4. **Save** - Railway will auto-redeploy

---

### **STEP 2: Verify Backend is Running**

1. **Go to Railway Dashboard** → Your **Backend Service**
2. **Click "Settings" tab**
3. **Scroll to "Networking"**
4. **Copy the Public Domain** (e.g., `https://your-backend.railway.app`)

5. **Test in browser:**
   - Visit: `https://your-backend.railway.app/api/health`
   - Should return: `{"status":"OK","message":"PsycheMirror API is running",...}`
   - If you see HTML or "Cannot GET", the backend isn't working

---

### **STEP 3: Check Backend CORS Settings**

1. **Go to Railway Dashboard** → Your **Backend Service**
2. **Click "Variables" tab**
3. **Check if `FRONTEND_URL` exists**

   **If it DOESN'T exist:**
   - Click **"+ New Variable"**
   - Name: `FRONTEND_URL`
   - Value: `${{your-frontend-service-name.RAILWAY_PUBLIC_DOMAIN}}`
   - **Replace `your-frontend-service-name`** with your actual frontend service name
   - Example: `${{psyche-mirror-frontend.RAILWAY_PUBLIC_DOMAIN}}`

4. **Save** - Railway will auto-redeploy

---

### **STEP 4: Check Browser Console**

1. **Open your frontend app** in browser
2. **Open Developer Tools** (F12)
3. **Go to "Console" tab**
4. **Look for these logs:**
   ```
   🔧 API Configuration:
     - REACT_APP_API_URL: https://your-backend.railway.app
     - API_BASE_URL: https://your-backend.railway.app/api
   ```

5. **If you see `undefined` or `http://localhost:5000/api`:**
   - The environment variable isn't set correctly
   - Go back to STEP 1

6. **Go to "Network" tab:**
   - Try to register/login
   - Look for the failed request
   - Check the **Request URL** - is it correct?
   - Check the **Response** - is it HTML or JSON?

---

### **STEP 5: Common Issues**

#### Issue 1: Environment Variable Not Set
**Symptom:** Console shows `REACT_APP_API_URL: undefined`
**Fix:** Set `REACT_APP_API_URL` in Railway frontend variables

#### Issue 2: Wrong Service Name
**Symptom:** Variable exists but URL is wrong
**Fix:** Check your backend service name in Railway and update the variable

#### Issue 3: Backend Not Running
**Symptom:** `/api/health` returns HTML or 404
**Fix:** Check backend logs in Railway, ensure it's deployed and running

#### Issue 4: CORS Error
**Symptom:** Browser console shows CORS error
**Fix:** Set `FRONTEND_URL` in backend variables (STEP 3)

---

### **STEP 6: Test After Fix**

1. **Wait for Railway to redeploy** (1-2 minutes)
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Hard refresh** (Ctrl+F5)
4. **Try to register/login again**
5. **Check browser console** for the new logs

---

## 📋 Quick Checklist

- [ ] `REACT_APP_API_URL` is set in frontend variables
- [ ] `FRONTEND_URL` is set in backend variables
- [ ] Backend `/api/health` returns JSON (not HTML)
- [ ] Browser console shows correct API URL
- [ ] Frontend has been redeployed after variable changes

---

## 🆘 Still Not Working?

1. **Check Railway logs:**
   - Backend service → Deployments → Latest → View Logs
   - Look for errors or warnings

2. **Check browser Network tab:**
   - What URL is the request going to?
   - What status code is returned?
   - What is the response body?

3. **Share the following:**
   - Backend public domain
   - Frontend public domain
   - Screenshot of frontend variables
   - Screenshot of backend variables
   - Browser console logs
   - Network tab screenshot of failed request

