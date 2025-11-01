import { Profile, Client, Project, Task, Invoice, Expense, RecurringExpense, TimeEntry, Budget, Proposal, Contract, ProjectMessage, UserData, Referral } from '../types.ts';

const USER_ID = 'u-1';
const CLIENT_1_ID = 'c-1';
const CLIENT_2_ID = 'c-2';
const PROJECT_1_ID = 'p-1';
const PROJECT_2_ID = 'p-2';
const PROJECT_3_ID = 'p-3';

const profile: Profile = {
  id: USER_ID,
  full_name: 'Alex Doe',
  email: 'admin@dev.com',
  business_name: 'Alex Doe Web Dev',
  tax_id: 'ESX1234567Z',
  hourly_rate_cents: 6000,
  pdf_color: '#d9009f',
  plan: 'Teams',
  ai_credits: 500,
  affiliate_code: 'ALEXDOE123',
};

const clients: Client[] = [
  { id: CLIENT_1_ID, user_id: USER_ID, name: 'Global Tech Inc.', company: 'Global Tech Inc.', email: 'contact@globaltech.com', phone: '123-456-7890', created_at: '2023-01-15T10:00:00Z' },
  { id: CLIENT_2_ID, user_id: USER_ID, name: 'Creative Solutions', company: 'Creative Solutions LLC', email: 'hello@creative.dev', phone: '987-654-3210', created_at: '2023-02-20T11:00:00Z' },
];

const projects: Project[] = [
  { id: PROJECT_1_ID, user_id: USER_ID, client_id: CLIENT_1_ID, name: 'E-commerce Platform', description: 'Development of a new e-commerce platform with React and Node.js.', status: 'in-progress', start_date: '2023-08-01', due_date: '2024-02-28', budget_cents: 2500000, created_at: '2023-07-25T14:00:00Z', category: 'Web Development', priority: 'high' },
  { id: PROJECT_2_ID, user_id: USER_ID, client_id: CLIENT_2_ID, name: 'Marketing Website', description: 'Redesign and development of the main marketing website.', status: 'completed', start_date: '2023-06-10', due_date: '2023-09-30', budget_cents: 800000, created_at: '2023-06-01T09:00:00Z', category: 'Web Design', priority: 'medium' },
  { id: PROJECT_3_ID, user_id: USER_ID, client_id: CLIENT_1_ID, name: 'Mobile App API', description: 'API development for the new mobile application.', status: 'planning', start_date: '2024-03-01', due_date: '2024-07-31', budget_cents: 1500000, created_at: '2024-01-10T16:00:00Z', category: 'API Development', priority: 'high' },
];

const tasks: Task[] = [
  { id: 't-1', user_id: USER_ID, project_id: PROJECT_1_ID, description: 'Setup project structure', completed: true, invoice_id: 'inv-1', created_at: '2023-08-02T10:00:00Z' },
  { id: 't-2', user_id: USER_ID, project_id: PROJECT_1_ID, description: 'Implement user authentication', completed: false, invoice_id: null, created_at: '2023-08-05T11:00:00Z' },
  { id: 't-3', user_id: USER_ID, project_id: PROJECT_2_ID, description: 'Design homepage mockups', completed: true, invoice_id: 'inv-2', created_at: '2023-06-12T12:00:00Z' },
];

const invoices: Invoice[] = [
  { id: 'inv-1', user_id: USER_ID, client_id: CLIENT_1_ID, project_id: PROJECT_1_ID, invoice_number: 'INV-0001', issue_date: '2023-09-01', due_date: '2023-09-30', items: [{ description: 'Milestone 1', quantity: 1, price_cents: 1000000 }], subtotal_cents: 1000000, tax_percent: 21, total_cents: 1210000, paid: true, payment_date: '2023-09-15', created_at: '2023-09-01T09:00:00Z' },
  { id: 'inv-2', user_id: USER_ID, client_id: CLIENT_2_ID, project_id: PROJECT_2_ID, invoice_number: 'INV-0002', issue_date: '2023-10-01', due_date: '2023-10-31', items: [{ description: 'Final delivery', quantity: 1, price_cents: 800000 }], subtotal_cents: 800000, tax_percent: 21, total_cents: 968000, paid: false, payment_date: null, created_at: '2023-10-01T10:00:00Z' },
];

