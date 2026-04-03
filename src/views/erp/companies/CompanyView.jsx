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
  IconChevronDown,
  IconChevronUp,
  IconFileText,
  IconCertificate,
  IconBuildingBank,
} from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const StatCell = ({ value, label, icon: Icon, color }) => {
  const theme = useTheme();
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 0.5,
        py: 1.75,
        px: 1.5,
        flex: 1,
        position: 'relative',
        '&:not(:last-child)::after': {
          content: '""',
          position: 'absolute',
          right: 0,
          top: '20%',
          height: '60%',
          width: '1px',
          bgcolor: 'divider',
        },
      }}
    >
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

const DocRow = ({ label, value, filePath }) => {
  const url = filePath ? apiService.getUploadUrl(filePath) : null;
  if (!value && !filePath) return null;
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 0.75 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>{label}</Typography>
      <Stack direction="row" alignItems="center" spacing={1}>
        {value && <Typography variant="body2" fontWeight={600}>{value}</Typography>}
        {url && (
          <Button size="small" href={url} target="_blank" rel="noopener noreferrer" startIcon={<IconFileText size={14} />} sx={{ borderRadius: 1.5, py: 0.25, px: 1, fontSize: '0.72rem' }}>
            View
          </Button>
        )}
      </Stack>
    </Stack>
  );
};

const DocSection = ({ icon: Icon, iconColor, title, children, hasData }) => {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  if (!hasData) return null;
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mb: 1.5 }}>
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 1.25, cursor: 'pointer',
          bgcolor: open ? alpha(iconColor, 0.04) : 'transparent',
          transition: 'background 0.15s',
          '&:hover': { bgcolor: alpha(iconColor, 0.06) },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box sx={{ width: 26, height: 26, borderRadius: 1.5, bgcolor: alpha(iconColor, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={14} color={iconColor} />
          </Box>
          <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
        </Stack>
        {open ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 2, pb: 1.5 }}>{children}</Box>
      </Collapse>
    </Box>
  );
};

