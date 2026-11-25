import { useEffect, useState } from 'react';
import { useRouteError, useNavigate } from 'react-router';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { handleChunkLoadError, isChunkLoadError, isChunkReloadExhausted } from '../utils/chunkReload';

const ChunkLoadErrorElement = () => {
  const error = useRouteError();
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(() => !isChunkReloadExhausted());

  useEffect(() => {
    if (isChunkReloadExhausted()) {
      setRetrying(false);
      return;
    }
    const willReload = handleChunkLoadError(error);
    if (!willReload) setRetrying(false);
  }, [error]);

  if (retrying) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" gap={2} px={3}>
        <CircularProgress />
        <Typography variant="h6" fontWeight={700}>Updating application…</Typography>
        <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={420}>
          A new version was deployed. The page is refreshing to load the latest files.
        </Typography>
        <Button variant="outlined" onClick={() => window.location.reload()} sx={{ borderRadius: 2 }}>
          Refresh now
        </Button>
      </Box>
    );
  }

  const isChunkError = isChunkLoadError(error);
  if (error && !isChunkError) {
    // A real error inside the screen (not a stale file after a deploy): keep it visible for diagnosis.
    console.error('Screen error:', error);
  }
  const detail = String(error?.message || error || '').slice(0, 300);

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh" gap={2} px={3}>
      <Typography variant="h6" fontWeight={700}>Could not load this page</Typography>
      <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={460}>
        {isChunkError
          ? 'The app was updated but this screen failed to load. Try a hard refresh (Ctrl+F5) or return to the dashboard.'
          : 'Something went wrong while showing this screen. Try again, or return to the dashboard.'}
      </Typography>
      {!isChunkError && detail && (
        <Typography variant="caption" color="error" textAlign="center" maxWidth={560} sx={{ wordBreak: 'break-word' }}>
          {detail}
        </Typography>
      )}
      <Box display="flex" gap={1.5} flexWrap="wrap" justifyContent="center">
        <Button variant="contained" onClick={() => window.location.reload()} sx={{ borderRadius: 2 }}>
          Refresh
        </Button>
        <Button variant="outlined" onClick={() => navigate('/erp/dashboard')} sx={{ borderRadius: 2 }}>
          Go to dashboard
        </Button>
      </Box>
    </Box>
  );
};

export default ChunkLoadErrorElement;
