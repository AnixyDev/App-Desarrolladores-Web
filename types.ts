// types.ts

export interface InvoiceItem {
    description: string;
    quantity: number;
    price_cents: number;
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
    name: string;
    client_id: string;
    description?: string;
    status: 'planning' | 'in-progress' | 'completed' | 'on-hold';
    start_date: string;
    due_date: string;
    budget_cents: number;
    created_at: string;
    category?: string;
    priority?: string;
}
export type NewProject = Omit<Project, 'id' | 'user_id' | 'created_at'>;

export interface Task {
    id: string;
    user_id: string;
    project_id: string;
    description: string;
    completed: boolean;
    created_at: string;
    invoice_id: string | null;
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
export type NewTimeEntry = Omit<TimeEntry, 'id' | 'user_id' | 'created_at'>;

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
}

export interface Profile {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
    business_name: string;
    tax_id: string;
    hourly_rate_cents: number;
    pdf_color: string;
    plan: 'Free' | 'Pro' | 'Teams';
    ai_credits: number;
    affiliate_code: string;
    bio: string;
    skills: string[];
    portfolio_url: string;
    payment_reminders_enabled: boolean;
    reminder_template_upcoming: string;
    reminder_template_overdue: string;
}

export interface UserData {
    id: string;
    name: string;
    email: string;
    role: 'Admin' | 'Manager' | 'Developer';
    status: 'Activo' | 'Inactivo' | 'Pendiente';
    invitedOn?: string;
}

export interface GoogleJwtPayload {
    name: string;
    email: string;
    picture: string;
    sub: string;
}

export interface Notification {
    id: string;
    message: string;
    link: string;
    isRead: boolean;
    createdAt: string;
}

export interface Referral {
    id: string;
    name: string;
    join_date: string;
    status: 'Registered' | 'Subscribed';
    commission_cents: number;
}

export interface KnowledgeArticle {
    id: string;
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

export interface ProjectMessage {
    id: string;
    project_id: string;
    user_id: string;
    user_name: string;
    text: string;
    timestamp: string;
}
