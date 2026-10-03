import React from 'react';
import { HrPage } from '../components/HrUi';
import EmployeeProfileTabs from './shared/EmployeeProfileTabs';

const MyProfile = () => (
  <HrPage title="My Profile" description="Your employee profile" bare>
    <EmployeeProfileTabs mode="self" />
  </HrPage>
);

export default MyProfile;
