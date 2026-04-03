import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  Avatar,
  Paper,
  Collapse,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate, useParams } from 'react-router';
import {
  IconArrowLeft,
  IconEdit,
  IconMail,
  IconPhone,
  IconWorld,
  IconMapPin,
  IconBuilding,
  IconUsers,
  IconBriefcase,
  IconHash,
  IconExternalLink,
  IconTruckDelivery,
  IconChevronDown,
  IconChevronUp,
  IconFileText,
  IconCertificate,
  IconBuildingBank,
  IconLicense,
} from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const StatCell = ({ value, label, icon: Icon, color }) => {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, py: 2, px: 1.5, flex: 1, position: 'relative', '&:not(:last-child)::after': { content: '""', position: 'absolute', right: 0, top: '20%', height: '60%', width: '1px', bgcolor: 'divider' } }}>
      {Icon && (
        <Box sx={{ width: 32, height: 32, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(color || theme.palette.primary.main, 0.1), mb: 0.5 }}>
          <Icon size={16} color={color || theme.palette.primary.main} />
        </Box>
      )}
      <Typography variant="h5" fontWeight={800} color={color || 'primary.main'} lineHeight={1}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>{label}</Typography>
    </Box>
  );
};

const DocCard = ({ icon: Icon, iconColor, title, hasData, children, onEdit }) => {
  const [open, setOpen] = useState(hasData);
  const theme = useTheme();
  return (
    <Box sx={{ border: '1px solid', borderColor: hasData ? 'divider' : alpha(iconColor, 0.2), borderRadius: 2.5, overflow: 'hidden' }}>
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.5, cursor: 'pointer', bgcolor: open ? alpha(iconColor, 0.05) : alpha(iconColor, 0.02), transition: 'background 0.15s', '&:hover': { bgcolor: alpha(iconColor, 0.08) } }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: alpha(iconColor, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={16} color={iconColor} />
          </Box>
          <Box>
            <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
            {!hasData && <Typography variant="caption" color="text.disabled">No data — click Edit to add</Typography>}
          </Box>
          {hasData && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main', flexShrink: 0 }} />}
        </Stack>
        {open ? <IconChevronUp size={16} opacity={0.5} /> : <IconChevronDown size={16} opacity={0.5} />}
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 2.5, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {hasData ? children : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" color="text.disabled" mb={1.5}>Nothing saved yet</Typography>
              {onEdit && <Button size="small" variant="outlined" onClick={onEdit} sx={{ borderRadius: 2 }}>Edit to add</Button>}
            </Box>
          )}
        </Box>
      </Collapse>
    </Box>
  );
};

const InfoRow = ({ label, value, href, isFile }) => {
  if (!value) return null;
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75, borderBottom: '1px solid', borderColor: 'divider', '&:last-child': { borderBottom: 'none' } }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ minWidth: 130 }}>{label}</Typography>
      {isFile ? (
        <Button size="small" href={href} target="_blank" rel="noopener noreferrer" startIcon={<IconFileText size={13} />} sx={{ borderRadius: 1.5, py: 0.25, px: 1.5, fontSize: '0.72rem', fontWeight: 600 }}>View document</Button>
      ) : (
        <Typography variant="body2" fontWeight={600} color="text.primary" sx={{ textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{value}</Typography>
      )}
    </Stack>
  );
};

