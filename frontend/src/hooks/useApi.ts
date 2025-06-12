import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type {
  OrganizationModel,
  ContactModel,
  LeadModel,
  OpportunityModel,
  TaskModel,
  CallModel,
  PaginatedResponse,
  DashboardStats,
  RecentActivity,
  OrganizationFilters,
  ContactFilters,
  LeadFilters,
  OpportunityFilters,
  TaskFilters,
  CallFilters
} from '../types';

// Query Keys
export const queryKeys = {
  organizations: ['organizations'] as const,
  organization: (id: string) => ['organizations', id] as const,
  contacts: ['contacts'] as const,
  contact: (id: string) => ['contacts', id] as const,
  leads: ['leads'] as const,
  lead: (id: string) => ['leads', id] as const,
  opportunities: ['opportunities'] as const,
  opportunity: (id: string) => ['opportunities', id] as const,
  tasks: ['tasks'] as const,
  task: (id: string) => ['tasks', id] as const,
  calls: ['calls'] as const,
  call: (id: string) => ['calls', id] as const,
  dashboardStats: ['dashboard', 'stats'] as const,
  recentActivities: ['dashboard', 'activities'] as const,
  globalSearch: (query: string) => ['search', query] as const,
};

// Organization Hooks
export const useOrganizations = (
  filters?: OrganizationFilters,
  options?: UseQueryOptions<PaginatedResponse<OrganizationModel>, Error>
) => {
  return useQuery({
    queryKey: [...queryKeys.organizations, filters],
    queryFn: () => apiService.getOrganizations(filters),
    ...options,
  });
};

export const useOrganization = (
  id: string,
  options?: UseQueryOptions<OrganizationModel, Error>
) => {
  return useQuery({
    queryKey: queryKeys.organization(id),
    queryFn: () => apiService.getOrganization(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateOrganization = (
  options?: UseMutationOptions<OrganizationModel, Error, Partial<OrganizationModel>>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<OrganizationModel>) => apiService.createOrganization(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
    ...options,
  });
};

export const useUpdateOrganization = (
  options?: UseMutationOptions<OrganizationModel, Error, { id: string; data: Partial<OrganizationModel> }>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OrganizationModel> }) => 
      apiService.updateOrganization(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations });
      queryClient.setQueryData(queryKeys.organization(variables.id), data);
    },
    ...options,
  });
};

export const useDeleteOrganization = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiService.deleteOrganization(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations });
      queryClient.removeQueries({ queryKey: queryKeys.organization(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
    ...options,
  });
};

// Legacy Account Hooks - kept for backward compatibility
export const useAccounts = useOrganizations;
export const useAccount = useOrganization;
export const useCreateAccount = useCreateOrganization;
export const useUpdateAccount = useUpdateOrganization;
export const useDeleteAccount = useDeleteOrganization;

// Contact Hooks
export const useContacts = (
  filters?: ContactFilters,
  options?: UseQueryOptions<PaginatedResponse<ContactModel>, Error>
) => {
  return useQuery({
    queryKey: [...queryKeys.contacts, filters],
    queryFn: () => apiService.getContacts(filters),
    ...options,
  });
};

export const useContact = (
  id: string,
  options?: UseQueryOptions<ContactModel, Error>
) => {
  return useQuery({
    queryKey: queryKeys.contact(id),
    queryFn: () => apiService.getContact(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateContact = (
  options?: UseMutationOptions<ContactModel, Error, Partial<ContactModel>>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<ContactModel>) => apiService.createContact(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
    ...options,
  });
};

export const useUpdateContact = (
  options?: UseMutationOptions<ContactModel, Error, { id: string; data: Partial<ContactModel> }>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ContactModel> }) => 
      apiService.updateContact(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      queryClient.setQueryData(queryKeys.contact(variables.id), data);
    },
    ...options,
  });
};

export const useDeleteContact = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiService.deleteContact(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      queryClient.removeQueries({ queryKey: queryKeys.contact(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
    ...options,
  });
};

// Lead Hooks
export const useLeads = (
  filters?: LeadFilters,
  options?: UseQueryOptions<PaginatedResponse<LeadModel>, Error>
) => {
  return useQuery({
    queryKey: [...queryKeys.leads, filters],
    queryFn: () => apiService.getLeads(filters),
    ...options,
  });
};

export const useLead = (
  id: string,
  options?: UseQueryOptions<LeadModel, Error>
) => {
  return useQuery({
    queryKey: queryKeys.lead(id),
    queryFn: () => apiService.getLead(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateLead = (
  options?: UseMutationOptions<LeadModel, Error, Partial<LeadModel>>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<LeadModel>) => apiService.createLead(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
    ...options,
  });
};

export const useUpdateLead = (
  options?: UseMutationOptions<LeadModel, Error, { id: string; data: Partial<LeadModel> }>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LeadModel> }) => 
      apiService.updateLead(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads });
      queryClient.setQueryData(queryKeys.lead(variables.id), data);
    },
    ...options,
  });
};

export const useDeleteLead = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiService.deleteLead(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads });
      queryClient.removeQueries({ queryKey: queryKeys.lead(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
    ...options,
  });
};

