# Authentication Controllers - Test-Driven Development Documentation

## Overview

This document outlines the authentication flow controllers for the CSR Platform, including signup, login, and logout functionality. The system supports multiple user roles and authentication methods (email/password and Google OAuth).

## User Roles

- **user**: Normal users (Persons in Need)
- **platform-manager**: Platform administrators
- **user-admin**: User account administrators
- **csr-representative**: CSR representatives

---

## 1. User Registration (Sign Up)

### Controller Location
- **File**: `app/(auth)/register/page.tsx`
- **Type**: Client Component

### Flow Description

1. User submits registration form with:
   - First Name
   - Last Name
   - Email
   - Password
   - Confirm Password

2. System validates password match

3. Creates account via Supabase Auth:
   ```typescript
   await supabase.auth.signUp({
     email: formData.email,
     password: formData.password,
     options: {
       data: {
         first_name: formData.firstName,
         last_name: formData.lastName,
         role: "user", // Always "user" for public signups
       },
     },
   });
   ```

4. Shows email confirmation modal (for email/password signup)

5. Redirects to login after modal close

### Google OAuth Sign Up

- Redirects to Google OAuth flow
- Callback handled by `/auth/callback` route
- Automatically creates user record in database
- Redirects directly to `/user/dashboard`

### Test Scenarios

**Email/Password Signup:**
- ✅ Valid registration creates account
- ✅ Password mismatch shows error
- ✅ Duplicate email shows error
- ✅ Email confirmation modal displays
- ✅ Form resets after successful signup

**Google OAuth Signup:**
- ✅ Redirects to Google OAuth
- ✅ New user created in database with role "user"
- ✅ Redirects to user dashboard

---

## 2. User Login

### Controller Location
- **File**: `app/(auth)/login/login-content.tsx`
- **Type**: Client Component

### Flow Description

1. User submits email and password

2. Authenticates via Supabase:
   ```typescript
   await supabase.auth.signInWithPassword({
     email: formData.email,
     password: formData.password,
   });
   ```

3. Fetches user role from database:
   ```typescript
   const { data: userData } = await supabase
     .from("users")
     .select("role")
     .eq("id", data.user.id)
     .single();
   ```

4. Redirects based on role:
   - `user` → `/user/dashboard`
   - `platform-manager` → `/platform-manager/dashboard`
   - `user-admin` → `/user-admin/dashboard`
   - `csr-representative` → `/csr-representative/dashboard`

5. Uses hard redirect (`window.location.href`) to ensure session cookies are set

### Google OAuth Login

- Redirects to Google OAuth flow
- Callback handled by `/auth/callback` route
- Redirects to appropriate dashboard based on role

### Test Scenarios

**Email/Password Login:**
- ✅ Valid credentials redirect to correct dashboard
- ✅ Invalid credentials show error message
- ✅ Missing user record shows error
- ✅ Role-based redirection works correctly
- ✅ Session cookies are properly set

**Google OAuth Login:**
- ✅ Redirects to Google OAuth
- ✅ Existing user redirected to correct dashboard
- ✅ New user created and redirected to user dashboard

**Error Handling:**
- ✅ Displays error messages from URL params
- ✅ Displays success messages from URL params

---

## 3. Staff Login

### Controller Location
- **File**: `app/staff/login/page.tsx`
- **Type**: Client Component

### Flow Description

1. Staff member submits email and password

2. Authenticates via Supabase (same as user login)

3. Validates user exists in `users` table:
   ```typescript
   const { data: userData } = await supabase
     .from("users")
     .select("role, email, name")
     .eq("id", data.user.id)
     .single();
   ```

4. Validates role is staff:
   - `platform-manager`
   - `user-admin`
   - `csr-representative`

5. Redirects to appropriate staff dashboard

6. If user doesn't exist or wrong role:
   - Signs out the user
   - Shows error message
   - Stays on login page

### Test Scenarios

- ✅ Valid staff credentials redirect to correct dashboard
- ✅ Non-staff user shows "not authorized" error
- ✅ User not in database shows error
- ✅ Invalid credentials show error
- ✅ User is signed out if unauthorized

---

## 4. OAuth Callback Handler

### Controller Location
- **File**: `app/auth/callback/route.ts`
- **Type**: API Route (Server-side)

### Flow Description

**Email Confirmation:**
```typescript
if (token && (type === "signup" || type === "email")) {
  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: type === "signup" ? "signup" : "email",
  });
  
  if (data?.user) {
    return NextResponse.redirect("/email-confirmed");
  }
  return NextResponse.redirect("/login?error=Invalid link");
}
```

