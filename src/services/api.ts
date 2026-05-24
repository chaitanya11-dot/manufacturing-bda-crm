import { User, Lead, Client, Deal, RFQ, Communication, Activity, Product } from '../types.js';

// Base API URL is relative to root under /api since Express proxies or hosts Vite
const API_BASE = '/api';

// Manage simple persistent Auth Token
export const getStoredToken = (): string | null => localStorage.getItem('crm_user_token');
export const setStoredToken = (token: string) => localStorage.setItem('crm_user_token', token);
export const clearStoredToken = () => localStorage.removeItem('crm_user_token');

export const getStoredUser = (): User | null => {
  const data = localStorage.getItem('crm_user_profile');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};
export const setStoredUser = (user: User) => localStorage.setItem('crm_user_profile', JSON.stringify(user));
export const clearStoredUser = () => localStorage.removeItem('crm_user_profile');

// Helper wrapper to enforce JSON request/response structures and handle Token insertion
async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || `API Error: Status ${response.status}`);
  }

  return json.data as T;
}

// API Service exports
export const API = {
  auth: {
    login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
      const res = await apiFetch<{ user: User; token: string; refreshToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setStoredToken(res.token);
      setStoredUser(res.user);
      return res;
    },
    register: async (payload: any): Promise<{ user: User; token: string }> => {
      const res = await apiFetch<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return res;
    },
    logout: async (): Promise<void> => {
      try {
        await apiFetch('/auth/logout', { method: 'POST' });
      } catch {
        // Ignored
      }
      clearStoredToken();
      clearStoredUser();
    },
    getMe: async (): Promise<User> => {
      const user = await apiFetch<User>('/auth/me');
      setStoredUser(user);
      return user;
    }
  },

  users: {
    list: () => apiFetch<User[]>('/users'),
    get: (id: string) => apiFetch<User>(`/users/${id}`),
    update: (id: string, payload: Partial<User>) => apiFetch<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
    delete: (id: string) => apiFetch<void>(`/users/${id}`, { method: 'DELETE' })
  },

  leads: {
    list: (filters: { search?: string; stage?: string; priority?: string; leadSource?: string } = {}) => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.stage) params.set('stage', filters.stage);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.leadSource) params.set('leadSource', filters.leadSource);
      const query = params.toString();
      return apiFetch<Lead[]>(`/leads${query ? '?' + query : ''}`);
    },
    get: (id: string) => apiFetch<Lead>(`/leads/${id}`),
    create: (payload: any) => apiFetch<Lead>('/leads', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    update: (id: string, payload: Partial<Lead>) => apiFetch<Lead>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
    delete: (id: string) => apiFetch<void>(`/leads/${id}`, { method: 'DELETE' }),
    updateStage: (id: string, stage: string, lostReason?: string) => apiFetch<Lead>(`/leads/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify({ stage, lostReason })
    }),
    reassign: (id: string, assignedTo: string) => apiFetch<Lead>(`/leads/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedTo })
    }),
    getActivities: (id: string) => apiFetch<Activity[]>(`/leads/${id}/activities`),
    logActivity: (id: string, payload: { type?: string; description: string; metadata?: any }) => apiFetch<Activity>(`/leads/${id}/activities`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    getStats: () => apiFetch<any>('/leads/stats/overview')
  },

  clients: {
    list: (filters: { search?: string; type?: string; status?: string } = {}) => {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.type) params.set('type', filters.type);
      if (filters.status) params.set('status', filters.status);
      const query = params.toString();
      return apiFetch<Client[]>(`/clients${query ? '?' + query : ''}`);
    },
    get: (id: string) => apiFetch<Client>(`/clients/${id}`),
    create: (payload: any) => apiFetch<Client>('/clients', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    update: (id: string, payload: Partial<Client>) => apiFetch<Client>(`/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
    delete: (id: string) => apiFetch<void>(`/clients/${id}`, { method: 'DELETE' }),
    getDeals: (id: string) => apiFetch<Deal[]>(`/clients/${id}/deals`),
    getCommunications: (id: string) => apiFetch<Communication[]>(`/clients/${id}/communications`),
    getRfqs: (id: string) => apiFetch<RFQ[]>(`/clients/${id}/rfqs`),
    addContact: (id: string, contact: { name: string; email?: string; phone?: string; designation?: string; isPrimary?: boolean }) => apiFetch<Client>(`/clients/${id}/contacts`, {
      method: 'POST',
      body: JSON.stringify(contact)
    })
  },

  deals: {
    list: () => apiFetch<Deal[]>('/deals'),
    get: (id: string) => apiFetch<Deal>(`/deals/${id}`),
    create: (payload: any) => apiFetch<Deal>('/deals', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    update: (id: string, payload: Partial<Deal>) => apiFetch<Deal>(`/deals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
    updateStage: (id: string, payload: { stage: string; winReason?: string; lostReason?: string }) => apiFetch<Deal>(`/deals/${id}/stage`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
    getForecastStats: () => apiFetch<any>('/deals/stats/forecast')
  },

  rfqs: {
    list: () => apiFetch<RFQ[]>('/rfqs'),
    get: (id: string) => apiFetch<RFQ>(`/rfqs/${id}`),
    create: (payload: any) => apiFetch<RFQ>('/rfqs', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    update: (id: string, payload: Partial<RFQ>) => apiFetch<RFQ>(`/rfqs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    }),
    send: (id: string) => apiFetch<RFQ>(`/rfqs/${id}/send`, { method: 'POST' }),
    revise: (id: string, payload: any) => apiFetch<RFQ>(`/rfqs/${id}/revise`, {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    updateStatus: (id: string, status: string) => apiFetch<RFQ>(`/rfqs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  },

  communications: {
    list: () => apiFetch<Communication[]>('/communications'),
    create: (payload: any) => apiFetch<Communication>('/communications', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),
    getUpcoming: () => apiFetch<any[]>('/communications/upcoming')
  },

  performance: {
    getDashboard: () => apiFetch<any>('/performance/dashboard'),
    getLeaderboard: () => apiFetch<any[]>('/performance/leaderboard'),
    getConversion: () => apiFetch<any[]>('/performance/conversion')
  },

  products: {
    list: () => apiFetch<Product[]>('/products'),
    create: (payload: any) => apiFetch<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
  }
};
