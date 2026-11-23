import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Button, Stack, Paper, Chip, Alert, CircularProgress, Grid, TextField, Autocomplete,
  ToggleButton, ToggleButtonGroup, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Divider, Link,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconArrowLeft, IconDownload, IconDeviceFloppy, IconPlus, IconTrash, IconTruckDelivery, IconHistory,
  IconPackage, IconBriefcase, IconBuilding, IconHammer,
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import UomSelectField from '../../../components/erp/UomSelectField';
import PickupDatePanel from '../../../components/erp/PickupDatePanel';
import apiService from '../../../services/api';
import useUnitsOfMeasure from '../../../hooks/useUnitsOfMeasure';
import { useAuth } from '../../../context/AuthContext';
import { OUTBOUND_STATUS, OUTBOUND_TYPE } from './OutboundList';
import { getClientLabel } from '../grn/grnDisplayHelpers';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const EVENT_LABEL = {
  created: 'Created', updated: 'Details saved', gatepass_issued: 'Gatepass issued', delivery_requested: 'Delivery date requested',
  delivery_confirmed: 'Delivery date confirmed', delivery_reschedule_requested: 'Reschedule requested',
};
const emptyLine = () => ({ itemName: '', unitOfMeasure: 'kg', quantity: '', unitValue: '', grnItemId: null, materialTypeId: null });

const Ref = ({ icon: Icon, label, children }) => (
  <Stack direction="row" spacing={1.25} alignItems="flex-start">
    <Icon size={18} style={{ marginTop: 2, opacity: 0.6 }} />
    <Box>
      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', letterSpacing: 0.4 }}>{label}</Typography>
      <Box>{children}</Box>
    </Box>
  </Stack>
);

