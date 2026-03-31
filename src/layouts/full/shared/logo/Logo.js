import { Link } from 'react-router';
import { Box } from '@mui/material';
import config from 'src/context/config';
import { CustomizerContext } from 'src/context/CustomizerContext';
import { useContext, useEffect, useState } from 'react';
import apiService from 'src/services/api';

const FALLBACK_LOGO = 'https://i.ibb.co/rfFyXrmZ/IMG-6578.png';
const SESSION_KEY = 'tenantLogo';

const Logo = () => {
  const { isCollapse, isSidebarHover } = useContext(CustomizerContext);
  const TopbarHeight = config.topbarHeight;
  const isCollapsed = isCollapse === 'mini-sidebar' && !isSidebarHover;

  const [logoSrc, setLogoSrc] = useState(() => {
    try { return sessionStorage.getItem(SESSION_KEY) || FALLBACK_LOGO; } catch { return FALLBACK_LOGO; }
  });

  useEffect(() => {
    // Already cached — skip fetch
    try { if (sessionStorage.getItem(SESSION_KEY)) return; } catch { /* ignore */ }

    let cancelled = false;
    apiService.getPublicLogo().then((res) => {
      if (cancelled || !res?.success || !res.data?.logo) return;
      const url = apiService.getUploadUrl(res.data.logo);
      setLogoSrc(url);
      try { sessionStorage.setItem(SESSION_KEY, url); } catch { /* ignore */ }
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
        onError={(e) => { e.target.src = FALLBACK_LOGO; }}
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
