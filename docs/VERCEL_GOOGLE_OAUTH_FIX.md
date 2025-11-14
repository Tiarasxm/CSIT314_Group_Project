# 🔧 Fix Google OAuth for Vercel Deployment

## Problem
After deploying to Vercel, Google OAuth signup redirects to Vercel instead of completing authentication.

## ⚡ Quick Fix (5 minutes)

### Step 1: Get Your Vercel URL
Your Vercel deployment URL is something like:
- `https://your-app.vercel.app`
- Or your custom domain: `https://your-domain.com`

### Step 2: Update Google Cloud Console

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**

2. **Navigate to:**
   - APIs & Services → Credentials
   - Click on your OAuth 2.0 Client ID

3. **Update "Authorized JavaScript origins":**
   Add your Vercel URL:
   ```
   https://your-app.vercel.app
   ```
   Keep existing:
   ```
   http://localhost:3000
   https://ayqmycfvhtqlusjqmsei.supabase.co
   ```

4. **Update "Authorized redirect URIs":**
   Add your Vercel callback URL:
   ```
   https://your-app.vercel.app/auth/callback
   ```
   Keep existing:
   ```
   https://ayqmycfvhtqlusjqmsei.supabase.co/auth/v1/callback
   http://localhost:3000/auth/callback
   ```

5. **Click SAVE**

### Step 3: Update Supabase Dashboard (Optional but Recommended)

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**

2. **Navigate to:**
   - Authentication → URL Configuration

3. **Add your Vercel URL to "Redirect URLs":**
   ```
   https://your-app.vercel.app/**
   ```

4. **Update "Site URL":**
   ```
   https://your-app.vercel.app
   ```

5. **Click SAVE**

### Step 4: Test

1. Clear your browser cache or use incognito mode
2. Go to your Vercel deployment: `https://your-app.vercel.app/register`
3. Click "Continue with Google"
4. Should now work! ✅

## 📋 Complete Checklist

### Google Cloud Console - Authorized JavaScript origins
- [ ] `http://localhost:3000` (for local dev)
- [ ] `https://your-app.vercel.app` (your Vercel URL)
- [ ] `https://ayqmycfvhtqlusjqmsei.supabase.co` (Supabase)

### Google Cloud Console - Authorized redirect URIs
- [ ] `http://localhost:3000/auth/callback` (for local dev)
- [ ] `https://your-app.vercel.app/auth/callback` (your Vercel URL)
- [ ] `https://ayqmycfvhtqlusjqmsei.supabase.co/auth/v1/callback` (Supabase)

### Supabase Dashboard - URL Configuration
- [ ] Site URL: `https://your-app.vercel.app`
- [ ] Redirect URLs: `https://your-app.vercel.app/**`

## ⚠️ Important Notes

1. **Wait 5-10 minutes** after saving changes in Google Cloud Console (caching)
2. **Clear browser cache** or use incognito mode when testing
3. **Replace** `your-app.vercel.app` with your actual Vercel URL
4. **Keep all existing URLs** (localhost, Supabase) - don't delete them!

## 🔍 How to Find Your Vercel URL

### Option 1: Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Copy the URL shown under "Domains"

### Option 2: From Terminal
```bash
vercel --prod
# The URL will be shown in the output
```

### Option 3: From Git
If you've already deployed, check your terminal output from the `vercel` command.

## 🐛 Still Not Working?

### Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for any error messages related to OAuth or redirect_uri

### Common Errors

**Error: "redirect_uri_mismatch"**
- Double-check the URLs in Google Cloud Console
- Make sure there are no typos or extra spaces
- Wait 5-10 minutes for Google's cache to update

**Error: "access_denied"**
- Check OAuth consent screen in Google Cloud Console
- Make sure your email is added as a test user (if in testing mode)

**Still redirects to Vercel homepage**
- Check that `/auth/callback/route.ts` is deployed correctly
- Verify environment variables are set in Vercel

## 📞 Need Help?

See the full guide: `docs/GOOGLE_OAUTH_SETUP.md`

---

**After fixing, Google OAuth will work on:**
- ✅ Localhost (http://localhost:3000)
- ✅ Vercel Production (https://your-app.vercel.app)

