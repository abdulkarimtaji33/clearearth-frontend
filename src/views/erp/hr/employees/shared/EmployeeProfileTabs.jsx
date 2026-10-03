import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Box, Typography, Stack, Alert, AlertTitle } from '@mui/material';
import {
  IconLayoutDashboard, IconUser, IconBriefcase, IconFiles, IconSchool, IconDeviceLaptop, IconTimeline,
  IconPhoneCall, IconMapPin, IconHome, IconUsers, IconUserHeart, IconBuildingBank, IconCertificate,
  IconBulb, IconBuildingSkyscraper, IconId, IconCalendarTime, IconCash, IconShieldCheck, IconAlertTriangle,
  IconUserCircle,
} from '@tabler/icons-react';
import { useSearchParams } from 'react-router';
import apiService from '../../../../../services/api';
import EntityListEditor from './EntityListEditor';
import ChangeRequestSection from './ChangeRequestSection';
import ProfileHeader from './profile/ProfileHeader';
import CompensationSection, { compTotal } from './profile/CompensationSection';
import DocumentsTab from './profile/DocumentsTab';
import AssetsTab from './profile/AssetsTab';
import { HistoryTimeline, NotesSection } from './profile/ActivityTab';
import {
  SectionCard, DetailGrid, DetailItem, StatTile, StatGrid, PersonCell, ExpiryChip, EmptyState, LoadingBlock,
  expiryInfo, fmtDate, fmtMoney, fullName, humanize, tenureOf,
} from '../../components/HrUi';

const TABS = [
  { key: 'overview', label: 'Overview', icon: IconLayoutDashboard },
  { key: 'personal', label: 'Personal', icon: IconUser },
  { key: 'employment', label: 'Employment', icon: IconBriefcase },
  { key: 'documents', label: 'Documents', icon: IconFiles },
  { key: 'qualifications', label: 'Qualifications', icon: IconSchool },
  { key: 'assets', label: 'Assets', icon: IconDeviceLaptop },
  { key: 'activity', label: 'Activity', icon: IconTimeline },
];

const IDENTITY_FIELDS = [
  { label: 'Passport', number: 'passport_number', expiry: 'passport_expiry_date' },
  { label: 'Emirates ID', number: 'emirates_id_number', expiry: 'emirates_id_expiry_date' },
  { label: 'UAE Visa', number: 'visa_number', expiry: 'visa_expiry_date' },
  { label: 'Labour Card', number: 'labour_card_no', expiry: 'labour_card_expiry_date' },
];

const twoCol = { display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5, alignItems: 'start' };
const mainAside = { display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.75fr) minmax(0, 1fr)' }, gap: 2.5, alignItems: 'start' };

// ---------------------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------------------