const SupplierView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [supplier, setSupplier] = useState(null);
  const [docsOpen, setDocsOpen] = useState(true);

  const fetchSupplier = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getSupplier(id);
      if (res.success) setSupplier(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load supplier');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchSupplier(); }, [fetchSupplier]);

  if (loading) return <PageContainer title="Loading..."><Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh"><CircularProgress /></Box></PageContainer>;
  if (error || !supplier) return (
    <PageContainer title="Not Found">
      <Box sx={{ maxWidth: 480, mx: 'auto', pt: 6 }}>
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error || 'Supplier not found'}</Alert>
        <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/suppliers')}>Back</Button>
      </Box>
    </PageContainer>
  );

  const initial = (supplier.company_name || '?').trim().charAt(0).toUpperCase();
  const contactsCount = supplier.contacts?.length || 0;
  const dealsCount = supplier.deals?.length || 0;

  const hasTradeLicense = !!(supplier.trade_license_file_path || supplier.trade_license_number || supplier.trade_license_name || supplier.trade_license_expiry_date);
  const hasVat = !!(supplier.vat_certificate_file_path || supplier.vat_certificate_trn);
  const hasBank = !!(supplier.bank_details_file_path || supplier.bank_name || supplier.bank_iban);
  const goEdit = () => navigate(`/erp/suppliers/edit/${id}`);

  const vendorRoleChip = (role) => {
    if (role === 'downstream') return <Chip label="Downstream" size="small" variant="outlined" color="secondary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />;
    if (role === 'both') return <Chip label="Primary & downstream" size="small" variant="outlined" color="primary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />;
    return <Chip label="Primary vendor" size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }} />;
  };

  return (
    <PageContainer title={supplier.company_name} description="Supplier / vendor profile">
      <Box sx={{ width: '100%', px: { xs: 1, sm: 2 }, pb: 4 }}>

        {/* ── Hero ── */}
        <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', mb: 2.5 }}>
          <Box sx={{ height: 5, background: `linear-gradient(90deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})` }} />
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'flex-start' }, gap: 2.5 }}>
            <Avatar sx={{ width: 72, height: 72, fontSize: '1.6rem', fontWeight: 800, bgcolor: theme.palette.secondary.main, color: '#fff', boxShadow: `0 0 0 4px ${alpha(theme.palette.secondary.main, 0.15)}`, flexShrink: 0 }}>
              {initial}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1.5} mb={0.5}>
                <Typography variant="h4" fontWeight={800} letterSpacing={-0.5}>{supplier.company_name}</Typography>
                <Chip label={supplier.status?.toUpperCase() || 'UNKNOWN'} size="small" color={supplier.status === 'active' ? 'success' : 'default'} sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem' }} />
              </Stack>
              <Stack direction="row" flexWrap="wrap" gap={0.75} mb={1.25}>
                <Chip icon={<IconTruckDelivery size={12} />} label="Vendor" size="small" variant="outlined" sx={{ fontSize: '0.72rem', borderRadius: 1.5 }} />
                {supplier.industry_type && <Chip icon={<IconBuilding size={12} />} label={supplier.industry_type} size="small" variant="outlined" sx={{ fontSize: '0.72rem', borderRadius: 1.5 }} />}
                {supplier.type && <Chip label={supplier.type} size="small" variant="outlined" sx={{ fontSize: '0.72rem', borderRadius: 1.5 }} />}
              </Stack>
              <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center" color="text.secondary">
                {supplier.email && <Stack direction="row" alignItems="center" spacing={0.5}><IconMail size={13} /><Typography variant="body2" component="a" href={`mailto:${supplier.email}`} sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>{supplier.email}</Typography></Stack>}
                {supplier.phone && <Stack direction="row" alignItems="center" spacing={0.5}><IconPhone size={13} /><Typography variant="body2">{supplier.phone}</Typography></Stack>}
                {supplier.website && <Stack direction="row" alignItems="center" spacing={0.5}><IconWorld size={13} color={theme.palette.primary.main} /><Typography variant="body2" component="a" href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`} target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>{supplier.website}</Typography><IconExternalLink size={11} color={theme.palette.primary.main} /></Stack>}
                {(supplier.city || supplier.country) && <Stack direction="row" alignItems="center" spacing={0.5}><IconMapPin size={13} /><Typography variant="body2">{[supplier.city, supplier.country].filter(Boolean).join(', ')}</Typography></Stack>}
                {supplier.address && <Stack direction="row" alignItems="center" spacing={0.5}><IconMapPin size={13} style={{ opacity: 0.4 }} /><Typography variant="body2">{supplier.address}</Typography></Stack>}
              </Stack>
            </Box>
            <Button variant="contained" startIcon={<IconEdit size={15} />} onClick={goEdit} sx={{ borderRadius: 2.5, fontWeight: 700, flexShrink: 0 }}>Edit</Button>
          </Box>
          <Box sx={{ display: 'flex', borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.5) }}>
            <StatCell value={contactsCount} label="Contacts" icon={IconUsers} />
            <StatCell value={dealsCount} label="Deals" icon={IconBriefcase} />
            <StatCell value={supplier.vat_number || '—'} label="VAT / TRN" icon={IconHash} />
          </Box>
        </Paper>

        {/* ── Notes ── */}
        {supplier.notes && (
          <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', mb: 2.5 }}>
            <CardContent sx={{ py: 1.5, px: 2.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>Notes</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{supplier.notes}</Typography>
            </CardContent>
          </Card>
        )}

        {/* ── Documentation (always visible) ── */}
        <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 2.5 }}>
          <Box
            onClick={() => setDocsOpen((v) => !v)}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 2, cursor: 'pointer', bgcolor: docsOpen ? alpha(theme.palette.secondary.main, 0.03) : 'transparent', transition: 'background 0.15s', '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.05) } }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: alpha(theme.palette.secondary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconLicense size={18} color={theme.palette.secondary.main} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={800}>Vendor Documentation</Typography>
                <Typography variant="caption" color="text.secondary">Trade license · VAT certificate · Bank details</Typography>
              </Box>
              <Stack direction="row" spacing={0.5} ml={1}>
                {hasTradeLicense && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'primary.main' }} title="Trade license" />}
                {hasVat && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'warning.main' }} title="VAT" />}
                {hasBank && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'success.main' }} title="Bank" />}
              </Stack>
            </Stack>
            {docsOpen ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
          </Box>
          <Collapse in={docsOpen}>
            <Box sx={{ px: 2.5, pb: 2.5, pt: 0.5 }}>
              <Stack spacing={1.5}>
                <DocCard icon={IconFileText} iconColor={theme.palette.primary.main} title="Trade License" hasData={hasTradeLicense} onEdit={goEdit}>
                  {supplier.trade_license_file_path && <InfoRow label="Document" isFile value="View file" href={apiService.getUploadUrl(supplier.trade_license_file_path)} />}
                  <InfoRow label="License number" value={supplier.trade_license_number} />
                  <InfoRow label="Name on license" value={supplier.trade_license_name} />
                  <InfoRow label="Expiry date" value={supplier.trade_license_expiry_date ? String(supplier.trade_license_expiry_date).slice(0, 10) : null} />
                </DocCard>
                <DocCard icon={IconCertificate} iconColor={theme.palette.warning.main} title="VAT Certificate" hasData={hasVat} onEdit={goEdit}>
                  {supplier.vat_certificate_file_path && <InfoRow label="Document" isFile value="View file" href={apiService.getUploadUrl(supplier.vat_certificate_file_path)} />}
                  <InfoRow label="TRN number" value={supplier.vat_certificate_trn} />
                </DocCard>
                <DocCard icon={IconBuildingBank} iconColor={theme.palette.success.main} title="Bank Details / IBAN" hasData={hasBank} onEdit={goEdit}>
                  {supplier.bank_details_file_path && <InfoRow label="Document" isFile value="View file" href={apiService.getUploadUrl(supplier.bank_details_file_path)} />}
                  <InfoRow label="Bank name" value={supplier.bank_name} />
                  <InfoRow label="IBAN" value={supplier.bank_iban} />
                </DocCard>
              </Stack>
            </Box>
          </Collapse>
        </Card>

        {/* ── Contacts + Deals ── */}
        {(contactsCount > 0 || dealsCount > 0) && (
          <Grid container spacing={2} alignItems="flex-start">
            {contactsCount > 0 && (
              <Grid size={{ xs: 12, md: dealsCount > 0 ? 5 : 12 }}>
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                      <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: alpha(theme.palette.secondary.main, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconUsers size={16} color={theme.palette.secondary.main} />
                      </Box>
                      <Typography variant="subtitle1" fontWeight={800}>Contacts</Typography>
                      <Chip label={contactsCount} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
                    </Stack>
                    <Stack spacing={1}>
                      {supplier.contacts.map((c) => (
                        <Box key={c.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start', p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', transition: 'all 0.15s', '&:hover': { borderColor: 'secondary.main', bgcolor: alpha(theme.palette.secondary.main, 0.04) } }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(theme.palette.secondary.main, 0.12), color: 'secondary.main', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>{(c.first_name || '?').charAt(0).toUpperCase()}</Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>{[c.first_name, c.last_name].filter(Boolean).join(' ') || '—'}</Typography>
                            {c.email && <Typography variant="caption" color="text.secondary" noWrap display="block">{c.email}</Typography>}
                            {(c.phone || c.mobile) && <Typography variant="caption" color="text.secondary" noWrap display="block">{c.phone || c.mobile}</Typography>}
                            <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                              {c.SupplierContact?.role && <Chip label={c.SupplierContact.role} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />}
                              {c.SupplierContact?.is_primary && <Chip label="Primary" size="small" color="secondary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />}
                            </Stack>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
            {dealsCount > 0 && (
              <Grid size={{ xs: 12, md: contactsCount > 0 ? 7 : 12 }}>
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                      <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconBriefcase size={16} color={theme.palette.primary.main} />
                      </Box>
                      <Typography variant="subtitle1" fontWeight={800}>Deals</Typography>
                      <Chip label={dealsCount} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
                    </Stack>
                    <Stack spacing={1}>
                      {supplier.deals.map((deal) => (
                        <Box key={deal.id} onClick={() => navigate(`/erp/deals/view/${deal.id}`)} sx={{ display: 'flex', borderRadius: 2, border: '1px solid', borderColor: 'divider', overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s', '&:hover': { borderColor: 'primary.main', boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.1)}`, transform: 'translateY(-1px)' } }}>
                          <Box sx={{ width: 4, bgcolor: 'secondary.main', flexShrink: 0 }} />
                          <Box sx={{ flex: 1, px: 1.75, py: 1.25 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                              <Box sx={{ minWidth: 0 }}>
                                <Stack direction="row" alignItems="center" gap={0.75} flexWrap="wrap">
                                  <Typography variant="caption" color="primary.main" fontWeight={700} letterSpacing={0.5}>{deal.deal_number}</Typography>
                                  {deal.vendorRole && vendorRoleChip(deal.vendorRole)}
                                </Stack>
                                <Typography variant="body2" fontWeight={700} noWrap sx={{ lineHeight: 1.3 }}>{deal.title}</Typography>
                                <Typography variant="caption" color="text.secondary">{deal.deal_date ? new Date(deal.deal_date).toLocaleDateString() : '—'}</Typography>
                              </Box>
                              <Stack alignItems="flex-end" spacing={0.5} flexShrink={0}>
                                <Typography variant="body2" fontWeight={800} color="primary.main" noWrap>{deal.currency} {parseFloat(deal.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
                                <Stack direction="row" spacing={0.5}>
                                  <Chip label={deal.status} size="small" color={deal.status === 'completed' ? 'success' : deal.status === 'cancelled' ? 'error' : 'default'} sx={{ fontWeight: 700, fontSize: '0.65rem', height: 18 }} />
                                  <Chip label={deal.payment_status} size="small" variant="outlined" color={deal.payment_status === 'paid' ? 'success' : deal.payment_status === 'partial' ? 'warning' : 'default'} sx={{ fontWeight: 600, fontSize: '0.65rem', height: 18 }} />
                                </Stack>
                              </Stack>
                            </Stack>
                          </Box>
                        </Box>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        )}
      </Box>
    </PageContainer>
  );
};

export default SupplierView;
