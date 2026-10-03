import React from 'react';
import { Box, Button, Stack } from '@mui/material';
import { IconArrowLeft, IconEdit } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';
import { useAuth } from '../../../../context/AuthContext';
import EmployeeProfileTabs from './shared/EmployeeProfileTabs';

const EmployeeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  return (
    <PageContainer title="Employee profile" description="Employee profile">
      <Box sx={{ maxWidth: 'min(1400px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1} mb={2}>
          <Button
            startIcon={<IconArrowLeft size={18} />}
            variant="text"
            color="inherit"
            onClick={() => navigate('/erp/hr/employees')}
            sx={{ borderRadius: 2, fontWeight: 600, color: 'text.secondary' }}
          >
            Back to employees
          </Button>
          {hasPermission('hr.employees.manage') && (
            <Button
              startIcon={<IconEdit size={18} />}
              variant="outlined"
              onClick={() => navigate(`/erp/hr/employees/edit/${id}`)}
              sx={{ borderRadius: 2, fontWeight: 600 }}
            >
              Edit
            </Button>
          )}
        </Stack>
        <EmployeeProfileTabs mode="hr" employeeId={id} />
      </Box>
    </PageContainer>
  );
};

export default EmployeeView;
