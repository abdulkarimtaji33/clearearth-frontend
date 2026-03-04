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
  },
  {
    id: uniqueId(),
    title: 'Clients',
    icon: IconBuilding,
    href: '/erp/companies',
  },
  {
    id: uniqueId(),
    title: 'Vendors',
    icon: IconTruckDelivery,
    href: '/erp/suppliers',
  },
  {
    id: uniqueId(),
    title: 'Leads',
    icon: IconPhone,
    href: '/erp/leads',
  },
  {
    id: uniqueId(),
    title: 'Products & Services',
    icon: IconPackage,
    href: '/erp/products',
  },
  {
    id: uniqueId(),
    title: 'Deals',
    icon: IconBriefcase,
    href: '/erp/deals',
  },
  {
    id: uniqueId(),
    title: 'Quotations',
    icon: IconReceipt,
    href: '/erp/quotations',
  },
  {
    id: uniqueId(),
    title: 'Purchase Orders',
    icon: IconShoppingCart,
    href: '/erp/purchase-orders',
  },
  {
    id: uniqueId(),
    title: 'Terms & Conditions',
    icon: IconFileText,
    href: '/erp/terms',
  },
];

export default ErpMenuItems;