const OverviewTab = ({ employee, packageTotal, showPackage }) => {
  const identity = IDENTITY_FIELDS.map((d) => ({ ...d, info: expiryInfo(employee[d.expiry]) }));
  const expired = identity.filter((d) => d.info.state === 'expired').length;
  const expiring = identity.filter((d) => d.info.state === 'expiring').length;
  const valid = identity.filter((d) => d.info.state === 'valid').length;
  const docTone = expired ? 'error' : expiring ? 'warning' : valid === identity.length ? 'success' : 'info';
  const managerName = fullName(employee.manager);
  const location = [employee.current_address_city, employee.current_address_country].filter(Boolean).join(', ');

  return (
    <Stack spacing={2.5}>
      <StatGrid min={210}>
        <StatTile
          icon={IconCalendarTime} tone="primary" label="Tenure"
          value={tenureOf(employee.date_of_joining) || '—'}
          hint={employee.date_of_joining ? `Since ${fmtDate(employee.date_of_joining)}` : 'Joining date not set'}
        />
        <StatTile
          icon={IconBriefcase} tone="secondary" label="Employment type"
          value={humanize(employee.employment_type) || '—'}
          hint={employee.workLocation?.name || undefined}
        />
        {showPackage && (
          <StatTile icon={IconCash} tone="success" label="Monthly package" value={packageTotal ? fmtMoney(packageTotal) : '—'} hint={packageTotal ? undefined : 'No active salary'} />
        )}
        <StatTile
          icon={IconShieldCheck} tone={docTone} label="Identity documents"
          value={`${valid}/${identity.length} valid`}
          hint={expired ? `${expired} expired` : expiring ? `${expiring} expiring soon` : undefined}
        />
      </StatGrid>

      <Box sx={mainAside}>
        <Stack spacing={2.5}>
          <SectionCard icon={IconBriefcase} title="Employment">
            <DetailGrid min={180}>
              <DetailItem label="Employee code" value={employee.employee_code} />
              <DetailItem label="Designation" value={employee.designation?.display_name} />
              <DetailItem label="Department" value={employee.department?.name} />
              <DetailItem label="Work location" value={employee.workLocation?.name} />
              <DetailItem label="Employment type" value={humanize(employee.employment_type)} />
              <DetailItem label="Joining date" value={fmtDate(employee.date_of_joining)} />
              <DetailItem label="Probation ends" value={fmtDate(employee.probation_end)} />
              <DetailItem label="Confirmed on" value={fmtDate(employee.confirmation_date)} />
            </DetailGrid>
          </SectionCard>
          <SectionCard icon={IconPhoneCall} title="Contact">
            <DetailGrid min={200}>
              <DetailItem label="Work email" value={employee.work_email || employee.email} />
              <DetailItem label="Personal email" value={employee.personal_email} />
              <DetailItem label="Mobile" value={employee.personal_phone || employee.phone} />
              <DetailItem label="Work phone" value={employee.work_phone} />
              <DetailItem label="Lives in" value={location} />
            </DetailGrid>
          </SectionCard>
        </Stack>

        <Stack spacing={2.5}>
          <SectionCard icon={IconUsers} title="Reporting line">
            {employee.manager ? (
              <PersonCell
                person={employee.manager}
                src={employee.manager.profile_photo ? apiService.getUploadUrl(employee.manager.profile_photo) : undefined}
                secondary={employee.manager.employee_code || 'Manager'}
                size={40}
              />
            ) : (
              <Typography variant="body2" color="text.disabled">No reporting manager assigned</Typography>
            )}
            {managerName && (
              <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
                {fullName(employee)} reports directly to {managerName}.
              </Typography>
            )}
          </SectionCard>
          <SectionCard icon={IconId} title="Identity documents" subtitle="From the employee record">
            <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
              {identity.map((d) => (
                <Stack key={d.label} direction="row" justifyContent="space-between" alignItems="center" spacing={1.5} py={1.1}>
                  <Box minWidth={0}>
                    <Typography variant="body2" fontWeight={600}>{d.label}</Typography>
                    <Typography variant="caption" color={employee[d.number] ? 'text.secondary' : 'text.disabled'} noWrap component="div">
                      {employee[d.number] || 'Number not recorded'}
                      {employee[d.expiry] ? ` · ${fmtDate(employee[d.expiry])}` : ''}
                    </Typography>
                  </Box>
                  <ExpiryChip expiry={employee[d.expiry]} />
                </Stack>
              ))}
            </Stack>
          </SectionCard>
          <SectionCard icon={IconUserCircle} title="About">
            <DetailGrid min={130} gap={2}>
              <DetailItem label="Date of birth" value={fmtDate(employee.date_of_birth)} />
              <DetailItem label="Gender" value={humanize(employee.gender)} />
              <DetailItem label="Nationality" value={employee.nationality} />
              <DetailItem label="Marital status" value={humanize(employee.marital_status)} />
            </DetailGrid>
          </SectionCard>
        </Stack>
      </Box>
    </Stack>
  );
};

// ---------------------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------------------

/**
 * Shared employee profile used by both:
 *  - the self-service "My Profile" hub (mode="self", base=/hr/employees/me)
 *  - the HR-facing employee page (mode="hr", base=/hr/employees/:employeeId, plus HR notes)
 * `headerActions` renders next to the Documents menu (e.g. the HR Edit button).
 */
