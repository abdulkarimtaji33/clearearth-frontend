const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  getUploadUrl(path) {
    if (!path) return null;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    return `/uploads/${cleanPath}`;
  }

  getAuthToken() {
    return localStorage.getItem('accessToken');
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
        if (response.status === 401) {
          this.clearTokens();
          window.location.href = '/auth/login';
        }
        const error = new Error(data.message || 'API request failed');
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

  async downloadQuotationPdf(id) {
    const url = `${this.baseURL}/quotations/${id}/pdf`;
    const token = this.getAuthToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to download PDF');
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

  async deletePurchaseOrder(id) {
    return this.delete(`/purchase-orders/${id}`);
  }

  async downloadPurchaseOrderPdf(id) {
    const url = `${this.baseURL}/purchase-orders/${id}/pdf`;
    const token = this.getAuthToken();
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('Failed to download PDF');
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

  async getDashboardOverview() {
    return this.get('/dashboard/overview');
  }

  async getDriverPickups() {
    return this.get('/driver/pickups');
  }

  async startDriverPickup(taskId) {
    return this.post(`/driver/pickups/${taskId}/start`);
  }

  async completeDriverPickup(taskId) {
    return this.post(`/driver/pickups/${taskId}/complete`);
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
