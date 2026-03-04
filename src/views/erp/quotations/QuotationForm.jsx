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
import apiService from '../../../services/api';

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
  const dealIdFromUrl = searchParams.get('dealId') ? parseInt(searchParams.get('dealId'), 10) : null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deals, setDeals] = useState([]);
  const [users, setUsers] = useState([]);
  const [dropdowns, setDropdowns] = useState({ quotationStatus: [] });
  const [initialValues, setInitialValues] = useState({
    dealId: dealIdFromUrl || null,
    preparedBy: null,
    quotationDate: new Date().toISOString().split('T')[0],
    quotationAmount: '',
    status: 'draft',
    remarks: '',
  });

  const isEdit = Boolean(id);

  const fetchData = useCallback(async () => {
    try {
      const [dealsRes, usersRes, dropdownRes] = await Promise.all([
        apiService.getDeals({ pageSize: 500 }),
        apiService.getUsers({ pageSize: 500 }),
        apiService.getAllDropdowns(),
      ]);
      if (dealsRes.success) setDeals(Array.isArray(dealsRes.data) ? dealsRes.data : []);
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
          status: q.status || 'draft',
          remarks: q.remarks || '',
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load quotation');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    if (isEdit) fetchQuotation();
    else if (dealIdFromUrl) setInitialValues((prev) => ({ ...prev, dealId: dealIdFromUrl }));
  }, [fetchData, isEdit, fetchQuotation, dealIdFromUrl]);

  const handleSubmit = async (values) => {
    try {
      setError('');
      const payload = {
        dealId: values.dealId,
        preparedBy: values.preparedBy,
        quotationDate: values.quotationDate,
        quotationAmount: parseFloat(values.quotationAmount) || 0,
        status: values.status,
        remarks: values.remarks || null,
      };
      if (isEdit) {
        await apiService.updateQuotation(id, payload);
        setSuccess('Quotation updated');
      } else {
        await apiService.createQuotation(payload);
        setSuccess('Quotation created');
      }
      setTimeout(() => navigate('/erp/quotations'), 1500);
    } catch (err) {
      setError(err.message || 'Save failed');
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
    <PageContainer title={isEdit ? 'Edit Quotation' : 'Create Quotation'} description={isEdit ? 'Update quotation' : 'Create new quotation'}>
      <Box>
        <Stack direction="row" alignItems="center" spacing={2} mb={3}>
          <Button startIcon={<IconArrowLeft />} onClick={() => navigate('/erp/quotations')} size="small">
            Back
          </Button>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              {isEdit ? 'Edit Quotation' : 'Create Quotation'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isEdit ? 'Update quotation details' : 'Add a new quotation'}
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
                  <Typography variant="h5" fontWeight={600} mb={3}>Quotation Details</Typography>
                  <Divider sx={{ mb: 3 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Autocomplete
                      fullWidth
                      options={deals}
                      getOptionLabel={(opt) => opt.title || opt.deal_number || ''}
                      value={deals.find((d) => d.id === values.dealId) || null}
                      onChange={(_, v) => setFieldValue('dealId', v?.id || null)}
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

                    <TextField
                      fullWidth
                      select
                      label="Status (Required)"
                      name="status"
                      value={values.status || 'draft'}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      error={touched.status && Boolean(errors.status)}
                      helperText={touched.status && errors.status}
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      SelectProps={{ MenuProps: { PaperProps: { sx: { maxHeight: 300 } } } }}
                    >
                      {(dropdowns.quotationStatus?.length ? dropdowns.quotationStatus : [
                        { id: 1, value: 'draft', display_name: 'Draft' },
                        { id: 2, value: 'sent', display_name: 'Sent' },
                        { id: 3, value: 'approved', display_name: 'Approved' },
                        { id: 4, value: 'rejected', display_name: 'Rejected' },
                      ]).map((s) => (
                        <MenuItem key={s.id} value={s.value}>{s.display_name}</MenuItem>
                      ))}
                    </TextField>

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
                      {isEdit ? 'Update' : 'Create'} Quotation
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
      </Box>
    </PageContainer>
  );
};

export default QuotationForm;
