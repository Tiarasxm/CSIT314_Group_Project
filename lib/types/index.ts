/**
 * User roles in the CSR Platform
 * Hierarchy: Platform Manager > User Admin > CSR Representative > User
 */
export type UserRole = 
  | "platform-manager"  // Manages the website/platform, NOT users
  | "user-admin"        // Manages user accounts (only role that can)
  | "csr-representative" // Accepts requests on behalf of corporate volunteers
  | "user";             // Persons in need who submit requests

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId?: string; // For CSR reps and corporate volunteers
  createdAt: Date;
  updatedAt: Date;
}

export interface Request {
  id: string;
  userId: string; // Person in need who submitted
  title: string;
  description: string;
  location?: string;
  status: "pending" | "accepted" | "in-progress" | "completed" | "cancelled";
  acceptedBy?: string; // CSR Representative ID
  companyId?: string; // Company that accepted
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  csrRepresentativeId: string;
  corporateVolunteers: string[]; // Array of user IDs
  createdAt: Date;
}

