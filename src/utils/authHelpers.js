/** Role name whether API returned role as a string or { name } object. */
export function getUserRole(user) {
  if (!user?.role) return null;
  if (typeof user.role === 'string') return user.role;
  return user.role.name ?? null;
}

/** Flat permission name list from API shapes (string[], { name }[], or map). */
export function normalizePermissions(perms) {
  if (Array.isArray(perms)) {
    return perms
      .map((p) => (typeof p === 'string' ? p : p?.name))
      .filter(Boolean);
  }
  if (perms && typeof perms === 'object') {
    return Object.entries(perms)
      .filter(([, allowed]) => allowed)
      .map(([key]) => key);
  }
  return [];
}

/** Operations (and similar) see full deal detail but not pricing. */
export function shouldHideDealFinancials(user) {
  return getUserRole(user) === 'operations_manager';
}

const SALES_ROLES = ['sales', 'sales_executive'];

/** Sales and Sales Manager — CRM roles that must not create work orders. */
const NO_WORK_ORDER_CREATE_ROLES = ['sales', 'sales_manager'];

/** Operations roles — must not open the deal detail page. */
const OPERATIONS_ROLES = ['operations_manager', 'operations'];

/** CRM roles blocked from creating proforma / tax invoices. */
const INVOICE_GENERATION_BLOCKED_ROLES = ['sales', 'sales_executive', 'sales_manager'];

/** Sales Executive / Sales (legacy helper — invoice blocking uses canGenerateInvoice). */
export function isSalesRole(user) {
  return SALES_ROLES.includes(getUserRole(user));
}

export function isOperationsRole(user) {
  return OPERATIONS_ROLES.includes(getUserRole(user));
}

/** Operations users may list deals but must not open deal detail. */
export function canViewDealDetails(user) {
  return !isOperationsRole(user);
}

/** Sales and sales manager must not create proforma or tax invoices. */
export function canGenerateInvoice(user) {
  return !INVOICE_GENERATION_BLOCKED_ROLES.includes(getUserRole(user));
}

/** True when the user may create a work order (Operations and admins only). */
export function canCreateWorkOrder(user, hasPermission) {
  if (NO_WORK_ORDER_CREATE_ROLES.includes(getUserRole(user))) return false;
  if (typeof hasPermission === 'function') return hasPermission('operations.create');
  return true;
}

export function collectPermissionsFromUserPayload(data) {
  if (!data) return [];
  const user = data.user || data;
  return normalizePermissions(
    data.permissions
      ?? user.permissions
      ?? user.role?.permissions
  );
}
