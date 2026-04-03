import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useLocation } from 'react-router';
// mui imports
import { ListItemIcon, ListItem, Collapse, styled, ListItemText, useTheme } from '@mui/material';
import { CustomizerContext } from 'src/context/CustomizerContext';

// custom imports
import NavItem from '../NavItem';
import { useAuth } from 'src/context/AuthContext';

// plugins
import { IconChevronDown, IconChevronUp } from '@tabler/icons';
import { useTranslation } from 'react-i18next';

/** Open parent menus when pathname matches a leaf or nested route (e.g. /erp/quotations/edit/1). */
function pathMatchesMenuBranch(children, pathname) {
  if (!children?.length) return false;
  for (const item of children) {
    if (item.href) {
      if (pathname === item.href) return true;
      if (item.href !== '/' && pathname.startsWith(`${item.href}/`)) return true;
    }
    if (item.children && pathMatchesMenuBranch(item.children, pathname)) return true;
  }
  return false;
}

function branchHasVisibleItem(items, hasPermission, hasAdminDashboardAccess) {
  if (!items?.length) return false;
  return items.some((item) => {
    if (item.adminDashboardOnly && !hasAdminDashboardAccess()) return false;
    if (item.children?.length) return branchHasVisibleItem(item.children, hasPermission, hasAdminDashboardAccess);
    return !item.permission || hasPermission(item.permission);
  });
}

// FC Component For Dropdown Menu
const NavCollapse = ({ menu, level, pathWithoutLastPart, pathDirect, onClick, hideMenu }) => {
  const { isBorderRadius } = useContext(CustomizerContext);
  const { hasPermission, hasAdminDashboardAccess } = useAuth();

  const Icon = menu.icon;
  const theme = useTheme();
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const menuIcon =
    level > 1 ? <Icon stroke={1.5} size="1rem" /> : <Icon stroke={1.5} size="1.3rem" />;

  const handleClick = () => {
    setOpen(!open);
  };

  // menu collapse for sub-levels (including nested children)
  React.useEffect(() => {
    setOpen(pathMatchesMenuBranch(menu.children, pathname));
  }, [pathname, menu.children]);
  const isActiveOrOpen = pathname.includes(menu.href) || open;
  const ListItemStyled = styled(ListItem)(() => ({
    marginBottom: '2px',
    cursor: 'pointer',
    padding: '8px 10px',
    paddingLeft: hideMenu ? '10px' : level > 2 ? `${level * 15}px` : '10px',
    backgroundColor: 'transparent',
    whiteSpace: 'nowrap',
    color:
      level > 1 && open
        ? theme.palette.primary.main
        : theme.palette.text.secondary,
    ...(open && level < 2 && {
      '& .MuiListItemIcon-root': {
        color: `${theme.palette.primary.main} !important`,
      },
    }),
    '&:hover': {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.primary.main,
    },
    borderRadius: `${isBorderRadius}px`,
  }));
  // If Menu has Children - filter by permission
  const visibleChildren = (menu.children || []).filter((item) => {
    if (item.adminDashboardOnly && !hasAdminDashboardAccess()) return false;
    if (item.children?.length) return branchHasVisibleItem(item.children, hasPermission, hasAdminDashboardAccess);
    return !item.permission || hasPermission(item.permission);
  });
  if (visibleChildren.length === 0) return null;
  const submenus = visibleChildren.map((item) => {
    if (item.children) {
      return (
        <NavCollapse
          key={item.id}
          menu={item}
          level={level + 1}
          pathWithoutLastPart={pathWithoutLastPart}
          pathDirect={pathDirect}
          hideMenu={hideMenu}
        />
      );
    } else {
      return (
        <NavItem
          key={item.id}
          item={item}
          level={level + 1}
          pathDirect={pathDirect}
          hideMenu={hideMenu}
          onClick={onClick}
        />
      );
    }
  });

  return (
    <React.Fragment key={menu.id}>
      <ListItemStyled
        button="true"
        component="li"
        onClick={handleClick}
        selected={pathWithoutLastPart === menu.href}
      >
        <ListItemIcon
          sx={{
            minWidth: '36px',
            p: '3px 0',
            color: 'inherit',
          }}
        >
          {menuIcon}
        </ListItemIcon>
        <ListItemText color="inherit">{hideMenu ? '' : <>{t(`${menu.title}`)}</>}</ListItemText>
        {!open ? <IconChevronDown size="1rem" /> : <IconChevronUp size="1rem" />}
      </ListItemStyled>
      <Collapse in={open} timeout="auto" unmountOnExit>
        {submenus}
      </Collapse>
    </React.Fragment>
  );
};

NavCollapse.propTypes = {
  menu: PropTypes.object,
  level: PropTypes.number,
  pathDirect: PropTypes.any,
  pathWithoutLastPart: PropTypes.any,
  hideMenu: PropTypes.any,
  onClick: PropTypes.func,
};

export default NavCollapse;
