import { Client, Project, Task, Invoice, Expense, RecurringExpense, TimeEntry, Budget, Proposal, Contract, UserData, Referral, KnowledgeArticle, Job, JobApplication } from '../types.ts';

const USER_ID = 'u-1';
const OTHER_USER_ID = 'u-2'; // For simulating other applicants

// --- Clientes ---
const clients: Client[] = [];

// --- Proyectos ---
const projects: Project[] = [];

// --- Tareas ---
const tasks: Task[] = [];

// --- Facturas ---
const invoices: Invoice[] = [];

// --- Gastos ---
const expenses: Expense[] = [];

// --- Gastos Recurrentes ---
const recurringExpenses: RecurringExpense[] = [];

// --- Registros de Tiempo ---
const timeEntries: TimeEntry[] = [];

// --- Knowledge Base Articles ---
const articles: KnowledgeArticle[] = [];

// --- Jobs and Applications ---
const jobs: Job[] = [];

const applications: JobApplication[] = [];


const users: UserData[] = [];
const referrals: Referral[] = [];
const budgets: Budget[] = [];
const proposals: Proposal[] = [];
const contracts: Contract[] = [];

export const MOCK_DATA = {
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
    articles,
    jobs,
    applications,
    monthlyGoalCents: 0,
};