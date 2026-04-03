import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconFileText, IconTrash, IconUpload } from '@tabler/icons-react';
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

/**
 * Trade license, VAT certificate, bank details — shared by Company (client) and Supplier (vendor) forms.
 */
const OrganizationDocumentationSection = ({ title, values, setFieldValue }) => {
  const [uploadKey, setUploadKey] = useState(null);

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
      <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
        <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={4}>
          Trade license, VAT certificate, and bank details (IBAN letter). Upload supporting documents and enter key details.
        </Typography>
        <Divider sx={{ mb: 4 }} />

        <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: 'text.primary' }}>
          Trade license
        </Typography>
        <DocUploadRow
          label="License document"
          path={values.tradeLicenseFilePath}
          uploading={uploadKey === 'tradeLicenseFilePath'}
          onPick={(f) => runUpload('tradeLicenseFilePath', f)}
          onRemove={() => setFieldValue('tradeLicenseFilePath', '')}
          disabled={!!uploadKey}
        />
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="License number"
              name="tradeLicenseNumber"
              value={values.tradeLicenseNumber || ''}
              onChange={(e) => setFieldValue('tradeLicenseNumber', e.target.value)}
              sx={tfSx}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Name (as on license)"
              name="tradeLicenseName"
              value={values.tradeLicenseName || ''}
              onChange={(e) => setFieldValue('tradeLicenseName', e.target.value)}
              sx={tfSx}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField
              fullWidth
              label="Expiry date"
              name="tradeLicenseExpiryDate"
              type="date"
              value={values.tradeLicenseExpiryDate || ''}
              onChange={(e) => setFieldValue('tradeLicenseExpiryDate', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              sx={tfSx}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          VAT certificate
        </Typography>
        <DocUploadRow
          label="Certificate document"
          path={values.vatCertificateFilePath}
          uploading={uploadKey === 'vatCertificateFilePath'}
          onPick={(f) => runUpload('vatCertificateFilePath', f)}
          onRemove={() => setFieldValue('vatCertificateFilePath', '')}
          disabled={!!uploadKey}
        />
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="TRN number"
              name="vatCertificateTrn"
              value={values.vatCertificateTrn || ''}
              onChange={(e) => setFieldValue('vatCertificateTrn', e.target.value)}
              helperText="As shown on the VAT certificate"
              sx={tfSx}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
          Bank details / IBAN letter
        </Typography>
        <DocUploadRow
          label="Bank letter or IBAN confirmation"
          path={values.bankDetailsFilePath}
          uploading={uploadKey === 'bankDetailsFilePath'}
          onPick={(f) => runUpload('bankDetailsFilePath', f)}
          onRemove={() => setFieldValue('bankDetailsFilePath', '')}
          disabled={!!uploadKey}
        />
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Bank name"
              name="bankName"
              value={values.bankName || ''}
              onChange={(e) => setFieldValue('bankName', e.target.value)}
              sx={tfSx}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="IBAN"
              name="bankIban"
              value={values.bankIban || ''}
              onChange={(e) => setFieldValue('bankIban', e.target.value)}
              sx={tfSx}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default OrganizationDocumentationSection;
