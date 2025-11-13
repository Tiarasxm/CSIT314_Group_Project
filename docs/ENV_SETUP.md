# Environment Variables Setup

This file provides a quick reference for setting up your environment variables.

## Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
# Get these from: Supabase Dashboard → Settings → API

# Project URL (Public - Safe for client-side)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Anon/Public Key (Public - Safe for client-side)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk2ODAwLCJleHAiOjE5NTY1NzI4MDB9.your-anon-key-here

# Service Role Key (SECRET - Server-side only!)
# ⚠️ NEVER expose this in client-side code!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdC1pZCIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2NDA5OTY4MDAsImV4cCI6MTk1NjU3MjgwMH0.your-service-role-key-here
```

## How to Get Your Keys

1. **Go to Supabase Dashboard**: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **Select your project** (or create a new one)
3. **Navigate to**: Settings → API
4. **Copy the values**:
   - **Project URL**: Found under "Project URL"
   - **anon/public key**: Found under "Project API keys" → "anon" or "public"
   - **service_role key**: Found under "Project API keys" → "service_role" (⚠️ Keep this secret!)

## Security Notes

- ✅ **Safe to expose**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - These are designed to be used in client-side code
  - Protected by Row Level Security (RLS) policies
  
- ⚠️ **NEVER expose**: `SUPABASE_SERVICE_ROLE_KEY`
  - This key bypasses RLS policies
  - Only use in server-side code (API routes, server components)
  - Never commit to version control
  - Never log or display in client-side code

## File Location

```
CSIT314_Group_Project/
├── .env.local          ← Create this file (gitignored)
├── .env.example        ← Example template (safe to commit)
└── ENV_SETUP.md        ← This file
```

## Verification

After setting up your `.env.local` file, verify it's working:

1. Start the dev server: `npm run dev`
2. Check the console for any Supabase connection errors
3. Try registering a new user at `/register`
4. Check your Supabase Dashboard → Authentication → Users to see if the user was created

## Troubleshooting

### "Invalid API key" error
- Double-check that you copied the entire key (they're very long)
- Ensure there are no extra spaces or line breaks
- Verify you're using the correct key type (anon vs service_role)

### "Failed to fetch" error
- **Check environment variables are loaded:**
  - Ensure `.env.local` exists in the project root
  - Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
  - **Restart your development server** after creating/modifying `.env.local`
  - Check browser console for the actual Supabase URL being used
- **Verify Supabase URL:**
  - Check that `NEXT_PUBLIC_SUPABASE_URL` is correct (format: `https://xxxxx.supabase.co`)
  - Ensure there are no trailing slashes
  - Verify your Supabase project is active (not paused)
- **Network issues:**
  - Check your internet connection
  - Try accessing the Supabase URL directly in your browser
  - Check for CORS errors in browser console
  - Verify firewall/proxy settings aren't blocking the connection
- **Common fixes:**
  - Delete `.next` folder and restart dev server: `rm -rf .next && npm run dev`
  - Clear browser cache and hard refresh (Cmd+Shift+R / Ctrl+Shift+R)
  - Check if other Supabase operations work (e.g., regular user login)

### Environment variables not loading
- Ensure the file is named exactly `.env.local` (not `.env` or `.env.local.txt`)
- Restart your development server after creating/modifying `.env.local`
- In Next.js, only variables prefixed with `NEXT_PUBLIC_` are available in client components

