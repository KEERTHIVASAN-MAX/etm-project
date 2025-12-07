# 🚀 DEPLOYMENT GUIDE - Ready to Deploy!

## ✅ Issue Fixed!

**The Problem:** Your `layout.tsx` had `viewport` inside the `metadata` export, which Next.js 15+ doesn't support. This has been fixed!

**Build Status:** ✅ Working (Exit code: 0)

---

## 📋 Pre-Deployment Checklist

Before deploying, make sure you have these Firebase environment variables from your Firebase Console:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **Spinz Soda**
3. Click **⚙️ Settings** → **Project Settings**
4. Scroll down to **"Your apps"** → Select your web app
5. Copy these values:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

---

## 🚀 DEPLOYMENT METHODS

### Method 1: GitHub Integration (Recommended) ✨

**Best for:** Automatic deployments on every push

1. **Create GitHub Repository:**
   ```powershell
   git init
   git add .
   git commit -m "Initial commit - ready for deployment"
   ```

2. **Push to GitHub:**
   - Go to [GitHub](https://github.com/new)
   - Create new repository: `spinz-soda-app`
   - Run these commands:
   ```powershell
   git remote add origin https://github.com/YOUR-USERNAME/spinz-soda-app.git
   git branch -M main
   git push -u origin main
   ```

3. **Deploy on Vercel:**
   - Go to [Vercel Dashboard](https://vercel.com/new)
   - Click **"Import Project"**
   - Select your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Click **"Deploy"**

4. **Add Environment Variables in Vercel:**
   - Go to your project → **Settings** → **Environment Variables**
   - Add all 7 Firebase variables listed above
   - Click **"Redeploy"** to apply changes

---

### Method 2: Vercel CLI (If Network Works)

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

When prompted, add your Firebase environment variables.

---

### Method 3: Manual Upload via Vercel Dashboard

**Best for:** Quick one-time deployments

1. **Build your project locally:**
   ```powershell
   npm run build
   ```

2. **Go to Vercel:**
   - Visit [Vercel Deploy](https://vercel.com/new)
   - Click **"Deploy without Git"**
   - Drag and drop your **entire project folder** (`code (1)`)
   - Vercel will automatically detect it's a Next.js app

3. **Configure Environment Variables:**
   - Before clicking "Deploy", click **"Environment Variables"**
   - Add all 7 Firebase variables
   - Click **"Deploy"**

---

## 🔧 Adding Firebase Environment Variables to Vercel

### Option A: Via Vercel Dashboard
1. Go to: `https://vercel.com/YOUR-USERNAME/YOUR-PROJECT/settings/environment-variables`
2. Click **"Add New"**
3. For each variable:
   - **Key:** `NEXT_PUBLIC_FIREBASE_API_KEY`
   - **Value:** `your-actual-value`
   - **Environment:** Select **Production**, **Preview**, and **Development**
4. Click **"Save"**
5. Repeat for all 7 variables

### Option B: Via PowerShell Script (Requires Vercel CLI)
```powershell
# Use the upload-env.ps1 script
.\upload-env.ps1
```

This will read your `.env` file and upload all variables to Vercel.

---

## 🎯 Post-Deployment Steps

After deployment:

1. **Test the Live App:**
   - Visit your Vercel URL (e.g., `https://your-app.vercel.app`)
   - Try logging in as owner
   - Create a test bill
   - Check if Firebase is working

2. **Verify Firebase Connection:**
   - Open browser console (F12)
   - Look for: `✅ Firebase Config Loaded (API Key present)`
   - If you see an error, environment variables weren't added correctly

3. **Set Custom Domain (Optional):**
   - Go to Vercel → **Settings** → **Domains**
   - Add your custom domain

---

## 🐛 Troubleshooting

### "Firebase API Key is missing!"
**Solution:** Environment variables not set in Vercel
- Go to Vercel Settings → Environment Variables
- Add all Firebase variables
- **Redeploy** the project

### Login Not Working
**Solution:** Firebase Auth Domain mismatch
1. Go to Firebase Console → **Authentication** → **Settings**
2. Under **Authorized Domains**, add:
   - `your-app.vercel.app`
   - `localhost` (for local testing)

### Build Fails on Vercel
**Solution:** Check build logs
- Go to Vercel → **Deployments** → Click failed deployment
- Check the build logs for errors
- Common fix: Make sure `package.json` has correct dependencies

### PWA Not Installing
**Solution:** HTTPS Required
- PWAs only work on HTTPS (Vercel provides this automatically)
- Make sure `/public/manifest.json` exists
- Check service worker registration in browser DevTools

---

## 📝 Quick Reference

**Vercel Project URL:** https://vercel.com/spinzbeverage-3152s-projects/spinz-soda

**Local Build Command:**
```powershell
npm run build
```

**Local Dev Server:**
```powershell
npm run dev
```

**Deploy to Production:**
```powershell
vercel --prod
```

---

## 🎉 You're Ready to Deploy!

Your app is now **build-ready** and the viewport issue is fixed. Choose one of the deployment methods above and you'll be live in minutes!

**Recommended:** Use Method 1 (GitHub + Vercel) for automatic deployments whenever you push code.
