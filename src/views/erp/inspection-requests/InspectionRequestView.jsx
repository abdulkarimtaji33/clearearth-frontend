import React, { useEffect, useState, useCallback } from 'react';
import { Box, Alert, Button, CircularProgress } from '@mui/material';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';
import InspectionRequestDetail from '../../../components/erp/InspectionRequestDetail';
import apiService from '../../../services/api';

const InspectionRequestView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [request, setRequest] = useState(null);

  const fetchRequest = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await apiService.getInspectionRequest(id);
      if (res.success) setRequest(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load inspection request');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  if (!id) {
    return (
      <PageContainer title="Invalid Request">
        <Alert severity="error">Invalid inspection request ID</Alert>
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  if (error && !request) {
    return (
      <PageContainer>
        <Alert severity="error">{error}</Alert>
        <Button variant="outlined" onClick={() => navigate('/erp/inspection-requests')} sx={{ mt: 2 }}>Back to List</Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Inspection Report" description="Inspection request and report detail">
      <InspectionRequestDetail request={request} onRefresh={fetchRequest} />
    </PageContainer>
  );
};

export default InspectionRequestView;
