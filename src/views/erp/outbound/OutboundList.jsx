import React from 'react';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';

const OutboundList = () => {
  const navigate = useNavigate();

  return (
    <PageContainer title="Outbound" description="Manage outbound operations">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="600">
            Outbound / Dispatch
          </Typography>
          <Button variant="contained" startIcon={<IconPlus />} onClick={() => navigate('/erp/outbound/create')}>
            Create Dispatch
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Alert severity="info">
              Outbound operations module - Coming soon. This will include dispatch management, delivery tracking, and outsourced service handling.
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default OutboundList;
