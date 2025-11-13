# 🎯 Categories Management Setup

## What's New?
Categories are now stored in the database and managed by Platform Managers. When categories are updated, **all parties** (Users, CSRs, User Admins, Platform Managers) see the changes immediately!

---

## 🚀 Quick Setup

### Step 1: Run the Migration

Go to **Supabase Dashboard** → **SQL Editor** and run:

**File:** `COPY_PASTE_MIGRATION_030.sql`

This creates:
- ✅ `categories` table
- ✅ 6 default categories (Household Support, Transportation, etc.)
- ✅ RLS policies (everyone can read, only Platform Manager can edit)

---

## ✅ What's Been Updated

### Files Modified:

1. **`app/platform-manager/categories/page.tsx`**
   - ✅ Now fetches categories from database
   - ✅ Add/Edit/Remove operations save to database
   - ✅ Changes affect all users instantly

2. **`app/user/requests/new/page.tsx`**
   - ✅ Fetches categories from database dynamically
   - ✅ Category dropdown shows latest categories from Platform Manager

3. **`supabase/migrations/030_create_categories_table.sql`**
   - ✅ Creates categories table with RLS policies

---

## 🎨 Features

### For Platform Managers:
- ✅ **Add** new service categories
- ✅ **Edit** existing category names
- ✅ **Remove** categories (with confirmation)
- ✅ Categories are ordered by display order
- ✅ All changes save to database

### For All Users:
- ✅ See updated categories immediately when submitting new requests
- ✅ Categories are always in sync across the platform
- ✅ No need to refresh - categories load dynamically

---

## 🔐 Security (RLS Policies)

1. **"Anyone can read active categories"**
   - All authenticated users can view active categories
   - Used when submitting new requests

2. **"Platform Managers can view all categories"**
   - Platform Managers see all categories (including inactive)
   - Allows full management capabilities

3. **"Platform Managers can manage categories"**
   - Only Platform Managers can add/edit/remove
   - Ensures data integrity

---

## 🧪 Testing

1. **Login as Platform Manager:**
   - Email: `platform.manager@csr-platform.com`
   - Password: `PlatformManager2024!`

2. **Go to Categories:** `/platform-manager/categories`

3. **Test Operations:**
   - ✅ Add a new category (e.g., "Pet Care")
   - ✅ Edit an existing category
   - ✅ Remove a category

4. **Verify on User Side:**
   - Login as a regular user
   - Go to "Submit New Request"
   - Check that the category dropdown shows your changes!

---

## 📊 Database Schema

```sql
categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_order INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Default Categories:
1. Household Support
2. Transportation
3. Medical Assistance
4. Food & Groceries
5. Technology Support
6. Other

---

## 🔧 Troubleshooting

### Issue: Categories not showing on user form
**Solution:** 
1. Verify migration 030 ran successfully
2. Check that categories have `is_active = true`
3. Ensure RLS policy "Anyone can read active categories" exists

### Issue: Platform Manager cannot add/edit categories
**Solution:**
1. Verify migration 030 ran successfully
2. Check that Platform Manager role is correct
3. Ensure policy "Platform Managers can manage categories" exists

### Issue: Duplicate category error
**Solution:** Category names must be unique. Try a different name.

---

## 📝 Notes

- Categories are ordered by `display_order` field
- Inactive categories are hidden from users but visible to Platform Managers
- Existing requests retain their original category even if deleted
- Category names must be unique (case-insensitive check)

---

## ✅ Verification Checklist

- [ ] Migration 030 successfully run
- [ ] Can login as Platform Manager
- [ ] Can add new category
- [ ] Can edit existing category
- [ ] Can remove category
- [ ] User's "New Request" form shows updated categories
- [ ] Changes reflect immediately across all parties

---

## 🎉 Complete!

Categories are now fully dynamic and managed by the Platform Manager!

**Who sees the changes:**
- ✅ Users (when submitting new requests)
- ✅ CSRs (when viewing request categories)
- ✅ User Admins (when viewing user requests)
- ✅ Platform Managers (when managing categories)

**All parties** now use the same centralized categories database! 🚀

