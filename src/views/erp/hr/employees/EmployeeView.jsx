import React from 'react';
import { useParams } from 'react-router';
import { HrPage } from '../components/HrUi';
import EmployeeProfileTabs from './shared/EmployeeProfileTabs';

// The profile is the single place to view and edit an employee: each section has its own Edit button.
const EmployeeView = () => {
  const { id } = useParams();

  return (
    <HrPage title="Employee profile" back="/erp/hr/employees" backLabel="All employees" bare>
      <EmployeeProfileTabs key={id} mode="hr" employeeId={id} />
    </HrPage>
  );
};

export default EmployeeView;
