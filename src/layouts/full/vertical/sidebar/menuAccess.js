/**
 * Permission-based visibility for sidebar items (shared by SidebarItems and NavCollapse).
 *   permission : must hold it
 *   anyOf      : must hold at least one
 *   neither    : always visible
 * A parent is visible when it passes its own gate AND (has no children OR at least one child is visible).
 */
export function isLeafAllowed(item, hasPermission) {
  if (item.permission) return hasPermission(item.permission);
  if (item.anyOf?.length) return item.anyOf.some((p) => hasPermission(p));
  return true;
}

export function isItemVisible(item, hasPermission) {
  if (item.navlabel || item.subheader) return true;
  if (!isLeafAllowed(item, hasPermission)) return false;
  if (item.children?.length) return item.children.some((c) => isItemVisible(c, hasPermission));
  return true;
}

/** Drop hidden items, and drop section headings that have no visible items beneath them. */
export function filterMenu(items, hasPermission) {
  const visible = items.filter((it) => isItemVisible(it, hasPermission));
  return visible.filter((it, idx) => {
    if (!it.subheader) return true;
    for (let i = idx + 1; i < visible.length; i += 1) {
      if (visible[i].subheader) return false;
      return true;
    }
    return false;
  });
}
