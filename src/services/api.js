const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
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
        // Create enhanced error with validation details
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
    const queryString = new URLSearchParams(params).toString();
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

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE',
    });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
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

  // Dashboard
  async getDashboardData() {
    return this.get('/dashboard/overview');
  }

  async getAnalytics(params) {
    return this.get('/dashboard/analytics', params);
  }

  // Clients
  async getClients(params) {
    return this.get('/clients', params);
  }

  async getClient(id) {
    return this.get(`/clients/${id}`);
  }

  async createClient(data) {
    return this.post('/clients', data);
  }

  async updateClient(id, data) {
    return this.put(`/clients/${id}`, data);
  }

  async approveClient(id) {
    return this.post(`/clients/${id}/approve`);
  }

  async deactivateClient(id) {
    return this.post(`/clients/${id}/deactivate`);
  }

  async activateClient(id) {
    return this.post(`/clients/${id}/activate`);
  }

  async deleteClient(id) {
    return this.delete(`/clients/${id}`);
  }

  async getClientStatistics(id) {
    return this.get(`/clients/${id}/statistics`);
  }

  // Vendors
  async getVendors(params) {
    return this.get('/vendors', params);
  }

  async getVendor(id) {
    return this.get(`/vendors/${id}`);
  }

  async createVendor(data) {
    return this.post('/vendors', data);
  }

  async updateVendor(id, data) {
    return this.put(`/vendors/${id}`, data);
  }

  async approveVendor(id) {
    return this.post(`/vendors/${id}/approve`);
  }

  async deactivateVendor(id) {
    return this.post(`/vendors/${id}/deactivate`);
  }

  async activateVendor(id) {
    return this.post(`/vendors/${id}/activate`);
  }

  async deleteVendor(id) {
    return this.delete(`/vendors/${id}`);
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

  async qualifyLead(id, data) {
    return this.post(`/leads/${id}/qualify`, data);
  }

  async disqualifyLead(id, data) {
    return this.post(`/leads/${id}/disqualify`, data);
  }

  async convertLead(id, data) {
    return this.post(`/leads/${id}/convert`, data);
  }

  async deleteLead(id) {
    return this.delete(`/leads/${id}`);
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

  async moveDealStage(id, data) {
    return this.post(`/deals/${id}/move-stage`, data);
  }

  async finalizeDeal(id, data) {
    return this.post(`/deals/${id}/finalize`, data);
  }

  async deleteDeal(id) {
    return this.delete(`/deals/${id}`);
  }

  async getDealStatistics() {
    return this.get('/deals/statistics');
  }

  // Products
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

  async approveProduct(id) {
    return this.post(`/products/${id}/approve`);
  }

  async deleteProduct(id) {
    return this.delete(`/products/${id}`);
  }

  // Services
  async getServices(params) {
    return this.get('/services', params);
  }

  async getService(id) {
    return this.get(`/services/${id}`);
  }

  async createService(data) {
    return this.post('/services', data);
  }

  async updateService(id, data) {
    return this.put(`/services/${id}`, data);
  }

  async approveService(id) {
    return this.post(`/services/${id}/approve`);
  }

  async deleteService(id) {
    return this.delete(`/services/${id}`);
  }

  // Warehouses
  async getWarehouses(params) {
    return this.get('/warehouses', params);
  }

  async getWarehouse(id) {
    return this.get(`/warehouses/${id}`);
  }

  async createWarehouse(data) {
    return this.post('/warehouses', data);
  }

  async updateWarehouse(id, data) {
    return this.put(`/warehouses/${id}`, data);
  }

  async deleteWarehouse(id) {
    return this.delete(`/warehouses/${id}`);
  }

  // Inventory
  async getInventory(params) {
    return this.get('/inventory', params);
  }

  async getLots(params) {
    return this.get('/inventory/lots', params);
  }

  async getLot(id) {
    return this.get(`/inventory/lots/${id}`);
  }

  async createLot(data) {
    return this.post('/inventory/lots', data);
  }

  async updateLot(id, data) {
    return this.put(`/inventory/lots/${id}`, data);
  }

  async adjustLotQuantity(id, data) {
    return this.post(`/inventory/lots/${id}/adjust`, data);
  }

  async closeLot(id) {
    return this.post(`/inventory/lots/${id}/close`);
  }

  async getStockMovements(params) {
    return this.get('/inventory/movements', params);
  }

  async getInventoryValuation(params) {
    return this.get('/inventory/valuation', params);
  }

  // Jobs
  async getJobs(params) {
    return this.get('/jobs', params);
  }

  async getJob(id) {
    return this.get(`/jobs/${id}`);
  }

  async createJob(data) {
    return this.post('/jobs', data);
  }

  async updateJob(id, data) {
    return this.put(`/jobs/${id}`, data);
  }

  async updateJobStatus(id, status) {
    return this.put(`/jobs/${id}/status`, { status });
  }

  async deleteJob(id) {
    return this.delete(`/jobs/${id}`);
  }

  // Invoices
  async getInvoices(params) {
    return this.get('/invoices', params);
  }

  async getInvoice(id) {
    return this.get(`/invoices/${id}`);
  }

  async createInvoice(data) {
    return this.post('/invoices', data);
  }

  async updateInvoice(id, data) {
    return this.put(`/invoices/${id}`, data);
  }

  async approveInvoice(id) {
    return this.post(`/invoices/${id}/approve`);
  }

  async recordPayment(id, data) {
    return this.post(`/invoices/${id}/payment`, data);
  }

  async cancelInvoice(id) {
    return this.post(`/invoices/${id}/cancel`);
  }

  async deleteInvoice(id) {
    return this.delete(`/invoices/${id}`);
  }

  async getInvoiceStatistics(params) {
    return this.get('/invoices/statistics', params);
  }

  // Payments
  async getPayments(params) {
    return this.get('/payments', params);
  }

  async getPayment(id) {
    return this.get(`/payments/${id}`);
  }

  async createPayment(data) {
    return this.post('/payments', data);
  }

  async updateChequeStatus(chequeId, data) {
    return this.post(`/payments/cheques/${chequeId}/status`, data);
  }

  async getPostDatedCheques() {
    return this.get('/payments/cheques/postdated');
  }

  async deletePayment(id) {
    return this.delete(`/payments/${id}`);
  }

  // Employees
  async getEmployees(params) {
    return this.get('/employees', params);
  }

  async getEmployee(id) {
    return this.get(`/employees/${id}`);
  }

  async createEmployee(data) {
    return this.post('/employees', data);
  }

  async updateEmployee(id, data) {
    return this.put(`/employees/${id}`, data);
  }

  async terminateEmployee(id, data) {
    return this.post(`/employees/${id}/terminate`, data);
  }

  async deleteEmployee(id) {
    return this.delete(`/employees/${id}`);
  }

  // Vehicles
  async getVehicles(params) {
    return this.get('/vehicles', params);
  }

  async getVehicle(id) {
    return this.get(`/vehicles/${id}`);
  }

  async createVehicle(data) {
    return this.post('/vehicles', data);
  }

  async updateVehicle(id, data) {
    return this.put(`/vehicles/${id}`, data);
  }

  async updateVehicleStatus(id, status) {
    return this.put(`/vehicles/${id}/status`, { status });
  }

  async addFuelLog(id, data) {
    return this.post(`/vehicles/${id}/fuel-log`, data);
  }

  async addMaintenanceLog(id, data) {
    return this.post(`/vehicles/${id}/maintenance-log`, data);
  }

  async deleteVehicle(id) {
    return this.delete(`/vehicles/${id}`);
  }

  // Documents
  async getDocuments(params) {
    return this.get('/documents', params);
  }

  async getDocument(id) {
    return this.get(`/documents/${id}`);
  }

  async uploadDocument(formData) {
    const token = this.getAuthToken();
    const response = await fetch(`${this.baseURL}/documents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  }

  async createDocumentVersion(id, formData) {
    const token = this.getAuthToken();
    const response = await fetch(`${this.baseURL}/documents/${id}/version`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Upload failed');
    }
    return data;
  }

  async updateDocument(id, data) {
    return this.put(`/documents/${id}`, data);
  }

  async deactivateDocument(id) {
    return this.post(`/documents/${id}/deactivate`);
  }

  async deleteDocument(id) {
    return this.delete(`/documents/${id}`);
  }

  // Certificates
  async getCertificates(params) {
    return this.get('/certificates', params);
  }

  async getCertificate(id) {
    return this.get(`/certificates/${id}`);
  }

  async createCertificate(data) {
    return this.post('/certificates', data);
  }

  async verifyCertificate(id) {
    return this.post(`/certificates/${id}/verify`);
  }

  async deleteCertificate(id) {
    return this.delete(`/certificates/${id}`);
  }

  async getCertificateTemplates() {
    return this.get('/certificates/templates/all');
  }

  async createCertificateTemplate(data) {
    return this.post('/certificates/templates', data);
  }

  // Commissions
  async getCommissions(params) {
    return this.get('/commissions', params);
  }

  async getCommission(id) {
    return this.get(`/commissions/${id}`);
  }

  async calculateCommission(data) {
    return this.post('/commissions/calculate', data);
  }

  async createCommission(data) {
    return this.post('/commissions', data);
  }

  async approveCommission(id) {
    return this.post(`/commissions/${id}/approve`);
  }

  async payCommission(id) {
    return this.post(`/commissions/${id}/pay`);
  }

  async reverseCommission(id, data) {
    return this.post(`/commissions/${id}/reverse`, data);
  }

  async getCommissionSummary(params) {
    return this.get('/commissions/summary', params);
  }

  // Inbound
  async getGRNs(params) {
    return this.get('/inbound/grn', params);
  }

  async getGRN(id) {
    return this.get(`/inbound/grn/${id}`);
  }

  async createGRN(data) {
    return this.post('/inbound/grn', data);
  }

  async approveGRN(id) {
    return this.post(`/inbound/grn/${id}/approve`);
  }

  async rejectGRN(id, data) {
    return this.post(`/inbound/grn/${id}/reject`, data);
  }

  // Outbound
  async getOutbounds(params) {
    return this.get('/outbound', params);
  }

  async getOutbound(id) {
    return this.get(`/outbound/${id}`);
  }

  async createOutbound(data) {
    return this.post('/outbound', data);
  }

  async confirmOutbound(id) {
    return this.post(`/outbound/${id}/dispatch`);
  }

  async completeDelivery(id, data) {
    return this.post(`/outbound/${id}/complete`, data);
  }

  // Reports
  async getDealReport(params) {
    return this.get('/reports/deals', params);
  }

  async getInvoiceReport(params) {
    return this.get('/reports/invoices', params);
  }

  async getInventoryReport(params) {
    return this.get('/reports/inventory', params);
  }

  async getSalesReport(params) {
    return this.get('/reports/sales', params);
  }

  async getVATReport(params) {
    return this.get('/reports/vat', params);
  }

  async getCustomerAgeingReport(params) {
    return this.get('/reports/customer-ageing', params);
  }

  async getCommissionReport(params) {
    return this.get('/reports/commissions', params);
  }

  async getExpenseReport(params) {
    return this.get('/reports/expenses', params);
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

  async deleteRole(id) {
    return this.delete(`/roles/${id}`);
  }

  async getAllPermissions() {
    return this.get('/roles/permissions/all');
  }

  async assignPermissions(id, permissions) {
    return this.post(`/roles/${id}/permissions`, { permissions });
  }

  // Users
  async getUsers(params) {
    return this.get('/users', params);
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

  async deleteUser(id) {
    return this.delete(`/users/${id}`);
  }

  // Settings
  async getSettings() {
    return this.get('/settings');
  }

  async updateSettings(data) {
    return this.put('/settings', data);
  }

  async getMaterialTypes() {
    return this.get('/settings/material-types');
  }

  async createMaterialType(data) {
    return this.post('/settings/material-types', data);
  }

  async getCurrencies() {
    return this.get('/settings/currencies');
  }

  async getTaxes() {
    return this.get('/settings/taxes');
  }

  async getPaymentModes() {
    return this.get('/settings/payment-modes');
  }

  async getExpenseCategories() {
    return this.get('/settings/expense-categories');
  }

  async updateCurrency(id, data) {
    return this.put(`/settings/currencies/${id}`, data);
  }

  async updateTax(id, data) {
    return this.put(`/settings/taxes/${id}`, data);
  }

  async updatePaymentMode(id, data) {
    return this.put(`/settings/payment-modes/${id}`, data);
  }

  async updateExpenseCategory(id, data) {
    return this.put(`/settings/expense-categories/${id}`, data);
  }

  async updateMaterialType(id, data) {
    return this.put(`/settings/material-types/${id}`, data);
  }

  // Accounting Module
  async getAllJournalEntries(params) {
    return this.get('/accounting/journal-entries', params);
  }

  async getJournalEntryById(id) {
    return this.get(`/accounting/journal-entries/${id}`);
  }

  async createJournalEntry(data) {
    return this.post('/accounting/journal-entries', data);
  }

  async getAllExpenses(params) {
    return this.get('/accounting/expenses', params);
  }

  async createExpense(data) {
    return this.post('/accounting/expenses', data);
  }

  async approveExpense(id) {
    return this.post(`/accounting/expenses/${id}/approve`);
  }

  async getAllFixedAssets(params) {
    return this.get('/accounting/fixed-assets', params);
  }

  async createFixedAsset(data) {
    return this.post('/accounting/fixed-assets', data);
  }

  async calculateDepreciation(data) {
    return this.post('/accounting/depreciation/calculate', data);
  }

  async getBankAccounts() {
    return this.get('/accounting/bank-accounts');
  }

  async createBankAccount(data) {
    return this.post('/accounting/bank-accounts', data);
  }

  // Dashboard Extended
  async getSalesTrends(params) {
    return this.get('/dashboard/sales-trends', params);
  }

  async getMaterialTypeBreakdown() {
    return this.get('/dashboard/material-breakdown');
  }

  async getTopClients() {
    return this.get('/dashboard/top-clients');
  }

  async getRecentActivities() {
    return this.get('/dashboard/recent-activities');
  }

  // Activate/Deactivate Methods
  async deactivateProduct(id) {
    return this.post(`/products/${id}/deactivate`);
  }

  async activateProduct(id) {
    return this.post(`/products/${id}/activate`);
  }

  async deactivateService(id) {
    return this.post(`/services/${id}/deactivate`);
  }

  async activateService(id) {
    return this.post(`/services/${id}/activate`);
  }

  async deactivateWarehouse(id) {
    return this.post(`/warehouses/${id}/deactivate`);
  }

  async activateWarehouse(id) {
    return this.post(`/warehouses/${id}/activate`);
  }

  // Certificate Template Management
  async getCertificateTemplateById(templateId) {
    return this.get(`/certificates/templates/${templateId}`);
  }

  async updateCertificateTemplate(templateId, data) {
    return this.put(`/certificates/templates/${templateId}`, data);
  }
}

export default new ApiService();
