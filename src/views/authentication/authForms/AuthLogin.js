import React, { useState } from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
  Alert,
  TextField,
  Checkbox,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Link, useNavigate } from 'react-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { styled, alpha } from '@mui/material/styles';
import { IconMail, IconLock, IconEye, IconEyeOff } from '@tabler/icons-react';

import { useAuth } from '../../../context/AuthContext';

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

// Glassmorphic styled TextField
const GlassTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    background: alpha(theme.palette.background.paper, 0.1),
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: `1px solid ${alpha('#fff', 0.18)}`,
    color: '#fff',
    fontSize: '0.95rem',
    transition: 'all 0.3s ease',
    '& fieldset': {
      border: 'none',
    },
    '&:hover': {
      background: alpha(theme.palette.background.paper, 0.15),
      border: `1px solid ${alpha('#fff', 0.25)}`,
    },
    '&.Mui-focused': {
      background: alpha(theme.palette.background.paper, 0.2),
      border: `1px solid ${alpha('#4ade80', 0.5)}`,
      boxShadow: `0 0 0 3px ${alpha('#4ade80', 0.1)}`,
    },
    '&.Mui-error': {
      border: `1px solid ${alpha(theme.palette.error.main, 0.5)}`,
    },
  },
  '& .MuiInputLabel-root': {
    color: alpha('#fff', 0.7),
    fontSize: '0.95rem',
    '&.Mui-focused': {
      color: '#4ade80',
    },
  },
  '& .MuiInputBase-input': {
    color: '#fff',
    padding: '12px 14px',
    '&::placeholder': {
      color: alpha('#fff', 0.5),
      opacity: 1,
    },
  },
  '& .MuiFormHelperText-root': {
    color: alpha('#fff', 0.7),
    marginLeft: 0,
    marginTop: '6px',
  },
  '& .MuiInputAdornment-root svg': {
    color: alpha('#fff', 0.6),
  },
}));

const GlassButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)',
  borderRadius: '12px',
  padding: '12px 24px',
  fontSize: '0.95rem',
  fontWeight: 600,
  textTransform: 'none',
  color: '#fff',
  border: 'none',
  boxShadow: `0 8px 20px ${alpha('#4ade80', 0.35)}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)',
    transform: 'translateY(-2px)',
    boxShadow: `0 12px 28px ${alpha('#4ade80', 0.45)}`,
  },
  '&:active': {
    transform: 'translateY(0)',
  },
  '&:disabled': {
    background: alpha('#fff', 0.1),
    color: alpha('#fff', 0.4),
    boxShadow: 'none',
  },
}));

const GlassCheckbox = styled(Checkbox)(({ theme }) => ({
  color: alpha('#fff', 0.6),
  '&.Mui-checked': {
    color: '#4ade80',
  },
  '&:hover': {
    background: alpha('#fff', 0.05),
  },
}));

const AuthLogin = ({ title, subtitle, subtext }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      await login({
        email: values.email,
        password: values.password,
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {title ? (
        <Typography fontWeight="700" variant="h3" mb={1} sx={{ color: '#fff' }}>
          {title}
        </Typography>
      ) : null}

      {subtext}

      <Formik
        initialValues={{
          email: '',
          password: '',
          rememberDevice: true,
        }}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
          <form onSubmit={handleSubmit}>
            {error && (
              <Alert
                severity="error"
                sx={{
                  mb: 2,
                  background: alpha('#ef4444', 0.15),
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${alpha('#ef4444', 0.3)}`,
                  borderRadius: '12px',
                  color: '#fca5a5',
                  '& .MuiAlert-icon': {
                    color: '#fca5a5',
                  },
                }}
              >
                {error}
              </Alert>
            )}

            <Stack spacing={2} mt={2.5}>
              <Box>
                <GlassTextField
                  id="email"
                  name="email"
                  label="Email Address"
                  type="email"
                  variant="outlined"
                  fullWidth
                  value={values.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.email && Boolean(errors.email)}
                  helperText={touched.email && errors.email}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconMail size={20} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Box>
                <GlassTextField
                  id="password"
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  variant="outlined"
                  fullWidth
                  value={values.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.password && Boolean(errors.password)}
                  helperText={touched.password && errors.password}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <IconLock size={20} />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                          sx={{ color: alpha('#fff', 0.6) }}
                        >
                          {showPassword ? <IconEyeOff size={20} /> : <IconEye size={20} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Stack justifyContent="space-between" direction="row" alignItems="center">
                <FormGroup>
                  <FormControlLabel
                    control={
                      <GlassCheckbox
                        checked={values.rememberDevice}
                        onChange={handleChange}
                        name="rememberDevice"
                      />
                    }
                    label={
                      <Typography sx={{ color: alpha('#fff', 0.85), fontSize: '0.85rem' }}>
                        Remember me
                      </Typography>
                    }
                  />
                </FormGroup>
                <Typography
                  component={Link}
                  to="/auth/forgot-password"
                  sx={{
                    textDecoration: 'none',
                    color: '#4ade80',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  Forgot Password?
                </Typography>
              </Stack>
            </Stack>
            <Box mt={3}>
              <GlassButton
                variant="contained"
                size="large"
                fullWidth
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing In...' : 'Sign In'}
              </GlassButton>
            </Box>
          </form>
        )}
      </Formik>
      {subtitle}
    </>
  );
};

export default AuthLogin;
