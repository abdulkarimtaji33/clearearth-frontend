import React from 'react';
import { ButtonBase, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router';
import { glDrillDownUrl } from '../../utils/glLink';

/**
 * Renders a report figure as a link into the General Ledger, filtered to the account (and
 * date range) that produced it — so "how is this calculated, and from where" is one click
 * away for every account balance in Trial Balance / Balance Sheet / Income Statement / Cash
 * Flow / Changes in Equity / VAT Report / Chart of Accounts. Falls back to plain text when
 * there's no account to link to (e.g. a computed subtotal row).
 */
const GlAmountLink = ({ accountId, dateFrom, dateTo, children, sx, fontWeight = 600, title }) => {
  const navigate = useNavigate();
  if (accountId == null || accountId === '') {
    return <span style={{ fontFamily: 'monospace' }}>{children}</span>;
  }
  const content = (
    <ButtonBase
      onClick={() => navigate(glDrillDownUrl({ accountId, dateFrom, dateTo }))}
      sx={{
        fontFamily: 'monospace', fontWeight, fontSize: 'inherit', color: 'inherit',
        px: 0.5, borderRadius: 1, '&:hover': { bgcolor: 'action.hover', textDecoration: 'underline' },
        ...sx,
      }}
    >
      {children}
    </ButtonBase>
  );
  return title ? <Tooltip title={title}><span>{content}</span></Tooltip> : content;
};

export default GlAmountLink;
