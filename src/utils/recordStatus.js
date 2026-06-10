/** Roles that may change record status from edit forms. */
const MANAGER_ROLES = ['sales_manager', 'admin', 'tenant_admin', 'super_admin', 'operations_manager'];

/**
 * Whether the user can change workflow status on an edit form (not via approval PIN flow).
 */
export const canChangeRecordStatus = (user, hasPermission, approvePermission) => {
  const role = user?.role?.name ?? user?.role;
  if (MANAGER_ROLES.includes(role)) return true;
  if (approvePermission && hasPermission(approvePermission)) return true;
  return false;
};

export const formatStatusLabel = (status) => String(status || '—').replace(/_/g, ' ');
