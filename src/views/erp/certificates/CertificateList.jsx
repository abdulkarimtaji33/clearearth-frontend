import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Stack, Paper, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, CircularProgress, Alert, TablePagination, TextField, MenuItem, Link, Button,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconCertificate, IconFileCheck, IconDownload } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const TYPE_LABEL = {
  green_certificate: 'Green Certificate',
  certificate_of_destruction: 'Certificate of Destruction',
  certificate_of_data_destruction: 'Certificate of Data Destruction',
  carbon_footprint: 'Carbon Footprint Certificate',
  destruction_report_evidence: 'Destruction Report with Evidence',
};

function toCsv(rows) {
  const headers = ['No.', 'Certificate No.', 'Company', 'Quantity', 'Collection Date', 'Certification Date', 'Contact Person', 'Marketing', 'Item Details'];
  const lines = [headers.join(',')];
  rows.forEach((r, idx) => {
    const req = r.request || {};
    const marketing = req.requestedByUser ? `${req.requestedByUser.first_name || ''} ${req.requestedByUser.last_name || ''}`.trim() : '';
    const cells = [
      idx + 1, r.certificate_number, req.company_name, req.total_weight_quantity, req.collection_date?.slice?.(0, 10),
      r.issued_date?.slice?.(0, 10), req.contact_person, marketing, req.material_waste_details,
    ].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`);
    lines.push(cells.join(','));
  });
  return lines.join('\n');
}

const CertificateList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getCertificates({
        page: page + 1, pageSize: rowsPerPage, search: search || undefined, type: type || undefined,
        from: from || undefined, to: to || undefined,
      });
      setRows(Array.isArray(res.data) ? res.data : []);
      setTotal(res.pagination?.totalItems ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, type, from, to]);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `certificates-register-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <PageContainer title="Certificate Register" description="Log of all issued certificates">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCertificate size={24} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>Certificate Register</Typography>
            <Typography variant="body2" color="text.secondary">{total} certificate{total !== 1 ? 's' : ''} issued</Typography>
          </Box>
        </Stack>
        <Button variant="outlined" startIcon={<IconDownload size={16} />} onClick={exportCsv} sx={{ borderRadius: 2.5 }}>Export CSV</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            <TextField size="small" label="Search company / contact" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} sx={{ width: 240 }} />
            <TextField select size="small" label="Type" value={type} onChange={(e) => { setType(e.target.value); setPage(0); }} sx={{ width: 220 }}>
              <MenuItem value="">All types</MenuItem>
              {Object.entries(TYPE_LABEL).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
            </TextField>
            <TextField size="small" type="date" label="From" InputLabelProps={{ shrink: true }} value={from} onChange={(e) => { setFrom(e.target.value); setPage(0); }} />
            <TextField size="small" type="date" label="To" InputLabelProps={{ shrink: true }} value={to} onChange={(e) => { setTo(e.target.value); setPage(0); }} />
          </Stack>
        </Box>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                {['No.', 'Certificate No.', 'Company', 'Quantity', 'Collection Date', 'Certification Date', 'Contact Person', 'Marketing', 'Item Details', ''].map((h) => (
                  <TableCell key={h || 'actions'} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5, whiteSpace: 'nowrap', color: 'text.secondary' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={10} align="center" sx={{ py: 8 }}><CircularProgress size={28} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 8 }}>
                    <IconFileCheck size={36} color={theme.palette.text.disabled} />
                    <Typography color="text.secondary" mt={1} fontWeight={600}>No certificates found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r, idx) => {
                  const req = r.request || {};
                  const marketing = req.requestedByUser ? `${req.requestedByUser.first_name || ''} ${req.requestedByUser.last_name || ''}`.trim() : '—';
                  return (
                    <TableRow key={r.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.035) } }} onClick={() => navigate(`/erp/certificates/view/${r.id}`)}>
                      <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell><Chip size="small" label={r.certificate_number} sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main' }} /></TableCell>
                      <TableCell><Typography variant="body2" fontWeight={700}>{req.company_name}</Typography></TableCell>
                      <TableCell>{req.total_weight_quantity} tons</TableCell>
                      <TableCell>{req.collection_date?.slice?.(0, 10) || '—'}</TableCell>
                      <TableCell>{r.issued_date?.slice?.(0, 10) || '—'}</TableCell>
                      <TableCell>{req.contact_person}</TableCell>
                      <TableCell>{marketing}</TableCell>
                      <TableCell><Typography noWrap sx={{ maxWidth: 180 }} variant="body2">{req.material_waste_details}</Typography></TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Link component="button" variant="body2" fontWeight={600} onClick={() => navigate(`/erp/certificates/view/${r.id}`)}>View</Link>
                      </TableCell>
                    </TableRow>
                  );
                })
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

export default CertificateList;
