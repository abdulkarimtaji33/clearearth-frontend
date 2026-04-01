import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Switch,
  FormControlLabel,
  Stack,
  Typography,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { IconEdit, IconTrash, IconPlus } from '@tabler/icons-react';
import apiService from '../../../services/api';

const emptyForm = () => ({ name: '', displayOrder: 0, isActive: true });

const WorkTypesManageDialog = ({ open, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());

  const load = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const res = await apiService.getWorkTypes({ activeOnly: false });
      if (res.success) {
        const list = Array.isArray(res.data) ? res.data : [];
        setRows(list);
      }
    } catch (e) {
      setError(e.message || 'Failed to load types');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError('');
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setForm({
      name: row.name || '',
      displayOrder: row.display_order ?? 0,
      isActive: row.is_active !== false,
    });
    setError('');
  };

  const handleSave = async () => {
    const name = form.name?.trim();
    if (!name) {
      setError('Name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const body = {
        name,
        displayOrder: parseInt(form.displayOrder, 10) || 0,
        isActive: form.isActive,
      };
      if (editingId) {
        await apiService.updateWorkType(editingId, body);
      } else {
        await apiService.createWorkType(body);
      }
      await load();
      onSaved?.();
      startAdd();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this work type?')) return;
    setError('');
    try {
      await apiService.deleteWorkType(id);
      await load();
      onSaved?.();
      if (editingId === id) startAdd();
    } catch (e) {
      setError(e.message || 'Delete failed');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, pb: 0 }}>Manage types of work</DialogTitle>
      <Typography variant="body2" color="text.secondary" sx={{ px: 3, pt: 0.5, pb: 1 }}>
        Add types here; they appear in the work order task dropdown.
      </Typography>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }} alignItems={{ sm: 'flex-end' }}>
          <TextField
            fullWidth
            label="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Excavation"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <TextField
            label="Order"
            type="number"
            value={form.displayOrder}
            onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
            sx={{ width: { xs: '100%', sm: 120 }, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.isActive}
                onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              />
            }
            label="Active"
          />
          <Button
            variant="contained"
            startIcon={editingId ? <IconEdit size={18} /> : <IconPlus size={18} />}
            onClick={handleSave}
            disabled={saving}
            sx={{ borderRadius: 2, whiteSpace: 'nowrap' }}
          >
            {editingId ? 'Update' : 'Add'}
          </Button>
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, maxHeight: 360 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                  <TableCell width={100} sx={{ fontWeight: 700 }}>Order</TableCell>
                  <TableCell width={100} sx={{ fontWeight: 700 }}>Active</TableCell>
                  <TableCell width={100} align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant="body2" color="text.secondary" align="center" py={2}>
                        No types yet.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.id} hover selected={editingId === row.id}>
                      <TableCell>{row.name}</TableCell>
                      <TableCell>{row.display_order}</TableCell>
                      <TableCell>{row.is_active ? 'Yes' : 'No'}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" onClick={() => startEdit(row)} color="primary">
                          <IconEdit size={18} />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(row.id)} color="error">
                          <IconTrash size={18} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ borderRadius: 2 }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkTypesManageDialog;