const CompanyView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [company, setCompany] = useState(null);
  const [docsOpen, setDocsOpen] = useState(false);

  const fetchCompany = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getCompany(id);
      if (response.success) setCompany(response.data);
    } catch (err) {
      setError(err.message || 'Failed to load company');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCompany(); }, [fetchCompany]);

  if (loading) {
    return (
      <PageContainer title="Loading...">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error || !company) {
    return (
      <PageContainer title="Company Not Found">
        <Box sx={{ maxWidth: 480, mx: 'auto', pt: 6 }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error || 'Company not found'}</Alert>
          <Button variant="outlined" startIcon={<IconArrowLeft size={18} />} onClick={() => navigate('/erp/companies')}>
            Back to Companies
          </Button>
        </Box>
      </PageContainer>
    );
  }

  const initial = (company.company_name || '?').trim().charAt(0).toUpperCase();
  const contactsCount = company.contacts?.length || 0;
  const dealsCount = company.deals?.length || 0;

  const hasTradeLicense = !!(company.trade_license_file_path || company.trade_license_number || company.trade_license_name || company.trade_license_expiry_date);
  const hasVat = !!(company.vat_certificate_file_path || company.vat_certificate_trn);
  const hasBank = !!(company.bank_details_file_path || company.bank_name || company.bank_iban);
  const hasAnyDoc = hasTradeLicense || hasVat || hasBank;

  return (
    <PageContainer title={company.company_name} description="Company profile">
      <Box sx={{ width: '100%', px: { xs: 1, sm: 2 }, pb: 3 }}>

        {/* Hero Card */}
        <Paper elevation={0} sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid', borderColor: 'divider', mb: 2 }}>
          <Box sx={{ height: 6, background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)` }} />

          <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2.5, pb: 2, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'flex-start' }, gap: 2.5 }}>
            <Avatar sx={{ width: 76, height: 76, fontSize: '1.7rem', fontWeight: 800, bgcolor: theme.palette.primary.main, color: 'primary.contrastText', boxShadow: `0 0 0 4px ${alpha(theme.palette.primary.main, 0.15)}`, flexShrink: 0 }}>
              {initial}
            </Avatar>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Stack direction="row" flexWrap="wrap" alignItems="center" gap={1.5} mb={0.5}>
                <Typography variant="h4" fontWeight={800} letterSpacing={-0.5}>{company.company_name}</Typography>
                <Chip label={company.status?.toUpperCase() || 'UNKNOWN'} size="small" color={company.status === 'active' ? 'success' : 'default'} sx={{ fontWeight: 700, height: 22, fontSize: '0.7rem', letterSpacing: 0.5 }} />
              </Stack>

              <Stack direction="row" flexWrap="wrap" gap={0.75} mb={1.5}>
                {company.industry_type && <Chip icon={<IconBuilding size={13} />} label={company.industry_type} size="small" variant="outlined" sx={{ fontSize: '0.73rem', borderRadius: 1.5 }} />}
                {company.type && <Chip label={company.type} size="small" variant="outlined" sx={{ fontSize: '0.73rem', borderRadius: 1.5 }} />}
              </Stack>

              <Stack direction="row" flexWrap="wrap" gap={2} alignItems="center" sx={{ color: 'text.secondary' }}>
                {company.email && (
                  <Stack direction="row" alignItems="center" spacing={0.6}>
                    <IconMail size={14} />
                    <Typography variant="body2" component="a" href={`mailto:${company.email}`} sx={{ color: 'inherit', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                      {company.email}
                    </Typography>
                  </Stack>
                )}
                {company.phone && (
                  <Stack direction="row" alignItems="center" spacing={0.6}>
                    <IconPhone size={14} />
                    <Typography variant="body2">{company.phone}</Typography>
                  </Stack>
                )}
                {company.website && (
                  <Stack direction="row" alignItems="center" spacing={0.6}>
                    <IconWorld size={14} color={theme.palette.primary.main} />
                    <Typography variant="body2" component="a" href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" rel="noopener noreferrer" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                      {company.website}
                    </Typography>
                    <IconExternalLink size={12} color={theme.palette.primary.main} />
                  </Stack>
                )}
                {(company.city || company.country) && (
                  <Stack direction="row" alignItems="center" spacing={0.6}>
                    <IconMapPin size={14} />
                    <Typography variant="body2">{[company.city, company.country].filter(Boolean).join(', ')}</Typography>
                  </Stack>
                )}
                {company.address && (
                  <Stack direction="row" alignItems="center" spacing={0.6}>
                    <IconMapPin size={14} style={{ opacity: 0.5 }} />
                    <Typography variant="body2" color="text.secondary">{company.address}</Typography>
                  </Stack>
                )}
              </Stack>
            </Box>

            <Button variant="contained" startIcon={<IconEdit size={16} />} onClick={() => navigate(`/erp/companies/edit/${id}`)} sx={{ borderRadius: 2.5, fontWeight: 700, flexShrink: 0, px: 2.5 }}>
              Edit
            </Button>
          </Box>

          {/* Stats bar */}
          <Box sx={{ display: 'flex', borderTop: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.5) }}>
            <StatCell value={contactsCount} label="Contacts" icon={IconUsers} />
            <StatCell value={dealsCount} label="Deals" icon={IconBriefcase} />
            <StatCell value={company.vat_number || '—'} label="VAT / TRN" icon={IconHash} />
          </Box>
        </Paper>

        {/* Notes */}
        {company.notes && (
          <Card elevation={0} sx={{ borderRadius: 2.5, border: '1px solid', borderColor: 'divider', mb: 2 }}>
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>Notes</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{company.notes}</Typography>
            </CardContent>
          </Card>
        )}

        {/* Documentation */}
        {hasAnyDoc && (
          <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', mb: 2 }}>
            <Box
              onClick={() => setDocsOpen((v) => !v)}
              sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                px: 2.5, py: 1.75, cursor: 'pointer',
                bgcolor: docsOpen ? alpha(theme.palette.primary.main, 0.03) : 'transparent',
                borderRadius: docsOpen ? '12px 12px 0 0' : 3,
                transition: 'background 0.15s',
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <IconFileText size={16} color={theme.palette.primary.main} />
                </Box>
                <Typography variant="subtitle1" fontWeight={800}>Company Documentation</Typography>
                <Chip label={[hasTradeLicense, hasVat, hasBank].filter(Boolean).length} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
              </Stack>
              {docsOpen ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
            </Box>
            <Collapse in={docsOpen}>
              <Box sx={{ px: 2.5, pb: 2.5, pt: 1 }}>
                <DocSection icon={IconFileText} iconColor={theme.palette.primary.main} title="Trade License" hasData={hasTradeLicense}>
                  <DocRow label="License number" value={company.trade_license_number} filePath={company.trade_license_file_path} />
                  <DocRow label="Name on license" value={company.trade_license_name} />
                  <DocRow label="Expiry date" value={company.trade_license_expiry_date ? String(company.trade_license_expiry_date).slice(0, 10) : null} />
                </DocSection>
                <DocSection icon={IconCertificate} iconColor={theme.palette.warning.main} title="VAT Certificate" hasData={hasVat}>
                  <DocRow label="TRN number" value={company.vat_certificate_trn} filePath={company.vat_certificate_file_path} />
                </DocSection>
                <DocSection icon={IconBuildingBank} iconColor={theme.palette.success.main} title="Bank Details" hasData={hasBank}>
                  <DocRow label="Bank name" value={company.bank_name} filePath={company.bank_details_file_path} />
                  <DocRow label="IBAN" value={company.bank_iban} />
                </DocSection>
              </Box>
            </Collapse>
          </Card>
        )}

        {/* Contacts + Deals */}
        {(contactsCount > 0 || dealsCount > 0) && (
          <Grid container spacing={2} alignItems="flex-start">
            {contactsCount > 0 && (
              <Grid size={{ xs: 12, md: dealsCount > 0 ? 5 : 12 }}>
                <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                  <CardContent sx={{ p: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1} mb={1.5}>
                      <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconUsers size={16} color={theme.palette.primary.main} />
                      </Box>
                      <Typography variant="subtitle1" fontWeight={800}>Contacts</Typography>
                      <Chip label={contactsCount} size="small" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
                    </Stack>
                    <Stack spacing={1}>
                      {company.contacts.map((contact) => (
                        <Box
                          key={contact.id}
                          sx={{
                            display: 'flex', gap: 1.5, alignItems: 'flex-start',
                            p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider',
                            transition: 'all 0.15s',
                            '&:hover': { borderColor: 'primary.main', bgcolor: alpha(theme.palette.primary.main, 0.02) },
                          }}
                        >
                          <Avatar sx={{ width: 34, height: 34, bgcolor: alpha(theme.palette.primary.main, 0.12), color: 'primary.main', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0 }}>
                            {(contact.first_name || '?').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>
                              {[contact.first_name, contact.last_name].filter(Boolean).join(' ') || '—'}
                            </Typography>
                            {contact.email && <Typography variant="caption" color="text.secondary" noWrap display="block">{contact.email}</Typography>}
                            {(contact.phone || contact.mobile) && <Typography variant="caption" color="text.secondary" noWrap display="block">{contact.phone || contact.mobile}</Typography>}
                            <Stack direction="row" flexWrap="wrap" gap={0.5} mt={0.5}>
                              {contact.CompanyContact?.role && <Chip label={contact.CompanyContact.role} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />}
                              {contact.CompanyContact?.is_primary && <Chip label="Primary" size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />}
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
                      {company.deals.map((deal) => (
                        <Box
                          key={deal.id}
                          onClick={() => navigate(`/erp/deals/view/${deal.id}`)}
                          sx={{
                            display: 'flex', borderRadius: 2, border: '1px solid', borderColor: 'divider',
                            overflow: 'hidden', cursor: 'pointer', transition: 'all 0.15s',
                            '&:hover': { borderColor: 'primary.main', boxShadow: `0 2px 12px ${alpha(theme.palette.primary.main, 0.1)}`, transform: 'translateY(-1px)' },
                          }}
                        >
                          <Box sx={{ width: 4, bgcolor: 'primary.main', flexShrink: 0 }} />
                          <Box sx={{ flex: 1, px: 1.75, py: 1.25 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="caption" color="primary.main" fontWeight={700} letterSpacing={0.5}>{deal.deal_number}</Typography>
                                <Typography variant="body2" fontWeight={700} noWrap sx={{ lineHeight: 1.3 }}>{deal.title}</Typography>
                                <Typography variant="caption" color="text.secondary">{deal.deal_date ? new Date(deal.deal_date).toLocaleDateString() : '—'}</Typography>
                              </Box>
                              <Stack alignItems="flex-end" spacing={0.5} flexShrink={0}>
                                <Typography variant="body2" fontWeight={800} color="primary.main" noWrap>
                                  {deal.currency} {parseFloat(deal.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
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

export default CompanyView;