export const useConvertLead = (
  options?: UseMutationOptions<any, Error, string>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiService.convertLead(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.leads });
      queryClient.removeQueries({ queryKey: queryKeys.lead(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
      queryClient.invalidateQueries({ queryKey: queryKeys.organizations });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts });
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities });
    },
    ...options,
  });
};

// Opportunity Hooks
export const useOpportunities = (
  filters?: OpportunityFilters,
  options?: UseQueryOptions<PaginatedResponse<OpportunityModel>, Error>
) => {
  return useQuery({
    queryKey: [...queryKeys.opportunities, filters],
    queryFn: () => apiService.getOpportunities(filters),
    ...options,
  });
};

export const useOpportunity = (
  id: string,
  options?: UseQueryOptions<OpportunityModel, Error>
) => {
  return useQuery({
    queryKey: queryKeys.opportunity(id),
    queryFn: () => apiService.getOpportunity(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateOpportunity = (
  options?: UseMutationOptions<OpportunityModel, Error, Partial<OpportunityModel>>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<OpportunityModel>) => apiService.createOpportunity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
    ...options,
  });
};

export const useUpdateOpportunity = (
  options?: UseMutationOptions<OpportunityModel, Error, { id: string; data: Partial<OpportunityModel> }>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<OpportunityModel> }) => 
      apiService.updateOpportunity(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities });
      queryClient.setQueryData(queryKeys.opportunity(variables.id), data);
    },
    ...options,
  });
};

export const useDeleteOpportunity = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiService.deleteOpportunity(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.opportunities });
      queryClient.removeQueries({ queryKey: queryKeys.opportunity(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
    ...options,
  });
};

// Task Hooks
export const useTasks = (
  filters?: TaskFilters,
  options?: UseQueryOptions<PaginatedResponse<TaskModel>, Error>
) => {
  return useQuery({
    queryKey: [...queryKeys.tasks, filters],
    queryFn: () => apiService.getTasks(filters),
    ...options,
  });
};

export const useTask = (
  id: string,
  options?: UseQueryOptions<TaskModel, Error>
) => {
  return useQuery({
    queryKey: queryKeys.task(id),
    queryFn: () => apiService.getTask(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateTask = (
  options?: UseMutationOptions<TaskModel, Error, Partial<TaskModel>>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<TaskModel>) => apiService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
    ...options,
  });
};

export const useUpdateTask = (
  options?: UseMutationOptions<TaskModel, Error, { id: string; data: Partial<TaskModel> }>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskModel> }) => 
      apiService.updateTask(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.setQueryData(queryKeys.task(variables.id), data);
    },
    ...options,
  });
};

export const useDeleteTask = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiService.deleteTask(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
      queryClient.removeQueries({ queryKey: queryKeys.task(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
    ...options,
  });
};

// Call Hooks
export const useCalls = (
  filters?: CallFilters,
  options?: UseQueryOptions<PaginatedResponse<CallModel>, Error>
) => {
  return useQuery({
    queryKey: [...queryKeys.calls, filters],
    queryFn: () => apiService.getCalls(filters),
    ...options,
  });
};

export const useCall = (
  id: string,
  options?: UseQueryOptions<CallModel, Error>
) => {
  return useQuery({
    queryKey: queryKeys.call(id),
    queryFn: () => apiService.getCall(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateCall = (
  options?: UseMutationOptions<CallModel, Error, Partial<CallModel>>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<CallModel>) => apiService.createCall(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
    ...options,
  });
};

export const useUpdateCall = (
  options?: UseMutationOptions<CallModel, Error, { id: string; data: Partial<CallModel> }>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CallModel> }) => 
      apiService.updateCall(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls });
      queryClient.setQueryData(queryKeys.call(variables.id), data);
    },
    ...options,
  });
};

export const useDeleteCall = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => apiService.deleteCall(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.calls });
      queryClient.removeQueries({ queryKey: queryKeys.call(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
    ...options,
  });
};

// Dashboard Hooks
export const useDashboardStats = (
  options?: UseQueryOptions<DashboardStats, Error>
) => {
  return useQuery({
    queryKey: queryKeys.dashboardStats,
    queryFn: () => apiService.getDashboardStats(),
    refetchInterval: 300000, // Refetch every 5 minutes
    ...options,
  });
};

export const useRecentActivities = (
  limit?: number,
  options?: UseQueryOptions<RecentActivity[], Error>
) => {
  return useQuery({
    queryKey: [...queryKeys.recentActivities, limit],
    queryFn: () => apiService.getRecentActivities(limit),
    refetchInterval: 60000, // Refetch every minute
    ...options,
  });
};

// Search Hooks
export const useGlobalSearch = (
  query: string,
  options?: UseQueryOptions<any, Error>
) => {
  return useQuery({
    queryKey: queryKeys.globalSearch(query),
    queryFn: () => apiService.globalSearch(query),
    enabled: !!query && query.length >= 2,
    staleTime: 30000, // Consider data stale after 30 seconds
    ...options,
  });
};