import React from 'react';
import { Button } from '@mui/material';
import { IconEdit } from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router';
import { useAuth } from '../../../../context/AuthContext';
import { HrPage } from '../components/HrUi';
import EmployeeProfileTabs from './shared/EmployeeProfileTabs';

const EmployeeView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  return (
    <HrPage title="Employee profile" back="/erp/hr/employees" backLabel="All employees" bare>
      <EmployeeProfileTabs
        key={id}
        mode="hr"
        employeeId={id}
        headerActions={hasPermission('hr.employees.manage') && (
          <Button
            variant="contained"
            startIcon={<IconEdit size={17} />}
            onClick={() => navigate(`/erp/hr/employees/edit/${id}`)}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Edit
          </Button>
        )}
      />
    </HrPage>
  );
};

export default EmployeeView;
