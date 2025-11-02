import { AuthSlice } from './hooks/store/authSlice.ts';
import { ClientSlice } from './hooks/store/clientSlice.ts';
import { ProjectSlice } from './hooks/store/projectSlice.ts';
import { FinanceSlice } from './hooks/store/financeSlice.ts';
import { TeamSlice } from './hooks/store/teamSlice.ts';
import { NotificationSlice } from './hooks/store/notificationSlice.ts';


// Export Slice interfaces for combined AppState type
export type { AuthSlice, ClientSlice, ProjectSlice, FinanceSlice, TeamSlice, NotificationSlice };

export interface Notification {
  id: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  created_at: string;
}
export type NewClient = Omit<Client, 'id' | 'user_id' | 'created_at'>;

export interface Project {
  id: string;
  user_id: string;
  client_id: string;
  name: string;
  description?: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  start_date: string;
  due_date: string;
  budget_cents: number;
  created_at: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
}
export type NewProject = Omit<Project, 'id' | 'user_id' | 'created_at'>;

export interface InvoiceItem {
  description: string;
  quantity: number;
  price_cents: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  project_id: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  items: InvoiceItem[];
  subtotal_cents: number;
  tax_percent: number;
  total_cents: number;
  paid: boolean;
  payment_date: string | null;
  created_at: string;
}

export interface Expense {
  id: string;
  user_id: string;
  project_id: string | null;
  description: string;
  amount_cents: number;
  tax_percent?: number;
  date: string;
  category: string;
  created_at: string;
}

export interface RecurringExpense {
  id: string;
  user_id: string;
  description: string;
  amount_cents: number;
  category: string;
  frequency: 'monthly' | 'yearly';
  start_date: string;
  next_due_date: string;
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string;
  description: string;
  completed: boolean;
  invoice_id: string | null;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  project_id: string;
  description: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  invoice_id: string | null;
  created_at: string;
}
export type NewTimeEntry = Omit<TimeEntry, 'id' | 'created_at'>;


export interface Budget {
  id: string;
  user_id: string;
  client_id: string;
  description: string;
  items: InvoiceItem[];
  amount_cents: number;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

export interface Proposal {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  content: string;
  amount_cents: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  created_at: string;
  signed_by?: string;
  signed_at?: string;
}

export interface Contract {
  id: string;
  user_id: string;
  client_id: string;
  project_id: string;
  content: string;
  status: 'draft' | 'sent' | 'signed';
  created_at: string;
  signed_by?: string;
  signed_at?: string;
}

export interface ProjectMessage {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  text: string;
  timestamp: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  business_name: string;
  tax_id: string;
  hourly_rate_cents: number;
  pdf_color: string;
  plan: 'Free' | 'Pro' | 'Teams';
  ai_credits: number;
  affiliate_code: string;
}

export interface GoogleJwtPayload {
  email: string;
  name: string;
  picture: string;
  sub: string;
}

export interface Job {
  id: number;
  titulo: string;
  descripcionCorta: string;
  presupuesto: number;
  duracionSemanas: number;
  compatibilidadIA: number;
  habilidades: string[];
  cliente: string;
  fechaPublicacion: string;
  isFeatured?: boolean;
}

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Developer';
  status: 'Activo' | 'Inactivo';
}

export interface Referral {
    id: string;
    name: string;
    join_date: string;
    status: 'Joined' | 'Subscribed';
    commission_cents: number;
}