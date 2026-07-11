import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Paper, TextField, MenuItem, IconButton,
  Alert, CircularProgress, Divider, Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconPlus, IconTrash, IconArrowLeft, IconUpload, IconPackage, IconHammer } from '@tabler/icons-react';
import { useNavigate, useSearchParams, useParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import UomSelectField from '../../../components/erp/UomSelectField';
import apiService from '../../../services/api';
import GrnEvidenceThumbs from './GrnEvidenceThumbs';

const emptyItem = () => ({
  itemName: '', materialTypeId: '', quantity: '', unitOfMeasure: 'kg',
  make: '', model: '', serialNumber: '', units: '', notes: '', images: [],
});

const GrnForm = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { id: editId } = useParams();
  const [searchParams] = useSearchParams();
  const workOrderId = searchParams.get('workOrderId') || '';
  const isEdit = Boolean(editId);

  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [unitsOfMeasure, setUnitsOfMeasure] = useState([]);
  const [uploadingIdx, setUploadingIdx] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(isEdit);
  const [error, setError] = useState('');
  const [woTitle, setWoTitle] = useState('');

  useEffect(() => {
    if (isEdit) return;
    if (!workOrderId) {
      navigate('/erp/grn', { replace: true });
      return;
    }
    apiService.getGrns({ workOrderId, pageSize: 1 }).then((res) => {
      const existing = Array.isArray(res.data) ? res.data[0] : null;
      if (existing?.id) {
        navigate(`/erp/grn/edit/${existing.id}`, { replace: true });
      }
    }).catch(() => {});
  }, [isEdit, workOrderId, navigate]);

  useEffect(() => {
    apiService.getMaterialTypes().then((res) => {
      if (res?.success) setMaterialTypes(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
    apiService.getAllDropdowns().then((res) => {
      if (res?.success) setUnitsOfMeasure(res.data?.units_of_measure || []);
    }).catch(() => {});
    if (workOrderId) {
      apiService.getWorkOrder(workOrderId).then((res) => {
        if (res?.success) setWoTitle(res.data?.title || `Work Order #${workOrderId}`);
      }).catch(() => {});
    }
  }, [workOrderId]);

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        setLoadingExisting(true);
        const res = await apiService.getGrn(editId);
        if (res.success && res.data) {
          const g = res.data;
          setNotes(g.notes || '');
          setItems(
            (g.items || []).length
              ? g.items.map((it) => ({
                  itemName: it.item_name || '',
                  materialTypeId: it.material_type_id ? String(it.material_type_id) : '',
                  quantity: String(it.quantity || ''),
                  unitOfMeasure: it.unit_of_measure || 'kg',
                  make: it.make || '',
                  model: it.model || '',
                  serialNumber: it.serial_number || '',
                  units: it.units != null ? String(it.units) : '',
                  notes: it.notes || '',
                  images: (it.images || []).map((img) => ({
                    imageUrl: img.image_url,
                    originalName: img.original_name,
                    isPdf: img.image_url?.toLowerCase().endsWith('.pdf'),
                  })),
                }))
              : [emptyItem()]
          );
        } else {
          setError(res.message || 'GRN not found');
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoadingExisting(false);
      }
    })();
  }, [editId, isEdit]);

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };

  const MAX_FILE_MB = 20;
  const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;

  const handleItemImageUpload = async (idx, e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const oversized = files.filter((f) => f.size > MAX_FILE_BYTES);
    if (oversized.length) {
      setError(`File(s) exceed the ${MAX_FILE_MB} MB limit: ${oversized.map((f) => f.name).join(', ')}`);
      e.target.value = '';
      return;
    }
    setUploadingIdx(idx);
    try {
      const uploaded = [];
      for (const file of files) {
        const res = await apiService.uploadDealImage(file);
        if (res?.success && res.data?.url) {
          uploaded.push({
            imageUrl: res.data.url,
            originalName: file.name,
            isPdf: file.type === 'application/pdf',
          });
        }
      }
      setItems((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, images: [...(it.images || []), ...uploaded] } : it))
      );
    } catch (err) {
      setError(err.message || 'File upload failed');
    } finally {
      setUploadingIdx(null);
      e.target.value = '';
    }
  };

  const removeItemImage = (itemIdx, imgIdx) => {
    setItems((prev) =>
      prev.map((it, i) =>
        i === itemIdx ? { ...it, images: (it.images || []).filter((_, j) => j !== imgIdx) } : it
      )
    );
  };

  const submit = async () => {
    const validItems = items.filter((it) => it.itemName.trim() && parseFloat(it.quantity) > 0);
    if (!validItems.length) {
      setError('Add at least one item with name and quantity');
      return;
    }
    const payload = {
      notes,
      items: validItems.map((it) => ({
        itemName: it.itemName.trim(),
        materialTypeId: it.materialTypeId ? parseInt(it.materialTypeId, 10) : undefined,
        quantity: parseFloat(it.quantity),
        unitOfMeasure: it.unitOfMeasure || 'kg',
        make: it.make?.trim() || undefined,
        model: it.model?.trim() || undefined,
        serialNumber: it.serialNumber?.trim() || undefined,
        units: it.units !== '' && it.units != null ? parseInt(it.units, 10) : undefined,
        notes: it.notes || undefined,
        images: (it.images || []).map((img) => ({
          imageUrl: img.imageUrl,
          originalName: img.originalName,
        })),
      })),
    };
    try {
      setSaving(true);
      setError('');
      let res;
      if (isEdit) {
        res = await apiService.updateGrn(editId, payload);
      } else {
        res = await apiService.createGrn({
          ...payload,
          workOrderId: workOrderId ? parseInt(workOrderId, 10) : undefined,
        });
      }
      if (res.success) navigate(`/erp/grn/view/${res.data.id}`);
      else setError(res.message || `Failed to ${isEdit ? 'update' : 'create'} GRN`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingExisting) {
    return (
      <PageContainer title="GRN">
        <Box display="flex" justifyContent="center" py={12}><CircularProgress /></Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={isEdit ? 'Edit GRN' : 'Create GRN'} description="Record goods received">
      <Button
        startIcon={<IconArrowLeft size={16} />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2.5, borderRadius: 2 }}
      >
        Back
      </Button>

      <Stack direction="row" alignItems="center" spacing={2} mb={workOrderId ? 1.5 : 3.5}>
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
            {isEdit ? 'Edit GRN' : 'Create GRN'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isEdit ? 'Update items for this goods received note' : 'Record goods received'}
          </Typography>
        </Box>
      </Stack>

      {workOrderId && !isEdit && (
        <Paper
          variant="outlined"
          sx={{ px: 2.5, py: 1.5, mb: 3, borderRadius: 2, bgcolor: alpha(theme.palette.success.main, 0.04), borderColor: alpha(theme.palette.success.main, 0.25) }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconHammer size={16} color={theme.palette.success.main} />
            <Typography variant="body2" fontWeight={600} color="success.dark">
              From work order: <strong>{woTitle || `WO #${workOrderId}`}</strong>
            </Typography>
          </Stack>
        </Paper>
      )}

      {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2.5 }}>
        <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="subtitle2" fontWeight={800}>
            General notes
          </Typography>
        </Box>
        <Box sx={{ p: 2.5 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any notes about this delivery…"
          />
        </Box>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 2.5 }}>
        <Box
          sx={{
            px: 2.5,
            py: 1.75,
            borderBottom: '1px solid',
            borderColor: 'divider',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="subtitle2" fontWeight={800}>
            Items
          </Typography>
          <Chip size="small" label={`${items.length} item${items.length !== 1 ? 's' : ''}`} variant="outlined" />
        </Box>
        <Box sx={{ p: 2.5 }}>
          <Stack spacing={2}>
            {items.map((it, idx) => (
              <Paper
                key={idx}
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  position: 'relative',
                  bgcolor: alpha(theme.palette.primary.main, 0.015),
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: 1,
                      bgcolor: theme.palette.primary.main,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography variant="caption" fontWeight={800} color="white" fontSize="0.7rem">
                      {idx + 1}
                    </Typography>
                  </Box>
                  <Typography variant="body2" fontWeight={700} color="text.secondary">
                    Item {idx + 1}
                  </Typography>
                </Stack>
                <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="flex-start">
                  <TextField
                    size="small"
                    label="Product name"
                    value={it.itemName}
                    onChange={(e) => updateItem(idx, 'itemName', e.target.value)}
                    sx={{ flex: 2, minWidth: 180 }}
                  />
                  <TextField
                    select
                    size="small"
                    label="Material type"
                    value={it.materialTypeId}
                    onChange={(e) => updateItem(idx, 'materialTypeId', e.target.value)}
                    sx={{ minWidth: 160 }}
                  >
                    <MenuItem value="">— None —</MenuItem>
                    {materialTypes.map((m) => (
                      <MenuItem key={m.id} value={String(m.id)}>
                        {m.display_name || m.value}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    label="Qty"
                    type="number"
                    value={it.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    sx={{ width: 100 }}
                    inputProps={{ min: 0, step: 'any' }}
                  />
                  <UomSelectField
                    label="UOM"
                    value={it.unitOfMeasure}
                    onChange={(v) => updateItem(idx, 'unitOfMeasure', v)}
                    unitsOfMeasure={unitsOfMeasure}
                    onUnitsChange={setUnitsOfMeasure}
                    minWidth={110}
                  />
                  <IconButton
                    color="error"
                    size="small"
                    onClick={() => setItems((p) => p.filter((_, i) => i !== idx))}
                    disabled={items.length === 1}
                    sx={{ mt: 0.5 }}
                  >
                    <IconTrash size={18} />
                  </IconButton>
                </Stack>
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                  <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                    Additional details (optional)
                  </Typography>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="flex-start">
                    <TextField
                      size="small"
                      label="Make"
                      value={it.make}
                      onChange={(e) => updateItem(idx, 'make', e.target.value)}
                      sx={{ flex: 1, minWidth: 140 }}
                    />
                    <TextField
                      size="small"
                      label="Model"
                      value={it.model}
                      onChange={(e) => updateItem(idx, 'model', e.target.value)}
                      sx={{ flex: 1, minWidth: 140 }}
                    />
                    <TextField
                      size="small"
                      label="Serial number"
                      value={it.serialNumber}
                      onChange={(e) => updateItem(idx, 'serialNumber', e.target.value)}
                      sx={{ flex: 1.5, minWidth: 160 }}
                    />
                    <TextField
                      size="small"
                      label="Units / pieces"
                      type="number"
                      value={it.units}
                      onChange={(e) => updateItem(idx, 'units', e.target.value)}
                      sx={{ width: 150 }}
                      inputProps={{ min: 0, step: 1 }}
                    />
                  </Stack>
                </Box>
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed', borderColor: 'divider' }}>
                  <Stack direction="row" alignItems="center" spacing={1.5} mb={(it.images || []).length ? 1.5 : 0}>
                    <Button
                      component="label"
                      size="small"
                      variant="outlined"
                      startIcon={uploadingIdx === idx ? <CircularProgress size={14} /> : <IconUpload size={14} />}
                      disabled={uploadingIdx === idx}
                      sx={{ borderRadius: 2 }}
                    >
                      {uploadingIdx === idx ? 'Uploading…' : 'Add evidence'}
                      <input
                        type="file"
                        hidden
                        multiple
                        accept="image/*,application/pdf"
                        onChange={(e) => handleItemImageUpload(idx, e)}
                      />
                    </Button>
                    <Typography variant="caption" color="text.disabled">
                      Photos / PDFs per line · max {MAX_FILE_MB} MB each
                    </Typography>
                  </Stack>
                  {(it.images || []).length > 0 && (
                    <GrnEvidenceThumbs
                      images={it.images}
                      size={72}
                      editable
                      onRemove={(imgIdx) => removeItemImage(idx, imgIdx)}
                    />
                  )}
                </Box>
              </Paper>
            ))}
          </Stack>
          <Button
            startIcon={<IconPlus size={16} />}
            onClick={() => setItems((p) => [...p, emptyItem()])}
            sx={{ mt: 2, borderRadius: 2 }}
          >
            Add item
          </Button>
        </Box>
      </Paper>

      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          onClick={submit}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{ borderRadius: 2.5, px: 3 }}
        >
          {saving ? 'Saving…' : 'Save GRN'}
        </Button>
        <Button onClick={() => navigate('/erp/grn')} sx={{ borderRadius: 2 }}>
          Cancel
        </Button>
      </Stack>
    </PageContainer>
  );
};

export default GrnForm;
