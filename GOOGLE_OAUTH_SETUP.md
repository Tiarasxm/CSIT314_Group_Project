# Google OAuth Setup Guide

This guide will help you set up Google OAuth authentication for the CSR Platform.

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - Choose **External** (unless you have a Google Workspace)
   - Fill in the required information:
     - App name: `CSR Platform`
     - User support email: Your email
     - Developer contact: Your email
   - Add scopes: `email`, `profile`, `openid`
   - Add test users (if in testing mode)
6. Create OAuth client ID:
   - Application type: **Web application**
   - Name: `CSR Platform Web Client`
   - Authorized JavaScript origins:
     - `http://localhost:3000`
     - `https://your-production-domain.com` (when deploying)
   - Authorized redirect URIs:
     - `https://ayqmycfvhtqlusjqmsei.supabase.co/auth/v1/callback`
     - `http://localhost:3000/auth/callback` (for local testing)
7. Click **Create**
8. **Copy the Client ID and Client Secret** (you'll need these in Step 2)

## Step 2: Configure Google OAuth in Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `ayqmycfvhtqlusjqmsei`
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list and click on it
5. Toggle **Enable Google provider** to ON
6. Enter your Google OAuth credentials:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret
7. Click **Save**

## Step 3: Verify Redirect URLs

Supabase automatically handles the OAuth callback at:
```
https://ayqmycfvhtqlusjqmsei.supabase.co/auth/v1/callback
```

Make sure this URL is added to your Google OAuth **Authorized redirect URIs** in Google Cloud Console.

## Step 4: Test Google OAuth

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/register` or `/login`

3. Click **Continue with Google**

4. You should be redirected to Google's sign-in page

5. After signing in, you'll be redirected back to:
   - `/create-password` (for new signups)
   - `/user/dashboard` (for existing users)

## How It Works

### For New Users (Sign Up)
1. User clicks "Continue with Google" on `/register`
2. Redirected to Google for authentication
3. After Google authentication, redirected to `/auth/callback`
4. Callback handler checks if user exists
5. If new user → redirects to `/create-password`
6. User creates password → redirects to `/user/dashboard`

### For Existing Users (Sign In)
1. User clicks "Continue with Google" on `/login`
2. Redirected to Google for authentication
3. After Google authentication, redirected to `/auth/callback`
4. Callback handler checks user role
5. Redirects to appropriate dashboard based on role

## Troubleshooting

### Issue: "redirect_uri_mismatch" error
**Solution:**
- Make sure `https://ayqmycfvhtqlusjqmsei.supabase.co/auth/v1/callback` is in your Google OAuth Authorized redirect URIs
- Check for typos or extra spaces
- Wait a few minutes after updating (Google caches redirect URIs)

### Issue: "access_denied" error
**Solution:**
- Check that your OAuth consent screen is properly configured
- If in testing mode, make sure the user's email is added as a test user
- Verify that the required scopes are added

### Issue: User not created in database after Google sign-in
**Solution:**
- Check that the `handle_new_user()` trigger is created in your database
- Verify the trigger is enabled
- Check Supabase logs for any errors

### Issue: Redirects to wrong page after Google sign-in
**Solution:**
- Check the callback route handler in `app/auth/callback/route.ts`
- Verify the redirect logic matches your user flow
- Check browser console for any errors

## Security Notes

1. ✅ **Never commit** your Google Client Secret to version control
2. ✅ Keep your OAuth credentials secure
3. ✅ Regularly rotate your OAuth credentials
4. ✅ Use environment variables for sensitive data in production
5. ✅ Enable 2FA on your Google Cloud Console account

## Production Deployment

When deploying to production:

1. Update Google OAuth redirect URIs:
   - Add your production domain: `https://your-domain.com/auth/callback`
   - Add Supabase callback: `https://ayqmycfvhtqlusjqmsei.supabase.co/auth/v1/callback`

2. Update OAuth consent screen:
   - Add your production domain
   - Submit for verification (if needed for public use)

3. Update environment variables:
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` is set correctly
   - Verify all redirect URLs match

## Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication](https://nextjs.org/docs/authentication)

