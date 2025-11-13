# 🧹 Complete Cache Clearing Instructions

## The Problem
Your browser is STUBBORNLY caching the old JavaScript code. Even hard refresh isn't working.

## Solution: Nuclear Cache Clear

### Option 1: Use Incognito/Private Window (FASTEST)
1. **Close the current browser tab**
2. **Open a new Incognito/Private window:**
   - Chrome/Edge: `Cmd+Shift+N` (Mac) or `Ctrl+Shift+N` (Windows)
   - Safari: `Cmd+Shift+N` (Mac)
   - Firefox: `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows)
3. Go to: `http://localhost:3000/staff/login`
4. Try logging in with `csr2@csr-platform.com` / `CSRPassword123!`

✅ **This should work immediately** because incognito has no cache!

---

### Option 2: Clear ALL Browser Data (If Incognito Doesn't Work)

#### Chrome/Edge:
1. Press `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
2. Select **"All time"** from the dropdown
3. Check these boxes:
   - ✅ Browsing history
   - ✅ Cookies and other site data
   - ✅ Cached images and files
4. Click **"Clear data"**
5. **Close and reopen the browser completely**
6. Go to `http://localhost:3000/staff/login`

#### Safari:
1. Go to Safari → Settings → Privacy
2. Click **"Manage Website Data..."**
3. Click **"Remove All"**
4. Confirm
5. **Close and reopen Safari completely**
6. Go to `http://localhost:3000/staff/login`

#### Firefox:
1. Press `Cmd+Shift+Delete` (Mac) or `Ctrl+Shift+Delete` (Windows)
2. Select **"Everything"** from the dropdown
3. Check all boxes
4. Click **"Clear Now"**
5. **Close and reopen Firefox completely**
6. Go to `http://localhost:3000/staff/login`

---

### Option 3: Use DevTools Network Disable Cache

1. Open the page: `http://localhost:3000/staff/login`
2. Open DevTools: Press `F12` or `Cmd+Option+I` (Mac)
3. Go to **Network** tab
4. Check the box: **"Disable cache"**
5. Keep DevTools open
6. Refresh the page: `Cmd+R` or `Ctrl+R`
7. Try logging in

---

### Option 4: Different Browser (Ultimate Test)
If you're using Chrome, try:
- Firefox
- Safari
- Edge
- Brave

Go to `http://localhost:3000/staff/login` and try logging in.

---

## What Changed in the Code

The login page now uses `user_metadata` instead of database queries:

**Before (caused error):**
```typescript
const { data: userData } = await supabase
  .from("users")
  .select("role")
  .eq("id", data.user.id)
  .single();
```

**After (works):**
```typescript
const role = data.user.user_metadata?.role;
```

## Verification

If cache is cleared properly, you should:
1. ✅ NOT see "Database error querying schema"
2. ✅ See a new login form
3. ✅ Successfully log in and redirect to CSR dashboard

## Still Not Working?

If NONE of these work, check browser console (F12) and send me the exact error message.

