
// pages/DashboardPage.tsx
import React, { lazy, Suspense } from 'react';
// FIX: Remove .tsx extensions from imports to resolve module resolution errors.
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import { DollarSignIcon, ClockIcon, BriefcaseIcon, FileTextIcon } from '../components/icons/Icon';

const IncomeExpenseChart = lazy(() => import('../components/charts/IncomeExpenseChart'));

const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string | number; link?: string }> = ({ icon: Icon, title, value, link }) => {
    const content = (
        <CardContent className="flex items-center p-4">
            <div className="p-3 rounded-full bg-primary-600/20 text-primary-400 mr-4">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-sm text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </CardContent>
    );

    if (link) {
        return <Link to={link} className="block hover:bg-gray-800/50 rounded-lg"><Card>{content}</Card></Link>;
    }
    return <Card>{content}</Card>;
};

const DashboardPage: React.FC = () => {
    const { invoices, expenses, projects, tasks, timeEntries, profile, getClientById, monthlyGoalCents } = useAppStore();

    const stats = {
        pendingInvoices: invoices.filter(i => !i.paid).reduce((sum, i) => sum + i.total_cents, 0),
        activeProjects: projects.filter(p => p.status === 'in-progress').length,
        hoursThisWeek: timeEntries.filter(t => new Date(t.start_time) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).reduce((sum, t) => sum + t.duration_seconds, 0) / 3600,
        monthlyIncome: invoices.filter(i => i.paid && i.payment_date && new Date(i.payment_date).getMonth() === new Date().getMonth()).reduce((sum, i) => sum + i.subtotal_cents, 0)
    };
    
    const goalProgress = monthlyGoalCents > 0 ? (stats.monthlyIncome / monthlyGoalCents) * 100 : 0;

    const activeProjectsList = projects.filter(p => p.status === 'in-progress').slice(0, 5);
    const pendingInvoicesList = invoices.filter(i => !i.paid).slice(0, 5);

    const getProjectProgress = (projectId: string) => {
        const projectTasks = tasks.filter(t => t.project_id === projectId);
        if (projectTasks.length === 0) return 0;
        const completed = projectTasks.filter(t => t.completed).length;
        return Math.round((completed / projectTasks.length) * 100);
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-white">Hola, {profile?.full_name?.split(' ')[0]}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={DollarSignIcon} title="Ingresos este Mes" value={formatCurrency(stats.monthlyIncome)} />
                <StatCard icon={FileTextIcon} title="Pendiente de Cobro" value={formatCurrency(stats.pendingInvoices)} />
                <StatCard icon={BriefcaseIcon} title="Proyectos Activos" value={stats.activeProjects} />
                <StatCard icon={ClockIcon} title="Horas (Últimos 7 días)" value={`${stats.hoursThisWeek.toFixed(1)}h`} />
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-white">Progreso hacia tu Meta Mensual ({formatCurrency(monthlyGoalCents)})</h2>
                </CardHeader>
                <CardContent>
                    <div className="w-full bg-gray-700 rounded-full h-4">
                        <div className="bg-primary-600 h-4 rounded-full text-center text-xs text-white font-bold" style={{ width: `${Math.min(goalProgress, 100)}%` }}>
                           {goalProgress.toFixed(0)}%
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Ingresos vs. Gastos (Últimos meses)</h2>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<div className="h-[300px] flex items-center justify-center text-gray-400">Cargando gráfico...</div>}>
                            <IncomeExpenseChart invoices={invoices} expenses={expenses} />
                        </Suspense>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <BriefcaseIcon className="w-5 h-5 text-purple-400"/> Proyectos Activos
                            </h2>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ul className="divide-y divide-gray-800">
                                {activeProjectsList.length > 0 ? activeProjectsList.map(project => {
                                    const progress = getProjectProgress(project.id);
                                    return (
                                        <li key={project.id} className="p-4 hover:bg-gray-800/50">
                                            <div className="flex justify-between items-center mb-2">
                                                <Link to={`/projects/${project.id}`} className="font-semibold text-white hover:underline text-sm truncate max-w-[150px]">{project.name}</Link>
                                                <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded border border-gray-700">{progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-1.5">
                                                <div className="bg-primary-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                            </div>
                                        </li>
                                    );
                                }) : <p className="p-4 text-gray-500 text-sm text-center">No hay proyectos activos.</p>}
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <FileTextIcon className="w-5 h-5 text-yellow-400"/> Facturas Pendientes
                            </h2>
                        </CardHeader>
                        <CardContent className="p-0">
                             <ul className="divide-y divide-gray-800">
                                {pendingInvoicesList.length > 0 ? pendingInvoicesList.map(invoice => (
                                    <li key={invoice.id} className="p-4 flex justify-between items-center hover:bg-gray-800/50">
                                        <div>
                                            <p className="font-semibold text-white font-mono text-sm">{invoice.invoice_number}</p>
                                            <Link to={`/clients/${invoice.client_id}`} className="text-xs text-gray-400 hover:underline">{getClientById(invoice.client_id)?.name}</Link>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-white text-sm">{formatCurrency(invoice.total_cents)}</p>
                                            <span className="text-[10px] text-yellow-500 border border-yellow-500/30 bg-yellow-500/10 px-1.5 py-0.5 rounded">Pendiente</span>
                                        </div>
                                    </li>
                                )) : <p className="p-4 text-gray-500 text-sm text-center">No hay facturas pendientes.</p>}
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
