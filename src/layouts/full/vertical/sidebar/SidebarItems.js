import React, { useContext } from 'react';
import Menuitems from './MenuItems';
import { useLocation } from 'react-router';
import { Box, List, useMediaQuery } from '@mui/material';
import { CustomizerContext } from 'src/context/CustomizerContext';
import { useAuth } from 'src/context/AuthContext';

import NavItem from './NavItem';
import NavCollapse from './NavCollapse';
import NavGroup from './NavGroup/NavGroup';

function collectLeafPermissions(nodes) {
  if (!nodes?.length) return [];
  return nodes.flatMap((n) => {
    if (n.children?.length) return collectLeafPermissions(n.children);
    return n.permission ? [n.permission] : [];
  });
}

const SidebarItems = () => {
  const { pathname } = useLocation();
  const pathDirect = pathname;
  const pathWithoutLastPart = pathname.slice(0, pathname.lastIndexOf('/'));
  const { isSidebarHover, isCollapse, isMobileSidebar, setIsMobileSidebar } = useContext(CustomizerContext);
  const { hasPermission, hasAdminDashboardAccess, user } = useAuth();
  const userRole = user?.role?.name || null;

  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? isCollapse == "mini-sidebar" && !isSidebarHover : '';

  const isRoleAllowed = (item) => {
    if (item.excludeRoles?.includes(userRole)) return false;
    if (item.includeRoles && !item.includeRoles.includes(userRole)) return false;
    return true;
  };

  const filteredItems = Menuitems.filter((item, index) => {
    if (!isRoleAllowed(item)) return false;
    if (item.adminDashboardOnly && !hasAdminDashboardAccess()) return false;
    if (item.children) {
      const visibleChildren = item.children.filter((c) => isRoleAllowed(c));
      const childPerms = collectLeafPermissions(visibleChildren);
      if (childPerms.length) return childPerms.some((p) => hasPermission(p));
      return true;
    }
    if (item.permission) return hasPermission(item.permission);
    if (item.subheader) {
      const hasVisibleSibling = Menuitems.slice(index + 1).some((next) => {
        if (next.subheader) return false;
        if (!isRoleAllowed(next)) return false;
        return !next.permission || hasPermission(next.permission);
      });
      return hasVisibleSibling;
    }
    return true;
  });

  return (
    <Box sx={{ px: 3 }}>
      <List sx={{ pt: 0 }} className="sidebarNav">
        {filteredItems.map((item, index) => {
          // {/********SubHeader**********/}
          if (item.subheader) {
            return <NavGroup item={item} hideMenu={hideMenu} key={item.subheader} />;

            // {/********If Sub Menu**********/}
            /* eslint no-else-return: "off" */
          } else if (item.children) {
            return (
              <NavCollapse
                menu={item}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                pathWithoutLastPart={pathWithoutLastPart}
                level={1}
                key={item.id}
                onClick={() => setIsMobileSidebar(!isMobileSidebar)}

              />
            );

            // {/********If Sub No Menu**********/}
          } else {
            return (
              <NavItem
                item={item}
                key={item.id}
                pathDirect={pathDirect}
                hideMenu={hideMenu}
                onClick={() => setIsMobileSidebar(!isMobileSidebar)}

              />
            );
          }
        })}
      </List>
    </Box>
  );
};
export default SidebarItems;
