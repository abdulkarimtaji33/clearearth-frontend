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

/** Roles without deals.view_price see full deal detail but not pricing. */
export function shouldHideDealFinancials(user, hasPermission) {
  if (getUserRole(user) === 'super_admin') return false;
  if (typeof hasPermission === 'function') return !hasPermission('deals.view_price');
  return true;
}

/** True when the role holds deals.read.own or deals.read.all (i.e. any CRM sales role). */
export function isSalesRole(user, hasPermission) {
  if (typeof hasPermission !== 'function') return false;
  return hasPermission('deals.read.own') || hasPermission('deals.read.all');
}

/** Roles that can see deals/quotations but not pricing — same signal as shouldHideDealFinancials. */
export function isOperationsRole(user, hasPermission) {
  return shouldHideDealFinancials(user, hasPermission);
}

/** Operations-only users may list deals but must not open deal detail. */
export function canViewDealDetails(user, hasPermission) {
  return !isOperationsRole(user, hasPermission);
}

/** Only roles holding proforma_invoices.create may generate proforma/tax invoices. */
export function canGenerateInvoice(user, hasPermission) {
  if (getUserRole(user) === 'super_admin') return true;
  if (typeof hasPermission !== 'function') return false;
  return hasPermission('proforma_invoices.create');
}

/** True when the user may create a work order. */
export function canCreateWorkOrder(user, hasPermission) {
  if (typeof hasPermission !== 'function') return true;
  return hasPermission('operations.create');
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
