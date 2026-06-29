import { uniqueId } from 'lodash';

import {
  IconAddressBook,
  IconPackage,
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
  IconLock,
} from '@tabler/icons-react';

// Roles that should only see their designated section (Operations or Accounts).
const SECTION_RESTRICTED_ROLES = ['operations_manager', 'accounts'];
const ACCOUNTS_ONLY_ROLES = ['accounts'];
const OPERATIONS_ONLY_ROLES = ['operations_manager'];
/** Sales users only see items under the CRM sidebar heading. */
const CRM_ONLY_ROLES = ['sales'];
/** Sales and sales manager must not access Operations (work orders, GRN). */
const NO_OPERATIONS_ACCESS_ROLES = ['sales', 'sales_manager'];
const DRIVER_ONLY_ROLES = ['driver'];

const ErpMenuItems = [
  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/erp/dashboard',
  },
  {
    id: uniqueId(),
    title: 'Change Password',
    icon: IconLock,
    href: '/erp/account/password',
  },
  // ─── CRM ────────────────────────────────────────────────────────────────────
  {
    navlabel: true,
    subheader: 'CRM',
    excludeRoles: [...SECTION_RESTRICTED_ROLES, ...DRIVER_ONLY_ROLES],
  },
  {
    id: uniqueId(),
    title: 'Clients & Vendors',
    icon: IconAddressBook,
    href: '/erp/contacts',
    permission: 'contacts.read',
    excludeRoles: [...SECTION_RESTRICTED_ROLES, ...DRIVER_ONLY_ROLES],
    children: [
      { id: uniqueId(), title: 'Contacts', icon: IconPoint, href: '/erp/contacts', permission: 'contacts.read', excludeRoles: SECTION_RESTRICTED_ROLES },
      { id: uniqueId(), title: 'Clients', icon: IconPoint, href: '/erp/companies', permission: 'companies.read', excludeRoles: SECTION_RESTRICTED_ROLES },
      { id: uniqueId(), title: 'Vendors', icon: IconPoint, href: '/erp/suppliers', permission: 'suppliers.read', excludeRoles: SECTION_RESTRICTED_ROLES },
    ],
  },
  {
    id: uniqueId(),
    title: 'Leads & Deals',
    icon: IconBriefcase,
    href: '/erp/leads',
    permission: 'leads.read',
    excludeRoles: [...SECTION_RESTRICTED_ROLES, ...DRIVER_ONLY_ROLES],
    children: [
      { id: uniqueId(), title: 'Leads', icon: IconPoint, href: '/erp/leads', permission: 'leads.read', excludeRoles: SECTION_RESTRICTED_ROLES },
      { id: uniqueId(), title: 'Deals', icon: IconPoint, href: '/erp/deals', permission: 'deals.read', excludeRoles: SECTION_RESTRICTED_ROLES },
    ],
  },
  {
    id: uniqueId(),
    title: 'Service and Purchase',
    icon: IconReceipt,
    href: '/erp/quotations',
    permission: 'deals.read',
    excludeRoles: [...SECTION_RESTRICTED_ROLES, ...DRIVER_ONLY_ROLES],
    children: [
      {
        id: uniqueId(),
        title: 'Quotations',
        icon: IconFileText,
        href: '/erp/quotations',
        permission: 'deals.read',
        excludeRoles: [...SECTION_RESTRICTED_ROLES, ...DRIVER_ONLY_ROLES],
        children: [
          { id: uniqueId(), title: 'Service Quotation', icon: IconPoint, href: '/erp/quotations', permission: 'deals.read', excludeRoles: SECTION_RESTRICTED_ROLES },
          { id: uniqueId(), title: 'Client purchase quotations', icon: IconPoint, href: '/erp/client-purchase-quotations', permission: 'deals.read', excludeRoles: SECTION_RESTRICTED_ROLES },
          { id: uniqueId(), title: 'Vendor purchase quotations', icon: IconPoint, href: '/erp/vendor-purchase-quotations', permission: 'deals.read', excludeRoles: SECTION_RESTRICTED_ROLES },
        ],
      },
      {
        id: uniqueId(),
        title: 'Orders',
        icon: IconShoppingCart,
        href: '/erp/service-orders',
        permission: 'deals.read',
        excludeRoles: [...SECTION_RESTRICTED_ROLES, ...DRIVER_ONLY_ROLES],
        children: [
          { id: uniqueId(), title: 'Clients Service Orders', icon: IconPoint, href: '/erp/service-orders', permission: 'deals.read', excludeRoles: SECTION_RESTRICTED_ROLES },
          { id: uniqueId(), title: 'Clients Purchase Orders', icon: IconPoint, href: '/erp/client-purchase-orders', permission: 'deals.read', excludeRoles: SECTION_RESTRICTED_ROLES },
          { id: uniqueId(), title: 'Vendor Purchase Orders', icon: IconPoint, href: '/erp/supplier-purchase-orders', permission: 'deals.read', excludeRoles: SECTION_RESTRICTED_ROLES },
        ],
      },
    ],
  },

  // ─── Accounts (collapsible dropdown) ────────────────────────────────────────
  {
    navlabel: true,
    subheader: 'Accounts',
    excludeRoles: [...OPERATIONS_ONLY_ROLES, ...CRM_ONLY_ROLES],
  },
  // Standalone "Deals" link for accounts-only role (no CRM section for them)
  {
    id: uniqueId(),
    title: 'Deals',
    icon: IconBriefcase,
    href: '/erp/deals',
    permission: 'deals.read',
    includeRoles: ACCOUNTS_ONLY_ROLES,
  },
  {
    id: uniqueId(),
    title: 'Clients & Vendors',
    icon: IconAddressBook,
    href: '/erp/companies',
    includeRoles: ACCOUNTS_ONLY_ROLES,
    children: [
      { id: uniqueId(), title: 'Clients', icon: IconPoint, href: '/erp/companies', permission: 'companies.read', includeRoles: ACCOUNTS_ONLY_ROLES },
      { id: uniqueId(), title: 'Vendors', icon: IconPoint, href: '/erp/suppliers', permission: 'suppliers.read', includeRoles: ACCOUNTS_ONLY_ROLES },
    ],
  },
  // Quotations & orders for accounts role
  {
    id: uniqueId(),
    title: 'Service and Purchase',
    icon: IconReceipt,
    href: '/erp/quotations',
    permission: 'quotations.read',
    includeRoles: ACCOUNTS_ONLY_ROLES,
    children: [
      {
        id: uniqueId(),
        title: 'Quotations',
        icon: IconFileText,
        href: '/erp/quotations',
        permission: 'quotations.read',
        includeRoles: ACCOUNTS_ONLY_ROLES,
        children: [
          { id: uniqueId(), title: 'Service Quotation', icon: IconPoint, href: '/erp/quotations', permission: 'quotations.read', includeRoles: ACCOUNTS_ONLY_ROLES },
          { id: uniqueId(), title: 'Client purchase quotations', icon: IconPoint, href: '/erp/client-purchase-quotations', permission: 'purchase_orders.read', includeRoles: ACCOUNTS_ONLY_ROLES },
          { id: uniqueId(), title: 'Vendor purchase quotations', icon: IconPoint, href: '/erp/vendor-purchase-quotations', permission: 'purchase_orders.read', includeRoles: ACCOUNTS_ONLY_ROLES },
        ],
      },
      {
        id: uniqueId(),
        title: 'Orders',
        icon: IconShoppingCart,
        href: '/erp/service-orders',
        permission: 'quotations.read',
        includeRoles: ACCOUNTS_ONLY_ROLES,
        children: [
          { id: uniqueId(), title: 'Clients Service Orders', icon: IconPoint, href: '/erp/service-orders', permission: 'quotations.read', includeRoles: ACCOUNTS_ONLY_ROLES },
          { id: uniqueId(), title: 'Clients Purchase Orders', icon: IconPoint, href: '/erp/client-purchase-orders', permission: 'purchase_orders.read', includeRoles: ACCOUNTS_ONLY_ROLES },
          { id: uniqueId(), title: 'Vendor Purchase Orders', icon: IconPoint, href: '/erp/supplier-purchase-orders', permission: 'purchase_orders.read', includeRoles: ACCOUNTS_ONLY_ROLES },
        ],
      },
    ],
  },
  // Main Accounts collapsible — visible to everyone except operations_manager
  {
    id: uniqueId(),
    title: 'Accounts',
    icon: IconCalculator,
    href: '/erp/tax-invoices',
    permission: 'accounting.read',
    excludeRoles: [...OPERATIONS_ONLY_ROLES, ...CRM_ONLY_ROLES],
    children: [
      // ── Invoicing & Payments ─────────────────────────────────────────────
      { id: uniqueId(), title: 'Proforma Invoices', icon: IconFileInvoice, href: '/erp/proforma-invoices', permission: 'accounting.read' },
      { id: uniqueId(), title: 'Tax Invoices', icon: IconReceipt, href: '/erp/tax-invoices', permission: 'accounting.read' },
      { id: uniqueId(), title: 'Receivables', icon: IconCoin, href: '/erp/receivables', permission: 'accounting.read' },
      { id: uniqueId(), title: 'Payables', icon: IconTruckDelivery, href: '/erp/payables', permission: 'accounting.read' },
      { id: uniqueId(), title: 'Payment Receipts', icon: IconReceipt, href: '/erp/payment-receipts', permission: 'accounting.read' },
      { id: uniqueId(), title: 'Expenses', icon: IconWallet, href: '/erp/accounts/expenses', permission: 'accounting.read' },
      { id: uniqueId(), title: 'Work Orders (Accounts)', icon: IconClipboardCheck, href: '/erp/accounts/work-orders', permission: 'accounting.read' },
      // ── General Ledger ───────────────────────────────────────────────────
      { id: uniqueId(), title: 'Chart of Accounts', icon: IconList, href: '/erp/chart-of-accounts', permission: 'accounting.read' },
      { id: uniqueId(), title: 'Journal', icon: IconBook, href: '/erp/journal', permission: 'accounting.read' },
      // ── Financial Reports ────────────────────────────────────────────────
      {
        id: uniqueId(),
        title: 'Financial Reports',
        icon: IconReportMoney,
        href: '/erp/reports/trial-balance',
        permission: 'accounting.read',
        children: [
          { id: uniqueId(), title: 'Trial Balance', icon: IconScale, href: '/erp/reports/trial-balance', permission: 'accounting.read' },
          { id: uniqueId(), title: 'General Ledger', icon: IconBook, href: '/erp/reports/general-ledger', permission: 'accounting.read' },
          { id: uniqueId(), title: 'Income Statement', icon: IconReportMoney, href: '/erp/reports/income-statement', permission: 'accounting.read' },
          { id: uniqueId(), title: 'Balance Sheet', icon: IconBuildingBank, href: '/erp/reports/balance-sheet', permission: 'accounting.read' },
          { id: uniqueId(), title: 'Cash Flow', icon: IconCashBanknote, href: '/erp/reports/cash-flow', permission: 'accounting.read' },
          { id: uniqueId(), title: 'Changes in Equity', icon: IconChartBar, href: '/erp/reports/changes-in-equity', permission: 'accounting.read' },
          { id: uniqueId(), title: 'VAT Report', icon: IconReceipt, href: '/erp/reports/vat-report', permission: 'accounting.read' },
        ],
      },
    ],
  },

  // ─── Operations ─────────────────────────────────────────────────────────────
  {
    navlabel: true,
    subheader: 'Operations',
    excludeRoles: [...ACCOUNTS_ONLY_ROLES, ...CRM_ONLY_ROLES, ...NO_OPERATIONS_ACCESS_ROLES, ...DRIVER_ONLY_ROLES],
  },
  {
    id: uniqueId(),
    title: 'Deals',
    icon: IconBriefcase,
    href: '/erp/deals',
    permission: 'deals.read',
    includeRoles: OPERATIONS_ONLY_ROLES,
  },
  {
    id: uniqueId(),
    title: 'GRN',
    icon: IconPackage,
    href: '/erp/grn',
    permission: 'deals.read',
    excludeRoles: [...ACCOUNTS_ONLY_ROLES, ...CRM_ONLY_ROLES, ...NO_OPERATIONS_ACCESS_ROLES, ...DRIVER_ONLY_ROLES],
  },
  {
    id: uniqueId(),
    title: 'Work Orders',
    icon: IconHammer,
    href: '/erp/work-orders',
    permission: 'deals.read',
    excludeRoles: [...ACCOUNTS_ONLY_ROLES, ...CRM_ONLY_ROLES, ...NO_OPERATIONS_ACCESS_ROLES, ...DRIVER_ONLY_ROLES],
  },
  {
    id: uniqueId(),
    title: 'Service and Purchase',
    icon: IconReceipt,
    href: '/erp/quotations',
    permission: 'quotations.read',
    includeRoles: OPERATIONS_ONLY_ROLES,
    children: [
      {
        id: uniqueId(),
        title: 'Quotations',
        icon: IconFileText,
        href: '/erp/quotations',
        permission: 'quotations.read',
        includeRoles: OPERATIONS_ONLY_ROLES,
        children: [
          { id: uniqueId(), title: 'Service Quotation', icon: IconPoint, href: '/erp/quotations', permission: 'quotations.read', includeRoles: OPERATIONS_ONLY_ROLES },
          { id: uniqueId(), title: 'Client purchase quotations', icon: IconPoint, href: '/erp/client-purchase-quotations', permission: 'purchase_orders.read', includeRoles: OPERATIONS_ONLY_ROLES },
          { id: uniqueId(), title: 'Vendor purchase quotations', icon: IconPoint, href: '/erp/vendor-purchase-quotations', permission: 'purchase_orders.read', includeRoles: OPERATIONS_ONLY_ROLES },
        ],
      },
      {
        id: uniqueId(),
        title: 'Orders',
        icon: IconShoppingCart,
        href: '/erp/service-orders',
        permission: 'quotations.read',
        includeRoles: OPERATIONS_ONLY_ROLES,
        children: [
          { id: uniqueId(), title: 'Clients Service Orders', icon: IconPoint, href: '/erp/service-orders', permission: 'quotations.read', includeRoles: OPERATIONS_ONLY_ROLES },
          { id: uniqueId(), title: 'Clients Purchase Orders', icon: IconPoint, href: '/erp/client-purchase-orders', permission: 'purchase_orders.read', includeRoles: OPERATIONS_ONLY_ROLES },
          { id: uniqueId(), title: 'Vendor Purchase Orders', icon: IconPoint, href: '/erp/supplier-purchase-orders', permission: 'purchase_orders.read', includeRoles: OPERATIONS_ONLY_ROLES },
        ],
      },
    ],
  },

  // ─── Others ─────────────────────────────────────────────────────────────────
  {
    navlabel: true,
    subheader: 'Others',
    excludeRoles: [...SECTION_RESTRICTED_ROLES, ...CRM_ONLY_ROLES, ...DRIVER_ONLY_ROLES],
  },
  {
    id: uniqueId(),
    title: 'Products & Services',
    icon: IconPackage,
    href: '/erp/products',
    permission: 'products.read',
    excludeRoles: [...SECTION_RESTRICTED_ROLES, ...CRM_ONLY_ROLES, ...DRIVER_ONLY_ROLES],
  },
  {
    id: uniqueId(),
    title: 'Terms & Conditions',
    icon: IconFileText,
    href: '/erp/terms',
    permission: 'deals.read',
    excludeRoles: [...SECTION_RESTRICTED_ROLES, ...CRM_ONLY_ROLES, ...DRIVER_ONLY_ROLES],
  },

  // ─── Inspections ────────────────────────────────────────────────────────────
  {
    navlabel: true,
    subheader: 'Inspections',
    excludeRoles: [...SECTION_RESTRICTED_ROLES, ...CRM_ONLY_ROLES, ...DRIVER_ONLY_ROLES],
  },
  {
    id: uniqueId(),
    title: 'Inspection Requests',
    icon: IconClipboardCheck,
    href: '/erp/inspection-requests',
    permission: 'inspection_requests.read',
    excludeRoles: [...SECTION_RESTRICTED_ROLES, ...CRM_ONLY_ROLES, ...DRIVER_ONLY_ROLES],
  },

  // ─── Administration ─────────────────────────────────────────────────────────
  {
    navlabel: true,
    subheader: 'Administration',
    excludeRoles: [...SECTION_RESTRICTED_ROLES, ...CRM_ONLY_ROLES, ...DRIVER_ONLY_ROLES],
  },
  {
    id: uniqueId(),
    title: 'Roles',
    icon: IconShield,
    href: '/erp/roles',
    adminDashboardOnly: true,
    excludeRoles: [...SECTION_RESTRICTED_ROLES, ...CRM_ONLY_ROLES, ...DRIVER_ONLY_ROLES],
  },
  {
    id: uniqueId(),
    title: 'Users',
    icon: IconUsers,
    href: '/erp/users',
    adminDashboardOnly: true,
    excludeRoles: [...SECTION_RESTRICTED_ROLES, ...CRM_ONLY_ROLES, ...DRIVER_ONLY_ROLES],
  },
  {
    id: uniqueId(),
    title: 'Company Settings',
    icon: IconSettings,
    href: '/erp/settings/company',
    adminDashboardOnly: true,
    excludeRoles: [...SECTION_RESTRICTED_ROLES, ...CRM_ONLY_ROLES, ...DRIVER_ONLY_ROLES],
  },
  {
    id: uniqueId(),
    title: 'Fiscal Years',
    icon: IconCalendar,
    href: '/erp/settings/fiscal-years',
    permission: 'accounting.read',
    excludeRoles: [...OPERATIONS_ONLY_ROLES, ...CRM_ONLY_ROLES, ...DRIVER_ONLY_ROLES],
  },
];

export default ErpMenuItems;
