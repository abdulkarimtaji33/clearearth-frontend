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
} from '@tabler/icons-react';

const ErpMenuItems = [
  {
    navlabel: true,
    subheader: 'CRM',
  },
  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/erp/dashboard',
    permission: 'leads.read',
    adminDashboardOnly: true,
  },
  {
    id: uniqueId(),
    title: 'Clients & Vendors',
    icon: IconAddressBook,
    href: '/erp/contacts',
    permission: 'contacts.read',
    children: [
      { id: uniqueId(), title: 'Contacts', icon: IconPoint, href: '/erp/contacts', permission: 'contacts.read' },
      { id: uniqueId(), title: 'Clients', icon: IconPoint, href: '/erp/companies', permission: 'companies.read' },
      { id: uniqueId(), title: 'Vendors', icon: IconPoint, href: '/erp/suppliers', permission: 'suppliers.read' },
    ],
  },
  {
    id: uniqueId(),
    title: 'Leads & Deals',
    icon: IconBriefcase,
    href: '/erp/leads',
    permission: 'leads.read',
    children: [
      { id: uniqueId(), title: 'Leads', icon: IconPoint, href: '/erp/leads', permission: 'leads.read' },
      { id: uniqueId(), title: 'Deals', icon: IconPoint, href: '/erp/deals', permission: 'deals.read' },
    ],
  },
  {
    id: uniqueId(),
    title: 'Service and Purchase',
    icon: IconReceipt,
    href: '/erp/quotations',
    permission: 'deals.read',
    children: [
      {
        id: uniqueId(),
        title: 'Quotations',
        icon: IconFileText,
        href: '/erp/quotations',
        permission: 'deals.read',
        children: [
          { id: uniqueId(), title: 'Service Quotation', icon: IconPoint, href: '/erp/quotations', permission: 'deals.read' },
          { id: uniqueId(), title: 'Client purchase quotations', icon: IconPoint, href: '/erp/client-purchase-quotations', permission: 'deals.read' },
          { id: uniqueId(), title: 'Vendor purchase quotations', icon: IconPoint, href: '/erp/vendor-purchase-quotations', permission: 'deals.read' },
        ],
      },
      {
        id: uniqueId(),
        title: 'Orders',
        icon: IconShoppingCart,
        href: '/erp/service-orders',
        permission: 'deals.read',
        children: [
          { id: uniqueId(), title: 'Clients Service Orders', icon: IconPoint, href: '/erp/service-orders', permission: 'deals.read' },
          { id: uniqueId(), title: 'Clients Purchase Orders', icon: IconPoint, href: '/erp/client-purchase-orders', permission: 'deals.read' },
          { id: uniqueId(), title: 'Vendor Purchase Orders', icon: IconPoint, href: '/erp/supplier-purchase-orders', permission: 'deals.read' },
        ],
      },
    ],
  },
  {
    navlabel: true,
    subheader: 'Accounts',
  },
  {
    id: uniqueId(),
    title: 'Proforma invoices',
    icon: IconFileInvoice,
    href: '/erp/proforma-invoices',
    permission: 'deals.read',
  },
  {
    id: uniqueId(),
    title: 'Tax invoices',
    icon: IconReceipt,
    href: '/erp/tax-invoices',
    permission: 'deals.read',
  },
  {
    id: uniqueId(),
    title: 'Posted expenses',
    icon: IconWallet,
    href: '/erp/accounts/expenses',
    permission: 'deals.read',
  },
  {
    id: uniqueId(),
    title: 'Work orders (Accounts)',
    icon: IconClipboardCheck,
    href: '/erp/accounts/work-orders',
    permission: 'deals.read',
  },
  {
    navlabel: true,
    subheader: 'Operations',
  },
  {
    id: uniqueId(),
    title: 'Work Orders',
    icon: IconHammer,
    href: '/erp/work-orders',
    permission: 'deals.read',
  },
  {
    navlabel: true,
    subheader: 'Others',
  },
  {
    id: uniqueId(),
    title: 'Products & Services',
    icon: IconPackage,
    href: '/erp/products',
    permission: 'products.read',
  },
 
  {
    id: uniqueId(),
    title: 'Terms & Conditions',
    icon: IconFileText,
    href: '/erp/terms',
    permission: 'deals.read',
  },
  {
    navlabel: true,
    subheader: 'Inspections',
  },
  {
    id: uniqueId(),
    title: 'Inspection Requests',
    icon: IconClipboardCheck,
    href: '/erp/inspection-requests',
    permission: 'inspection_requests.read',
  },
  {
    navlabel: true,
    subheader: 'Administration',
  },
  {
    id: uniqueId(),
    title: 'Roles',
    icon: IconShield,
    href: '/erp/roles',
    permission: 'roles.read',
  },
  {
    id: uniqueId(),
    title: 'Users',
    icon: IconUsers,
    href: '/erp/users',
    permission: 'users.read',
  },
  {
    id: uniqueId(),
    title: 'Company Settings',
    icon: IconSettings,
    href: '/erp/settings/company',
    permission: 'users.read',
  },
];

export default ErpMenuItems;
