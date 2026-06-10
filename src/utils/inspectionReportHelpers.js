import { getUserRole } from './authHelpers';

export const INSPECTION_ROLE_NAMES = ['inspection_team', 'inspection'];
export const INSPECTION_REPORT_APPROVER_ROLES = ['operations_manager', 'admin', 'tenant_admin', 'super_admin'];

export const isInspectionRole = (user) => INSPECTION_ROLE_NAMES.includes(getUserRole(user));

export const canApproveInspectionReport = (user) => INSPECTION_REPORT_APPROVER_ROLES.includes(getUserRole(user));

export const formatUserDisplayName = (user) => {
  if (!user) return '';
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || '';
};

export const resolveInspectorIdForReport = (user, existingInspectorId = null) => {
  if (isInspectionRole(user)) return user?.id ?? existingInspectorId ?? null;
  return existingInspectorId ?? null;
};
