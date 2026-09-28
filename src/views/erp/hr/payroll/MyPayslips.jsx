import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, Alert, CircularProgress, Button,
} from '@mui/material';
import { useNavigate } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const MyPayslips = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await apiService.getMyPayslips();
      if (res.success) setRows(res.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load payslips');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <PageContainer title="My Payslips" description="Your payslip history">
      <Card sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={2}>My Payslips</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Period</TableCell><TableCell align="right">Gross</TableCell>
                  <TableCell align="right">Net</TableCell><TableCell>Status</TableCell><TableCell align="right">View</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id} hover>
                    <TableCell>{p.payrollRun ? `${MONTHS[p.payrollRun.period_month - 1]} ${p.payrollRun.period_year}` : '-'}</TableCell>
                    <TableCell align="right">{Number(p.gross_salary).toLocaleString()}</TableCell>
                    <TableCell align="right">{Number(p.net_salary).toLocaleString()}</TableCell>
                    <TableCell><Chip size="small" label={p.payment_status} color={p.payment_status === 'paid' ? 'success' : 'default'} /></TableCell>
                    <TableCell align="right"><Button size="small" onClick={() => navigate(`/erp/hr/payroll/payslips/${p.id}`)}>View</Button></TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && <TableRow><TableCell colSpan={5} align="center">No payslips yet</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>
    </PageContainer>
  );
};

export default MyPayslips;
