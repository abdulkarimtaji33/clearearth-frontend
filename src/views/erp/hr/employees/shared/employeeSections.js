import {
  IconUser, IconPhoneCall, IconMapPin, IconHome, IconId, IconBriefcase, IconBuildingBank, IconSettings,
} from '@tabler/icons-react';
import { fullName, humanize, fmtDate } from '../../components/HrUi';

/**
 * Single source of truth for the employee record's editable fields. The same definitions drive
 * the Add Employee page (draft values) and the per-section "Edit" dialogs on the profile page
 * (direct save), so both always offer exactly the same fields.
 *
 * Field: { key (API camelCase), column (employee row snake_case), label, type, required?, options?,
 *          lookup?, display?, span? }
 * types: text | email | date | select | lookup | textarea | switch
 */
const opts = (list) => list.map((v) => ({ value: v, label: humanize(v) }));

export const SECTIONS = {
  basic: {
    title: 'Basic information', icon: IconUser, subtitle: 'Names and personal details',
    fields: [
      { key: 'firstName', column: 'first_name', label: 'First name', required: true },
      { key: 'middleName', column: 'middle_name', label: 'Middle name' },
      { key: 'lastName', column: 'last_name', label: 'Last name', required: true },
      { key: 'preferredName', column: 'preferred_name', label: 'Preferred name' },
      { key: 'legalFullName', column: 'legal_full_name', label: 'Legal full name' },
      { key: 'gender', column: 'gender', label: 'Gender', type: 'select', options: opts(['male', 'female', 'other']), display: (e) => humanize(e.gender) },
      { key: 'dateOfBirth', column: 'date_of_birth', label: 'Date of birth', type: 'date' },
      { key: 'maritalStatus', column: 'marital_status', label: 'Marital status', type: 'select', options: opts(['single', 'married', 'divorced', 'widowed']), display: (e) => humanize(e.marital_status) },
      { key: 'nationality', column: 'nationality', label: 'Nationality' },
      { key: 'religion', column: 'religion', label: 'Religion' },
      { key: 'bloodGroup', column: 'blood_group', label: 'Blood group' },
      { key: 'nationalId', column: 'national_id', label: 'National ID' },
    ],
  },
  contact: {
    title: 'Contact', icon: IconPhoneCall, subtitle: 'Work and personal contact details',
    fields: [
      { key: 'email', column: 'email', label: 'Email (system / login)', type: 'email' },
      { key: 'workEmail', column: 'work_email', label: 'Work email', type: 'email' },
      { key: 'phone', column: 'phone', label: 'Phone' },
      { key: 'workPhone', column: 'work_phone', label: 'Work phone' },
      { key: 'personalEmail', column: 'personal_email', label: 'Personal email', type: 'email' },
      { key: 'personalPhone', column: 'personal_phone', label: 'Personal phone' },
      { key: 'emergencyContactName', column: 'emergency_contact_name', label: 'Emergency contact name' },
      { key: 'emergencyContactPhone', column: 'emergency_contact_phone', label: 'Emergency contact phone' },
    ],
  },
  currentAddress: {
    title: 'Current address', icon: IconMapPin,
    fields: [
      { key: 'currentAddressLine1', column: 'current_address_line1', label: 'Address line 1' },
      { key: 'currentAddressCity', column: 'current_address_city', label: 'City' },
      { key: 'currentAddressEmirate', column: 'current_address_emirate', label: 'Emirate / state' },
      { key: 'currentAddressCountry', column: 'current_address_country', label: 'Country' },
      { key: 'currentAddressPostal', column: 'current_address_postal', label: 'Postal code' },
      { key: 'address', column: 'address', label: 'Full address (free text)', type: 'textarea' },
    ],
  },
  permanentAddress: {
    title: 'Permanent address', icon: IconHome,
    fields: [
      { key: 'permanentAddressLine1', column: 'permanent_address_line1', label: 'Address line 1' },
      { key: 'permanentAddressCity', column: 'permanent_address_city', label: 'City' },
      { key: 'permanentAddressEmirate', column: 'permanent_address_emirate', label: 'Emirate / state' },
      { key: 'permanentAddressCountry', column: 'permanent_address_country', label: 'Country' },
      { key: 'permanentAddressPostal', column: 'permanent_address_postal', label: 'Postal code' },
    ],
  },
  identity: {
    title: 'Identity numbers & dates', icon: IconId, subtitle: 'Passport, Emirates ID, visa and labour card',
    fields: [
      { key: 'passportNumber', column: 'passport_number', label: 'Passport number' },
      { key: 'passportIssueDate', column: 'passport_issue_date', label: 'Passport issue date', type: 'date' },
      { key: 'passportExpiryDate', column: 'passport_expiry_date', label: 'Passport expiry date', type: 'date' },
      { key: 'emiratesIdNumber', column: 'emirates_id_number', label: 'Emirates ID number' },
      { key: 'emiratesIdIssueDate', column: 'emirates_id_issue_date', label: 'Emirates ID issue date', type: 'date' },
      { key: 'emiratesIdExpiryDate', column: 'emirates_id_expiry_date', label: 'Emirates ID expiry date', type: 'date' },
      { key: 'visaNumber', column: 'visa_number', label: 'Visa number' },
      { key: 'visaIssueDate', column: 'visa_issue_date', label: 'Visa issue date', type: 'date' },
      { key: 'visaExpiryDate', column: 'visa_expiry_date', label: 'Visa expiry date', type: 'date' },
      { key: 'labourCardNo', column: 'labour_card_no', label: 'Labour card number' },
      { key: 'labourCardIssueDate', column: 'labour_card_issue_date', label: 'Labour card issue date', type: 'date' },
      { key: 'labourCardExpiryDate', column: 'labour_card_expiry_date', label: 'Labour card expiry date', type: 'date' },
    ],
  },
  job: {
    title: 'Job details', icon: IconBriefcase, subtitle: 'Department, reporting line and employment terms',
    fields: [
      { key: 'departmentId', column: 'department_id', label: 'Department', type: 'lookup', lookup: 'departments', display: (e) => e.department?.name },
      { key: 'designationId', column: 'designation_id', label: 'Designation', type: 'lookup', lookup: 'designations', display: (e) => e.designation?.display_name },
      { key: 'managerId', column: 'manager_id', label: 'Reporting manager', type: 'lookup', lookup: 'managers', display: (e) => fullName(e.manager) },
      { key: 'workLocationId', column: 'work_location_id', label: 'Work location', type: 'lookup', lookup: 'workLocations', display: (e) => e.workLocation?.name },
      { key: 'employmentType', column: 'employment_type', label: 'Employment type', type: 'select', options: opts(['full_time', 'part_time', 'contract', 'intern']), display: (e) => humanize(e.employment_type) },
      { key: 'employmentStatus', column: 'employment_status', label: 'Employment status', type: 'select', options: opts(['onboarding', 'active', 'on_leave', 'suspended', 'exited']), display: (e) => humanize(e.employment_status) },
      { key: 'dateOfJoining', column: 'date_of_joining', label: 'Joining date', type: 'date', required: true },
      { key: 'probationStart', column: 'probation_start', label: 'Probation start', type: 'date' },
      { key: 'probationEnd', column: 'probation_end', label: 'Probation end', type: 'date' },
      { key: 'confirmationDate', column: 'confirmation_date', label: 'Confirmation date', type: 'date' },
    ],
  },
  bank: {
    title: 'Bank & payroll IDs', icon: IconBuildingBank, subtitle: 'Used for salary payment and WPS',
    fields: [
      { key: 'bankName', column: 'bank_name', label: 'Bank name' },
      { key: 'bankAccountNumber', column: 'bank_account_number', label: 'Account number' },
      { key: 'bankIban', column: 'bank_iban', label: 'IBAN' },
      { key: 'routingCode', column: 'routing_code', label: 'Routing code' },
      { key: 'molPersonId', column: 'mol_person_id', label: 'MOL person ID' },
      { key: 'wpsPersonCode', column: 'wps_person_code', label: 'WPS person code' },
      { key: 'taxId', column: 'tax_id', label: 'Tax ID' },
      { key: 'paymentMethodDetail', column: 'payment_method_detail', label: 'Payment method detail' },
    ],
  },
  settings: {
    title: 'Notes & settings', icon: IconSettings,
    fields: [
      { key: 'notes', column: 'notes', label: 'Notes', type: 'textarea' },
      {
        key: 'salaryVisibleToEmployee', column: 'salary_visible_to_employee', type: 'switch',
        label: 'Employee can see their own salary details',
      },
    ],
  },
};

export const displayFieldValue = (field, employee) => {
  if (field.display) return field.display(employee) || '';
  const v = employee[field.column];
  if (v === null || v === undefined || v === '') return '';
  if (field.type === 'date') return fmtDate(v);
  if (field.type === 'switch') return v ? 'Yes' : 'No';
  return v;
};

// employee row (snake_case) -> editable values (camelCase) for the given fields
export const valuesFromEmployee = (fields, employee) => {
  const values = {};
  fields.forEach((f) => {
    const v = employee[f.column];
    values[f.key] = f.type === 'switch' ? !!v : (v ?? '');
  });
  return values;
};

// Only the changed fields, '' sent as null so cleared fields are actually cleared.
export const diffValues = (fields, employee, values) => {
  const patch = {};
  fields.forEach((f) => {
    const before = f.type === 'switch' ? !!employee[f.column] : (employee[f.column] ?? '');
    const after = values[f.key];
    if (String(before) !== String(after)) patch[f.key] = f.type === 'switch' ? !!after : (after === '' ? null : after);
  });
  return patch;
};

export const EMPTY_EMPLOYEE_VALUES = {
  employmentType: 'full_time', employmentStatus: 'active', salaryVisibleToEmployee: true,
};
