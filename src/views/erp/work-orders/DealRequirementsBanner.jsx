import React from 'react';
import { Alert, Typography } from '@mui/material';

// Keep in sync with TYPE_LABEL in src/views/erp/certificates/CertificateList.jsx
const CERTIFICATE_TYPE_LABEL = {
  green_certificate: 'Green Certificate',
  certificate_of_destruction: 'Certificate of Destruction',
  certificate_of_data_destruction: 'Certificate of Data Destruction',
  carbon_footprint: 'Carbon Footprint Certificate',
  destruction_report_evidence: 'Destruction Report with Evidence',
};

/**
 * Shows a banner summarizing the linked deal's WDS / certificate requirements.
 * Renders nothing when neither requirement is set on the deal.
 */
const DealRequirementsBanner = ({ deal, sx }) => {
  if (!deal) return null;
  const wdsRequired = Boolean(deal.wds_required);
  const certificateRequired = Boolean(deal.certificate_required);
  if (!wdsRequired && !certificateRequired) return null;

  const certTypes = Array.isArray(deal.required_certificate_types) ? deal.required_certificate_types : [];
  const certLabels = certTypes.map((t) => CERTIFICATE_TYPE_LABEL[t] || t);

  return (
    <Alert severity="warning" sx={{ borderRadius: 2, mb: 3, ...sx }}>
      <Typography variant="body2" fontWeight={700} component="span">
        This deal requires:
      </Typography>{' '}
      {wdsRequired && (
        <Typography variant="body2" component="span" sx={{ mr: 1.5 }}>
          WDS
        </Typography>
      )}
      {certificateRequired && (
        <Typography variant="body2" component="span">
          Certificates{certLabels.length > 0 ? `: ${certLabels.join(', ')}` : ' (type not yet specified)'}
        </Typography>
      )}
    </Alert>
  );
};

export default DealRequirementsBanner;
