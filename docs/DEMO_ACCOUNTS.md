# 🎭 Demo Accounts & Test Data

## 📝 What Was Created

✅ **4 Demo User Accounts**
✅ **100 Test Requests** (distributed across all users)

---

## 👥 Demo User Accounts

All demo users have the same password: **`DemoUser123!`**

| Name | Email | Gender | DOB | Mobile |
|------|-------|--------|-----|--------|
| **John Smith** | john.smith@demo.com | Male | 1990-05-15 | +65 9123 4567 |
| **Sarah Johnson** | sarah.johnson@demo.com | Female | 1985-08-22 | +65 9234 5678 |
| **Michael Chen** | michael.chen@demo.com | Male | 1992-11-30 | +65 9345 6789 |
| **Emily Rodriguez** | emily.rodriguez@demo.com | Female | 1988-03-18 | +65 9456 7890 |

---

## 📊 Test Requests Distribution

**Total:** 100 requests created with realistic data

**Status Distribution:**
- ~20 Pending
- ~30 Confirmed (with volunteer assigned)
- ~30 Completed
- ~20 Withdrawn

**Categories Covered:**
- Household Support (cleaning, furniture moving, repairs, gardening)
- Transportation (hospital rides, grocery shopping, pharmacy)
- Medical Assistance (doctor visits, medication help, therapy)
- Food & Groceries (shopping, meal prep, cooking)
- Technology Support (computer setup, smartphone training)
- Other (companionship, pet care, mail, bills)

**Locations:** Various neighborhoods across Singapore
- Ang Mo Kio, Bedok, Bishan, Clementi, Hougang
- Jurong West, Pasir Ris, Punggol, Sengkang, Tampines
- Toa Payoh, Woodlands, Yishun

**Time Preferences:** Morning, Afternoon, Evening, Unspecified

**Date Range:** Requests created over the last 90 days

---

## 🚀 How to Use

### 1. Run the SQL Script

Go to Supabase SQL Editor and run:
```
supabase/migrations/036_create_demo_data.sql
```

Or copy-paste the entire script from the file.

### 2. Login as Demo Users

**Production:** https://csit-314-group-project-b65fuxm98-titapas-projects.vercel.app/login

**Local:** http://localhost:3000/login

Use any of the demo emails with password: `DemoUser123!`

### 3. Test Features

- ✅ View requests (each user will see their own requests)
- ✅ Submit new requests
- ✅ Withdraw requests
- ✅ Mark requests as completed
- ✅ View past requests

### 4. Test as CSR

Login as CSR to see all 100 demo requests:

**CSR Login:** https://csit-314-group-project-b65fuxm98-titapas-projects.vercel.app/staff/login

- Email: `csr.representative@csr-platform.com`
- Password: `CSRRep2024!`

You'll see:
- ~20 pending requests to assign
- ~30 confirmed requests to manage
- ~30 completed requests in history

---

## 🧹 Clean Up Demo Data (Optional)

If you want to remove all demo data later:

```sql
-- Delete all demo requests
DELETE FROM requests 
WHERE user_id IN (
  SELECT id FROM users WHERE email LIKE '%@demo.com'
);

-- Delete demo users from public.users
DELETE FROM users WHERE email LIKE '%@demo.com';

-- Delete demo users from auth.users
DELETE FROM auth.users WHERE email LIKE '%@demo.com';
```

---

## 📈 Use Cases

This demo data is perfect for:

1. **Testing dashboards** - See how UI handles many requests
2. **Testing filters** - Filter by status, category, date
3. **Testing search** - Search through 100 requests
4. **Testing CSV exports** - Export large datasets
5. **Demo presentations** - Show full system with realistic data
6. **Performance testing** - See how app handles multiple users
7. **Analytics testing** - Test Platform Manager reports with real volume

---

## ⚠️ Important Notes

- All demo users are **NOT suspended** (can login and create requests)
- Demo requests are spread over **last 90 days** for realistic timeline
- Completed/Confirmed requests have **volunteer assignments** from CSR
- No images attached to requests (as requested)
- Mobile numbers follow Singapore format (+65)
- All emails are @demo.com (easy to identify and clean up)

---

## 🎯 Quick Login URLs

**Local Development:**
- User Login: http://localhost:3000/login
- Staff Login: http://localhost:3000/staff/login

**Production:**
- User Login: https://csit-314-group-project-b65fuxm98-titapas-projects.vercel.app/login
- Staff Login: https://csit-314-group-project-b65fuxm98-titapas-projects.vercel.app/staff/login

---

## ✅ Next Steps

1. Run the SQL script in Supabase
2. Login as any demo user to see their requests
3. Login as CSR to manage all requests
4. Login as Platform Manager to see analytics with 100 requests
5. Test all features with realistic data volume

Enjoy your fully populated demo environment! 🎉

