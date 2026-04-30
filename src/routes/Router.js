import React, { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';

import Loadable from '../layouts/full/shared/loadable/Loadable';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

/* ****ERP Pages***** */
const Dashboard = Loadable(lazy(() => import('../views/erp/Dashboard')));
const ContactList = Loadable(lazy(() => import('../views/erp/contacts/ContactList')));
const ContactForm = Loadable(lazy(() => import('../views/erp/contacts/ContactForm')));
const CompanyList = Loadable(lazy(() => import('../views/erp/companies/CompanyList')));
const CompanyForm = Loadable(lazy(() => import('../views/erp/companies/CompanyForm')));
const CompanyView = Loadable(lazy(() => import('../views/erp/companies/CompanyView')));
const SupplierList = Loadable(lazy(() => import('../views/erp/suppliers/SupplierList')));
const SupplierForm = Loadable(lazy(() => import('../views/erp/suppliers/SupplierForm')));
const SupplierView = Loadable(lazy(() => import('../views/erp/suppliers/SupplierView')));
const LeadList = Loadable(lazy(() => import('../views/erp/leads/LeadList')));
const LeadForm = Loadable(lazy(() => import('../views/erp/leads/LeadForm')));
const ProductList = Loadable(lazy(() => import('../views/erp/products/ProductList')));
const ProductForm = Loadable(lazy(() => import('../views/erp/products/ProductForm')));
const DealList = Loadable(lazy(() => import('../views/erp/deals/DealList')));
const DealForm = Loadable(lazy(() => import('../views/erp/deals/DealForm')));
const DealView = Loadable(lazy(() => import('../views/erp/deals/DealView')));
const TermsList = Loadable(lazy(() => import('../views/erp/terms/TermsList')));
const TermsForm = Loadable(lazy(() => import('../views/erp/terms/TermsForm')));
const QuotationList = Loadable(lazy(() => import('../views/erp/quotations/QuotationList')));
const QuotationForm = Loadable(lazy(() => import('../views/erp/quotations/QuotationForm')));
const QuotationView = Loadable(lazy(() => import('../views/erp/quotations/QuotationView')));
const ProformaInvoiceList = Loadable(lazy(() => import('../views/erp/proforma-invoices/ProformaInvoiceList')));
const ProformaInvoiceCreate = Loadable(lazy(() => import('../views/erp/proforma-invoices/ProformaInvoiceCreate')));
const ProformaInvoiceView = Loadable(lazy(() => import('../views/erp/proforma-invoices/ProformaInvoiceView')));
const TaxInvoiceList = Loadable(lazy(() => import('../views/erp/tax-invoices/TaxInvoiceList')));
const TaxInvoiceCreate = Loadable(lazy(() => import('../views/erp/tax-invoices/TaxInvoiceCreate')));
const TaxInvoiceView = Loadable(lazy(() => import('../views/erp/tax-invoices/TaxInvoiceView')));
const TaxInvoiceEdit = Loadable(lazy(() => import('../views/erp/tax-invoices/TaxInvoiceEdit')));
const AccountsWorkOrderList = Loadable(lazy(() => import('../views/erp/accounts/AccountsWorkOrderList')));
const AccountsWorkOrderView = Loadable(lazy(() => import('../views/erp/accounts/AccountsWorkOrderView')));
const ExpensesList = Loadable(lazy(() => import('../views/erp/accounts/ExpensesList')));
const ExpenseCreate = Loadable(lazy(() => import('../views/erp/accounts/ExpenseCreate')));
const ReceivablesList = Loadable(lazy(() => import('../views/erp/receivables/ReceivablesList')));
const AgingSummaryView = Loadable(lazy(() => import('../views/erp/receivables/AgingSummaryView')));
const PayablesList = Loadable(lazy(() => import('../views/erp/payables/PayablesList')));
const PayablesAgingSummaryView = Loadable(lazy(() => import('../views/erp/payables/PayablesAgingSummaryView')));
const PurchaseOrderForm = Loadable(lazy(() => import('../views/erp/purchase-orders/PurchaseOrderForm')));
const PurchaseOrderView = Loadable(lazy(() => import('../views/erp/purchase-orders/PurchaseOrderView')));
const ClientPurchaseQuotationList = Loadable(lazy(() => import('../views/erp/purchase-orders/ClientPurchaseQuotationList')));
const VendorPurchaseQuotationList = Loadable(lazy(() => import('../views/erp/purchase-orders/VendorPurchaseQuotationList')));
const ClientPurchaseOrderList = Loadable(lazy(() => import('../views/erp/purchase-orders/ClientPurchaseOrderList')));
const SupplierPurchaseOrderList = Loadable(lazy(() => import('../views/erp/purchase-orders/SupplierPurchaseOrderList')));
const RoleList = Loadable(lazy(() => import('../views/erp/roles/RoleList')));
const RoleForm = Loadable(lazy(() => import('../views/erp/roles/RoleForm')));
const UserList = Loadable(lazy(() => import('../views/erp/users/UserList')));
const UserForm = Loadable(lazy(() => import('../views/erp/users/UserForm')));
const InspectionRequestList = Loadable(lazy(() => import('../views/erp/inspection-requests/InspectionRequestList')));
const InspectionRequestView = Loadable(lazy(() => import('../views/erp/inspection-requests/InspectionRequestView')));
const WorkOrderList = Loadable(lazy(() => import('../views/erp/work-orders/WorkOrderList')));
const WorkOrderForm = Loadable(lazy(() => import('../views/erp/work-orders/WorkOrderForm')));
const WorkOrderView = Loadable(lazy(() => import('../views/erp/work-orders/WorkOrderView')));
const CompanySettings = Loadable(lazy(() => import('../views/erp/settings/CompanySettings')));

// authentication
const Login = Loadable(lazy(() => import('../views/authentication/auth1/Login')));
const Login2 = Loadable(lazy(() => import('../views/authentication/auth2/Login2')));
const Register = Loadable(lazy(() => import('../views/authentication/auth1/Register')));
const Register2 = Loadable(lazy(() => import('../views/authentication/auth2/Register2')));
const ForgotPassword = Loadable(lazy(() => import('../views/authentication/auth1/ForgotPassword')));
const ForgotPassword2 = Loadable(lazy(() => import('../views/authentication/auth2/ForgotPassword2')));
const TwoSteps = Loadable(lazy(() => import('../views/authentication/auth1/TwoSteps')));
const TwoSteps2 = Loadable(lazy(() => import('../views/authentication/auth2/TwoSteps2')));
const Error = Loadable(lazy(() => import('../views/authentication/Error')));
const Maintenance = Loadable(lazy(() => import('../views/authentication/Maintenance')));

const Router = createBrowserRouter([
  {
    path: '/',
    element: <FullLayout />,
    children: [
      { path: '/', element: <Navigate to="/erp/dashboard" /> },
      { path: '/erp', element: <Navigate to="/erp/dashboard" /> },
      { path: '/erp/dashboard', element: <Dashboard /> },
      { path: '/erp/contacts', element: <ContactList /> },
      { path: '/erp/contacts/create', element: <ContactForm /> },
      { path: '/erp/contacts/edit/:id', element: <ContactForm /> },
      { path: '/erp/companies', element: <CompanyList /> },
      { path: '/erp/companies/create', element: <CompanyForm /> },
      { path: '/erp/companies/edit/:id', element: <CompanyForm /> },
      { path: '/erp/companies/view/:id', element: <CompanyView /> },
      { path: '/erp/suppliers', element: <SupplierList /> },
      { path: '/erp/suppliers/create', element: <SupplierForm /> },
      { path: '/erp/suppliers/view/:id', element: <SupplierView /> },
      { path: '/erp/suppliers/edit/:id', element: <SupplierForm /> },
      { path: '/erp/leads', element: <LeadList /> },
      { path: '/erp/leads/create', element: <LeadForm /> },
      { path: '/erp/leads/edit/:id', element: <LeadForm /> },
      { path: '/erp/products', element: <ProductList /> },
      { path: '/erp/products/create', element: <ProductForm /> },
      { path: '/erp/products/edit/:id', element: <ProductForm /> },
      { path: '/erp/deals', element: <DealList /> },
      { path: '/erp/deals/create', element: <DealForm /> },
      { path: '/erp/deals/edit/:id', element: <DealForm /> },
      { path: '/erp/deals/view/:id', element: <DealView /> },
      { path: '/erp/terms', element: <TermsList /> },
      { path: '/erp/terms/create', element: <TermsForm /> },
      { path: '/erp/terms/edit/:id', element: <TermsForm /> },
      { path: '/erp/quotations', element: <QuotationList /> },
      { path: '/erp/service-orders', element: <QuotationList /> },
      { path: '/erp/quotations/create', element: <QuotationForm /> },
      { path: '/erp/quotations/view/:id', element: <QuotationView /> },
      { path: '/erp/quotations/edit/:id', element: <QuotationForm /> },
      { path: '/erp/proforma-invoices', element: <ProformaInvoiceList /> },
      { path: '/erp/proforma-invoices/create/:quotationId', element: <ProformaInvoiceCreate /> },
      { path: '/erp/proforma-invoices/view/:id', element: <ProformaInvoiceView /> },
      { path: '/erp/tax-invoices', element: <TaxInvoiceList /> },
      { path: '/erp/tax-invoices/create/:proformaId', element: <TaxInvoiceCreate /> },
      { path: '/erp/tax-invoices/view/:id', element: <TaxInvoiceView /> },
      { path: '/erp/tax-invoices/edit/:id', element: <TaxInvoiceEdit /> },
      { path: '/erp/accounts/expenses', element: <ExpensesList /> },
      { path: '/erp/accounts/expenses/create', element: <ExpenseCreate /> },
      { path: '/erp/accounts/work-orders', element: <AccountsWorkOrderList /> },
      { path: '/erp/accounts/work-orders/view/:id', element: <AccountsWorkOrderView /> },
      { path: '/erp/receivables', element: <ReceivablesList /> },
      { path: '/erp/receivables/aging', element: <AgingSummaryView /> },
      { path: '/erp/payables', element: <PayablesList /> },
      { path: '/erp/payables/aging', element: <PayablesAgingSummaryView /> },
      { path: '/erp/purchase-orders', element: <Navigate to="/erp/client-purchase-quotations" replace /> },
      { path: '/erp/client-purchase-quotations', element: <ClientPurchaseQuotationList /> },
      { path: '/erp/vendor-purchase-quotations', element: <VendorPurchaseQuotationList /> },
      { path: '/erp/purchase-orders/create', element: <PurchaseOrderForm /> },
      { path: '/erp/purchase-orders/view/:id', element: <PurchaseOrderView /> },
      { path: '/erp/purchase-orders/edit/:id', element: <PurchaseOrderForm /> },
      { path: '/erp/client-purchase-orders', element: <ClientPurchaseOrderList /> },
      { path: '/erp/supplier-purchase-orders', element: <SupplierPurchaseOrderList /> },
      { path: '/erp/roles', element: <RoleList /> },
      { path: '/erp/roles/create', element: <RoleForm /> },
      { path: '/erp/roles/edit/:id', element: <RoleForm /> },
      { path: '/erp/users', element: <UserList /> },
      { path: '/erp/users/create', element: <UserForm /> },
      { path: '/erp/users/edit/:id', element: <UserForm /> },
      { path: '/erp/inspection-requests', element: <InspectionRequestList /> },
      { path: '/erp/inspection-requests/:id', element: <InspectionRequestView /> },
      { path: '/erp/work-orders', element: <WorkOrderList /> },
      { path: '/erp/work-orders/create', element: <WorkOrderForm /> },
      { path: '/erp/work-orders/edit/:id', element: <WorkOrderForm /> },
      { path: '/erp/work-orders/view/:id', element: <WorkOrderView /> },
      { path: '/erp/settings/company', element: <CompanySettings /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/auth',
    element: <BlankLayout />,
    children: [
      { path: '404', element: <Error /> },
      { path: '/auth/login', element: <Login /> },
      { path: '/auth/login2', element: <Login2 /> },
      { path: '/auth/register', element: <Register /> },
      { path: '/auth/register2', element: <Register2 /> },
      { path: '/auth/forgot-password', element: <ForgotPassword /> },
      { path: '/auth/forgot-password2', element: <ForgotPassword2 /> },
      { path: '/auth/two-steps', element: <TwoSteps /> },
      { path: '/auth/two-steps2', element: <TwoSteps2 /> },
      { path: '/auth/maintenance', element: <Maintenance /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
]);

export default Router;
