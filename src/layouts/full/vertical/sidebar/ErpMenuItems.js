import { uniqueId } from 'lodash';

import {
  IconTruckDelivery,
  IconPhone,
  IconAddressBook,
  IconBuilding,
  IconPackage,
  IconBriefcase,
  IconFileText,
  IconReceipt,
  IconShoppingCart,
  IconShield,
  IconUsers,
  IconClipboardCheck,
} from '@tabler/icons-react';

const ErpMenuItems = [
  {
    navlabel: true,
    subheader: 'CRM',
  },
  {
    id: uniqueId(),
    title: 'Contacts',
    icon: IconAddressBook,
    href: '/erp/contacts',
    permission: 'contacts.read',
  },
  {
    id: uniqueId(),
    title: 'Clients',
    icon: IconBuilding,
    href: '/erp/companies',
    permission: 'companies.read',
  },
  {
    id: uniqueId(),
    title: 'Vendors',
    icon: IconTruckDelivery,
    href: '/erp/suppliers',
    permission: 'suppliers.read',
  },
  {
    id: uniqueId(),
    title: 'Leads',
    icon: IconPhone,
    href: '/erp/leads',
    permission: 'leads.read',
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
    title: 'Deals',
    icon: IconBriefcase,
    href: '/erp/deals',
    permission: 'deals.read',
  },
  {
    id: uniqueId(),
    title: 'Quotations',
    icon: IconReceipt,
    href: '/erp/quotations',
    permission: 'deals.read',
  },
  {
    id: uniqueId(),
    title: 'Purchase Orders',
    icon: IconShoppingCart,
    href: '/erp/purchase-orders',
    permission: 'deals.read',
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
];

export default ErpMenuItems;
