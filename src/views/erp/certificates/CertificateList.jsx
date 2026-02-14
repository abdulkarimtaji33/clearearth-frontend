import React from 'react';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';

const CertificateList = () => {
  const navigate = useNavigate();

  return (
    <PageContainer title="Certificates" description="Manage certificates">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="600">
            Certificates
          </Typography>
          <Button variant="contained" startIcon={<IconPlus />} onClick={() => navigate('/erp/certificates/create')}>
            Issue Certificate
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Alert severity="info">
              Certificate management module - Coming soon. This will include certificate templates, issuance, verification, and QR code generation.
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default CertificateList;
