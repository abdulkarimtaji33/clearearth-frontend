import { formatApiErrorMessage } from '../utils/formatApiError';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
    this._refreshPromise = null;
  }

  getUploadUrl(path) {
    if (!path) return null;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `/uploads/${cleanPath}`;
  }

  getAuthToken() {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  setAuthToken(token) {
    localStorage.setItem('accessToken', token);
  }

  setRefreshToken(token) {
    localStorage.setItem('refreshToken', token);
  }

  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  /** Endpoints where 401 means bad credentials / invalid refresh — do not force logout redirect. */
  _isAuthCredentialEndpoint(endpoint) {
    return [
      '/auth/login',
      '/auth/register',
      '/auth/refresh-token',
      '/auth/forgot-password',
      '/auth/reset-password',
    ].some((path) => endpoint.startsWith(path));
  }

  async tryRefreshToken() {
    if (this._refreshPromise) return this._refreshPromise;

    this._refreshPromise = (async () => {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      try {
        const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.data?.accessToken) return false;

        this.setAuthToken(data.data.accessToken);
        if (data.data.refreshToken) {
          this.setRefreshToken(data.data.refreshToken);
        }
        return true;
      } catch {
        return false;
      }
    })();

    try {
      return await this._refreshPromise;
    } finally {
      this._refreshPromise = null;
    }
  }

  _forceLoginRedirect() {
    this.clearTokens();
    if (!window.location.pathname.startsWith('/auth/')) {
      window.location.href = '/auth/login';
    }
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = this.getAuthToken();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && !options._retry && !this._isAuthCredentialEndpoint(endpoint)) {
          const refreshed = await this.tryRefreshToken();
          if (refreshed) {
            return this.request(endpoint, { ...options, _retry: true });
          }
          this._forceLoginRedirect();
        }
        const error = new Error(formatApiErrorMessage(data));
        error.status = response.status;
        error.errors = data.errors || null;
        error.response = data;
        throw error;
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async get(endpoint, params = {}) {
    const safeParams = params && typeof params === 'object' && !Array.isArray(params) ? params : {};
    const clean = Object.fromEntries(
      Object.entries(safeParams).filter(([, v]) => v !== undefined && v !== null && v !== '')
    );
    const queryString = new URLSearchParams(clean).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  // Auth endpoints
  async register(data) {
    const response = await this.post('/auth/register', data);
    if (response.data?.accessToken) {
      this.setAuthToken(response.data.accessToken);
      this.setRefreshToken(response.data.refreshToken);
    }
    return response;
  }

  async login(data) {
    const response = await this.post('/auth/login', data);
    if (response.data?.accessToken) {
      this.setAuthToken(response.data.accessToken);
      this.setRefreshToken(response.data.refreshToken);
    }
    return response;
  }

  async logout() {
    try {
      await this.post('/auth/logout');
    } finally {
      this.clearTokens();
    }
  }

  async getCurrentUser() {
    return this.get('/auth/me');
  }

  async changePassword(data) {
    return this.put('/auth/change-password', data);
  }

  // Contacts
  async getContacts(params) {
    return this.get('/contacts', params);
  }

  async getContact(id) {
    return this.get(`/contacts/${id}`);
  }

  async createContact(data) {
    return this.post('/contacts', data);
  }

  async updateContact(id, data) {
    return this.put(`/contacts/${id}`, data);
  }

  async deleteContact(id) {
    return this.delete(`/contacts/${id}`);
  }

  // Companies
  async getCompanies(params) {
    return this.get('/companies', params);
  }

  async getCompany(id) {
    return this.get(`/companies/${id}`);
  }

  async createCompany(data) {
    return this.post('/companies', data);
  }

  async updateCompany(id, data) {
    return this.put(`/companies/${id}`, data);
  }

  async deleteCompany(id) {
    return this.delete(`/companies/${id}`);
  }

  // Suppliers
  async getSuppliers(params) {
    return this.get('/suppliers', params);
  }

  async getSupplier(id) {
    return this.get(`/suppliers/${id}`);
  }

  async createSupplier(data) {
    return this.post('/suppliers', data);
  }

  async updateSupplier(id, data) {
    return this.put(`/suppliers/${id}`, data);
  }

  async deleteSupplier(id) {
    return this.delete(`/suppliers/${id}`);
  }

  // Leads
  async getLeads(params) {
    return this.get('/leads', params);
  }

  async getLead(id) {
    return this.get(`/leads/${id}`);
  }

  async createLead(data) {
    return this.post('/leads', data);
  }

  async updateLead(id, data) {
    return this.put(`/leads/${id}`, data);
  }

  async deleteLead(id) {
    return this.delete(`/leads/${id}`);
  }

  async qualifyLead(id, data) {
    return this.post(`/leads/${id}/qualify`, data);
  }

  async requestLeadApproval(id) {
    return this.post(`/leads/${id}/request-approval`, {});
  }

  async approveLeadWithPin(id, pin) {
    return this.post(`/leads/${id}/approve-with-pin`, { pin });
  }

  async disqualifyLead(id, data) {
    return this.post(`/leads/${id}/disqualify`, data);
  }

  async convertLead(id, data) {
    return this.post(`/leads/${id}/convert`, data);
  }

  // Products/Services
  async getProducts(params) {
    return this.get('/products', params);
  }

  async getProduct(id) {
    return this.get(`/products/${id}`);
  }

  async createProduct(data) {
    return this.post('/products', data);
  }

  async updateProduct(id, data) {
    return this.put(`/products/${id}`, data);
  }

  async deleteProduct(id) {
    return this.delete(`/products/${id}`);
  }

  // Deals
  async getDeals(params) {
    return this.get('/deals', params);
  }

  async getDeal(id) {
    return this.get(`/deals/${id}`);
  }

  async createDeal(data) {
    return this.post('/deals', data);
  }

  async updateDeal(id, data) {
    return this.put(`/deals/${id}`, data);
  }

  async updateDealCollectionDetails(id, data) {
    return this.patch(`/deals/${id}/collection-details`, data);
  }

  async deleteDeal(id) {
    return this.delete(`/deals/${id}`);
  }

  async approveDeal(id) {
    return this.post(`/deals/${id}/approve`, {});
  }

  async requestDealApproval(id) {
    return this.post(`/deals/${id}/request-approval`, {});
  }

  async approveDealWithPin(id, pin) {
    return this.post(`/deals/${id}/approve-with-pin`, { pin });
  }

  async updateDealPayment(id, paidAmount) {
    return this.post(`/deals/${id}/payment`, { paidAmount });
  }

  async saveInspectionReport(dealId, data) {
    return this.put(`/deals/${dealId}/inspection-report`, data);
  }

  // Inspection Requests
  async getInspectionRequests(params) {
    return this.get('/inspection-requests', params);
  }

  async getInspectionRequest(id) {
    return this.get(`/inspection-requests/${id}`);
  }

  async updateInspectionRequestStatus(id, status) {
    return this.request(`/inspection-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateInspectionRequestPriority(id, priority) {
    return this.request(`/inspection-requests/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    });
  }

  async acceptInspectionRequest(id) {
    return this.post(`/inspection-requests/${id}/accept`, {});
  }

  async rejectInspectionRequest(id, reason) {
    return this.post(`/inspection-requests/${id}/reject`, { reason });
  }

  async getNotifications(params) {
    return this.get('/notifications', params);
  }

  async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, { method: 'PATCH' });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'PATCH' });
  }

  async getInspectors() {
    return this.get('/users/inspectors');
  }

  // Quotations
  async getQuotations(params) {
    return this.get('/quotations', params);
  }

  async getQuotation(id) {
    return this.get(`/quotations/${id}`);
  }

  async createQuotation(data) {
    return this.post('/quotations', data);
  }

  async updateQuotation(id, data) {
    return this.put(`/quotations/${id}`, data);
  }

  async approveQuotation(id) {
    return this.post(`/quotations/${id}/approve`, {});
  }

  async requestQuotationApproval(id) {
    return this.post(`/quotations/${id}/request-approval`, {});
  }

  async approveQuotationWithPin(id, pin) {
    return this.post(`/quotations/${id}/approve-with-pin`, { pin });
  }

  async deleteQuotation(id) {
    return this.delete(`/quotations/${id}`);
  }

  async getProformaPreviewFromQuotation(quotationId) {
    return this.get(`/proforma-invoices/preview-from-quotation/${quotationId}`);
  }

  async getProformaInvoices(params) {
    return this.get('/proforma-invoices', params);
  }

  async getProformaInvoice(id) {
    return this.get(`/proforma-invoices/${id}`);
  }

  async downloadProformaInvoicePdf(id) {
    return this._downloadPdf(`${this.baseURL}/proforma-invoices/${id}/pdf`, `proforma-invoice-${id}.pdf`);
  }

  async createProformaInvoice(data) {
    return this.post('/proforma-invoices', data);
  }

  async updateProformaInvoice(id, data) {
    return this.put(`/proforma-invoices/${id}`, data);
  }

  async deleteProformaInvoice(id) {
    return this.delete(`/proforma-invoices/${id}`);
  }

  async getTaxPreviewFromProforma(proformaInvoiceId) {
    return this.get(`/tax-invoices/preview-from-proforma/${proformaInvoiceId}`);
  }

  async getTaxInvoices(params) {
    return this.get('/tax-invoices', params);
  }

  async getTaxInvoice(id) {
    return this.get(`/tax-invoices/${id}`);
  }

  async downloadTaxInvoicePdf(id) {
    return this._downloadPdf(`${this.baseURL}/tax-invoices/${id}/pdf`, `tax-invoice-${id}.pdf`);
  }

  async createTaxInvoice(data) {
    return this.post('/tax-invoices', data);
  }

  async updateTaxInvoice(id, data) {
    return this.put(`/tax-invoices/${id}`, data);
  }

  async deleteTaxInvoice(id) {
    return this.delete(`/tax-invoices/${id}`);
  }

  async uploadTaxInvoiceAttachment(file) {
    const url = `${this.baseURL}/upload/tax-invoice-attachment`;
    const token = this.getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', body: formData, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }

  async getAccountsWorkOrders(params) {
    return this.get('/accounts/work-orders', params);
  }

  async getAccountsExpenses(params) {
    return this.get('/accounts/expenses', params);
  }

  async createAccountsExpense(data) {
    return this.post('/accounts/expenses', data);
  }

  async patchAccountsExpensePayment(id, data) {
    return this.patch(`/accounts/expenses/${id}/payment`, data);
  }

  async getExpensePayments(id) {
    return this.get(`/accounts/expenses/${id}/payments`);
  }

  async getReceivables(params) {
    return this.get('/receivables', params);
  }

  async postReceivablePayment(id, data) {
    return this.post(`/receivables/${id}/payment`, data);
  }

  async getReceivablePayments(id) {
    return this.get(`/receivables/${id}/payments`);
  }

  async downloadReceivableReceiptPdf(paymentId) {
    return this._downloadPdf(`${this.baseURL}/receivables/payments/${paymentId}/receipt/pdf`, `receipt-${paymentId}.pdf`);
  }

  async downloadStatementOfAccountPdf(companyId, { dateFrom, dateTo } = {}) {
    const qs = new URLSearchParams();
    if (dateFrom) qs.set('dateFrom', dateFrom);
    if (dateTo) qs.set('dateTo', dateTo);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return this._downloadPdf(`${this.baseURL}/receivables/companies/${companyId}/statement/pdf${suffix}`, `statement-of-account-${companyId}.pdf`);
  }

  async getReceivablesAgingSummary(params) {
    return this.get('/receivables/aging-summary', params);
  }

  async getPayables(params) {
    return this.get('/payables', params);
  }

  async postPayablePayment(id, data) {
    return this.post(`/payables/${id}/payment`, data);
  }

  async getPayablePayments(id) {
    return this.get(`/payables/${id}/payments`);
  }

  async getPayablesAgingSummary(params) {
    return this.get('/payables/aging-summary', params);
  }

  async getPurchasePaymentReceipts(params) {
    return this.get('/payables/payment-receipts', params);
  }

  async getPurchasePaymentReceipt(paymentId) {
    return this.get(`/payables/payment-receipts/${paymentId}`);
  }

  async getAccountsWorkOrder(id) {
    return this.get(`/accounts/work-orders/${id}`);
  }

  async approveAccountsTaskExpense(workOrderId, taskExpenseId, data) {
    return this.post(`/accounts/work-orders/${workOrderId}/task-expenses/${taskExpenseId}/approve`, data);
  }

  async rejectAccountsTaskExpense(workOrderId, taskExpenseId, reason) {
    return this.post(`/accounts/work-orders/${workOrderId}/task-expenses/${taskExpenseId}/reject`, { reason });
  }

  _filenameFromContentDisposition(disposition, fallback) {
    if (!disposition || typeof disposition !== 'string') return fallback;
    const m = disposition.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i) || disposition.match(/filename="([^"]+)"/i);
    if (!m?.[1]) return fallback;
    try {
      return decodeURIComponent(m[1].replace(/"/g, '').trim());
    } catch {
      return m[1].replace(/"/g, '').trim() || fallback;
    }
  }

  async _downloadPdf(url, fallbackName) {
    const token = this.getAuthToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const msg = text?.match(/"message":"([^"]+)"/)?.[1] || 'Failed to download PDF';
      throw new Error(msg);
    }
    const blob = await res.blob();
    if (blob.type !== 'application/pdf' || blob.size < 100) {
      const text = await blob.text();
      const err = text?.match(/"message":"([^"]+)"/)?.[1] || 'Invalid PDF response';
      throw new Error(err);
    }
    const fname = this._filenameFromContentDisposition(res.headers.get('Content-Disposition'), fallbackName);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async downloadQuotationPdf(id, { documentType } = {}) {
    const qs = documentType ? `?documentType=${encodeURIComponent(documentType)}` : '';
    const url = `${this.baseURL}/quotations/${id}/pdf${qs}`;
    const token = this.getAuthToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const msg = text?.match(/"message":"([^"]+)"/)?.[1] || 'Failed to download PDF';
      throw new Error(msg);
    }
    const blob = await res.blob();
    if (blob.type !== 'application/pdf' || blob.size < 100) {
      const text = await blob.text();
      const err = text?.match(/"message":"([^"]+)"/)?.[1] || 'Invalid PDF response';
      throw new Error(err);
    }
    const fname = this._filenameFromContentDisposition(res.headers.get('Content-Disposition'), `quotation-${id}.pdf`);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Purchase Orders
  async getPurchaseOrders(params) {
    return this.get('/purchase-orders', params);
  }

  async getPurchaseOrder(id) {
    return this.get(`/purchase-orders/${id}`);
  }

  async createPurchaseOrder(data) {
    return this.post('/purchase-orders', data);
  }

  async updatePurchaseOrder(id, data) {
    return this.put(`/purchase-orders/${id}`, data);
  }

  async approvePurchaseOrder(id) {
    return this.post(`/purchase-orders/${id}/approve`, {});
  }

  async requestPurchaseOrderApproval(id) {
    return this.post(`/purchase-orders/${id}/request-approval`, {});
  }

  async approvePurchaseOrderWithPin(id, pin) {
    return this.post(`/purchase-orders/${id}/approve-with-pin`, { pin });
  }

  async deletePurchaseOrder(id) {
    return this.delete(`/purchase-orders/${id}`);
  }

  async downloadPurchaseOrderPdf(id, { documentType } = {}) {
    const qs = documentType ? `?documentType=${encodeURIComponent(documentType)}` : '';
    const url = `${this.baseURL}/purchase-orders/${id}/pdf${qs}`;
    const token = this.getAuthToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const msg = text?.match(/"message":"([^"]+)"/)?.[1] || 'Failed to download PDF';
      throw new Error(msg);
    }
    const blob = await res.blob();
    if (blob.type !== 'application/pdf' || blob.size < 100) {
      const text = await blob.text();
      const err = text?.match(/"message":"([^"]+)"/)?.[1] || 'Invalid PDF response';
      throw new Error(err);
    }
    const fname = this._filenameFromContentDisposition(res.headers.get('Content-Disposition'), `purchase-order-${id}.pdf`);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // Terms and Conditions
  async getTermsAndConditions(params) {
    return this.get('/terms', params);
  }

  async getTermsAndConditionsById(id) {
    return this.get(`/terms/${id}`);
  }

  async createTermsAndConditions(data) {
    return this.post('/terms', data);
  }

  async updateTermsAndConditions(id, data) {
    return this.put(`/terms/${id}`, data);
  }

  async deleteTermsAndConditions(id) {
    return this.delete(`/terms/${id}`);
  }

  // Material Types
  async getMaterialTypes() {
    return this.get('/material-types');
  }

  async uploadDealImage(file) {
    const url = `${this.baseURL}/upload/deal-image`;
    const token = this.getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', body: formData, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }

  async uploadWdsAttachment(file) {
    const url = `${this.baseURL}/upload/wds-attachment`;
    const token = this.getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', body: formData, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }

  async uploadCompanyDocument(file) {
    const url = `${this.baseURL}/upload/company-document`;
    const token = this.getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', body: formData, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }

  async uploadInspectionDocument(file) {
    const url = `${this.baseURL}/upload/inspection-document`;
    const token = this.getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', body: formData, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }

  async uploadExpenseEvidence(file) {
    const url = `${this.baseURL}/upload/expense-evidence`;
    const token = this.getAuthToken();
    const formData = new FormData();
    formData.append('file', file);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', body: formData, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed');
    return data;
  }

  // Tenants (Company Settings)
  async getTenant() {
    return this.get('/tenants/me');
  }

  async getPublicLogo() {
    const url = `${this.baseURL}/tenants/logo`;
    const res = await fetch(url);
    return res.json();
  }

  async updateTenant(data) {
    return this.put('/tenants/me', data);
  }

  async updateLeadApprovalPin(pin) {
    return this.put('/tenants/me/lead-approval-pin', { pin });
  }

  async uploadTenantLogo(file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.post('/upload/tenant-logo', formData);
  }

  // Dropdowns
  async getAllDropdowns() {
    return this.get('/dropdowns/all');
  }

  async getDropdownsByCategory(category) {
    return this.get(`/dropdowns/category/${category}`);
  }

  async createDropdown(data) {
    return this.post('/dropdowns', data);
  }

  async updateDropdown(id, data) {
    return this.put(`/dropdowns/${id}`, data);
  }

  async deleteDropdown(id) {
    return this.delete(`/dropdowns/${id}`);
  }

  // Users (for admin)
  async getUsers(params) {
    return this.get('/users', params);
  }

  async getAssignees() {
    return this.get('/users/assignees');
  }

  async getDrivers() {
    return this.get('/users/drivers');
  }

  async getUser(id) {
    return this.get(`/users/${id}`);
  }

  async createUser(data) {
    return this.post('/users', data);
  }

  async updateUser(id, data) {
    return this.put(`/users/${id}`, data);
  }

  async changeUserPassword(id, password) {
    return this.put(`/users/${id}/password`, { password });
  }

  async deleteUser(id) {
    return this.delete(`/users/${id}`);
  }

  // Roles
  async getRoles(params) {
    return this.get('/roles', params);
  }

  async getRole(id) {
    return this.get(`/roles/${id}`);
  }

  async createRole(data) {
    return this.post('/roles', data);
  }

  async updateRole(id, data) {
    return this.put(`/roles/${id}`, data);
  }

  // Work Orders
  async getWorkOrders(params) {
    return this.get('/work-orders', params);
  }

  async getWorkOrder(id) {
    return this.get(`/work-orders/${id}`);
  }

  async createWorkOrder(data) {
    return this.post('/work-orders', data);
  }

  async updateWorkOrder(id, data) {
    return this.put(`/work-orders/${id}`, data);
  }

  async deleteWorkOrder(id) {
    return this.delete(`/work-orders/${id}`);
  }

  async updateWorkOrderTaskStatus(workOrderId, taskId, status) {
    return this.request(`/work-orders/${workOrderId}/tasks/${taskId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async updateWorkOrderTaskNotes(workOrderId, taskId, notes) {
    return this.request(`/work-orders/${workOrderId}/tasks/${taskId}/notes`, {
      method: 'PATCH',
      body: JSON.stringify({ notes }),
    });
  }

  async updateWorkOrderTaskAssignment(workOrderId, taskId, assignedTo) {
    return this.request(`/work-orders/${workOrderId}/tasks/${taskId}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedTo }),
    });
  }

  async getWorkTypes(params) {
    return this.get('/work-types', params);
  }

  async getWorkType(id) {
    return this.get(`/work-types/${id}`);
  }

  async createWorkType(data) {
    return this.post('/work-types', data);
  }

  async updateWorkType(id, data) {
    return this.put(`/work-types/${id}`, data);
  }

  async deleteWorkType(id) {
    return this.delete(`/work-types/${id}`);
  }

  async getExpenseCategories(params) {
    return this.get('/expense-categories', params);
  }

  async createExpenseCategory(data) {
    return this.post('/expense-categories', data);
  }

  async getGrns(params) {
    return this.get('/grn', params);
  }

  async getGrn(id) {
    return this.get(`/grn/${id}`);
  }

  async createGrn(data) {
    return this.post('/grn', data);
  }

  async updateGrn(id, data) {
    return this.patch(`/grn/${id}`, data);
  }

  async approveGrn(id) {
    return this.post(`/grn/${id}/approve`);
  }

  async downloadGrnPdf(id) {
    const url = `${this.baseURL}/grn/${id}/pdf`;
    const token = this.getAuthToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      const msg = text?.match(/"message":"([^"]+)"/)?.[1] || 'Failed to download GRN report';
      throw new Error(msg);
    }
    const blob = await res.blob();
    if (blob.type !== 'application/pdf' || blob.size < 100) {
      const text = await blob.text();
      const err = text?.match(/"message":"([^"]+)"/)?.[1] || 'Invalid PDF response';
      throw new Error(err);
    }
    const fname = this._filenameFromContentDisposition(res.headers.get('Content-Disposition'), `grn-${id}.pdf`);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fname;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async getDashboardOverview() {
    return this.get('/dashboard/overview');
  }

  async getDriverPickups() {
    return this.get('/driver/pickups');
  }

  async getDriverPickup(taskId) {
    return this.get(`/driver/pickups/${taskId}`);
  }

  async startDriverPickup(taskId) {
    return this.post(`/driver/pickups/${taskId}/start`);
  }

  async completeDriverPickup(taskId) {
    return this.post(`/driver/pickups/${taskId}/complete`);
  }

  async completeDriverPickupWithData(taskId, formData) {
    const url = `${this.baseURL}/driver/pickups/${taskId}/complete`;
    const token = this.getAuthToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, { method: 'POST', body: formData, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to confirm pickup');
    return data;
  }

  async assignRolePermissions(roleId, permissionIds) {
    return this.post(`/roles/${roleId}/permissions`, { permissions: permissionIds });
  }

  async getAllPermissions() {
    return this.get('/roles/permissions/all');
  }

  async deleteRole(id) {
    return this.delete(`/roles/${id}`);
  }

  // ─── Fiscal Years ────────────────────────────────────────────────────────────
  async getFiscalYears() { return this.get('/fiscal-years'); }
  async createFiscalYear(data) { return this.post('/fiscal-years', data); }
  async closeFiscalYear(id) { return this.post(`/fiscal-years/${id}/close`); }
  async getFiscalYearPeriods(fyId) { return this.get(`/fiscal-years/${fyId}/periods`); }
  async closePeriod(fyId, periodId) { return this.post(`/fiscal-years/${fyId}/periods/${periodId}/close`); }
  async reopenPeriod(fyId, periodId) { return this.post(`/fiscal-years/${fyId}/periods/${periodId}/reopen`); }

  // ─── Chart of Accounts ───────────────────────────────────────────────────────
  async getChartOfAccounts(params) { return this.get('/chart-of-accounts', params); }
  async getChartOfAccount(id) { return this.get(`/chart-of-accounts/${id}`); }
  async createChartOfAccount(data) { return this.post('/chart-of-accounts', data); }
  async updateChartOfAccount(id, data) { return this.put(`/chart-of-accounts/${id}`, data); }
  async deleteChartOfAccount(id) { return this.delete(`/chart-of-accounts/${id}`); }
  async seedChartOfAccounts() { return this.post('/chart-of-accounts/seed'); }

  // ─── Journal ─────────────────────────────────────────────────────────────────
  async getJournalEntries(params) { return this.get('/journal', params); }
  async getJournalEntry(id) { return this.get(`/journal/${id}`); }
  async createJournalEntry(data) { return this.post('/journal', data); }
  async postOpeningBalances(data) { return this.post('/journal/opening-balances', data); }
  async voidJournalEntry(id) { return this.post(`/journal/${id}/void`); }

  // ─── Financial Reports ────────────────────────────────────────────────────────
  async getTrialBalance(params) { return this.get('/reports/trial-balance', params); }
  async getGeneralLedger(params) { return this.get('/reports/general-ledger', params); }
  async getIncomeStatement(params) { return this.get('/reports/income-statement', params); }
  async getBalanceSheet(params) { return this.get('/reports/balance-sheet', params); }
  async getCashFlowStatement(params) { return this.get('/reports/cash-flow', params); }
  async getChangesInEquity(params) { return this.get('/reports/changes-in-equity', params); }
  async getVatReport(params) { return this.get('/reports/vat-report', params); }

  // ─── Location Share ────────────────────────────────────────────────────────────
  async generateLocationShareToken(dealId) { return this.post(`/location-share/deals/${dealId}/token`); }
  async getLocationShareInfo(token) { return this.get(`/location-share/pin/${token}`); }
  async submitClientLocation(token, pickupLocation) { return this.post(`/location-share/pin/${token}`, { pickupLocation }); }
}

const apiService = new ApiService();
export default apiService;
