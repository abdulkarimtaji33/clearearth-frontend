import React from 'react';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';

const InboundList = () => {
  const navigate = useNavigate();

  return (
    <PageContainer title="Inbound" description="Manage inbound operations">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="600">
            Inbound / GRN
          </Typography>
          <Button variant="contained" startIcon={<IconPlus />} onClick={() => navigate('/erp/inbound/create')}>
            Create GRN
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Alert severity="info">
              Inbound operations module - Coming soon. This will include GRN creation, approval workflow, and lot-based tracking.
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default InboundList;
