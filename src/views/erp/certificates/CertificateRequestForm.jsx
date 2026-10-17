import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Paper, TextField, MenuItem, Alert, CircularProgress,
  Checkbox, FormControlLabel, FormControl, FormLabel, FormHelperText, RadioGroup, Radio, Autocomplete,
  Divider, Chip, IconButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconArrowLeft, IconCertificate, IconUpload, IconTrash } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import UomSelectField from '../../../components/erp/UomSelectField';
import useUnitsOfMeasure from '../../../hooks/useUnitsOfMeasure';

const CERT_TYPE_LABEL = {
  green_certificate: 'Green Certificate',
  certificate_of_destruction: 'Certificate of Destruction',
  certificate_of_data_destruction: 'Certificate of Data Destruction',
  carbon_footprint: 'Carbon Footprint Certificate',
  destruction_report_evidence: 'Destruction Report with Evidence',
};

const PHOTO_STAGES = [
  { value: 'arrival', label: 'Arrival of materials' },
  { value: 'destruction_in_progress', label: 'Destruction in progress' },
  { value: 'other', label: 'Other' },
];

const emptyForm = () => ({
  companyName: '', contactPerson: '', contactNo: '', contactEmail: '',
  collectionDate: '', grnId: '', grnNo: '', materialWasteDetails: '',
  totalWeightQuantity: '', uom: '', invoiceNo: '', certificateTypes: [],
});

/**
 * Certificate requests are generated from an existing deal — picking the deal
 * auto-fills everything below it (company/contact, GRN, pickup date, invoice,
 * certificate types) from that deal's own records, linking the request to the
 * deal (and transitively its GRN/work order) rather than starting from a
 * blank form. The user can still nudge any of these fields before submitting,
 * and must add the actual evidence photos when a Destruction Report is
 * required, since no existing record can supply those.
 */
