# Request Shortlist Count Feature

## Overview
This feature allows users to see how many CSR representatives have shortlisted their requests. It provides transparency and shows the level of interest in each request.

## What Changed

### 1. **Database Structure**
- Created a new junction table `request_shortlists` to support **multiple CSRs shortlisting the same request**
- Previous system only allowed one CSR per request
- Automatically migrated existing shortlist data to the new table

### 2. **User Interface**
- Each request card now displays a **star icon** (⭐) with a count
- Only shows when at least one CSR has shortlisted the request
- Appears next to the status badge on request cards

### 3. **Backend Logic**
- New RPC function `get_request_shortlist_counts()` to safely fetch counts
- Bypasses RLS for read-only count queries
- Efficient batch fetching for all requests at once

---

## How It Works

### For Users:
1. **View Your Requests** → Go to `/user/requests`
2. **See Shortlist Counts** → Look for the star icon (⭐) next to the status badge
3. **Understand Interest Level:**
   - **No star** = No CSRs have shortlisted yet
   - **⭐ 1** = 1 CSR is interested
   - **⭐ 3** = 3 CSRs are interested (more visibility!)

### For CSR Representatives:
- Multiple CSRs can now shortlist the same request
- Each CSR can still see their own shortlisted requests
- No change to the shortlist button behavior

---

## Database Migration

### **Step 1: Run the Migration**
Open **Supabase SQL Editor** and run:

```sql
-- Copy from: COPY_PASTE_MIGRATION_032.sql
```

This will:
- ✅ Create the `request_shortlists` table
- ✅ Migrate existing shortlist data
- ✅ Set up RLS policies
- ✅ Create the `get_request_shortlist_counts()` function

### **Step 2: Verify**
Run this query to check if it's working:

```sql
-- Count total shortlists
SELECT COUNT(*) FROM request_shortlists;

-- See shortlist counts per request
SELECT 
  r.id,
  r.title,
  COUNT(rs.id) as shortlist_count
FROM requests r
LEFT JOIN request_shortlists rs ON rs.request_id = r.id
GROUP BY r.id, r.title
HAVING COUNT(rs.id) > 0
ORDER BY shortlist_count DESC;
```

---

## Technical Details

### Table Schema
```sql
request_shortlists (
  id UUID PRIMARY KEY,
  request_id UUID REFERENCES requests(id),
  csr_id UUID REFERENCES users(id),
  created_at TIMESTAMP,
  UNIQUE(request_id, csr_id)  -- Prevents duplicate shortlists
)
```

### RPC Function
```sql
get_request_shortlist_counts(request_ids UUID[])
RETURNS TABLE (request_id UUID, shortlist_count BIGINT)
```

### RLS Policies
- CSRs can only view/modify their own shortlists
- Platform Managers can view all shortlists
- Users can see counts via the RPC function (no direct table access)

---

## UI Changes

### Before:
```
[Pending] My Request
```

### After:
```
[Pending] ⭐ 3   My Request
         ↑
    Shortlist count (3 CSRs interested!)
```

---

## Benefits

1. **🔍 Transparency** - Users see how much interest their request is getting
2. **📊 Metrics** - Platform can track request popularity
3. **👥 Competition** - Multiple CSRs can compete for the same request
4. **⚡ Performance** - Efficient batch queries with caching
5. **🔒 Security** - Proper RLS policies protect data

---

## Testing

1. **As User:**
   - Login and go to "My Requests"
   - Look for star icons on request cards
   - Verify counts match database

2. **As CSR:**
   - Shortlist a pending request
   - Have another CSR shortlist the same request
   - Check user view to see count increase

3. **Database Check:**
   ```sql
   -- See all shortlists for a specific request
   SELECT 
     rs.request_id,
     u.name as csr_name,
     rs.created_at
   FROM request_shortlists rs
   JOIN users u ON u.id = rs.csr_id
   WHERE rs.request_id = 'YOUR_REQUEST_ID';
   ```

---

## Next Steps

After running the migration:
1. ✅ Test with multiple CSRs shortlisting the same request
2. ✅ Verify counts appear on user's request cards
3. ✅ Check that old shortlist system still works (backward compatible)
4. 🎯 Consider adding shortlist count to CSR dashboard analytics

---

## Questions?

- **Where is the count displayed?** → Next to the status badge on each request card
- **Can users see which CSRs shortlisted?** → No, only the count for privacy
- **Does this break existing CSR shortlists?** → No, data is automatically migrated
- **Is it performant?** → Yes, uses batch RPC queries with caching

