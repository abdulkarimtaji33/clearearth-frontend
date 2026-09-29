import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, InputAdornment, Button, CircularProgress, Alert, Chip, Stack, Avatar,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconCheck, IconSearch, IconPercentage } from '@tabler/icons-react';
import dayjs from 'dayjs';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const CommissionSettings = () => {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState({}); // userId -> percentage string being edited
  const [saving, setSaving] = useState(null); // userId currently saving

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getCommissionSettings();
      if (res.success) setRows(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError(err.message || 'Failed to load commission settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSave = async (row) => {
    const raw = editing[row.userId];
    const pct = parseFloat(raw);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      setError('Commission percentage must be a number between 0 and 100');
      return;
    }
    try {
      setSaving(row.userId);
      setError('');
      setSuccess('');
      await apiService.setCommissionRate(row.userId, pct, dayjs().format('YYYY-MM-DD'));
      setSuccess(`Updated commission rate for ${row.firstName} ${row.lastName || ''}`);
      setEditing((e) => { const n = { ...e }; delete n[row.userId]; return n; });
      await fetchData();
    } catch (err) {
      setError(err.message || 'Failed to save commission rate');
    } finally {
      setSaving(null);
    }
  };

  const getInitials = (first, last) => `${(first || '')[0] || ''}${(last || '')[0] || ''}`.toUpperCase() || '?';

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter((r) =>
      `${r.firstName || ''} ${r.lastName || ''}`.toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.roleName || '').toLowerCase().includes(q)
    );
  }, [rows, search]);

  return (
    <PageContainer title="Commission Settings" description="Set sales commission percentages">
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconPercentage size={20} />
          </Box>
          <Typography variant="h4" fontWeight={700}>Commission Settings</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" ml={6.5} mb={3}>
          Set the commission percentage each sales user earns on approved quotations. Leave at 0% to opt a user out.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box sx={{ p: 2.5, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <TextField
              placeholder="Search by name, email or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>, sx: { borderRadius: 2 } }}
              sx={{ minWidth: 280 }}
            />
          </Box>
          <CardContent sx={{ p: 0 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
            ) : filteredRows.length === 0 ? (
              <Box py={6} textAlign="center">
                <Typography color="text.secondary">{rows.length === 0 ? 'No sales users found' : 'No users match your search'}</Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                      {['Name', 'Email', 'Role', 'Status', 'Current Rate', 'Effective From', 'New Rate (%)', 'Action'].map((h, i) => (
                        <TableCell key={i} align={i === 6 || i === 7 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRows.map((row) => (
                      <TableRow key={row.userId} hover>
                        <TableCell>
                          <Stack direction="row" alignItems="center" spacing={1.5}>
                            <Avatar sx={{ width: 32, height: 32, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', fontSize: '0.7rem', fontWeight: 700 }}>
                              {getInitials(row.firstName, row.lastName)}
                            </Avatar>
                            <Typography variant="body2" fontWeight={700}>{row.firstName} {row.lastName}</Typography>
                          </Stack>
                        </TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{row.email}</Typography></TableCell>
                        <TableCell>
                          <Chip size="small" label={row.roleName} sx={{ textTransform: 'capitalize', fontWeight: 600 }} />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={row.status}
                            color={row.status === 'active' ? 'success' : 'default'}
                            sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                          />
                        </TableCell>
                        <TableCell><Typography variant="body2" fontWeight={600}>{row.commissionPercentage}%</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="text.secondary">{row.effectiveFrom || '—'}</Typography></TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 0, max: 100, step: 0.5, style: { textAlign: 'right' } }}
                            placeholder={String(row.commissionPercentage)}
                            value={editing[row.userId] ?? ''}
                            onChange={(e) => setEditing((s) => ({ ...s, [row.userId]: e.target.value }))}
                            sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={saving === row.userId ? <CircularProgress size={14} color="inherit" /> : <IconCheck size={14} />}
                            disabled={editing[row.userId] === undefined || saving === row.userId}
                            onClick={() => handleSave(row)}
                            sx={{ borderRadius: 2, fontWeight: 600 }}
                          >
                            Save
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default CommissionSettings;
