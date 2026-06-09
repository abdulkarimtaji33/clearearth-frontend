import { useEffect } from 'react';
import { useRouteError } from 'react-router';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { handleChunkLoadError } from '../utils/chunkReload';

const ChunkLoadErrorElement = () => {
  const error = useRouteError();

  useEffect(() => {
    handleChunkLoadError(error);
  }, [error]);

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
};

export default ChunkLoadErrorElement;
