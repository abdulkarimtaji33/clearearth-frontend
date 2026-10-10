import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Stack, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, CircularProgress, Alert, TablePagination, TextField, MenuItem, Link, InputAdornment,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconBoxSeam, IconSearch, IconPackageOff } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const STATUS_COLOR = { new: 'default', submitted: 'info', approved: 'success' };

const colSpan = 9;

/**
 * Flat, filterable view of every GRN line item (as opposed to GrnList, which
 * lists GRNs themselves). Each row links through to its GRN and, when the
 * GRN is tied to a deal, to that deal too.
 */
const InventoryList = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [grnNumber, setGrnNumber] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getInventoryItems({
        page: page + 1,
        pageSize: rowsPerPage,
        search: search || undefined,
        grnNumber: grnNumber || undefined,
        status: status || undefined,
      });
      setRows(Array.isArray(res.data) ? res.data : []);
      setTotal(res.pagination?.totalItems ?? 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, grnNumber, status]);

  useEffect(() => { load(); }, [load]);

  const hasFilters = !!(search || grnNumber || status);

  return (
    <PageContainer title="Inventory" description="All items received across every GRN">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              width: 46, height: 46, borderRadius: 2.5,
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <IconBoxSeam size={24} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>Inventory</Typography>
            <Typography variant="body2" color="text.secondary">
              {total} item{total !== 1 ? 's' : ''} received across all GRNs
            </Typography>
          </Box>
        </Stack>
        <Chip size="small" label={`${total} total`} variant="outlined" sx={{ fontWeight: 700, borderRadius: 1.5 }} />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            <TextField
              size="small"
              label="Search item / make / model / serial"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              sx={{ width: 280 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment> }}
            />
            <TextField
              size="small"
              label="GRN #"
              placeholder="e.g. GRN-0012"
              value={grnNumber}
              onChange={(e) => { setGrnNumber(e.target.value); setPage(0); }}
              sx={{ width: 180 }}
            />
            <TextField
              select size="small" label="GRN status" value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(0); }}
              sx={{ width: 180 }}
            >
              <MenuItem value="">All statuses</MenuItem>
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
            </TextField>
          </Stack>
        </Box>

        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                {['GRN #', 'Item', 'Make / Model', 'Serial No.', 'Qty', 'Material Type', 'Deal', 'GRN Status', ''].map((h) => (
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
                      <IconPackageOff size={36} color={theme.palette.text.disabled} />
                      <Typography color="text.secondary" mt={1} fontWeight={600}>No items found</Typography>
                      {hasFilters && (
                        <Typography variant="caption" color="text.disabled">Try clearing the filters</Typography>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((item) => {
                  const grn = item.grn;
                  const deal = grn?.deal;
                  return (
                    <TableRow
                      key={item.id}
                      hover
                      sx={{ cursor: grn ? 'pointer' : 'default', transition: 'background 0.14s', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.035) } }}
                      onClick={() => grn && navigate(`/erp/grn/view/${grn.id}`)}
                    >
                      <TableCell>
                        {grn ? (
                          <Chip
                            size="small"
                            label={grn.grn_number}
                            sx={{
                              fontFamily: 'monospace', fontWeight: 700,
                              bgcolor: alpha(theme.palette.primary.main, 0.08), color: 'primary.main', borderRadius: 1.5,
                            }}
                          />
                        ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 200 }}>{item.item_name}</Typography>
                        {item.notes && (
                          <Typography variant="caption" color="text.secondary" noWrap display="block" sx={{ maxWidth: 200 }}>{item.notes}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" noWrap sx={{ maxWidth: 160 }}>
                          {[item.make, item.model].filter(Boolean).join(' · ') || <Typography component="span" color="text.disabled">—</Typography>}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: item.serial_number ? 'monospace' : undefined }} color={item.serial_number ? 'text.primary' : 'text.disabled'}>
                          {item.serial_number || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {item.quantity} {item.unit_of_measure || ''}
                          {item.units ? ` (${item.units} pcs)` : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color={item.materialType ? 'text.primary' : 'text.disabled'}>
                          {item.materialType?.display_name || item.materialType?.value || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {deal ? (
                          <Link
                            component="button" variant="body2" fontWeight={700} underline="hover"
                            onClick={() => navigate(`/erp/deals/view/${deal.id}`)}
                            sx={{ textAlign: 'left' }}
                          >
                            {deal.deal_number}
                            <Typography component="span" variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 160 }}>
                              {deal.company?.company_name || deal.title}
                            </Typography>
                          </Link>
                        ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell>
                        {grn ? (
                          <Chip
                            size="small" label={grn.status} color={STATUS_COLOR[grn.status] || 'default'}
                            sx={{ textTransform: 'capitalize', fontWeight: 700, borderRadius: 1.5, '& .MuiChip-label': { px: 1.2 } }}
                          />
                        ) : <Typography variant="body2" color="text.disabled">—</Typography>}
                      </TableCell>
                      <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                        {grn && (
                          <Link component="button" variant="body2" fontWeight={600} onClick={() => navigate(`/erp/grn/view/${grn.id}`)}>
                            View GRN
                          </Link>
                        )}
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
          rowsPerPageOptions={[10, 25, 50, 100]}
        />
      </Paper>
    </PageContainer>
  );
};

export default InventoryList;
