import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  Divider,
} from '@mui/material';
import FsLightbox from 'fslightbox-react';
import apiService from '../../services/api';

/**
 * Read-only inspection report viewer — layout matches DealView report dialog.
 * @param {boolean} hideDealPrice — when true (default), omits deal value from snapshot (inspection-request sidebar flow).
 */
const InspectionReportDialog = ({ open, onClose, request, hideDealPrice = true, onEditReport }) => {
  const [reportLightboxOpen, setReportLightboxOpen] = useState(false);
  const [reportLightboxIndex, setReportLightboxIndex] = useState(0);

  if (!request) return null;

  const deal = request.deal;
  const report = deal?.inspectionReport;
  const contactName = deal?.contact
    ? [deal.contact.first_name, deal.contact.last_name].filter(Boolean).join(' ')
    : null;

  const titleLine = deal ? [deal.deal_number, deal.title].filter(Boolean).join(' · ') || '—' : 'Inspection';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '92vh' } }}
    >
      {report ? (
        <>
          <DialogTitle
            sx={{
              pb: 1,
              borderBottom: 1,
              borderColor: 'divider',
              background: (t) => `linear-gradient(180deg, ${t.palette.primary.main}14 0%, transparent 100%)`,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Box>
                <Typography variant="overline" color="primary.main" fontWeight={700} letterSpacing={1}>
                  Field inspection report
                </Typography>
                <Typography variant="h5" fontWeight={800} mt={0.5}>
                  {titleLine || '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary" mt={0.5}>
                  {deal?.company?.company_name ? `Client: ${deal.company.company_name}` : ''}
                  {deal?.supplier?.company_name ? ` · Supplier: ${deal.supplier.company_name}` : ''}
                </Typography>
              </Box>
              <Button size="small" variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>
                Close
              </Button>
            </Stack>
          </DialogTitle>
          <DialogContent dividers sx={{ px: { xs: 2, sm: 4 }, py: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Deal snapshot
            </Typography>
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {!hideDealPrice && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">
                    Deal value
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {deal?.currency} {deal?.total != null ? parseFloat(deal.total).toFixed(2) : '—'}
                  </Typography>
                </Grid>
              )}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Deal date
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {deal?.deal_date ? new Date(deal.deal_date).toLocaleDateString() : '—'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Contact
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {contactName || '—'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Deal status
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {deal?.status || '—'}
                </Typography>
              </Grid>
            </Grid>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Inspection details
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Inspection date & time
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {report.inspection_datetime ? new Date(report.inspection_datetime).toLocaleString() : '—'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Approx. weight
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {report.approximate_weight != null ? `${report.approximate_weight} ${report.weight_uom || ''}` : '—'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Cargo type
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {report.cargo_type || '—'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Transportation
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {report.transportation_arrangement || '—'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Approx. value
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {report.approximate_value != null ? String(report.approximate_value) : '—'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Inspector
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {report.inspector ? [report.inspector.first_name, report.inspector.last_name].filter(Boolean).join(' ') : '—'}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" color="text.secondary">
                  Approved by
                </Typography>
                <Typography variant="body1" fontWeight={500}>
                  {report.approvedBy ? [report.approvedBy.first_name, report.approvedBy.last_name].filter(Boolean).join(' ') : '—'}
                </Typography>
              </Grid>
              <Grid size={12}>
                <Typography variant="caption" color="text.secondary">
                  Notes
                </Typography>
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mt: 0.5 }}>
                  {report.notes || '—'}
                </Typography>
              </Grid>
            </Grid>
            {report.images?.length > 0 && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" color="text.secondary" fontWeight={700} sx={{ mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Site photos
                </Typography>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                    gap: 1.5,
                  }}
                >
                  {report.images.map((path, idx) => (
                    <Box
                      key={idx}
                      component="img"
                      src={apiService.getUploadUrl(path)}
                      alt=""
                      onClick={() => {
                        setReportLightboxIndex(idx);
                        setReportLightboxOpen((p) => !p);
                      }}
                      sx={{
                        width: '100%',
                        aspectRatio: '4/3',
                        objectFit: 'cover',
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'scale(1.02)' },
                      }}
                    />
                  ))}
                </Box>
                <FsLightbox
                  toggler={reportLightboxOpen}
                  sources={report.images.map((p) => apiService.getUploadUrl(p))}
                  sourceIndex={reportLightboxIndex}
                />
              </>
            )}
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
            {typeof onEditReport === 'function' && (
              <Button
                onClick={() => {
                  onClose();
                  onEditReport();
                }}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                Edit report
              </Button>
            )}
            <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2, ml: onEditReport ? 0 : 'auto' }}>
              Done
            </Button>
          </DialogActions>
        </>
      ) : (
        <>
          <DialogTitle
            sx={{
              pb: 1,
              borderBottom: 1,
              borderColor: 'divider',
              background: (t) => `linear-gradient(180deg, ${t.palette.primary.main}14 0%, transparent 100%)`,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
              <Box>
                <Typography variant="overline" color="primary.main" fontWeight={700} letterSpacing={1}>
                  Field inspection report
                </Typography>
                <Typography variant="h5" fontWeight={800} mt={0.5}>
                  {titleLine || '—'}
                </Typography>
              </Box>
              <Button size="small" variant="outlined" onClick={onClose} sx={{ borderRadius: 2 }}>
                Close
              </Button>
            </Stack>
          </DialogTitle>
          <DialogContent sx={{ px: { xs: 2, sm: 4 }, py: 4 }}>
            <Typography color="text.secondary" align="center">
              No inspection report submitted yet.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
            <Button onClick={onClose} variant="contained" sx={{ borderRadius: 2, ml: 'auto' }}>
              Close
            </Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default InspectionReportDialog;
