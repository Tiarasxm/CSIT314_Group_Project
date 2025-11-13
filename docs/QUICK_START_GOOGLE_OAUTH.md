# Quick Start: Google OAuth Setup

## ⚠️ IMPORTANT: Enable Google Provider First!

If you see this error:
```
{"code":400,"error_code":"validation_failed","msg":"Unsupported provider: provider is not enabled"}
```

**You need to enable Google OAuth in Supabase first!**

👉 **Quick Fix:** Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → Authentication → Providers → **Enable Google**

See [ENABLE_GOOGLE_OAUTH_NOW.md](./ENABLE_GOOGLE_OAUTH_NOW.md) for step-by-step instructions.

---

## 🚀 Quick Setup (5 minutes)

### 1. Get Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/Select project → **APIs & Services** → **Credentials**
3. **Create OAuth client ID**:
   - Type: **Web application**
   - Authorized redirect URI: `https://ayqmycfvhtqlusjqmsei.supabase.co/auth/v1/callback`
4. **Copy Client ID and Client Secret**

### 2. Configure in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Your project: `ayqmycfvhtqlusjqmsei`
3. **Authentication** → **Providers** → **Google**
4. Enable Google provider
5. Paste **Client ID** and **Client Secret**
6. Click **Save**

### 3. Test It!

```bash
npm run dev
```

Visit `http://localhost:3000/register` and click **Continue with Google** 🎉

## ✅ That's It!

For detailed instructions, see [GOOGLE_OAUTH_SETUP.md](./GOOGLE_OAUTH_SETUP.md)

## Common Issues

**"redirect_uri_mismatch"**
- Add this exact URL to Google OAuth redirect URIs:
  `https://ayqmycfvhtqlusjqmsei.supabase.co/auth/v1/callback`

**User not created in database**
- Run the database migration: `supabase/migrations/001_initial_schema.sql`
- Check that the `handle_new_user()` trigger exists

