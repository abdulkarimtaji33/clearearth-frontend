import { userCan } from './authHelpers';

/** Inspectors record reports under their own name — the `inspection_reports.perform` permission. */
export const isInspectionRole = (user) => userCan(user, 'inspection_reports.perform');

/** Approving an inspection report — the `inspection_reports.approve` permission. */
export const canApproveInspectionReport = (user) => userCan(user, 'inspection_reports.approve');

export const formatUserDisplayName = (user) => {
  if (!user) return '';
  return [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || '';
};

export const resolveInspectorIdForReport = (user, existingInspectorId = null) => {
  if (isInspectionRole(user)) return user?.id ?? existingInspectorId ?? null;
  return existingInspectorId ?? null;
};
