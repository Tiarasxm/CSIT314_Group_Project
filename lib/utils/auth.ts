import { UserRole } from "@/lib/types";

/**
 * Check if a user role has permission to perform an action
 */
export function hasPermission(
  userRole: UserRole,
  requiredRole: UserRole | UserRole[]
): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    "platform-manager": 4,
    "user-admin": 3,
    "csr-representative": 2,
    "user": 1,
  };

  const userLevel = roleHierarchy[userRole];
  const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  return requiredRoles.some(
    (role) => userLevel >= roleHierarchy[role]
  );
}

/**
 * Check if user can manage other users
 * Only User Admin can manage user accounts
 */
export function canManageUsers(userRole: UserRole): boolean {
  return userRole === "user-admin";
}

/**
 * Check if user can manage platform/website
 * Only Platform Manager can manage the website
 */
export function canManagePlatform(userRole: UserRole): boolean {
  return userRole === "platform-manager";
}

/**
 * Check if user can accept requests
 * CSR Representatives can accept requests on behalf of corporate volunteers
 */
export function canAcceptRequests(userRole: UserRole): boolean {
  return userRole === "csr-representative";
}

