import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  Table, TableHead, TableBody, TableRow, TableCell, TableContainer, IconButton, Tooltip, CircularProgress,
} from '@mui/material';
import {
  IconDeviceLaptop, IconPlus, IconTrash, IconArrowBackUp, IconFileDownload,
} from '@tabler/icons-react';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import apiService from '../../../../../../services/api';
import {
  SectionCard, EmptyState, LoadingBlock, StatusChip, StatGrid, StatTile, tableSx, inputSx, dialogPaperProps, fmtDate,
} from '../../../components/HrUi';

const emptyAssetValues = { assetType: '', assetName: '', serialNumber: '', assignedDate: '', conditionNotes: '' };

/**
 * IT asset tracking. HR mode gets full CRUD (assign / mark returned / delete) plus the
 * IT Asset Form and Handover Form PDFs; self mode is read-only.
 */
const AssetsTab = ({ isSelf, base, employeeId }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(emptyAssetValues);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [missingKey, setMissingKey] = useState('');
  const [downloading, setDownloading] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.listEmployeeChildRecords(base, 'assets');
      if (res.success) setRows(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => { load(); }, [load]);

  const openForm = () => {
    setValues(emptyAssetValues);
    setFormError('');
    setMissingKey('');
    setOpen(true);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setFormError('');
    setMissingKey('');
    try {
      if (!values.assetType) { setMissingKey('assetType'); throw new Error('Asset Type is required'); }
      if (!values.assetName) { setMissingKey('assetName'); throw new Error('Asset Name is required'); }
      const res = await apiService.createEmployeeChildRecord(base, 'assets', values);
      if (res.success) {
        setOpen(false);
        load();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save asset');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReturned = async (id) => {
    if (!window.confirm('Mark this asset as returned?')) return;
    try {
      await apiService.markEmployeeAssetReturned(employeeId, id);
      load();
    } catch (err) {
      setError(err.message || 'Failed to update asset');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this asset record?')) return;
    try {
      await apiService.deleteEmployeeChildRecord(base, 'assets', id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete asset');
    }
  };

  const handleDownload = async (kind) => {
    setDownloading(kind);
    setError('');
    try {
      if (kind === 'asset-form') await apiService.downloadItAssetFormPdf(employeeId);
      if (kind === 'handover-form') await apiService.downloadHandoverFormPdf(employeeId);
    } catch (err) {
      setError(err.message || 'Failed to download PDF');
    } finally {
      setDownloading('');
    }
  };

  const assignedCount = rows.filter((r) => r.status === 'assigned').length;
  const returnedCount = rows.filter((r) => r.status === 'returned').length;

  const field = (key, label, extra = {}) => (
    <TextField
      fullWidth label={label}
      error={missingKey === key}
      helperText={missingKey === key ? `${label} is required` : ''}
      value={values[key]}
      onChange={(e) => { setValues((v) => ({ ...v, [key]: e.target.value })); if (missingKey === key) setMissingKey(''); }}
      sx={inputSx}
      {...extra}
    />
  );

  return (
    <Stack spacing={2.5}>
      {!loading && rows.length > 0 && (
        <StatGrid min={180}>
          <StatTile icon={IconDeviceLaptop} label="Currently assigned" value={assignedCount} tone="primary" />
          <StatTile icon={IconArrowBackUp} label="Returned" value={returnedCount} tone="success" />
        </StatGrid>
      )}
      <SectionCard
        icon={IconDeviceLaptop}
        title="IT assets"
        subtitle="Equipment issued to this employee"
        noPadding
        action={!isSelf && (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap justifyContent="flex-end">
            <Button
              size="small" variant="outlined" color="inherit"
              startIcon={downloading === 'asset-form' ? <CircularProgress size={14} /> : <IconFileDownload size={15} />}
              onClick={() => handleDownload('asset-form')} disabled={!!downloading}
              sx={{ borderRadius: 2, borderColor: 'divider', display: { xs: 'none', md: 'inline-flex' } }}
            >
              Asset form
            </Button>
            <Button
              size="small" variant="outlined" color="inherit"
              startIcon={downloading === 'handover-form' ? <CircularProgress size={14} /> : <IconFileDownload size={15} />}
              onClick={() => handleDownload('handover-form')} disabled={!!downloading}
              sx={{ borderRadius: 2, borderColor: 'divider', display: { xs: 'none', md: 'inline-flex' } }}
            >
              Handover form
            </Button>
            <Button size="small" variant="contained" startIcon={<IconPlus size={15} />} onClick={openForm} sx={{ borderRadius: 2 }}>
              Assign asset
            </Button>
          </Stack>
        )}
      >
        {error && <Alert severity="error" sx={{ m: 2, borderRadius: 2 }}>{error}</Alert>}
        {!isSelf && (
          <Stack direction="row" spacing={1} sx={{ display: { xs: 'flex', md: 'none' }, px: 2, pt: 2 }}>
            <Button size="small" variant="outlined" color="inherit" onClick={() => handleDownload('asset-form')} disabled={!!downloading} sx={{ borderRadius: 2, borderColor: 'divider' }}>Asset form</Button>
            <Button size="small" variant="outlined" color="inherit" onClick={() => handleDownload('handover-form')} disabled={!!downloading} sx={{ borderRadius: 2, borderColor: 'divider' }}>Handover form</Button>
          </Stack>
        )}
        {loading ? (
          <LoadingBlock py={4} />
        ) : rows.length === 0 ? (
          <EmptyState compact icon={IconDeviceLaptop} title="No assets assigned" message={isSelf ? 'Equipment issued to you will appear here.' : 'Assign a laptop, phone, SIM or access card to track it here.'} />
        ) : (
          <TableContainer>
            <Table sx={{ ...tableSx, minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Asset</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Serial number</TableCell>
                  <TableCell>Assigned</TableCell>
                  <TableCell>Status</TableCell>
                  {!isSelf && <TableCell align="right">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{row.asset_name || '—'}</Typography>
                      {row.condition_notes && <Typography variant="caption" color="text.secondary">{row.condition_notes}</Typography>}
                    </TableCell>
                    <TableCell>{row.asset_type || '—'}</TableCell>
                    <TableCell sx={{ fontFamily: 'monospace', fontSize: 13 }}>{row.serial_number || '—'}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(row.assigned_date) || '—'}</TableCell>
                    <TableCell><StatusChip status={row.status} /></TableCell>
                    {!isSelf && (
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                          {row.status === 'assigned' && (
                            <Tooltip title="Mark returned">
                              <IconButton size="small" onClick={() => handleMarkReturned(row.id)} sx={{ '&:hover': { color: 'success.main' } }}>
                                <IconArrowBackUp size={17} />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(row.id)} sx={{ '&:hover': { color: 'error.main' } }}>
                              <IconTrash size={16} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SectionCard>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm" PaperProps={dialogPaperProps}>
        <DialogTitle sx={{ fontWeight: 700 }}>Assign asset</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, pt: 1 }}>
              {field('assetType', 'Asset type', { required: true, placeholder: 'Laptop, Phone, SIM Card...' })}
              {field('assetName', 'Asset name', { required: true, placeholder: 'e.g. Dell Latitude 5420' })}
              {field('serialNumber', 'Serial number')}
              <DatePicker
                label="Assigned date"
                value={values.assignedDate ? dayjs(values.assignedDate) : null}
                onChange={(nv) => setValues((v) => ({ ...v, assignedDate: nv ? nv.format('YYYY-MM-DD') : '' }))}
                slotProps={{ textField: { fullWidth: true, sx: inputSx } }}
              />
              <Box sx={{ gridColumn: '1 / -1' }}>
                {field('conditionNotes', 'Condition notes', { multiline: true, rows: 2 })}
              </Box>
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setOpen(false)} color="inherit" sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit} disabled={saving} sx={{ borderRadius: 2 }}>
            {saving ? 'Saving...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default AssetsTab;
