import React from 'react';
import { Box, Paper, Typography, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

const fmtCurrency = (v) =>
  `AED ${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const KpiCard = ({ label, value, sub, format = 'number', color = 'primary', highlight, icon: Icon }) => {
  const theme = useTheme();
  const c = theme.palette[color]?.main || theme.palette.primary.main;
  const display = format === 'currency' ? fmtCurrency(value) : Number(value || 0).toLocaleString();

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: 3,
        border: '1px solid',
        borderColor: highlight ? alpha(c, 0.35) : 'divider',
        bgcolor: 'background.paper',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        transition: 'box-shadow 0.18s',
        '&:hover': { boxShadow: `0 4px 20px ${alpha(c, 0.12)}` },
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: highlight ? c : alpha(c, 0.25),
          borderRadius: '3px 0 0 3px',
        },
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box flex={1}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            letterSpacing={0.5}
            sx={{ textTransform: 'uppercase', fontSize: '0.67rem' }}
          >
            {label}
          </Typography>
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{ mt: 0.75, color: highlight ? c : 'text.primary', lineHeight: 1.15 }}
          >
            {display}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {sub}
            </Typography>
          )}
        </Box>
        {Icon && (
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              bgcolor: alpha(c, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              ml: 1,
            }}
          >
            <Icon size={20} color={c} />
          </Box>
        )}
      </Stack>
    </Paper>
  );
};

export default KpiCard;
