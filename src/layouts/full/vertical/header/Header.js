import React, { useContext } from 'react';
import { IconButton, Box, AppBar, useMediaQuery, Toolbar, styled, Stack } from '@mui/material';
import PropTypes from 'prop-types';
import { CustomizerContext } from 'src/context/CustomizerContext';
import { IconMenu2, IconMoon, IconSun } from '@tabler/icons';
import config from 'src/context/config'

// components
import Profile from './Profile';

const Header = () => {
  const lgUp = useMediaQuery((theme) => theme.breakpoints.up('lg'));

  const TopbarHeight = config.topbarHeight;

  // drawer
  const { setIsCollapse, isCollapse, isMobileSidebar, setIsMobileSidebar, activeMode, setActiveMode } = useContext(CustomizerContext);

  const AppBarStyled = styled(AppBar)(({ theme }) => ({
    boxShadow: 'none',
    background: theme.palette.background.paper,
    justifyContent: 'center',
    backdropFilter: 'blur(4px)',
    [theme.breakpoints.up('lg')]: {
      minHeight: TopbarHeight,
    },
  }));
  const ToolbarStyled = styled(Toolbar)(({ theme }) => ({
    width: '100%',
    color: theme.palette.text.secondary,
  }));

  return (
    <AppBarStyled position="sticky" color="default">
      <ToolbarStyled>
        {/* ------------------------------------------- */}
        {/* Toggle Button Sidebar */}
        {/* ------------------------------------------- */}
        <IconButton
          color="inherit"
          aria-label="menu"
          onClick={() => {
            // Toggle sidebar on both mobile and desktop based on screen size
            if (lgUp) {
              // For large screens, toggle between full-sidebar and mini-sidebar
              isCollapse === "full-sidebar" ? setIsCollapse("mini-sidebar") : setIsCollapse("full-sidebar");
            } else {
              // For smaller screens, toggle mobile sidebar
              setIsMobileSidebar(!isMobileSidebar);
            }
          }}>
          <IconMenu2 size="20" />
        </IconButton>
        {/* ------------------------------------------- */}
        {/* Removed: Search, Navigation, Language, Cart, Notifications */}
        {/* ------------------------------------------- */}
        
        <Box flexGrow={1} />
        <Stack spacing={1} direction="row" alignItems="center">
          {/* Theme Switcher */}
          <IconButton
            size="large"
            color="inherit"
            aria-label="theme switcher"
            onClick={() => setActiveMode(activeMode === 'light' ? 'dark' : 'light')}
          >
            {activeMode === 'light' ? (
              <IconMoon size="21" stroke="1.5" />
            ) : (
              <IconSun size="21" stroke="1.5" />
            )}
          </IconButton>
          
          <Profile />
        </Stack>
      </ToolbarStyled>
    </AppBarStyled>
  );
};

Header.propTypes = {
  sx: PropTypes.object,
  toggleSidebar: PropTypes.func,
};

export default Header;
