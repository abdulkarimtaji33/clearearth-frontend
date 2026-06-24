import { styled, Container, Box } from '@mui/material';
import { CustomizerContext } from 'src/context/CustomizerContext';
import { useContext } from 'react';
import { Outlet } from 'react-router';
import Header from './vertical/header/Header';
import HorizontalHeader from '../full/horizontal/header/Header';
import Sidebar from './vertical/sidebar/Sidebar';
import Customizer from './shared/customizer/Customizer';
import Navigation from './horizontal/navbar/Navbar';
import ScrollToTop from '../../components/shared/ScrollToTop';
import LoadingBar from '../../LoadingBar';
import RealtimeNotificationToast from '../../components/notifications/RealtimeNotificationToast';


const MainWrapper = styled('div')(() => ({
  display: 'flex',
  minHeight: '100vh',
  width: '100%',
}));

const PageWrapper = styled('div')(() => ({
  display: 'flex',
  flexGrow: 1,
  paddingBottom: '60px',
  flexDirection: 'column',
  zIndex: 1,
  width: '100%',
  backgroundColor: 'transparent',
}));

const FullLayout = () => {
  const { activeLayout, isLayout, activeMode } = useContext(CustomizerContext);

  return (
    <>
      <LoadingBar />
      <RealtimeNotificationToast />
      <MainWrapper
        className={activeMode === 'dark' ? 'darkbg mainwrapper' : 'mainwrapper'}
      >
        {/* ------------------------------------------- */}
        {/* Sidebar */}
        {/* ------------------------------------------- */}
        {activeLayout === 'horizontal' ? '' : <Sidebar />}
        {/* ------------------------------------------- */}
        {/* Main Wrapper */}
        {/* ------------------------------------------- */}
        <PageWrapper
          className="page-wrapper"
          sx={{
            flexGrow: 1,
            minWidth: 0,
            width: 'auto',
          }}
        >
          {/* ------------------------------------------- */}
          {/* Header */}
          {/* ------------------------------------------- */}
          {activeLayout === 'horizontal' ? <HorizontalHeader /> : <Header />}
          {/* ------------------------------------------- */}
          {/* PageContent */}
          {/* ------------------------------------------- */}
          {activeLayout === 'horizontal' ? <Navigation /> : ''}
          <Container
            maxWidth={false}
            sx={{
              pt: { xs: '20px', sm: '24px', md: '30px' },
              px: { xs: 1.5, sm: 2, md: 3 },
              width: '100%',
              maxWidth: isLayout === 'boxed' ? 'min(4000px, 90vw)' : 'min(5000px, 96vw)',
            }}
          >
            {/* ------------------------------------------- */}
            {/* Page Route */}
            {/* ------------------------------------------- */}
            <Box sx={{ minHeight: 'calc(100vh - 170px)' }}>
              <ScrollToTop>
                <Outlet />
              </ScrollToTop>
            </Box>
            {/* ------------------------------------------- */}
            {/* End Page */}
            {/* ------------------------------------------- */}
          </Container>
          <Customizer />
        </PageWrapper>
      </MainWrapper>
    </>

  );
};

export default FullLayout;
