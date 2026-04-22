export function canAccess(userRole, allowedRoles) {
  return allowedRoles.includes(userRole);
}