const CertificateRequestForm = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const initialDealId = searchParams.get('dealId');
  const { unitsOfMeasure: catalogUnits } = useUnitsOfMeasure();
  const [unitsOfMeasure, setUnitsOfMeasure] = useState([]);

  const [deals, setDeals] = useState([]);
  const [grns, setGrns] = useState([]);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [autofillLoading, setAutofillLoading] = useState(false);
  const [destructionReportVariant, setDestructionReportVariant] = useState('itemized_equipment');
  const [wdsRefNo, setWdsRefNo] = useState('');
  const [docRef, setDocRef] = useState('');
  const [reqNo, setReqNo] = useState('');
  const [boeNo, setBoeNo] = useState('');
  const [barcode, setBarcode] = useState('');
  const [supportingDoc, setSupportingDoc] = useState(null);
  const [photos, setPhotos] = useState([]); // { filePath, fileName, fileType, photoStage }
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  useEffect(() => {
    apiService.getDeals({ pageSize: 500 }).then((res) => {
      if (res?.success) {
        const list = Array.isArray(res.data) ? res.data : [];
        setDeals(list);
        if (initialDealId) {
          const match = list.find((d) => String(d.id) === String(initialDealId));
          if (match) setSelectedDeal(match);
        }
      }
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setUnitsOfMeasure(catalogUnits);
  }, [catalogUnits]);

  useEffect(() => {
    if (!selectedDeal) {
      setForm(emptyForm());
      setGrns([]);
      return;
    }
    let active = true;
    setAutofillLoading(true);
    setError('');
    Promise.all([
      apiService.getCertificateRequestAutofill(selectedDeal.id),
      apiService.getGrns({ dealId: selectedDeal.id, pageSize: 100 }).catch(() => ({ success: false })),
    ]).then(([autofillRes, grnsRes]) => {
      if (!active) return;
      if (grnsRes?.success) setGrns(Array.isArray(grnsRes.data) ? grnsRes.data : []);
      if (autofillRes?.success) {
        setForm({
          companyName: autofillRes.data.companyName || '',
          contactPerson: autofillRes.data.contactPerson || '',
          contactNo: autofillRes.data.contactNo || '',
          contactEmail: autofillRes.data.contactEmail || '',
          collectionDate: autofillRes.data.collectionDate || '',
          grnId: autofillRes.data.grnId || '',
          grnNo: autofillRes.data.grnNo || '',
          materialWasteDetails: autofillRes.data.materialWasteDetails || '',
          totalWeightQuantity: autofillRes.data.totalWeightQuantity ?? '',
          uom: autofillRes.data.uom || '',
          invoiceNo: autofillRes.data.invoiceNo || '',
          certificateTypes: autofillRes.data.certificateTypes || [],
        });
      } else {
        setError(autofillRes?.message || 'Failed to load deal details');
      }
    }).catch((e) => {
      if (active) setError(e.message || 'Failed to load deal details');
    }).finally(() => {
      if (active) setAutofillLoading(false);
    });
    return () => { active = false; };
  }, [selectedDeal]);

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const toggleType = (type) => {
    setForm((p) => {
      const has = p.certificateTypes.includes(type);
      return { ...p, certificateTypes: has ? p.certificateTypes.filter((t) => t !== type) : [...p.certificateTypes, type] };
    });
  };

  const needsEvidence = form.certificateTypes.includes('destruction_report_evidence');
  const isBulkVariant = needsEvidence && destructionReportVariant === 'bulk_material';
  const hasPhoto = photos.length > 0;

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
    if (!selectedDeal) errs.deal = 'Select a deal to generate this request from.';
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
      dealId: selectedDeal.id,
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
      certificateTypes: form.certificateTypes,
      destructionReportVariant: needsEvidence ? destructionReportVariant : undefined,
      wdsRefNo: isBulkVariant ? wdsRefNo || undefined : undefined,
      docRef: isBulkVariant ? docRef || undefined : undefined,
      reqNo: isBulkVariant ? reqNo || undefined : undefined,
      boeNo: isBulkVariant ? boeNo || undefined : undefined,
      barcode: isBulkVariant ? barcode || undefined : undefined,
      uom: form.uom || undefined,
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
    <PageContainer title="New Certificate Request" description="Generate a certificate request from a deal">
      <Button variant="outlined" startIcon={<IconArrowLeft size={16} />} onClick={() => navigate(-1)} sx={{ mb: 2.5, borderRadius: 2 }}>
        Back
      </Button>

      <Stack direction="row" alignItems="center" spacing={2} mb={3.5}>
        <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconCertificate size={24} color={theme.palette.primary.main} />
        </Box>
        <Box>
          <Typography variant="h4" fontWeight={800}>New Certificate Request</Typography>
          <Typography variant="body2" color="text.secondary">Select a deal — everything below is filled in automatically from it</Typography>
        </Box>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5, borderColor: submitAttempted && fieldErrors.deal ? 'error.main' : 'divider' }}>
        <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Deal *</Typography>
        <Autocomplete
          fullWidth
          options={deals}
          getOptionLabel={(d) => `${d.deal_number || d.id} — ${d.title || ''}`}
          value={selectedDeal}
          onChange={(_, v) => setSelectedDeal(v)}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select deal"
              error={submitAttempted && Boolean(fieldErrors.deal)}
              helperText={submitAttempted ? fieldErrors.deal : 'All fields below are populated from this deal\'s company, contact, GRN, pickup date and invoice'}
            />
          )}
        />
      </Paper>

      {selectedDeal && (
        <>
          <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={800} mb={0.5}>Certificate Type(s) *</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Pre-selected from the deal's certificate requirements — adjust if needed.
            </Typography>
            {autofillLoading ? (
              <Box display="flex" justifyContent="center" py={1}><CircularProgress size={20} /></Box>
            ) : (
              <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                {Object.entries(CERT_TYPE_LABEL).map(([value, label]) => (
                  <Stack key={value} direction="row" alignItems="center" spacing={0.5}>
                    <FormControlLabel
                      control={<Checkbox checked={form.certificateTypes.includes(value)} onChange={() => toggleType(value)} />}
                      label={label}
                    />
                    {value === 'destruction_report_evidence' && (
                      <Chip size="small" label="Photo required" color="warning" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                    )}
                  </Stack>
                ))}
              </Stack>
            )}
            {submitAttempted && fieldErrors.certificateTypes && !autofillLoading && (
              <FormHelperText error sx={{ mt: 0.5 }}>{fieldErrors.certificateTypes}</FormHelperText>
            )}

            {needsEvidence && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                <FormControl>
                  <FormLabel sx={{ fontSize: '0.8rem', fontWeight: 700 }}>Destruction Report Variant</FormLabel>
                  <RadioGroup row value={destructionReportVariant} onChange={(e) => setDestructionReportVariant(e.target.value)}>
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
            <Typography variant="subtitle2" fontWeight={800} mb={0.5}>Request Details</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Auto-filled from the deal — adjust any field if needed.
            </Typography>
            {autofillLoading ? (
              <Box display="flex" justifyContent="center" py={3}><CircularProgress size={24} /></Box>
            ) : (
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
                    renderInput={(params) => <TextField {...params} label="GRN No." helperText=" " />}
                  />
                </Stack>
                <TextField
                  fullWidth required multiline rows={2} label="Material / Waste Details" value={form.materialWasteDetails} onChange={set('materialWasteDetails')}
                  error={submitAttempted && Boolean(fieldErrors.materialWasteDetails)}
                  helperText={submitAttempted ? fieldErrors.materialWasteDetails : ' '}
                />
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                  <TextField
                    fullWidth required type="number" label="Quantity" value={form.totalWeightQuantity} onChange={set('totalWeightQuantity')} inputProps={{ min: 0, step: 'any' }}
                    error={submitAttempted && Boolean(fieldErrors.totalWeightQuantity)}
                    helperText={submitAttempted ? fieldErrors.totalWeightQuantity : ' '}
                  />
                  <UomSelectField
                    fullWidth
                    label="UoM"
                    value={form.uom}
                    onChange={(v) => setForm((p) => ({ ...p, uom: v }))}
                    unitsOfMeasure={unitsOfMeasure}
                    onUnitsChange={setUnitsOfMeasure}
                    helperText=" "
                  />
                  <TextField fullWidth label="Invoice No." value={form.invoiceNo} onChange={set('invoiceNo')} helperText=" " />
                </Stack>
                <TextField fullWidth label="Requested By" value={`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.email || ''} disabled />
              </Stack>
            )}
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
                Evidence photos can't be pulled from any existing record — add them here, then tag each with the stage it was taken at.
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
                    <TextField size="small" label="WDS Ref No." value={wdsRefNo} onChange={(e) => setWdsRefNo(e.target.value)} />
                    <TextField size="small" label="DOC Ref" value={docRef} onChange={(e) => setDocRef(e.target.value)} />
                    <TextField size="small" label="Req No." value={reqNo} onChange={(e) => setReqNo(e.target.value)} />
                    <TextField size="small" label="BOE No." value={boeNo} onChange={(e) => setBoeNo(e.target.value)} />
                    <TextField size="small" label="Barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} />
                  </Stack>
                </Box>
              )}
            </Paper>
          )}
        </>
      )}

      <Divider sx={{ mb: 2.5 }} />
      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={submit} disabled={saving || !selectedDeal || autofillLoading} startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null} sx={{ borderRadius: 2.5, px: 3 }}>
          {saving ? 'Submitting…' : 'Submit Request'}
        </Button>
        <Button variant="outlined" onClick={() => navigate('/erp/certificates/requests')} sx={{ borderRadius: 2 }}>Cancel</Button>
      </Stack>
    </PageContainer>
  );
};

export default CertificateRequestForm;
