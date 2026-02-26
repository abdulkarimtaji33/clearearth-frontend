import { uniqueId } from 'lodash';

import {
  IconTruckDelivery,
  IconPhone,
  IconAddressBook,
  IconBuilding,
  IconPackage,
  IconBriefcase,
  IconFileText,
  IconHome,
} from '@tabler/icons-react';

const ErpMenuItems = [
  {
    navlabel: true,
    subheader: 'Overview',
  },
  {
    id: uniqueId(),
    title: 'Dashboard',
    icon: IconHome,
    href: '/erp/dashboard',
  },
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
    title: 'Companies',
    icon: IconBuilding,
    href: '/erp/companies',
  },
  {
    id: uniqueId(),
    title: 'Suppliers',
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
    title: 'Terms & Conditions',
    icon: IconFileText,
    href: '/erp/terms',
  },
];

export default ErpMenuItems;
