import { Link } from 'react-router';
import { Box, Typography, styled } from '@mui/material';
import { IconLeaf } from '@tabler/icons-react';
import config from 'src/context/config';
import { CustomizerContext } from 'src/context/CustomizerContext';
import { useContext } from 'react';

const Logo = () => {
  const { isCollapse, isSidebarHover, activeMode } = useContext(CustomizerContext);
  const TopbarHeight = config.topbarHeight;

  const LinkStyled = styled(Link)(() => ({
    height: TopbarHeight,
    width: isCollapse == "mini-sidebar" && !isSidebarHover ? '40px' : '180px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
  }));

  const isCollapsed = isCollapse == "mini-sidebar" && !isSidebarHover;

  return (
    <LinkStyled to="/">
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          background: activeMode === 'dark' 
            ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
            : 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          flexShrink: 0,
        }}
      >
        <IconLeaf size={24} color="white" strokeWidth={2.5} />
      </Box>
      {!isCollapsed && (
        <Box>
          <Typography
            sx={{
              fontSize: '1.25rem',
              fontWeight: 800,
              background: activeMode === 'dark'
                ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1,
              letterSpacing: '-0.5px',
            }}
          >
            Clear Earth
          </Typography>
          <Typography
            sx={{
              fontSize: '0.65rem',
              fontWeight: 600,
              color: activeMode === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginTop: '2px',
            }}
          >
            ERP SYSTEM
          </Typography>
        </Box>
      )}
    </LinkStyled>
  );
};

export default Logo;
