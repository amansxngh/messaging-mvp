# 🚀 Messaging MVP - Deployment Guide

## Quick Deploy (5 minutes)

### Frontend (Web App) - Netlify
1. Go to https://netlify.com
2. Sign up/Login (free)
3. Click "Add new site" → "Deploy manually"
4. Drag and drop the `deployment/frontend` folder
5. Your web app will be live instantly! 🎉

### Backend (API) - Railway
1. Go to https://railway.app
2. Sign up/Login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Create a new GitHub repo with files from `deployment/backend/`
5. Railway will auto-deploy your API

## Files Ready for Deployment

### Frontend Files (in `deployment/frontend/`)
- `index.html` - Main app file
- `assets/` - CSS and JS bundles
- Ready to drag & drop to Netlify

### Backend Files (in `deployment/backend/`)
- `server.js` - Main server file
- `package.json` - Dependencies
- `Procfile` - Railway deployment config

## After Deployment

1. **Get your URLs:**
   - Frontend: `https://your-app-name.netlify.app`
   - Backend: `https://your-app-name.railway.app`

2. **Update frontend to use production backend:**
   - Edit `deployment/frontend/assets/index-*.js`
   - Replace `http://localhost:3001` with your Railway URL

3. **Test the app:**
   - Sign up with any phone number
   - Use verification code: any 6 digits
   - Test messaging and features

## Investor Demo Ready! 🎯

Your app will be live and shareable with investors in minutes!
