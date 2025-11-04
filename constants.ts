// constants.ts
import {
    LayoutDashboard, Users, Briefcase, FileText, BarChart2,
    DollarSign, BookOpen, MessageSquare, FileSignature, Clock,
    Settings, Sparkles, TrendingUp, Share2, Shield,
    BrainCircuit, Zap, Plus, Star, Send, User, Building,
    ShoppingBag
} from 'lucide-react';

export const SIDEBAR_STRUCTURE = [
    // --- CORE ---
    { type: 'link', href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { type: 'link', href: '/clients', label: 'Clientes', icon: Users },
    { type: 'link', href: '/projects', label: 'Proyectos', icon: Briefcase },
    { type: 'link', href: '/time-tracking', label: 'Time Tracking', icon: Clock },

    // --- SALES ---
    { type: 'group', label: 'Ventas', icon: ShoppingBag, items: [
        { href: '/budgets', label: 'Presupuestos', icon: MessageSquare },
        { href: '/proposals', label: 'Propuestas', icon: FileSignature },
        { href: '/contracts', label: 'Contratos', icon: BookOpen },
    ]},

    // --- FINANCE ---
    { type: 'group', label: 'Finanzas', icon: DollarSign, items: [
        { href: '/invoices', label: 'Facturas', icon: FileText },
        { href: '/expenses', label: 'Gastos', icon: BarChart2 },
        { href: '/tax-ledger', label: 'Libro Fiscal', icon: BookOpen },
    ]},
    
    // --- REPORTS ---
    { type: 'group', label: 'Análisis y Reportes', icon: TrendingUp, items: [
        { href: '/reports', label: 'Resumen General', icon: TrendingUp },
        { href: '/reports/profitability', label: 'Rentabilidad', icon: DollarSign },
        { href: '/forecasting', label: 'Previsión', icon: TrendingUp },
    ]},

    // --- MARKETPLACE ---
    { type: 'group', label: 'Marketplace', icon: Building, items: [
        { href: '/job-market', label: 'Buscar Proyectos', icon: Briefcase },
        { href: '/saved-jobs', label: 'Ofertas Guardadas', icon: Star },
        { href: '/my-applications', label: 'Mis Postulaciones', icon: Send },
        { href: '/post-job', label: 'Publicar Oferta', icon: Plus },
        { href: '/my-job-posts', label: 'Mis Ofertas', icon: Building },
    ]},
    
    // --- AI ---
    { type: 'link', href: '/ai-assistant', label: 'Asistente IA', icon: Sparkles },

    // --- TEAM ---
    { type: 'group', label: 'Equipo', icon: Users, items: [
        { href: '/team', label: 'Gestionar Equipo', icon: Users },
        { href: '/roles', label: 'Roles y Permisos', icon: Shield },
        { href: '/knowledge-base', label: 'Knowledge Base', icon: BrainCircuit },
        { href: '/my-timesheet', label: 'Mi Hoja de Horas', icon: Clock },
    ]},
    
    // --- SETTINGS ---
    { type: 'group', label: 'Configuración', icon: Settings, items: [
        { href: '/settings', label: 'Ajustes Generales', icon: Settings },
        { href: '/public-profile', label: 'Perfil Público', icon: User },
        { href: '/billing', label: 'Facturación y Plan', icon: DollarSign },
        { href: '/integrations', label: 'Integraciones', icon: Zap },
        { href: '/affiliate', label: 'Afiliados', icon: Share2 },
    ]},
];
