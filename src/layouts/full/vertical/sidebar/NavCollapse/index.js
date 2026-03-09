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

// FC Component For Dropdown Menu
const NavCollapse = ({ menu, level, pathWithoutLastPart, pathDirect, onClick, hideMenu }) => {
  const { isBorderRadius } = useContext(CustomizerContext);
  const { hasPermission } = useAuth();

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

  // menu collapse for sub-levels
  React.useEffect(() => {
    setOpen(false);
    menu.children.forEach((item) => {
      if (item.href === pathname) {
        setOpen(true);
      }
    });
  }, [pathname, menu.children]);
  const isActiveOrOpen = pathname.includes(menu.href) || open;
  const activeColor = theme.palette.primary.contrastText || '#fff';
  const ListItemStyled = styled(ListItem)(() => ({
    marginBottom: '2px',
    cursor: 'pointer',
    padding: '8px 10px',
    paddingLeft: hideMenu ? '10px' : level > 2 ? `${level * 15}px` : '10px',
    backgroundColor: open && level < 2 ? theme.palette.primary.main : '',
    whiteSpace: 'nowrap',
    color:
      open && level < 2
        ? activeColor
        : level > 1 && open
          ? theme.palette.primary.main
          : theme.palette.text.secondary,
    '&:hover': {
      backgroundColor:
        isActiveOrOpen
          ? theme.palette.primary.main
          : theme.palette.primary.light,
      color: isActiveOrOpen ? activeColor : theme.palette.primary.main,
    },
    ...(open && level < 2 && {
      '& .MuiListItemIcon-root, & .MuiListItemText-root': {
        color: `${activeColor} !important`,
      },
    }),
    borderRadius: `${isBorderRadius}px`,
  }));
  // If Menu has Children - filter by permission
  const visibleChildren = (menu.children || []).filter((item) => !item.permission || hasPermission(item.permission));
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
