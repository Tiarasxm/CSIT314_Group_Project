# CSR Platform

A platform that connects persons in need with corporate volunteers through CSR (Corporate Social Responsibility) representatives.

## Overview

This system provides a platform where:
- **Persons in Need (Users)** can submit requests for help
- **CSR Representatives** can accept requests on behalf of their company's corporate volunteers (CVs)
- **User Admins** manage user accounts (the only role that can)
- **Platform Managers** manage the website/platform settings (NOT user accounts)

## User Roles & Hierarchy

The platform has 4 user roles based on hierarchy:

1. **Platform Manager** - Manages the website/platform, NOT users
2. **User Admin** - Manages user accounts (only role that can manage users)
3. **CSR Representative** - Accepts requests on behalf of corporate volunteers
4. **User** - Persons in need who submit requests for help

### Role Permissions

- **Platform Manager**: Can manage website content, settings, and platform configuration
- **User Admin**: Can create, update, and manage all user accounts (including creating Platform Manager and User Admin accounts)
- **CSR Representative**: Can browse and accept requests on behalf of their company's corporate volunteers
- **User**: Can submit requests for help and track their status

## Project Structure

```
├── app/
│   ├── (auth)/              # Authentication routes (login, register)
│   │   ├── login/
│   │   └── register/
│   ├── platform-manager/    # Platform Manager dashboard
│   ├── user-admin/          # User Admin dashboard
│   ├── csr-representative/  # CSR Representative dashboard
│   ├── user/                # User dashboard
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/
│   └── ui/                  # Reusable UI components
├── docs/                    # Documentation (40+ guides)
│   ├── SETUP_DATABASE.md
│   ├── DEPLOY_TO_VERCEL.md
│   ├── DEMO_DATA_README.md
│   └── ... (see docs folder for all guides)
├── lib/
│   ├── hooks/               # Custom React hooks
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── supabase/            # Supabase client configuration
├── supabase/
│   └── migrations/          # Database migrations
└── scripts/                 # Utility scripts
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd CSIT314_Group_Project
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp .env.example .env.local

# Add your Supabase credentials (see docs/SUPABASE_SETUP.md for details)
# Get your keys from: Supabase Dashboard → Settings → API
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Technology Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database & Authentication**: Supabase (PostgreSQL + Auth)

## Key Features

- **Role-based Access Control**: 4 distinct user roles with specific permissions
- **Request Management**: Submit, track, and manage service requests
- **CSR Competitive Assignment**: Multiple CSRs can compete to accept and assign volunteers
- **Request Shortlisting**: CSRs can shortlist requests for later assignment
- **Account Suspension**: User Admins can suspend/reactivate user accounts
- **Dynamic Categories**: Platform Managers can add, edit, and remove service categories
- **Announcements System**: Platform-wide announcements for all users
- **Analytics & Reports**: Comprehensive reporting with PDF export
- **Profile Management**: User Admins can edit CSR profiles
- **PDF Export**: Export requests and analytics reports

## Development Notes

- **Pre-Set Accounts**: Authority accounts (Platform Manager, User Admin, CSR Representative) are pre-created. See `docs/PRE_SET_ACCOUNTS.md` for credentials.
- **Demo Data**: 4 demo users and 100 test requests available. See `docs/DEMO_DATA_README.md` for details.
- **Normal Users**: Regular users must sign up through `/register`
- **User Admin**: The only role that can manage user accounts
- **Platform Manager**: Manages the website/platform, NOT users
- **CSR Representatives**: Accept requests on behalf of corporate volunteers
- **Database Setup**: See `docs/SETUP_DATABASE.md` for complete Supabase configuration
- **Environment Variables**: Never commit `.env.local` - it contains sensitive Supabase keys

## Documentation

All documentation has been organized in the `docs/` folder. Key guides:

### Setup & Configuration
- `docs/SETUP_DATABASE.md` - Database setup and migrations
- `docs/SUPABASE_SETUP.md` - Complete Supabase configuration
- `docs/ENV_SETUP.md` - Environment variables guide
- `docs/STORAGE_SETUP.md` - File storage configuration

### Deployment
- `docs/DEPLOY_TO_VERCEL.md` - Vercel deployment guide
- `docs/DEPLOYMENT_CHECKLIST.md` - Complete deployment checklist
- `docs/WHAT_TO_CHANGE.md` - Quick deployment summary

### Features & Setup
- `docs/DEMO_DATA_README.md` - Demo user accounts and test data
- `docs/CATEGORIES_SETUP.md` - Dynamic categories configuration
- `docs/SHORTLIST_COUNT_FEATURE.md` - Request shortlisting feature
- `docs/CSR_COMPETITIVE_ASSIGNMENT.md` - Competitive assignment system
- `docs/PLATFORM_MANAGER_SETUP.md` - Platform Manager features

### Troubleshooting
- `docs/TROUBLESHOOT_STAFF_LOGIN.md` - Staff login issues
- `docs/TROUBLESHOOT_PROFILE_IMAGE.md` - Profile image issues
- `docs/CSR_LOGIN_FIX.md` - CSR authentication fixes

See the `docs/` folder for all 40+ documentation files.

## License

This project is part of CSIT314 Group Project.
