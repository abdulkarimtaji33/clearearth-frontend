import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography,
  Box, Divider, Table, TableBody, TableCell, TableRow,
} from '@mui/material';
import { useNavigate } from 'react-router';
import { IconExternalLink } from '@tabler/icons-react';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Row = ({ label, value }) => (
  <TableRow>
    <TableCell sx={{ border: 0, py: 0.5, pl: 0, color: 'text.secondary', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>{label}</TableCell>
    <TableCell sx={{ border: 0, py: 0.5, pr: 0, textAlign: 'right', fontWeight: 600 }}>{value}</TableCell>
  </TableRow>
);

const LinkLine = ({ label, onClick }) => (
  <Typography
    variant="body2"
    color="primary.main"
    sx={{ cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
    onClick={onClick}
  >
    {label} <IconExternalLink size={13} />
  </Typography>
);

/**
 * Explains a single clicked figure on the Statement of Account — invoice, receipt, running
 * balance, opening balance, balance due, or an aging bucket — using the `breakdown` payload
 * the backend attaches to every statement row (see receivables.service.getStatementOfAccount).
 */
const AmountBreakdownDialog = ({ open, onClose, kind, data, currency = 'AED' }) => {
  const navigate = useNavigate();
  if (!data) return null;

  const goto = (path) => { onClose(); navigate(path); };

  let title = 'Amount breakdown';
  let body = null;

  if (kind === 'invoice') {
    const b = data;
    title = `Tax invoice ${b.invoiceNumber || ''}`;
    body = (
      <Stack spacing={2}>
        <Table size="small">
          <TableBody>
            <Row label="Invoice date" value={b.invoiceDate || '—'} />
            <Row label="Due date" value={b.dueDate || '—'} />
            <Row label="Prepared by" value={b.preparedBy || '—'} />
          </TableBody>
        </Table>
        <Divider />
        <Table size="small">
          <TableBody>
            <Row label="Subtotal" value={`${currency} ${fmt(b.subtotal)}`} />
            <Row label={`VAT (${fmt(b.vatPercentage)}%)`} value={`${currency} ${fmt(b.vatAmount)}`} />
            <Row label={<strong>Total</strong>} value={`${currency} ${fmt(b.total)}`} />
          </TableBody>
        </Table>
        <Divider />
        <Stack spacing={0.5}>
          <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase', fontSize: '0.68rem' }}>Document chain</Typography>
          {b.chain?.dealNumber && <Typography variant="body2">Deal: {b.chain.dealNumber} — {b.chain.dealTitle}</Typography>}
          {b.chain?.quotationId && <Typography variant="body2">Quotation #{b.chain.quotationId} ({b.chain.quotationDate || '—'})</Typography>}
          {b.chain?.proformaInvoiceNumber && <Typography variant="body2">Proforma: {b.chain.proformaInvoiceNumber}</Typography>}
        </Stack>
        {b.sourceId && <LinkLine label="Open tax invoice" onClick={() => goto(`/erp/tax-invoices/view/${b.sourceId}`)} />}
      </Stack>
    );
  } else if (kind === 'receipt') {
    const b = data;
    title = `Receipt ${b.receiptNumber || ''}`;
    body = (
      <Stack spacing={2}>
        <Table size="small">
          <TableBody>
            <Row label="Amount" value={<strong>{currency} {fmt(b.amount)}</strong>} />
            <Row label="Applied to invoice" value={b.invoiceNumber || '—'} />
            <Row label="Paid on" value={b.paidAt || '—'} />
            <Row label="Method" value={b.paymentMethod || '—'} />
            <Row label="Reference" value={b.referenceNo || '—'} />
            <Row label="Received from" value={b.receivedFrom || '—'} />
            <Row label="Deposited to" value={b.paymentAccount ? `${b.paymentAccount.code} — ${b.paymentAccount.name}` : '—'} />
            <Row label="Recorded by" value={b.recordedBy || '—'} />
          </TableBody>
        </Table>
        <Divider />
        <Stack direction="row" spacing={2} flexWrap="wrap">
          {b.invoiceId && <LinkLine label="Open invoice" onClick={() => goto(`/erp/tax-invoices/view/${b.invoiceId}`)} />}
          {b.journalEntryId && <LinkLine label={`Journal entry ${b.journalEntryNumber || ''}`} onClick={() => goto(`/erp/journal/view/${b.journalEntryId}`)} />}
        </Stack>
      </Stack>
    );
  } else if (kind === 'balance') {
    const b = data;
    title = 'Running balance';
    body = (
      <Stack spacing={1.5}>
        <Table size="small">
          <TableBody>
            <Row label="Balance before" value={`${currency} ${fmt(b.balanceBefore)}`} />
            <Row label="+ Invoice amount" value={`${currency} ${fmt(b.amount)}`} />
            <Row label="− Receipts" value={`${currency} ${fmt(b.receipts)}`} />
            <Row label={<strong>= Balance</strong>} value={<strong>{currency} {fmt(b.balance)}</strong>} />
          </TableBody>
        </Table>
      </Stack>
    );
  } else if (kind === 'opening') {
    const entries = data;
    title = 'Opening balance';
    body = (
      <Stack spacing={1.5}>
        <Typography variant="body2" color="text.secondary">Sum of all invoices and receipts dated before the statement period:</Typography>
        <Table size="small">
          <TableBody>
            {entries.length === 0 ? (
              <TableRow><TableCell sx={{ border: 0, pl: 0 }} colSpan={3}><Typography variant="body2" color="text.secondary">No prior activity</Typography></TableCell></TableRow>
            ) : entries.map((e, i) => (
              <TableRow key={i}>
                <TableCell sx={{ border: 0, py: 0.5, pl: 0, fontSize: '0.8rem', color: 'text.secondary' }}>{e.date}</TableCell>
                <TableCell sx={{ border: 0, py: 0.5, fontSize: '0.8rem' }}>{e.docType}</TableCell>
                <TableCell sx={{ border: 0, py: 0.5, pr: 0, textAlign: 'right', fontWeight: 600 }}>
                  {currency} {fmt((e.amount || 0) - (e.receipts || 0))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Stack>
    );
  } else if (kind === 'balanceDue') {
    const b = data;
    title = 'Balance due';
    body = (
      <Table size="small">
        <TableBody>
          <Row label={`Invoices (${b.invoiceCount})`} value={`${currency} ${fmt(b.invoiceTotal)}`} />
          <Row label={`− Receipts (${b.receiptCount})`} value={`${currency} ${fmt(b.receiptTotal)}`} />
          <Row label={<strong>= Balance due</strong>} value={<strong>{currency} {fmt(b.invoiceTotal - b.receiptTotal)}</strong>} />
        </TableBody>
      </Table>
    );
  } else if (kind === 'aging') {
    const { label, invoices } = data;
    title = `Aging — ${label}`;
    body = (
      <Table size="small">
        <TableBody>
          {(invoices || []).length === 0 ? (
            <TableRow><TableCell sx={{ border: 0, pl: 0 }} colSpan={4}><Typography variant="body2" color="text.secondary">No invoices in this bucket</Typography></TableCell></TableRow>
          ) : invoices.map((inv) => (
            <TableRow key={inv.invoiceId} hover sx={{ cursor: 'pointer' }} onClick={() => goto(`/erp/tax-invoices/view/${inv.invoiceId}`)}>
              <TableCell sx={{ border: 0, py: 0.5, pl: 0 }}>
                <Typography variant="body2" color="primary.main" fontWeight={600}>{inv.invoiceNumber}</Typography>
              </TableCell>
              <TableCell sx={{ border: 0, py: 0.5, fontSize: '0.8rem', color: 'text.secondary' }}>Due {inv.dueDate || '—'}</TableCell>
              <TableCell sx={{ border: 0, py: 0.5, fontSize: '0.8rem', color: 'text.secondary' }}>
                {inv.daysOverdue == null ? '—' : inv.daysOverdue <= 0 ? 'Not yet due' : `${inv.daysOverdue}d overdue`}
              </TableCell>
              <TableCell sx={{ border: 0, py: 0.5, pr: 0, textAlign: 'right', fontWeight: 700 }}>{currency} {fmt(inv.balance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle fontWeight={800} sx={{ pb: 1 }}>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 0.5 }}>{body}</Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AmountBreakdownDialog;
