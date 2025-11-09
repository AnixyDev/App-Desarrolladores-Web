// pages/DashboardPage.tsx
import React, { lazy, Suspense, useEffect, useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import { DollarSignIcon, ClockIcon, BriefcaseIcon, FileTextIcon, SparklesIcon, RefreshCwIcon, AlertTriangleIcon } from '../components/icons/Icon';
import { getDashboardInsights } from '../services/geminiService';
import OnboardingGuide from '../components/OnboardingGuide';
import Skeleton from '../components/ui/Skeleton';

const IncomeExpenseChart = lazy(() => import('../components/charts/IncomeExpenseChart'));

const StatCard: React.FC<{ icon: React.ElementType; title: string; value: string | number; link?: string; iconColor?: string; }> = ({ icon: Icon, title, value, link, iconColor = 'text-primary-400' }) => {
    const content = (
        <CardContent className="flex items-center p-4">
            <Icon className={`w-7 h-7 mr-4 ${iconColor}`} />
            <div>
                <p className="text-sm text-gray-400">{title}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
            </div>
        </CardContent>
    );

    const cardElement = (
        <Card className="h-full">
            {content}
        </Card>
    );

    if (link) {
        return <Link to={link} className="block h-full">{cardElement}</Link>;
    }
    return cardElement;
};

const AICoachWidget: React.FC = () => {
    const { invoices, timeEntries, expenses } = useAppStore();
    const [insights, setInsights] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchInsights = async () => {
            setIsLoading(true);
            try {
                const unbilledHours = timeEntries
                    .filter(t => !t.invoice_id)
                    .reduce((sum, t) => sum + t.duration_seconds, 0) / 3600;

                const overdueInvoices = invoices.filter(i => !i.paid && new Date(i.due_date) < new Date());

                const summaryData = {
                    unbilledHours: unbilledHours.toFixed(2),
                    overdueInvoicesCount: overdueInvoices.length,
                    totalPending: invoices.filter(i => !i.paid).reduce((sum, i) => sum + i.total_cents, 0) / 100,
                };

                const result = await getDashboardInsights(summaryData);
                setInsights(result);
            } catch (error) {
                console.error("Failed to get AI insights:", error);
                setInsights(["No se pudieron cargar las sugerencias de la IA."]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInsights();
    }, [invoices, timeEntries, expenses]);
    
    return (
        <Card>
            <CardHeader><h2 className="text-lg font-semibold text-white flex items-center gap-2"><SparklesIcon className="text-purple-400"/> Perspectivas de la IA</h2></CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-4/6" />
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-300">
                                <AlertTriangleIcon className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
                                <span>{insight}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}


const DashboardPage: React.FC = () => {
    const { invoices, expenses, projects, timeEntries, profile, getClientById, monthlyGoalCents } = useAppStore();
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const stats = {
        pendingInvoices: invoices.filter(i => !i.paid).reduce((sum, i) => sum + i.total_cents, 0),
        activeProjects: projects.filter(p => p.status === 'in-progress').length,
        hoursThisWeek: timeEntries.filter(t => new Date(t.start_time) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).reduce((sum, t) => sum + t.duration_seconds, 0) / 3600,
        paidThisMonth: invoices
            .filter(i => i.paid && i.payment_date && new Date(i.payment_date).getMonth() === currentMonth && new Date(i.payment_date).getFullYear() === currentYear)
            .reduce((sum, i) => sum + i.total_cents, 0),
        issuedThisMonth: invoices
            .filter(i => {
                const issueDate = new Date(i.issue_date);
                return issueDate.getMonth() === currentMonth && issueDate.getFullYear() === currentYear;
            })
            .reduce((sum, i) => sum + i.total_cents, 0),
    };
    
    const goalProgress = monthlyGoalCents > 0 ? (stats.paidThisMonth / monthlyGoalCents) * 100 : 0;

    return (
        <div className="space-y-6">
            {profile.isNewUser && <OnboardingGuide />}

            <h1 className="text-2xl font-semibold text-white">Hola, {profile?.full_name?.split(' ')[0]}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon={DollarSignIcon} title="Ingresos este Mes" value={formatCurrency(stats.paidThisMonth)} iconColor="text-green-400" />
                <StatCard icon={FileTextIcon} title="Pendiente de Cobro" value={formatCurrency(stats.pendingInvoices)} iconColor="text-yellow-400" />
                <StatCard icon={BriefcaseIcon} title="Proyectos Activos" value={stats.activeProjects} iconColor="text-blue-400" />
                <StatCard icon={ClockIcon} title="Horas (Últimos 7 días)" value={`${stats.hoursThisWeek.toFixed(1)}h`} iconColor="text-purple-400"/>
            </div>

            <AICoachWidget />

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-white">Resumen Mensual</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-sm text-gray-400">Facturado</p>
                            <p className="text-xl font-bold text-blue-400">{formatCurrency(stats.issuedThisMonth)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Cobrado</p>
                            <p className="text-xl font-bold text-green-400">{formatCurrency(stats.paidThisMonth)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400">Meta</p>
                            <p className="text-xl font-bold text-white">{formatCurrency(monthlyGoalCents)}</p>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Progreso de la Meta ({formatCurrency(monthlyGoalCents)})</span>
                            <span>{goalProgress.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2.5">
                            <div className="bg-gradient-to-r from-fuchsia-600 to-purple-600 h-2.5 rounded-full" style={{ width: `${Math.min(goalProgress, 100)}%` }}></div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Ingresos vs. Gastos (Últimos meses)</h2>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<div className="h-[300px]"><Skeleton className="h-full w-full"/></div>}>
                            <IncomeExpenseChart invoices={invoices} expenses={expenses} />
                        </Suspense>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Facturas Recientes</h2>
                    </CardHeader>
                    <CardContent className="p-0">
                         <ul className="divide-y divide-gray-800">
                            {invoices.slice(0, 5).map(invoice => (
                                <li key={invoice.id} className="p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-semibold text-white font-mono">{invoice.invoice_number}</p>
                                        <Link to={`/clients/${invoice.client_id}`} className="text-sm text-primary-400 hover:underline">{getClientById(invoice.client_id)?.name}</Link>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-white">{formatCurrency(invoice.total_cents)}</p>
                                        <span className={`px-2 py-0.5 rounded-full text-xs ${invoice.paid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                                            {invoice.paid ? 'Pagada' : 'Pendiente'}
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default DashboardPage;