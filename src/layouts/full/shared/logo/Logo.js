import { Link } from 'react-router';
import { Box, styled } from '@mui/material';
import config from 'src/context/config';
import { CustomizerContext } from 'src/context/CustomizerContext';
import { useContext } from 'react';

const LOGO_URL = 'https://i.ibb.co/rfFyXrmZ/IMG-6578.png';

const Logo = () => {
  const { isCollapse, isSidebarHover } = useContext(CustomizerContext);
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
        component="img"
        src={LOGO_URL}
        alt="Clear Earth"
        sx={{
          height: isCollapsed ? 32 : 48,
          width: isCollapsed ? 32 : 'auto',
          maxWidth: isCollapsed ? 32 : 160,
          objectFit: 'contain',
          flexShrink: 0,
        }}
      />
    </LinkStyled>
  );
};

export default Logo;
