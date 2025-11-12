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
├── lib/
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions (auth helpers, etc.)
└── components/
    └── ui/                  # Reusable UI components
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

# Add your Supabase credentials (see SUPABASE_SETUP.md for details)
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

- Role-based access control with 4 distinct user roles
- Request submission and management system
- CSR representative workflow for accepting requests
- User account management (User Admin only)
- Platform management (Platform Manager only)

## Development Notes

- **Pre-Set Accounts**: Authority accounts (Platform Manager, User Admin, CSR Representative) are pre-created. See `PRE_SET_ACCOUNTS.md` for credentials.
- **Normal Users**: Regular users must sign up through `/register`
- **User Admin**: The only role that can manage user accounts
- **Platform Manager**: Manages the website/platform, NOT users
- **CSR Representatives**: Accept requests on behalf of corporate volunteers
- **Database Setup**: See `SUPABASE_SETUP.md` for complete Supabase configuration
- **Environment Variables**: Never commit `.env.local` - it contains sensitive Supabase keys

## License

This project is part of CSIT314 Group Project.
