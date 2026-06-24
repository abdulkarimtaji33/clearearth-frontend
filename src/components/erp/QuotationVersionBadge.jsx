import React from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { quotationVersion, quotationVersionLabel } from '../../utils/quotationVersion';

/**
 * @param {'chip'|'pill'|'prominent'} variant
 * @param {number} [totalVersions] — show "v2 · 3 revisions" when > 1
 */
const QuotationVersionBadge = ({ quotation, variant = 'chip', totalVersions, sx = {} }) => {
  const theme = useTheme();
  const v = quotationVersion(quotation);
  const label = quotationVersionLabel(quotation);
  if (!label) return null;

  const total = totalVersions ?? v;
  const revisionHint = total > 1 ? `${total} revision${total !== 1 ? 's' : ''} for this deal` : null;

  if (variant === 'prominent') {
    return (
      <Box sx={{ ...sx }}>
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.secondary.main, 0.12),
            border: '1px solid',
            borderColor: alpha(theme.palette.secondary.main, 0.35),
          }}
        >
          <Typography
            component="span"
            sx={{
              fontWeight: 800,
              fontSize: '0.95rem',
              letterSpacing: 0.4,
              color: 'secondary.dark',
              fontFamily: 'monospace',
              lineHeight: 1,
            }}
          >
            {label}
          </Typography>
          {revisionHint && (
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              {revisionHint}
            </Typography>
          )}
        </Box>
      </Box>
    );
  }

  if (variant === 'pill') {
    return (
      <Box
        component="span"
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          px: 0.85,
          py: 0.2,
          borderRadius: 1,
          bgcolor: alpha(theme.palette.secondary.main, 0.14),
          color: 'secondary.dark',
          fontWeight: 800,
          fontSize: '0.68rem',
          letterSpacing: 0.35,
          fontFamily: 'monospace',
          lineHeight: 1.4,
          ...sx,
        }}
      >
        {label}
      </Box>
    );
  }

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: 20,
        fontSize: '0.68rem',
        fontWeight: 800,
        fontFamily: 'monospace',
        letterSpacing: 0.3,
        bgcolor: alpha(theme.palette.secondary.main, 0.12),
        color: 'secondary.dark',
        border: '1px solid',
        borderColor: alpha(theme.palette.secondary.main, 0.28),
        ...sx,
      }}
    />
  );
};

export default QuotationVersionBadge;
