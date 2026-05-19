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

export function collectPermissionsFromUserPayload(data) {
  if (!data) return [];
  const user = data.user || data;
  return normalizePermissions(
    data.permissions
      ?? user.permissions
      ?? user.role?.permissions
  );
}