const expenses: Expense[] = [
  { id: 'e-1', user_id: USER_ID, project_id: null, description: 'Figma Subscription', amount_cents: 1500, tax_percent: 21, date: '2023-10-05', category: 'Software', created_at: '2023-10-05T00:00:00Z' },
  { id: 'e-2', user_id: USER_ID, project_id: PROJECT_1_ID, description: 'Server Hosting (Vercel)', amount_cents: 2000, tax_percent: 21, date: '2023-10-01', category: 'Hosting', created_at: '2023-10-01T00:00:00Z' },
];

const recurringExpenses: RecurringExpense[] = [
    { id: 're-1', user_id: USER_ID, description: 'WebStorm IDE', amount_cents: 1200, category: 'Software', frequency: 'monthly', start_date: '2023-01-10', next_due_date: '2024-11-10', created_at: '2023-01-10T00:00:00Z' },
];

const timeEntries: TimeEntry[] = [
  { id: 'te-1', user_id: USER_ID, project_id: PROJECT_1_ID, description: 'API development', start_time: '2023-10-20T09:00:00Z', end_time: '2023-10-20T13:00:00Z', duration_seconds: 14400, invoice_id: null, created_at: '2023-10-20T13:00:00Z' },
  { id: 'te-2', user_id: USER_ID, project_id: PROJECT_2_ID, description: 'Meeting with client', start_time: '2023-09-15T14:00:00Z', end_time: '2023-09-15T15:00:00Z', duration_seconds: 3600, invoice_id: 'inv-2', created_at: '2023-09-15T15:00:00Z' },
];

const budgets: Budget[] = [
    { id: 'b-1', user_id: USER_ID, client_id: CLIENT_1_ID, description: 'New Landing Page', items: [{ description: 'Design & Development', quantity: 1, price_cents: 300000 }], amount_cents: 300000, status: 'accepted', created_at: '2023-09-05' },
];

const proposals: Proposal[] = [
    { id: 'prop-1', user_id: USER_ID, client_id: CLIENT_2_ID, title: 'Social Media App Proposal', content: '...', amount_cents: 5000000, status: 'sent', created_at: '2023-10-10' },
];

const contracts: Contract[] = [
    { id: 'cont-1', user_id: USER_ID, client_id: CLIENT_1_ID, project_id: PROJECT_1_ID, content: 'Contract text...', status: 'signed', created_at: '2023-07-25T14:00:00Z', signed_by: 'John Smith (Global Tech)', signed_at: '2023-07-26T10:00:00Z' },
    { id: 'cont-2', user_id: USER_ID, client_id: CLIENT_2_ID, project_id: PROJECT_2_ID, content: 'Contract text...', status: 'sent', created_at: '2023-06-01T09:00:00Z' },
];

const users: UserData[] = [
  { id: 'u-1', name: 'Tú (Admin)', email: 'admin@dev.com', role: 'Admin', status: 'Activo' },
  { id: 'u-2', name: 'Laura Gómez', email: 'laura.gomez@example.com', role: 'Developer', status: 'Activo' },
  { id: 'u-3', name: 'Carlos Díaz', email: 'carlos.diaz@example.com', role: 'Manager', status: 'Inactivo' },
];

const referrals: Referral[] = [
    { id: 'ref-1', name: 'Jane Smith', join_date: '2024-10-15', status: 'Subscribed', commission_cents: 1140 },
    { id: 'ref-2', name: 'Bob Johnson', join_date: '2024-10-20', status: 'Joined', commission_cents: 0 },
];

export const MOCK_PROJECT_MESSAGES: ProjectMessage[] = [
  { id: 'pm-1', project_id: PROJECT_1_ID, user_id: USER_ID, user_name: 'Alex Doe', text: 'Hey team, I\'ve pushed the initial setup for the auth module.', timestamp: '2023-10-20T10:00:00Z' },
  { id: 'pm-2', project_id: PROJECT_1_ID, user_id: 'client-user-1', user_name: 'John (Client)', text: 'Great! When can we expect the first demo?', timestamp: '2023-10-20T10:05:00Z' },
];

export const MOCK_DATA = {
    profile,
    clients,
    projects,
    tasks,
    invoices,
    expenses,
    recurringExpenses,
    timeEntries,
    budgets,
    proposals,
    contracts,
    users,
    referrals,
    monthlyGoalCents: 500000,
};