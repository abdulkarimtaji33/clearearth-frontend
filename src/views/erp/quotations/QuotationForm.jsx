import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Autocomplete,
  Divider,
  Stack,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { IconArrowLeft } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';
import ApprovalWorkflowDialogs from '../../../components/erp/ApprovalWorkflowDialogs';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { canChangeRecordStatus, formatStatusLabel } from '../../../utils/recordStatus';

const QUOTABLE_DEAL_STATUSES = ['approved', 'quotation_sent', 'negotiation', 'won'];
const QUOTATION_APPROVAL_ELIGIBLE_STATUSES = ['new', 'sent', 'under_review', 'revised'];

const validationSchema = Yup.object({
  dealId: Yup.number().nullable().required('Deal is required'),
  preparedBy: Yup.number().nullable().required('Prepared by is required'),
  quotationDate: Yup.string().trim().required('Quotation date is required'),
  quotationAmount: Yup.string().trim().required('Quotation amount is required'),
  status: Yup.string().trim().required('Status is required'),
  remarks: Yup.string().trim().nullable(),
});

const QuotationForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const canChangeStatus = canChangeRecordStatus(user, hasPermission, 'quotations.approve');
  const dealIdFromUrl = searchParams.get('dealId') ? parseInt(searchParams.get('dealId'), 10) : null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);
  const [dropdowns, setDropdowns] = useState({ quotationStatus: [] });
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [savedQuotationId, setSavedQuotationId] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState('');
  const [pinConfigured, setPinConfigured] = useState(false);
  const [initialValues, setInitialValues] = useState({
    dealId: dealIdFromUrl || null,
    preparedBy: null,
    quotationDate: new Date().toISOString().split('T')[0],
    quotationAmount: '',
    status: 'new',
    remarks: '',
  });

  const isEdit = Boolean(id);

  const fetchData = useCallback(async () => {
    try {
      const [dealsRes, usersRes, dropdownRes] = await Promise.all([
        apiService.getDeals({ pageSize: 500 }),
        apiService.getAssignees(),
        apiService.getAllDropdowns(),
      ]);
      if (dealsRes.success) {
        const allDeals = Array.isArray(dealsRes.data) ? dealsRes.data : [];
        setDeals(allDeals.filter((d) => QUOTABLE_DEAL_STATUSES.includes(String(d.status || '').toLowerCase())));
      }
      if (usersRes.success) setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.items || []);
      if (dropdownRes.success) setDropdowns({ quotationStatus: dropdownRes.data.quotation_status || [] });
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchQuotation = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiService.getQuotation(id);
      if (res.success) {
        const q = res.data;
        setInitialValues({
          dealId: q.deal_id || null,
          preparedBy: q.prepared_by || null,
          quotationDate: q.quotation_date || new Date().toISOString().split('T')[0],
          quotationAmount: String(q.quotation_amount ?? ''),
          status: q.status || 'new',
          remarks: q.remarks || '',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load quotation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchDealForPreFill = useCallback(async (dealId, onAmount) => {
    if (!dealId) return;
    try {
      const res = await apiService.getDeal(dealId);
      if (res.success && res.data) {
        if (!QUOTABLE_DEAL_STATUSES.includes(String(res.data.status || '').toLowerCase())) {
          setError('This deal must be approved before creating a quotation');
          setInitialValues((prev) => ({ ...prev, dealId: null }));
          return;
        }
        const total = res.data.total != null ? Number(res.data.total).toFixed(2) : '';
        setInitialValues((prev) => ({ ...prev, dealId, quotationAmount: total || prev.quotationAmount }));
        if (onAmount && total) onAmount(total);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      navigate(`/erp/quotations/view/${id}`, { replace: true });
    }
  }, [isEdit, id, navigate]);

  useEffect(() => {
    apiService.getTenant().then((res) => {
      if (res.success) setPinConfigured(Boolean(res.data?.lead_approval_pin_configured));
    }).catch(() => {});
    fetchData();
    if (isEdit) fetchQuotation();
    else if (dealIdFromUrl) {
      setInitialValues((prev) => ({ ...prev, dealId: dealIdFromUrl }));
      fetchDealForPreFill(dealIdFromUrl);
    }
  }, [fetchData, isEdit, fetchQuotation, dealIdFromUrl, fetchDealForPreFill]);

  // New quotations: default Prepared by to the logged-in user
  useEffect(() => {
    if (isEdit || !user?.id) return;
    setInitialValues((prev) => (prev.preparedBy ? prev : { ...prev, preparedBy: user.id }));
  }, [isEdit, user?.id]);

  const handleSubmit = async (values) => {
    try {
      setError('');
      const deal = deals.find((d) => d.id === values.dealId);
      if (!deal) {
        setError('Selected deal must be approved before creating a quotation');
        return;
      }
      const payload = {
        dealId: values.dealId,
        preparedBy: values.preparedBy,
        quotationDate: values.quotationDate,
        quotationAmount: parseFloat(values.quotationAmount) || 0,
        ...(canChangeStatus ? { status: values.status } : {}),
        remarks: values.remarks || null,
      };
      let savedQuotation;
      if (isEdit) {
        const res = await apiService.updateQuotation(id, payload);
        savedQuotation = res.data;
        setSuccess('Service quotation updated');
      } else {
        const res = await apiService.createQuotation(payload);
        savedQuotation = res.data;
        setSuccess('Service quotation created');
      }

      const quotationId = savedQuotation?.id || (isEdit ? Number(id) : null);
      const quotationStatus = String(savedQuotation?.status || payload.status || 'new').toLowerCase();
      if (quotationId && QUOTATION_APPROVAL_ELIGIBLE_STATUSES.includes(quotationStatus)) {
        setSavedQuotationId(quotationId);
        setApprovalDialogOpen(true);
      } else {
        setTimeout(() => navigate('/erp/quotations'), 1500);
      }
    } catch (err) {
      setError(err.message || 'Save failed');
    }
  };

  const finishAndNavigate = () => {
    setApprovalDialogOpen(false);
    setSavedQuotationId(null);
    setApprovalError('');
    navigate('/erp/quotations');
  };

  const handleRequestQuotationApproval = async () => {
    if (!savedQuotationId) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.requestQuotationApproval(savedQuotationId);
      setSuccess('Approval requested. Your manager has been notified.');
      setTimeout(finishAndNavigate, 1200);
    } catch (err) {
      setApprovalError(err.message || 'Failed to request approval');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleApproveQuotationWithPin = async (pin) => {
    if (!savedQuotationId) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.approveQuotationWithPin(savedQuotationId, pin);
      setSuccess('Quotation approved successfully!');
      setTimeout(finishAndNavigate, 1200);
    } catch (err) {
      setApprovalError(err.message || 'Invalid PIN or approval failed');
    } finally {
      setApprovalLoading(false);
    }
  };

  if (isEdit && loading) {
    return (
      <PageContainer>
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={isEdit ? 'Edit Service Quotation' : 'Create Service Quotation'} description={isEdit ? 'Set Approved for service order PDF' : 'After approval, download PDF is a service order'}>
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/quotations')} size="small">
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {isEdit ? 'Edit Service Quotation' : 'Create Service Quotation'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEdit ? 'Set status to Approved to download a service order PDF' : 'Create a quotation; approved records use service order PDF'}
            </Typography>
          </Box>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

        <Formik initialValues={initialValues} validationSchema={validationSchema} enableReinitialize onSubmit={handleSubmit}>
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit, setFieldValue }) => (
            <form onSubmit={handleSubmit}>
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h5" fontWeight={600} mb={3}>Service Quotation Details</Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Autocomplete
                      fullWidth
                      options={deals}
                      getOptionLabel={(opt) => opt.title || opt.deal_number || ''}
                      value={deals.find((d) => d.id === values.dealId) || null}
                      onChange={(_, v) => {
                        setFieldValue('dealId', v?.id || null);
                        if (v?.id) fetchDealForPreFill(v.id, (amount) => setFieldValue('quotationAmount', amount));
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Deal Name (Required)" required error={touched.dealId && Boolean(errors.dealId)} helperText={touched.dealId && errors.dealId} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                      )}
                      isOptionEqualToValue={(a, b) => a?.id === b?.id}
                    />

                    <Autocomplete
                      fullWidth
                      options={users}
                      getOptionLabel={(opt) => `${opt.first_name || ''} ${opt.last_name || ''}`.trim() || opt.email || ''}
                      value={users.find((u) => u.id === values.preparedBy) || null}
                      onChange={(_, v) => setFieldValue('preparedBy', v?.id || null)}
                      renderInput={(params) => (
                        <TextField {...params} label="Prepared By (Required)" required error={touched.preparedBy && Boolean(errors.preparedBy)} helperText={touched.preparedBy && errors.preparedBy} sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                      )}
                      isOptionEqualToValue={(a, b) => a?.id === b?.id}
                    />

                    <TextField
                      fullWidth
                      label="Quotation Date (Required)"
                      name="quotationDate"
                      type="date"
                      value={values.quotationDate}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.quotationDate && Boolean(errors.quotationDate)}
                      helperText={touched.quotationDate && errors.quotationDate}
                      required
                      InputLabelProps={{ shrink: true }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <TextField
                      fullWidth
                      label="Quotation Amount (AED) (Required)"
                      name="quotationAmount"
                      type="number"
                      value={values.quotationAmount}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.quotationAmount && Boolean(errors.quotationAmount)}
                      helperText={touched.quotationAmount && errors.quotationAmount}
                      required
                      placeholder="0.00"
                      InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    {canChangeStatus ? (
                      <TextField
                        fullWidth
                        select
                        label="Status (Required)"
                        name="status"
                        value={values.status || 'new'}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.status && Boolean(errors.status)}
                        helperText={touched.status && errors.status}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 300 } } } }}
                      >
                        {(dropdowns.quotationStatus?.length ? dropdowns.quotationStatus : [
                          { id: 1, value: 'new', display_name: 'New' },
                          { id: 2, value: 'sent', display_name: 'Sent' },
                          { id: 3, value: 'rejected', display_name: 'Rejected' },
                        ])
                          .filter((s) => !['approved', 'pending_approval'].includes(s.value))
                          .map((s) => (
                            <MenuItem key={s.id} value={s.value}>{s.display_name}</MenuItem>
                          ))}
                        {values.status === 'pending_approval' && (
                          <MenuItem value="pending_approval" disabled>Pending Approval</MenuItem>
                        )}
                        {values.status === 'approved' && (
                          <MenuItem value="approved" disabled>Approved</MenuItem>
                        )}
                      </TextField>
                    ) : (
                      <TextField
                        fullWidth
                        label="Status"
                        value={formatStatusLabel(values.status || 'new')}
                        disabled
                        helperText="Status is managed through the approval workflow"
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    )}

                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Remarks (Optional)"
                      name="remarks"
                      value={values.remarks}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />
                  </Box>

                  <Box sx={{ mt: 4, display: 'flex', gap: 2 }}>
                    <Button type="submit" variant="contained" size="large" sx={{ borderRadius: 2 }}>
                      {isEdit ? 'Update' : 'Create'} Service Quotation
                    </Button>
                    <Button variant="outlined" size="large" onClick={() => navigate('/erp/quotations')} sx={{ borderRadius: 2 }}>
                      Cancel
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </form>
          )}
        </Formik>

        <ApprovalWorkflowDialogs
          open={approvalDialogOpen}
          entityLabel="quotation"
          pinConfigured={pinConfigured}
          loading={approvalLoading}
          error={approvalError}
          onClose={() => !approvalLoading && finishAndNavigate()}
          onDecideLater={finishAndNavigate}
          onRequestApproval={handleRequestQuotationApproval}
          onApproveWithPin={handleApproveQuotationWithPin}
          approveButtonLabel="Approve quotation"
        />
      </Box>
    </PageContainer>
  );
};

export default QuotationForm;
