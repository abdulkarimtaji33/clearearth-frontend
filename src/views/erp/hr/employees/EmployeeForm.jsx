import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Card, Typography, Button, TextField, MenuItem, Alert, CircularProgress,
  Stack, Grid, Tabs, Tab, Divider, Checkbox, FormControlLabel,
  Autocomplete, RadioGroup, Radio, FormLabel,
} from '@mui/material';
import { useNavigate, useParams } from 'react-router';
import PageContainer from '../../../../components/container/PageContainer';
import apiService from '../../../../services/api';

const EMPTY = {
  firstName: '', lastName: '', email: '', phone: '', departmentId: '', designationId: '',
  managerId: '', employmentType: 'full_time', dateOfJoining: '', gender: '', dateOfBirth: '',
  nationality: '', nationalId: '', passportNumber: '', address: '',
  emergencyContactName: '', emergencyContactPhone: '', bankName: '', bankAccountNumber: '', bankIban: '', notes: '',
};

const EmployeeForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [tab, setTab] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [salary, setSalary] = useState({ basicSalary: '', housingAllowance: '', transportAllowance: '', otherAllowance: '', commissionEligible: false, paymentMethod: 'bank_transfer', effectiveFrom: new Date().toISOString().slice(0, 10) });
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Login mode for a NEW employee: 'none' (no login), 'new' (create a fresh login account),
  // 'existing' (link this employee record to an already-existing user login).
  const [loginMode, setLoginMode] = useState('none');
  const [loginRoleId, setLoginRoleId] = useState('');
  const [roles, setRoles] = useState([]);
  const [unlinkedUsers, setUnlinkedUsers] = useState([]);
  const [selectedExistingUser, setSelectedExistingUser] = useState(null);

  const load = useCallback(async () => {
    try {
      const [deptRes, empRes, rolesRes, usersRes] = await Promise.all([
        apiService.getHrDepartments({ pageSize: 200 }),
        apiService.getHrEmployees({ pageSize: 200 }),
        apiService.getRoles({ pageSize: 200 }),
        isEdit ? Promise.resolve(null) : apiService.getUsers({ pageSize: 200, unlinked: true }),
      ]);
      if (deptRes.success) setDepartments(deptRes.data || []);
      if (empRes.success) setEmployees(empRes.data || []);
      if (rolesRes.success) setRoles(rolesRes.data || []);
      if (usersRes && usersRes.success) setUnlinkedUsers(usersRes.data || []);

      if (isEdit) {
        const res = await apiService.getHrEmployee(id);
        if (res.success) {
          const e = res.data;
          setForm({
            firstName: e.first_name || '', lastName: e.last_name || '', email: e.email || '', phone: e.phone || '',
            departmentId: e.department_id || '', designationId: e.designation_id || '', managerId: e.manager_id || '',
            employmentType: e.employment_type || 'full_time', dateOfJoining: e.date_of_joining || '',
            gender: e.gender || '', dateOfBirth: e.date_of_birth || '', nationality: e.nationality || '',
            nationalId: e.national_id || '', passportNumber: e.passport_number || '', address: e.address || '',
            emergencyContactName: e.emergency_contact_name || '', emergencyContactPhone: e.emergency_contact_phone || '',
            bankName: e.bank_name || '', bankAccountNumber: e.bank_account_number || '', bankIban: e.bank_iban || '', notes: e.notes || '',
          });
        }
        const salRes = await apiService.getHrSalaryStructureHistory(id);
        if (salRes.success && salRes.data?.length) {
          const active = salRes.data.find((s) => s.is_active) || salRes.data[0];
          setSalary({
            basicSalary: active.basic_salary, housingAllowance: active.housing_allowance, transportAllowance: active.transport_allowance,
            otherAllowance: active.other_allowance, commissionEligible: !!active.commission_eligible, paymentMethod: active.payment_method,
            effectiveFrom: active.effective_from,
          });
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [id, isEdit]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      let employeeId = id;
      const payload = { ...form };
      Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null; });

      if (isEdit) {
        await apiService.updateHrEmployee(id, payload);
      } else {
        if (loginMode === 'new') {
          if (!payload.email || !loginRoleId) {
            throw new Error('Email and role are required to create a login account');
          }
          payload.createLoginAccount = true;
          payload.roleId = loginRoleId;
        } else if (loginMode === 'existing') {
          if (!selectedExistingUser) {
            throw new Error('Select a user to link to this employee');
          }
          payload.existingUserId = selectedExistingUser.id;
        }
        const res = await apiService.createHrEmployee(payload);
        employeeId = res.data?.id;
      }

      if (employeeId && salary.basicSalary) {
        await apiService.setHrSalaryStructure(employeeId, {
          basicSalary: parseFloat(salary.basicSalary),
          housingAllowance: parseFloat(salary.housingAllowance) || 0,
          transportAllowance: parseFloat(salary.transportAllowance) || 0,
          otherAllowance: parseFloat(salary.otherAllowance) || 0,
          commissionEligible: salary.commissionEligible,
          paymentMethod: salary.paymentMethod,
          effectiveFrom: salary.effectiveFrom,
        });
      }

      setSuccess('Employee saved successfully');
      setTimeout(() => navigate('/erp/hr/employees'), 800);
    } catch (err) {
      setError(err.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" py={12}><CircularProgress /></Box>;

  return (
    <PageContainer title={isEdit ? 'Edit Employee' : 'New Employee'} description="Employee form">
      <Card sx={{ p: 3, maxWidth: 900 }}>
        <Typography variant="h5" fontWeight={700} mb={2}>{isEdit ? 'Edit Employee' : 'New Employee'}</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 2 }}>
          <Tab label="Profile" />
          <Tab label="Salary Structure" />
        </Tabs>
        <form onSubmit={handleSubmit}>
          {tab === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="First Name" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Last Name" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth label="Department" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                  <MenuItem value="">None</MenuItem>
                  {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth label="Manager" value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}>
                  <MenuItem value="">None</MenuItem>
                  {employees.filter((e) => String(e.id) !== id).map((e) => <MenuItem key={e.id} value={e.id}>{e.first_name} {e.last_name}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth label="Employment Type" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
                  {['full_time', 'part_time', 'contract', 'intern'].map((t) => <MenuItem key={t} value={t}>{t.replace('_', ' ')}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Date of Joining" required InputLabelProps={{ shrink: true }} value={form.dateOfJoining} onChange={(e) => setForm({ ...form, dateOfJoining: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}>
                <TextField select fullWidth label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                  <MenuItem value="">-</MenuItem>
                  {['male', 'female', 'other'].map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth type="date" label="Date of Birth" InputLabelProps={{ shrink: true }} value={form.dateOfBirth || ''} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Nationality" value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Bank Name" value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Bank Account Number" value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="IBAN" value={form.bankIban} onChange={(e) => setForm({ ...form, bankIban: e.target.value })} /></Grid>
              <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Grid>

              {!isEdit && (
                <>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <FormLabel component="legend" sx={{ mb: 1 }}>Login access</FormLabel>
                    <RadioGroup
                      row
                      value={loginMode}
                      onChange={(e) => { setLoginMode(e.target.value); setSelectedExistingUser(null); }}
                    >
                      <FormControlLabel value="none" control={<Radio />} label="No login" />
                      <FormControlLabel value="new" control={<Radio />} label="Create new login" />
                      <FormControlLabel value="existing" control={<Radio />} label="Link existing user" />
                    </RadioGroup>
                  </Grid>

                  {loginMode === 'new' && (
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select fullWidth required label="Role" value={loginRoleId}
                        onChange={(e) => setLoginRoleId(e.target.value)}
                        helperText="A temporary password will be generated for this login"
                      >
                        {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.display_name || r.name}</MenuItem>)}
                      </TextField>
                    </Grid>
                  )}

                  {loginMode === 'existing' && (
                    <Grid item xs={12} sm={6}>
                      <Autocomplete
                        fullWidth
                        options={unlinkedUsers}
                        getOptionLabel={(opt) =>
                          typeof opt === 'object'
                            ? `${opt.first_name || ''} ${opt.last_name || ''}`.trim() + (opt.email ? ` (${opt.email})` : '')
                            : ''
                        }
                        value={selectedExistingUser}
                        onChange={(_, val) => {
                          setSelectedExistingUser(val);
                          if (val) {
                            setForm((f) => ({
                              ...f,
                              email: f.email || val.email || '',
                              phone: f.phone || val.phone || '',
                            }));
                          }
                        }}
                        isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Existing user"
                            placeholder="Search users with no employee record yet..."
                            helperText="Only users not already linked to an employee are shown"
                          />
                        )}
                      />
                    </Grid>
                  )}
                </>
              )}
            </Grid>
          )}
          {tab === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}><Typography variant="body2" color="text.secondary">Setting a new salary structure closes any prior active one automatically.</Typography></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Basic Salary" type="number" required value={salary.basicSalary} onChange={(e) => setSalary({ ...salary, basicSalary: e.target.value })} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Housing Allowance" type="number" value={salary.housingAllowance} onChange={(e) => setSalary({ ...salary, housingAllowance: e.target.value })} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Transport Allowance" type="number" value={salary.transportAllowance} onChange={(e) => setSalary({ ...salary, transportAllowance: e.target.value })} /></Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth label="Other Allowance" type="number" value={salary.otherAllowance} onChange={(e) => setSalary({ ...salary, otherAllowance: e.target.value })} /></Grid>
              <Grid item xs={12} sm={4}>
                <TextField select fullWidth label="Payment Method" value={salary.paymentMethod} onChange={(e) => setSalary({ ...salary, paymentMethod: e.target.value })}>
                  {['bank_transfer', 'cash', 'cheque'].map((m) => <MenuItem key={m} value={m}>{m.replace('_', ' ')}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}><TextField fullWidth type="date" label="Effective From" InputLabelProps={{ shrink: true }} value={salary.effectiveFrom} onChange={(e) => setSalary({ ...salary, effectiveFrom: e.target.value })} /></Grid>
              <Grid item xs={12}>
                <FormControlLabel control={<Checkbox checked={salary.commissionEligible} onChange={(e) => setSalary({ ...salary, commissionEligible: e.target.checked })} />} label="Commission eligible" />
              </Grid>
            </Grid>
          )}
          <Divider sx={{ my: 3 }} />
          <Stack direction="row" spacing={2}>
            <Button type="submit" variant="contained" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
            <Button onClick={() => navigate('/erp/hr/employees')}>Cancel</Button>
          </Stack>
        </form>
      </Card>
    </PageContainer>
  );
};

export default EmployeeForm;
