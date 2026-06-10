/** Roles that may change record status from edit forms. */
const MANAGER_ROLES = ['sales_manager', 'admin', 'tenant_admin', 'super_admin', 'operations_manager'];

/** Roles allowed to one-click approve via qualify endpoints (matches backend MANAGER_ROLES). */
const DIRECT_APPROVE_ROLES = ['sales_manager', 'admin', 'tenant_admin', 'super_admin'];

export const canDirectManagerApprove = (user) => {
  const role = user?.role?.name ?? user?.role;
  return DIRECT_APPROVE_ROLES.includes(role);
};

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
