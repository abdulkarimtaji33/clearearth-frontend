import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Stack, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Alert, CircularProgress, TextField, MenuItem, Button, IconButton,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconLeaf, IconEdit, IconPlus } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const emptyRow = () => ({ id: null, materialTypeId: '', co2FactorPerTon: 50, litersFactorPerTon: 100, kgFactorPerTon: 500 });

const CarbonFactorsSettings = () => {
  const theme = useTheme();
  const [rows, setRows] = useState([]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null); // row being edited
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [factorsRes, typesRes] = await Promise.all([
        apiService.getCarbonFootprintFactors(),
        apiService.getMaterialTypes(),
      ]);
      if (factorsRes.success) setRows(factorsRes.data || []);
      if (typesRes.success) setMaterialTypes(typesRes.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startEdit = (row) => setEditing({
    id: row?.id || null,
    materialTypeId: row?.material_type_id ? String(row.material_type_id) : '',
    co2FactorPerTon: row?.co2_factor_per_ton ?? 50,
    litersFactorPerTon: row?.liters_factor_per_ton ?? 100,
    kgFactorPerTon: row?.kg_factor_per_ton ?? 500,
  });

  const save = async () => {
    try {
      setSaving(true);
      setError('');
      const res = await apiService.saveCarbonFootprintFactor({
        id: editing.id || undefined,
        materialTypeId: editing.materialTypeId ? parseInt(editing.materialTypeId, 10) : null,
        co2FactorPerTon: parseFloat(editing.co2FactorPerTon),
        litersFactorPerTon: parseFloat(editing.litersFactorPerTon),
        kgFactorPerTon: parseFloat(editing.kgFactorPerTon),
      });
      if (res.success) {
        setEditing(null);
        load();
      } else setError(res.message || 'Failed to save');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const materialLabel = (id) => {
    if (!id) return 'Tenant default (fallback)';
    const m = materialTypes.find((mt) => mt.id === id);
    return m ? (m.display_name || m.value) : `#${id}`;
  };

  return (
    <PageContainer title="Carbon Footprint Factors" description="Admin-editable conversion factors used for Carbon Footprint certificates">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box sx={{ width: 46, height: 46, borderRadius: 2.5, bgcolor: alpha(theme.palette.success.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconLeaf size={24} color={theme.palette.success.main} />
          </Box>
          <Box>
            <Typography variant="h4" fontWeight={800}>Carbon Footprint Factors</Typography>
            <Typography variant="body2" color="text.secondary">Per-ton conversion factors used to compute CO2 / liters / kg saved</Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={<IconPlus size={16} />} onClick={() => startEdit(null)} sx={{ borderRadius: 2.5 }}>Add Factor</Button>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {editing && (
        <Paper variant="outlined" sx={{ borderRadius: 3, p: 2.5, mb: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={800} mb={1.5}>{editing.id ? 'Edit Factor' : 'New Factor'}</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="flex-start">
            <TextField
              select size="small" label="Material Type" value={editing.materialTypeId}
              onChange={(e) => setEditing((p) => ({ ...p, materialTypeId: e.target.value }))} sx={{ minWidth: 220 }}
            >
              <MenuItem value="">Tenant default (fallback)</MenuItem>
              {materialTypes.map((m) => <MenuItem key={m.id} value={String(m.id)}>{m.display_name || m.value}</MenuItem>)}
            </TextField>
            <TextField size="small" type="number" label="CO2 factor / ton" value={editing.co2FactorPerTon} onChange={(e) => setEditing((p) => ({ ...p, co2FactorPerTon: e.target.value }))} />
            <TextField size="small" type="number" label="Liters factor / ton" value={editing.litersFactorPerTon} onChange={(e) => setEditing((p) => ({ ...p, litersFactorPerTon: e.target.value }))} />
            <TextField size="small" type="number" label="Kg factor / ton" value={editing.kgFactorPerTon} onChange={(e) => setEditing((p) => ({ ...p, kgFactorPerTon: e.target.value }))} />
            <Button variant="contained" onClick={save} disabled={saving} sx={{ borderRadius: 2 }}>{saving ? 'Saving…' : 'Save'}</Button>
            <Button onClick={() => setEditing(null)} sx={{ borderRadius: 2 }}>Cancel</Button>
          </Stack>
        </Paper>
      )}

      <Paper elevation={0} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                {['Material Type', 'CO2 / ton', 'Liters / ton', 'Kg / ton', ''].map((h) => (
                  <TableCell key={h || 'actions'} sx={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'text.secondary' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress size={26} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><Typography color="text.secondary">No factors configured yet</Typography></TableCell></TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>{materialLabel(r.material_type_id)}</TableCell>
                    <TableCell>{r.co2_factor_per_ton}</TableCell>
                    <TableCell>{r.liters_factor_per_ton}</TableCell>
                    <TableCell>{r.kg_factor_per_ton}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => startEdit(r)}><IconEdit size={16} /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </PageContainer>
  );
};

export default CarbonFactorsSettings;
