import React, { useContext, useMemo } from 'react';
import Menuitems from './MenuItems';
import { useLocation } from 'react-router';
import { Box, List, useMediaQuery, CircularProgress } from '@mui/material';
import { CustomizerContext } from 'src/context/CustomizerContext';
import { useAuth } from 'src/context/AuthContext';
import { filterMenu } from './menuAccess';

import NavItem from './NavItem';
import NavCollapse from './NavCollapse';
import NavGroup from './NavGroup/NavGroup';

const SidebarItems = () => {
  const { pathname } = useLocation();
  const pathDirect = pathname;
  const pathWithoutLastPart = pathname.slice(0, pathname.lastIndexOf('/'));
  const { isSidebarHover, isCollapse, isMobileSidebar, setIsMobileSidebar } = useContext(CustomizerContext);
  const { hasPermission, permissions, user, loading: authLoading } = useAuth();

  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));
  const hideMenu = lgUp ? isCollapse == "mini-sidebar" && !isSidebarHover : '';

  // Visibility is driven purely by the user's effective permissions
  // (re-computed whenever they change — including live changes made in the Roles screen).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const filteredItems = useMemo(() => filterMenu(Menuitems, hasPermission), [user, permissions]);

  if (authLoading) {
    return (
      <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress size={22} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3 }}>
      <List sx={{ pt: 0 }} className="sidebarNav">
        {filteredItems.map((item) => {
          // {/********SubHeader**********/}
          if (item.subheader) {
            return <NavGroup item={item} hideMenu={hideMenu} key={item.subheader} />;
          }
          // {/********If Sub Menu**********/}
          if (item.children) {
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
          }
          // {/********If Sub No Menu**********/}
          return (
            <NavItem
              item={item}
              key={item.id}
              pathDirect={pathDirect}
              hideMenu={hideMenu}
              onClick={() => setIsMobileSidebar(!isMobileSidebar)}
            />
          );
        })}
      </List>
    </Box>
  );
};
export default SidebarItems;
