import axios from 'axios';
import { Customer, Product, SalesChallan, StockLog, DashboardStats, Pagination } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('erp_crm_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response error handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('erp_crm_token');
      localStorage.removeItem('erp_crm_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth Endpoints
export const loginApi = async (email: string, password: string) => {
  const res = await api.post('/auth/login', { email, password });
  return res.data;
};

export const getMeApi = async () => {
  const res = await api.get('/auth/me');
  return res.data;
};

// Customer CRM Endpoints
export const getCustomersApi = async (params?: { search?: string; status?: string; type?: string; page?: number; limit?: number }) => {
  const res = await api.get<{ data: Customer[]; pagination: Pagination }>('/customers', { params });
  return res.data;
};

export const getCustomerByIdApi = async (id: string) => {
  const res = await api.get<Customer>(`/customers/${id}`);
  return res.data;
};

export const createCustomerApi = async (customerData: Partial<Customer>) => {
  const res = await api.post('/customers', customerData);
  return res.data;
};

export const updateCustomerApi = async (id: string, customerData: Partial<Customer>) => {
  const res = await api.put(`/customers/${id}`, customerData);
  return res.data;
};

export const addFollowUpApi = async (id: string, note: string, nextFollowUpDate?: string) => {
  const res = await api.post(`/customers/${id}/follow-ups`, { note, nextFollowUpDate });
  return res.data;
};

// Product & Inventory Endpoints
export const getProductsApi = async (params?: { search?: string; category?: string; lowStock?: string; page?: number; limit?: number }) => {
  const res = await api.get<{ data: Product[]; pagination: Pagination }>('/products', { params });
  return res.data;
};

export const getProductByIdApi = async (id: string) => {
  const res = await api.get<Product>(`/products/${id}`);
  return res.data;
};

export const createProductApi = async (productData: Partial<Product>) => {
  const res = await api.post('/products', productData);
  return res.data;
};

export const updateProductApi = async (id: string, productData: Partial<Product>) => {
  const res = await api.put(`/products/${id}`, productData);
  return res.data;
};

export const adjustStockApi = async (id: string, quantity: number, type: 'IN' | 'OUT', reason: string) => {
  const res = await api.post(`/products/${id}/adjust-stock`, { quantity, type, reason });
  return res.data;
};

export const getStockLogsApi = async (params?: { productId?: string; type?: string; page?: number; limit?: number }) => {
  const res = await api.get<{ data: StockLog[]; pagination: Pagination }>('/products/stock-logs', { params });
  return res.data;
};

// Sales Challan Endpoints
export const getChallansApi = async (params?: { search?: string; status?: string; customerId?: string; page?: number; limit?: number }) => {
  const res = await api.get<{ data: SalesChallan[]; pagination: Pagination }>('/challans', { params });
  return res.data;
};

export const getChallanByIdApi = async (id: string) => {
  const res = await api.get<SalesChallan>(`/challans/${id}`);
  return res.data;
};

export const createChallanApi = async (data: { customerId: string; items: any[]; status?: 'Draft' | 'Confirmed' }) => {
  const res = await api.post('/challans', data);
  return res.data;
};

export const updateChallanStatusApi = async (id: string, status: 'Draft' | 'Confirmed' | 'Cancelled') => {
  const res = await api.patch(`/challans/${id}/status`, { status });
  return res.data;
};

export const downloadChallanPDFApi = async (id: string, challanNumber: string) => {
  const response = await api.get(`/challans/${id}/pdf`, {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${challanNumber}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

// Dashboard Endpoints
export const getDashboardStatsApi = async () => {
  const res = await api.get<DashboardStats>('/dashboard/stats');
  return res.data;
};

export default api;
