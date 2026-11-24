import React, { useEffect, useState } from 'react';
import { Alert, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import apiService from '../../services/api';
import PickupNoteForm, { emptyPickupNote } from './PickupNoteForm';

/**
 * Operations view of the pick-up note a driver filled in for a pickup task. Operations can edit it while the
 * work order is open; once the work order is completed it is read-only (and appears in the pickup reports).
 */
const PickupNoteDialog = ({ open, onClose, workOrderId, taskId }) => {
  const [note, setNote] = useState(emptyPickupNote());
  const [editable, setEditable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        setMessage('');
        const res = await apiService.getWorkOrderTaskPickupNote(workOrderId, taskId);
        if (!alive) return;
        setNote({ ...emptyPickupNote(), ...(res.data?.note || {}) });
        setEditable(Boolean(res.data?.editable));
      } catch (e) {
        if (alive) setError(e.message || 'Could not load the pick-up note');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [open, workOrderId, taskId]);

  const save = async () => {
    try {
      setSaving(true);
      setError('');
      const res = await apiService.saveWorkOrderTaskPickupNote(workOrderId, taskId, note);
      setNote({ ...emptyPickupNote(), ...(res.data?.note || note) });
      setMessage('Pick-up note saved');
    } catch (e) {
      setError(e.message || 'Could not save the pick-up note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800 }}>Pick-up note</DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {!loading && !editable && !error && (
          <Alert severity="info" sx={{ mb: 2 }}>
            This work order is completed, so the pick-up note can no longer be edited. It is now in the pickup report.
          </Alert>
        )}
        {loading ? (
          <CircularProgress size={26} sx={{ display: 'block', mx: 'auto', my: 4 }} />
        ) : (
          <PickupNoteForm value={note} onChange={setNote} disabled={!editable} />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
        {editable && (
          <Button variant="contained" onClick={save} disabled={saving || loading}>{saving ? 'Saving…' : 'Save pick-up note'}</Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PickupNoteDialog;
