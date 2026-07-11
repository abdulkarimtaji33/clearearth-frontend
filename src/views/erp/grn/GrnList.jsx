import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Stack, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Alert, TablePagination, TextField, MenuItem, Link, InputAdornment,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconPackage, IconFileCheck, IconFilter } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { getClientLabel, getContactDetails, getSalesPerson } from './grnDisplayHelpers';

const STATUS_COLOR = { new: 'default', submitted: 'info', approved: 'success' };

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

  const colSpan = 10;

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
              {total} record{total !== 1 ? 's' : ''} · created when a work order is completed
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Chip
            size="small"
            label={`${total} total`}
            variant="outlined"
            sx={{ fontWeight: 700, borderRadius: 1.5 }}
          />
        </Stack>
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
            sx={{ width: 220 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconFilter size={16} />
                </InputAdornment>
              ),
            }}
          >
            <MenuItem value="">All statuses</MenuItem>
            <MenuItem value="new">New</MenuItem>
            <MenuItem value="submitted">Submitted</MenuItem>
            <MenuItem value="approved">Approved</MenuItem>
          </TextField>
        </Box>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                {['GRN #', 'Deal', 'Client / Lead', 'Contact', 'Sales person', 'Work Order', 'Items', 'Status', 'Created', ''].map((h) => (
                  <TableCell
                    key={h || 'actions'}
                    sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5, whiteSpace: 'nowrap', color: 'text.secondary' }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={colSpan} align="center" sx={{ py: 8 }}>
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
                rows.map((r) => {
                  const deal = r.deal;
                  const client = getClientLabel(deal);
                  const contact = getContactDetails(deal);
                  const sales = getSalesPerson(deal);

                  return (
                    <TableRow
                      key={r.id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        transition: 'background 0.14s',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.035) },
                      }}
                      onClick={() => navigate(`/erp/grn/view/${r.id}`)}
                    >
                      <TableCell>
                        <Chip
                          size="small"
                          label={r.grn_number}
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            color: 'primary.main',
                            borderRadius: 1.5,
                          }}
                        />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {deal ? (
                          <Link
                            component="button"
                            variant="body2"
                            fontWeight={700}
                            underline="hover"
                            onClick={() => navigate(`/erp/deals/view/${deal.id}`)}
                            sx={{ textAlign: 'left' }}
                          >
                            {deal.deal_number}
                            <Typography component="span" variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 160 }}>
                              {deal.title}
                            </Typography>
                          </Link>
                        ) : (
                          <Typography variant="body2" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 160 }}>
                          {client}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {contact.name || contact.phone || contact.email ? (
                          <Box>
                            {contact.name && (
                              <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>
                                {contact.name}
                              </Typography>
                            )}
                            {contact.phone && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {contact.phone}
                              </Typography>
                            )}
                            {contact.email && !contact.phone && (
                              <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 140 }}>
                                {contact.email}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {sales ? (
                          <Box>
                            <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>
                              {sales.name}
                            </Typography>
                            {sales.phone && (
                              <Typography variant="caption" color="text.secondary" display="block">
                                {sales.phone}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {r.work_order_id ? (
                          <Link
                            component="button"
                            variant="body2"
                            underline="hover"
                            onClick={() => navigate(`/erp/work-orders/view/${r.work_order_id}`)}
                          >
                            {r.workOrder?.title || `#${r.work_order_id}`}
                          </Link>
                        ) : (
                          <Typography variant="body2" color="text.disabled">—</Typography>
                        )}
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
                          sx={{
                            textTransform: 'capitalize',
                            fontWeight: 700,
                            borderRadius: 1.5,
                            '& .MuiChip-label': { px: 1.2 },
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {r.created_at?.slice?.(0, 10) || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          component="button"
                          variant="body2"
                          fontWeight={600}
                          onClick={() => navigate(`/erp/grn/view/${r.id}`)}
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })
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
