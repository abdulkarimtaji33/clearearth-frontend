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
        <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
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
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
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

        {/* Contact Information */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 5 }}>
            <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
              Contact Information
            </Typography>
            <Divider sx={{ my: 3 }} />
            
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
          </CardContent>
        </Card>

        {/* Location Details */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
          <CardContent sx={{ p: 5 }}>
            <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
              Location
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            <InfoRow label="Country" value={company.country} />
            <InfoRow label="City" value={company.city} />
            <InfoRow label="Address" value={company.address} />
          </CardContent>
        </Card>

        {/* Company Contacts */}
        {company.contacts && company.contacts.length > 0 && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 5 }}>
              <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                Company Contacts ({company.contacts.length})
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

        {/* Notes */}
        {company.notes && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
            <CardContent sx={{ p: 5 }}>
              <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                Notes
              </Typography>
              <Divider sx={{ my: 3 }} />
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {company.notes}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Timestamps */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
          <CardContent sx={{ p: 5 }}>
            <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
              Audit Information
            </Typography>
            <Divider sx={{ my: 3 }} />
            
            <InfoRow label="Created" value={new Date(company.created_at).toLocaleString()} />
            <InfoRow label="Last Updated" value={new Date(company.updated_at).toLocaleString()} />
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default CompanyView;
