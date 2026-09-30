import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Button, Stack, Paper, TextField, MenuItem, Alert, CircularProgress,
  Checkbox, FormControlLabel, FormControl, FormLabel, RadioGroup, Radio, Autocomplete,
  Divider, Chip, IconButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconCertificate, IconUpload, IconTrash } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const CERT_TYPES = [
  { value: 'green_certificate', label: 'Green Certificate' },
  { value: 'certificate_of_destruction', label: 'Certificate of Destruction' },
  { value: 'certificate_of_data_destruction', label: 'Certificate of Data Destruction' },
  { value: 'carbon_footprint', label: 'Carbon Footprint Certificate' },
  { value: 'destruction_report_evidence', label: 'Destruction Report with Evidence' },
];

const PHOTO_STAGES = [
  { value: 'arrival', label: 'Arrival of materials' },
  { value: 'destruction_in_progress', label: 'Destruction in progress' },
  { value: 'other', label: 'Other' },
];

const emptyForm = () => ({
  companyName: '', contactPerson: '', contactNo: '', contactEmail: '', collectionDate: '',
  grnId: '', grnNo: '', materialWasteDetails: '', totalWeightQuantity: '', invoiceNo: '',
  additionalNotes: '', certificateTypes: [], destructionReportVariant: 'itemized_equipment',
  wdsRefNo: '', docRef: '', reqNo: '', boeNo: '', barcode: '', materialTypeId: '',
});

