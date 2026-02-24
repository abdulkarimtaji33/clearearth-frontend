import React, { lazy } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';

import Loadable from '../layouts/full/shared/loadable/Loadable';

/* ***Layouts**** */
const FullLayout = Loadable(lazy(() => import('../layouts/full/FullLayout')));
const BlankLayout = Loadable(lazy(() => import('../layouts/blank/BlankLayout')));

/* ****ERP Pages***** */
const ContactList = Loadable(lazy(() => import('../views/erp/contacts/ContactList')));
const ContactForm = Loadable(lazy(() => import('../views/erp/contacts/ContactForm')));
const CompanyList = Loadable(lazy(() => import('../views/erp/companies/CompanyList')));
const CompanyForm = Loadable(lazy(() => import('../views/erp/companies/CompanyForm')));
const CompanyView = Loadable(lazy(() => import('../views/erp/companies/CompanyView')));
const SupplierList = Loadable(lazy(() => import('../views/erp/suppliers/SupplierList')));
const SupplierForm = Loadable(lazy(() => import('../views/erp/suppliers/SupplierForm')));
const LeadList = Loadable(lazy(() => import('../views/erp/leads/LeadList')));
const LeadForm = Loadable(lazy(() => import('../views/erp/leads/LeadForm')));
const ProductList = Loadable(lazy(() => import('../views/erp/products/ProductList')));
const ProductForm = Loadable(lazy(() => import('../views/erp/products/ProductForm')));
const DealList = Loadable(lazy(() => import('../views/erp/deals/DealList')));
const DealForm = Loadable(lazy(() => import('../views/erp/deals/DealForm')));
const DealView = Loadable(lazy(() => import('../views/erp/deals/DealView')));
const TermsList = Loadable(lazy(() => import('../views/erp/terms/TermsList')));
const TermsForm = Loadable(lazy(() => import('../views/erp/terms/TermsForm')));

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
      { path: '/', element: <Navigate to="/erp/leads" /> },
      { path: '/erp', element: <Navigate to="/erp/leads" /> },
      { path: '/erp/contacts', element: <ContactList /> },
      { path: '/erp/contacts/create', element: <ContactForm /> },
      { path: '/erp/contacts/edit/:id', element: <ContactForm /> },
      { path: '/erp/companies', element: <CompanyList /> },
      { path: '/erp/companies/create', element: <CompanyForm /> },
      { path: '/erp/companies/edit/:id', element: <CompanyForm /> },
      { path: '/erp/companies/view/:id', element: <CompanyView /> },
      { path: '/erp/suppliers', element: <SupplierList /> },
      { path: '/erp/suppliers/create', element: <SupplierForm /> },
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
