import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Paper, TextField, MenuItem, IconButton,
  Alert, CircularProgress, Divider,
} from '@mui/material';
import { IconPlus, IconTrash, IconArrowLeft, IconUpload } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const emptyItem = () => ({ itemName: '', materialTypeId: '', quantity: '', unitOfMeasure: 'kg', notes: '' });

const GrnForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const workOrderId = searchParams.get('workOrderId') || '';

  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiService.getMaterialTypes().then((res) => {
      if (res?.success) setMaterialTypes(Array.isArray(res.data) ? res.data : []);
    }).catch(() => {});
  }, []);

  const updateItem = (idx, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [field]: value } : it)));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const file of files) {
        const res = await apiService.uploadDealImage(file);
        if (res?.success && res.data?.url) {
          uploaded.push({ imageUrl: res.data.url, originalName: file.name });
        }
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (err) {
      setError(err.message || 'Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submit = async () => {
    const validItems = items.filter((it) => it.itemName.trim() && parseFloat(it.quantity) > 0);
    if (!validItems.length) {
      setError('Add at least one item with name and quantity');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const res = await apiService.createGrn({
        workOrderId: workOrderId ? parseInt(workOrderId, 10) : undefined,
        notes,
        items: validItems.map((it) => ({
          itemName: it.itemName.trim(),
          materialTypeId: it.materialTypeId ? parseInt(it.materialTypeId, 10) : undefined,
          quantity: parseFloat(it.quantity),
          unitOfMeasure: it.unitOfMeasure || 'kg',
          notes: it.notes || undefined,
        })),
        images,
      });
      if (res.success) navigate(`/erp/grn/view/${res.data.id}`);
      else setError(res.message || 'Failed to create GRN');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="Create GRN" description="Record goods received">
      <Button startIcon={<IconArrowLeft size={16} />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>Back</Button>
      <Typography variant="h4" fontWeight={800} mb={3}>Create GRN{workOrderId ? ` — WO #${workOrderId}` : ''}</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 3, mb: 2 }}>
        <TextField fullWidth multiline rows={2} label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} sx={{ mb: 3 }} />

        <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Line items</Typography>
        <Stack spacing={2}>
          {items.map((it, idx) => (
            <Paper key={idx} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="flex-start">
                <TextField size="small" label="Product name" value={it.itemName} onChange={(e) => updateItem(idx, 'itemName', e.target.value)} sx={{ flex: 2, minWidth: 180 }} />
                <TextField select size="small" label="Material type" value={it.materialTypeId} onChange={(e) => updateItem(idx, 'materialTypeId', e.target.value)} sx={{ minWidth: 160 }}>
                  <MenuItem value="">—</MenuItem>
                  {materialTypes.map((m) => <MenuItem key={m.id} value={String(m.id)}>{m.display_name || m.value}</MenuItem>)}
                </TextField>
                <TextField size="small" label="Qty" type="number" value={it.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} sx={{ width: 100 }} />
                <TextField size="small" label="UOM" value={it.unitOfMeasure} onChange={(e) => updateItem(idx, 'unitOfMeasure', e.target.value)} sx={{ width: 90 }} />
                <IconButton color="error" onClick={() => setItems((p) => p.filter((_, i) => i !== idx))} disabled={items.length === 1}><IconTrash size={18} /></IconButton>
              </Stack>
            </Paper>
          ))}
        </Stack>
        <Button startIcon={<IconPlus size={16} />} onClick={() => setItems((p) => [...p, emptyItem()])} sx={{ mt: 2 }}>Add item</Button>
      </Paper>

      <Paper variant="outlined" sx={{ borderRadius: 3, p: 3, mb: 3 }}>
        <Typography variant="subtitle2" fontWeight={800} mb={1.5}>Photos</Typography>
        <Button component="label" variant="outlined" startIcon={<IconUpload size={16} />} disabled={uploading}>
          {uploading ? 'Uploading…' : 'Upload images'}
          <input type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
        </Button>
        {images.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" mt={2}>
            {images.map((img, i) => (
              <Box key={i} component="img" src={img.imageUrl} alt={img.originalName} sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }} />
            ))}
          </Stack>
        )}
      </Paper>

      <Stack direction="row" spacing={2}>
        <Button variant="contained" onClick={submit} disabled={saving}>{saving ? 'Saving…' : 'Save GRN'}</Button>
        <Button onClick={() => navigate('/erp/grn')}>Cancel</Button>
      </Stack>
    </PageContainer>
  );
};

export default GrnForm;