const EmployeeProfileTabs = ({ mode = 'self', employeeId, headerActions }) => {
  const isSelf = mode === 'self';
  const base = isSelf ? '/hr/employees/me' : `/hr/employees/${employeeId}`;
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab = TABS.some((t) => t.key === tabParam) ? tabParam : 'overview';

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [salaryHistory, setSalaryHistory] = useState(null); // self mode: { salaryVisible, history }
  const [hrSalaryHistory, setHrSalaryHistory] = useState([]); // hr mode: array
  const [hrSalaryLoaded, setHrSalaryLoaded] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [downloading, setDownloading] = useState('');
  const [downloadError, setDownloadError] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading((prev) => prev || !employee);
      setError('');
      const empRes = isSelf ? await apiService.getMyEmployeeRecord() : await apiService.getHrEmployee(employeeId);
      if (empRes.success) setEmployee(empRes.data);
      if (isSelf) {
        const reqRes = await apiService.listMyChangeRequests();
        if (reqRes.success) setPendingRequests(reqRes.data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load employee record');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSelf, employeeId]);

  useEffect(() => { load(); }, [load]);

  const refreshHrSalaryHistory = useCallback(() => {
    if (isSelf) return Promise.resolve();
    return apiService.getHrSalaryStructureHistory(employeeId)
      .then((res) => { if (res.success) setHrSalaryHistory(res.data || []); })
      .catch(() => {})
      .finally(() => setHrSalaryLoaded(true));
  }, [isSelf, employeeId]);

  // HR mode: salary history drives the overview package tile, the compensation section and
  // whether the salary certificate / slip generators are offered — load it up front.
  useEffect(() => { refreshHrSalaryHistory(); }, [refreshHrSalaryHistory]);

  // Lazy per-tab data.
  useEffect(() => {
    if (!employee) return;
    if (tab === 'employment' && isSelf && !salaryHistory && employee.salaryVisible !== false) {
      apiService.getMySalaryHistory().then((res) => { if (res.success) setSalaryHistory(res.data); }).catch(() => setSalaryHistory({ history: [] }));
    }
    if (tab === 'activity' && !historyLoaded) {
      const call = isSelf ? apiService.getMyEmployeeHistory() : apiService.getHrEmployeeHistory(employeeId);
      call.then((res) => { if (res.success) setHistory(res.data || []); }).catch(() => {}).finally(() => setHistoryLoaded(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, employee]);

  const setTab = (key) => {
    const next = new URLSearchParams(searchParams);
    if (key === 'overview') next.delete('tab'); else next.set('tab', key);
    setSearchParams(next, { replace: true });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      setPhotoUploading(true);
      setPhotoError('');
      const res = isSelf
        ? await apiService.uploadMyEmployeePhoto(file)
        : await apiService.uploadHrEmployeePhoto(employeeId, file);
      if (res.success) load();
    } catch (err) {
      setPhotoError(err.message || 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleDownload = useCallback(async (kind) => {
    setDownloading(kind);
    setDownloadError('');
    try {
      if (kind === 'info') {
        if (isSelf) await apiService.downloadMyEmployeeInfoPdf();
        else await apiService.downloadHrEmployeeInfoPdf(employeeId);
      }
      if (kind === 'certificate') await apiService.downloadSalaryCertificatePdf(employeeId);
      if (kind === 'slip') await apiService.downloadSalarySlipPdf(employeeId);
    } catch (err) {
      setDownloadError(err.message || 'Failed to download PDF');
    } finally {
      setDownloading('');
    }
  }, [isSelf, employeeId]);

  const activeHrSalary = hrSalaryHistory.find((s) => s.is_active);

  const documentActions = useMemo(() => {
    const list = [{ key: 'info', label: isSelf ? 'My employee info' : 'Employee info', hint: 'PDF summary of this record' }];
    if (!isSelf && activeHrSalary) {
      list.push({ key: 'certificate', label: 'Salary certificate', hint: 'Based on the active salary' });
      list.push({ key: 'slip', label: 'Salary slip', hint: 'Based on the active salary' });
    }
    return list.map((a) => ({ ...a, loading: downloading === a.key, onClick: () => handleDownload(a.key) }));
  }, [isSelf, activeHrSalary, downloading, handleDownload]);

  if (loading) return <LoadingBlock py={10} />;
  if (error) return <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>;
  if (!employee) return null;

  const photoUrl = employee.profile_photo ? apiService.getUploadUrl(employee.profile_photo) : null;
  const flagged = IDENTITY_FIELDS
    .map((d) => ({ ...d, info: expiryInfo(employee[d.expiry]) }))
    .filter((d) => d.info.state === 'expired' || d.info.state === 'expiring');
  const showPackage = isSelf ? employee.salaryVisible !== false && !!employee.activeSalaryStructure : true;
  const packageTotal = isSelf ? compTotal(employee.activeSalaryStructure) : (activeHrSalary ? compTotal(activeHrSalary) : 0);
  const changeRequestProps = { employee, selfService: isSelf, pendingRequests, onSubmitted: load };

  return (
    <Box>
      <ProfileHeader
        employee={employee}
        photoUrl={photoUrl}
        photoUploading={photoUploading}
        onPhotoUpload={handlePhotoUpload}
        tabs={TABS}
        tab={tab}
        onTabChange={setTab}
        actions={headerActions}
        documentActions={documentActions}
      />

      {(photoError || downloadError) && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }} onClose={() => { setPhotoError(''); setDownloadError(''); }}>
          {photoError || downloadError}
        </Alert>
      )}

      {flagged.length > 0 && (tab === 'overview' || tab === 'documents') && (
        <Alert severity={flagged.some((d) => d.info.state === 'expired') ? 'error' : 'warning'} icon={<IconAlertTriangle size={20} />} sx={{ mb: 2.5, borderRadius: 2.5 }}>
          <AlertTitle sx={{ fontWeight: 700 }}>Documents need attention</AlertTitle>
          {flagged.map((d) => `${d.label}: ${d.info.label.toLowerCase()}`).join(' · ')}
        </Alert>
      )}

      {tab === 'overview' && <OverviewTab employee={employee} packageTotal={packageTotal} showPackage={showPackage} />}

      {tab === 'personal' && (
        <Stack spacing={2.5}>
          <ChangeRequestSection
            {...changeRequestProps}
            icon={IconUser}
            title="Personal details"
            fieldGroup="personal"
            editableFields={[
              { key: 'legalFullName', column: 'legal_full_name', label: 'Legal full name' },
              { key: 'preferredName', column: 'preferred_name', label: 'Preferred name' },
              { key: 'firstName', column: 'first_name', label: 'First name' },
              { key: 'lastName', column: 'last_name', label: 'Last name' },
            ]}
            readOnlyFields={[
              { column: 'middle_name', label: 'Middle name' },
              { column: 'date_of_birth', label: 'Date of birth', format: 'date' },
              { column: 'gender', label: 'Gender', format: 'humanize' },
              { column: 'marital_status', label: 'Marital status', format: 'humanize' },
              { column: 'nationality', label: 'Nationality' },
              { column: 'religion', label: 'Religion' },
              { column: 'blood_group', label: 'Blood group' },
              { column: 'national_id', label: 'National ID' },
              { column: 'passport_number', label: 'Passport number' },
            ]}
          />
          <ChangeRequestSection
            {...changeRequestProps}
            icon={IconPhoneCall}
            title="Contact"
            fieldGroup="contact"
            editableFields={[
              { key: 'personalEmail', column: 'personal_email', label: 'Personal email' },
              { key: 'personalPhone', column: 'personal_phone', label: 'Personal phone' },
            ]}
            readOnlyFields={[
              { column: 'work_email', label: 'Work email' },
              { column: 'work_phone', label: 'Work phone' },
            ]}
          />
          <Box sx={twoCol}>
            <ChangeRequestSection
              {...changeRequestProps}
              icon={IconMapPin}
              title="Current address"
              fieldGroup="address"
              min={160}
              editableFields={[
                { key: 'currentAddressLine1', column: 'current_address_line1', label: 'Address line 1' },
                { key: 'currentAddressCity', column: 'current_address_city', label: 'City' },
                { key: 'currentAddressEmirate', column: 'current_address_emirate', label: 'Emirate / state' },
                { key: 'currentAddressCountry', column: 'current_address_country', label: 'Country' },
                { key: 'currentAddressPostal', column: 'current_address_postal', label: 'Postal code' },
              ]}
            />
            <ChangeRequestSection
              {...changeRequestProps}
              icon={IconHome}
              title="Permanent address"
              fieldGroup="address"
              min={160}
              editableFields={[
                { key: 'permanentAddressLine1', column: 'permanent_address_line1', label: 'Address line 1' },
                { key: 'permanentAddressCity', column: 'permanent_address_city', label: 'City' },
                { key: 'permanentAddressEmirate', column: 'permanent_address_emirate', label: 'Emirate / state' },
                { key: 'permanentAddressCountry', column: 'permanent_address_country', label: 'Country' },
                { key: 'permanentAddressPostal', column: 'permanent_address_postal', label: 'Postal code' },
              ]}
            />
          </Box>
          <Box sx={twoCol}>
            <EntityListEditor
              title="Emergency contacts" base={base} entity="emergency-contacts"
              icon={IconUserHeart} emptyMessage="No emergency contacts added yet."
              highlightWhen={(row) => !!row.is_primary}
              maxItems={3}
              maxItemsMessage="Maximum of 3 emergency contacts."
              fields={[
                { key: 'name', label: 'Name', required: true },
                { key: 'relationship', label: 'Relationship' },
                { key: 'phone', label: 'Phone' },
                { key: 'email', label: 'Email' },
                { key: 'isPrimary', label: 'Primary contact', type: 'checkbox' },
              ]}
            />
            <EntityListEditor
              title="Dependents" base={base} entity="dependents"
              icon={IconUsers} emptyMessage="No dependents added yet."
              fields={[
                { key: 'name', label: 'Name', required: true },
                { key: 'relationship', label: 'Relationship' },
                { key: 'dateOfBirth', label: 'Date of birth', type: 'date' },
                { key: 'idNumber', label: 'ID number' },
                { key: 'notes', label: 'Notes', multiline: true },
              ]}
            />
          </Box>
        </Stack>
      )}

      {tab === 'employment' && (
        <Stack spacing={2.5}>
          <SectionCard icon={IconBriefcase} title="Job details">
            <DetailGrid min={190}>
              <DetailItem label="Department" value={employee.department?.name} />
              <DetailItem label="Designation" value={employee.designation?.display_name} />
              <DetailItem label="Reporting manager" value={fullName(employee.manager)} />
              <DetailItem label="Work location" value={employee.workLocation?.name} />
              <DetailItem label="Employment type" value={humanize(employee.employment_type)} />
              <DetailItem label="Employment status" value={humanize(employee.employment_status)} />
              <DetailItem label="Joining date" value={fmtDate(employee.date_of_joining)} />
              <DetailItem label="Probation start" value={fmtDate(employee.probation_start)} />
              <DetailItem label="Probation end" value={fmtDate(employee.probation_end)} />
              <DetailItem label="Confirmation date" value={fmtDate(employee.confirmation_date)} />
              {employee.exit_date && <DetailItem label="Exit date" value={fmtDate(employee.exit_date)} />}
            </DetailGrid>
          </SectionCard>
          <Box sx={mainAside}>
            <CompensationSection
              isSelf={isSelf} employee={employee} employeeId={employeeId}
              salaryHistory={salaryHistory} hrSalaryHistory={hrSalaryHistory} hrSalaryLoaded={hrSalaryLoaded}
              onSaved={refreshHrSalaryHistory}
            />
            <ChangeRequestSection
              {...changeRequestProps}
              icon={IconBuildingBank}
              title="Bank & payroll IDs"
              fieldGroup="bank"
              min={160}
              editableFields={[
                { key: 'bankName', column: 'bank_name', label: 'Bank name' },
                { key: 'bankAccountNumber', column: 'bank_account_number', label: 'Account number' },
                { key: 'bankIban', column: 'bank_iban', label: 'IBAN' },
              ]}
              readOnlyFields={[
                { column: 'routing_code', label: 'Routing code' },
                { column: 'labour_card_no', label: 'Labour card no.' },
                { column: 'mol_person_id', label: 'MOL person ID' },
                { column: 'wps_person_code', label: 'WPS person code' },
                { column: 'tax_id', label: 'Tax ID' },
                { column: 'payment_method_detail', label: 'Payment method', format: 'humanize' },
              ]}
            />
          </Box>
        </Stack>
      )}

      {tab === 'documents' && <DocumentsTab base={base} />}

      {tab === 'qualifications' && (
        <Stack spacing={2.5}>
          <Box sx={twoCol}>
            <EntityListEditor
              title="Education" base={base} entity="qualifications" fileUpload
              icon={IconSchool} emptyMessage="No qualifications added yet."
              addLabel="Add qualification"
              fields={[
                { key: 'degree', label: 'Degree', required: true },
                { key: 'institution', label: 'Institution' },
                { key: 'year', label: 'Year', type: 'number' },
                { key: 'grade', label: 'Grade' },
              ]}
            />
            <EntityListEditor
              title="Certifications" base={base} entity="certifications" fileUpload
              icon={IconCertificate} emptyMessage="No certifications added yet."
              addLabel="Add certification"
              fields={[
                { key: 'name', label: 'Certification name', required: true },
                { key: 'issuer', label: 'Issuer' },
                { key: 'certificateNumber', label: 'Certificate no.' },
                { key: 'issueDate', label: 'Issued', type: 'date' },
                { key: 'expiryDate', label: 'Expires', type: 'date' },
              ]}
            />
          </Box>
          <EntityListEditor
            title="Skills" base={base} entity="skills" variant="chips"
            icon={IconBulb} emptyMessage="No skills added yet."
            addLabel="Add skill"
            fields={[
              { key: 'skillName', label: 'Skill', required: true },
              {
                key: 'proficiencyLevel', label: 'Proficiency', type: 'select',
                options: ['beginner', 'intermediate', 'advanced', 'expert'].map((v) => ({ value: v, label: v })),
              },
            ]}
          />
          <EntityListEditor
            title="Previous employment" base={base} entity="previous-employment"
            icon={IconBuildingSkyscraper} emptyMessage="No previous employment added yet."
            addLabel="Add employer"
            fields={[
              { key: 'companyName', label: 'Company name', required: true },
              { key: 'jobTitle', label: 'Job title' },
              { key: 'startDate', label: 'From', type: 'date' },
              { key: 'endDate', label: 'To', type: 'date' },
              { key: 'reasonForLeaving', label: 'Reason for leaving', multiline: true },
            ]}
          />
        </Stack>
      )}

      {tab === 'assets' && <AssetsTab isSelf={isSelf} base={base} employeeId={employeeId} />}

      {tab === 'activity' && (
        isSelf ? (
          <HistoryTimeline history={history} loading={!historyLoaded} />
        ) : (
          <Box sx={twoCol}>
            <HistoryTimeline history={history} loading={!historyLoaded} />
            <NotesSection employeeId={employeeId} />
          </Box>
        )
      )}

      {tab !== 'overview' && !TABS.some((t) => t.key === tab) && (
        <EmptyState icon={IconLayoutDashboard} title="Section not found" />
      )}
    </Box>
  );
};

export default EmployeeProfileTabs;
