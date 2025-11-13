# CSR Representative Accounts

This document lists all CSR Representative accounts available in the system.

## 📋 All CSR Accounts

### CSR 1 (Original)
- **Email:** `csr.representative@csr-platform.com`
- **Password:** `CSRPassword123!`
- **Name:** CSR Representative
- **Status:** Active

### CSR 2 - Sarah Johnson (NEW)
- **Email:** `csr2@csr-platform.com`
- **Password:** `CSRPassword123!`
- **Name:** Sarah Johnson
- **Status:** Active

### CSR 3 - Michael Chen (NEW)
- **Email:** `csr3@csr-platform.com`
- **Password:** `CSRPassword123!`
- **Name:** Michael Chen
- **Status:** Active

### CSR 4 - Emily Rodriguez (NEW)
- **Email:** `csr4@csr-platform.com`
- **Password:** `CSRPassword123!`
- **Name:** Emily Rodriguez
- **Status:** Active

---

## 🚀 How to Create These Accounts

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Copy and paste the contents of:
   ```
   supabase/migrations/018_add_more_csr_accounts.sql
   ```
4. Click **Run**
5. Check the output to verify all 4 CSR accounts are listed

### Option 2: Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

---

## 🔐 Login Instructions

### Staff Login Page
1. Navigate to: `http://localhost:3000/staff/login`
2. Enter one of the CSR email addresses above
3. Enter password: `CSRPassword123!`
4. Click **Sign In**

You will be redirected to the CSR Representative dashboard.

---

## ✅ Verification

After running the migration, verify the accounts exist:

```sql
-- Run this in Supabase SQL Editor
SELECT 
  email,
  name,
  role,
  is_suspended,
  created_at
FROM users
WHERE role = 'csr-representative'
ORDER BY created_at DESC;
```

You should see all 4 CSR accounts listed.

---

## 🎯 Use Cases

### Testing Different Scenarios:
1. **CSR 1** - Main testing account
2. **CSR 2 (Sarah)** - Test concurrent CSR operations
3. **CSR 3 (Michael)** - Test request assignment conflicts
4. **CSR 4 (Emily)** - Test suspension functionality

### Demo/Presentation:
- Each account can demonstrate different aspects of CSR functionality
- Can show multiple CSRs working on different requests simultaneously
- Can demonstrate CSR collaboration features

---

## 🛡️ Security Notes

⚠️ **Important:**
- These are **development/testing accounts** only
- Change passwords before production deployment
- Never commit real passwords to version control
- Use environment variables for production credentials

---

## 📊 Default Password

All CSR accounts use the same password for testing convenience:
```
CSRPassword123!
```

**For Production:**
- Generate unique passwords for each account
- Use a password manager
- Enforce password rotation policies
- Enable 2FA if available

---

## 🔄 Account Management

### To Suspend a CSR Account:
Login as **User Admin** and navigate to User Management to suspend any CSR.

### To Change Password:
```sql
-- Replace with actual user ID and new password
UPDATE auth.users
SET encrypted_password = crypt('NewPassword123!', gen_salt('bf'))
WHERE email = 'csr2@csr-platform.com';
```

### To Delete an Account:
```sql
-- Be careful! This will cascade delete all related data
DELETE FROM users WHERE email = 'csr2@csr-platform.com';
```

---

## 📝 CSR Capabilities

All CSR accounts can:
- ✅ View new requests
- ✅ Accept and assign volunteers to requests
- ✅ Update volunteer information
- ✅ Mark requests as complete
- ✅ Manage their shortlist
- ✅ View active assignments
- ✅ View completed services
- ✅ Export requests to PDF
- ✅ Search and filter requests

CSRs **cannot**:
- ❌ Access User Admin functions
- ❌ Access Platform Manager functions
- ❌ Suspend other users
- ❌ Modify system settings
- ❌ Create other CSR accounts

---

## 🎓 Testing Scenarios

### Scenario 1: Multiple CSRs, Same Request
1. Login as CSR 1
2. View a pending request
3. Login as CSR 2 (different browser/incognito)
4. Both try to accept the same request
5. Verify only one succeeds

### Scenario 2: Request Assignment Flow
1. CSR 1 accepts a request
2. CSR 1 assigns a volunteer
3. CSR 2 tries to modify (should fail)
4. CSR 1 marks as complete

### Scenario 3: Suspension Test
1. User Admin suspends CSR 2
2. CSR 2 tries to assign volunteer
3. Verify suspension modal appears
4. User Admin reactivates CSR 2
5. CSR 2 can now assign volunteers

---

## 📞 Support

If accounts are not working:
1. Check the migration was applied successfully
2. Verify in Supabase Dashboard → Authentication → Users
3. Check browser console for errors
4. Verify RLS policies are enabled

---

**Last Updated:** Created with migration 018
**Total CSR Accounts:** 4

