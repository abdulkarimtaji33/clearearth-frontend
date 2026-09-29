import React from 'react';
import { Box } from '@mui/material';
import PageContainer from '../../../../components/container/PageContainer';
import EmployeeProfileTabs from './shared/EmployeeProfileTabs';

const MyProfile = () => (
  <PageContainer title="My Profile" description="Your employee profile">
    <Box sx={{ maxWidth: 'min(1400px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
      <EmployeeProfileTabs mode="self" />
    </Box>
  </PageContainer>
);

export default MyProfile;
