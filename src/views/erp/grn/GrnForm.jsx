import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Stack, Paper, TextField, MenuItem, IconButton,
  Alert, CircularProgress, Divider, Chip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconPlus, IconTrash, IconArrowLeft, IconUpload, IconPackage, IconX } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const emptyItem = () => ({ itemName: '', materialTypeId: '', quantity: '', unitOfMeasure: 'kg', notes: '' });

const GrnForm = () => {
  const navigate = useNavigate();
  const theme = useTheme();
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
      <Button
        startIcon={<IconArrowLeft size={16} />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2.5, borderRadius: 2 }}
      >
        Back
      </Button>

      <Stack direction="row" alignItems="center" spacing={2} mb={3.5}>
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
            Create GRN{workOrderId ? ` — WO #${workOrderId}` : ''}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Record goods received for this work order
          </Typography>
        </Box>
      </Stack>

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
            Line items
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
                  <TextField
                    size="small"
                    label="UOM"
                    value={it.unitOfMeasure}
                    onChange={(e) => updateItem(idx, 'unitOfMeasure', e.target.value)}
                    sx={{ width: 90 }}
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

      <Paper variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
        <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'action.hover' }}>
          <Typography variant="subtitle2" fontWeight={800}>
            Photos
          </Typography>
        </Box>
        <Box sx={{ p: 2.5 }}>
          <Button
            component="label"
            variant="outlined"
            startIcon={uploading ? <CircularProgress size={16} /> : <IconUpload size={16} />}
            disabled={uploading}
            sx={{ borderRadius: 2, mb: images.length > 0 ? 2 : 0 }}
          >
            {uploading ? 'Uploading…' : 'Upload images'}
            <input type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
          </Button>
          {images.length > 0 && (
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              {images.map((img, i) => (
                <Box key={i} sx={{ position: 'relative' }}>
                  <Box
                    component="img"
                    src={img.imageUrl}
                    alt={img.originalName}
                    sx={{
                      width: 90,
                      height: 90,
                      objectFit: 'cover',
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'block',
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                    sx={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      width: 22,
                      height: 22,
                      '&:hover': { bgcolor: 'error.light', color: 'white' },
                    }}
                  >
                    <IconX size={12} />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          )}
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
