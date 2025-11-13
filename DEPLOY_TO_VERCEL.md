# Deploy to Vercel - Step by Step Guide

## Prerequisites
- GitHub account (with this repo pushed)
- Vercel account (free at vercel.com)
- Your Supabase credentials ready

## Step 1: Push to GitHub (if not already)
```bash
# If you haven't pushed to GitHub yet:
git remote -v  # Check if you have a remote
# If no remote, create a new repo on GitHub and:
# git remote add origin YOUR_GITHUB_REPO_URL
# git push -u origin main
```

## Step 2: Deploy to Vercel

### Option A: Using Vercel CLI (Fastest)
1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
cd /Users/ake/Code/CSIT314_Group_Project
vercel
```

4. When prompted:
   - Set up and deploy? **Y**
   - Which scope? Choose your account
   - Link to existing project? **N**
   - Project name? **csr-platform** (or your preferred name)
   - Directory? **./** (just press Enter)
   - Override settings? **N**

5. Add environment variables:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Paste your Supabase URL when prompted

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Paste your Supabase Anon Key when prompted

vercel env add SUPABASE_SERVICE_ROLE_KEY
# Paste your Supabase Service Role Key when prompted
```

6. Deploy to production:
```bash
vercel --prod
```

### Option B: Using Vercel Dashboard (Visual)
1. Go to https://vercel.com and sign in
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset:** Next.js (should auto-detect)
   - **Root Directory:** ./
   - **Build Command:** `npm run build` (auto-filled)
   - **Output Directory:** .next (auto-filled)
5. Add Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = Your Supabase URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Your Supabase Anon Key
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase Service Role Key
6. Click "Deploy"

## Step 3: Configure Supabase (IMPORTANT!)

Once deployed, you need to add your Vercel domain to Supabase:

1. Get your Vercel URL (e.g., `your-project.vercel.app`)
2. Go to your Supabase Dashboard
3. Navigate to **Authentication** → **URL Configuration**
4. Add to **Redirect URLs**:
   - `https://your-project.vercel.app/*`
   - `https://your-project.vercel.app/api/auth/callback`
5. Add to **Site URL**: `https://your-project.vercel.app`

## Step 4: Test Your Deployment

Visit your Vercel URL and test:
- User login: `https://your-project.vercel.app/login`
- Staff login: `https://your-project.vercel.app/staff/login`

## Troubleshooting

### If deployment fails:
- Check build logs in Vercel dashboard
- Ensure all environment variables are set
- Make sure your Supabase URL allows connections from Vercel

### If login doesn't work:
- Verify Vercel domain is added to Supabase redirect URLs
- Check browser console for errors
- Verify environment variables are correctly set in Vercel

## Useful Commands

```bash
# View deployment status
vercel ls

# View logs
vercel logs YOUR_DEPLOYMENT_URL

# Redeploy
vercel --prod

# View environment variables
vercel env ls
```

## Next Steps After Deployment

1. Set up a custom domain (optional)
2. Enable analytics in Vercel dashboard
3. Set up monitoring/alerts
4. Update your documentation with the live URL

---

**Your deployment URL will be:** `https://csr-platform-XXXX.vercel.app`

(Vercel will provide the exact URL after deployment)

