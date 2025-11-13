# Fix Email Confirmation Links

## The Problem

When you sign up with email, Supabase sends a confirmation email with a `localhost:3000` link. This is actually **correct for development**, but the link might not work if:
- You're accessing the email from a different device (phone, tablet)
- The link format is incorrect
- You need to use a different URL for production

**Note:** For local development, `localhost:3000` is fine if you're testing on the same machine. The issue is usually when you need to access it from another device or in production.

## The Solution: Configure Site URL in Supabase

### Step 1: Go to Supabase Authentication Settings

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `ayqmycfvhtqlusjqmsei`
3. Go to **Authentication** → **URL Configuration**

### Step 2: Update Site URL

1. Find **Site URL** field
2. For **local development** (same machine), set it to:
   ```
   http://localhost:3000
   ```
   ✅ This is already correct if you're testing on your computer!

3. For **testing from other devices** (phone, tablet), you need:
   - Option A: Use your local network IP (e.g., `http://192.168.1.100:3000`)
   - Option B: Use a tunneling service like ngrok
   - Option C: Deploy to a staging environment

4. For **production**, set it to:
   ```
   https://your-production-domain.com
   ```

### Step 3: Add Redirect URLs

In the **Redirect URLs** section, add:

**For Development:**
```
http://localhost:3000/auth/callback
http://localhost:3000/login
http://localhost:3000/register
```

**For Production:**
```
https://your-production-domain.com/auth/callback
https://your-production-domain.com/login
https://your-production-domain.com/register
```

### Step 4: Save Changes

Click **Save** at the bottom of the page.

## Alternative: Disable Email Confirmation (Development Only)

If you're just testing and don't want email confirmation:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **Confirm email** to OFF
3. Click **Save**

⚠️ **Warning:** Only disable this for development/testing. Always enable it in production!

**Note:** When email confirmation is disabled, users can sign up and immediately log in without confirming their email.

## How Email Confirmation Works

1. User signs up with email
2. Supabase sends confirmation email
3. Email contains a link like: `https://your-site-url/auth/confirm?token=...`
4. User clicks link → redirected to your app
5. App verifies token → user is confirmed

## Update Your Callback Handler

Make sure your callback handler can handle email confirmation tokens. The current handler in `app/auth/callback/route.ts` handles OAuth, but you may want to add email confirmation handling.

## Testing Email Confirmation

1. Sign up with a new email
2. Check your email inbox (and spam folder)
3. Click the confirmation link
4. You should be redirected to your app and logged in

## Production Checklist

Before going to production:

- [ ] Set Site URL to your production domain
- [ ] Add all production redirect URLs
- [ ] Enable email confirmation
- [ ] Configure custom email templates (optional)
- [ ] Test email delivery
- [ ] Set up proper email service (if needed)

## Direct Link to Settings

If you're logged in, go directly to:
```
https://supabase.com/dashboard/project/ayqmycfvhtqlusjqmsei/auth/url-configuration
```

## Quick Summary

**For Local Development (Same Machine):**
- Site URL: `http://localhost:3000` ✅ (This is correct!)
- The email links will work if you click them on the same computer

**For Testing from Phone/Tablet:**
- Use your computer's local IP: `http://192.168.1.X:3000` (replace X with your IP)
- Or use ngrok: `ngrok http 3000` and use the ngrok URL

**For Production:**
- Site URL: `https://your-domain.com`
- Add all production redirect URLs

