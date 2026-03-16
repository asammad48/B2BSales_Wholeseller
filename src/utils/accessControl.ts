import { User } from '../repositories/authRepository';

export type Role = 'owner' | 'admin' | 'staff' | 'client';

export const ROLES: Record<string, Role> = {
  OWNER: 'owner',
  ADMIN: 'admin',
  STAFF: 'staff',
  CLIENT: 'client',
};

export const hasAccess = (user: User | null, requiredRoles: Role[]): boolean => {
  if (!user) return false;
  return requiredRoles.includes(user.role);
};

export const isAdminAppAccessible = (user: User | null): boolean => {
  if (!user) return false;
  return ['owner', 'admin', 'staff'].includes(user.role);
};

export const getRolePermissions = (role: Role) => {
  switch (role) {
    case 'owner':
      return { canManageUsers: true, canEditSettings: true, canViewReports: true, canDeleteData: true };
    case 'admin':
      return { canManageUsers: true, canEditSettings: true, canViewReports: true, canDeleteData: false };
    case 'staff':
      return { canManageUsers: false, canEditSettings: false, canViewReports: true, canDeleteData: false };
    default:
      return { canManageUsers: false, canEditSettings: false, canViewReports: false, canDeleteData: false };
  }
};
