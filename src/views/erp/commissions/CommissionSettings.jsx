import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Button, CircularProgress, Alert, Chip, Stack,
} from '@mui/material';
import { IconCheck } from '@tabler/icons-react';
import dayjs from 'dayjs';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const CommissionSettings = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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

  return (
    <PageContainer title="Commission Settings" description="Set sales commission percentages">
      <Box mb={3}>
        <Typography variant="h4" fontWeight={900}>Commission Settings</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          Set the commission percentage each sales user earns on approved quotations. Leave at 0% to opt a user out.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
          ) : rows.length === 0 ? (
            <Box py={6} textAlign="center">
              <Typography color="text.secondary">No sales users found</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Current Rate</TableCell>
                    <TableCell>Effective From</TableCell>
                    <TableCell align="right">New Rate (%)</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.userId} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.firstName} {row.lastName}</TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>
                        <Chip size="small" label={row.roleName} sx={{ textTransform: 'capitalize' }} />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={row.status}
                          color={row.status === 'active' ? 'success' : 'default'}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>{row.commissionPercentage}%</TableCell>
                      <TableCell>{row.effectiveFrom || '—'}</TableCell>
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
    </PageContainer>
  );
};

export default CommissionSettings;
