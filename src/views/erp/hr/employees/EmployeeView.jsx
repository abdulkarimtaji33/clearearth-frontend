import React from 'react';
import { useParams } from 'react-router';
import { HrPage } from '../components/HrUi';
import EmployeeDetailPage from './shared/EmployeeDetailPage';

// The profile is the single place to view and edit an employee: each section has its own Edit button.
const EmployeeView = () => {
  const { id } = useParams();

  return (
    <HrPage title="Employee profile" back="/erp/hr/employees" backLabel="All employees" bare>
      <EmployeeDetailPage key={id} employeeId={id} />
    </HrPage>
  );
};

export default EmployeeView;
