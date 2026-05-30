import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, Alert, CircularProgress, Divider,
} from '@mui/material';
import { IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const STATUS_COLOR = { draft: 'default', submitted: 'info', approved: 'success' };
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

const GrnView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  if (loading) return <PageContainer title="GRN"><Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box></PageContainer>;
  if (!grn) return <PageContainer title="GRN"><Alert severity="error">{error || 'Not found'}</Alert></PageContainer>;

  return (
    <PageContainer title={`GRN ${grn.grn_number}`}>
      <Button startIcon={<IconArrowLeft size={16} />} onClick={() => navigate('/erp/grn')} sx={{ mb: 2 }}>Back to list</Button>

      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h4" fontWeight={800}>{grn.grn_number}</Typography>
          <Stack direction="row" spacing={1} mt={1}>
            <Chip label={grn.status} color={STATUS_COLOR[grn.status]} sx={{ fontWeight: 700, textTransform: 'capitalize' }} />
            {grn.workOrder && <Chip variant="outlined" label={grn.workOrder.title} />}
          </Stack>
        </Box>
        {grn.status !== 'approved' && (
          <Button variant="contained" color="success" startIcon={<IconCheck size={18} />} onClick={approve} disabled={approving}>
            {approving ? 'Approving…' : 'Approve & update inventory'}
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {grn.notes && (
        <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={0.5}>Notes</Typography>
          <Typography variant="body2">{grn.notes}</Typography>
        </Paper>
      )}

      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden', mb: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {['Product', 'Material type', 'Quantity', 'UOM', 'Notes'].map((h) => (
                <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {(grn.items || []).map((it) => (
              <TableRow key={it.id}>
                <TableCell>{it.item_name}</TableCell>
                <TableCell>{it.materialType?.display_name || '—'}</TableCell>
                <TableCell>{fmt(it.quantity)}</TableCell>
                <TableCell>{it.unit_of_measure}</TableCell>
                <TableCell>{it.notes || '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {(grn.images || []).length > 0 && (
        <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Photos</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {grn.images.map((img) => (
              <Box key={img.id} component="a" href={img.image_url} target="_blank" rel="noreferrer">
                <Box component="img" src={img.image_url} alt={img.original_name} sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
              </Box>
            ))}
          </Stack>
        </Paper>
      )}

      {grn.status === 'approved' && grn.approved_at && (
        <Typography variant="caption" color="text.secondary" display="block" mt={2}>
          Approved {new Date(grn.approved_at).toLocaleString()}
          {grn.approvedByUser && ` by ${grn.approvedByUser.first_name} ${grn.approvedByUser.last_name}`}
        </Typography>
      )}
    </PageContainer>
  );
};

export default GrnView;