const CertificateRequestForm = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();

  const [form, setForm] = useState(emptyForm());
  const [grns, setGrns] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [supportingDoc, setSupportingDoc] = useState(null);
  const [photos, setPhotos] = useState([]); // { filePath, fileName, fileType, photoStage }
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiService.getGrns({ pageSize: 100 }).then((res) => {
      if (res?.success) setGrns(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
    apiService.getMaterialTypes().then((res) => {
      if (res?.success) setMaterialTypes(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
  }, []);

  const needsEvidence = form.certificateTypes.includes('destruction_report_evidence');
  const isBulkVariant = needsEvidence && form.destructionReportVariant === 'bulk_material';
  const hasPhoto = photos.length > 0;

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const toggleType = (type) => {
    setForm((p) => {
      const has = p.certificateTypes.includes(type);
      return { ...p, certificateTypes: has ? p.certificateTypes.filter((t) => t !== type) : [...p.certificateTypes, type] };
    });
  };

  const handleSupportingDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const res = await apiService.uploadCertificateAttachment(file);
      if (res?.success) setSupportingDoc({ filePath: res.data.path, fileName: file.name });
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      setUploading(true);
      const uploaded = [];
      for (const file of files) {
        const res = await apiService.uploadCertificateAttachment(file);
        if (res?.success) {
          uploaded.push({
            filePath: res.data.path,
            fileName: file.name,
            fileType: 'destruction_photo',
            photoStage: 'other',
          });
        }
      }
      setPhotos((p) => [...p, ...uploaded]);
    } catch (err) {
      setError(err.message || 'Photo upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const updatePhotoStage = (idx, stage) => {
    setPhotos((p) => p.map((ph, i) => (i === idx ? { ...ph, photoStage: stage } : ph)));
  };

  const removePhoto = (idx) => setPhotos((p) => p.filter((_, i) => i !== idx));

  const validate = () => {
    if (!form.companyName.trim() || !form.contactPerson.trim() || !form.contactNo.trim()
      || !form.contactEmail.trim() || !form.collectionDate || !form.materialWasteDetails.trim()
      || !form.totalWeightQuantity) {
      return 'Please fill in all required fields (marked *).';
    }
    if (!form.certificateTypes.length) {
      return 'Select at least one certificate type.';
    }
    if (needsEvidence && !hasPhoto) {
      return 'At least one photo is required for the Destruction Report with Evidence certificate type.';
    }
    return '';
  };

  const submit = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setError('');
    const attachments = [
      ...(supportingDoc ? [{ filePath: supportingDoc.filePath, fileName: supportingDoc.fileName, fileType: 'grn_report' }] : []),
      ...photos,
    ];
    const payload = {
      companyName: form.companyName.trim(),
      contactPerson: form.contactPerson.trim(),
      contactNo: form.contactNo.trim(),
      contactEmail: form.contactEmail.trim(),
      collectionDate: form.collectionDate,
      grnId: form.grnId || undefined,
      grnNo: !form.grnId ? (form.grnNo || undefined) : undefined,
      materialWasteDetails: form.materialWasteDetails.trim(),
      totalWeightQuantity: parseFloat(form.totalWeightQuantity),
      invoiceNo: form.invoiceNo || undefined,
      additionalNotes: form.additionalNotes || undefined,
      certificateTypes: form.certificateTypes,
      destructionReportVariant: needsEvidence ? form.destructionReportVariant : undefined,
      wdsRefNo: isBulkVariant ? form.wdsRefNo || undefined : undefined,
      docRef: isBulkVariant ? form.docRef || undefined : undefined,
      reqNo: isBulkVariant ? form.reqNo || undefined : undefined,
      boeNo: isBulkVariant ? form.boeNo || undefined : undefined,
      barcode: isBulkVariant ? form.barcode || undefined : undefined,
      materialTypeId: form.materialTypeId || undefined,
      attachments,
    };
    try {
      setSaving(true);
      const res = await apiService.createCertificateRequest(payload);
      if (res.success) navigate(`/erp/certificates/requests/view/${res.data.id}`);
      else setError(res.message || 'Failed to create certificate request');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="New Certificate Request" description="Submit a certificate request">
      <Button startIcon={<IconArrowLeft size={16} />} onClick={() => navigate(-1)} sx={{ mb: 2.5, borderRadius: 2 }}>
        Back
      </Button>

      <Stack direction="row" alignItems="center" spacing={2} mb={3.5}>
        <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconCertificate size={24} color={theme.palette.primary.main} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800}>New Certificate Request</Typography>
          <Typography variant="body2" color="text.secondary">Submit after completing a service, attaching the GRN report or WDS</Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Certificate Type(s) *</Typography>
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {CERT_TYPES.map((t) => (
            <FormControlLabel
              key={t.value}
              control={<Checkbox checked={form.certificateTypes.includes(t.value)} onChange={() => toggleType(t.value)} />}
              label={t.label}
            />
          ))}
        </Stack>

        {needsEvidence && (
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
            <FormControl>
              <FormLabel sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Destruction Report Variant</FormLabel>
              <RadioGroup row value={form.destructionReportVariant} onChange={set('destructionReportVariant')}>
                <FormControlLabel value="itemized_equipment" control={<Radio />} label="Itemized Equipment" />
                <FormControlLabel value="bulk_material" control={<Radio />} label="Bulk Material" />
              </RadioGroup>
            </FormControl>
          </Box>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Request Details</Typography>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField fullWidth required label="Company Name" value={form.companyName} onChange={set('companyName')} />
            <TextField fullWidth required label="Contact Person" value={form.contactPerson} onChange={set('contactPerson')} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField fullWidth required label="Contact No." value={form.contactNo} onChange={set('contactNo')} />
            <TextField fullWidth required type="email" label="Contact Email" value={form.contactEmail} onChange={set('contactEmail')} />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField fullWidth required type="date" label="Collection Date" InputLabelProps={{ shrink: true }} value={form.collectionDate} onChange={set('collectionDate')} />
            <Autocomplete
              fullWidth
              freeSolo
              options={grns}
              getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.grn_number || '')}
              value={grns.find((g) => g.id === form.grnId) || form.grnNo || null}
              onChange={(_, val) => {
                if (val && typeof val === 'object') setForm((p) => ({ ...p, grnId: val.id, grnNo: val.grn_number }));
                else setForm((p) => ({ ...p, grnId: '', grnNo: val || '' }));
              }}
              onInputChange={(_, val, reason) => {
                if (reason === 'input') setForm((p) => ({ ...p, grnId: '', grnNo: val }));
              }}
              renderInput={(params) => <TextField {...params} label="GRN No. (or free text)" />}
            />
          </Stack>
          <TextField fullWidth required multiline rows={2} label="Material / Waste Details" value={form.materialWasteDetails} onChange={set('materialWasteDetails')} />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField fullWidth required type="number" label="Total Weight / Quantity (tons)" value={form.totalWeightQuantity} onChange={set('totalWeightQuantity')} inputProps={{ min: 0, step: 'any' }} />
            <TextField fullWidth label="Invoice No." value={form.invoiceNo} onChange={set('invoiceNo')} />
            <TextField
              select fullWidth label="Material Type (for Carbon Footprint calc)"
              value={form.materialTypeId} onChange={set('materialTypeId')}
            >
              <MenuItem value="">— None / tenant default —</MenuItem>
              {materialTypes.map((m) => <MenuItem key={m.id} value={String(m.id)}>{m.display_name || m.value}</MenuItem>)}
            </TextField>
          </Stack>
          <TextField fullWidth multiline rows={2} label="Additional Notes" value={form.additionalNotes} onChange={set('additionalNotes')} />
          <TextField fullWidth label="Requested By" value={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || ''} disabled />
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Supporting Document (GRN / WDS)</Typography>
        <Button component="label" size="small" variant="outlined" startIcon={<IconUpload size={14} />} disabled={uploading} sx={{ borderRadius: 2 }}>
          {supportingDoc ? 'Replace document' : 'Upload document'}
          <input type="file" hidden accept="image/*,application/pdf" onChange={handleSupportingDocUpload} />
        </Button>
        {supportingDoc && <Chip sx={{ ml: 1.5 }} label={supportingDoc.fileName} onDelete={() => setSupportingDoc(null)} />}
      </Paper>

      {needsEvidence && (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5, borderColor: hasPhoto ? 'divider' : 'error.main' }}>
          <Typography variant="subtitle2" fontWeight={800} mb={0.5}>
            Destruction Photos * <Typography component="span" variant="caption" color="error">(at least one required)</Typography>
          </Typography>
          <Button component="label" size="small" variant="outlined" startIcon={<IconUpload size={14} />} disabled={uploading} sx={{ borderRadius: 2, mb: 1.5 }}>
            {uploading ? 'Uploading…' : 'Add photo(s)'}
            <input type="file" hidden multiple accept="image/*" onChange={handlePhotoUpload} />
          </Button>
          {!hasPhoto && <Alert severity="warning" sx={{ mb: 1.5, borderRadius: 2 }}>No photos attached yet — required to submit.</Alert>}
          <Stack spacing={1}>
            {photos.map((p, idx) => (
              <Stack key={idx} direction="row" spacing={1.5} alignItems="center">
                <Typography variant="body2" sx={{ minWidth: 160 }} noWrap>{p.fileName}</Typography>
                <TextField
                  select size="small" label="Stage" value={p.photoStage} onChange={(e) => updatePhotoStage(idx, e.target.value)}
                  sx={{ minWidth: 220 }}
                >
                  {PHOTO_STAGES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </TextField>
                <IconButton size="small" color="error" onClick={() => removePhoto(idx)}><IconTrash size={16} /></IconButton>
              </Stack>
            ))}
          </Stack>

          {isBulkVariant && (
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase' }}>
                Bulk material evidence reference fields
              </Typography>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap="wrap">
                <TextField size="small" label="WDS Ref No." value={form.wdsRefNo} onChange={set('wdsRefNo')} />
                <TextField size="small" label="DOC Ref" value={form.docRef} onChange={set('docRef')} />
                <TextField size="small" label="Req No." value={form.reqNo} onChange={set('reqNo')} />
                <TextField size="small" label="BOE No." value={form.boeNo} onChange={set('boeNo')} />
                <TextField size="small" label="Barcode" value={form.barcode} onChange={set('barcode')} />
              </Stack>
            </Box>
          )}
        </Paper>
      )}

      <Divider sx={{ mb: 2.5 }} />
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={submit} disabled={saving} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null} sx={{ borderRadius: 2.5, px: 3 }}>
          {saving ? 'Submitting…' : 'Submit Request'}
        </Button>
        <Button onClick={() => navigate('/erp/certificates/requests')} sx={{ borderRadius: 2 }}>Cancel</Button>
      </Stack>
    </PageContainer>
  );
};

export default CertificateRequestForm;
