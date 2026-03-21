import React from 'react';
import { Box, TextField, Button, Stack, Typography, Paper } from '@mui/material';
import { IconCalendar, IconX } from '@tabler/icons-react';

/**
 * Consistent date range for ERP list pages. Passes YYYY-MM-DD to API as dateFrom / dateTo.
 */
const ListDateRangeFilter = ({
  dateFrom,
  dateTo,
  onFromChange,
  onToChange,
  onClear,
  helperText = 'Filter by date',
  compact = false,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: compact ? 1.5 : 2,
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      bgcolor: 'action.hover',
    }}
  >
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} flexWrap="wrap" useFlexGap>
      <Stack direction="row" spacing={1} alignItems="center">
        <IconCalendar size={20} stroke={1.5} style={{ opacity: 0.7 }} />
        <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
          {helperText}
        </Typography>
      </Stack>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center', flex: 1 }}>
        <TextField
          type="date"
          label="From"
          size="small"
          value={dateFrom || ''}
          onChange={(e) => onFromChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }}
        />
        <TextField
          type="date"
          label="To"
          size="small"
          value={dateTo || ''}
          onChange={(e) => onToChange(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 160, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }}
        />
        {(dateFrom || dateTo) && (
          <Button
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<IconX size={16} />}
            onClick={onClear}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            Clear dates
          </Button>
        )}
      </Box>
    </Stack>
  </Paper>
);

export default ListDateRangeFilter;
