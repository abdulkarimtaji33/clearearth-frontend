import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Alert, TablePagination, TextField, MenuItem,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconPackage, IconPlus, IconFileCheck } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const STATUS_COLOR = { draft: 'default', submitted: 'info', approved: 'success' };

const GrnList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getGrns({ page: page + 1, pageSize: rowsPerPage, status: status || undefined });
      setRows(Array.isArray(res.data) ? res.data : []);
      setTotal(res.pagination?.totalItems ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, status]);

  useEffect(() => { load(); }, [load]);

  return (
    <PageContainer title="GRN" description="Goods received notes">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2.5,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconPackage size={24} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>
              Goods Received (GRN)
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {total} record{total !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Stack>
        <Button
          variant="contained"
          startIcon={<IconPlus size={18} />}
          onClick={() => navigate('/erp/grn/create')}
          sx={{ borderRadius: 2.5, px: 2.5 }}
        >
          New GRN
        </Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: alpha(theme.palette.primary.main, 0.02),
          }}
        >
          <TextField
            select
            size="small"
            label="Filter by status"
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0); }}
            sx={{ width: 200 }}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
          </TextField>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
                {['GRN #', 'Work Order', 'Deal', 'Items', 'Status', 'Created', ''].map((h) => (
                  <TableCell
                    key={h || 'actions'}
                    sx={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.4, py: 1.5 }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                    <Box>
                      <IconFileCheck size={36} color={theme.palette.text.disabled} />
                      <Typography color="text.secondary" mt={1} fontWeight={600}>
                        No GRNs found
                      </Typography>
                      {status && (
                        <Typography variant="caption" color="text.disabled">
                          Try clearing the status filter
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow
                    key={r.id}
                    hover
                    sx={{ cursor: 'pointer', transition: 'background 0.14s' }}
                    onClick={() => navigate(`/erp/grn/view/${r.id}`)}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{ fontFamily: 'monospace', color: 'primary.main' }}
                      >
                        {r.grn_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {r.workOrder?.title || r.work_order_id || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {r.deal ? `${r.deal.deal_number} ${r.deal.title}` : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={r.items?.length || 0}
                        variant="outlined"
                        sx={{ fontWeight: 700, minWidth: 32 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={r.status}
                        color={STATUS_COLOR[r.status] || 'default'}
                        sx={{ textTransform: 'capitalize', fontWeight: 700 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {r.created_at?.slice?.(0, 10) || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        sx={{ borderRadius: 2 }}
                        onClick={(e) => { e.stopPropagation(); navigate(`/erp/grn/view/${r.id}`); }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        />
      </Paper>
    </PageContainer>
  );
};

export default GrnList;
