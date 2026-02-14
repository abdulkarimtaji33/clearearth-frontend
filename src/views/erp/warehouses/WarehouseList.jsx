import React from 'react';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';

const WarehouseList = () => {
  const navigate = useNavigate();

  return (
    <PageContainer title="Warehouses" description="Manage warehouses">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="600">
            Warehouses
          </Typography>
          <Button variant="contained" startIcon={<IconPlus />} onClick={() => navigate('/erp/warehouses/create')}>
            Add Warehouse
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Alert severity="info">
              Warehouse management module - Coming soon. This will include warehouse locations, capacity, and multi-location management.
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default WarehouseList;
