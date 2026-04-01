import React from 'react';
import { Box, ButtonBase, CircularProgress, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';

const STATUS_ORDER = ['not_started', 'in_progress', 'completed'];

const LABELS = {
  not_started: 'Not started',
  in_progress: 'In progress',
  completed: 'Completed',
};

/**
 * Red / blue / green segmented control for task status.
 */
const TaskStatusSegments = ({ value, onChange, disabled, loading, compact }) => {
  const theme = useTheme();
  const colors = {
    not_started: theme.palette.error.main,
    in_progress: theme.palette.info.main,
    completed: theme.palette.success.main,
  };

  return (
    <Box sx={{ position: 'relative' }}>
      <Stack
        direction="row"
        alignItems="stretch"
        sx={{
          borderRadius: 2,
          p: 0.375,
          gap: 0.375,
          bgcolor: alpha(theme.palette.divider, 0.45),
          border: '1px solid',
          borderColor: 'divider',
          minHeight: compact ? 30 : 36,
          opacity: loading ? 0.55 : 1,
          pointerEvents: loading ? 'none' : 'auto',
        }}
      >
        {STATUS_ORDER.map((key) => {
          const selected = value === key;
          const c = colors[key];
          return (
            <ButtonBase
              key={key}
              disabled={disabled || loading}
              onClick={() => onChange(key)}
              sx={{
                flex: 1,
                borderRadius: 1.25,
                px: compact ? 0.75 : 1.25,
                py: 0.5,
                minWidth: 0,
                transition: 'background-color 0.15s, color 0.15s, box-shadow 0.15s',
                bgcolor: selected ? c : 'transparent',
                color: selected ? theme.palette.common.white : 'text.secondary',
                boxShadow: selected ? `0 1px 3px ${alpha(c, 0.45)}` : 'none',
                '&:hover': {
                  bgcolor: selected ? c : alpha(c, 0.08),
                  color: selected ? theme.palette.common.white : c,
                },
                '&.Mui-disabled': { opacity: 0.5 },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  fontSize: compact ? '0.65rem' : '0.72rem',
                  lineHeight: 1.2,
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                }}
              >
                {LABELS[key]}
              </Typography>
            </ButtonBase>
          );
        })}
      </Stack>
      {loading && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 2,
            bgcolor: alpha(theme.palette.background.paper, 0.65),
            zIndex: 1,
          }}
        >
          <CircularProgress size={20} />
        </Box>
      )}
    </Box>
  );
};

export const taskStatusColor = (theme, status) => {
  const map = {
    not_started: theme.palette.error.main,
    in_progress: theme.palette.info.main,
    completed: theme.palette.success.main,
  };
  return map[status] || theme.palette.text.disabled;
};

export default TaskStatusSegments;
