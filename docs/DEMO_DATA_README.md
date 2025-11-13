# Demo Data Setup ✅

## Overview
This project includes a robust demo data generation script that creates 4 test users and 100 realistic service requests.

## Script Location
```
supabase/migrations/036_create_demo_data_v3.sql
```

## Features
- ✅ **Idempotent**: Run multiple times safely (uses UPSERT)
- ✅ **Fixed UUIDs**: Users have predictable IDs for testing
- ✅ **Realistic Data**: 100 varied requests across 6 categories
- ✅ **Status Distribution**: Pending, accepted, completed, cancelled
- ✅ **Volunteer Assignments**: Automatically assigned to accepted/completed requests

## Demo User Credentials

### Users
1. **John Smith**
   - Email: `john.smith@demo.com`
   - Password: `DemoUser123!`
   - Gender: Male
   - Contact: 91234567

2. **Sarah Johnson**
   - Email: `sarah.johnson@demo.com`
   - Password: `DemoUser123!`
   - Gender: Female
   - Contact: 92345678

3. **Michael Chen**
   - Email: `michael.chen@demo.com`
   - Password: `DemoUser123!`
   - Gender: Male
   - Contact: 93456789

4. **Emily Rodriguez**
   - Email: `emily.rodriguez@demo.com`
   - Password: `DemoUser123!`
   - Gender: Female
   - Contact: 94567890

## How to Run

### In Supabase SQL Editor:
1. Open Supabase Dashboard → SQL Editor
2. Copy entire `036_create_demo_data_v3.sql`
3. Paste and run
4. Verify output shows:
   ```
   ✅ Upserted 4 demo users
   ✅ Created 100 demo requests
   Demo Users: 4
   Demo Requests: 100
   ```

## Request Categories
- Household Support
- Transportation
- Medical Assistance
- Food & Groceries
- Technology Support
- Other

## Request Status Distribution
- **20%** Pending (new requests)
- **30%** Accepted (assigned to volunteers)
- **30%** Completed (finished services)
- **20%** Cancelled (withdrawn)

## Database Schema Compatibility
- Uses `preferred_at` (timestamp) for scheduling
- Uses valid status values: `pending`, `accepted`, `completed`, `cancelled`
- Includes volunteer assignments for accepted/completed requests
- Distributes requests across realistic Singapore locations

## Rerunning the Script
The script is fully rerunnable:
1. Deletes all old requests for demo users
2. UPSERTs user records (updates if exists, creates if not)
3. Creates fresh 100 requests every time

## Clean Demo Environment
To reset just the requests (keep users):
```sql
DELETE FROM requests 
WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%@demo.com'
);
```

To remove everything including demo users:
```sql
DELETE FROM requests 
WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%@demo.com'
);

DELETE FROM auth.users WHERE email LIKE '%@demo.com';
DELETE FROM public.users WHERE email LIKE '%@demo.com';
```

## Notes
- Demo users have fixed UUIDs for consistency
- Requests span 90 days of history
- Preferred dates are set 7 days from creation date
- Locations are realistic Singapore neighborhoods
- Volunteer assignments use diverse names and phone numbers

