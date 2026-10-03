import React, { useState } from 'react';
import {
  Box, Card, Typography, Stack, Tabs, Tab, Button, Menu, MenuItem, ListItemIcon, ListItemText,
  IconButton, Tooltip, CircularProgress,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  IconCamera, IconHash, IconMail, IconPhone, IconUsers, IconCalendarEvent, IconFileDownload,
  IconChevronDown,
} from '@tabler/icons-react';
import {
  PersonAvatar, StatusChip, cardSx, fmtDate, fullName, tenureOf,
} from '../../../components/HrUi';

const MetaItem = ({ icon: Icon, children, title }) => (
  <Tooltip title={title || ''} disableHoverListener={!title}>
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary', minWidth: 0 }}>
      <Icon size={16} style={{ flexShrink: 0 }} />
      <Typography variant="body2" color="text.primary" noWrap component="div">{children}</Typography>
    </Stack>
  </Tooltip>
);

/**
 * Profile hero: avatar (click to change photo), identity, quick facts, header actions
 * and the section tabs docked at the bottom of the card.
 */
const ProfileHeader = ({
  employee, photoUrl, photoUploading, onPhotoUpload, tabs, tab, onTabChange, actions, documentActions = [],
}) => {
  const [menuAnchor, setMenuAnchor] = useState(null);
  const name = fullName(employee) || 'Unnamed employee';
  const managerName = fullName(employee.manager);
  const roleLine = [employee.designation?.display_name, employee.department?.name].filter(Boolean).join(' · ');
  const email = employee.work_email || employee.email;
  const phone = employee.work_phone || employee.personal_phone || employee.phone;
  const tenure = tenureOf(employee.date_of_joining);
  const busy = documentActions.some((a) => a.loading);

  return (
    <Card elevation={0} sx={{ ...cardSx, overflow: 'hidden', mb: 3 }}>
      <Box sx={{
        height: { xs: 64, sm: 88 },
        background: (t) => `linear-gradient(120deg, ${alpha(t.palette.primary.main, 0.22)} 0%, ${alpha(t.palette.secondary.main, 0.12)} 55%, ${alpha(t.palette.success.main, 0.1)} 100%)`,
      }}
      />
      <Box sx={{ px: { xs: 2, sm: 3 }, pb: 2 }}>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 1.5, md: 2.5 }}
          alignItems={{ xs: 'flex-start', md: 'flex-end' }}
          sx={{ mt: { xs: -5, sm: -6 } }}
        >
          <Box sx={{ position: 'relative', flexShrink: 0 }}>
            <PersonAvatar
              person={employee}
              src={photoUrl}
              size={112}
              sx={{ border: '4px solid', borderColor: 'background.paper', boxShadow: (t) => `0 4px 14px ${alpha(t.palette.common.black, 0.08)}` }}
            />
            {onPhotoUpload && (
              <Tooltip title="Change photo">
                <IconButton
                  component="label"
                  size="small"
                  disabled={photoUploading}
                  sx={{
                    position: 'absolute', right: 4, bottom: 4, width: 32, height: 32,
                    bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider',
                    boxShadow: 1, '&:hover': { bgcolor: 'background.paper', color: 'primary.main' },
                  }}
                >
                  {photoUploading ? <CircularProgress size={14} /> : <IconCamera size={16} />}
                  <input type="file" accept="image/*" hidden onChange={onPhotoUpload} />
                </IconButton>
              </Tooltip>
            )}
          </Box>

          <Box flex={1} minWidth={0} pb={{ md: 0.5 }}>
            <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
              <Typography variant="h3" fontWeight={700} sx={{ letterSpacing: '-0.02em', wordBreak: 'break-word' }}>{name}</Typography>
              <StatusChip status={employee.employment_status} />
            </Stack>
            <Typography variant="body1" color={roleLine ? 'text.secondary' : 'text.disabled'} mt={0.25}>
              {roleLine || 'No designation or department assigned'}
            </Typography>
          </Box>

          {(actions || documentActions.length > 0) && (
            <Stack direction="row" spacing={1} flexShrink={0} pb={{ md: 0.5 }}>
              {documentActions.length > 0 && (
                <>
                  <Button
                    variant="outlined"
                    color="inherit"
                    startIcon={busy ? <CircularProgress size={14} /> : <IconFileDownload size={17} />}
                    endIcon={<IconChevronDown size={15} />}
                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                    sx={{ borderRadius: 2, fontWeight: 600, borderColor: 'divider' }}
                  >
                    Documents
                  </Button>
                  <Menu
                    anchorEl={menuAnchor}
                    open={!!menuAnchor}
                    onClose={() => setMenuAnchor(null)}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{ sx: { borderRadius: 2, minWidth: 240, mt: 0.5 } }}
                  >
                    {documentActions.map((a) => (
                      <MenuItem
                        key={a.key}
                        disabled={a.loading}
                        onClick={() => { setMenuAnchor(null); a.onClick(); }}
                      >
                        <ListItemIcon>{a.loading ? <CircularProgress size={16} /> : <IconFileDownload size={18} />}</ListItemIcon>
                        <ListItemText primary={a.label} secondary={a.hint} />
                      </MenuItem>
                    ))}
                  </Menu>
                </>
              )}
              {actions}
            </Stack>
          )}
        </Stack>

        <Stack
          direction="row"
          flexWrap="wrap"
          useFlexGap
          columnGap={3}
          rowGap={1}
          mt={2}
        >
          <MetaItem icon={IconHash} title="Employee code">{employee.employee_code || '—'}</MetaItem>
          {email && <MetaItem icon={IconMail} title="Email">{email}</MetaItem>}
          {phone && <MetaItem icon={IconPhone} title="Phone">{phone}</MetaItem>}
          <MetaItem icon={IconUsers} title="Reports to">{managerName ? `Reports to ${managerName}` : 'No manager'}</MetaItem>
          {employee.date_of_joining && (
            <MetaItem icon={IconCalendarEvent} title="Joining date">
              Joined {fmtDate(employee.date_of_joining)}{tenure ? ` · ${tenure}` : ''}
            </MetaItem>
          )}
        </Stack>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => onTabChange(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          px: { xs: 1, sm: 2 },
          borderTop: '1px solid',
          borderColor: 'divider',
          minHeight: 52,
          '& .MuiTabs-indicator': { height: 3, borderRadius: '3px 3px 0 0' },
        }}
      >
        {tabs.map(({ key, label, icon: Icon }) => (
          <Tab
            key={key}
            value={key}
            label={label}
            icon={Icon ? <Icon size={17} /> : undefined}
            iconPosition="start"
            sx={{
              minHeight: 52, px: 1.75, textTransform: 'none', fontWeight: 600, fontSize: 14,
              color: 'text.secondary', '&.Mui-selected': { color: 'primary.main' },
            }}
          />
        ))}
      </Tabs>
    </Card>
  );
};

export default ProfileHeader;
