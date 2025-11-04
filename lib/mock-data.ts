import { Client, Project, Task, Invoice, Expense, RecurringExpense, TimeEntry, Budget, Proposal, Contract, UserData, Referral, KnowledgeArticle, Job, JobApplication } from '../types.ts';

const USER_ID = 'u-1';
const OTHER_USER_ID = 'u-2'; // For simulating other applicants

// --- Clientes ---
const clients: Client[] = [
  { id: 'c-1', user_id: USER_ID, name: 'InnovateCorp', company: 'InnovateCorp Ltd.', email: 'contact@innovatecorp.com', phone: '123-456-7890', created_at: '2023-10-01T10:00:00Z' },
  { id: 'c-2', user_id: USER_ID, name: 'QuantumLeap', company: 'QuantumLeap Solutions', email: 'hello@quantumleap.dev', phone: '987-654-3210', created_at: '2023-09-15T14:30:00Z' },
];

// --- Proyectos ---
const projects: Project[] = [
  { id: 'p-1', user_id: USER_ID, client_id: 'c-1', name: 'Plataforma E-commerce', description: 'Desarrollo full-stack de una plataforma de e-commerce con Stripe.', status: 'in-progress', start_date: '2023-10-05', due_date: '2024-01-20', budget_cents: 1500000, created_at: '2023-10-02T11:00:00Z', category: 'Web', priority: 'high' },
  { id: 'p-2', user_id: USER_ID, client_id: 'c-2', name: 'Dashboard de Analíticas', description: 'Creación de un dashboard interactivo con D3.js y React.', status: 'planning', start_date: '2023-11-01', due_date: '2024-02-15', budget_cents: 800000, created_at: '2023-10-10T16:00:00Z', category: 'Data', priority: 'medium' },
  { id: 'p-3', user_id: USER_ID, client_id: 'c-1', name: 'Campaña de Marketing Landing Page', description: 'Diseño y desarrollo de una landing page optimizada para conversiones.', status: 'completed', start_date: '2023-09-01', due_date: '2023-09-30', budget_cents: 250000, created_at: '2023-08-28T09:00:00Z', category: 'Marketing', priority: 'high' },
];

// --- Tareas ---
const tasks: Task[] = [
  { id: 't-1', user_id: USER_ID, project_id: 'p-1', description: 'Configurar pasarela de pago Stripe', completed: true, invoice_id: null, created_at: '2023-10-15T10:00:00Z' },
  { id: 't-2', user_id: USER_ID, project_id: 'p-1', description: 'Desarrollar API de productos', completed: false, invoice_id: null, created_at: '2023-10-16T11:00:00Z' },
  { id: 't-3', user_id: USER_ID, project_id: 'p-2', description: 'Definir endpoints de datos', completed: false, invoice_id: null, created_at: '2023-11-02T12:00:00Z' },
];

// --- Facturas ---
const invoices: Invoice[] = [
  { id: 'inv-1', user_id: USER_ID, client_id: 'c-1', project_id: 'p-3', invoice_number: 'INV-0001', issue_date: '2023-10-01', due_date: '2023-10-31', items: [{ description: 'Landing page marketing', quantity: 1, price_cents: 250000 }], subtotal_cents: 250000, tax_percent: 21, total_cents: 302500, paid: true, payment_date: '2023-10-15', created_at: '2023-10-01T18:00:00Z' },
  { id: 'inv-2', user_id: USER_ID, client_id: 'c-2', project_id: null, invoice_number: 'INV-0002', issue_date: '2023-10-05', due_date: '2023-11-04', items: [{ description: 'Consultoría SEO', quantity: 10, price_cents: 10000 }], subtotal_cents: 100000, tax_percent: 21, total_cents: 121000, paid: false, payment_date: null, created_at: '2023-10-05T18:00:00Z' },
];

// --- Gastos ---
const expenses: Expense[] = [
  { id: 'e-1', user_id: USER_ID, project_id: 'p-1', description: 'Licencia de Figma', amount_cents: 1500, tax_percent: 21, date: '2023-10-10', category: 'Software', created_at: '2023-10-10T19:00:00Z' },
  { id: 'e-2', user_id: USER_ID, project_id: null, description: 'Suscripción a servidor (Vercel)', amount_cents: 2000, tax_percent: 21, date: '2023-10-01', category: 'Hosting', created_at: '2023-10-01T19:00:00Z' },
];

// --- Gastos Recurrentes ---
const recurringExpenses: RecurringExpense[] = [
    { id: 're-1', user_id: USER_ID, description: 'Adobe Creative Cloud', amount_cents: 5999, category: 'Software', frequency: 'monthly', start_date: '2023-01-15', next_due_date: '2023-11-15', created_at: '2023-01-15T09:00:00Z' },
];

// --- Registros de Tiempo ---
const timeEntries: TimeEntry[] = [
  { id: 'te-1', user_id: USER_ID, project_id: 'p-1', description: 'Investigación de API de Stripe', start_time: '2023-10-16T09:00:00Z', end_time: '2023-10-16T11:30:00Z', duration_seconds: 9000, invoice_id: null, created_at: '2023-10-16T11:30:00Z' },
  { id: 'te-2', user_id: USER_ID, project_id: 'p-3', description: 'Ajustes finales de diseño', start_time: '2023-09-28T14:00:00Z', end_time: '2023-09-28T16:00:00Z', duration_seconds: 7200, invoice_id: 'inv-1', created_at: '2023-09-28T16:00:00Z' },
];

