import React from 'react';
import { Box, Stack, Typography, Button, Link, TextField } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { IconId, IconPlane, IconLicense, IconIdBadge2, IconPaperclip } from '@tabler/icons-react';
import apiService from '../../../../../services/api';
import {
  SectionCard, ExpiryChip, expiryInfo, inputSx, fmtDate,
} from '../../components/HrUi';

/**
 * The 4 identity documents. `type` = document-type name used by the documents API,
 * `number|issue|expiry` = keys of the employee record fields (see employeeSections.js).
 * Number/dates are saved to BOTH the employee record and the uploaded-document row,
 * so there is one place to see and edit everything about an ID.
 */
export const IDENTITY_DOCS = [
  { type: 'Passport', icon: IconPlane, number: 'passportNumber', issue: 'passportIssueDate', expiry: 'passportExpiryDate', col: { number: 'passport_number', issue: 'passport_issue_date', expiry: 'passport_expiry_date' } },
  { type: 'Emirates ID', icon: IconId, number: 'emiratesIdNumber', issue: 'emiratesIdIssueDate', expiry: 'emiratesIdExpiryDate', col: { number: 'emirates_id_number', issue: 'emirates_id_issue_date', expiry: 'emirates_id_expiry_date' } },
  { type: 'UAE Visa', icon: IconLicense, number: 'visaNumber', issue: 'visaIssueDate', expiry: 'visaExpiryDate', col: { number: 'visa_number', issue: 'visa_issue_date', expiry: 'visa_expiry_date' } },
  { type: 'Labour Card', icon: IconIdBadge2, number: 'labourCardNo', issue: 'labourCardIssueDate', expiry: 'labourCardExpiryDate', col: { number: 'labour_card_no', issue: 'labour_card_issue_date', expiry: 'labour_card_expiry_date' } },
];

/** Front / back scan links (or "No scan"). */
const ScanLinks = ({ row }) => {
  const links = [['Front', row?.file_path], ['Back', row?.file_path_back]].filter(([, p]) => !!p);
  if (!links.length) return <Typography variant="body2" color="text.disabled">No scan</Typography>;
  return (
    <Stack direction="row" spacing={1.25}>
      {links.map(([label, path]) => (
        <Link key={label} href={apiService.getUploadUrl(path)} target="_blank" rel="noopener noreferrer" underline="hover" variant="body2" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, fontWeight: 600 }}>
          <IconPaperclip size={14} /> {label}
        </Link>
      ))}
    </Stack>
  );
};

const ymd = (v) => (v ? String(v).slice(0, 10) : '');

export const findDocRow = (def, docTypes, docs) => {
  const t = docTypes.find((x) => (x.name || '').toLowerCase() === def.type.toLowerCase());
  return { typeId: t?.id || null, row: t ? docs.find((d) => d.document_type_id === t.id) || null : null };
};

/** Number/dates shown for an ID: employee record first, uploaded-document row as fallback. */
export const currentIdentity = (def, employee, row) => ({
  number: employee[def.col.number] || row?.document_number || '',
  issue: ymd(employee[def.col.issue] || row?.issue_date),
  expiry: ymd(employee[def.col.expiry] || row?.expiry_date),
});

