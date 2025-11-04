// constants.ts
import {
    LayoutDashboard, Users, Briefcase, FileText, BarChart2,
    DollarSign, BookOpen, MessageSquare, FileSignature, Clock,
    Settings, Sparkles, TrendingUp, Share2, Shield,
    BrainCircuit, Zap, Plus, Star, Send, User, Building
} from 'lucide-react';

export const SIDEBAR_STRUCTURE = [
    { type: 'link', href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { type: 'link', href: '/clients', label: 'Clientes', icon: Users },
    { type: 'link', href: '/projects', label: 'Proyectos', icon: Briefcase },
    { type: 'group', label: 'Finanzas', icon: DollarSign, items: [
        { href: '/invoices', label: 'Facturas', icon: FileText },
        { href: '/expenses', label: 'Gastos', icon: BarChart2 },
        { href: '/budgets', label: 'Presupuestos', icon: MessageSquare },
        { href: '/proposals', label: 'Propuestas', icon: FileSignature },
        { href: '/contracts', label: 'Contratos', icon: BookOpen },
    ]},
    { type: 'link', href: '/time-tracking', label: 'Time Tracking', icon: Clock },
    { type: 'group', label: 'Reportes', icon: TrendingUp, items: [
        { href: '/reports', label: 'Resumen General', icon: TrendingUp },
        { href: '/reports/profitability', label: 'Rentabilidad', icon: DollarSign },
    ]},
    { type: 'link', href: '/tax-ledger', label: 'Libro Fiscal', icon: BookOpen },
    { type: 'link', href: '/ai-assistant', label: 'Asistente IA', icon: Sparkles },
    { type: 'group', label: 'Marketplace', icon: TrendingUp, items: [
        { href: '/job-market', label: 'Buscar Proyectos', icon: Briefcase },
        { href: '/post-job', label: 'Publicar Oferta', icon: Plus },
        { href: '/my-job-posts', label: 'Mis Ofertas', icon: Building },
    ]},
     { type: 'group', label: 'Mi Perfil Freelance', icon: User, items: [
        { href: '/public-profile', label: 'Mi Perfil Público', icon: User },
        { href: '/my-applications', label: 'Mis Postulaciones', icon: Send },
        { href: '/saved-jobs', label: 'Ofertas Guardadas', icon: Star },
    ]},
    { type: 'group', label: 'Equipo', icon: Users, items: [
        { href: '/team', label: 'Gestionar Equipo', icon: Users },
        { href: '/my-timesheet', label: 'Mi Hoja de Horas', icon: Clock },
        { href: '/knowledge-base', label: 'Knowledge Base', icon: BrainCircuit },
        { href: '/roles', label: 'Roles y Permisos', icon: Shield },
    ]},
    { type: 'link', href: '/integrations', label: 'Integraciones', icon: Zap },
    { type: 'link', href: '/forecasting', label: 'Previsión', icon: TrendingUp },
    { type: 'link', href: '/affiliate', label: 'Afiliados', icon: Share2 },
    { type: 'link', href: '/billing', label: 'Facturación y Plan', icon: DollarSign },
    { type: 'link', href: '/settings', label: 'Ajustes', icon: Settings },
];