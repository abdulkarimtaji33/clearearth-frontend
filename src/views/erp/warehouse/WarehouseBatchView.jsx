import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Stack, Paper, Chip, Button, Alert, CircularProgress, Grid, Table, TableBody, TableCell, TableHead, TableRow,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Divider, IconButton, Link,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconPrinter, IconCut, IconPlayerPlay, IconPlus, IconTrash, IconLock } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { STATUS_COLOR, TagChip, TAG_GROUP_LABELS } from './WarehouseTracking';

const when = (v) => (v ? new Date(v).toLocaleString() : '—');
const nameOf = (u) => [u?.first_name, u?.last_name].filter(Boolean).join(' ') || 'System';

const WarehouseBatchView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [b, setB] = useState(null);
  const [meta, setMeta] = useState({ statuses: {}, categories: {}, actions: {} });
  const [tags, setTags] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState('');
  const [actionDlg, setActionDlg] = useState(null);
  const [form, setForm] = useState({});
  const [splitDlg, setSplitDlg] = useState(false);
  const [groups, setGroups] = useState([{ category: 'refurbishable', quantity: '', location: '' }]);
  const [tagToAdd, setTagToAdd] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setError('');
      const res = await apiService.get(`/warehouse/batches/${id}`);
      setB(res.data);
    } catch (e) {
      setError(e.message || 'Could not load this batch');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    apiService.get('/warehouse/meta').then((r) => setMeta(r?.data || meta)).catch(() => {});
    apiService.get('/warehouse/tags').then((r) => setTags(r?.data || [])).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  // The label image needs the login token, so it is fetched and shown from a blob.
  useEffect(() => {
    let url = '';
    let alive = true;
    fetch(`${apiService.baseURL}/warehouse/batches/${id}/qr`, { headers: { Authorization: `Bearer ${apiService.getAuthToken()}` } })
      .then((r) => (r.ok ? r.blob() : null))
      .then((blob) => { if (blob && alive) { url = URL.createObjectURL(blob); setQrUrl(url); } })
      .catch(() => {});
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, [id]);

  const run = async (fn, after) => {
    setBusy(true);
    setError('');
    try {
      const res = await fn();
      if (res?.data) setB(res.data);
      after?.();
    } catch (e) {
      setError(e.message || 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const printLabel = () => {
    const w = window.open('', '_blank', 'width=420,height=520');
    if (!w) return;
    w.document.write(`<html><head><title>${b.batch_code}</title></head><body style="font-family:Arial;text-align:center;padding:16px">
      <img src="${qrUrl}" style="width:240px;height:240px"/><div style="font-size:22px;font-weight:700;margin-top:6px">${b.batch_code}</div>
      <div style="font-size:14px">${b.item_name} · ${Number(b.quantity)} ${b.unit_of_measure || ''}</div>
      <div style="font-size:13px;color:#555">${b.customer_name || ''}</div>
      <script>window.onload=function(){window.print()}</script></body></html>`);
    w.document.close();
  };

  if (loading) return <PageContainer title="Batch"><Box display="flex" justifyContent="center" py={10}><CircularProgress /></Box></PageContainer>;
  if (!b) return <PageContainer title="Batch"><Alert severity="error">{error || 'Not found'}</Alert></PageContainer>;

  const attachedIds = new Set((b.tags || []).map((t) => t.id));
  const addable = tags.filter((t) => !attachedIds.has(t.id));
  const conditionTags = tags.filter((t) => t.tag_group === 'condition' && t.name !== 'Pending Inspection');
  const total = Number(b.quantity);
  const groupTotal = groups.reduce((s, g) => s + (Number(g.quantity) || 0), 0);
  const actionKey = actionDlg?.action;

  return (
    <PageContainer title={`Batch ${b.batch_code}`}>
      <Box sx={{ maxWidth: 1100, mx: 'auto', pb: 4 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={2.5}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/warehouse')} sx={{ borderRadius: 2 }}>Back</Button>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                <Typography variant="h4" fontWeight={800} sx={{ fontFamily: 'monospace' }}>{b.batch_code}</Typography>
                <Chip label={b.status_label} color={STATUS_COLOR[b.status] || 'default'} sx={{ fontWeight: 700 }} />
                {b.blocked && <Chip icon={<IconLock size={14} />} label="On hold" color="error" variant="outlined" sx={{ fontWeight: 700 }} />}
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {b.item_name} · {b.customer_name || 'No customer'} · receipt {b.receipt_code || '—'}
                {b.grn ? <> · <Link component="button" onClick={() => navigate(`/erp/grn/view/${b.grn.id}`)}>{b.grn.grn_number}</Link></> : null}
                {b.parent ? <> · split from <Link component="button" onClick={() => navigate(`/erp/warehouse/batch/${b.parent.id}`)}>{b.parent.batch_code}</Link></> : null}
              </Typography>
            </Box>
          </Stack>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {b.blocked && <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>This material is on customer hold. Only a manager can authorize processing or remove the hold tag.</Alert>}
        {b.data_destruction_required && <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>Data destruction is required: it cannot be sold, transferred or refurbished until it has been destroyed.</Alert>}

        <Grid container spacing={2.5}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 2.5 }}>
              <Grid container spacing={2}>
                {[
                  ['Quantity', `${total.toLocaleString()} ${b.unit_of_measure || ''}`],
                  ['Location', b.location || '—'],
                  ['Received', when(b.received_at)],
                  ['Assigned to groups', `${Number(b.allocated_quantity).toLocaleString()} ${b.unit_of_measure || ''}`],
                  ['Not yet assigned', `${Number(b.unallocated_quantity).toLocaleString()} ${b.unit_of_measure || ''}`],
                  ['Category', b.handling_category ? (meta.categories[b.handling_category] || b.handling_category) : '—'],
                ].map(([k, v]) => (
                  <Grid key={k} size={{ xs: 6, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>{k}</Typography>
                    <Typography variant="body1" fontWeight={700}>{v}</Typography>
                  </Grid>
                ))}
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" fontWeight={800} mb={1}>Tags</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
                {(b.tags || []).map((t) => (
                  <TagChip key={t.id} tag={t} onDelete={() => run(() => apiService.delete(`/warehouse/batches/${id}/tags/${t.id}`))} />
                ))}
                {!(b.tags || []).length && <Typography variant="body2" color="text.disabled">No tags</Typography>}
              </Box>
              <Stack direction="row" spacing={1}>
                <TextField select size="small" label="Add a tag" value={tagToAdd} onChange={(e) => setTagToAdd(e.target.value)} sx={{ minWidth: 260 }}>
                  {addable.map((t) => <MenuItem key={t.id} value={t.id}>{t.name} · {TAG_GROUP_LABELS[t.tag_group]}</MenuItem>)}
                </TextField>
                <Button variant="outlined" disabled={!tagToAdd || busy} startIcon={<IconPlus size={16} />} onClick={() => run(() => apiService.post(`/warehouse/batches/${id}/tags`, { tagId: tagToAdd }), () => setTagToAdd(''))} sx={{ borderRadius: 2 }}>Add</Button>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, mb: 2.5 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5} flexWrap="wrap" gap={1}>
                <Typography variant="subtitle2" fontWeight={800}>What do you want to do with this material?</Typography>
                <Button size="small" variant="outlined" startIcon={<IconCut size={16} />} disabled={Number(b.unallocated_quantity) <= 0} onClick={() => { setGroups([{ category: 'refurbishable', quantity: '', location: '' }]); setSplitDlg(true); }} sx={{ borderRadius: 2 }}>
                  Split into groups
                </Button>
              </Stack>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {(b.available_actions || []).map((a) => (
                  <Button key={a} size="small" variant="contained" startIcon={<IconPlayerPlay size={14} />} onClick={() => { setForm({ quantity: '', location: '', notes: '', condition: '' }); setActionDlg({ action: a }); }} sx={{ borderRadius: 2 }}>
                    {meta.actions[a] || a}
                  </Button>
                ))}
                {!(b.available_actions || []).length && <Typography variant="body2" color="text.disabled">No further action: this material has reached its final outcome.</Typography>}
              </Box>
            </Paper>

            {(b.children || []).length > 0 && (
              <Paper variant="outlined" sx={{ borderRadius: 3, mb: 2.5, overflow: 'hidden' }}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ p: 2, pb: 1 }}>Groups split from this batch</Typography>
                <Table size="small">
                  <TableHead><TableRow>{['Batch', 'Category', 'Quantity', 'Status', 'Location'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>{h}</TableCell>)}</TableRow></TableHead>
                  <TableBody>
                    {b.children.map((c) => (
                      <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/warehouse/batch/${c.id}`)}>
                        <TableCell><Chip size="small" label={c.batch_code} sx={{ fontFamily: 'monospace', fontWeight: 700 }} /></TableCell>
                        <TableCell>{meta.categories[c.handling_category] || '—'}</TableCell>
                        <TableCell>{Number(c.quantity).toLocaleString()} {c.unit_of_measure || ''}</TableCell>
                        <TableCell><Chip size="small" label={c.status_label} color={STATUS_COLOR[c.status] || 'default'} /></TableCell>
                        <TableCell>{c.location || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>
            )}

            <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Typography variant="subtitle2" fontWeight={800} sx={{ p: 2, pb: 1 }}>History</Typography>
              <Table size="small">
                <TableHead><TableRow>{['When', 'What', 'Quantity', 'Status', 'Location', 'By', 'Notes'].map((h) => <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>{h}</TableCell>)}</TableRow></TableHead>
                <TableBody>
                  {(b.movements || []).map((m) => (
                    <TableRow key={m.id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{when(m.created_at)}</TableCell>
                      <TableCell>{(meta.actions[m.action] || m.action.replace(/_/g, ' '))}</TableCell>
                      <TableCell>{m.quantity != null ? Number(m.quantity).toLocaleString() : '—'}</TableCell>
                      <TableCell>{m.to_status && m.to_status !== m.from_status ? `${meta.statuses[m.from_status] || '—'} → ${meta.statuses[m.to_status] || m.to_status}` : '—'}</TableCell>
                      <TableCell>{m.to_location && m.to_location !== m.from_location ? `${m.from_location || '—'} → ${m.to_location}` : (m.to_location || '—')}</TableCell>
                      <TableCell>{nameOf(m.user)}</TableCell>
                      <TableCell>{m.notes || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 3, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Label</Typography>
              {qrUrl ? <img src={qrUrl} alt={`QR ${b.batch_code}`} style={{ width: 200, height: 200 }} /> : <CircularProgress size={26} />}
              <Typography fontWeight={800} sx={{ fontFamily: 'monospace', mt: 1 }}>{b.batch_code}</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>Scan this code on the Material Tracking screen to open the batch.</Typography>
              <Button variant="outlined" size="small" startIcon={<IconPrinter size={16} />} onClick={printLabel} disabled={!qrUrl} sx={{ borderRadius: 2 }}>Print label</Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Dialog open={Boolean(actionDlg)} onClose={() => !busy && setActionDlg(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{meta.actions[actionKey] || 'Confirm action'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {actionKey === 'inspect' && (
              <TextField select label="Condition found" value={form.condition || ''} onChange={(e) => setForm({ ...form, condition: e.target.value })}>
                <MenuItem value="">Not recorded</MenuItem>
                {conditionTags.map((t) => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
              </TextField>
            )}
            <TextField label={actionKey === 'move' ? 'New location' : 'Destination / location (optional)'} value={form.location || ''} onChange={(e) => setForm({ ...form, location: e.target.value })} required={actionKey === 'move'} />
            <TextField type="number" label={`Quantity (optional, max ${total})`} value={form.quantity || ''} onChange={(e) => setForm({ ...form, quantity: e.target.value })} inputProps={{ min: 0, max: total, step: 'any' }} />
            <TextField label="Notes" multiline minRows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDlg(null)} disabled={busy}>Cancel</Button>
          <Button variant="contained" disabled={busy || (actionKey === 'move' && !String(form.location || '').trim())}
            onClick={() => run(() => apiService.post(`/warehouse/batches/${id}/actions`, { action: actionKey, ...form }), () => setActionDlg(null))}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={splitDlg} onClose={() => !busy && setSplitDlg(false)} maxWidth="md" fullWidth>
        <DialogTitle>Split {b.batch_code} into groups</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Each group becomes its own batch that stays linked to {b.batch_code}. {Number(b.unallocated_quantity).toLocaleString()} {b.unit_of_measure || ''} is still to be assigned.
          </Typography>
          <Stack spacing={1.5}>
            {groups.map((g, i) => (
              <Stack key={i} direction="row" spacing={1.5} alignItems="center">
                <TextField select size="small" label="Category" value={g.category} onChange={(e) => setGroups(groups.map((x, j) => (j === i ? { ...x, category: e.target.value } : x)))} sx={{ minWidth: 200 }}>
                  {Object.entries(meta.categories).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </TextField>
                <TextField size="small" type="number" label="Quantity" value={g.quantity} onChange={(e) => setGroups(groups.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)))} sx={{ width: 130 }} inputProps={{ min: 0, step: 'any' }} />
                <TextField size="small" label="Location (optional)" value={g.location} onChange={(e) => setGroups(groups.map((x, j) => (j === i ? { ...x, location: e.target.value } : x)))} sx={{ flex: 1 }} />
                <IconButton size="small" onClick={() => setGroups(groups.filter((_, j) => j !== i))} disabled={groups.length === 1}><IconTrash size={16} /></IconButton>
              </Stack>
            ))}
            <Box><Button size="small" startIcon={<IconPlus size={14} />} onClick={() => setGroups([...groups, { category: 'recyclable', quantity: '', location: '' }])}>Add group</Button></Box>
            <Typography variant="body2" color={groupTotal > Number(b.unallocated_quantity) ? 'error.main' : 'text.secondary'}>
              Assigned in this split: {groupTotal.toLocaleString()} of {Number(b.unallocated_quantity).toLocaleString()}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSplitDlg(false)} disabled={busy}>Cancel</Button>
          <Button variant="contained" disabled={busy || groupTotal <= 0 || groupTotal > Number(b.unallocated_quantity)}
            onClick={() => run(() => apiService.post(`/warehouse/batches/${id}/split`, { groups }), () => setSplitDlg(false))}>
            Split
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default WarehouseBatchView;
