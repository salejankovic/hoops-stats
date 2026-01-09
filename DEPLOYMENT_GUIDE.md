# 🚀 HoopsStats AI Pro - Deployment Guide

## Quick Deploy to Vercel (Easiest - 5 Minutes)

Vercel is the **easiest and fastest** way to deploy your app. It's free and perfect for single-user apps.

### Step 1: Install Vercel CLI

Open terminal in your project folder and run:

```bash
npm install -g vercel
```

### Step 2: Build Your App

```bash
npm run build
```

This creates a `dist` folder with your production-ready app.

### Step 3: Deploy to Vercel

```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** Yes
- **Which scope?** Your username
- **Link to existing project?** No
- **Project name?** hoopsstats-ai (or your choice)
- **Directory?** Press Enter (current directory)
- **Build settings?** Yes
- **Build command?** `npm run build`
- **Output directory?** `dist`

That's it! Vercel will give you a URL like: `https://hoopsstats-ai.vercel.app`

### Step 4: Add Environment Variable (Optional - For AI Features)

If you want AI voice entry:

```bash
vercel env add GEMINI_API_KEY
```

Paste your Gemini API key when prompted.

Then redeploy:
```bash
vercel --prod
```

### Step 5: Access from Anywhere

Open the URL on any device:
- Your computer
- Your phone
- Your tablet

Login with:
- Email: jankovic1998@gmail.com
- Password: partiz4n

**Done!** Your app is live and accessible from anywhere.

---

## Alternative: Deploy to Netlify (Also Easy)

### Method 1: Netlify CLI

```bash
npm install -g netlify-cli
npm run build
netlify deploy
```

Follow prompts:
- **Create new site?** Yes
- **Site name?** hoopsstats-ai
- **Publish directory?** dist

For production:
```bash
netlify deploy --prod
```

### Method 2: Netlify Drag & Drop

1. Build your app: `npm run build`
2. Go to https://app.netlify.com/drop
3. Drag the `dist` folder onto the page
4. Done! You'll get a URL instantly

To add environment variables:
1. Go to Site settings → Environment variables
2. Add `GEMINI_API_KEY` with your key value
3. Redeploy

---

## Alternative: Deploy to GitHub Pages (Free)

### Step 1: Update vite.config.ts

Add base URL:

```typescript
export default defineConfig({
  base: '/hoopsstats-ai-pro/',  // Your repo name
  // ... rest of config
});
```

### Step 2: Install gh-pages

```bash
npm install --save-dev gh-pages
```

### Step 3: Add Deploy Script

Edit `package.json`:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "deploy": "vite build && gh-pages -d dist"
}
```

### Step 4: Deploy

```bash
npm run deploy
```

Access at: `https://yourusername.github.io/hoopsstats-ai-pro/`

**Note:** GitHub Pages doesn't support environment variables easily, so AI features won't work unless you hardcode the API key (not recommended for public repos).

---

## Recommended: Vercel Comparison

| Platform | Ease | Speed | Free Tier | Environment Vars | Custom Domain |
|----------|------|-------|-----------|------------------|---------------|
| **Vercel** | ⭐⭐⭐⭐⭐ | Instant | Yes | Yes | Yes (free) |
| **Netlify** | ⭐⭐⭐⭐⭐ | Instant | Yes | Yes | Yes (free) |
| **GitHub Pages** | ⭐⭐⭐ | Fast | Yes | No | Yes (manual) |

**Verdict:** Use **Vercel** or **Netlify** for the best experience.

---

## Custom Domain (Optional)

### If you want hoopsstats.com instead of vercel.app:

1. Buy a domain (~$10-15/year):
   - Namecheap.com
   - GoDaddy.com
   - Google Domains

2. In Vercel Dashboard:
   - Go to your project → Settings → Domains
   - Add your custom domain
   - Follow DNS setup instructions

3. Update DNS records (provided by Vercel)

4. Wait 5-60 minutes for DNS to propagate

5. Access your app at your custom domain!

---

## Security Note

**IMPORTANT:** Your credentials are hardcoded in the app:
- Email: jankovic1998@gmail.com
- Password: partiz4n

This is fine for a **single-user personal app**, but:
- Don't share the deployed URL publicly
- If you want to share, change the credentials in [services/storage.ts](services/storage.ts) first

To change credentials:
1. Open `services/storage.ts`
2. Update the `VALID_USER` object:
   ```typescript
   const VALID_USER = {
     email: 'your-new-email@example.com',
     password: 'your-new-password'
   };
   ```
3. Rebuild and redeploy

---

## Updating Your Deployed App

After making changes locally:

### Vercel:
```bash
npm run build
vercel --prod
```

### Netlify:
```bash
npm run build
netlify deploy --prod
```

### GitHub Pages:
```bash
npm run deploy
```

---

## Mobile Access Tips

1. **Add to Home Screen:**
   - iOS: Open in Safari → Share → Add to Home Screen
   - Android: Open in Chrome → Menu → Add to Home Screen
   - Works like a native app!

2. **Bookmark it:**
   - Save the URL for quick access

3. **Share with yourself:**
   - Email/text the URL to your phone

---

## Data Management After Deployment

Your data is stored in the browser's localStorage on each device:

- **Phone data** stays on your phone
- **Computer data** stays on your computer
- They are **separate** unless you export/import

**To keep data in sync:**
1. Export from device A (JSON)
2. Import to device B
3. Or use the same device for all entries

**Backup strategy:**
- Export JSON after each game
- Save backups to cloud storage (Google Drive, OneDrive)
- Import when needed

---

## Troubleshooting Deployment

**Build fails?**
```bash
rm -rf node_modules dist
npm install
npm run build
```

**AI features not working after deploy?**
- Check environment variable is set
- Redeploy after adding the variable

**Can't login after deploy?**
- Check browser console (F12) for errors
- Make sure you're using the correct credentials

**App shows blank page?**
- Check browser console for errors
- Try clearing browser cache

---

## Cost Summary

**For personal use (Vercel recommended):**
- Hosting: **$0/month** (Vercel free tier)
- AI API: **$0/month** (Gemini free tier)
- Custom domain: **$10-15/year** (optional)

**Total: $0/month** or **~$1/month** with custom domain

---

## What's Next?

You now have a production-ready basketball stats tracker accessible from anywhere!

- Track games from your phone
- Review stats from your computer
- Export data for deeper analysis
- Use AI for performance insights

**Enjoy your pro-level stats tracking! 🏀**
