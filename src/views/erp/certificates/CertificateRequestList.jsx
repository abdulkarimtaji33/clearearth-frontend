import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Stack, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, CircularProgress, Alert, TablePagination, TextField, MenuItem, Link, Button, InputAdornment,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconCertificate, IconPlus, IconFileCheck, IconSearch } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { getUserRole } from '../../../utils/authHelpers';

const STATUS_COLOR = { pending_verification: 'default', verified: 'info', generated: 'warning', issued: 'success' };
const STATUS_LABEL = { pending_verification: 'Pending Verification', verified: 'Verified', generated: 'Generated', issued: 'Issued' };
const VERIFIER_ROLES = ['hr_manager', 'admin', 'tenant_admin', 'super_admin'];

const CertificateRequestList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const roleName = getUserRole(user);
  const isVerifier = VERIFIER_ROLES.includes(roleName);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getCertificateRequests({
        page: page + 1, pageSize: rowsPerPage, status: status || undefined, search: search || undefined,
        mine: isVerifier ? undefined : true,
      });
      setRows(Array.isArray(res.data) ? res.data : []);
      setTotal(res.pagination?.totalItems ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, status, search, isVerifier]);

  useEffect(() => { load(); }, [load]);

  return (
    <PageContainer title="Certificate Requests" description="Requests submitted for certificate generation">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCertificate size={24} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>Certificate Requests</Typography>
            <Typography variant="body2" color="text.secondary">
              {total} record{total !== 1 ? 's' : ''} {isVerifier ? '· full verification queue' : '· your requests'}
            </Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={<IconPlus size={16} />} onClick={() => navigate('/erp/certificates/requests/new')} sx={{ borderRadius: 2.5 }}>
          New Request
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            <TextField
              size="small" label="Search company / contact / GRN no." value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              sx={{ width: 280 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment> }}
            />
            <TextField select size="small" label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} sx={{ width: 240 }}>
              <MenuItem value="">All statuses</MenuItem>
              <MenuItem value="pending_verification">Pending Verification</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="generated">Generated</MenuItem>
              <MenuItem value="issued">Issued</MenuItem>
            </TextField>
          </Stack>
        </Box>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                {['Company', 'Contact', 'Types', 'Collection Date', 'Status', 'Requested By', 'Created', ''].map((h) => (
                  <TableCell key={h || 'actions'} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5, whiteSpace: 'nowrap', color: 'text.secondary' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} align="center" sx={{ py: 8 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <IconFileCheck size={36} color={theme.palette.text.disabled} />
                    <Typography color="text.secondary" mt={1} fontWeight={600}>No certificate requests found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow
                    key={r.id} hover
                    sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.035) } }}
                    onClick={() => navigate(`/erp/certificates/requests/view/${r.id}`)}
                  >
                    <TableCell><Typography variant="body2" fontWeight={700}>{r.company_name}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2">{r.contact_person}</Typography>
                      <Typography variant="caption" color="text.secondary">{r.contact_no}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" gap={0.5} flexWrap="wrap">
                        {(r.types || []).map((t) => <Chip key={t.id} size="small" label={t.type.replace(/_/g, ' ')} variant="outlined" />)}
                      </Stack>
                    </TableCell>
                    <TableCell>{r.collection_date?.slice?.(0, 10) || '—'}</TableCell>
                    <TableCell>
                      <Chip size="small" label={STATUS_LABEL[r.status] || r.status} color={STATUS_COLOR[r.status] || 'default'} sx={{ fontWeight: 700, borderRadius: 1.5 }} />
                    </TableCell>
                    <TableCell>{r.requestedByUser ? `${r.requestedByUser.first_name || ''} ${r.requestedByUser.last_name || ''}`.trim() : '—'}</TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{r.created_at?.slice?.(0, 10) || '—'}</Typography></TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Link component="button" variant="body2" fontWeight={600} onClick={() => navigate(`/erp/certificates/requests/view/${r.id}`)}>View</Link>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div" count={total} page={page} onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage} onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>
    </PageContainer>
  );
};

export default CertificateRequestList;
