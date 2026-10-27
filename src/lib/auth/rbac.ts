import { UserRole } from '../../types';
import { ForbiddenError, UnauthorizedError } from '../db/errors';

export interface AuthenticatedUser {
  user_id: number;
  email: string;
  full_name: string;
  role: UserRole;
}

export type PermissionAction =
  | 'manage_users'
  | 'view_customers'
  | 'manage_customers'
  | 'view_vehicles'
  | 'manage_vehicles'
  | 'view_appointments'
  | 'manage_appointments'
  | 'view_jobs'
  | 'update_job_status'
  | 'manage_jobs'
  | 'view_reports'
  | 'create_reports'
  | 'view_inventory'
  | 'manage_inventory'
  | 'view_invoices'
  | 'manage_invoices'
  | 'record_payments';

const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  admin: [
    'manage_users',
    'view_customers',
    'manage_customers',
    'view_vehicles',
    'manage_vehicles',
    'view_appointments',
    'manage_appointments',
    'view_jobs',
    'update_job_status',
    'manage_jobs',
    'view_reports',
    'create_reports',
    'view_inventory',
    'manage_inventory',
    'view_invoices',
    'manage_invoices',
    'record_payments'
  ],
  service_advisor: [
    'view_customers',
    'manage_customers',
    'view_vehicles',
    'manage_vehicles',
    'view_appointments',
    'manage_appointments',
    'view_jobs',
    'manage_jobs',
    'update_job_status',
    'view_reports',
    'view_inventory',
    'view_invoices',
    'manage_invoices',
    'record_payments'
  ],
  mechanic: [
    'view_customers',
    'view_vehicles',
    'view_appointments',
    'view_jobs',
    'update_job_status',
    'view_reports',
    'create_reports',
    'view_inventory'
  ]
};

export function checkPermission(user: AuthenticatedUser, action: PermissionAction): boolean {
  if (user.role === 'admin') return true;
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(action);
}

export function enforcePermission(user: AuthenticatedUser, action: PermissionAction): void {
  if (!checkPermission(user, action)) {
    throw new ForbiddenError(`User with role '${user.role}' is not authorized to perform '${action}'`);
  }
}

export function enforceRoles(user: AuthenticatedUser, allowedRoles: UserRole[]): void {
  if (user.role === 'admin') return;
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(`Access denied for role '${user.role}'`);
  }
}

