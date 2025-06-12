// Base types matching Django models
export interface BaseModel {
  id: string;
  created_at: string;
  modified_at: string;
  deleted?: boolean;
  deleted_at?: string | null;
}

export interface UserModel extends BaseModel {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  title?: string;
  department?: string;
  phone?: string;
  mobile?: string;
  fax?: string;
  website?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  address_country?: string;
  is_active: boolean;
  is_superuser: boolean;
  email_verified?: boolean;
  phone_verified?: boolean;
  date_joined: string;
  last_login?: string;
  teams?: string[];
  roles?: string[];
}

export interface AccountModel extends BaseModel {
  name: string;
  website?: string;
  industry?: string;
  type?: string;
  phone_number?: string;
  email_address?: string;
  billing_address_street?: string;
  billing_address_city?: string;
  billing_address_state?: string;
  billing_address_postal_code?: string;
  billing_address_country?: string;
  shipping_address_street?: string;
  shipping_address_city?: string;
  shipping_address_state?: string;
  shipping_address_postal_code?: string;
  shipping_address_country?: string;
  description?: string;
  sic_code?: string;
  annual_revenue?: number;
  number_of_employees?: number;
  ownership?: string;
  rating?: string;
  ticker_symbol?: string;
  created_by?: string;
  modified_by?: string;
  assigned_user?: string;
  assigned_team?: string;
  created_by_name?: string;
  assigned_user_name?: string;
}

export interface ContactModel extends BaseModel {
  salutation_name?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  account?: string;
  account_name?: string;
  title?: string;
  department?: string;
  email_address?: string;
  phone_number?: string;
  phone_number_mobile?: string;
  phone_number_home?: string;
  phone_number_fax?: string;
  mailing_address_street?: string;
  mailing_address_city?: string;
  mailing_address_state?: string;
  mailing_address_postal_code?: string;
  mailing_address_country?: string;
  other_address_street?: string;
  other_address_city?: string;
  other_address_state?: string;
  other_address_postal_code?: string;
  other_address_country?: string;
  description?: string;
  do_not_call?: boolean;
  created_by?: string;
  modified_by?: string;
  assigned_user?: string;
  assigned_team?: string;
  created_by_name?: string;
  assigned_user_name?: string;
}

export interface LeadModel extends BaseModel {
  salutation_name?: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  account_name?: string;
  title?: string;
  website?: string;
  email_address?: string;
  phone_number?: string;
  phone_number_mobile?: string;
  phone_number_home?: string;
  phone_number_fax?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_postal_code?: string;
  address_country?: string;
  status?: string;
  source?: string;
  industry?: string;
  opportunity_amount?: number;
  description?: string;
  do_not_call?: boolean;
  converted?: boolean;
  converted_at?: string;
  created_by?: string;
  modified_by?: string;
  assigned_user?: string;
  assigned_team?: string;
  created_by_name?: string;
  assigned_user_name?: string;
}

export interface OpportunityModel extends BaseModel {
  name: string;
  account?: string;
  account_name?: string;
  stage?: string;
  amount?: number;
  probability?: number;
  next_step?: string;
  lead_source?: string;
  close_date?: string;
  description?: string;
  campaign?: string;
  created_by?: string;
  modified_by?: string;
  assigned_user?: string;
  assigned_team?: string;
  created_by_name?: string;
  assigned_user_name?: string;
  contacts?: string[];
}

export interface TaskModel extends BaseModel {
  name: string;
  status?: string;
  priority?: string;
  date_start?: string;
  date_end?: string;
  date_start_date?: string;
  date_end_date?: string;
  description?: string;
  parent_type?: string;
  parent_id?: string;
  account?: string;
  contact?: string;
  created_by?: string;
  modified_by?: string;
  assigned_user?: string;
  assigned_team?: string;
  created_by_name?: string;
  assigned_user_name?: string;
}

export interface CallModel extends BaseModel {
  name: string;
  status?: string;
  direction?: string;
  date_start?: string;
  date_end?: string;
  duration?: number;
  description?: string;
  parent_type?: string;
  parent_id?: string;
  account?: string;
  created_by?: string;
  modified_by?: string;
  assigned_user?: string;
  assigned_team?: string;
  created_by_name?: string;
  assigned_user_name?: string;
  contacts?: string[];
  users?: string[];
}

// Authentication types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: UserModel;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name?: string;
  last_name?: string;
  title?: string;
  department?: string;
}

export interface RegisterResponse {
  user: UserModel;
  refresh: string;
  access: string;
}

// API Response types
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface APIError {
  message: string;
  field?: string;
  code?: string;
}

