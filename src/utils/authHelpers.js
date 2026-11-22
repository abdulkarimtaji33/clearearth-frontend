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

/**
 * Effective access attached to the user by the API (role permissions ± per-user overrides,
 * data scopes and hidden field groups). Everything below is driven by it — not by role names.
 */
export function getAccess(user) {
  return user?.access || null;
}

/** True when the user holds the permission (Super Admin holds everything). */
export function userCan(user, permission) {
  if (!user) return false;
  if (getUserRole(user) === 'super_admin') return true;
  const access = getAccess(user);
  if (access?.isSuperAdmin) return true;
  const list = access?.permissions ?? normalizePermissions(user.permissions ?? user.role?.permissions);
  return list.includes(permission);
}

/** Data scope for a module ('own' | 'team' | 'all'). */
export function userScope(user, moduleKey, fallback = 'all') {
  return getAccess(user)?.scopes?.[moduleKey] || fallback;
}

/** True when a field group (e.g. 'financials') is hidden for the user. */
export function userHidesField(user, group) {
  if (!user) return false;
  if (getAccess(user)?.isSuperAdmin) return false;
  return Boolean(getAccess(user)?.hiddenFieldGroups?.includes(group));
}

/** Roles whose "prices & amounts" field group is hidden (configured per role under Roles → Field visibility). */
export function shouldHideDealFinancials(user) {
  return userHidesField(user, 'financials');
}

const SALES_ROLES = ['sales', 'sales_executive'];

/** Sales roles (legacy helper, kept for display purposes only). */
export function isSalesRole(user) {
  return SALES_ROLES.includes(getUserRole(user));
}

/** Legacy helper kept for compatibility — prefer permissions. */
export function isOperationsRole(user) {
  return ['operations_manager', 'operations'].includes(getUserRole(user));
}

/** Users who cannot see pricing also don't get the deal detail page (it is pricing-centric). */
export function canViewDealDetails(user) {
  return userCan(user, 'deals.read') && !shouldHideDealFinancials(user);
}

/** Proforma / tax invoice creation is the `invoices.generate` permission. */
export function canGenerateInvoice(user) {
  return userCan(user, 'invoices.generate');
}

/** Work order creation is the `operations.create` permission. */
export function canCreateWorkOrder(user, hasPermission) {
  if (typeof hasPermission === 'function') return hasPermission('operations.create');
  return userCan(user, 'operations.create');
}

/** Create / edit / approve quotations & orders is the `orders.modify` permission. */
export function canModifyOrders(user) {
  return userCan(user, 'orders.modify');
}

export function collectPermissionsFromUserPayload(data) {
  if (!data) return [];
  const user = data.user || data;
  return normalizePermissions(
    data.permissions
      ?? user.permissions
      ?? user.access?.permissions
      ?? user.role?.permissions
  );
}
