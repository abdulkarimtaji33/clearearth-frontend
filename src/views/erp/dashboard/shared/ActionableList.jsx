import React from 'react';
import { Paper, Typography, Stack, Button, Chip, Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconAlertCircle, IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router';

const ActionableList = ({ title = 'Needs attention', items = [] }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  if (!items?.length) return null;

  return (
    <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: alpha(theme.palette.warning.main, 0.3), overflow: 'hidden' }}>
      <Box sx={{ px: 2.5, py: 1.5, bgcolor: alpha(theme.palette.warning.main, 0.06), borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconAlertCircle size={18} color={theme.palette.warning.main} />
          <Typography fontWeight={800}>{title}</Typography>
          <Chip size="small" label={items.length} color="warning" sx={{ fontWeight: 700, height: 20 }} />
        </Stack>
      </Box>
      <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
        {items.map((item) => (
          <Stack key={item.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.25 }}>
            <Box>
              <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
              {item.count != null && item.count > 0 && (
                <Typography variant="caption" color="text.secondary">{item.count} item{item.count !== 1 ? 's' : ''}</Typography>
              )}
            </Box>
            {item.href && (
              <Button size="small" endIcon={<IconArrowRight size={14} />} onClick={() => navigate(item.href)} sx={{ borderRadius: 2 }}>
                Open
              </Button>
            )}
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
};

export default ActionableList;
