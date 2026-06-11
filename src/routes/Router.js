import React from 'react';
import { Navigate, createBrowserRouter } from 'react-router';

import Loadable, { lazyWithChunkReload } from '../layouts/full/shared/loadable/Loadable';
import ChunkLoadErrorElement from '../components/ChunkLoadErrorElement';
import RequireAdmin from '../components/auth/RequireAdmin';

/* ***Layouts**** */
const FullLayout = Loadable(lazyWithChunkReload(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazyWithChunkReload(() => import('../layouts/blank/BlankLayout')));

/* ****ERP Pages***** */
const Dashboard = Loadable(lazyWithChunkReload(() => import('../views/erp/dashboard/DashboardRouter')));
const ContactList = Loadable(lazyWithChunkReload(() => import('../views/erp/contacts/ContactList')));
const ContactForm = Loadable(lazyWithChunkReload(() => import('../views/erp/contacts/ContactForm')));
const CompanyList = Loadable(lazyWithChunkReload(() => import('../views/erp/companies/CompanyList')));
const CompanyForm = Loadable(lazyWithChunkReload(() => import('../views/erp/companies/CompanyForm')));
const CompanyView = Loadable(lazyWithChunkReload(() => import('../views/erp/companies/CompanyView')));
const SupplierList = Loadable(lazyWithChunkReload(() => import('../views/erp/suppliers/SupplierList')));
const SupplierForm = Loadable(lazyWithChunkReload(() => import('../views/erp/suppliers/SupplierForm')));
const SupplierView = Loadable(lazyWithChunkReload(() => import('../views/erp/suppliers/SupplierView')));
const LeadList = Loadable(lazyWithChunkReload(() => import('../views/erp/leads/LeadList')));
const LeadForm = Loadable(lazyWithChunkReload(() => import('../views/erp/leads/LeadForm')));
const ProductList = Loadable(lazyWithChunkReload(() => import('../views/erp/products/ProductList')));
const ProductForm = Loadable(lazyWithChunkReload(() => import('../views/erp/products/ProductForm')));
const DealList = Loadable(lazyWithChunkReload(() => import('../views/erp/deals/DealList')));
const DealForm = Loadable(lazyWithChunkReload(() => import('../views/erp/deals/DealForm')));
const DealView = Loadable(lazyWithChunkReload(() => import('../views/erp/deals/DealView')));
const TermsList = Loadable(lazyWithChunkReload(() => import('../views/erp/terms/TermsList')));
const TermsForm = Loadable(lazyWithChunkReload(() => import('../views/erp/terms/TermsForm')));
const QuotationList = Loadable(lazyWithChunkReload(() => import('../views/erp/quotations/QuotationList')));
const QuotationForm = Loadable(lazyWithChunkReload(() => import('../views/erp/quotations/QuotationForm')));
const QuotationView = Loadable(lazyWithChunkReload(() => import('../views/erp/quotations/QuotationView')));
const ProformaInvoiceList = Loadable(lazyWithChunkReload(() => import('../views/erp/proforma-invoices/ProformaInvoiceList')));
const ProformaInvoiceCreate = Loadable(lazyWithChunkReload(() => import('../views/erp/proforma-invoices/ProformaInvoiceCreate')));
const ProformaInvoiceView = Loadable(lazyWithChunkReload(() => import('../views/erp/proforma-invoices/ProformaInvoiceView')));
const TaxInvoiceList = Loadable(lazyWithChunkReload(() => import('../views/erp/tax-invoices/TaxInvoiceList')));
const TaxInvoiceCreate = Loadable(lazyWithChunkReload(() => import('../views/erp/tax-invoices/TaxInvoiceCreate')));
const TaxInvoiceView = Loadable(lazyWithChunkReload(() => import('../views/erp/tax-invoices/TaxInvoiceView')));
const TaxInvoiceEdit = Loadable(lazyWithChunkReload(() => import('../views/erp/tax-invoices/TaxInvoiceEdit')));
const AccountsWorkOrderList = Loadable(lazyWithChunkReload(() => import('../views/erp/accounts/AccountsWorkOrderList')));
const AccountsWorkOrderView = Loadable(lazyWithChunkReload(() => import('../views/erp/accounts/AccountsWorkOrderView')));
const ExpensesList = Loadable(lazyWithChunkReload(() => import('../views/erp/accounts/ExpensesList')));
const ExpenseCreate = Loadable(lazyWithChunkReload(() => import('../views/erp/accounts/ExpenseCreate')));
const ReceivablesList = Loadable(lazyWithChunkReload(() => import('../views/erp/receivables/ReceivablesList')));
const AgingSummaryView = Loadable(lazyWithChunkReload(() => import('../views/erp/receivables/AgingSummaryView')));
const PayablesList = Loadable(lazyWithChunkReload(() => import('../views/erp/payables/PayablesList')));
const PayablesAgingSummaryView = Loadable(lazyWithChunkReload(() => import('../views/erp/payables/PayablesAgingSummaryView')));
const PurchaseOrderForm = Loadable(lazyWithChunkReload(() => import('../views/erp/purchase-orders/PurchaseOrderForm')));
const PurchaseOrderView = Loadable(lazyWithChunkReload(() => import('../views/erp/purchase-orders/PurchaseOrderView')));
const ClientPurchaseQuotationList = Loadable(lazyWithChunkReload(() => import('../views/erp/purchase-orders/ClientPurchaseQuotationList')));
const VendorPurchaseQuotationList = Loadable(lazyWithChunkReload(() => import('../views/erp/purchase-orders/VendorPurchaseQuotationList')));
const ClientPurchaseOrderList = Loadable(lazyWithChunkReload(() => import('../views/erp/purchase-orders/ClientPurchaseOrderList')));
const SupplierPurchaseOrderList = Loadable(lazyWithChunkReload(() => import('../views/erp/purchase-orders/SupplierPurchaseOrderList')));
const RoleList = Loadable(lazyWithChunkReload(() => import('../views/erp/roles/RoleList')));
const RoleForm = Loadable(lazyWithChunkReload(() => import('../views/erp/roles/RoleForm')));
const UserList = Loadable(lazyWithChunkReload(() => import('../views/erp/users/UserList')));
const UserForm = Loadable(lazyWithChunkReload(() => import('../views/erp/users/UserForm')));
const InspectionRequestList = Loadable(lazyWithChunkReload(() => import('../views/erp/inspection-requests/InspectionRequestList')));
const InspectionRequestView = Loadable(lazyWithChunkReload(() => import('../views/erp/inspection-requests/InspectionRequestView')));
const WorkOrderList = Loadable(lazyWithChunkReload(() => import('../views/erp/work-orders/WorkOrderList')));
const WorkOrderForm = Loadable(lazyWithChunkReload(() => import('../views/erp/work-orders/WorkOrderForm')));
const WorkOrderView = Loadable(lazyWithChunkReload(() => import('../views/erp/work-orders/WorkOrderView')));
const CompanySettings = Loadable(lazyWithChunkReload(() => import('../views/erp/settings/CompanySettings')));
const FiscalYearManager = Loadable(lazyWithChunkReload(() => import('../views/erp/reports/FiscalYearManager')));
const ChartOfAccountsList = Loadable(lazyWithChunkReload(() => import('../views/erp/reports/ChartOfAccountsList')));
const OpeningBalancesForm = Loadable(lazyWithChunkReload(() => import('../views/erp/reports/OpeningBalancesForm')));
const JournalList = Loadable(lazyWithChunkReload(() => import('../views/erp/reports/JournalList')));
const JournalEntryView = Loadable(lazyWithChunkReload(() => import('../views/erp/reports/JournalEntryView')));
const JournalEntryCreate = Loadable(lazyWithChunkReload(() => import('../views/erp/reports/JournalEntryCreate')));
const GeneralLedgerView = Loadable(lazyWithChunkReload(() => import('../views/erp/reports/GeneralLedgerView')));
const DriverPickupTaskView = Loadable(lazyWithChunkReload(() => import('../views/erp/driver/DriverPickupTaskView')));
const GrnList = Loadable(lazyWithChunkReload(() => import('../views/erp/grn/GrnList')));
const GrnForm = Loadable(lazyWithChunkReload(() => import('../views/erp/grn/GrnForm')));
const GrnView = Loadable(lazyWithChunkReload(() => import('../views/erp/grn/GrnView')));
const TrialBalanceView = Loadable(lazyWithChunkReload(() => import('../views/erp/reports/TrialBalanceView')));
const IncomeStatementView = Loadable(lazyWithChunkReload(() => import('../views/erp/reports/IncomeStatementView')));
const BalanceSheetView = Loadable(lazyWithChunkReload(() => import('../views/erp/reports/BalanceSheetView')));
const CashFlowView = Loadable(lazyWithChunkReload(() => import('../views/erp/reports/CashFlowView')));
const ChangesInEquityView = Loadable(lazyWithChunkReload(() => import('../views/erp/reports/ChangesInEquityView')));
const VatReportView = Loadable(lazyWithChunkReload(() => import('../views/erp/reports/VatReportView')));

// Public pages (no auth required)
const ClientLocationPicker = Loadable(lazyWithChunkReload(() => import('../views/public/ClientLocationPicker')));

// authentication
const Login = Loadable(lazyWithChunkReload(() => import('../views/authentication/auth1/Login')));
const Login2 = Loadable(lazyWithChunkReload(() => import('../views/authentication/auth2/Login2')));
const Register = Loadable(lazyWithChunkReload(() => import('../views/authentication/auth1/Register')));
const Register2 = Loadable(lazyWithChunkReload(() => import('../views/authentication/auth2/Register2')));
const ForgotPassword = Loadable(lazyWithChunkReload(() => import('../views/authentication/auth1/ForgotPassword')));
const ForgotPassword2 = Loadable(lazyWithChunkReload(() => import('../views/authentication/auth2/ForgotPassword2')));
const TwoSteps = Loadable(lazyWithChunkReload(() => import('../views/authentication/auth1/TwoSteps')));
const TwoSteps2 = Loadable(lazyWithChunkReload(() => import('../views/authentication/auth2/TwoSteps2')));
const Error = Loadable(lazyWithChunkReload(() => import('../views/authentication/Error')));
const Maintenance = Loadable(lazyWithChunkReload(() => import('../views/authentication/Maintenance')));

const Router = createBrowserRouter([
  {
    path: '/',
    element: <FullLayout />,
    errorElement: <ChunkLoadErrorElement />,
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
      { path: '/erp/roles', element: <RequireAdmin><RoleList /></RequireAdmin> },
      { path: '/erp/roles/create', element: <RequireAdmin><RoleForm /></RequireAdmin> },
      { path: '/erp/roles/edit/:id', element: <RequireAdmin><RoleForm /></RequireAdmin> },
      { path: '/erp/users', element: <RequireAdmin><UserList /></RequireAdmin> },
      { path: '/erp/users/create', element: <RequireAdmin><UserForm /></RequireAdmin> },
      { path: '/erp/users/edit/:id', element: <RequireAdmin><UserForm /></RequireAdmin> },
      { path: '/erp/inspection-requests', element: <InspectionRequestList /> },
      { path: '/erp/inspection-requests/:id', element: <InspectionRequestView /> },
      { path: '/erp/work-orders', element: <WorkOrderList /> },
      { path: '/erp/work-orders/create', element: <WorkOrderForm /> },
      { path: '/erp/work-orders/edit/:id', element: <WorkOrderForm /> },
      { path: '/erp/work-orders/view/:id', element: <WorkOrderView /> },
      { path: '/erp/driver/pickups/:taskId', element: <DriverPickupTaskView /> },
      { path: '/erp/grn', element: <GrnList /> },
      { path: '/erp/grn/create', element: <GrnForm /> },
      { path: '/erp/grn/edit/:id', element: <GrnForm /> },
      { path: '/erp/grn/view/:id', element: <GrnView /> },
      { path: '/erp/settings/company', element: <RequireAdmin><CompanySettings /></RequireAdmin> },
      { path: '/erp/settings/fiscal-years', element: <FiscalYearManager /> },
      { path: '/erp/chart-of-accounts', element: <ChartOfAccountsList /> },
      { path: '/erp/journal', element: <JournalList /> },
      { path: '/erp/journal/opening-balances', element: <OpeningBalancesForm /> },
      { path: '/erp/journal/create', element: <JournalEntryCreate /> },
      { path: '/erp/journal/view/:id', element: <JournalEntryView /> },
      { path: '/erp/reports/general-ledger', element: <GeneralLedgerView /> },
      { path: '/erp/reports/trial-balance', element: <TrialBalanceView /> },
      { path: '/erp/reports/income-statement', element: <IncomeStatementView /> },
      { path: '/erp/reports/balance-sheet', element: <BalanceSheetView /> },
      { path: '/erp/reports/cash-flow', element: <CashFlowView /> },
      { path: '/erp/reports/changes-in-equity', element: <ChangesInEquityView /> },
      { path: '/erp/reports/vat-report', element: <VatReportView /> },
      { path: '*', element: <Navigate to="/auth/404" /> },
    ],
  },
  {
    path: '/location-pin/:token',
    element: <ClientLocationPicker />,
    errorElement: <ChunkLoadErrorElement />,
  },
  {
    path: '/auth',
    element: <BlankLayout />,
    errorElement: <ChunkLoadErrorElement />,
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
