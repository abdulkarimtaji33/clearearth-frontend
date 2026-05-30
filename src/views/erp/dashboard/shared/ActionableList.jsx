import React from 'react';
import { Paper, Typography, Stack, Button, Chip, Box } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconAlertTriangle, IconArrowRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router';

const ActionableList = ({ title = 'Needs attention', items = [] }) => {
  const theme = useTheme();
  const navigate = useNavigate();

  if (!items?.length) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: alpha(theme.palette.warning.main, 0.35),
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          bgcolor: alpha(theme.palette.warning.main, 0.07),
          borderBottom: '1px solid',
          borderColor: alpha(theme.palette.warning.main, 0.2),
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 30,
              height: 30,
              borderRadius: 1.5,
              bgcolor: alpha(theme.palette.warning.main, 0.15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconAlertTriangle size={16} color={theme.palette.warning.dark} />
          </Box>
          <Typography fontWeight={800} fontSize="0.95rem">
            {title}
          </Typography>
          <Chip
            size="small"
            label={items.length}
            sx={{
              fontWeight: 800,
              height: 22,
              fontSize: '0.72rem',
              bgcolor: theme.palette.warning.main,
              color: '#fff',
            }}
          />
        </Stack>
      </Box>
      <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
        {items.map((item, idx) => (
          <Stack
            key={item.id ?? idx}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{
              px: 2.5,
              py: 1.4,
              transition: 'background 0.14s',
              '&:hover': { bgcolor: alpha(theme.palette.warning.main, 0.04) },
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: item.count > 0 ? theme.palette.warning.main : theme.palette.grey[400],
                  flexShrink: 0,
                }}
              />
              <Box>
                <Typography variant="body2" fontWeight={600} lineHeight={1.3}>
                  {item.label}
                </Typography>
                {item.count != null && item.count > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    {item.count} item{item.count !== 1 ? 's' : ''}
                  </Typography>
                )}
              </Box>
            </Stack>
            {item.href && (
              <Button
                size="small"
                endIcon={<IconArrowRight size={13} />}
                onClick={() => navigate(item.href)}
                sx={{ borderRadius: 2, flexShrink: 0, ml: 1, fontSize: '0.78rem' }}
              >
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
