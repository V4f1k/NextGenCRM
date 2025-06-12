import {
  AccountModel,
  ContactModel,
  LeadModel,
  OpportunityModel,
  TaskModel,
  CallModel,
  PaginatedResponse,
  DashboardStats,
  RecentActivity,
  AccountFilters,
  ContactFilters,
  LeadFilters,
  OpportunityFilters,
  TaskFilters,
  CallFilters,
  BaseFilters
} from '../types';
import { authService } from './auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class APIService {
  private baseURL = API_BASE_URL;

  // Generic API request method with authentication
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = authService.getAccessToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    // Handle token refresh if access token expired
    if (response.status === 401 && token) {
      const refreshed = await authService.refreshAccessToken();
      if (refreshed) {
        // Retry with new token
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${authService.getAccessToken()}`,
        };
        return fetch(`${this.baseURL}${endpoint}`, config);
      } else {
        // Refresh failed, redirect to login
        authService.logout();
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || error.message || `HTTP ${response.status}`);
    }

    return response;
  }

  // Helper method to build query parameters
  private buildQueryParams(filters: Record<string, any>): string {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });
    
    return params.toString();
  }

  // Generic CRUD operations
  private async list<T>(endpoint: string, filters?: Record<string, any>): Promise<PaginatedResponse<T>> {
    const queryString = filters ? `?${this.buildQueryParams(filters)}` : '';
    const response = await this.apiRequest(`${endpoint}${queryString}`);
    return response.json();
  }

  private async retrieve<T>(endpoint: string, id: string): Promise<T> {
    const response = await this.apiRequest(`${endpoint}${id}/`);
    return response.json();
  }

  private async create<T>(endpoint: string, data: Partial<T>): Promise<T> {
    const response = await this.apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  private async update<T>(endpoint: string, id: string, data: Partial<T>): Promise<T> {
    const response = await this.apiRequest(`${endpoint}${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  private async delete(endpoint: string, id: string): Promise<void> {
    await this.apiRequest(`${endpoint}${id}/`, {
      method: 'DELETE',
    });
  }

  // Account API
  async getAccounts(filters?: AccountFilters): Promise<PaginatedResponse<AccountModel>> {
    return this.list<AccountModel>('/accounts/', filters);
  }

  async getAccount(id: string): Promise<AccountModel> {
    return this.retrieve<AccountModel>('/accounts/', id);
  }

  async createAccount(data: Partial<AccountModel>): Promise<AccountModel> {
    return this.create<AccountModel>('/accounts/', data);
  }

  async updateAccount(id: string, data: Partial<AccountModel>): Promise<AccountModel> {
    return this.update<AccountModel>('/accounts/', id, data);
  }

  async deleteAccount(id: string): Promise<void> {
    return this.delete('/accounts/', id);
  }

  // Contact API
  async getContacts(filters?: ContactFilters): Promise<PaginatedResponse<ContactModel>> {
    return this.list<ContactModel>('/contacts/', filters);
  }

  async getContact(id: string): Promise<ContactModel> {
    return this.retrieve<ContactModel>('/contacts/', id);
  }

  async createContact(data: Partial<ContactModel>): Promise<ContactModel> {
    return this.create<ContactModel>('/contacts/', data);
  }

  async updateContact(id: string, data: Partial<ContactModel>): Promise<ContactModel> {
    return this.update<ContactModel>('/contacts/', id, data);
  }

  async deleteContact(id: string): Promise<void> {
    return this.delete('/contacts/', id);
  }

  // Lead API
  async getLeads(filters?: LeadFilters): Promise<PaginatedResponse<LeadModel>> {
    return this.list<LeadModel>('/leads/', filters);
  }

  async getLead(id: string): Promise<LeadModel> {
    return this.retrieve<LeadModel>('/leads/', id);
  }

  async createLead(data: Partial<LeadModel>): Promise<LeadModel> {
    return this.create<LeadModel>('/leads/', data);
  }

  async updateLead(id: string, data: Partial<LeadModel>): Promise<LeadModel> {
    return this.update<LeadModel>('/leads/', id, data);
  }

  async deleteLead(id: string): Promise<void> {
    return this.delete('/leads/', id);
  }

  // Opportunity API
  async getOpportunities(filters?: OpportunityFilters): Promise<PaginatedResponse<OpportunityModel>> {
    return this.list<OpportunityModel>('/opportunities/', filters);
  }

  async getOpportunity(id: string): Promise<OpportunityModel> {
    return this.retrieve<OpportunityModel>('/opportunities/', id);
  }

  async createOpportunity(data: Partial<OpportunityModel>): Promise<OpportunityModel> {
    return this.create<OpportunityModel>('/opportunities/', data);
  }

  async updateOpportunity(id: string, data: Partial<OpportunityModel>): Promise<OpportunityModel> {
    return this.update<OpportunityModel>('/opportunities/', id, data);
  }

  async deleteOpportunity(id: string): Promise<void> {
    return this.delete('/opportunities/', id);
  }

  // Task API
  async getTasks(filters?: TaskFilters): Promise<PaginatedResponse<TaskModel>> {
    return this.list<TaskModel>('/tasks/', filters);
  }

  async getTask(id: string): Promise<TaskModel> {
    return this.retrieve<TaskModel>('/tasks/', id);
  }

  async createTask(data: Partial<TaskModel>): Promise<TaskModel> {
    return this.create<TaskModel>('/tasks/', data);
  }

  async updateTask(id: string, data: Partial<TaskModel>): Promise<TaskModel> {
    return this.update<TaskModel>('/tasks/', id, data);
  }

  async deleteTask(id: string): Promise<void> {
    return this.delete('/tasks/', id);
  }

  // Call API
  async getCalls(filters?: CallFilters): Promise<PaginatedResponse<CallModel>> {
    return this.list<CallModel>('/calls/', filters);
  }

  async getCall(id: string): Promise<CallModel> {
    return this.retrieve<CallModel>('/calls/', id);
  }

  async createCall(data: Partial<CallModel>): Promise<CallModel> {
    return this.create<CallModel>('/calls/', data);
  }

  async updateCall(id: string, data: Partial<CallModel>): Promise<CallModel> {
    return this.update<CallModel>('/calls/', id, data);
  }

  async deleteCall(id: string): Promise<void> {
    return this.delete('/calls/', id);
  }

  // Dashboard API
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await this.apiRequest('/dashboard/stats/');
    return response.json();
  }

  async getRecentActivities(limit?: number): Promise<RecentActivity[]> {
    const queryString = limit ? `?limit=${limit}` : '';
    const response = await this.apiRequest(`/dashboard/activities/${queryString}`);
    return response.json();
  }

  // Search API
  async globalSearch(query: string, entities?: string[]): Promise<{
    accounts: AccountModel[];
    contacts: ContactModel[];
    leads: LeadModel[];
    opportunities: OpportunityModel[];
    tasks: TaskModel[];
    calls: CallModel[];
  }> {
    const filters = { search: query };
    const results = await Promise.allSettled([
      this.getAccounts(filters),
      this.getContacts(filters),
      this.getLeads(filters),
      this.getOpportunities(filters),
      this.getTasks(filters),
      this.getCalls(filters),
    ]);

    return {
      accounts: results[0].status === 'fulfilled' ? results[0].value.results : [],
      contacts: results[1].status === 'fulfilled' ? results[1].value.results : [],
      leads: results[2].status === 'fulfilled' ? results[2].value.results : [],
      opportunities: results[3].status === 'fulfilled' ? results[3].value.results : [],
      tasks: results[4].status === 'fulfilled' ? results[4].value.results : [],
      calls: results[5].status === 'fulfilled' ? results[5].value.results : [],
    };
  }
}

export const apiService = new APIService();