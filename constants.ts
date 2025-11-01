import {
    LayoutDashboard, Users, Briefcase, FileText, DollarSign,
    MessageSquare, FileSignature, Clock, BarChart2, Book,
    Settings, Sparkles, TrendingUp, UsersIcon, ListTodo, BrainCircuitIcon, ZapIcon, ShieldIcon, StarIcon, Share2Icon
} from '../components/icons/Icon.tsx';

export const SIDEBAR_STRUCTURE = [
    { type: 'link', href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { type: 'link', href: '/clients', label: 'Clientes', icon: Users },
    { type: 'link', href: '/projects', label: 'Proyectos', icon: Briefcase },
    { type: 'group', label: 'Finanzas', icon: DollarSign, items: [
        { href: '/invoices', label: 'Facturas', icon: FileText },
        { href: '/budgets', label: 'Presupuestos', icon: MessageSquare },
        { href: '/proposals', label: 'Propuestas', icon: FileSignature },
        { href: '/expenses', label: 'Gastos', icon: DollarSign },
        { href: '/tax-ledger', label: 'Libro Fiscal', icon: Book },
    ]},
    { type: 'link', href: '/contracts', label: 'Contratos', icon: FileSignature },
    { type: 'link', href: '/time-tracking', label: 'Time Tracking', icon: Clock },
    { type: 'link', href: '/reports', label: 'Reportes', icon: BarChart2 },
    { type: 'link', href: '/forecasting', label: 'Previsión', icon: TrendingUp },
    { type: 'group', label: 'IA Tools', icon: Sparkles, items: [
        { href: '/ai-assistant', label: 'Asistente Chat', icon: MessageSquare },
        { href: '/job-market', label: 'Mercado de Proyectos', icon: TrendingUp },
    ]},
    { type: 'group', label: 'Equipo (Teams)', icon: UsersIcon, items: [
        { href: '/team', label: 'Miembros', icon: Users },
        { href: '/my-timesheet', label: 'Mis Horas', icon: ListTodo },
        { href: '/knowledge-base', label: 'Knowledge Base', icon: BrainCircuitIcon },
        { href: '/integrations', label: 'Automatización', icon: ZapIcon },
        { href: '/roles', label: 'Roles y Permisos', icon: ShieldIcon },
    ]},
    { type: 'group', label: 'Cuenta', icon: Settings, items: [
        { href: '/settings', label: 'Ajustes', icon: Settings },
        { href: '/billing', label: 'Facturación', icon: StarIcon },
        { href: '/affiliate', label: 'Afiliados', icon: Share2Icon },
    ]},
];