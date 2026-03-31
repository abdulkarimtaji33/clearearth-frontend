import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  Grid,
  Stack,
  Chip,
  Divider,
  Avatar,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  IconX,
  IconClipboardCheck,
  IconBuilding,
  IconCalendar,
  IconWeight,
  IconTruck,
  IconCurrencyDollar,
  IconUser,
} from '@tabler/icons-react';
import FsLightbox from 'fslightbox-react';
import apiService from '../../services/api';

const Section = ({ title, children }) => (
  <Box sx={{ mb: 3 }}>
    <Typography
      variant="overline"
      fontWeight={700}
      color="text.secondary"
      sx={{ letterSpacing: 1.5, display: 'block', mb: 1.5 }}
    >
      {title}
    </Typography>
    {children}
  </Box>
);

const Field = ({ icon: Icon, label, value, color }) => {
  const theme = useTheme();
  if (!value && value !== 0) return null;
  return (
    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', py: 1 }}>
      <Box
        sx={{
          width: 30,
          height: 30,
          borderRadius: 1.5,
          bgcolor: alpha(color || theme.palette.primary.main, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          mt: 0.1,
        }}
      >
        <Icon size={15} color={color || theme.palette.primary.main} />
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5} display="block">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={500} sx={{ mt: 0.15 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
};

/**
 * InspectionReportDialog — read-only report viewer
 */
const InspectionReportDialog = ({ open, onClose, request }) => {
  const theme = useTheme();
  const [lbOpen, setLbOpen] = useState(false);
  const [lbIdx, setLbIdx] = useState(0);

  if (!request) return null;

  const deal = request.deal;
  const report = deal?.inspectionReport;
  const client = deal?.company?.company_name || deal?.supplier?.company_name || '—';
  const inspector = report?.inspector
    ? [report.inspector.first_name, report.inspector.last_name].filter(Boolean).join(' ')
    : null;
  const approvedBy = report?.approvedBy
    ? [report.approvedBy.first_name, report.approvedBy.last_name].filter(Boolean).join(' ')
    : null;
  const requestedBy = request.requestedByUser
    ? [request.requestedByUser.first_name, request.requestedByUser.last_name].filter(Boolean).join(' ')
    : null;
  const images = Array.isArray(report?.images) ? report.images : [];

  const safetyToolsLabel = (() => {
    const st = request.safety_tools;
    if (!st) return null;
    try {
      const arr = typeof st === 'string' ? JSON.parse(st) : Array.isArray(st) ? st : [];
      const labels = {
        safety_jacket: 'Safety Jacket',
        safety_shoes: 'Safety Shoes',
        safety_coverall: 'Safety Coverall',
        safety_helmet: 'Safety Helmet',
        safety_tools_required: 'Safety Tools Required',
        safety_mask: 'Safety Mask',
        safety_goggles: 'Safety Goggles',
        safety_gloves: 'Safety Gloves',
      };
      return arr.map((v) => labels[v] || v).join(', ') || null;
    } catch {
      return null;
    }
  })();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
      PaperProps={{
        sx: {
          borderRadius: 4,
          maxHeight: '92vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* ── Report header ── */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark || theme.palette.primary.main} 100%)`,
          px: { xs: 2.5, sm: 4 },
          py: 3,
          color: '#fff',
          flexShrink: 0,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5} mb={0.75}>
              <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconClipboardCheck size={20} color="#fff" />
              </Box>
              <Box>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.75)', letterSpacing: 1.5, lineHeight: 1 }}>
                  Field Inspection Report
                </Typography>
                <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.2, mt: 0.25 }}>
                  {deal?.title || deal?.deal_number || 'Inspection Report'}
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={1.5} sx={{ mt: 1.5 }}>
              {deal?.deal_number && (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  Deal #{deal.deal_number}
                </Typography>
              )}
              {client !== '—' && (
                <>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>·</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{client}</Typography>
                </>
              )}
              {deal?.deal_date && (
                <>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>·</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    {new Date(deal.deal_date).toLocaleDateString()}
                  </Typography>
                </>
              )}
            </Stack>
          </Box>
          <Stack direction="row" spacing={1} flexShrink={0}>
            <Button
              size="small"
              variant="text"
              onClick={onClose}
              sx={{ color: 'rgba(255,255,255,0.8)', minWidth: 36, p: 0.75, borderRadius: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}
            >
              <IconX size={20} />
            </Button>
          </Stack>
        </Stack>

        {/* Status chips */}
        <Stack direction="row" spacing={1} mt={2} flexWrap="wrap">
          {report ? (
            <Chip label="Report Submitted" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: '0.7rem' }} />
          ) : (
            <Chip label="Awaiting Report" size="small" sx={{ bgcolor: 'rgba(255,165,0,0.3)', color: '#fff', fontWeight: 700, fontSize: '0.7rem' }} />
          )}
          {deal?.status && (
            <Chip label={`Deal: ${deal.status}`} size="small" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', fontWeight: 600, fontSize: '0.7rem' }} />
          )}
        </Stack>
      </Box>

      {/* ── Body ── */}
      <DialogContent sx={{ px: { xs: 2.5, sm: 4 }, py: 3, overflowY: 'auto' }}>

        {/* Deal snapshot */}
        <Section title="Deal snapshot">
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
              gap: 0,
              borderRadius: 2.5,
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            {[
              { label: 'Deal Value', value: deal?.total != null ? `${deal.currency || 'AED'} ${parseFloat(deal.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}` : '—' },
              { label: 'Deal Date', value: deal?.deal_date ? new Date(deal.deal_date).toLocaleDateString() : '—' },
              { label: 'Client', value: client },
              { label: 'Deal Status', value: deal?.status || '—' },
            ].map((cell, i) => (
              <Box
                key={i}
                sx={{
                  p: 1.75,
                  borderRight: i < 3 ? '1px solid' : 'none',
                  borderColor: 'divider',
                  bgcolor: alpha(theme.palette.primary.main, 0.03),
                }}
              >
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5} display="block">
                  {cell.label}
                </Typography>
                <Typography variant="body2" fontWeight={700} sx={{ mt: 0.25 }}>{cell.value}</Typography>
              </Box>
            ))}
          </Box>
        </Section>

        <Divider sx={{ my: 2 }} />

        {/* Inspection request details */}
        <Section title="Inspection request">
          <Grid container spacing={0}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field icon={IconBuilding} label="Material type" value={request.materialType?.display_name} />
              <Field icon={IconBuilding} label="Location" value={request.location} />
              <Field icon={IconBuilding} label="Location type" value={request.location_type === 'mainland' ? 'Mainland' : request.location_type === 'freezone' ? 'Freezone' : request.location_type} />
              <Field icon={IconBuilding} label="Service type" value={request.service_type} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Field icon={IconBuilding} label="Quantity" value={request.quantity_uom ? `${request.quantity} ${request.quantity_uom}` : request.quantity} />
              <Field icon={IconBuilding} label="Gate pass" value={request.gate_pass_requirement} />
              <Field icon={IconBuilding} label="Safety tools" value={safetyToolsLabel} />
              <Field icon={IconUser} label="Requested by" value={requestedBy} />
            </Grid>
          </Grid>
          {request.notes && (
            <Box sx={{ mt: 1, p: 1.5, borderRadius: 2, bgcolor: alpha(theme.palette.grey[500], 0.06), border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5} display="block" mb={0.5}>Request notes</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{request.notes}</Typography>
            </Box>
          )}
        </Section>

        {report ? (
          <>
            <Divider sx={{ my: 2 }} />

            {/* Inspection findings */}
            <Section title="Inspection findings">
              <Grid container spacing={0}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Field icon={IconCalendar} label="Inspection date & time" value={report.inspection_datetime ? new Date(report.inspection_datetime).toLocaleString() : null} />
                  <Field icon={IconWeight} label="Approximate weight" value={report.approximate_weight != null ? `${report.approximate_weight} ${report.weight_uom || ''}` : null} />
                  <Field icon={IconTruck} label="Cargo type" value={report.cargo_type} />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Field icon={IconTruck} label="Transportation" value={report.transportation_arrangement} />
                  <Field icon={IconCurrencyDollar} label="Approximate value" value={report.approximate_value != null ? String(report.approximate_value) : null} />
                </Grid>
              </Grid>
            </Section>

            {/* Sign-off */}
            <Section title="Sign-off">
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {inspector && (
                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      gap: 1.5,
                      alignItems: 'center',
                    }}
                  >
                    <Avatar sx={{ width: 38, height: 38, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', fontWeight: 700 }}>
                      {inspector.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5} display="block">Inspector</Typography>
                      <Typography variant="body2" fontWeight={700}>{inspector}</Typography>
                    </Box>
                  </Box>
                )}
                {approvedBy && (
                  <Box
                    sx={{
                      flex: 1,
                      p: 2,
                      borderRadius: 2.5,
                      border: '1px solid',
                      borderColor: alpha(theme.palette.success.main, 0.4),
                      bgcolor: alpha(theme.palette.success.main, 0.04),
                      display: 'flex',
                      gap: 1.5,
                      alignItems: 'center',
                    }}
                  >
                    <Avatar sx={{ width: 38, height: 38, bgcolor: alpha(theme.palette.success.main, 0.15), color: 'success.main', fontWeight: 700 }}>
                      {approvedBy.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5} display="block">Approved by</Typography>
                      <Typography variant="body2" fontWeight={700}>{approvedBy}</Typography>
                    </Box>
                  </Box>
                )}
              </Stack>
            </Section>

            {/* Notes */}
            {report.notes && (
              <>
                <Divider sx={{ my: 2 }} />
                <Section title="Inspector notes">
                  <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: alpha(theme.palette.grey[500], 0.06), border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>{report.notes}</Typography>
                  </Box>
                </Section>
              </>
            )}

            {/* Photos */}
            {images.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Section title={`Site photos (${images.length})`}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
                      gap: 1.5,
                    }}
                  >
                    {images.map((path, idx) => (
                      <Box
                        key={idx}
                        component="img"
                        src={apiService.getUploadUrl(path)}
                        alt=""
                        onClick={() => { setLbIdx(idx); setLbOpen((p) => !p); }}
                        sx={{
                          width: '100%',
                          aspectRatio: '1',
                          objectFit: 'cover',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          cursor: 'pointer',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': { transform: 'scale(1.03)', boxShadow: 4 },
                        }}
                      />
                    ))}
                  </Box>
                  <FsLightbox toggler={lbOpen} sources={images.map((p) => apiService.getUploadUrl(p))} sourceIndex={lbIdx} />
                </Section>
              </>
            )}
          </>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <IconClipboardCheck size={48} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
            <Typography color="text.secondary">No inspection report submitted yet.</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2.5, sm: 4 }, py: 2, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Button variant="contained" onClick={onClose} sx={{ borderRadius: 2, ml: 'auto' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InspectionReportDialog;
