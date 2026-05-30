import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Alert, CircularProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconCheck, IconPackage } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const STATUS_COLOR = { draft: 'default', submitted: 'info', approved: 'success' };
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

const GrnView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [grn, setGrn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [approving, setApproving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.getGrn(id);
      if (res.success) setGrn(res.data);
      else setError(res.message || 'Not found');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const approve = async () => {
    try {
      setApproving(true);
      const res = await apiService.approveGrn(id);
      if (res.success) setGrn(res.data);
      else setError(res.message);
    } catch (e) {
      setError(e.message);
    } finally {
      setApproving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer title="GRN">
        <Box display="flex" justifyContent="center" py={12}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (!grn) {
    return (
      <PageContainer title="GRN">
        <Alert severity="error" sx={{ borderRadius: 2 }}>{error || 'Not found'}</Alert>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={`GRN ${grn.grn_number}`}>
      <Button
        startIcon={<IconArrowLeft size={16} />}
        onClick={() => navigate('/erp/grn')}
        sx={{ mb: 2.5, borderRadius: 2 }}
      >
        Back to list
      </Button>

      {/* Header banner */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          border: '1px solid',
          borderColor: grn.status === 'approved'
            ? alpha(theme.palette.success.main, 0.3)
            : grn.status === 'submitted'
            ? alpha(theme.palette.info.main, 0.3)
            : 'divider',
          bgcolor: grn.status === 'approved'
            ? alpha(theme.palette.success.main, 0.04)
            : grn.status === 'submitted'
            ? alpha(theme.palette.info.main, 0.04)
            : 'background.paper',
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
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
                {grn.grn_number}
              </Typography>
              <Stack direction="row" spacing={1} mt={0.5} alignItems="center">
                <Chip
                  label={grn.status}
                  color={STATUS_COLOR[grn.status]}
                  size="small"
                  sx={{ fontWeight: 700, textTransform: 'capitalize' }}
                />
                {grn.workOrder && (
                  <Chip variant="outlined" label={grn.workOrder.title} size="small" />
                )}
              </Stack>
            </Box>
          </Stack>
          {grn.status !== 'approved' && (
            <Button
              variant="contained"
              color="success"
              startIcon={approving ? <CircularProgress size={16} color="inherit" /> : <IconCheck size={18} />}
              onClick={approve}
              disabled={approving}
              sx={{ borderRadius: 2.5, px: 2.5 }}
            >
              {approving ? 'Approving…' : 'Approve & update inventory'}
            </Button>
          )}
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

      {grn.notes && (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5, borderRadius: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={0.75}>
            Notes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {grn.notes}
          </Typography>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2.5 }}>
        <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="subtitle2" fontWeight={800}>
            Line items
          </Typography>
        </Box>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.03) }}>
              {['#', 'Product', 'Material type', 'Quantity', 'UOM', 'Notes'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(grn.items || []).map((it, i) => (
              <TableRow key={it.id} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                <TableCell>
                  <Typography variant="caption" fontWeight={700} color="text.disabled">
                    {i + 1}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600}>
                    {it.item_name}
                  </Typography>
                </TableCell>
                <TableCell>{it.materialType?.display_name || '—'}</TableCell>
                <TableCell>
                  <Typography fontWeight={700}>{fmt(it.quantity)}</Typography>
                </TableCell>
                <TableCell>{it.unit_of_measure}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {it.notes || '—'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {(grn.images || []).length > 0 && (
        <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
            Photos ({grn.images.length})
          </Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            {grn.images.map((img) => (
              <Box
                key={img.id}
                component="a"
                href={img.image_url}
                target="_blank"
                rel="noreferrer"
                sx={{ display: 'block', borderRadius: 2, overflow: 'hidden', transition: 'opacity 0.15s', '&:hover': { opacity: 0.85 } }}
              >
                <Box
                  component="img"
                  src={img.image_url}
                  alt={img.original_name}
                  sx={{ width: 110, height: 110, objectFit: 'cover', display: 'block' }}
                />
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {grn.status === 'approved' && grn.approved_at && (
        <Typography variant="caption" color="text.secondary" display="block" mt={2.5}>
          Approved on {new Date(grn.approved_at).toLocaleString()}
          {grn.approvedByUser && ` by ${grn.approvedByUser.first_name} ${grn.approvedByUser.last_name}`}
        </Typography>
      )}
    </PageContainer>
  );
};

export default GrnView;
