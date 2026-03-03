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
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router';
import { IconArrowLeft, IconEdit, IconMail, IconPhone, IconWorld } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';

const InfoRow = ({ label, value, icon }) => (
  <Grid container spacing={2} sx={{ mb: 2 }}>
    <Grid item xs={4} md={3}>
      <Stack direction="row" spacing={1} alignItems="center">
        {icon && <Box sx={{ color: 'primary.main' }}>{icon}</Box>}
        <Typography variant="body2" color="text.secondary" fontWeight={600}>
          {label}:
        </Typography>
      </Stack>
    </Grid>
    <Grid item xs={8} md={9}>
      <Typography variant="body2">{value || '-'}</Typography>
    </Grid>
  </Grid>
);

const CompanyView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [company, setCompany] = useState(null);

  const fetchCompany = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getCompany(id);
      if (response.success) {
        setCompany(response.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to load company');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  if (loading) {
    return (
      <PageContainer title="Loading Company...">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error || !company) {
    return (
      <PageContainer title="Company Not Found">
        <Box sx={{ maxWidth: 'min(5000px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error || 'Company not found'}
          </Alert>
          <Button variant="outlined" onClick={() => navigate('/erp/companies')}>
            Back to Companies
          </Button>
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={company.company_name} description="View company details">
      <Box sx={{ maxWidth: 'min(5000px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<IconArrowLeft size={20} />}
              onClick={() => navigate('/erp/companies')}
              sx={{ borderRadius: 2 }}
            >
              Back
            </Button>
            <Box>
              <Typography variant="h3" fontWeight={700}>
                {company.company_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                {company.industry_type && (
                  <Chip label={company.industry_type} size="small" variant="outlined" />
                )}
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            startIcon={<IconEdit size={20} />}
            onClick={() => navigate(`/erp/companies/edit/${id}`)}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Edit Company
          </Button>
        </Stack>

        {/* Status Badge */}
        <Box mb={3}>
          <Chip 
            label={company.status?.toUpperCase()} 
            color={company.status === 'active' ? 'success' : 'default'}
            sx={{ fontWeight: 600 }}
          />
        </Box>

        {/* Company Details */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
            <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
              Company Details
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <InfoRow 
                  label="Email" 
                  value={company.email} 
                  icon={<IconMail size={18} />}
                />
                <InfoRow 
                  label="Phone" 
                  value={company.phone} 
                  icon={<IconPhone size={18} />}
                />
                <InfoRow 
                  label="Website" 
                  value={company.website} 
                  icon={<IconWorld size={18} />}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <InfoRow label="Country" value={company.country} />
                <InfoRow label="City" value={company.city} />
                <InfoRow label="Address" value={company.address} />
              </Grid>
            </Grid>
            
            {company.notes && (
              <>
                <Divider sx={{ my: 3 }} />
                <Typography variant="subtitle2" fontWeight={600} mb={2} color="text.primary">
                  Notes
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {company.notes}
                </Typography>
              </>
            )}
            
            <Divider sx={{ my: 3 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <InfoRow label="Created" value={new Date(company.created_at).toLocaleString()} />
              </Grid>
              <Grid item xs={12} md={6}>
                <InfoRow label="Last Updated" value={new Date(company.updated_at).toLocaleString()} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Related Contacts */}
        {company.contacts && company.contacts.length > 0 && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
              <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                Related Contacts ({company.contacts.length})
              </Typography>
              <Divider sx={{ my: 3 }} />

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.lighter' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Phone</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Primary</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {company.contacts.map((contact) => (
                      <TableRow key={contact.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {contact.first_name} {contact.last_name}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {contact.email || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {contact.phone || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {contact.CompanyContact?.role && (
                            <Chip label={contact.CompanyContact.role} size="small" variant="outlined" />
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.CompanyContact?.is_primary && (
                            <Chip label="Primary" size="small" color="primary" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Related Deals */}
        {company.deals && company.deals.length > 0 && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
              <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                Related Deals ({company.deals.length})
              </Typography>
              <Divider sx={{ my: 3 }} />

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'primary.lighter' }}>
                      <TableCell sx={{ fontWeight: 700 }}>Deal Number</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Value</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Payment</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {company.deals.map((deal) => (
                      <TableRow key={deal.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/deals/view/${deal.id}`)}>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="primary.main">
                            {deal.deal_number}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {deal.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {deal.currency} {parseFloat(deal.total || 0).toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {deal.deal_date ? new Date(deal.deal_date).toLocaleDateString() : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={deal.status} 
                            size="small" 
                            color={deal.status === 'completed' ? 'success' : deal.status === 'cancelled' ? 'error' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={deal.payment_status} 
                            size="small" 
                            color={deal.payment_status === 'paid' ? 'success' : deal.payment_status === 'partial' ? 'warning' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Box>
    </PageContainer>
  );
};

export default CompanyView;
