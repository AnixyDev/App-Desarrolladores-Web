import { Profile, Client, Project, Task, Invoice, Expense, RecurringExpense, TimeEntry, Budget, Proposal, Contract, UserData, Referral } from '../types.ts';

const USER_ID = 'u-1';

const profile: Profile = {
  id: USER_ID,
  full_name: 'Alex Doe',
  email: 'admin@dev.com',
  business_name: 'Alex Doe Web Dev',
  tax_id: '',
  hourly_rate_cents: 0,
  pdf_color: '#d9009f',
  plan: 'Free',
  ai_credits: 10,
  affiliate_code: 'ALEXDOE123',
};

const clients: Client[] = [];
const projects: Project[] = [];
const tasks: Task[] = [];
const invoices: Invoice[] = [];
const expenses: Expense[] = [];
const recurringExpenses: RecurringExpense[] = [];
const timeEntries: TimeEntry[] = [];
const budgets: Budget[] = [];
const proposals: Proposal[] = [];
const contracts: Contract[] = [];
// Mantenemos el usuario principal para que aparezca en la lista de gestión de equipos
const users: UserData[] = [
  { id: 'u-1', name: 'Tú (Admin)', email: 'admin@dev.com', role: 'Admin', status: 'Activo' },
];
const referrals: Referral[] = [];

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
    monthlyGoalCents: 0,
};
