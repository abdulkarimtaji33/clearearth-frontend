import React, { useState } from 'react';
import {
  Box, Typography, Stack, TextField, Button, Checkbox,
  FormControlLabel, InputAdornment, IconButton, Alert, Divider,
} from '@mui/material';
import { alpha, keyframes } from '@mui/material/styles';
import { Link, useNavigate } from 'react-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import {
  IconMail, IconLock, IconEye, IconEyeOff,
  IconLeaf, IconRecycle, IconWorld,
} from '@tabler/icons-react';
import { useAuth } from '../../../context/AuthContext';

const TENANT_LOGO = 'https://i.ibb.co/rfFyXrmZ/IMG-6578.png';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px) rotate(0deg); }
  33%       { transform: translateY(-12px) rotate(2deg); }
  66%       { transform: translateY(-6px) rotate(-1deg); }
`;

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const BRAND_GREEN = '#10b981';
const BRAND_TEAL  = '#06b6d4';
const BRAND_DARK  = '#0a1628';

const ClearEarthLogo = () => (
  <Box
    component="img"
    src={TENANT_LOGO}
    alt="Clear Earth"
    sx={{ height: 52, maxWidth: 200, objectFit: 'contain' }}
  />
);

const FEATURES = [
  { icon: IconRecycle, label: 'Waste Management', desc: 'End-to-end tracking of waste streams and recycling operations' },
  { icon: IconLeaf,    label: 'Sustainability',   desc: 'Monitor environmental impact and compliance reporting' },
  { icon: IconWorld,   label: 'Global Operations', desc: 'Manage clients, vendors, and work orders across regions' },
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setLoginError('');
      await login({ email: values.email, password: values.password });
      navigate('/');
    } catch (err) {
      setLoginError(err.message || 'Invalid email or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>

      {/* ── Left panel (brand) ── */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: '0 0 48%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          p: 6,
          background: `linear-gradient(145deg, ${BRAND_DARK} 0%, #0d2137 60%, #0a2e1f 100%)`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient blobs */}
        <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <Box sx={{ position: 'absolute', width: 480, height: 480, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(BRAND_GREEN, 0.18)} 0%, transparent 70%)`, top: -120, left: -120, filter: 'blur(60px)' }} />
          <Box sx={{ position: 'absolute', width: 360, height: 360, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(BRAND_TEAL, 0.15)} 0%, transparent 70%)`, bottom: -80, right: -80, filter: 'blur(60px)' }} />
          {/* Subtle grid */}
          <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${alpha('#fff', 0.025)} 1px, transparent 1px), linear-gradient(90deg, ${alpha('#fff', 0.025)} 1px, transparent 1px)`, backgroundSize: '48px 48px' }} />
        </Box>

        {/* Logo */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <ClearEarthLogo />
        </Box>

        {/* Centre content */}
        <Box sx={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', py: 4 }}>
          {/* Floating icon */}
          <Box
            sx={{
              width: 72, height: 72, borderRadius: 4,
              background: `linear-gradient(135deg, ${BRAND_GREEN}, ${BRAND_TEAL})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mb: 3, boxShadow: `0 16px 40px ${alpha(BRAND_GREEN, 0.35)}`,
              animation: `${float} 5s ease-in-out infinite`,
            }}
          >
            <IconLeaf size={34} color="#fff" />
          </Box>

          <Typography variant="h2" fontWeight={800} sx={{ color: '#fff', lineHeight: 1.15, mb: 2, fontSize: { md: '2rem', lg: '2.5rem' } }}>
            Smarter waste.<br />
            <Box component="span" sx={{ background: `linear-gradient(90deg, ${BRAND_GREEN}, ${BRAND_TEAL})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Greener future.
            </Box>
          </Typography>

          <Typography sx={{ color: alpha('#fff', 0.6), fontSize: '0.95rem', lineHeight: 1.7, mb: 4, maxWidth: 380 }}>
            The all-in-one ERP platform built for waste management and recycling companies.
          </Typography>

          <Stack spacing={2}>
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <Stack key={label} direction="row" spacing={2} alignItems="flex-start">
                <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(BRAND_GREEN, 0.15), border: `1px solid ${alpha(BRAND_GREEN, 0.25)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                  <Icon size={18} color={BRAND_GREEN} />
                </Box>
                <Box>
                  <Typography sx={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3 }}>{label}</Typography>
                  <Typography sx={{ color: alpha('#fff', 0.5), fontSize: '0.78rem', lineHeight: 1.5 }}>{desc}</Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Box>

        {/* Bottom tagline */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Typography sx={{ color: alpha('#fff', 0.35), fontSize: '0.75rem' }}>
            © {new Date().getFullYear()} Clear Earth. All rights reserved.
          </Typography>
        </Box>
      </Box>

      {/* ── Right panel (form) ── */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 3, sm: 5 },
          bgcolor: '#fff',
          position: 'relative',
        }}
      >

        <Box
          sx={{
            width: '100%',
            maxWidth: 420,
            animation: `${fadeIn} 0.45s ease-out`,
          }}
        >
          {/* Logo + Heading */}
          <Box mb={4}>
            <Box mb={2.5} sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center' }}>
              <Box
                component="img"
                src={TENANT_LOGO}
                alt="Clear Earth"
                sx={{ height: 48, maxWidth: 180, objectFit: 'contain' }}
              />
            </Box>
            <Typography variant="h3" fontWeight={800} color="text.primary" mb={0.75} sx={{ fontSize: '1.85rem', letterSpacing: '-0.5px' }}>
              Welcome back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to your Clear Earth account
            </Typography>
          </Box>

          {/* Form */}
          <Formik
            initialValues={{ email: '', password: '', rememberMe: true }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, errors, touched, handleChange, handleBlur, handleSubmit: formikSubmit, isSubmitting }) => (
              <form onSubmit={formikSubmit} noValidate>
                <Stack spacing={2.5}>
                  {loginError && (
                    <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setLoginError('')}>
                      {loginError}
                    </Alert>
                  )}

                  <TextField
                    fullWidth
                    id="email"
                    name="email"
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.email && Boolean(errors.email)}
                    helperText={touched.email && errors.email}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconMail size={18} style={{ color: alpha('#000', 0.35) }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <TextField
                    fullWidth
                    id="password"
                    name="password"
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={values.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.password && Boolean(errors.password)}
                    helperText={touched.password && errors.password}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <IconLock size={18} style={{ color: alpha('#000', 0.35) }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(v => !v)} edge="end" size="small" tabIndex={-1}>
                            {showPassword ? <IconEyeOff size={18} /> : <IconEye size={18} />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <FormControlLabel
                      control={
                        <Checkbox
                          name="rememberMe"
                          checked={values.rememberMe}
                          onChange={handleChange}
                          size="small"
                          sx={{ '&.Mui-checked': { color: BRAND_GREEN } }}
                        />
                      }
                      label={<Typography variant="body2" color="text.secondary">Remember me</Typography>}
                    />
                    <Typography
                      component={Link}
                      to="/auth/forgot-password"
                      variant="body2"
                      sx={{ color: BRAND_GREEN, textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
                    >
                      Forgot password?
                    </Typography>
                  </Stack>

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isSubmitting}
                    sx={{
                      borderRadius: 2.5,
                      py: 1.5,
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      background: `linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_TEAL} 100%)`,
                      boxShadow: `0 8px 24px ${alpha(BRAND_GREEN, 0.3)}`,
                      '&:hover': {
                        background: `linear-gradient(135deg, #0ea571 0%, #0599b0 100%)`,
                        boxShadow: `0 10px 28px ${alpha(BRAND_GREEN, 0.4)}`,
                        transform: 'translateY(-1px)',
                      },
                      '&:active': { transform: 'translateY(0)' },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {isSubmitting ? 'Signing in…' : 'Sign in'}
                  </Button>
                </Stack>
              </form>
            )}
          </Formik>

          <Divider sx={{ my: 3 }}>
            <Typography variant="caption" color="text.disabled" sx={{ px: 1 }}>
              Clear Earth ERP
            </Typography>
          </Divider>

          <Typography variant="caption" color="text.disabled" align="center" display="block">
            Having trouble? Contact your system administrator.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;
