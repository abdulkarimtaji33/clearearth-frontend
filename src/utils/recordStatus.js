import { userCan } from './authHelpers';

/** One-click approve via the qualify endpoints needs manager authority (`workflow.manager`). */
export const canDirectManagerApprove = (user) => userCan(user, 'workflow.manager');

/**
 * Whether the user can change workflow status on an edit form (not via approval PIN flow).
 */
export const canChangeRecordStatus = (user, hasPermission, approvePermission) => {
  if (userCan(user, 'workflow.manager')) return true;
  if (approvePermission && hasPermission(approvePermission)) return true;
  return false;
};

export const formatStatusLabel = (status) => String(status || '—').replace(/_/g, ' ');
