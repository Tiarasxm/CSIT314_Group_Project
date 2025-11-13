# 🚀 Vercel Deployment Checklist

## ✅ What's Already Good (No Changes Needed)

✅ **Code is ready** - All URLs use environment variables
✅ **Middleware configured** - Uses `process.env` variables
✅ **No hardcoded localhost** - Everything is dynamic
✅ **Git committed** - Working tree is clean
✅ **Next.js config** - Clean and ready for production
✅ **Database migrations** - Already applied in Supabase

---

## 📝 What You Need to Deploy

### 1. Environment Variables (REQUIRED)

You need these 3 environment variables from your Supabase dashboard:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find them:**
- Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
- Copy all 3 values

### 2. Supabase Configuration (REQUIRED After Deployment)

Once you get your Vercel URL (e.g., `https://csr-platform-xyz.vercel.app`), you MUST update Supabase:

1. Go to Supabase Dashboard
2. Navigate to: **Authentication** → **URL Configuration**
3. Add these URLs:

**Site URL:**
```
https://your-vercel-url.vercel.app
```

**Redirect URLs** (add all of these):
```
https://your-vercel-url.vercel.app/*
https://your-vercel-url.vercel.app/auth/callback
https://your-vercel-url.vercel.app/email-confirmed
```

**⚠️ CRITICAL: If you skip this step, login will NOT work!**

---

## 🎯 Deployment Steps

### Method 1: Vercel Dashboard (Recommended for First Time)

1. **Go to Vercel:** https://vercel.com
2. **Sign in** with GitHub
3. **Click "Add New..."** → "Project"
4. **Import** your repository
5. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add all 3 variables (see section 1 above)
   - Make sure to add them for: Production, Preview, Development
6. **Click "Deploy"**

### Method 2: Vercel CLI (Faster for Updates)

```bash
# 1. Install Vercel CLI (one time)
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy (first time)
cd /Users/ake/Code/CSIT314_Group_Project
vercel

# 4. Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# (paste your value when prompted)

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# (paste your value when prompted)

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# (paste your value when prompted)

# 5. Deploy to production
vercel --prod
```

---

## 🔧 Post-Deployment Configuration

### 1. Update Supabase (CRITICAL!)
- [ ] Add Vercel URL to Supabase Site URL
- [ ] Add Vercel URL to Supabase Redirect URLs
- [ ] Test login on production URL

### 2. Test All Authentication Flows
- [ ] User registration
- [ ] User login
- [ ] Staff login (CSR, User Admin, Platform Manager)
- [ ] Email confirmation
- [ ] Password reset (if implemented)

### 3. Test Key Features
- [ ] Submit new request (as user)
- [ ] View and accept requests (as CSR)
- [ ] Suspend/reactivate users (as User Admin)
- [ ] View analytics (as Platform Manager)
- [ ] Image uploads
- [ ] PDF exports

---

## 📦 What Gets Deployed

✅ Your entire `/app` directory
✅ All components in `/components`
✅ All libraries in `/lib`
✅ Middleware
✅ Public assets
✅ Package dependencies

❌ **NOT deployed:**
- `/supabase/migrations` - These are already in Supabase
- `.env.local` - Environment variables are set in Vercel
- `node_modules` - Rebuilt during deployment
- Documentation files (`.md`)

---

## 🐛 Common Issues & Solutions

### Issue: "Invalid login credentials" after deployment
**Solution:** You forgot to add your Vercel URL to Supabase redirect URLs (see Section 2 above)

### Issue: "Missing environment variables"
**Solution:** 
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Make sure all 3 variables are added
3. Redeploy: `vercel --prod`

### Issue: "Build failed"
**Solution:**
1. Check build logs in Vercel dashboard
2. Make sure all dependencies are in `package.json`
3. Try building locally: `npm run build`

### Issue: Images not loading
**Solution:**
1. Check Supabase Storage policies
2. Verify bucket is public
3. Check CORS settings in Supabase Storage

### Issue: Database queries failing
**Solution:**
1. Verify Supabase URL is correct
2. Check RLS policies allow production domain
3. Verify service role key is correct

---

## 🔒 Security Checklist

- [ ] Environment variables are set in Vercel (NOT in code)
- [ ] `.env.local` is in `.gitignore` (already done)
- [ ] Service role key is NOT exposed to client
- [ ] Supabase RLS policies are enabled
- [ ] Only allowed domains can make requests

---

## 📊 Monitor Your Deployment

After deployment, monitor:

1. **Vercel Dashboard:**
   - Build logs
   - Runtime logs
   - Analytics

2. **Supabase Dashboard:**
   - Database usage
   - Auth users
   - API requests

3. **Browser Console:**
   - Check for errors
   - Network tab for failed requests

---

## 🎉 Success Indicators

You'll know deployment is successful when:

✅ Build completes without errors
✅ Deployment URL is accessible
✅ Login works for all user types
✅ Database queries return data
✅ Images upload and display
✅ No console errors

---

## 📞 Need Help?

**Vercel Issues:**
- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support

**Supabase Issues:**
- Supabase Docs: https://supabase.com/docs
- Supabase Support: https://supabase.com/dashboard/support

**Common Next.js Deployment Issues:**
- https://nextjs.org/docs/deployment

---

## 🚀 Ready to Deploy?

Run this command now:

```bash
cd /Users/ake/Code/CSIT314_Group_Project && npx vercel
```

Then follow the prompts!

