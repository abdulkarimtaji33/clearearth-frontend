import React from 'react';
import PageContainer from '../../../../components/container/PageContainer';
import EmployeeProfileTabs from './shared/EmployeeProfileTabs';

const MyProfile = () => (
  <PageContainer title="My Profile" description="Your employee profile">
    <EmployeeProfileTabs mode="self" />
  </PageContainer>
);

export default MyProfile;
