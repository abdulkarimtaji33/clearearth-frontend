import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Stack, Button, TextField, Alert, IconButton, Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { IconTimeline, IconNotes, IconTrash, IconArrowRight } from '@tabler/icons-react';
import apiService from '../../../../../../services/api';
import {
  SectionCard, EmptyState, LoadingBlock, PersonAvatar, fmtDate, fmtDateTime, humanize, inputSx,
} from '../../../components/HrUi';

const EVENT_TONES = {
  created: 'success', hired: 'success', onboarded: 'success',
  salary_change: 'primary', promotion: 'primary', transfer: 'info',
  status_change: 'warning', offboarded: 'error', exit: 'error',
};

/** Vertical timeline of employee history events. */
export const HistoryTimeline = ({ history, loading }) => (
  <SectionCard icon={IconTimeline} title="History" subtitle="Changes to this employee record">
    {loading ? <LoadingBlock py={3} /> : history.length === 0 ? (
      <EmptyState compact icon={IconTimeline} message="No history recorded yet." />
    ) : (
      <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {history.map((h, i) => {
          const tone = EVENT_TONES[h.event_type] || 'primary';
          const last = i === history.length - 1;
          const hasChange = h.old_value || h.new_value;
          return (
            <Box component="li" key={h.id} sx={{ display: 'flex', gap: 1.75 }}>
              <Stack alignItems="center" sx={{ pt: 0.5 }}>
                <Box sx={{
                  width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                  bgcolor: (t) => t.palette[tone].main,
                  boxShadow: (t) => `0 0 0 4px ${alpha(t.palette[tone].main, 0.15)}`,
                }}
                />
                {!last && <Box sx={{ width: 2, flex: 1, bgcolor: 'divider', my: 0.75 }} />}
              </Stack>
              <Box pb={last ? 0 : 2.5} minWidth={0} flex={1}>
                <Stack direction="row" justifyContent="space-between" spacing={2} alignItems="baseline">
                  <Typography variant="body2" fontWeight={700}>
                    {humanize(h.event_type) || 'Update'}
                    {h.field_name && (
                      <Box component="span" sx={{ fontWeight: 500, color: 'text.secondary' }}> · {humanize(h.field_name)}</Box>
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                    {fmtDate(h.effective_date || h.created_at)}
                  </Typography>
                </Stack>
                {hasChange && (
                  <Stack direction="row" spacing={1} alignItems="center" mt={0.5} flexWrap="wrap" useFlexGap>
                    <Typography variant="caption" sx={{ px: 0.75, py: 0.25, borderRadius: 1, bgcolor: (t) => alpha(t.palette.error.main, 0.08), textDecoration: 'line-through', color: 'text.secondary' }}>
                      {h.old_value ?? '—'}
                    </Typography>
                    <IconArrowRight size={13} />
                    <Typography variant="caption" fontWeight={600} sx={{ px: 0.75, py: 0.25, borderRadius: 1, bgcolor: (t) => alpha(t.palette.success.main, 0.1) }}>
                      {h.new_value ?? '—'}
                    </Typography>
                  </Stack>
                )}
                {h.reason && <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{h.reason}</Typography>}
              </Box>
            </Box>
          );
        })}
      </Box>
    )}
  </SectionCard>
);

/** HR-internal notes: inline composer + feed. Never shown in self-service mode. */
export const NotesSection = ({ employeeId }) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getEmployeeNotes(employeeId);
      if (res.success) setNotes(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    if (!text.trim()) return;
    setSaving(true);
    setError('');
    try {
      await apiService.createEmployeeNote(employeeId, text.trim());
      setText('');
      load();
    } catch (err) {
      setError(err.message || 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await apiService.deleteEmployeeNote(employeeId, id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete note');
    }
  };

  return (
    <SectionCard icon={IconNotes} title="HR notes" subtitle="Private to HR. Not visible to the employee.">
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 1.5, mb: 2 }}>
        <TextField
          fullWidth multiline minRows={2} placeholder="Write a note..."
          value={text} onChange={(e) => setText(e.target.value)}
          variant="standard"
          InputProps={{ disableUnderline: true }}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); }}
          sx={inputSx}
        />
        <Stack direction="row" justifyContent="space-between" alignItems="center" mt={1}>
          <Typography variant="caption" color="text.disabled">Ctrl + Enter to save</Typography>
          <Button size="small" variant="contained" onClick={submit} disabled={saving || !text.trim()} sx={{ borderRadius: 2 }}>
            {saving ? 'Saving...' : 'Add note'}
          </Button>
        </Stack>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{error}</Alert>}
      {loading ? <LoadingBlock py={3} /> : notes.length === 0 ? (
        <EmptyState compact icon={IconNotes} message="No notes yet." />
      ) : (
        <Stack spacing={2}>
          {notes.map((n) => {
            const author = n.createdByUser;
            return (
              <Stack key={n.id} direction="row" spacing={1.5} sx={{ '&:hover .note-del': { opacity: 1 } }}>
                <PersonAvatar person={author || { first_name: '#' }} size={32} />
                <Box flex={1} minWidth={0}>
                  <Stack direction="row" spacing={1} alignItems="baseline">
                    <Typography variant="body2" fontWeight={700}>
                      {author ? `${author.first_name || ''} ${author.last_name || ''}`.trim() : `User #${n.created_by ?? '—'}`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{fmtDateTime(n.created_at)}</Typography>
                  </Stack>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mt: 0.25 }}>{n.note_text}</Typography>
                </Box>
                <Tooltip title="Delete note">
                  <IconButton className="note-del" size="small" onClick={() => remove(n.id)} sx={{ opacity: { xs: 1, md: 0 }, alignSelf: 'flex-start', '&:hover': { color: 'error.main' } }}>
                    <IconTrash size={15} />
                  </IconButton>
                </Tooltip>
              </Stack>
            );
          })}
        </Stack>
      )}
    </SectionCard>
  );
};
