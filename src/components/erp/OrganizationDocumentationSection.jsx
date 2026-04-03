import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconChevronDown, IconChevronUp, IconFileText, IconTrash, IconUpload } from '@tabler/icons-react';
import apiService from '../../services/api';

const tfSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

const DocUploadRow = ({ label, path, uploading, onPick, onRemove, disabled }) => {
  const theme = useTheme();
  const url = path ? apiService.getUploadUrl(path) : null;
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: alpha(theme.palette.primary.main, 0.02),
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1.5 }}>
        {label}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          variant="outlined"
          size="small"
          component="label"
          startIcon={<IconUpload size={16} />}
          disabled={disabled || uploading}
          sx={{ borderRadius: 2 }}
        >
          {uploading ? 'Uploading…' : path ? 'Replace file' : 'Upload file'}
          <input
            type="file"
            hidden
            accept="application/pdf,image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPick(f);
              e.target.value = '';
            }}
          />
        </Button>
        {path && (
          <>
            <Button size="small" href={url} target="_blank" rel="noopener noreferrer" startIcon={<IconFileText size={16} />} sx={{ borderRadius: 2 }}>
              View
            </Button>
            <Button size="small" color="error" variant="text" startIcon={<IconTrash size={16} />} onClick={onRemove} sx={{ borderRadius: 2 }}>
              Remove
            </Button>
          </>
        )}
      </Stack>
      <Typography variant="caption" color="text.secondary" display="block" mt={1}>
        PDF or image (max 10MB)
      </Typography>
    </Box>
  );
};

const SubSection = ({ title, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  const theme = useTheme();
  return (
    <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden', mb: 2 }}>
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.5,
          cursor: 'pointer',
          bgcolor: open ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
          transition: 'background 0.15s',
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
        {open ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 2.5, pt: 2, pb: 2.5 }}>
          {children}
        </Box>
      </Collapse>
    </Box>
  );
};

const OrganizationDocumentationSection = ({ title, values, setFieldValue }) => {
  const [open, setOpen] = useState(false);
  const [uploadKey, setUploadKey] = useState(null);
  const theme = useTheme();

  const hasAnyDoc = !!(
    values.tradeLicenseFilePath || values.tradeLicenseNumber || values.tradeLicenseName || values.tradeLicenseExpiryDate ||
    values.vatCertificateFilePath || values.vatCertificateTrn ||
    values.bankDetailsFilePath || values.bankName || values.bankIban
  );

  const runUpload = async (field, file) => {
    setUploadKey(field);
    try {
      const res = await apiService.uploadCompanyDocument(file);
      if (res.success && res.data?.path) setFieldValue(field, res.data.path);
    } catch (e) {
      console.error(e);
    } finally {
      setUploadKey(null);
    }
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
      <Box
        onClick={() => setOpen((v) => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: { xs: 3, sm: 4, md: 5 },
          py: 2.5,
          cursor: 'pointer',
          borderRadius: open ? '12px 12px 0 0' : 3,
          bgcolor: open ? alpha(theme.palette.primary.main, 0.03) : 'transparent',
          transition: 'background 0.15s',
          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.05) },
        }}
      >
        <Box>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Typography variant="h4" fontWeight={700} color="primary.main">{title}</Typography>
            {hasAnyDoc && (
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main' }} title="Has data" />
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary" mt={0.25}>
            Trade license, VAT certificate, bank details
          </Typography>
        </Box>
        <Box sx={{ color: 'text.secondary', flexShrink: 0 }}>
          {open ? <IconChevronUp size={22} /> : <IconChevronDown size={22} />}
        </Box>
      </Box>

      <Collapse in={open}>
        <CardContent sx={{ px: { xs: 3, sm: 4, md: 5 }, pt: 0, pb: { xs: 3, sm: 4, md: 5 }, '&:last-child': { pb: { xs: 3, sm: 4, md: 5 } } }}>
          <SubSection title="Trade license" defaultOpen={!!(values.tradeLicenseFilePath || values.tradeLicenseNumber)}>
            <DocUploadRow
              label="License document"
              path={values.tradeLicenseFilePath}
              uploading={uploadKey === 'tradeLicenseFilePath'}
              onPick={(f) => runUpload('tradeLicenseFilePath', f)}
              onRemove={() => setFieldValue('tradeLicenseFilePath', '')}
              disabled={!!uploadKey}
            />
            <Grid container spacing={2.5} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="License number" name="tradeLicenseNumber" value={values.tradeLicenseNumber || ''} onChange={(e) => setFieldValue('tradeLicenseNumber', e.target.value)} sx={tfSx} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Name (as on license)" name="tradeLicenseName" value={values.tradeLicenseName || ''} onChange={(e) => setFieldValue('tradeLicenseName', e.target.value)} sx={tfSx} />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField fullWidth label="Expiry date" name="tradeLicenseExpiryDate" type="date" value={values.tradeLicenseExpiryDate || ''} onChange={(e) => setFieldValue('tradeLicenseExpiryDate', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} sx={tfSx} />
              </Grid>
            </Grid>
          </SubSection>

          <SubSection title="VAT certificate" defaultOpen={!!(values.vatCertificateFilePath || values.vatCertificateTrn)}>
            <DocUploadRow
              label="Certificate document"
              path={values.vatCertificateFilePath}
              uploading={uploadKey === 'vatCertificateFilePath'}
              onPick={(f) => runUpload('vatCertificateFilePath', f)}
              onRemove={() => setFieldValue('vatCertificateFilePath', '')}
              disabled={!!uploadKey}
            />
            <Grid container spacing={2.5} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="TRN number" name="vatCertificateTrn" value={values.vatCertificateTrn || ''} onChange={(e) => setFieldValue('vatCertificateTrn', e.target.value)} helperText="As shown on the VAT certificate" sx={tfSx} />
              </Grid>
            </Grid>
          </SubSection>

          <SubSection title="Bank details / IBAN letter" defaultOpen={!!(values.bankDetailsFilePath || values.bankName || values.bankIban)}>
            <DocUploadRow
              label="Bank letter or IBAN confirmation"
              path={values.bankDetailsFilePath}
              uploading={uploadKey === 'bankDetailsFilePath'}
              onPick={(f) => runUpload('bankDetailsFilePath', f)}
              onRemove={() => setFieldValue('bankDetailsFilePath', '')}
              disabled={!!uploadKey}
            />
            <Grid container spacing={2.5} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="Bank name" name="bankName" value={values.bankName || ''} onChange={(e) => setFieldValue('bankName', e.target.value)} sx={tfSx} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField fullWidth label="IBAN" name="bankIban" value={values.bankIban || ''} onChange={(e) => setFieldValue('bankIban', e.target.value)} sx={tfSx} />
              </Grid>
            </Grid>
          </SubSection>
        </CardContent>
      </Collapse>
    </Card>
  );
};

export default OrganizationDocumentationSection;