const OutboundView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const { unitsOfMeasure } = useUnitsOfMeasure();
  const [uoms, setUoms] = useState([]);
  const canUpdate = hasPermission('outbound.update');
  const canSchedule = hasPermission('outbound.schedule');

  const [ob, setOb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [companies, setCompanies] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  const [type, setType] = useState('');
  const [company, setCompany] = useState(null);
  const [supplier, setSupplier] = useState(null);
  const [vehicleNo, setVehicleNo] = useState('');
  const [personInCharge, setPersonInCharge] = useState('');
  const [description, setDescription] = useState('');
  const [lines, setLines] = useState([]);
  const [reqDate, setReqDate] = useState('');
  const [reqNote, setReqNote] = useState('');

  useEffect(() => { if (unitsOfMeasure?.length) setUoms(unitsOfMeasure); }, [unitsOfMeasure]);

  const hydrate = (o) => {
    setOb(o);
    setType(o.outbound_type || '');
    setCompany(o.company ? { id: o.company.id, company_name: o.company.company_name } : null);
    setSupplier(o.supplier ? { id: o.supplier.id, company_name: o.supplier.company_name } : null);
    setVehicleNo(o.vehicle_no || '');
    setPersonInCharge(o.person_in_charge || '');
    setDescription(o.description || '');
    setLines((o.items || []).map((i) => ({
      itemName: i.item_name || '', unitOfMeasure: i.unit_of_measure || 'kg', quantity: String(i.quantity ?? ''),
      unitValue: i.unit_value != null ? String(i.unit_value) : '', grnItemId: i.grn_item_id, materialTypeId: i.material_type_id,
    })));
  };

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiService.getOutbound(id);
      if (res.success) hydrate(res.data); else setError(res.message || 'Not found');
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    apiService.getCompanies({ pageSize: 500 }).then((r) => setCompanies(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    apiService.getSuppliers({ pageSize: 500 }).then((r) => setSuppliers(Array.isArray(r.data) ? r.data : [])).catch(() => {});
  }, []);

  const completed = ob?.status === 'completed';
  const isFoc = ob?.deal?.deal_type === 'free_of_charge';
  const isSale = type === 'sale';
  const showValue = isSale || isFoc;
  const editable = canUpdate && !completed;
  const total = useMemo(() => lines.reduce((s, l) => s + (parseFloat(l.quantity) || 0) * (parseFloat(l.unitValue) || 0), 0), [lines]);

  const setLine = (i, k, v) => setLines((p) => p.map((l, idx) => (idx === i ? { ...l, [k]: v } : l)));

  const save = async () => {
    setError(''); setNotice('');
    try {
      setSaving(true);
      const payload = { vehicleNo, personInCharge, description };
      if (!completed) {
        payload.outboundType = type || null;
        payload.companyId = isSale ? company?.id || null : null;
        payload.supplierId = type && !isSale ? supplier?.id || null : null;
        payload.items = lines.map((l) => ({
          itemName: l.itemName, unitOfMeasure: l.unitOfMeasure, quantity: parseFloat(l.quantity),
          unitValue: l.unitValue === '' ? null : parseFloat(l.unitValue), grnItemId: l.grnItemId, materialTypeId: l.materialTypeId,
        }));
      }
      const res = await apiService.updateOutbound(id, payload);
      if (res.success) {
        hydrate(res.data);
        setNotice(!completed && type ? `Saved. Gatepass ${res.data.gatepass_number} was created.` : 'Saved.');
      } else setError(res.message || 'Could not save');
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  };

  const run = async (fn) => {
    setError(''); setNotice('');
    try { setBusy(true); const res = await fn(); if (res.success) hydrate(res.data); else setError(res.message); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  if (loading) return <Box sx={{ py: 10, textAlign: 'center' }}><CircularProgress /></Box>;
  if (!ob) return <PageContainer title="Outbound"><Alert severity="error">{error || 'Outbound entry not found'}</Alert></PageContainer>;

  const st = OUTBOUND_STATUS[ob.status] || { label: ob.status, color: 'default' };
  const deliveryEntity = {
    pickup_date_status: ob.delivery_date_status, requested_pickup_date: ob.requested_delivery_date,
    confirmed_pickup_date: ob.confirmed_delivery_date, pickup_reschedule_note: ob.delivery_reschedule_note, request_note: ob.delivery_notes,
  };
  const partyOptions = isSale ? companies : suppliers;
  const partyValue = isSale ? company : supplier;

  return (
    <PageContainer title={`Outbound ${ob.outbound_number}`} description="Outbound entry">
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} mb={2.5}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <IconButton onClick={() => navigate('/erp/outbound')}><IconArrowLeft size={20} /></IconButton>
          <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconTruckDelivery size={24} color={theme.palette.primary.main} />
          </Box>
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Typography variant="h4" fontWeight={800}>{ob.outbound_number}</Typography>
              <Chip size="small" label={st.label} color={st.color} sx={{ fontWeight: 700 }} />
              {ob.outbound_type && <Chip size="small" variant="outlined" label={OUTBOUND_TYPE[ob.outbound_type]} sx={{ fontWeight: 600 }} />}
              {isFoc && <Chip size="small" color="info" label="Free of cost" sx={{ fontWeight: 600 }} />}
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {ob.gatepass_number ? `Gatepass ${ob.gatepass_number}` : 'No gatepass yet. It is created when you save with a type.'}
            </Typography>
          </Box>
        </Stack>
        {ob.gatepass_number && (
          <Button variant="outlined" startIcon={<IconDownload size={18} />} onClick={() => apiService.downloadGatepassPdf(ob.id, ob.gatepass_number).catch((e) => setError(e.message))}>
            Download gatepass
          </Button>
        )}
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {notice && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setNotice('')}>{notice}</Alert>}

      <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5, borderRadius: 3 }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={3}>
            <Ref icon={IconPackage} label="GRN">
              <Link component="button" variant="body2" fontWeight={700} underline="hover" onClick={() => navigate(`/erp/grn/view/${ob.grn_id}`)}>{ob.grn?.grn_number || `#${ob.grn_id}`}</Link>
              <Typography variant="caption" color="text.secondary" display="block">
                {ob.grn?.disposed_without_facility ? 'Disposed without coming to the facility' : (ob.grn?.storageFacility?.name ? `Stored at ${ob.grn.storageFacility.name}` : 'Facility not set')}
              </Typography>
            </Ref>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Ref icon={IconBriefcase} label="Deal">
              {ob.deal ? (
                <Link component="button" variant="body2" fontWeight={700} underline="hover" onClick={() => navigate(`/erp/deals/view/${ob.deal.id}`)}>{ob.deal.deal_number} {ob.deal.title}</Link>
              ) : <Typography variant="body2">—</Typography>}
            </Ref>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Ref icon={IconBuilding} label="Client / Lead"><Typography variant="body2" fontWeight={700}>{getClientLabel(ob.deal)}</Typography></Ref>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Ref icon={IconHammer} label="Work order">
              {ob.work_order_id ? (
                <Link component="button" variant="body2" underline="hover" onClick={() => navigate(`/erp/work-orders/view/${ob.work_order_id}`)}>{ob.workOrder?.title || `#${ob.work_order_id}`}</Link>
              ) : <Typography variant="body2">—</Typography>}
            </Ref>
          </Grid>
        </Grid>
      </Paper>

      {/* Delivery date: sales request it, operations confirm or ask for another date */}
      {ob.requested_delivery_date ? (
        <PickupDatePanel
          label="Delivery"
          entity={deliveryEntity}
          isOperations={canUpdate}
          isPreparer={canSchedule}
          loading={busy}
          onConfirm={() => run(() => apiService.confirmOutboundDelivery(id))}
          onRequestReschedule={(note) => run(() => apiService.requestOutboundReschedule(id, note))}
          onReschedule={(date) => run(() => apiService.requestOutboundDelivery(id, { date, notes: ob.delivery_notes || '' }))}
        />
      ) : canSchedule ? (
        <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5, borderRadius: 3 }}>
          <Typography variant="subtitle2" fontWeight={800} mb={0.5}>Request a delivery date</Typography>
          <Typography variant="body2" color="text.secondary" mb={1.5}>Tell operations when the customer needs this delivered, the same way you schedule a pickup. Operations confirm it or ask for another date.</Typography>
          <Stack direction="row" spacing={1.5} flexWrap="wrap" alignItems="flex-start" useFlexGap>
            <TextField size="small" type="date" label="Delivery date" value={reqDate} onChange={(e) => setReqDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField size="small" label="Note for operations (optional)" value={reqNote} onChange={(e) => setReqNote(e.target.value)} sx={{ minWidth: 320 }} />
            <Button variant="contained" disabled={!reqDate || busy} onClick={() => run(() => apiService.requestOutboundDelivery(id, { date: reqDate, notes: reqNote }))}>Request delivery</Button>
          </Stack>
        </Paper>
      ) : null}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2.5 }}>
        <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="subtitle2" fontWeight={800}>Outbound details</Typography>
        </Box>
        <Box sx={{ p: 2.5 }}>
          {completed && <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>The gatepass is issued, so the type, party and items are locked. You can still update the vehicle, person in charge and description.</Alert>}
          <Typography variant="caption" color="text.secondary" fontWeight={700}>OUTBOUND TYPE</Typography>
          <Box mb={2} mt={0.5}>
            <ToggleButtonGroup
              exclusive size="small" color="primary" value={type || null} disabled={!editable}
              onChange={(_, v) => setType(v || '')}
            >
              <ToggleButton value="sale" sx={{ px: 2.5 }}>Sale</ToggleButton>
              <ToggleButton value="disposed" sx={{ px: 2.5 }}>Disposed</ToggleButton>
              <ToggleButton value="free_service" sx={{ px: 2.5 }}>Free service</ToggleButton>
            </ToggleButtonGroup>
            <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
              {type === 'sale' && 'Sale: a gatepass is created for the client.'}
              {type === 'disposed' && 'Disposed: a gatepass is created for the vendor.'}
              {type === 'free_service' && 'Free service: handled as a disposal, so pick the vendor and enter the same details.'}
              {!type && 'Choose Sale, Disposed or Free service to create the gatepass. Leave it empty to just save details for later.'}
            </Typography>
          </Box>

          {type && (
            <Autocomplete
              sx={{ mb: 2 }} disabled={!editable} options={partyOptions} value={partyValue}
              getOptionLabel={(o) => o?.company_name || ''} isOptionEqualToValue={(a, b) => a.id === b.id}
              onChange={(_, v) => (isSale ? setCompany(v) : setSupplier(v))}
              renderInput={(p) => <TextField {...p} label={isSale ? 'Client' : 'Vendor'} required helperText={isSale ? 'The client the goods are sold to' : 'The vendor the goods are handed to'} />}
            />
          )}

          <Grid container spacing={2} mb={2}>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Vehicle no" required={Boolean(type)} value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} disabled={!canUpdate} /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth label="Person in charge" required={Boolean(type)} value={personInCharge} onChange={(e) => setPersonInCharge(e.target.value)} disabled={!canUpdate} /></Grid>
          </Grid>

          <Typography variant="caption" color="text.secondary" fontWeight={700}>ITEMS</Typography>
          <Table size="small" sx={{ mb: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>Item</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 170 }}>UOM</TableCell>
                <TableCell sx={{ fontWeight: 700, width: 130 }} align="right">Amount</TableCell>
                {showValue && <TableCell sx={{ fontWeight: 700, width: 170 }} align="right">{isFoc ? 'Value of Material (VoM) / unit' : 'Price / unit'}</TableCell>}
                {showValue && <TableCell sx={{ fontWeight: 700, width: 120 }} align="right">Total</TableCell>}
                {editable && <TableCell sx={{ width: 48 }} />}
              </TableRow>
            </TableHead>
            <TableBody>
              {lines.map((l, i) => (
                <TableRow key={i}>
                  <TableCell><TextField fullWidth size="small" value={l.itemName} onChange={(e) => setLine(i, 'itemName', e.target.value)} disabled={!editable} /></TableCell>
                  <TableCell><UomSelectField value={l.unitOfMeasure} onChange={(v) => setLine(i, 'unitOfMeasure', v)} unitsOfMeasure={uoms} onUnitsChange={setUoms} disabled={!editable} /></TableCell>
                  <TableCell><TextField fullWidth size="small" type="number" inputProps={{ min: 0, step: '0.01' }} value={l.quantity} onChange={(e) => setLine(i, 'quantity', e.target.value)} disabled={!editable} /></TableCell>
                  {showValue && <TableCell><TextField fullWidth size="small" type="number" inputProps={{ min: 0, step: '0.01' }} value={l.unitValue} onChange={(e) => setLine(i, 'unitValue', e.target.value)} disabled={!editable} /></TableCell>}
                  {showValue && <TableCell align="right">{fmt((parseFloat(l.quantity) || 0) * (parseFloat(l.unitValue) || 0))}</TableCell>}
                  {editable && <TableCell><IconButton size="small" onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}><IconTrash size={16} /></IconButton></TableCell>}
                </TableRow>
              ))}
              {showValue && lines.length > 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="right" sx={{ fontWeight: 800 }}>Total value</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800 }}>{fmt(total)}</TableCell>
                  {editable && <TableCell />}
                </TableRow>
              )}
            </TableBody>
          </Table>
          {editable && <Button size="small" startIcon={<IconPlus size={16} />} onClick={() => setLines((p) => [...p, emptyLine()])}>Add item</Button>}
          {isFoc && isSale && <Alert severity="info" sx={{ mt: 1.5, borderRadius: 2 }}>This stock came in free of cost, with no value. Enter its Value of Material (VoM) per unit before selling it.</Alert>}

          <TextField fullWidth multiline rows={2} sx={{ mt: 2 }} label="Description" value={description} onChange={(e) => setDescription(e.target.value)} disabled={!canUpdate} />

          {canUpdate && (
            <Stack direction="row" justifyContent="flex-end" mt={2.5}>
              <Button variant="contained" size="large" startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <IconDeviceFloppy size={18} />} disabled={saving} onClick={save}>
                {completed ? 'Save changes' : type ? 'Save and create gatepass' : 'Save details'}
              </Button>
            </Stack>
          )}
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2.5 }}>
        <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Stack direction="row" spacing={1} alignItems="center"><IconHistory size={18} /><Typography variant="subtitle2" fontWeight={800}>History</Typography></Stack>
        </Box>
        <Box sx={{ p: 2.5 }}>
          {(ob.events || []).length === 0 ? <Typography variant="body2" color="text.secondary">No history yet.</Typography> : (ob.events || []).map((e, idx) => (
            <Box key={e.id}>
              {idx > 0 && <Divider sx={{ my: 1 }} />}
              <Typography variant="body2" fontWeight={700}>{EVENT_LABEL[e.action] || e.action}</Typography>
              <Typography variant="caption" color="text.secondary">
                {[e.user?.first_name, e.user?.last_name].filter(Boolean).join(' ') || 'System'} · {String(e.created_at || '').replace('T', ' ').slice(0, 16)}{e.detail ? ` · ${e.detail}` : ''}
              </Typography>
            </Box>
          ))}
        </Box>
      </Paper>
    </PageContainer>
  );
};

export default OutboundView;
