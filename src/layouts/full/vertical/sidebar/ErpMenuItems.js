import { uniqueId } from 'lodash';

import {
  IconAddressBook,
  IconPackage,
  IconBoxSeam,
  IconBriefcase,
  IconFileText,
  IconReceipt,
  IconShoppingCart,
  IconShield,
  IconUsers,
  IconClipboardCheck,
  IconSettings,
  IconPoint,
  IconLayoutDashboard,
  IconHammer,
  IconFileInvoice,
  IconWallet,
  IconCoin,
  IconTruckDelivery,
  IconBook,
  IconList,
  IconScale,
  IconReportMoney,
  IconBuildingBank,
  IconCashBanknote,
  IconChartBar,
  IconCalendar,
  IconCalculator,
  IconClock,
  IconCalendarEvent,
  IconCash,
  IconUserCircle,
  IconCertificate,
  IconLeaf,
} from '@tabler/icons-react';

/**
 * Sidebar menu — gated purely by permissions (no role names).
 *   permission : the user must hold it
 *   anyOf      : the user must hold at least one
 *   (neither)  : always visible (self-service items)
 * Section headings (navlabel) appear only when at least one item under them is visible.
 * Menu visibility follows the same permissions the Roles screen edits.
 */
const item = (title, href, icon, gate = {}, children) => ({
  id: uniqueId(),
  title,
  icon,
  href,
  ...gate,
  ...(children ? { children } : {}),
});
const leaf = (title, href, gate = {}) => item(title, href, IconPoint, gate);
const heading = (subheader) => ({ navlabel: true, subheader });

