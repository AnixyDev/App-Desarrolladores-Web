
// pages/DashboardPage.tsx
import React, { lazy, Suspense, useEffect, useState, useMemo } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import { DollarSignIcon, ClockIcon, BriefcaseIcon, FileTextIcon, SparklesIcon, ListTodo, PlusIcon, Users as UsersIcon, RefreshCwIcon, TrendingUpIcon, ArrowUpCircleIcon, ArrowDownCircleIcon } from '../components/icons/Icon';
import { getDashboardInsights } from '../services/geminiService';
import OnboardingGuide from '../components/OnboardingGuide';
import Skeleton from '../components/ui/Skeleton';
import { useToast } from '../hooks/useToast';
import { Task } from '../types';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const IncomeExpenseChart = lazy(() => import('../components/charts/IncomeExpenseChart'));

const StatCard: React.FC<{ 
    icon: React.ElementType; 
    title: string; 
    value: string | number; 
    trend?: number; // Percentage change
    trendLabel?: string;
    link?: string; 
    iconColor?: string; 
}> = ({ icon: Icon, title, value, trend, trendLabel = "vs mes anterior", link, iconColor = 'text-primary-400' }) => {
    
    const content = (
        <CardContent className="flex flex-col justify-between h-full p-5">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-slate-800/50 border border-white/5 ${iconColor}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            
            {trend !== undefined && (
                <div className="mt-4 flex items-center text-xs">
                    {trend > 0 ? (
                        <ArrowUpCircleIcon className="w-4 h-4 text-green-400 mr-1" />
                    ) : trend < 0 ? (
                        <ArrowDownCircleIcon className="w-4 h-4 text-red-400 mr-1" />
                    ) : (
                        <div className="w-4 h-4 mr-1" /> // Spacer
                    )}
                    <span className={`font-semibold ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                        {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                    </span>
                    <span className="text-slate-500 ml-1">{trendLabel}</span>
                </div>
            )}
        </CardContent>
    );

    const cardElement = (
        <Card className="h-full transition-all duration-300 hover:border-primary/20 hover:shadow-lg">
            {content}
        </Card>
    );

    if (link) {
        return <Link to={link} className="block h-full">{cardElement}</Link>;
    }
    return cardElement;
};

const AICoachWidget: React.FC<{invoices: any[], timeEntries: any[], expenses: any[]}> = ({ invoices, timeEntries, expenses }) => {
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
                
                if (summaryData.unbilledHours === "0.00" && summaryData.overdueInvoicesCount === 0 && summaryData.totalPending === 0) {
                    setInsights(["¡Todo en orden! No hay acciones urgentes pendientes."]);
                } else {
                    const result = await getDashboardInsights(summaryData);
                    setInsights(result);
                }
            } catch (error) {
                // Fail silently in UI, log error
                console.error("Failed to get AI insights:", error);
                setInsights(["No se pudieron cargar las sugerencias de la IA por el momento."]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchInsights();
    }, [invoices, timeEntries, expenses]);
    
    return (
        <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    <SparklesIcon className="text-purple-400 w-5 h-5"/> 
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-fuchsia-400">
                        Perspectivas de la IA
                    </span>
                </h2>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="space-y-3 py-2">
                        <Skeleton className="h-4 w-5/6 bg-slate-800" />
                        <Skeleton className="h-4 w-full bg-slate-800" />
                    </div>
                ) : (
                    <ul className="space-y-3">
                        {insights.map((insight, index) => (
                            <li key={index} className="flex items-start gap-3 text-sm text-slate-300 bg-white/[0.03] p-3 rounded-lg">
                                <div className="mt-0.5 p-1 rounded-full bg-purple-500/10 shrink-0">
                                    <SparklesIcon className="w-3.5 h-3.5 text-purple-400" />
                                </div>
                                <span className="leading-relaxed">{insight}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
}

const NextStepsWidget: React.FC<{tasks: Task[], invoices: any[], projects: any[]}> = ({ tasks, invoices, projects }) => {
    const { getProjectById, getClientById, updateTaskStatus, addTask } = useAppStore();
    const { addToast } = useToast();

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({ description: '', project_id: projects[0]?.id || '' });

    const pendingTasks = useMemo(() => {
        return tasks
            .filter(t => t.status !== 'completed')
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .slice(0, 4);
    }, [tasks]);

    const actionableInvoices = useMemo(() => {
        return invoices
            .filter(i => !i.paid)
            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
            .slice(0, 3);
    }, [invoices]);

    const handleToggleTask = (task: Task) => {
        updateTaskStatus(task.id, 'completed');
        addToast(`Tarea "${task.description}" completada.`, 'success');
    };

    const handleAddTaskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTask.description.trim() && newTask.project_id) {
            addTask({
                project_id: newTask.project_id,
                description: newTask.description,
            });
            addToast('Nueva tarea añadida.', 'success');
            setIsTaskModalOpen(false);
            setNewTask({ description: '', project_id: projects[0]?.id || '' });
        }
    };

    return (
        <>
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <h2 className="text-lg font-semibold text-white">Actividad Reciente</h2>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col divide-y divide-slate-800">
                    {/* TAREAS SECTION */}
                    <div className="p-5 flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-slate-300 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <ListTodo className="w-4 h-4 text-purple-400"/> Tareas Pendientes
                            </h3>
                            <button onClick={() => setIsTaskModalOpen(true)} className="text-xs text-primary-400 hover:text-primary-300 flex items-center gap-1 font-medium transition-colors">
                                <PlusIcon className="w-3 h-3"/> Nueva
                            </button>
                        </div>
                        {pendingTasks.length > 0 ? (
                            <ul className="space-y-3">
                                {pendingTasks.map(task => (
                                    <li key={task.id} className="flex items-start gap-3 group">
                                        <input
                                            type="checkbox"
                                            onChange={() => handleToggleTask(task)}
                                            className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-800 text-primary-600 focus:ring-primary-500 focus:ring-offset-slate-900 cursor-pointer transition-all"
                                            aria-label={`Marcar como completada: ${task.description}`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-slate-200 group-hover:text-white transition-colors truncate">{task.description}</p>
                                            <Link to={`/projects/${task.project_id}`} className="text-xs text-slate-500 hover:text-primary-400 transition-colors truncate block">
                                                {getProjectById(task.project_id)?.name}
                                            </Link>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                                <p className="text-sm">¡Todo al día! 🎉</p>
                            </div>
                        )}
                    </div>

                    {/* FACTURAS SECTION */}
                    <div className="p-5">
                        <h3 className="font-semibold text-slate-300 flex items-center gap-2 text-sm uppercase tracking-wider mb-4">
                            <FileTextIcon className="w-4 h-4 text-yellow-400"/> Facturas por Cobrar
                        </h3>
                        {actionableInvoices.length > 0 ? (
                            <ul className="space-y-3">
                                {actionableInvoices.map(invoice => (
                                    <li key={invoice.id}>
                                        <Link to="/invoices" className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-slate-800/50 transition-colors group">
                                            <div className="min-w-0">
                                                <p className="text-sm text-slate-200 font-mono group-hover:text-white">#{invoice.invoice_number}</p>
                                                <p className="text-xs text-slate-500 truncate">{getClientById(invoice.client_id)?.name}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-sm font-semibold text-white">{formatCurrency(invoice.total_cents)}</p>
                                                <span className={`text-[10px] font-medium ${new Date(invoice.due_date) < new Date() ? 'text-red-400' : 'text-slate-500'}`}>
                                                    {new Date(invoice.due_date).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">No hay facturas pendientes.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title="Añadir Nueva Tarea">
                <form onSubmit={handleAddTaskSubmit} className="space-y-4">
                    <Input
                        label="Descripción de la Tarea"
                        value={newTask.description}
                        onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                        required
                        autoFocus
                        placeholder="Ej: Diseñar mockup de la home"
                    />
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Proyecto</label>
                        <select
                            value={newTask.project_id}
                            onChange={(e) => setNewTask(prev => ({ ...prev, project_id: e.target.value }))}
                            className="block w-full px-3 py-2.5 border border-slate-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm bg-slate-950/40 text-slate-200"
                            required
                        >
                            {projects.length > 0 ? (
                                projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                            ) : (
                                <option disabled value="">Crea un proyecto primero</option>
                            )}
                        </select>
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Guardar Tarea</Button>
                    </div>
                </form>
            </Modal>
        </>
    );
};


const DashboardPage: React.FC = () => {
    const { invoices, expenses, projects, timeEntries, profile, monthlyGoalCents, clients, tasks, fetchInitialData, session } = useAppStore();
    const [selectedClientId, setSelectedClientId] = useState<string>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const { addToast } = useToast();
    
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const lastMonthDate = new Date(currentYear, currentMonth - 1, 1);
    const lastMonth = lastMonthDate.getMonth();
    const lastMonthYear = lastMonthDate.getFullYear();

    const handleRefresh = async () => {
        if (!session?.user) return;
        setIsRefreshing(true);
        try {
            await fetchInitialData(session.user);
            addToast("Datos actualizados", "success");
        } catch (error) {
            addToast("Error al actualizar datos", "error");
        } finally {
            setTimeout(() => setIsRefreshing(false), 800);
        }
    };

    const filteredData = useMemo(() => {
        if (selectedClientId === 'all') {
            return { invoices, projects, timeEntries, expenses, tasks };
        }

        const clientProjects = projects.filter(p => p.client_id === selectedClientId);
        const clientProjectIds = clientProjects.map(p => p.id);

        return {
            invoices: invoices.filter(i => i.client_id === selectedClientId),
            projects: clientProjects,
            timeEntries: timeEntries.filter(t => clientProjectIds.includes(t.project_id)),
            expenses: expenses.filter(e => e.project_id && clientProjectIds.includes(e.project_id)),
            tasks: tasks.filter(t => clientProjectIds.includes(t.project_id)),
        };
    }, [selectedClientId, invoices, projects, timeEntries, expenses, tasks]);

    // Helper for stats
    const calculateMonthlyIncome = (invs: typeof invoices, month: number, year: number) => {
        return invs
            .filter(i => i.paid && i.payment_date && new Date(i.payment_date).getMonth() === month && new Date(i.payment_date).getFullYear() === year)
            .reduce((sum, i) => sum + i.total_cents, 0);
    };

    const stats = useMemo(() => {
        const incomeCurrentMonth = calculateMonthlyIncome(filteredData.invoices, currentMonth, currentYear);
        const incomeLastMonth = calculateMonthlyIncome(filteredData.invoices, lastMonth, lastMonthYear);
        
        // Avoid division by zero for trend
        const incomeTrend = incomeLastMonth === 0 
            ? (incomeCurrentMonth > 0 ? 100 : 0) 
            : ((incomeCurrentMonth - incomeLastMonth) / incomeLastMonth) * 100;

        const pendingAmount = filteredData.invoices.filter(i => !i.paid).reduce((sum, i) => sum + i.total_cents, 0);
        
        const activeProjectsCount = filteredData.projects.filter(p => p.status === 'in-progress').length;

        // Hours Calculation
        const hoursThisWeek = filteredData.timeEntries
            .filter(t => new Date(t.start_time) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
            .reduce((sum, t) => sum + t.duration_seconds, 0) / 3600;
            
        const hoursLastWeek = filteredData.timeEntries
             .filter(t => {
                 const d = new Date(t.start_time);
                 const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
                 const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                 return d > twoWeeksAgo && d <= oneWeekAgo;
             })
            .reduce((sum, t) => sum + t.duration_seconds, 0) / 3600;

        const hoursTrend = hoursLastWeek === 0
            ? (hoursThisWeek > 0 ? 100 : 0)
            : ((hoursThisWeek - hoursLastWeek) / hoursLastWeek) * 100;


        return {
            paidThisMonth: incomeCurrentMonth,
            incomeTrend,
            pendingInvoices: pendingAmount,
            activeProjects: activeProjectsCount,
            hoursThisWeek,
            hoursTrend
        };
    }, [filteredData, currentMonth, currentYear, lastMonth, lastMonthYear]);
    
    const goalProgress = (selectedClientId === 'all' && monthlyGoalCents > 0) ? (stats.paidThisMonth / monthlyGoalCents) * 100 : 0;

    return (
        <div className="space-y-8 pb-10">
            {profile.isNewUser && <OnboardingGuide />}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">
                        Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">{profile?.full_name?.split(' ')[0]}</span>
                    </h1>
                    <p className="text-slate-400 mt-1">Aquí tienes el resumen de tu actividad.</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto bg-slate-900/50 p-1 rounded-lg border border-white/5">
                    <div className="relative flex-1 md:w-48">
                        <UsersIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                            value={selectedClientId}
                            onChange={(e) => setSelectedClientId(e.target.value)}
                            className="block w-full pl-9 pr-4 py-2 text-sm bg-transparent text-white border-none focus:ring-0 cursor-pointer hover:bg-white/5 rounded-md transition-colors appearance-none"
                            aria-label="Filtrar por cliente"
                        >
                            <option value="all" className="bg-slate-900">Todos los Clientes</option>
                            {clients.map(client => (
                                <option key={client.id} value={client.id} className="bg-slate-900">{client.name}</option>
                            ))}
                        </select>
                    </div>
                    <button 
                        onClick={handleRefresh} 
                        disabled={isRefreshing}
                        className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-md transition-all disabled:opacity-50"
                        title="Actualizar datos"
                    >
                        <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    icon={DollarSignIcon} 
                    title="Ingresos (Mes)" 
                    value={formatCurrency(stats.paidThisMonth)} 
                    trend={stats.incomeTrend}
                    iconColor="text-emerald-400 bg-emerald-500/10" 
                />
                <StatCard 
                    icon={FileTextIcon} 
                    title="Pendiente de Cobro" 
                    value={formatCurrency(stats.pendingInvoices)} 
                    iconColor="text-amber-400 bg-amber-500/10"
                    link="/invoices"
                />
                <StatCard 
                    icon={BriefcaseIcon} 
                    title="Proyectos Activos" 
                    value={stats.activeProjects} 
                    iconColor="text-blue-400 bg-blue-500/10"
                    link="/projects"
                />
                <StatCard 
                    icon={ClockIcon} 
                    title="Horas (7 días)" 
                    value={`${stats.hoursThisWeek.toFixed(1)}h`} 
                    trend={stats.hoursTrend}
                    trendLabel="vs semana anterior"
                    iconColor="text-fuchsia-400 bg-fuchsia-500/10"
                    link="/time-tracking"
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                <TrendingUpIcon className="w-5 h-5 text-slate-400"/>
                                Flujo de Caja
                            </h2>
                            <div className={selectedClientId !== 'all' ? 'hidden sm:block' : ''}>
                                 {selectedClientId === 'all' && monthlyGoalCents > 0 && (
                                    <div className="flex items-center gap-3 bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5">
                                        <div className="flex flex-col items-end">
                                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Meta Mensual</span>
                                            <span className="text-xs font-mono text-white">{goalProgress.toFixed(0)}%</span>
                                        </div>
                                        <div className="h-8 w-1 bg-white/10 rounded-full overflow-hidden relative">
                                             <div className="absolute bottom-0 w-full bg-gradient-to-t from-fuchsia-600 to-purple-500 transition-all duration-1000" style={{ height: `${Math.min(goalProgress, 100)}%` }}></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Skeleton className="h-[300px] w-full"/></div>}>
                                <IncomeExpenseChart invoices={filteredData.invoices} expenses={filteredData.expenses} />
                            </Suspense>
                        </CardContent>
                    </Card>

                    <AICoachWidget invoices={filteredData.invoices} timeEntries={filteredData.timeEntries} expenses={filteredData.expenses} />
                </div>

                <div className="xl:col-span-1 h-full">
                    <NextStepsWidget tasks={filteredData.tasks} invoices={filteredData.invoices} projects={filteredData.projects} />
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
