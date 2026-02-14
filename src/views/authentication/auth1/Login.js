import React from 'react';
import { Link } from 'react-router';
import { Box, Typography, Stack, Card } from '@mui/material';
import { styled, alpha, keyframes } from '@mui/material/styles';

import PageContainer from 'src/components/container/PageContainer';
import AuthLogin from '../authForms/AuthLogin';
import { IconLeaf, IconShieldCheck, IconBolt } from '@tabler/icons-react';

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

const slideUp = keyframes`
  0% { transform: translateY(20px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.6; }
`;

// Main container
const LoginContainer = styled(Box)(({ theme }) => ({
  height: '100vh',
  width: '100vw',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#0a0f1e',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    width: '600px',
    height: '600px',
    background: `radial-gradient(circle, ${alpha('#10b981', 0.12)} 0%, transparent 70%)`,
    top: '-100px',
    left: '-100px',
    filter: 'blur(80px)',
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    width: '600px',
    height: '600px',
    background: `radial-gradient(circle, ${alpha('#06b6d4', 0.12)} 0%, transparent 70%)`,
    bottom: '-100px',
    right: '-100px',
    filter: 'blur(80px)',
  },
}));

// Grid pattern overlay
const GridOverlay = styled(Box)({
  position: 'absolute',
  inset: 0,
  backgroundImage: `linear-gradient(${alpha('#10b981', 0.03)} 1px, transparent 1px),
                    linear-gradient(90deg, ${alpha('#10b981', 0.03)} 1px, transparent 1px)`,
  backgroundSize: '50px 50px',
  opacity: 0.5,
});

// Glass card
const GlassCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    ${alpha('#ffffff', 0.09)} 0%, 
    ${alpha('#ffffff', 0.04)} 100%)`,
  backdropFilter: 'blur(40px) saturate(180%)',
  WebkitBackdropFilter: 'blur(40px) saturate(180%)',
  borderRadius: '24px',
  border: `1px solid ${alpha('#ffffff', 0.18)}`,
  boxShadow: `
    0 20px 60px ${alpha('#000', 0.5)},
    inset 0 1px 0 ${alpha('#ffffff', 0.1)}
  `,
  padding: theme.spacing(3.5, 4),
  width: '100%',
  maxWidth: '440px',
  maxHeight: '90vh',
  overflowY: 'auto',
  position: 'relative',
  zIndex: 10,
  animation: `${slideUp} 0.5s ease-out`,
  margin: theme.spacing(2),
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: alpha('#fff', 0.05),
    borderRadius: '3px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: alpha('#10b981', 0.3),
    borderRadius: '3px',
    '&:hover': {
      background: alpha('#10b981', 0.5),
    },
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: `linear-gradient(90deg, 
      transparent,
      #10b981,
      #06b6d4,
      transparent)`,
    backgroundSize: '200% 100%',
    animation: `${shimmer} 3s ease infinite`,
  },
}));

const LogoBox = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '10px',
  marginBottom: '20px',
});

const LogoIcon = styled(Box)({
  width: '44px',
  height: '44px',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: `0 6px 16px ${alpha('#10b981', 0.35)}`,
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: -2,
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #10b981, #06b6d4)',
    filter: 'blur(6px)',
    opacity: 0.4,
    zIndex: -1,
  },
});

const FeatureBadge = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(0.75),
  padding: theme.spacing(0.75, 1.5),
  background: alpha('#10b981', 0.1),
  borderRadius: '100px',
  border: `1px solid ${alpha('#10b981', 0.2)}`,
  marginBottom: theme.spacing(2),
  justifyContent: 'center',
}));

const Login = () => (
  <PageContainer title="Login" description="Clear Earth ERP Login">
    <LoginContainer>
      <GridOverlay />
      
      <GlassCard>
        {/* Logo */}
        <LogoBox>
          <LogoIcon>
            <IconLeaf size={24} color="white" strokeWidth={2.5} />
          </LogoIcon>
          <Box>
            <Typography
              sx={{
                fontSize: '1.4rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                lineHeight: 1,
                letterSpacing: '-0.5px',
              }}
            >
              Clear Earth
            </Typography>
            <Typography
              sx={{
                fontSize: '0.6rem',
                fontWeight: 600,
                color: alpha('#fff', 0.5),
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginTop: '2px',
              }}
            >
              ERP System
            </Typography>
          </Box>
        </LogoBox>

        {/* Feature Badge */}
        <FeatureBadge>
          <IconBolt size={14} color="#10b981" />
          <Typography
            sx={{
              color: '#10b981',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: '0.3px',
            }}
          >
            Waste Management & Recycling
          </Typography>
        </FeatureBadge>

        {/* Title */}
        <Box sx={{ mb: 2, textAlign: 'center' }}>
          <Typography
            variant="h3"
            sx={{
              color: 'white',
              fontWeight: 700,
              mb: 0.5,
              fontSize: '1.75rem',
              letterSpacing: '-0.5px',
            }}
          >
            Welcome Back
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: alpha('#fff', 0.65),
              fontSize: '0.875rem',
            }}
          >
            Sign in to access your dashboard
          </Typography>
        </Box>

        {/* Login Form */}
        <AuthLogin
          title=""
          subtext={null}
          subtitle={
            <Stack direction="row" spacing={1} mt={2.5} justifyContent="center" flexWrap="wrap">
              <Typography
                sx={{
                  color: alpha('#fff', 0.6),
                  fontSize: '0.82rem',
                }}
              >
                New to Clear Earth?
              </Typography>
              <Typography
                component={Link}
                to="/auth/register"
                sx={{
                  textDecoration: 'none',
                  color: '#10b981',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Create account
              </Typography>
            </Stack>
          }
        />

        {/* Footer */}
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          justifyContent="center"
          sx={{
            mt: 2.5,
            pt: 2,
            borderTop: `1px solid ${alpha('#fff', 0.08)}`,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconShieldCheck size={12} color={alpha('#fff', 0.4)} />
            <Typography
              variant="caption"
              sx={{
                color: alpha('#fff', 0.4),
                fontSize: '0.7rem',
              }}
            >
              Secure
            </Typography>
          </Box>
          <Typography
            variant="caption"
            sx={{
              color: alpha('#fff', 0.3),
              fontSize: '0.7rem',
            }}
          >
            •
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: alpha('#fff', 0.4),
              fontSize: '0.7rem',
            }}
          >
            © 2024 Clear Earth
          </Typography>
        </Stack>
      </GlassCard>
    </LoginContainer>
  </PageContainer>
);

export default Login;
