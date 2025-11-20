# Deployment Guide - Kiwi Pay

## 🚀 How to Access Your Live App

Your app is now on GitHub, but you need to deploy it to access it in a browser.

---

## ✅ Option 1: GitHub Pages (Free & Easy)

### Step 1: Enable GitHub Pages
1. Go to your repository: https://github.com/michaelkenealy/kiwi_app
2. Click **Settings** (top right)
3. Scroll down and click **Pages** (left sidebar)
4. Under **"Source"**, select:
   - Branch: **main**
   - Folder: **/ (root)**
5. Click **Save**

### Step 2: Wait 1-2 Minutes
GitHub will build and deploy your site.

### Step 3: Access Your App
Your app will be available at:
```
https://michaelkenealy.github.io/kiwi_app/
```

The index.html will automatically redirect to app.html (the full Kiwi Pay app).

---

## ✅ Option 2: Netlify (Recommended for Production)

### Why Netlify?
- Custom domain support
- HTTPS by default (required for camera access)
- Instant deployments
- Better performance

### Quick Deploy:
1. Go to [Netlify](https://app.netlify.com)
2. Click **"Add new site"** → **"Deploy manually"**
3. Drag the entire `Kiwi_app1` folder into the upload area
4. Wait 30 seconds
5. You'll get a URL like: `https://kiwi-pay-abc123.netlify.app`

### Connect to GitHub (Auto-Deploy):
1. In Netlify, click **"Add new site"** → **"Import an existing project"**
2. Select **GitHub**
3. Choose repository: **michaelkenealy/kiwi_app**
4. Settings:
   - Branch: `main`
   - Build command: (leave empty)
   - Publish directory: `.` (root)
5. Click **Deploy**

Now every time you push to GitHub, Netlify auto-deploys!

---

## ✅ Option 3: Vercel (Alternative)

1. Go to [Vercel](https://vercel.com)
2. Click **"Add New"** → **"Project"**
3. Import from GitHub: **michaelkenealy/kiwi_app**
4. Click **Deploy**
5. Your app will be at: `https://kiwi-app.vercel.app`

---

## 🔗 URL Summary

### Current URLs (won't work):
- ❌ `https://github.com/michaelkenealy/kiwi_app/app.html` (404 error)
- ❌ `https://raw.githubusercontent.com/michaelkenealy/kiwi_app/main/app.html` (shows source code)

### Working URLs (after deployment):
- ✅ `https://michaelkenealy.github.io/kiwi_app/` (GitHub Pages - after enabling)
- ✅ `https://your-site-name.netlify.app/` (Netlify)
- ✅ `https://kiwi-app.vercel.app/` (Vercel)

---

## 📱 Testing on iPhone

Once deployed, you can add to home screen:

1. Open the deployed URL in Safari
2. Tap the **Share** button (box with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**
5. The app icon appears on your home screen
6. Launch it like a native app!

---

## 🔒 Important: HTTPS Required

Your app MUST be served over HTTPS because:
- Camera access requires HTTPS (for QR scanning)
- Geolocation and other APIs require HTTPS
- Service workers (PWA features) require HTTPS

**All the deployment options above provide HTTPS automatically!**

Local testing works with:
- `http://localhost:8000` ✅
- `http://127.0.0.1:8000` ✅
- `http://192.168.x.x:8000` ❌ (requires HTTPS on network)

---

## 🎯 Recommended Setup

For the best experience:

1. **Deploy to Netlify** (free tier is fine)
2. **Add custom domain** (optional): `pay.yourdomain.com`
3. **Enable GitHub auto-deploy** (pushes = instant updates)
4. **Test on iOS Safari**
5. **Add to home screen**

---

## 🐛 Troubleshooting

### "404 Not Found" on GitHub Pages
- Make sure you've enabled Pages in Settings
- Wait 2-3 minutes after enabling
- Check the Pages section shows "Your site is live at..."

### "Camera not working"
- Ensure you're using HTTPS (not HTTP)
- Check browser permissions
- Try a different browser first

### "Cannot read properties of undefined"
- Check browser console (F12)
- Verify Supabase credentials in `js/config.js`
- Make sure database tables are set up

---

## 📊 Deployment Comparison

| Feature | GitHub Pages | Netlify | Vercel |
|---------|-------------|---------|--------|
| **Free Tier** | ✅ Yes | ✅ Yes | ✅ Yes |
| **HTTPS** | ✅ Auto | ✅ Auto | ✅ Auto |
| **Custom Domain** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Auto Deploy** | ⚠️ Manual | ✅ Yes | ✅ Yes |
| **Build Time** | 1-2 min | 30 sec | 30 sec |
| **Performance** | Good | Excellent | Excellent |
| **Recommended** | Development | **Production** | Production |

---

## 🎉 Next Steps

1. **Choose a deployment option** (I recommend Netlify)
2. **Deploy your app**
3. **Open the URL in your browser**
4. **Test the payment flow**
5. **Share the URL** with others to test!

Your Kiwi Pay app is ready to use! 🥝
