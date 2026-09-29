import React from 'react';
import { Box, Button, Stack } from '@mui/material';
import { IconEdit } from '@tabler/icons-react';
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
        {hasPermission('hr.employees.manage') && (
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Stack direction="row" spacing={1}>
              <Button
                startIcon={<IconEdit size={18} />}
                variant="outlined"
                onClick={() => navigate(`/erp/hr/employees/edit/${id}`)}
                sx={{ borderRadius: 2 }}
              >
                Edit
              </Button>
            </Stack>
          </Box>
        )}
        <EmployeeProfileTabs mode="hr" employeeId={id} />
      </Box>
    </PageContainer>
  );
};

export default EmployeeView;
