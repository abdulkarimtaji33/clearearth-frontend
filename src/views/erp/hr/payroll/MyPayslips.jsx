import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Alert, Button,
} from '@mui/material';
import { IconReceipt2, IconCashBanknote, IconCalendarDollar, IconChevronRight, IconUserQuestion } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import apiService from '../../../../services/api';
import {
  HrPage, SectionCard, StatTile, StatGrid, StatusChip, EmptyState, LoadingBlock, tableSx, fmtMoney,
} from '../components/HrUi';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const periodOf = (p) => (p.payrollRun ? `${MONTHS[p.payrollRun.period_month - 1]} ${p.payrollRun.period_year}` : '—');

const MyPayslips = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notSetUp, setNotSetUp] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      setNotSetUp(false);
      const res = await apiService.getMyPayslips();
      if (res.success) setRows(res.data || []);
    } catch (err) {
      if (err.status === 404 && /no employee record linked/i.test(err.message || '')) {
        setNotSetUp(true);
      } else {
        setError(err.message || 'Failed to load payslips');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const latest = useMemo(() => {
    const key = (p) => (p.payrollRun ? p.payrollRun.period_year * 12 + p.payrollRun.period_month : -1);
    return rows.reduce((best, p) => (!best || key(p) > key(best) ? p : best), null);
  }, [rows]);
  const totalPaid = useMemo(
    () => rows.filter((p) => p.payment_status === 'paid').reduce((acc, p) => acc + (Number(p.net_salary) || 0), 0),
    [rows],
  );

  const openPayslip = (p) => navigate(`/erp/hr/payroll/payslips/${p.id}`);

  return (
    <HrPage
      title="My Payslips"
      description="Your payslip history"
      subtitle="View and download your monthly salary statements."
    >
      {notSetUp ? (
        <SectionCard>
          <EmptyState
            icon={IconUserQuestion}
            title="Your HR profile isn't set up yet"
            message="Contact your HR administrator to get started. Your payslips will appear here once your employee record is linked."
          />
        </SectionCard>
      ) : (
        <>
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

          <StatGrid min={200} sx={{ mb: 3 }}>
            <StatTile icon={IconReceipt2} label="Payslips" value={rows.length} loading={loading} />
            <StatTile
              icon={IconCalendarDollar}
              label="Latest net pay"
              value={latest ? fmtMoney(latest.net_salary) : '—'}
              hint={latest ? periodOf(latest) : undefined}
              tone="info"
              loading={loading}
            />
            <StatTile icon={IconCashBanknote} label="Total paid to date" value={fmtMoney(totalPaid)} tone="success" loading={loading} />
          </StatGrid>

          <SectionCard icon={IconReceipt2} title="Payslip history" subtitle={rows.length > 0 ? `${rows.length} payslip${rows.length !== 1 ? 's' : ''}` : undefined} noPadding>
            {loading ? (
              <LoadingBlock />
            ) : rows.length === 0 ? (
              <EmptyState icon={IconReceipt2} title="No payslips yet" message="Payslips appear here once payroll for a period is processed." compact />
            ) : (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ ...tableSx, minWidth: 560 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Period</TableCell>
                      <TableCell align="right">Gross</TableCell>
                      <TableCell align="right">Net pay</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right" />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rows.map((p) => (
                      <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => openPayslip(p)}>
                        <TableCell><Typography variant="body2" fontWeight={600} noWrap>{periodOf(p)}</Typography></TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', color: 'text.secondary' }}>{fmtMoney(p.gross_salary)}</TableCell>
                        <TableCell align="right" sx={{ whiteSpace: 'nowrap', fontWeight: 700 }}>{fmtMoney(p.net_salary)}</TableCell>
                        <TableCell><StatusChip status={p.payment_status} /></TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Button size="small" endIcon={<IconChevronRight size={16} />} onClick={() => openPayslip(p)} sx={{ borderRadius: 2, fontWeight: 600 }}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </SectionCard>
        </>
      )}
    </HrPage>
  );
};

export default MyPayslips;
