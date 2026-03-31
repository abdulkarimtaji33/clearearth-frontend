import { Link } from 'react-router';
import { Box } from '@mui/material';
import config from 'src/context/config';
import { CustomizerContext } from 'src/context/CustomizerContext';
import { useContext, useEffect, useState } from 'react';
import apiService from 'src/services/api';

const FALLBACK_LOGO = 'https://i.ibb.co/rfFyXrmZ/IMG-6578.png';

const Logo = () => {
  const { isCollapse, isSidebarHover } = useContext(CustomizerContext);
  const TopbarHeight = config.topbarHeight;
  const isCollapsed = isCollapse === 'mini-sidebar' && !isSidebarHover;

  const [logoSrc, setLogoSrc] = useState(() => {
    try { return sessionStorage.getItem('tenantLogo') || FALLBACK_LOGO; } catch { return FALLBACK_LOGO; }
  });

  useEffect(() => {
    let cancelled = false;
    apiService.getTenant().then((res) => {
      if (cancelled) return;
      if (res?.success && res.data?.logo) {
        const url = apiService.getUploadUrl(res.data.logo);
        setLogoSrc(url);
        try { sessionStorage.setItem('tenantLogo', url); } catch { /* ignore */ }
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return (
    <Link
      to="/"
      style={{
        height: TopbarHeight,
        width: isCollapsed ? '40px' : '180px',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
      }}
    >
      <Box
        component="img"
        src={logoSrc}
        alt="Clear Earth"
        onError={() => setLogoSrc(FALLBACK_LOGO)}
        sx={{
          height: isCollapsed ? 32 : 48,
          width: isCollapsed ? 32 : 'auto',
          maxWidth: isCollapsed ? 32 : 160,
          objectFit: 'contain',
          flexShrink: 0,
        }}
      />
    </Link>
  );
};

export default Logo;
