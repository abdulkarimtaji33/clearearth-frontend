import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Card, Typography, Button, Stack, Alert, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Divider, TextField,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import { IconArrowLeft, IconWallet } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import apiService from '../../../services/api';
import { extractListData } from '../../../utils/reportApi';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Accounts Receivable → Unapplied Credits: customers with an advance/unapplied receipt
 * balance (recorded from Receive Payment when the amount received exceeded what was
 * allocated to invoices). Lets a user apply that credit to the customer's current
 * outstanding invoices.
 */
const UnappliedCreditsView = () => {
  const navigate = useNavigate();
  const theme = useTheme();

  const [credits, setCredits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [applyingId, setApplyingId] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [allocations, setAllocations] = useState({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getUnappliedCredits();
      if (res.success) setCredits(Array.isArray(res.data) ? res.data : extractListData(res));
      else setError(res.message || 'Failed to load unapplied credits');
    } catch (e) {
      setError(e.message || 'Failed to load unapplied credits');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const startApply = async (credit) => {
    setSuccess('');
    setError('');
    setApplyingId(credit.paymentTransactionId);
    setAllocations({});
    try {
      setInvoicesLoading(true);
      const res = await apiService.getReceivables({ companyId: credit.companyId, pageSize: 200 });
      const rows = Array.isArray(res.data) ? res.data : extractListData(res);
      setInvoices(rows);
    } catch (e) {
      setError(e.message || 'Failed to load outstanding invoices for this customer');
    } finally {
      setInvoicesLoading(false);
    }
  };

  const cancelApply = () => {
    setApplyingId(null);
    setInvoices([]);
    setAllocations({});
  };

  const setAllocation = (invoiceId, value) => {
    setAllocations((prev) => ({ ...prev, [invoiceId]: value }));
  };

  const totalAllocated = Object.values(allocations).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const activeCredit = credits.find((c) => c.paymentTransactionId === applyingId);
  const remainingAfter = activeCredit ? activeCredit.unappliedAmount - totalAllocated : 0;

  const submitApply = async () => {
    if (!activeCredit) return;
    const allocationList = Object.entries(allocations)
      .map(([taxInvoiceId, amount]) => ({ taxInvoiceId: parseInt(taxInvoiceId, 10), amount: parseFloat(amount) }))
      .filter((a) => Number.isFinite(a.amount) && a.amount > 0);
    if (allocationList.length === 0) { setError('Apply the credit to at least one invoice.'); return; }
    if (totalAllocated - activeCredit.unappliedAmount > 0.01) {
      setError(`Allocated total (AED ${fmt(totalAllocated)}) cannot exceed the available credit (AED ${fmt(activeCredit.unappliedAmount)}).`);
      return;
    }

    try {
      setSaving(true);
      setError('');
      const res = await apiService.applyUnappliedCredit(activeCredit.paymentTransactionId, allocationList);
      if (res.success) {
        setSuccess(`Credit applied to ${allocationList.length} invoice(s).`);
        cancelApply();
        await load();
      }
    } catch (e) {
      setError(e.message || 'Failed to apply credit');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer title="Unapplied Credits" description="Customer advance receipts not yet applied to an invoice">
      <Stack direction="row" alignItems="center" spacing={2} mb={3}>
        <Button startIcon={<IconArrowLeft size={18} />} variant="outlined" onClick={() => navigate('/erp/receivables')} sx={{ borderRadius: 2 }}>
          Back
        </Button>
        <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: alpha(theme.palette.info.main, 0.15), color: 'info.dark', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconWallet size={22} />
        </Box>
        <Typography variant="h4" fontWeight={800}>Unapplied Credits</Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden', mb: 2.5 }}>
        {loading ? (
          <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
        ) : credits.length === 0 ? (
          <Box sx={{ py: 6, textAlign: 'center' }}>
            <Typography color="text.secondary">No customers currently have an unapplied credit balance</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Receipt #</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Unapplied balance</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 160 }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {credits.map((c) => (
                  <TableRow key={c.paymentTransactionId} hover selected={applyingId === c.paymentTransactionId}>
                    <TableCell>{c.companyName || '—'}</TableCell>
                    <TableCell>{c.receiptNumber || '—'}</TableCell>
                    <TableCell>{c.paidAt || '—'}</TableCell>
                    <TableCell align="right">AED {fmt(c.unappliedAmount)}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="outlined" onClick={() => startApply(c)} sx={{ borderRadius: 2 }}>
                        Apply to invoice(s)
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      {applyingId && activeCredit && (
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', bgcolor: alpha(theme.palette.background.default, 0.6) }}>
            <Typography variant="subtitle2" fontWeight={800}>
              Apply AED {fmt(activeCredit.unappliedAmount)} credit — {activeCredit.companyName}
            </Typography>
            <Button size="small" onClick={cancelApply} sx={{ borderRadius: 2 }}>Cancel</Button>
          </Stack>
          {invoicesLoading ? (
            <Box sx={{ py: 6, textAlign: 'center' }}><CircularProgress /></Box>
          ) : invoices.length === 0 ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">No outstanding invoices for this customer</Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Invoice #</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Due date</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Balance due</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, width: 160 }}>Apply amount</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => {
                    const bal = parseFloat(inv.balance_due) || 0;
                    return (
                      <TableRow key={inv.id} hover>
                        <TableCell>{inv.tax_invoice_number}</TableCell>
                        <TableCell>{inv.due_date || '—'}</TableCell>
                        <TableCell align="right">{inv.currency || 'AED'} {fmt(bal)}</TableCell>
                        <TableCell align="right">
                          <TextField
                            size="small"
                            type="number"
                            inputProps={{ min: 0, max: bal, step: '0.01', style: { textAlign: 'right' } }}
                            value={allocations[inv.id] ?? ''}
                            onChange={(e) => setAllocation(inv.id, e.target.value)}
                            sx={{ width: 140 }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          {invoices.length > 0 && (
            <>
              <Divider />
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 2.5, py: 1.75 }}>
                <Typography variant="body2" color="text.secondary">
                  Allocated: <strong>AED {fmt(totalAllocated)}</strong> · Remaining credit after: <strong>AED {fmt(Math.max(0, remainingAfter))}</strong>
                </Typography>
                <Button variant="contained" color="info" onClick={submitApply} disabled={saving} sx={{ borderRadius: 2 }}>
                  {saving ? <CircularProgress size={20} /> : 'Apply credit'}
                </Button>
              </Stack>
            </>
          )}
        </Card>
      )}
    </PageContainer>
  );
};

export default UnappliedCreditsView;
