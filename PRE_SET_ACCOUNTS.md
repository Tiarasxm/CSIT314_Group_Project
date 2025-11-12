# Pre-Set Authority Accounts

This document contains the pre-created accounts for staff members with authority roles. These accounts are created in the database by developers and are not available for public registration.

## Account Types

There are **3 types of authority accounts**:
1. **Platform Manager** - Manages the website/platform (NOT users)
2. **User Admin** - Manages user accounts (only role that can manage users)
3. **CSR Representative** - Accepts requests on behalf of corporate volunteers

## Pre-Set Accounts

### 1. Platform Manager Account

**Email:** `platform.manager@csr-platform.com`  
**Password:** `PlatformManager2024!`  
**Role:** `platform-manager`  
**Name:** Platform Manager  
**Description:** Manages website content, platform settings, and general platform configuration. Does NOT manage user accounts.

---

### 2. User Admin Account

**Email:** `user.admin@csr-platform.com`  
**Password:** `UserAdmin2024!`  
**Role:** `user-admin`  
**Name:** User Administrator  
**Description:** The only role that can create, update, and manage user accounts. Can create Platform Manager and User Admin accounts.

---

### 3. CSR Representative Account

**Email:** `csr.representative@csr-platform.com`  
**Password:** `CSRRep2024!`  
**Role:** `csr-representative`  
**Name:** CSR Representative  
**Company:** Example Company A  
**Description:** Accepts volunteer requests on behalf of corporate volunteers. Finds opportunities for CVs to fulfill.

---

## Security Notes

⚠️ **IMPORTANT:**
- These passwords are for **development/testing purposes only**
- **Change these passwords immediately** in production
- Use strong, unique passwords in production environments
- Consider implementing password rotation policies
- Store production credentials securely (e.g., environment variables, secret management)

## Database Setup

These accounts should be created in Supabase using the following SQL script (see `supabase/migrations/001_create_pre_set_accounts.sql`):

```sql
-- Note: This is a template. Actual user creation should be done through Supabase Auth
-- and then linked to the users table with the appropriate role.

-- After creating auth users, insert into users table:
-- INSERT INTO users (id, email, name, role, created_at, updated_at)
-- VALUES 
--   ('<auth_user_id_1>', 'platform.manager@csr-platform.com', 'Platform Manager', 'platform-manager', NOW(), NOW()),
--   ('<auth_user_id_2>', 'user.admin@csr-platform.com', 'User Administrator', 'user-admin', NOW(), NOW()),
--   ('<auth_user_id_3>', 'csr.representative@csr-platform.com', 'CSR Representative', 'csr-representative', NOW(), NOW());
```

## Access Instructions

1. Navigate to `/staff/login`
2. Enter one of the email addresses above
3. Enter the corresponding password
4. You will be redirected to the appropriate dashboard based on your role

## Normal Users

Regular users (persons in need) must sign up through the public registration page at `/register`. They cannot access staff portals and will have the role `user` by default.

