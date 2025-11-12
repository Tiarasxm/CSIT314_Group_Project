# Enable Google OAuth in Supabase - Step by Step

## The Error You're Seeing

```
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

This means Google OAuth is **not enabled** in your Supabase project yet.

## Quick Fix (2 minutes)

### Step 1: Go to Supabase Dashboard

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your project: **ayqmycfvhtqlusjqmsei** (or click on it)

### Step 2: Navigate to Authentication Settings

1. In the left sidebar, click **Authentication**
2. Click **Providers** (or go directly to: Authentication → Providers)

### Step 3: Enable Google Provider

1. Scroll down to find **Google** in the list of providers
2. Click on **Google** to expand it
3. Toggle the switch to **Enable Google provider** (turn it ON)

### Step 4: Add Google OAuth Credentials

You have two options:

#### Option A: Quick Test (No Google Credentials Needed)
- Just enable the provider without credentials
- Supabase will use a test configuration
- **Note:** This may have limitations

#### Option B: Full Setup (Recommended)
You need to get Google OAuth credentials first:

1. **Get Google OAuth Credentials:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create/Select a project
   - Go to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **OAuth client ID**
   - Configure OAuth consent screen if prompted
   - Create OAuth client ID:
     - Type: **Web application**
     - Name: `CSR Platform`
     - Authorized redirect URI: `https://ayqmycfvhtqlusjqmsei.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**

2. **Add to Supabase:**
   - Back in Supabase Dashboard → Authentication → Providers → Google
   - Paste **Client ID (for OAuth)** 
   - Paste **Client Secret (for OAuth)**
   - Click **Save**

### Step 5: Test It!

1. Go back to your app: `http://localhost:3000/register`
2. Click **Continue with Google**
3. It should work now! 🎉

## If You Don't Have Google OAuth Credentials Yet

You can still enable Google OAuth for testing:

1. Just toggle **Enable Google provider** to ON
2. Leave the credentials empty (or use test values)
3. Click **Save**
4. Try signing up with Google

**Note:** For production, you'll need proper Google OAuth credentials.

## Troubleshooting

### Still getting the error after enabling?
- Make sure you clicked **Save** after enabling
- Refresh your browser
- Wait 10-30 seconds for changes to propagate
- Check that the toggle is actually ON (green/enabled)

### Need help getting Google OAuth credentials?
See the detailed guide: [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

## Direct Link to Your Supabase Settings

If you're logged in, you can go directly to:
```
https://supabase.com/dashboard/project/ayqmycfvhtqlusjqmsei/auth/providers
```

Then find **Google** and enable it!

