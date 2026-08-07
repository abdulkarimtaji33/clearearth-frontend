import React, { useEffect, useRef, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Stack,
  Divider,
  CircularProgress,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import { IconArrowLeft, IconUpload, IconTrash, IconSignature } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Every user manages their own signature here — it is printed beside the company stamp
 * on quotations and purchase orders they prepare, so it must not sit behind the
 * admin-only Company Settings page.
 */
const MySignature = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, loadUser } = useAuth();

  const fileInputRef = useRef(null);
  const [signatureUrl, setSignatureUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Clear scroll-lock / stuck menu backdrops left by MUI Modal when navigating here
  // from the profile menu (same fix as the Change Password page).
  useEffect(() => {
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('padding-right');
  }, []);

  useEffect(() => {
    let active = true;
    apiService
      .getCurrentUser()
      .then((res) => {
        if (!active) return;
        const sig = res?.data?.signature || res?.data?.user?.signature;
        if (sig) setSignatureUrl(apiService.getUploadUrl(sig));
      })
      .catch(() => {
        if (active) setError('Could not load your signature. Refresh the page to try again.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    // Reset so picking the same file again still fires onChange.
    e.target.value = '';
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Signature must be a PNG, JPG or WebP image. A transparent PNG works best.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('Signature image is too large — choose a file under 2 MB.');
      return;
    }

    try {
      setUploading(true);
      setError('');
      const res = await apiService.uploadMySignature(file);
      if (res.success && res.data?.url) {
        setSignatureUrl(res.data.url);
        setSuccess('Signature saved. It will appear on quotations and purchase orders you prepare.');
        setTimeout(() => setSuccess(''), 4000);
        loadUser?.();
      }
    } catch (err) {
      setError(err.message || 'Could not upload your signature. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    try {
      setRemoving(true);
      setError('');
      const res = await apiService.deleteMySignature();
      if (res.success) {
        setSignatureUrl('');
        setSuccess('Signature removed. Your documents will show a blank signing line.');
        setTimeout(() => setSuccess(''), 4000);
        loadUser?.();
      }
    } catch (err) {
      setError(err.message || 'Could not remove your signature. Please try again.');
    } finally {
      setRemoving(false);
    }
  };

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'your account';

  return (
    <PageContainer title="My Signature" description="Your signature, printed on quotations and purchase orders you prepare">
      <Box sx={{ maxWidth: 720, mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4}>
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={18} />}
            onClick={() => navigate(-1)}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>My Signature</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.25}>
              Printed beside the company stamp on documents you prepare
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Box
            sx={{
              px: { xs: 2.5, sm: 3 },
              py: 2,
              borderBottom: '1px solid',
              borderColor: 'divider',
              bgcolor: alpha(theme.palette.primary.main, 0.03),
            }}
          >
            <Typography variant="subtitle1" fontWeight={700}>Signature for {displayName}</Typography>
            <Typography variant="body2" color="text.secondary">
              Only you can change this. It is not shared with other users.
            </Typography>
          </Box>

          <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
            {loading ? (
              <Box display="flex" justifyContent="center" py={4}><CircularProgress size={28} /></Box>
            ) : (
              <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={3}>
                <Box
                  sx={{
                    width: 200,
                    height: 110,
                    borderRadius: 3,
                    border: '2px dashed',
                    borderColor: signatureUrl ? 'primary.main' : 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    // Light backdrop keeps a transparent-PNG signature visible in dark mode.
                    bgcolor: signatureUrl ? '#fff' : alpha(theme.palette.primary.main, 0.04),
                    flexShrink: 0,
                  }}
                >
                  {signatureUrl ? (
                    <Box
                      component="img"
                      src={signatureUrl}
                      alt="Your signature"
                      sx={{ width: '100%', height: '100%', objectFit: 'contain', p: 1 }}
                    />
                  ) : (
                    <Stack alignItems="center" spacing={0.5}>
                      <IconSignature size={30} style={{ opacity: 0.3 }} />
                      <Typography variant="caption" color="text.secondary">No signature yet</Typography>
                    </Stack>
                  )}
                </Box>

                <Box>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleUpload}
                  />
                  <Stack direction="row" spacing={1} mb={1} flexWrap="wrap" useFlexGap>
                    <Button
                      variant="contained"
                      startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <IconUpload size={16} />}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading || removing}
                      sx={{ borderRadius: 2 }}
                    >
                      {uploading ? 'Uploading…' : signatureUrl ? 'Change signature' : 'Upload signature'}
                    </Button>
                    {signatureUrl && (
                      <Button
                        variant="text"
                        color="error"
                        startIcon={removing ? <CircularProgress size={16} /> : <IconTrash size={16} />}
                        onClick={handleRemove}
                        disabled={uploading || removing}
                        sx={{ borderRadius: 2 }}
                      >
                        {removing ? 'Removing…' : 'Remove'}
                      </Button>
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" display="block">
                    PNG, JPG or WebP up to 2 MB. A transparent PNG of a dark-ink signature
                    gives the cleanest result over the stamp.
                  </Typography>
                </Box>
              </Stack>
            )}

            <Divider sx={{ my: 3 }} />
            <Typography variant="caption" color="text.secondary">
              Tip: sign a blank white sheet, photograph it, and remove the background before
              uploading. If you have no signature here, documents fall back to the company
              signature, if one is set.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default MySignature;
