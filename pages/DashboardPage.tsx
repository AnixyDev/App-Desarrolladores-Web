// pages/DashboardPage.tsx
import React, { lazy, Suspense, useEffect, useState, useMemo } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import { DollarSignIcon, ClockIcon, BriefcaseIcon, FileTextIcon, SparklesIcon, RefreshCwIcon, AlertTriangleIcon, ListTodo, CheckCircleIcon, PlusIcon } from '../components/icons/Icon';
import { getDashboardInsights } from '../services/geminiService';
import OnboardingGuide from '../components/OnboardingGuide';
import Skeleton from '../components/ui/Skeleton';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../hooks/useToast';
import { Task } from '../types';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

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

const NextStepsWidget: React.FC = () => {
    const { tasks, invoices, getProjectById, getClientById, updateTaskStatus, addTask, projects } = useAppStore();
    const { addToast } = useToast();

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({ description: '', project_id: projects[0]?.id || '' });

    const pendingTasks = useMemo(() => {
        return tasks
            .filter(t => t.status !== 'completed')
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            .slice(0, 3);
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
            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-white">Próximos Pasos</h2>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-slate-800">
                    {/* TAREAS SECTION */}
                    <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-slate-300 flex items-center gap-2"><ListTodo className="w-5 h-5 text-purple-400"/> Tareas Pendientes</h3>
                            <Button size="sm" variant="secondary" onClick={() => setIsTaskModalOpen(true)}><PlusIcon className="w-4 h-4 mr-1"/> Añadir Tarea</Button>
                        </div>
                        {pendingTasks.length > 0 ? (
                            <ul className="space-y-2 mt-3">
                                {pendingTasks.map(task => (
                                    <li key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50">
                                        <input
                                            type="checkbox"
                                            onChange={() => handleToggleTask(task)}
                                            className="h-4 w-4 rounded border-gray-600 bg-gray-900 text-primary-600 focus:ring-primary-500 focus:ring-offset-gray-800 shrink-0 cursor-pointer"
                                            aria-label={`Marcar como completada: ${task.description}`}
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm text-white">{task.description}</p>
                                            <Link to={`/projects/${task.project_id}`} className="text-xs text-slate-400 hover:underline">{getProjectById(task.project_id)?.name}</Link>
                                        </div>
                                        <span className="text-xs text-slate-500">{new Date(task.created_at).toLocaleDateString()}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">¡Ninguna tarea pendiente! 🎉</p>
                        )}
                    </div>

                    {/* FACTURAS SECTION */}
                    <div className="p-4">
                        <h3 className="font-semibold text-slate-300 flex items-center gap-2 mb-2"><FileTextIcon className="w-5 h-5 text-yellow-400"/> Facturas Próximas a Vencer</h3>
                        {actionableInvoices.length > 0 ? (
                            <ul className="space-y-2 mt-3">
                                {actionableInvoices.map(invoice => (
                                    <li key={invoice.id}>
                                        <Link to="/invoices" className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50">
                                            <div>
                                                <p className="text-sm text-white">Factura #{invoice.invoice_number}</p>
                                                <p className="text-xs text-slate-400">{getClientById(invoice.client_id)?.name} - {formatCurrency(invoice.total_cents)}</p>
                                            </div>
                                            <span className={`text-xs font-semibold ${new Date(invoice.due_date) < new Date() ? 'text-red-400' : 'text-slate-400'}`}>{new Date(invoice.due_date).toLocaleDateString()}</span>
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
                    />
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Proyecto</label>
                        <select
                            value={newTask.project_id}
                            onChange={(e) => setNewTask(prev => ({ ...prev, project_id: e.target.value }))}
                            className="block w-full px-3 py-2 border-2 rounded-md shadow-sm focus:outline-none focus:ring-0 sm:text-sm bg-[#2a2a50] text-white border-transparent focus:border-fuchsia-500"
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

                <NextStepsWidget />
            </div>
        </div>
    );
};

export default DashboardPage;