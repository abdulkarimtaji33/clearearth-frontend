import React from 'react';
import { Alert, Box, Card, CardContent, Stack, Switch, Typography, Chip } from '@mui/material';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

/** Field-group visibility: switch ON = visible, OFF = hidden (values are blanked by the API). */
const FieldVisibilityPanel = ({ catalog, hidden, onChange, readOnly = false }) => {
  const groups = catalog?.fieldGroups || [];
  const hiddenSet = new Set(hidden || []);

  const toggle = (key) => {
    const next = new Set(hiddenSet);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange([...next]);
  };

  return (
    <Box>
      <Alert severity="info" icon={false} sx={{ mb: 2 }}>
        Hide sensitive information from a role without blocking the whole screen — e.g. let operations see deals and
        work orders but not prices. Hidden values are removed by the server, not just masked on screen.
      </Alert>
      <Stack spacing={2}>
        {groups.map((g) => {
          const isHidden = hiddenSet.has(g.key);
          return (
            <Card key={g.key} elevation={0} sx={{ border: '1px solid', borderColor: isHidden ? 'warning.main' : 'divider', borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0 }}>
                    <Box sx={{ color: isHidden ? 'warning.main' : 'success.main', display: 'inline-flex' }}>
                      {isHidden ? <IconEyeOff size={24} /> : <IconEye size={24} />}
                    </Box>
                    <Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography fontWeight={700}>{g.label}</Typography>
                        <Chip size="small" label={isHidden ? 'Hidden' : 'Visible'} color={isHidden ? 'warning' : 'success'} variant="outlined" />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">{g.description}</Typography>
                    </Box>
                  </Stack>
                  <Switch checked={!isHidden} disabled={readOnly} onChange={() => toggle(g.key)} />
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};

export default FieldVisibilityPanel;
