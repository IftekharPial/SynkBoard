/**
 * API service for SynkBoard frontend
 * Following frontend-behavior.md and api-contracts.md
 */

import { 
  ApiResponse, 
  ApiSuccessResponse, 
  ApiErrorResponse,
  ERROR_CODES,
} from '@synkboard/types';

export interface ApiClientConfig {
  baseUrl: string;
  token?: string;
  tenantId?: string;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number = 500
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authentication header
    if (this.config.token) {
      headers.Authorization = `Bearer ${this.config.token}`;
    }

    // Add tenant ID header if available
    if (this.config.tenantId) {
      headers['X-Tenant-ID'] = this.config.tenantId;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data: ApiResponse<T> = await response.json();

      if (!response.ok) {
        const errorData = data as ApiErrorResponse;
        throw new ApiError(
          errorData.error.code,
          errorData.error.message,
          response.status
        );
      }

      if (!data.success) {
        const errorData = data as ApiErrorResponse;
        throw new ApiError(
          errorData.error.code,
          errorData.error.message,
          response.status
        );
      }

      return (data as ApiSuccessResponse<T>).data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      // Network or parsing error
      throw new ApiError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  // HTTP methods
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = params 
      ? `${endpoint}?${new URLSearchParams(params).toString()}`
      : endpoint;
    
    return this.request<T>(url, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Update configuration
  setToken(token: string) {
    this.config.token = token;
  }

  setTenantId(tenantId: string) {
    this.config.tenantId = tenantId;
  }

  clearAuth() {
    this.config.token = undefined;
    this.config.tenantId = undefined;
  }
}

// Create singleton API client
export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
});

// API service functions
export const api = {
  // Authentication
  auth: {
    login: (credentials: { email: string; password: string }) =>
      apiClient.post('/api/v1/auth/login', credentials),
    
    refresh: (refreshToken: string) =>
      apiClient.post('/api/v1/auth/refresh', { refresh_token: refreshToken }),
    
    me: () => apiClient.get('/api/v1/auth/me'),
  },

  // Entities
  entities: {
    list: () => apiClient.get('/api/v1/entities'),
    
    get: (slug: string) => apiClient.get(`/api/v1/entities/${slug}`),
    
    create: (data: any) => apiClient.post('/api/v1/entities', data),
    
    update: (slug: string, data: any) => 
      apiClient.put(`/api/v1/entities/${slug}`, data),
    
    delete: (slug: string) => apiClient.delete(`/api/v1/entities/${slug}`),

    // Fields
    getFields: (slug: string) => 
      apiClient.get(`/api/v1/entities/${slug}/fields`),
    
    addField: (slug: string, data: any) =>
      apiClient.post(`/api/v1/entities/${slug}/fields`, data),
    
    updateField: (slug: string, fieldId: string, data: any) =>
      apiClient.put(`/api/v1/entities/${slug}/fields/${fieldId}`, data),
    
    deleteField: (slug: string, fieldId: string) =>
      apiClient.delete(`/api/v1/entities/${slug}/fields/${fieldId}`),
  },

  // Records
  records: {
    list: (entitySlug: string, params?: any) =>
      apiClient.get(`/api/v1/entities/${entitySlug}/records`, params),
    
    get: (entitySlug: string, id: string) =>
      apiClient.get(`/api/v1/entities/${entitySlug}/records/${id}`),
    
    create: (entitySlug: string, data: any) =>
      apiClient.post(`/api/v1/entities/${entitySlug}/records`, data),
    
    update: (entitySlug: string, id: string, data: any) =>
      apiClient.put(`/api/v1/entities/${entitySlug}/records/${id}`, data),
    
    delete: (entitySlug: string, id: string) =>
      apiClient.delete(`/api/v1/entities/${entitySlug}/records/${id}`),
  },

  // Dashboards
  dashboards: {
    list: (params?: any) => apiClient.get('/api/v1/dashboards', params),
    
    get: (slug: string, isPublic?: boolean) => {
      const params = isPublic ? { public: 'true' } : undefined;
      return apiClient.get(`/api/v1/dashboards/${slug}`, params);
    },
    
    create: (data: any) => apiClient.post('/api/v1/dashboards', data),
    
    update: (slug: string, data: any) =>
      apiClient.put(`/api/v1/dashboards/${slug}`, data),
    
    delete: (slug: string) => apiClient.delete(`/api/v1/dashboards/${slug}`),
  },

  // Widgets
  widgets: {
    list: (params?: any) => apiClient.get('/api/v1/widgets', params),
    
    get: (id: string) => apiClient.get(`/api/v1/widgets/${id}`),
    
    create: (data: any) => apiClient.post('/api/v1/widgets', data),
    
    update: (id: string, data: any) =>
      apiClient.put(`/api/v1/widgets/${id}`, data),
    
    delete: (id: string) => apiClient.delete(`/api/v1/widgets/${id}`),
    
    getData: (id: string, params?: any) =>
      apiClient.get(`/api/v1/widgets/${id}/data`, params),
  },

  // Rules
  rules: {
    list: () => apiClient.get('/api/v1/rules'),
    
    get: (id: string) => apiClient.get(`/api/v1/rules/${id}`),
    
    create: (data: any) => apiClient.post('/api/v1/rules', data),
    
    update: (id: string, data: any) =>
      apiClient.put(`/api/v1/rules/${id}`, data),
    
    delete: (id: string) => apiClient.delete(`/api/v1/rules/${id}`),
    
    test: (data: any) => apiClient.post('/api/v1/rules/test', data),
    
    getLogs: (params?: any) => apiClient.get('/api/v1/rules/logs', params),
  },

  // Webhooks
  webhooks: {
    getLogs: (params?: any) => apiClient.get('/api/v1/webhooks/logs', params),
    getStats: () => apiClient.get('/api/v1/webhooks/stats'),
    testEndpoint: (data: any) => apiClient.post('/api/v1/webhooks/test', data),
  },
};

export default api;
