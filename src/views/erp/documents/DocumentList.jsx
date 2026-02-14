import React from 'react';
import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../components/container/PageContainer';

const DocumentList = () => {
  const navigate = useNavigate();

  return (
    <PageContainer title="Documents" description="Manage documents">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" fontWeight="600">
            Documents
          </Typography>
          <Button variant="contained" startIcon={<IconPlus />} onClick={() => navigate('/erp/documents/upload')}>
            Upload Document
          </Button>
        </Box>

        <Card>
          <CardContent>
            <Alert severity="info">
              Document management module - Coming soon. This will include document uploads, version control, and document repository.
            </Alert>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default DocumentList;
