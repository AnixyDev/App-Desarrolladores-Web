// types.ts

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  business_name: string;
  tax_id: string;
  avatar_url: string;
  plan: 'Free' | 'Pro' | 'Teams';
  ai_credits: number;
  hourly_rate_cents: number;
  pdf_color: string;
  isNewUser: boolean;
  // --- Freelancer Profile ---
  bio?: string;
  skills?: string[];
  portfolio_url?: string;
  specialty?: string;
  availability_hours?: number;
  preferred_hourly_rate_cents?: number;
  // --- Payment Automation ---
  payment_reminders_enabled: boolean;
  reminder_template_upcoming: string;
  reminder_template_overdue: string;
  // --- Email Notifications ---
  email_notifications: {
    on_invoice_overdue: boolean;
    on_proposal_status_change: boolean;
    on_contract_signed: boolean;
    on_new_project_message: boolean;
  };
  // --- Affiliate Program ---
  affiliate_code: string;
  // --- Stripe Connect ---
  stripe_account_id: string;
  stripe_onboarding_complete: boolean;
  stripe_customer_id?: string | null;
}

export interface Client {
  id: string;
  user_id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  created_at: string;
  payment_method_on_file?: boolean;
  stripe_customer_id?: string | null;
}
export type NewClient = Omit<Client, 'id' | 'user_id' | 'created_at'>;


export interface Project {
  id: string;
  user_id: string;
  name: string;
  client_id: string;
  description?: string;
  status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
  start_date: string;
  due_date: string;
  budget_cents: number;
  created_at: string;
  category?: string;
  priority?: 'Low' | 'Medium' | 'High';
}
export type NewProject = Omit<Project, 'id' | 'user_id' | 'created_at'>;

export interface Task {
  id: string;
  user_id: string;
  project_id: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  created_at: string;
  invoice_id: string | null;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  price_cents: number;
}

export interface Invoice {
  id: string;
  user_id: string;
  invoice_number: string;
  client_id: string;
  project_id: string | null;
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

export interface RecurringInvoice {
    id: string;
    user_id: string;
    client_id: string;
    project_id: string | null;
    items: InvoiceItem[];
    tax_percent: number;
    frequency: 'monthly' | 'yearly';
    start_date: string;
    next_due_date: string;
    created_at: string;
}


export interface Expense {
  id: string;
  user_id: string;
  description: string;
  amount_cents: number;
  tax_percent: number;
  date: string;
  category: string;
  project_id: string | null;
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
    expires_at?: string;
    signature?: string;
}

export interface UserData {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Manager' | 'Developer';
    status: 'Activo' | 'Pendiente' | 'Inactivo';
    invitedOn?: string;
    hourly_rate_cents: number;
}

export interface Referral {
    id: string;
    referrer_id: string; // ID del usuario que refiere
    referred_user_id: string; // ID del nuevo usuario
    referred_user_name: string; // Nombre del nuevo usuario
    join_date: string;
    status: 'Registered' | 'Subscribed';
    commission_cents: number;
}

export interface KnowledgeArticle {
    id: string;
    user_id: string;
    title: string;
    content: string;
    tags: string[];
    created_at: string;
    updated_at: string;
}

export interface Job {
    id: string;
    titulo: string;
    descripcionCorta: string;
    descripcionLarga: string;
    presupuesto: number;
    duracionSemanas: number;
    habilidades: string[];
    cliente: string;
    fechaPublicacion: string;
    isFeatured: boolean;
    compatibilidadIA: number;
    postedByUserId: string;
}

export interface JobApplication {
    id: string;
    jobId: string;
    userId: string;
    applicantName: string;
    jobTitle: string;
    proposalText: string;
    status: 'sent' | 'viewed' | 'accepted' | 'rejected';
    appliedAt: string;
}

export interface Notification {
  id: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export interface ProjectMessage {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  text: string;
  timestamp: string;
}

export interface ProjectFile {
    id: string;
    project_id: string;
    fileName: string;
    fileType: string;
    url: string; // For mock, this will just be a placeholder
    uploadedAt: string;
}

export interface ShadowIncomeEntry {
  id: string;
  description: string;
  amount_cents: number;
  date: string;
}


export interface GoogleJwtPayload {
  name: string;
  email: string;
  picture: string;
}

// --- NEW TEMPLATE TYPES ---
export interface InvoiceTemplate {
    id: string;
    name: string;
    items: InvoiceItem[];
    tax_percent: number;
}

export interface ProposalTemplate {
    id: string;
    name: string;
    title_template: string;
    content_template: string;
}

export interface ContractTemplate {
    id: string;
    name: string;
    content_template: string;
}


// --- ENHANCED PORTAL TYPES ---
export interface PortalComment {
  id: string;
  entityId: string; // e.g., invoiceId, proposalId, contractId
  userName: string;
  userAvatar: string;
  text: string;
  timestamp: string;
}

export interface PortalFile {
  id:string;
  entityId: string;
  fileName: string;
  fileType: string;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}