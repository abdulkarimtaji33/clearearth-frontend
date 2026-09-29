import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, CircularProgress, Button, Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { IconReceipt2 } from '@tabler/icons-react';
import { useNavigate } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MyPayslips = () => {
  const navigate = useNavigate();
  const theme = useTheme();
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

  return (
    <PageContainer title="My Payslips" description="Your payslip history">
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={0.5}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconReceipt2 size={20} />
          </Box>
          <Typography variant="h4" fontWeight={700}>My Payslips</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" ml={6.5} mb={3}>
          {rows.length > 0 ? `${rows.length} payslip${rows.length !== 1 ? 's' : ''}` : 'Your payslip history'}
        </Typography>

        {notSetUp ? (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
            Your HR profile isn&apos;t set up yet — contact your HR administrator to get started.
          </Alert>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>
        ) : null}

        {!notSetUp && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                    {['Period', 'Gross', 'Net', 'Status', 'View'].map((h, i) => (
                      <TableCell key={i} align={i === 1 || i === 2 || i === 4 ? 'right' : 'left'} sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}><CircularProgress size={28} /></TableCell></TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <IconReceipt2 size={40} style={{ opacity: 0.2, marginBottom: 8 }} />
                        <Typography variant="body2" color="text.secondary">No payslips yet</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((p) => (
                      <TableRow key={p.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/erp/hr/payroll/payslips/${p.id}`)}>
                        <TableCell><Typography variant="body2" fontWeight={700}>{p.payrollRun ? `${MONTHS[p.payrollRun.period_month - 1]} ${p.payrollRun.period_year}` : '-'}</Typography></TableCell>
                        <TableCell align="right">{Number(p.gross_salary).toLocaleString()}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>{Number(p.net_salary).toLocaleString()}</TableCell>
                        <TableCell><Chip size="small" label={p.payment_status} color={p.payment_status === 'paid' ? 'success' : 'default'} sx={{ fontWeight: 600, textTransform: 'capitalize' }} /></TableCell>
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Button size="small" onClick={() => navigate(`/erp/hr/payroll/payslips/${p.id}`)} sx={{ borderRadius: 2, fontWeight: 600 }}>View</Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </Box>
    </PageContainer>
  );
};

export default MyPayslips;
