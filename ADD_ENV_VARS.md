# 🔧 Fix Deployment: Add Environment Variables

## ✅ Your deployment is linked! Now add the environment variables:

Your project URL: **https://csit-314-group-project-j770mf0yj-titapas-projects.vercel.app**

---

## 🚀 Quick Fix (2 Options)

### Option 1: Vercel Dashboard (Easier)

1. Go to: https://vercel.com/titapas-projects/csit-314-group-project/settings/environment-variables

2. Add these 3 variables:

**Variable 1:**
```
Name: NEXT_PUBLIC_SUPABASE_URL
Value: [Copy from your .env.local file]
Environment: Production, Preview, Development (check all 3)
```

**Variable 2:**
```
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Copy from your .env.local file]
Environment: Production, Preview, Development (check all 3)
```

**Variable 3:**
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [Copy from your .env.local file]
Environment: Production, Preview, Development (check all 3)
```

3. After adding all 3, go to: https://vercel.com/titapas-projects/csit-314-group-project
4. Click "Redeploy" (or run `npx vercel --prod` below)

---

### Option 2: CLI (Faster if you know the values)

Run these commands:

```bash
cd /Users/ake/Code/CSIT314_Group_Project

# Add each environment variable
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL when prompted, select "Production" (press space, then enter)

npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your Anon Key when prompted, select "Production"

npx vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste your Service Role Key when prompted, select "Production"

# Now redeploy
npx vercel --prod
```

---

## 📋 To get your values from .env.local:

Run this command to see your current values:

```bash
cat /Users/ake/Code/CSIT314_Group_Project/.env.local
```

Or get them from Supabase Dashboard:
https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api

---

## ⚠️ After successful deployment, don't forget:

Update Supabase Authentication URLs:
1. Go to Supabase → Authentication → URL Configuration
2. Add your Vercel URL: `https://csit-314-group-project-j770mf0yj-titapas-projects.vercel.app`
3. Add to Redirect URLs: `https://csit-314-group-project-j770mf0yj-titapas-projects.vercel.app/*`

---

