import React from 'react';
import { Box, Card, CardContent, Stack, ToggleButton, ToggleButtonGroup, Typography, Alert } from '@mui/material';
import { IconUser, IconUsersGroup, IconWorld } from '@tabler/icons-react';

const SCOPE_META = {
  own: { label: 'Only their own', hint: 'Records they created or are assigned to', icon: <IconUser size={16} /> },
  team: { label: 'Their team', hint: 'Themselves and their direct reports', icon: <IconUsersGroup size={16} /> },
  all: { label: 'Everything', hint: 'All records in the company', icon: <IconWorld size={16} /> },
};

/** Per-module data scope selector (own / team / all). */
const DataScopePanel = ({ catalog, scopes, onChange, readOnly = false }) => {
  const defs = catalog?.dataScopes || [];
  return (
    <Box>
      <Alert severity="info" icon={false} sx={{ mb: 2 }}>
        Data scope controls <b>which records</b> a role can see and act on — separate from <b>what actions</b> they can take in the Permissions tab.
      </Alert>
      <Stack spacing={2}>
        {defs.map((def) => {
          const value = scopes?.[def.key] || def.default;
          return (
            <Card key={def.key} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
              <CardContent>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }} justifyContent="space-between">
                  <Box sx={{ maxWidth: 520 }}>
                    <Typography fontWeight={700}>{def.label}</Typography>
                    <Typography variant="body2" color="text.secondary">{def.description}</Typography>
                    <Typography variant="caption" color="primary.main" sx={{ display: 'block', mt: 0.5 }}>
                      {SCOPE_META[value]?.hint}
                    </Typography>
                  </Box>
                  <ToggleButtonGroup
                    exclusive
                    size="small"
                    color="primary"
                    value={value}
                    disabled={readOnly}
                    onChange={(_, v) => v && onChange({ ...scopes, [def.key]: v })}
                  >
                    {def.scopes.map((s) => (
                      <ToggleButton key={s} value={s} sx={{ textTransform: 'none', px: 2, gap: 0.75 }}>
                        {SCOPE_META[s]?.icon}
                        {SCOPE_META[s]?.label || s}
                      </ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Stack>
    </Box>
  );
};

export default DataScopePanel;