const ErpMenuItems = [
  item('Dashboard', '/erp/dashboard', IconLayoutDashboard),
  item('My Commissions', '/erp/commissions/mine', IconCoin, { permission: 'commissions.view_own' }),

  // ─── CRM ────────────────────────────────────────────────────────────────────
  heading('CRM'),
  item('Clients & Vendors', '/erp/contacts', IconAddressBook, { anyOf: ['contacts.read', 'companies.read', 'suppliers.read'] }, [
    leaf('Contacts', '/erp/contacts', { permission: 'contacts.read' }),
    leaf('Clients', '/erp/companies', { permission: 'companies.read' }),
    leaf('Vendors', '/erp/suppliers', { permission: 'suppliers.read' }),
  ]),
  item('Leads & Deals', '/erp/leads', IconBriefcase, { anyOf: ['leads.read', 'deals.read'] }, [
    leaf('Leads', '/erp/leads', { permission: 'leads.read' }),
    leaf('Deals', '/erp/deals', { permission: 'deals.read' }),
  ]),
  item('Service and Purchase', '/erp/quotations', IconReceipt, { anyOf: ['deals.read', 'quotations.read', 'purchase_orders.read'] }, [
    item('Quotations', '/erp/quotations', IconFileText, { anyOf: ['deals.read', 'quotations.read', 'purchase_orders.read'] }, [
      leaf('Service Quotation', '/erp/quotations', { anyOf: ['deals.read', 'quotations.read'] }),
      leaf('Client purchase quotations', '/erp/client-purchase-quotations', { anyOf: ['deals.read', 'purchase_orders.read'] }),
    ]),
    item('Orders', '/erp/service-orders', IconShoppingCart, { anyOf: ['deals.read', 'quotations.read', 'purchase_orders.read'] }, [
      leaf('Clients Service Orders', '/erp/service-orders', { anyOf: ['deals.read', 'quotations.read'] }),
      leaf('Clients Purchase Orders', '/erp/client-purchase-orders', { anyOf: ['deals.read', 'purchase_orders.read'] }),
      leaf('Vendor Purchase Orders', '/erp/supplier-purchase-orders', { anyOf: ['deals.read', 'purchase_orders.read'] }),
    ]),
  ]),

  // ─── Accounts ───────────────────────────────────────────────────────────────
  heading('Accounts'),
  item('Accounts', '/erp/tax-invoices', IconCalculator, { permission: 'accounting.read' }, [
    item('Inbound (Accounts)', '/erp/service-orders', IconTruckDelivery, { permission: 'accounting.read' }, [
      item('Sales Orders', '/erp/service-orders', IconFileInvoice, { permission: 'accounting.read' }),
      item('Sales Invoices', '/erp/tax-invoices', IconReceipt, { permission: 'accounting.read' }),
      item('Sales Register', '/erp/registers/sales_invoices', IconBook, { permission: 'accounting.read' }),
    ]),
    item('Outbound (Accounts)', '/erp/supplier-purchase-orders', IconTruckDelivery, { permission: 'accounting.read' }, [
      item('Purchase Orders', '/erp/accounts/purchase-orders', IconFileInvoice, { permission: 'accounting.read' }),
      item('Purchase Bills', '/erp/vendor-bills', IconReceipt, { permission: 'accounting.read' }),
      item('Purchase Register', '/erp/registers/purchase_bills', IconBook, { permission: 'accounting.read' }),
    ]),
    item('Sales & Receivables', '/erp/tax-invoices', IconCoin, { permission: 'accounting.read' }, [
      item('Proforma Invoices', '/erp/proforma-invoices', IconFileInvoice, { permission: 'accounting.read' }),
      item('Tax Invoices', '/erp/tax-invoices', IconReceipt, { permission: 'accounting.read' }),
      item('Credit Notes', '/erp/credit-notes', IconReceipt, { permission: 'accounting.read' }),
      item('Receivables', '/erp/receivables', IconCoin, { permission: 'accounting.read' }),
      item('Receive Payment', '/erp/receivables/receive-payment', IconCashBanknote, { permission: 'accounting.update' }),
      item('Payment Receipts', '/erp/payment-receipts', IconReceipt, { permission: 'accounting.read' }),
    ]),
    item('Purchases & Payables', '/erp/vendor-bills', IconTruckDelivery, { permission: 'accounting.read' }, [
      item('Vendor Bills', '/erp/vendor-bills', IconFileInvoice, { permission: 'accounting.read' }),
      item('Supplier Payables', '/erp/payables/suppliers', IconTruckDelivery, { permission: 'accounting.read' }),
      item('Supplier Debit Notes', '/erp/debit-notes', IconReceipt, { permission: 'accounting.read' }),
      item('Supplier Advances', '/erp/supplier-advances', IconCoin, { permission: 'accounting.read' }),
      item('Older PO Payables', '/erp/payables', IconTruckDelivery, { permission: 'accounting.read' }),
    ]),
    item('Expenses', '/erp/accounts/expenses', IconWallet, { permission: 'accounting.read' }, [
      item('Expenses', '/erp/accounts/expenses', IconWallet, { permission: 'accounting.read' }),
      item('Work Orders (Accounts)', '/erp/accounts/work-orders', IconClipboardCheck, { permission: 'accounting.read' }),
    ]),
    item('Cash & Bank', '/erp/cash-bank-transfers', IconBuildingBank, { permission: 'accounting.read' }, [
      item('Transfers', '/erp/cash-bank-transfers', IconCashBanknote, { permission: 'accounting.read' }),
      item('Bank Reconciliation', '/erp/bank-reconciliation', IconScale, { permission: 'accounting.read' }),
    ]),
    item('General Ledger', '/erp/chart-of-accounts', IconBook, { permission: 'accounting.read' }, [
      item('Chart of Accounts', '/erp/chart-of-accounts', IconList, { permission: 'accounting.read' }),
      item('Journal', '/erp/journal', IconBook, { permission: 'accounting.read' }),
    ]),
    item('Financial Reports', '/erp/reports/trial-balance', IconReportMoney, { anyOf: ['accounting.read', 'reports.read'] }, [
      item('Trial Balance', '/erp/reports/trial-balance', IconScale, { anyOf: ['accounting.read', 'reports.read'] }),
      item('General Ledger', '/erp/reports/general-ledger', IconBook, { anyOf: ['accounting.read', 'reports.read'] }),
      item('Income Statement', '/erp/reports/income-statement', IconReportMoney, { anyOf: ['accounting.read', 'reports.read'] }),
      item('Balance Sheet', '/erp/reports/balance-sheet', IconBuildingBank, { anyOf: ['accounting.read', 'reports.read'] }),
      item('Cash Flow', '/erp/reports/cash-flow', IconCashBanknote, { anyOf: ['accounting.read', 'reports.read'] }),
      item('Changes in Equity', '/erp/reports/changes-in-equity', IconChartBar, { anyOf: ['accounting.read', 'reports.read'] }),
      item('VAT Report', '/erp/reports/vat-report', IconReceipt, { anyOf: ['accounting.read', 'reports.read'] }),
    ]),
  ]),

  // ─── Operations ─────────────────────────────────────────────────────────────
  heading('Operations'),
  item('GRN', '/erp/grn', IconPackage, { permission: 'grn.read' }),
  item('Inbound', '/erp/registers/purchase', IconTruckDelivery, { anyOf: ['grn.read', 'outbound.read', 'operations.read'] }, [
    leaf('Purchase Register', '/erp/registers/purchase', { anyOf: ['grn.read', 'outbound.read', 'purchase_orders.read'] }),
    leaf('Purchase Orders', '/erp/supplier-purchase-orders', { anyOf: ['deals.read', 'purchase_orders.read'] }),
    leaf('Purchase Invoices', '/erp/vendor-bills', { permission: 'accounting.read' }),
    leaf('Service Register', '/erp/registers/service', { anyOf: ['grn.read', 'outbound.read', 'quotations.read'] }),
    leaf('Service Orders', '/erp/service-orders', { anyOf: ['deals.read', 'quotations.read'] }),
    leaf('Service Invoices', '/erp/tax-invoices', { permission: 'accounting.read' }),
    leaf('Pickup Report', '/erp/pickup-report', { permission: 'operations.read' }),
  ]),
  item('Outbound', '/erp/outbound', IconTruckDelivery, { anyOf: ['outbound.read', 'grn.read'] }, [
    leaf('Outbound', '/erp/outbound', { anyOf: ['outbound.read', 'grn.read'] }),
    leaf('Sales Register', '/erp/registers/sales', { anyOf: ['outbound.read', 'grn.read'] }),
    leaf('Sales Orders', '/erp/outbound?type=sale', { anyOf: ['outbound.read', 'grn.read'] }),
    leaf('Sales Invoices', '/erp/registers/sales?type=Sales%20Invoice', { anyOf: ['outbound.read', 'grn.read'] }),
  ]),
  item('Inventory', '/erp/inventory', IconBoxSeam, { permission: 'grn.read' }),
  item('Work Orders', '/erp/work-orders', IconHammer, { permission: 'operations.read' }),
  item('Certificates', '/erp/certificates/requests', IconCertificate, { permission: 'certificates.read' }, [
    leaf('Requests', '/erp/certificates/requests', { permission: 'certificates.read' }),
    leaf('Register', '/erp/certificates/register', { permission: 'certificates.read' }),
  ]),

  // ─── Others ─────────────────────────────────────────────────────────────────
  heading('Others'),
  item('Products & Services', '/erp/products', IconPackage, { anyOf: ['products.create', 'products.update', 'products.delete'] }),
  item('Terms & Conditions', '/erp/terms', IconFileText, { anyOf: ['settings.manage', 'workflow.manager'] }),

  // ─── Inspections ────────────────────────────────────────────────────────────
  heading('Inspections'),
  item('Inspection Requests', '/erp/inspection-requests', IconClipboardCheck, { permission: 'inspection_requests.read' }),

  // ─── Administration ─────────────────────────────────────────────────────────
  heading('Administration'),
  item('Roles & Access', '/erp/roles', IconShield, { permission: 'roles.read' }),
  item('Users', '/erp/users', IconUsers, { permission: 'users.read' }),
  item('Company Settings', '/erp/settings/company', IconSettings, { permission: 'settings.manage' }),
  item('Fiscal Years', '/erp/settings/fiscal-years', IconCalendar, { permission: 'accounting.update' }),
  item('Commission Settings', '/erp/commissions/settings', IconCoin, { permission: 'commissions.manage' }),
  item('Carbon Footprint Factors', '/erp/settings/carbon-factors', IconLeaf, { permission: 'certificates.manage' }),

  // ─── My HR (self-service, always visible to every authenticated user) ───────
  heading('My HR'),
  item('My Profile', '/erp/hr/me', IconUserCircle, {}, [leaf('My Profile', '/erp/hr/me')]),
  item('Attendance', '/erp/hr/attendance/my', IconClock, {}, [leaf('My Attendance', '/erp/hr/attendance/my')]),
  item('Leave', '/erp/hr/leave/my', IconCalendarEvent, {}, [leaf('My Leave', '/erp/hr/leave/my')]),
  item('Payroll', '/erp/hr/payroll/my-payslips', IconCash, {}, [leaf('My Payslips', '/erp/hr/payroll/my-payslips')]),

  // ─── HR Management (permission-gated) ───────────────────────────────────────
  heading('HR Management'),
  item('Employees', '/erp/hr/employees', IconUsers, { permission: 'hr.employees.read' }, [
    leaf('Employees', '/erp/hr/employees', { permission: 'hr.employees.read' }),
    leaf('Profile Changes', '/erp/hr/employees/change-requests', { permission: 'hr.employees.manage' }),
    leaf('Departments', '/erp/hr/departments', { permission: 'hr.settings.manage' }),
  ]),
  item('Attendance Management', '/erp/hr/attendance/sheet', IconClock, { permission: 'hr.attendance.manage' }, [
    leaf('Attendance Sheet', '/erp/hr/attendance/sheet', { permission: 'hr.attendance.manage' }),
    leaf('Regularization Requests', '/erp/hr/attendance/regularizations', { permission: 'hr.attendance.manage' }),
  ]),
  item('Leave Management', '/erp/hr/leave/approvals', IconCalendarEvent, { anyOf: ['hr.leave.approve', 'hr.settings.manage'] }, [
    leaf('Approvals', '/erp/hr/leave/approvals', { permission: 'hr.leave.approve' }),
    leaf('Leave Types', '/erp/hr/leave/types', { permission: 'hr.settings.manage' }),
    leaf('Holidays', '/erp/hr/leave/holidays', { permission: 'hr.settings.manage' }),
  ]),
  item('Payroll Management', '/erp/hr/payroll/runs', IconCash, { permission: 'hr.payroll.read' }, [
    leaf('Payroll Runs', '/erp/hr/payroll/runs', { permission: 'hr.payroll.read' }),
  ]),
];

export default ErpMenuItems;