**Google OAuth:**
```typescript
if (code) {
  await supabase.auth.exchangeCodeForSession(code);
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check if user exists, create if new
  // Redirect based on role
}
```

### Test Scenarios

- ✅ Email confirmation token verifies successfully
- ✅ Invalid/expired token redirects to login with error
- ✅ Google OAuth code exchanges for session
- ✅ New Google user created in database
- ✅ Existing Google user redirected correctly
- ✅ Role-based redirection works

---

## 5. Logout

### Controller Location
- **Multiple locations**: Sidebar component, Dashboard pages
- **Type**: Client Component

### Flow Description

**User Logout:**
```typescript
const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push("/login");
};
```

**Staff Logout:**
```typescript
const handleLogout = async () => {
  await supabase.auth.signOut();
  router.push("/staff/login");
};
```

### Test Scenarios

- ✅ User logout clears session and redirects to `/login`
- ✅ Staff logout clears session and redirects to `/staff/login`
- ✅ Session is invalidated after logout
- ✅ Protected routes redirect after logout

---

## 6. Middleware (Session Management)

### Controller Location
- **File**: `middleware.ts`
- **Type**: Next.js Middleware

### Flow Description

1. Creates Supabase server client for each request

2. Refreshes session:
   ```typescript
   const { data: { session } } = await supabase.auth.getSession();
   const { data: { user } } = await supabase.auth.getUser();
   ```

3. Protects staff routes:
   ```typescript
   if (pathname.startsWith("/platform-manager") || 
       pathname.startsWith("/user-admin") || 
       pathname.startsWith("/csr-representative")) {
     if (!user) {
       return NextResponse.redirect("/staff/login");
     }
   }
   ```

4. Allows `/staff/login` to be accessible

### Test Scenarios

- ✅ Session refreshed on each request
- ✅ Unauthenticated users redirected from staff routes
- ✅ Authenticated users can access protected routes
- ✅ `/staff/login` is accessible without authentication

---

## Key Dependencies

- **Supabase Client**: `@/lib/supabase/client` (client-side)
- **Supabase Server**: `@/lib/supabase/server` (server-side)
- **Next.js Router**: `next/navigation` (client-side routing)
- **Next.js Middleware**: `next/server` (server-side routing)

---

## Database Schema Requirements

### `users` Table
- `id` (UUID, references `auth.users`)
- `email` (TEXT, unique)
- `name` (TEXT)
- `first_name` (TEXT, nullable)
- `last_name` (TEXT, nullable)
- `role` (TEXT, enum: 'user', 'platform-manager', 'user-admin', 'csr-representative')

### Database Triggers
- `handle_new_user()`: Automatically creates `users` record when `auth.users` record is created

---

## Error Handling Patterns

### Client-Side Errors
```typescript
try {
  const { data, error } = await supabase.auth.signInWithPassword({...});
  if (error) throw error;
} catch (err: any) {
  setError(err.message || "Default error message");
}
```

### Server-Side Errors
```typescript
if (error) {
  return NextResponse.redirect(
    new URL("/login?error=Error message", request.url)
  );
}
```

---

## Security Considerations

1. **Password Validation**: Handled by Supabase (min length, complexity)
2. **Email Verification**: Required for email/password signups
3. **Session Management**: Handled by Supabase with automatic refresh
4. **Role-Based Access**: Enforced at middleware and component levels
5. **RLS Policies**: Database-level security for user data access

---

## Test Checklist

### Registration Tests
- [ ] Email/password signup creates account
- [ ] Password mismatch validation
- [ ] Email confirmation modal displays
- [ ] Google OAuth signup creates account
- [ ] New users get "user" role by default

### Login Tests
- [ ] Email/password login with valid credentials
- [ ] Invalid credentials show error
- [ ] Role-based redirection works
- [ ] Google OAuth login works
- [ ] Session cookies are set correctly

### Staff Login Tests
- [ ] Staff can login with pre-created accounts
- [ ] Non-staff users are rejected
- [ ] Missing user record shows error
- [ ] Role-based redirection for staff

### Logout Tests
- [ ] User logout clears session
- [ ] Staff logout clears session
- [ ] Redirects to correct login page
- [ ] Protected routes inaccessible after logout

### Middleware Tests
- [ ] Session refreshed on each request
- [ ] Unauthenticated users redirected
- [ ] Staff routes protected
- [ ] Public routes accessible

---

## Notes for Test Implementation

1. **Mock Supabase Client**: Use Supabase's testing utilities or mock the client
2. **Test OAuth Flow**: Mock the OAuth redirect and callback
3. **Test Session Management**: Verify cookies are set/cleared correctly
4. **Test Role-Based Access**: Verify redirects based on user role
5. **Test Error States**: Verify error messages display correctly