// Dashboard types
export interface DashboardStats {
  accounts: {
    total: number;
    recent: number;
  };
  contacts: {
    total: number;
    recent: number;
  };
  leads: {
    total: number;
    new: number;
    qualified: number;
    converted: number;
  };
  opportunities: {
    total: number;
    open: number;
    won: number;
    lost: number;
    total_amount: number;
    won_amount: number;
  };
  tasks: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    overdue: number;
  };
  calls: {
    total: number;
    planned: number;
    held: number;
    not_held: number;
  };
}

export interface RecentActivity {
  type: string;
  id: string;
  name: string;
  created_at: string;
  created_by: string | null;
}

// Filter types
export interface BaseFilters {
  search?: string;
  ordering?: string;
  created_at_after?: string;
  created_at_before?: string;
  assigned_user?: string;
  assigned_team?: string;
}

export interface AccountFilters extends BaseFilters {
  name?: string;
  type?: string;
  industry?: string;
  website?: string;
}

export interface ContactFilters extends BaseFilters {
  first_name?: string;
  last_name?: string;
  account?: string;
  title?: string;
  department?: string;
}

export interface LeadFilters extends BaseFilters {
  first_name?: string;
  last_name?: string;
  status?: string;
  source?: string;
  industry?: string;
  converted?: boolean;
}

export interface OpportunityFilters extends BaseFilters {
  name?: string;
  stage?: string;
  account?: string;
  amount_gte?: number;
  amount_lte?: number;
  probability_gte?: number;
  probability_lte?: number;
  close_date_after?: string;
  close_date_before?: string;
}

export interface TaskFilters extends BaseFilters {
  name?: string;
  status?: string;
  priority?: string;
  date_start_after?: string;
  date_start_before?: string;
  date_end_after?: string;
  date_end_before?: string;
  parent_type?: string;
  parent_id?: string;
}

export interface CallFilters extends BaseFilters {
  name?: string;
  status?: string;
  direction?: string;
  date_start_after?: string;
  date_start_before?: string;
  parent_type?: string;
  parent_id?: string;
}

// Choice constants (matching Django model choices)
export const ACCOUNT_TYPES = [
  { value: 'customer', label: 'Customer' },
  { value: 'investor', label: 'Investor' },
  { value: 'partner', label: 'Partner' },
  { value: 'reseller', label: 'Reseller' }
] as const;

export const ACCOUNT_INDUSTRIES = [
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'apparel', label: 'Apparel' },
  { value: 'banking', label: 'Banking' },
  { value: 'biotechnology', label: 'Biotechnology' },
  { value: 'chemicals', label: 'Chemicals' },
  { value: 'communications', label: 'Communications' },
  { value: 'construction', label: 'Construction' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'education', label: 'Education' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'energy', label: 'Energy' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'environmental', label: 'Environmental' },
  { value: 'finance', label: 'Finance' },
  { value: 'food_beverage', label: 'Food & Beverage' },
  { value: 'government', label: 'Government' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'machinery', label: 'Machinery' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'media', label: 'Media' },
  { value: 'not_for_profit', label: 'Not For Profit' },
  { value: 'recreation', label: 'Recreation' },
  { value: 'retail', label: 'Retail' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'technology', label: 'Technology' },
  { value: 'telecommunications', label: 'Telecommunications' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'other', label: 'Other' }
] as const;

export const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'in_process', label: 'In Process' },
  { value: 'converted', label: 'Converted' },
  { value: 'recycled', label: 'Recycled' },
  { value: 'dead', label: 'Dead' }
] as const;

export const LEAD_SOURCES = [
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'existing_customer', label: 'Existing Customer' },
  { value: 'partner', label: 'Partner' },
  { value: 'public_relations', label: 'Public Relations' },
  { value: 'direct_mail', label: 'Direct Mail' },
  { value: 'conference', label: 'Conference' },
  { value: 'trade_show', label: 'Trade Show' },
  { value: 'web_site', label: 'Web Site' },
  { value: 'word_of_mouth', label: 'Word of mouth' },
  { value: 'other', label: 'Other' }
] as const;

export const OPPORTUNITY_STAGES = [
  { value: 'prospecting', label: 'Prospecting' },
  { value: 'qualification', label: 'Qualification' },
  { value: 'needs_analysis', label: 'Needs Analysis' },
  { value: 'value_proposition', label: 'Value Proposition' },
  { value: 'id_decision_makers', label: 'Id. Decision Makers' },
  { value: 'perception_analysis', label: 'Perception Analysis' },
  { value: 'proposal', label: 'Proposal/Price Quote' },
  { value: 'negotiation', label: 'Negotiation/Review' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' }
] as const;

export const TASK_STATUSES = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'started', label: 'Started' },
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'deferred', label: 'Deferred' }
] as const;

export const TASK_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
] as const;

export const CALL_STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'held', label: 'Held' },
  { value: 'not_held', label: 'Not Held' }
] as const;

export const CALL_DIRECTIONS = [
  { value: 'inbound', label: 'Inbound' },
  { value: 'outbound', label: 'Outbound' }
] as const;