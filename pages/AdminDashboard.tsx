import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabaseClient';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';
import { 
    DollarSignIcon, 
    Users as UsersIcon, 
    SparklesIcon, 
    TrendingUpIcon, 
    CreditCard, 
    ArrowUpCircleIcon, 
    ActivityIcon,
    RefreshCwIcon 
} from '../components/icons/Icon';
import Skeleton from '../components/ui/Skeleton';

interface Transaction {
    id: string;
    user_email: string;
    plan_name: string;
    amount_cents: number;
    created_at: string;
}

interface PlatformStats {
    totalRevenueCents: number;
    totalUsers: number;
    totalAiCreditsUsed: number;
    transactionCount: number;
}

const STRIPE_FIXED_FEE_CENTS = 25;
const STRIPE_PERCENT_FEE = 0.015;
const MONTHLY_INFRA_COST_CENTS = 82; // 0.82€

const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<PlatformStats | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Obtener Transacciones (Simulamos que vienen de una tabla 'platform_payments' o similar)
            // En producción, esto consultaría una tabla que se llena vía Webhooks de Stripe.
            const { data: transData, error: transError } = await supabase
                .from('platform_payments')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
            
            // 2. Obtener Usuarios Totales
            const { count: userCount, error: userError } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });

            // 3. Obtener Uso de IA (Suma global de una columna hipotética ai_credits_spent)
            const { data: aiData, error: aiError } = await supabase
                .from('profiles')
                .select('ai_credits_spent');
            
            const totalAiUsed = aiData?.reduce((sum, p) => sum + (p.ai_credits_spent || 0), 0) || 0;

            // 4. Calcular Ingresos Totales (Suma de todos los pagos registrados)
            const { data: revenueData } = await supabase
                .from('platform_payments')
                .select('amount_cents');
            
            const totalRevenue = revenueData?.reduce((sum, r) => sum + r.amount_cents, 0) || 0;

            setStats({
                totalRevenueCents: totalRevenue,
                totalUsers: userCount || 0,
                totalAiCreditsUsed: totalAiUsed,
                transactionCount: revenueData?.length || 0
            });
            setTransactions(transData as Transaction[] || []);

        } catch (error) {
            console.error("Error fetching admin stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const netProfitCents = useMemo(() => {
        if (!stats) return 0;
        
        // Deducción Stripe: (Nº Transacciones * 0.25€) + (Ingresos * 1.5%)
        const stripeFees = (stats.transactionCount * STRIPE_FIXED_FEE_CENTS) + (stats.totalRevenueCents * STRIPE_PERCENT_FEE);
        
        // Beneficio = Bruto - Comisiones Stripe - Coste Infraestructura
        return stats.totalRevenueCents - stripeFees - MONTHLY_INFRA_COST_CENTS;
    }, [stats]);

    const revenueByPlan = useMemo(() => {
        const plans = ['100 cred', '500 cred', '1000 cred', 'Pro', 'Teams Mes', 'Teams Año', 'Oferta Empleo'];
        // Generamos datos simulados basados en las transacciones para el gráfico
        return plans.map(plan => ({
            name: plan,
            value: transactions.filter(t => t.plan_name === plan).reduce((sum, t) => sum + t.amount_cents, 0)
        }));
    }, [transactions]);

    const StatCard = ({ title, value, icon: Icon, color, subvalue }: any) => (
        <Card className="border-gray-800 bg-gray-900/50">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">{title}</p>
                        <p className="text-2xl font-black text-white">{value}</p>
                        {subvalue && <p className="text-[10px] text-gray-400 mt-1">{subvalue}</p>}
                    </div>
                    <div className={`p-3 rounded-2xl ${color}`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} variant="rect" className="h-32 w-full rounded-2xl" />)}
        </div>
    );

    return (
        <div className="space-y-8 max-w-7xl mx-auto pb-20">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-black text-white tracking-tighter">Panel de Control Admin</h1>
                    <p className="text-gray-400 text-sm">Monitorización en tiempo real de DevFreelancer.app</p>
                </div>
                <button 
                    onClick={fetchData} 
                    className="p-3 bg-gray-900 border border-gray-800 rounded-xl hover:bg-gray-800 transition-colors"
                >
                    <RefreshCwIcon className="w-5 h-5 text-primary-400" />
                </button>
            </header>

            {/* Fila 1: Métricas Críticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Ingresos Brutos" 
                    value={formatCurrency(stats?.totalRevenueCents || 0)} 
                    icon={DollarSignIcon} 
                    color="bg-primary-600 shadow-lg shadow-primary-500/20"
                />
                <StatCard 
                    title="Beneficio Neto Est." 
                    value={formatCurrency(netProfitCents)} 
                    icon={TrendingUpIcon} 
                    color="bg-green-600 shadow-lg shadow-green-500/20"
                    subvalue="Tras Stripe y Servidores"
                />
                <StatCard 
                    title="Usuarios Totales" 
                    value={stats?.totalUsers} 
                    icon={UsersIcon} 
                    color="bg-blue-600 shadow-lg shadow-blue-500/20"
                />
                <StatCard 
                    title="Consumo IA Total" 
                    value={`${stats?.totalAiCreditsUsed} cred.`} 
                    icon={SparklesIcon} 
                    color="bg-purple-600 shadow-lg shadow-purple-500/20"
                />
            </div>

            {/* Fila 2: Gráfico de Ingresos por Plan */}
            <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <ActivityIcon className="w-5 h-5 text-primary-400" /> Distribución de Ingresos por Producto
                    </h2>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="flex items-end justify-between h-48 gap-2">
                        {revenueByPlan.map((plan, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group">
                                <div className="w-full bg-gray-800 rounded-t-lg relative transition-all duration-500 hover:bg-primary-500/40" 
                                     style={{ height: `${(plan.value / (stats?.totalRevenueCents || 1)) * 100}%`, minHeight: '4px' }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[10px] font-black px-2 py-1 rounded">
                                        {formatCurrency(plan.value)}
                                    </div>
                                </div>
                                <span className="text-[10px] text-gray-500 mt-4 font-bold uppercase truncate w-full text-center">{plan.name}</span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Fila 3: Últimas Transacciones */}
            <Card className="bg-gray-900 border-gray-800">
                <CardHeader className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary-400" /> Transacciones Recientes
                    </h2>
                    <span className="text-xs font-bold text-gray-500 uppercase">Últimos 10 pagos</span>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-950 border-b border-gray-800 text-[10px] uppercase font-black text-gray-500 tracking-widest">
                            <tr>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Producto</th>
                                <th className="p-4">Importe</th>
                                <th className="p-4">Fecha</th>
                                <th className="p-4 text-right">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {transactions.length > 0 ? transactions.map((t) => (
                                <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="p-4 text-sm font-medium text-white">{t.user_email}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-gray-800 rounded-md text-[10px] font-bold text-gray-300 uppercase">
                                            {t.plan_name}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-black text-white">{formatCurrency(t.amount_cents)}</td>
                                    <td className="p-4 text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                                    <td className="p-4 text-right text-[10px] font-black uppercase text-green-400">
                                        <div className="flex items-center justify-end gap-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                            Completado
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="p-10 text-center text-gray-500 text-sm italic">No se han registrado transacciones aún.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminDashboard;