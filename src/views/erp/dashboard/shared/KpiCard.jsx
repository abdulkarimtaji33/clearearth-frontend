import React from 'react';
import { Box, Paper, Typography, Stack } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

const fmtCurrency = (v) => `AED ${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const KpiCard = ({ label, value, sub, format = 'number', color = 'primary', highlight }) => {
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
        borderColor: highlight ? alpha(c, 0.4) : 'divider',
        bgcolor: highlight ? alpha(c, 0.06) : 'background.paper',
        height: '100%',
      }}
    >
      <Typography variant="caption" color="text.secondary" fontWeight={700} letterSpacing={0.6} sx={{ textTransform: 'uppercase', fontSize: '0.67rem' }}>
        {label}
      </Typography>
      <Typography variant="h4" fontWeight={800} sx={{ mt: 0.75, color: highlight ? c : 'text.primary' }}>
        {display}
      </Typography>
      {sub && <Typography variant="caption" color="text.secondary" mt={0.5}>{sub}</Typography>}
    </Paper>
  );
};

export default KpiCard;