const IdentityDocumentsSection = ({
  id, employee, editing, values, onChange, files, onFile, docTypes, docs,
}) => (
  <SectionCard
    id={id}
    icon={IconId}
    title="ID documents"
    subtitle="Number, dates and scanned copy — all in one place"
    sx={{ scrollMarginTop: 90 }}
  >
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 2 }}>
        {IDENTITY_DOCS.map((def) => {
          const { row } = findDocRow(def, docTypes, docs);
          const cur = currentIdentity(def, employee, row);
          const Icon = def.icon;
          const info = expiryInfo(cur.expiry);
          const accent = cur.number || cur.expiry || row ? (info.tone === 'default' ? 'primary' : info.tone) : null;
          const file = files[def.type];
          const fileBack = files[`${def.type}:back`];
          return (
            <Box
              key={def.type}
              sx={{
                border: '1px solid', borderColor: 'divider', borderRadius: 2.5, p: 2,
                ...(!(cur.number || cur.expiry || row) && !editing && { borderStyle: 'dashed', bgcolor: (t) => alpha(t.palette.text.primary, 0.015) }),
              }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" mb={editing ? 2 : 1}>
                <Box sx={{
                  width: 40, height: 40, borderRadius: 2, display: 'grid', placeItems: 'center', flexShrink: 0,
                  bgcolor: (t) => (accent ? alpha(t.palette[accent].main, 0.12) : alpha(t.palette.text.primary, 0.05)),
                  color: accent ? `${accent}.main` : 'text.disabled',
                }}
                >
                  <Icon size={20} />
                </Box>
                <Box flex={1} minWidth={0}>
                  <Typography variant="subtitle2" fontWeight={700}>{def.type}</Typography>
                  {!editing && (
                    <Typography variant="body2" noWrap color={cur.number ? 'text.primary' : 'text.disabled'} sx={{ fontFamily: cur.number ? 'monospace' : undefined }}>
                      {cur.number || 'Not recorded'}
                    </Typography>
                  )}
                </Box>
                {!editing && cur.expiry && <ExpiryChip expiry={cur.expiry} />}
              </Stack>

              {editing ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <TextField
                    fullWidth label="Number" value={values[def.number] ?? ''} sx={{ ...inputSx, gridColumn: '1 / -1' }}
                    onChange={(e) => onChange(def.number, e.target.value)}
                  />
                  {['issue', 'expiry'].map((k) => (
                    <DatePicker
                      key={k}
                      label={k === 'issue' ? 'Issue date' : 'Expiry date'}
                      value={values[def[k]] ? dayjs(values[def[k]]) : null}
                      onChange={(nv) => onChange(def[k], nv && nv.isValid() ? nv.format('YYYY-MM-DD') : '')}
                      slotProps={{ textField: { fullWidth: true, sx: inputSx } }}
                    />
                  ))}
                  <Box sx={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1.5 }}>
                    {[['front', 'Front side', row?.file_path, file], ['back', 'Back side', row?.file_path_back, fileBack]].map(([side, label, existing, picked]) => (
                      <Box key={side}>
                        <Button
                          fullWidth variant="outlined" component="label" color="inherit"
                          startIcon={<IconPaperclip size={16} />}
                          sx={{ borderRadius: 2, borderStyle: 'dashed', justifyContent: 'flex-start', textTransform: 'none' }}
                        >
                          <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {picked ? picked.name : `${existing ? 'Replace' : 'Attach'} ${label.toLowerCase()}`}
                          </Box>
                          <input type="file" hidden accept="image/*,application/pdf" onChange={(e) => onFile(def.type, e.target.files?.[0] || null, side)} />
                        </Button>
                        {existing && !picked && (
                          <Link href={apiService.getUploadUrl(existing)} target="_blank" rel="noopener noreferrer" variant="caption" sx={{ ml: 0.5 }}>
                            View current {label.toLowerCase()}
                          </Link>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Box>
              ) : (
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" useFlexGap gap={1}>
                  <Typography variant="caption" color="text.secondary">
                    {cur.issue ? `Issued ${fmtDate(cur.issue)}` : 'Issue date —'}
                    {' · '}
                    {cur.expiry ? `Expires ${fmtDate(cur.expiry)}` : 'No expiry date'}
                  </Typography>
                  <ScanLinks row={row} />
                </Stack>
              )}
            </Box>
          );
        })}
      </Box>
    </LocalizationProvider>
  </SectionCard>
);

/** View-mode: all 4 IDs as one compact table (number, dates, status, scan) for the details card. */
export const IdentityCompactRows = ({ employee, docTypes, docs }) => (
  <Box sx={{ overflowX: 'auto' }}>
    <Box sx={{ minWidth: 640 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: '130px 1.4fr 1fr 1fr 110px 130px', columnGap: 2, pb: 0.5 }}>
        {['Document', 'Number', 'Issued', 'Expires', 'Status', 'Scan'].map((h) => (
          <Typography key={h} variant="caption" color="text.secondary" fontWeight={700}>{h}</Typography>
        ))}
      </Box>
      {IDENTITY_DOCS.map((def) => {
        const { row } = findDocRow(def, docTypes, docs);
        const cur = currentIdentity(def, employee, row);
        const Icon = def.icon;
        return (
          <Box
            key={def.type}
            sx={{ display: 'grid', gridTemplateColumns: '130px 1.4fr 1fr 1fr 110px 130px', columnGap: 2, py: 0.9, alignItems: 'center', borderTop: '1px dotted', borderColor: 'divider' }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Icon size={16} />
              <Typography variant="body2" fontWeight={700}>{def.type}</Typography>
            </Stack>
            <Typography variant="body2" sx={{ fontFamily: cur.number ? 'monospace' : undefined }} color={cur.number ? 'text.primary' : 'text.disabled'}>{cur.number || '—'}</Typography>
            <Typography variant="body2" color={cur.issue ? 'text.primary' : 'text.disabled'}>{cur.issue ? fmtDate(cur.issue) : '—'}</Typography>
            <Typography variant="body2" color={cur.expiry ? 'text.primary' : 'text.disabled'}>{cur.expiry ? fmtDate(cur.expiry) : '—'}</Typography>
            <Box>{cur.expiry ? <ExpiryChip expiry={cur.expiry} /> : <Typography variant="body2" color="text.disabled">—</Typography>}</Box>
            <ScanLinks row={row} />
          </Box>
        );
      })}
    </Box>
  </Box>
);

export default IdentityDocumentsSection;
