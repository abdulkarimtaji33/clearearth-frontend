import { uniqueId } from 'lodash';

import {
  IconLayoutDashboard,
  IconUsers,
  IconTruckDelivery,
  IconPhone,
  IconBriefcase,
  IconShoppingCart,
  IconPackage,
  IconBuildingWarehouse,
  IconReceipt,
  IconFileInvoice,
  IconCoin,
  IconUsersGroup,
  IconCar,
  IconFileText,
  IconCertificate,
  IconReportAnalytics,
  IconSettings,
  IconArrowDownCircle,
  IconArrowUpCircle,
  IconPoint,
} from '@tabler/icons-react';

const ErpMenuItems = [
  {
    navlabel: true,
    subheader: 'ERP',
  },
  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconLayoutDashboard,
    href: '/erp/dashboard',
  },
  {
    navlabel: true,
    subheader: 'CRM',
  },
  {
    id: uniqueId(),
    title: 'Clients',
    icon: IconUsers,
    href: '/erp/clients',
  },
  {
    id: uniqueId(),
    title: 'Vendors',
    icon: IconTruckDelivery,
    href: '/erp/vendors',
  },
  // Temporarily hidden modules
  // {
  //   id: uniqueId(),
  //   title: 'Leads',
  //   icon: IconPhone,
  //   href: '/erp/leads',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Deals',
  //   icon: IconBriefcase,
  //   href: '/erp/deals',
  // },
  // {
  //   navlabel: true,
  //   subheader: 'Products & Services',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Products',
  //   icon: IconShoppingCart,
  //   href: '/erp/products',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Services',
  //   icon: IconPackage,
  //   href: '/erp/services',
  // },
  // {
  //   navlabel: true,
  //   subheader: 'Operations',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Jobs',
  //   icon: IconBriefcase,
  //   href: '/erp/jobs',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Warehouses',
  //   icon: IconBuildingWarehouse,
  //   href: '/erp/warehouses',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Inventory',
  //   icon: IconPackage,
  //   href: '/erp/inventory',
  //   children: [
  //     {
  //       id: uniqueId(),
  //       title: 'Overview',
  //       icon: IconPoint,
  //       href: '/erp/inventory',
  //     },
  //     {
  //       id: uniqueId(),
  //       title: 'Lots',
  //       icon: IconPoint,
  //       href: '/erp/inventory/lots',
  //     },
  //     {
  //       id: uniqueId(),
  //       title: 'Stock Movements',
  //       icon: IconPoint,
  //       href: '/erp/inventory/movements',
  //     },
  //   ],
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Inbound',
  //   icon: IconArrowDownCircle,
  //   href: '/erp/inbound',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Outbound',
  //   icon: IconArrowUpCircle,
  //   href: '/erp/outbound',
  // },
  // {
  //   navlabel: true,
  //   subheader: 'Finance',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Invoices',
  //   icon: IconFileInvoice,
  //   href: '/erp/invoices',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Payments',
  //   icon: IconCoin,
  //   href: '/erp/payments',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Commissions',
  //   icon: IconReceipt,
  //   href: '/erp/commissions',
  // },
  // {
  //   navlabel: true,
  //   subheader: 'Human Resources',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Employees',
  //   icon: IconUsersGroup,
  //   href: '/erp/employees',
  // },
  // {
  //   navlabel: true,
  //   subheader: 'Fleet',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Vehicles',
  //   icon: IconCar,
  //   href: '/erp/vehicles',
  // },
  // {
  //   navlabel: true,
  //   subheader: 'Documents',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Documents',
  //   icon: IconFileText,
  //   href: '/erp/documents',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Certificates',
  //   icon: IconCertificate,
  //   href: '/erp/certificates',
  // },
  // {
  //   navlabel: true,
  //   subheader: 'System',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Reports',
  //   icon: IconReportAnalytics,
  //   href: '/erp/reports',
  // },
  // {
  //   id: uniqueId(),
  //   title: 'Settings',
  //   icon: IconSettings,
  //   href: '/erp/settings',
  // },
];

export default ErpMenuItems;
