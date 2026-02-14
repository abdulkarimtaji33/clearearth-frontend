import React from 'react';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';

const CommissionList = () => {
  const navigate = useNavigate();

  return (
    <PageContainer title="Commissions" description="Manage commissions">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="600">
            Commissions
          </Typography>
          <Button variant="contained" startIcon={<IconPlus />} onClick={() => navigate('/erp/commissions/calculate')}>
            Calculate Commission
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Alert severity="info">
              Commission management module - Coming soon. This will include commission calculation, approval workflow, and payment processing.
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default CommissionList;
