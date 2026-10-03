import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Button, Stack, Paper, TextField, MenuItem, Alert, CircularProgress,
  Checkbox, FormControlLabel, FormControl, FormLabel, FormHelperText, RadioGroup, Radio, Autocomplete,
  Divider, Chip, IconButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconCertificate, IconUpload, IconTrash } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
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
  const { user, hasPermission } = useAuth();

  const [form, setForm] = useState(emptyForm());
  const [grns, setGrns] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [supportingDoc, setSupportingDoc] = useState(null);
  const [photos, setPhotos] = useState([]); // { filePath, fileName, fileType, photoStage }
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    if (!hasPermission('grn.read')) return;
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
    const errs = {};
    if (!form.companyName.trim()) errs.companyName = 'Company name is required';
    if (!form.contactPerson.trim()) errs.contactPerson = 'Contact person is required';
    if (!form.contactNo.trim()) errs.contactNo = 'Contact number is required';
    if (!form.contactEmail.trim()) errs.contactEmail = 'Contact email is required';
    if (!form.collectionDate) errs.collectionDate = 'Collection date is required';
    if (!form.materialWasteDetails.trim()) errs.materialWasteDetails = 'Material / waste details are required';
    if (!form.totalWeightQuantity) errs.totalWeightQuantity = 'Total weight / quantity is required';
    if (!form.certificateTypes.length) errs.certificateTypes = 'Select at least one certificate type.';
    if (needsEvidence && !hasPhoto) errs.photos = 'At least one photo is required for the Destruction Report with Evidence certificate type.';
    return errs;
  };

  const submit = async () => {
    setSubmitAttempted(true);
    const errs = validate();
    setFieldErrors(errs);
    if (Object.keys(errs).length) {
      setError('Please fix the highlighted fields before submitting.');
      return;
    }
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
      <Button variant="outlined" startIcon={<IconArrowLeft size={16} />} onClick={() => navigate(-1)} sx={{ mb: 2.5, borderRadius: 2 }}>
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

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5, borderColor: submitAttempted && fieldErrors.certificateTypes ? 'error.main' : 'divider' }}>
        <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Certificate Type(s) *</Typography>
        <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
          {CERT_TYPES.map((t) => (
            <Stack key={t.value} direction="row" alignItems="center" spacing={0.5}>
              <FormControlLabel
                control={<Checkbox checked={form.certificateTypes.includes(t.value)} onChange={() => toggleType(t.value)} />}
                label={t.label}
              />
              {t.value === 'destruction_report_evidence' && (
                <Chip size="small" label="Photo required" color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
              )}
            </Stack>
          ))}
        </Stack>
        {submitAttempted && fieldErrors.certificateTypes && (
          <FormHelperText error sx={{ mt: 0.5 }}>{fieldErrors.certificateTypes}</FormHelperText>
        )}

        {needsEvidence && (
          <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
            <FormControl>
              <FormLabel sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Destruction Report Variant</FormLabel>
              <RadioGroup row value={form.destructionReportVariant} onChange={set('destructionReportVariant')}>
                <FormControlLabel value="itemized_equipment" control={<Radio />} label="Itemized Equipment" />
                <FormControlLabel value="bulk_material" control={<Radio />} label="Bulk Material" />
              </RadioGroup>
              <FormHelperText sx={{ ml: 0, mt: -0.5 }}>
                Itemized Equipment: individual assets/equipment items destroyed and tracked one by one (e.g. laptops, hard drives).
                Bulk Material: waste tracked in bulk using a WDS/DOC/Req/BOE reference rather than individual item numbers. If unsure, use Itemized Equipment.
              </FormHelperText>
            </FormControl>
          </Box>
        )}
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5 }}>
        <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Request Details</Typography>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth required label="Company Name" value={form.companyName} onChange={set('companyName')}
              error={submitAttempted && Boolean(fieldErrors.companyName)}
              helperText={submitAttempted ? fieldErrors.companyName : ' '}
            />
            <TextField
              fullWidth required label="Contact Person" value={form.contactPerson} onChange={set('contactPerson')}
              error={submitAttempted && Boolean(fieldErrors.contactPerson)}
              helperText={submitAttempted ? fieldErrors.contactPerson : ' '}
            />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth required label="Contact No." value={form.contactNo} onChange={set('contactNo')}
              error={submitAttempted && Boolean(fieldErrors.contactNo)}
              helperText={submitAttempted ? fieldErrors.contactNo : ' '}
            />
            <TextField
              fullWidth required type="email" label="Contact Email" value={form.contactEmail} onChange={set('contactEmail')}
              error={submitAttempted && Boolean(fieldErrors.contactEmail)}
              helperText={submitAttempted ? fieldErrors.contactEmail : ' '}
            />
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Collection Date *"
                value={form.collectionDate ? dayjs(form.collectionDate) : null}
                onChange={(val) => setForm((p) => ({ ...p, collectionDate: val && val.isValid() ? val.format('YYYY-MM-DD') : '' }))}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: submitAttempted && Boolean(fieldErrors.collectionDate),
                    helperText: submitAttempted ? fieldErrors.collectionDate : ' ',
                  },
                }}
              />
            </LocalizationProvider>
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
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="GRN No. (or free text)"
                  helperText="Pick an existing GRN from the list, or just type a reference if the GRN hasn't been created yet"
                />
              )}
            />
          </Stack>
          <TextField
            fullWidth required multiline rows={2} label="Material / Waste Details" value={form.materialWasteDetails} onChange={set('materialWasteDetails')}
            error={submitAttempted && Boolean(fieldErrors.materialWasteDetails)}
            helperText={submitAttempted ? fieldErrors.materialWasteDetails : ' '}
          />
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              fullWidth required type="number" label="Total Weight / Quantity (tons)" value={form.totalWeightQuantity} onChange={set('totalWeightQuantity')} inputProps={{ min: 0, step: 'any' }}
              error={submitAttempted && Boolean(fieldErrors.totalWeightQuantity)}
              helperText={submitAttempted ? fieldErrors.totalWeightQuantity : ' '}
            />
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
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Add one or more photos, then tag each with the stage it was taken at (e.g. arrival, mid-destruction). Use the trash icon to remove a photo.
          </Typography>
          <Button component="label" size="small" variant="outlined" startIcon={uploading ? <CircularProgress size={14} /> : <IconUpload size={14} />} disabled={uploading} sx={{ borderRadius: 2, mb: 1.5 }}>
            {uploading ? 'Uploading…' : 'Add photo(s)'}
            <input type="file" hidden multiple accept="image/*" onChange={handlePhotoUpload} />
          </Button>
          {!hasPhoto && (
            <Alert severity={submitAttempted ? 'error' : 'warning'} sx={{ mb: 1.5, borderRadius: 2 }}>
              No photos attached yet — at least one is required before you can submit this request.
            </Alert>
          )}
          <Stack spacing={1}>
            {photos.map((p, idx) => (
              <Stack key={idx} direction="row" spacing={1.5} alignItems="center" sx={{ p: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Chip size="small" label={idx + 1} sx={{ fontWeight: 700 }} />
                <Typography variant="body2" sx={{ minWidth: 160, flexGrow: 1 }} noWrap>{p.fileName}</Typography>
                <TextField
                  select size="small" label="Stage" value={p.photoStage} onChange={(e) => updatePhotoStage(idx, e.target.value)}
                  sx={{ minWidth: 220 }}
                >
                  {PHOTO_STAGES.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </TextField>
                <IconButton size="small" color="error" onClick={() => removePhoto(idx)} title="Remove photo"><IconTrash size={16} /></IconButton>
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
        <Button variant="outlined" onClick={() => navigate('/erp/certificates/requests')} sx={{ borderRadius: 2 }}>Cancel</Button>
      </Stack>
    </PageContainer>
  );
};

export default CertificateRequestForm;
