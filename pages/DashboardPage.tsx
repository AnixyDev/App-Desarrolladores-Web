import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Card, { CardHeader, CardContent } from '../components/ui/Card.tsx';
// FIX: Added .tsx extension to the import path.
import { useAppStore } from '../hooks/useAppStore.tsx';
import IncomeExpenseChart from '../components/charts/IncomeExpenseChart.tsx';
import { formatCurrency } from '../lib/utils.ts';
// FIX: Add .tsx extension to Icon import
import { ClockIcon, DollarSignIcon, FileTextIcon, MessageSquareIcon, ClipboardListIcon, CheckCircleIcon, SparklesIcon, TargetIcon, EditIcon, FileSignatureIcon, RepeatIcon } from '../components/icons/Icon.tsx';
import Modal from '../components/ui/Modal.tsx';
import Input from '../components/ui/Input.tsx';
import Button from '../components/ui/Button.tsx';

const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
}

const DashboardPage: React.FC = () => {
    const store = useAppStore();
    const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
    const [newGoal, setNewGoal] = useState(store.monthlyGoalCents / 100);

    // --- Top KPI Calculations ---
    const { totalIncome, totalExpenses, pendingAmount, pendingInvoices, sentProposals } = useMemo(() => {
        const paidInvoices = store.invoices.filter(inv => inv.paid);
        const income = paidInvoices.reduce((sum, inv) => sum + inv.total_cents, 0);
        const expenses = store.expenses.reduce((sum, exp) => sum + exp.amount_cents, 0);
        const pending = store.invoices.filter(inv => !inv.paid);
        const pendingSum = pending.reduce((sum, inv) => sum + inv.total_cents, 0);
        const proposals = store.proposals.filter(p => p.status === 'sent');
        return {
            totalIncome: income,
            totalExpenses: expenses,
            pendingAmount: pendingSum,
            pendingInvoices: pending,
            sentProposals: proposals,
        };
    }, [store.invoices, store.expenses, store.proposals]);

    const stats = [
        { title: 'Ingresos (Pagado)', value: formatCurrency(totalIncome), icon: DollarSignIcon },
        { title: 'Gastos', value: formatCurrency(totalExpenses), icon: DollarSignIcon, color: 'text-red-500' },
        { title: 'Facturas Pendientes', value: `${pendingInvoices.length} (${formatCurrency(pendingAmount)})`, icon: FileTextIcon },
        { title: 'Propuestas Pendientes', value: sentProposals.length, icon: MessageSquareIcon },
    ];
    
    // --- Upcoming Events Calculation ---
    const upcomingEvents = useMemo(() => {
        const events = [];
        const today = new Date();
        const futureDate = (days: number) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
        
        store.projects.forEach(p => {
            const dueDate = new Date(p.due_date);
            if (dueDate >= today && dueDate <= futureDate(15) && p.status !== 'completed') {
                events.push({ type: 'project', date: p.due_date, text: `Entrega del proyecto`, link: `/projects/${p.id}`, name: p.name, icon: ClipboardListIcon });
            }
        });

        store.invoices.forEach(i => {
            const dueDate = new Date(i.due_date);
            if (!i.paid && dueDate < today) {
                events.push({ type: 'invoice-overdue', date: i.due_date, text: `Factura vencida`, link: '/invoices', name: `${i.invoice_number} - ${store.getClientById(i.client_id)?.name}`, icon: FileTextIcon, isUrgent: true });
            }
        });

        store.recurringExpenses.forEach(re => {
             const nextDate = new Date(re.next_due_date);
             if (nextDate >= today && nextDate <= futureDate(30)) {
                events.push({ type: 'recurring', date: re.next_due_date, text: `Próximo gasto recurrente`, name: re.description, icon: RepeatIcon });
             }
        });

        return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [store.projects, store.invoices, store.recurringExpenses, store.getClientById]);


    // --- Monthly Goal Calculation ---
    const { currentMonthIncome, goalProgress } = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        const income = store.invoices
            .filter(i => i.paid && i.payment_date)
            .filter(i => {
                const paymentDate = new Date(i.payment_date!);
                return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
            })
            .reduce((sum, i) => sum + i.total_cents, 0);
        
        const progress = store.monthlyGoalCents > 0 ? (income / store.monthlyGoalCents) * 100 : 0;
        return { currentMonthIncome: income, goalProgress: progress };
    }, [store.invoices, store.monthlyGoalCents]);

    // --- Time Tracking Widget Calculation ---
    const timeTrackingStats = useMemo(() => {
        const today = new Date().toDateString();
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1))); 
        startOfWeek.setHours(0, 0, 0, 0);

        const hoursToday = store.timeEntries
            .filter(e => new Date(e.start_time).toDateString() === today)
            .reduce((sum, e) => sum + e.duration_seconds, 0);
        
        const hoursWeek = store.timeEntries
            .filter(e => new Date(e.start_time) >= startOfWeek)
            .reduce((sum, e) => sum + e.duration_seconds, 0);
        
        const totalHoursTracked = store.timeEntries.reduce((sum, e) => sum + e.duration_seconds, 0) / 3600;
        const averageRate = totalHoursTracked > 0 ? totalIncome / totalHoursTracked : 0;
            
        return {
            today: formatDuration(hoursToday),
            week: formatDuration(hoursWeek),
            avgRate: formatCurrency(averageRate)
        }
    }, [store.timeEntries, totalIncome]);
    
    // --- Profitability Widget Calculation ---
    const profitability = useMemo(() => {
        const totalTimeCost = store.timeEntries.reduce((sum, t) => sum + (t.duration_seconds / 3600 * store.profile.hourly_rate_cents), 0);
        const netProfit = totalIncome - totalExpenses - totalTimeCost;
        
        const projectProfits = store.projects.map(p => {
             const projectBilled = store.invoices.filter(i => i.project_id === p.id && i.paid).reduce((s, i) => s + i.subtotal_cents, 0);
             const projectExpenses = store.expenses.filter(e => e.project_id === p.id).reduce((s, e) => s + e.amount_cents, 0);
             const projectTimeCost = store.timeEntries.filter(t => t.project_id === p.id).reduce((s, t) => s + (t.duration_seconds / 3600 * store.profile.hourly_rate_cents), 0);
             return { name: p.name, profit: projectBilled - projectExpenses - projectTimeCost };
        }).sort((a,b) => b.profit - a.profit);
        
        return {
            netProfit,
            topProjects: projectProfits.slice(0, 3),
        }
    }, [totalIncome, totalExpenses, store.timeEntries, store.profile.hourly_rate_cents, store.projects, store.invoices, store.expenses]);

    // --- Sales Funnel ---
    const salesFunnel = useMemo(() => {
        const pendingProposals = store.proposals.filter(p => p.status === 'sent');
        const pendingContracts = store.contracts.filter(c => c.status === 'sent');
        return {
            proposalsCount: pendingProposals.length,
            proposalsValue: pendingProposals.reduce((sum, p) => sum + p.amount_cents, 0),
            contractsCount: pendingContracts.length,
        }
    }, [store.proposals, store.contracts]);
    
    // --- AI Suggestions ---
    const aiSuggestions = useMemo(() => {
        const suggestions = [];
        // Suggest invoicing for completed projects with unbilled time
        const unbilledProjects = store.projects.filter(p => p.status === 'completed' && store.timeEntries.some(t => t.project_id === p.id && !t.invoice_id));
        if (unbilledProjects.length > 0) {
            suggestions.push({
                text: `El proyecto "${unbilledProjects[0].name}" está completado y tiene horas sin facturar.`,
                actionText: "Crear Factura",
                link: "/invoices"
            });
        }
        // Suggest retainer to top client
        const clientIncome: {[key: string]: number} = {};
        store.invoices.forEach(i => {
            if (i.paid) clientIncome[i.client_id] = (clientIncome[i.client_id] || 0) + i.total_cents;
        });
        const topClientId = Object.keys(clientIncome).sort((a,b) => clientIncome[b] - clientIncome[a])[0];
        if (topClientId) {
            suggestions.push({
                text: `"${store.getClientById(topClientId)?.name}" es tu cliente más rentable. Considera ofrecerle un contrato de mantenimiento.`,
                actionText: "Ver Cliente",
                link: "/clients"
            });
        }
        return suggestions;
    }, [store]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="flex items-center p-4">
              <div className={`p-3 rounded-full bg-primary-600/20 text-primary-400 mr-4`}><stat.icon className="w-6 h-6" /></div>
              <div><p className="text-sm text-gray-400">{stat.title}</p><p className={`text-2xl font-semibold text-white ${stat.color || ''}`}>{stat.value}</p></div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             <Card>
                <CardHeader className='flex justify-between items-center'>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2"><TargetIcon className="w-5 h-5 text-primary-400"/> Objetivo Mensual</h3>
                    <Button variant='secondary' size='sm' onClick={() => setIsGoalModalOpen(true)}><EditIcon className='w-4 h-4'/></Button>
                </CardHeader>
                <CardContent>
                    <div className='flex justify-between items-end text-white mb-1'>
                        <span className='text-3xl font-bold'>{formatCurrency(currentMonthIncome)}</span>
                        <span className='text-gray-400'>de {formatCurrency(store.monthlyGoalCents)}</span>
                    </div>
                     <div className="w-full bg-gray-700 rounded-full h-3 relative overflow-hidden">
                        <div className="bg-gradient-to-r from-primary-500 to-purple-500 h-3 rounded-full" style={{ width: `${Math.min(goalProgress, 100)}%` }}></div>
                    </div>
                    <p className='text-right text-sm text-gray-300 mt-1'>{goalProgress.toFixed(1)}% completado</p>
                </CardContent>
             </Card>
            <Card>
                <CardHeader><h3 className="text-lg font-semibold text-white flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-purple-400"/> Sugerencias de la IA</h3></CardHeader>
                <CardContent>
                    <ul className='space-y-3'>
                        {aiSuggestions.length === 0 && <p className="text-gray-400 text-center py-2">¡Parece que todo va bien!</p>}
                        {aiSuggestions.map((s, i) => (
                            <li key={i} className='flex justify-between items-center text-sm p-2 bg-gray-800/50 rounded-md'>
                                <p className='text-gray-300'>{s.text}</p>
                                <Link to={s.link}><Button size='sm' variant='secondary'>{s.actionText}</Button></Link>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
          </div>
          <div className='space-y-6'>
            <Card>
                <CardHeader><h3 className="text-lg font-semibold text-white">Resumen de Horas</h3></CardHeader>
                <CardContent className='space-y-3 text-center'>
                    <div><p className='text-gray-400'>Hoy</p><p className='text-2xl font-bold text-white'>{timeTrackingStats.today}</p></div>
                    <div><p className='text-gray-400'>Esta Semana</p><p className='text-2xl font-bold text-white'>{timeTrackingStats.week}</p></div>
                    <div><p className='text-gray-400'>Tarifa Media Real</p><p className='text-2xl font-bold text-primary-400'>{timeTrackingStats.avgRate}/h</p></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><h3 className="text-lg font-semibold text-white">Embudo de Ventas</h3></CardHeader>
                <CardContent className='space-y-3'>
                    <div className='flex justify-between items-center'>
                        <div className='flex items-center gap-2'><MessageSquareIcon className='w-5 h-5 text-blue-400'/><span className='text-gray-300'>Propuestas Pendientes</span></div>
                        <span className='font-bold text-white'>{salesFunnel.proposalsCount} ({formatCurrency(salesFunnel.proposalsValue)})</span>
                    </div>
                     <div className='flex justify-between items-center'>
                        <div className='flex items-center gap-2'><FileSignatureIcon className='w-5 h-5 text-purple-400'/><span className='text-gray-300'>Contratos por Firmar</span></div>
                        <span className='font-bold text-white'>{salesFunnel.contractsCount}</span>
                    </div>
                </CardContent>
            </Card>
          </div>
      </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
            <CardHeader><h3 className="text-lg font-semibold text-white flex items-center gap-2"><CheckCircleIcon className="w-5 h-5 text-primary-400"/> Próximos Vencimientos y Eventos</h3></CardHeader>
            <CardContent>
                <ul className='space-y-3'>
                    {upcomingEvents.length === 0 && <p className="text-gray-400 text-center py-4">No hay eventos próximos.</p>}
                    {upcomingEvents.slice(0, 5).map((e, i) => (
                         <li key={i} className={`flex items-start gap-3 text-sm p-3 rounded-lg border ${e.isUrgent ? 'bg-red-900/30 border-red-500/50' : 'bg-gray-800/50 border-transparent'}`}>
                            <e.icon className={`w-5 h-5 ${e.isUrgent ? 'text-red-400' : 'text-purple-400'} shrink-0 mt-0.5`}/>
                            <div>
                                <p className={e.isUrgent ? 'text-red-300 font-semibold' : 'text-white font-semibold'}>{e.text}: {e.name}</p>
                                <p className="text-gray-400">Fecha: {new Date(e.date).toLocaleDateString()}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
         <Card>
            <CardHeader><h3 className="text-lg font-semibold text-white">Rentabilidad General</h3></CardHeader>
            <CardContent>
                <div className='text-center mb-4'>
                    <p className='text-gray-400'>Beneficio Neto Real</p>
                    <p className='text-4xl font-bold text-green-400'>{formatCurrency(profitability.netProfit)}</p>
                    <p className='text-xs text-gray-500'>(Ingresos - Gastos - Coste de Horas)</p>
                </div>
                <div>
                    <h4 className='font-semibold text-gray-300 mb-2'>Top 3 Proyectos Rentables</h4>
                    <ul className='space-y-2'>
                        {profitability.topProjects.map(p => (
                            <li key={p.name} className='flex justify-between items-center text-sm p-2 bg-gray-800/50 rounded-md'>
                                <span className='text-white truncate'>{p.name}</span>
                                <span className='font-semibold text-green-400'>{formatCurrency(p.profit)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><h3 className="text-lg font-semibold text-white">Resumen de Ingresos y Gastos</h3></CardHeader>
        <CardContent><IncomeExpenseChart invoices={store.invoices} expenses={store.expenses} /></CardContent>
      </Card>

    <Modal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} title="Establecer Objetivo Mensual">
        <div className="space-y-4">
            <Input label="Objetivo de Ingresos Mensuales (€)" type="number" value={newGoal} onChange={e => setNewGoal(Number(e.target.value))} />
            <div className="flex justify-end pt-4">
                <Button onClick={() => { store.setMonthlyGoal(newGoal * 100); setIsGoalModalOpen(false); }}>Guardar Objetivo</Button>
            </div>
        </div>
    </Modal>

    </div>
  );
};

export default DashboardPage;