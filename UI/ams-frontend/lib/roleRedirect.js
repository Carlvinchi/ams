/* Role-based redirection and access control utilities
    Defines dashboard paths for different user roles and provides functions
    to get the appropriate dashboard URL and check access permissions based on roles.
 */

export const ROLE_DASHBOARDS = {
  admin: '/admin/',
  coach: '/coach/',
  athlete: '/athlete/',
}

export function getDashboardForRole(role) {
  return ROLE_DASHBOARDS[role] || '/login'
}

export function canAccessRole(userRole, allowedRoles) {
  if (!allowedRoles || allowedRoles.length === 0) return true
  return allowedRoles.includes(userRole)
}