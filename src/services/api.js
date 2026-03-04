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

  async assignRolePermissions(roleId, permissionIds) {
    return this.post(`/roles/${roleId}/permissions`, { permissions: permissionIds });
  }

  async getAllPermissions() {
    return this.get('/roles/permissions/all');
  }

  async deleteRole(id) {
    return this.delete(`/roles/${id}`);
  }
}

const apiService = new ApiService();
export default apiService;