// --- Knowledge Base Articles ---
const articles: KnowledgeArticle[] = [
    { id: 'kb-1', title: 'Guía de Despliegue en Vercel', content: 'Para desplegar un proyecto en Vercel, primero conecta tu repositorio de Git (GitHub, GitLab, Bitbucket). Vercel detectará automáticamente el framework. Asegúrate de configurar las variables de entorno necesarias en la configuración del proyecto.', tags: ['vercel', 'despliegue', 'git'], created_at: '2023-10-20', updated_at: '2023-10-20' },
    { id: 'kb-2', title: 'Configuración Inicial de Stripe', content: 'Para integrar Stripe, necesitas obtener tus claves API (publicable y secreta) desde el Dashboard de Stripe. La clave secreta debe guardarse de forma segura en las variables de entorno de tu backend.', tags: ['stripe', 'pagos', 'api'], created_at: '2023-10-18', updated_at: '2023-10-19' },
];

// --- Jobs and Applications ---
const jobs: Job[] = [
    { id: 'job-1', titulo: 'Desarrollador Senior de React para App Financiera', descripcionCorta: 'Buscamos un experto en React y TypeScript para construir un dashboard financiero de alto rendimiento.', descripcionLarga: `**Responsabilidades:**\n- Liderar el desarrollo del frontend para nuestra nueva aplicación de análisis financiero.\n- Colaborar con el equipo de backend para diseñar e implementar APIs eficientes.\n- Asegurar la calidad del código, el rendimiento y la escalabilidad de la aplicación.\n\n**Requisitos:**\n- 5+ años de experiencia con React y TypeScript.\n- Experiencia con librerías de visualización de datos (D3, Recharts).\n- Sólidos conocimientos de Git, CI/CD y testing.`, presupuesto: 8000, duracionSemanas: 12, habilidades: ['React', 'TypeScript', 'D3.js', 'Fintech'], cliente: 'InnovateCorp', fechaPublicacion: 'Hace 2 días', compatibilidadIA: 92, isFeatured: true, postedByUserId: USER_ID },
    { id: 'job-2', titulo: 'Backend Engineer (Node.js) para API de E-commerce', descripcionCorta: 'Necesitamos un desarrollador de Node.js para expandir nuestra API de e-commerce.', descripcionLarga: 'Estamos migrando nuestra plataforma a una arquitectura de microservicios y necesitamos un ingeniero de backend con experiencia para construir y mantener nuevos servicios para el catálogo de productos, inventario y gestión de pedidos. Se valorará experiencia con Docker y Kubernetes.', presupuesto: 6500, duracionSemanas: 10, habilidades: ['Node.js', 'PostgreSQL', 'Docker', 'Microservicios'], cliente: 'QuantumLeap', fechaPublicacion: 'Hace 1 semana', compatibilidadIA: 78, postedByUserId: 'other-client' },
    { id: 'job-3', titulo: 'Maquetador/a Web con Tailwind CSS', descripcionCorta: 'Buscamos un maquetador web con experiencia en Tailwind CSS para un proyecto de rediseño.', descripcionLarga: 'Necesitamos a alguien que pueda convertir diseños de Figma en componentes de React totalmente responsivos y accesibles, utilizando Tailwind CSS. El proyecto es el rediseño completo de nuestro sitio web corporativo. Se requiere atención al detalle y un buen ojo para el diseño.', presupuesto: 3000, duracionSemanas: 4, habilidades: ['HTML5', 'CSS3', 'Tailwind CSS', 'React', 'Figma'], cliente: 'CreativeMinds', fechaPublicacion: 'Hace 3 semanas', compatibilidadIA: 65, postedByUserId: 'other-client' },
];

const applications: JobApplication[] = [
    { id: 'app-1', jobId: 'job-2', userId: USER_ID, applicantName: 'Usuario Actual', jobTitle: 'Backend Engineer (Node.js) para API de E-commerce', proposalText: 'Hola, tengo amplia experiencia en Node.js y microservicios. Me gustaría saber más sobre vuestro proyecto.', status: 'sent', appliedAt: '2023-10-25T10:00:00Z' },
    { id: 'app-2', jobId: 'job-3', userId: OTHER_USER_ID, applicantName: 'Jane Doe', jobTitle: 'Maquetador/a Web con Tailwind CSS', proposalText: 'Soy una experta en Tailwind y Figma, creo que soy la candidata ideal.', status: 'sent', appliedAt: '2023-10-24T15:30:00Z' },
    { id: 'app-3', jobId: 'job-1', userId: OTHER_USER_ID, applicantName: 'John Smith', jobTitle: 'Desarrollador Senior de React para App Financiera', proposalText: 'Mi experiencia en el sector Fintech y con D3.js me convierte en el candidato perfecto para este rol.', status: 'sent', appliedAt: '2023-10-26T11:00:00Z' },
];


const users: UserData[] = [
  { id: 'u-1', name: 'Tú (Admin)', email: 'admin@dev.com', role: 'Admin', status: 'Activo' },
];
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
    monthlyGoalCents: 500000, // 5,000 EUR
};