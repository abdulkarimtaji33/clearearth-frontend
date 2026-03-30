import React from 'react';
import { Drawer, Box, IconButton, Typography, Stack, CircularProgress } from '@mui/material';
import { IconX } from '@tabler/icons-react';

const RecordDetailDrawer = ({ open, onClose, title, subtitle, loading, children }) => (
  <Drawer
    anchor="right"
    open={open}
    onClose={onClose}
    PaperProps={{
      sx: {
        width: { xs: '100%', sm: 440, md: 480 },
        maxWidth: '100vw',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 0,
        borderLeft: '1px solid',
        borderColor: 'divider',
        boxShadow: (theme) => theme.shadows[8],
      },
    }}
  >
    <Box
      sx={{
        px: 2.5,
        py: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.background.paper} 60%)`,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 1,
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h6" fontWeight={700} noWrap>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <IconButton onClick={onClose} size="small" aria-label="Close" sx={{ flexShrink: 0 }}>
        <IconX size={20} />
      </IconButton>
    </Box>
    <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
      {loading ? (
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <CircularProgress size={36} />
        </Stack>
      ) : (
        children
      )}
    </Box>
  </Drawer>
);

export default RecordDetailDrawer;
