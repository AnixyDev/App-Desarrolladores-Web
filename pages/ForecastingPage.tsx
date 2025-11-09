

import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';
import { TrendingUpIcon, SparklesIcon, AlertTriangleIcon, CheckCircleIcon, RefreshCwIcon } from '../components/icons/Icon';
import { Invoice, RecurringExpense } from '../types';
import { generateFinancialForecast, AI_CREDIT_COSTS } from '../services/geminiService'; 
import Button from '../components/ui/Button';

const BuyCreditsModal = lazy(() => import('../components/modals/BuyCreditsModal'));


interface ForecastData {
  month: string;
  ingresos: number;
  gastos: number;
  flujoNeto: number;
}

interface FinancialAnalysis {
    summary: string;
    potentialRisks: string[];
    suggestions: string[];
}


const ForecastingPage: React.FC = () => {
    const { invoices, recurringExpenses, profile, consumeCredits } = useAppStore();
    const [forecastData, setForecastData] = useState<ForecastData[]>([]);
    const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isBuyCreditsModalOpen, setIsBuyCreditsModalOpen] = useState(false);

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    useEffect(() => {
        const generateForecast = () => {
            const data: ForecastData[] = [];
            const today = new Date();

            for (let i = 0; i < 6; i++) {
                const forecastDate = new Date(today.getFullYear(), today.getMonth() + i, 1);
                const month = forecastDate.getMonth();
                const year = forecastDate.getFullYear();

                const monthKey = `${monthNames[month]} ${year}`;

                // Ingresos: facturas pendientes de pago con fecha de vencimiento en este mes
                const monthlyIncome = invoices
                    .filter(inv => !inv.paid)
                    .filter(inv => {
                        const dueDate = new Date(inv.due_date);
                        return dueDate.getMonth() === month && dueDate.getFullYear() === year;
                    })
                    .reduce((sum, inv) => sum + inv.total_cents, 0);

                // Gastos: gastos recurrentes
                const monthlyExpenses = recurringExpenses
                    .filter(exp => {
                         const startDate = new Date(exp.start_date);
                         if (exp.frequency === 'monthly') return startDate <= forecastDate;
                         if (exp.frequency === 'yearly') return startDate.getMonth() === month && startDate <= forecastDate;
                         return false;
                    })
                    .reduce((sum, exp) => sum + exp.amount_cents, 0);
                
                data.push({
                    month: monthKey,
                    ingresos: monthlyIncome / 100,
                    gastos: monthlyExpenses / 100,
                    flujoNeto: (monthlyIncome - monthlyExpenses) / 100,
                });
            }
            setForecastData(data);
        };
        generateForecast();
    }, [invoices, recurringExpenses]);

    const handleGenerateAnalysis = async () => {
        if (profile.ai_credits < AI_CREDIT_COSTS.generateForecast) {
            setIsBuyCreditsModalOpen(true);
            return;
        }

        setIsLoading(true);
        setAnalysis(null);
        try {
            const result = await generateFinancialForecast(forecastData);
            setAnalysis(result);
            consumeCredits(AI_CREDIT_COSTS.generateForecast);
        } catch (error) {
            console.error("Error generating analysis", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-white">Previsión Financiera</h1>
                 <Button onClick={handleGenerateAnalysis} disabled={isLoading}>
                    {isLoading ? <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" /> : <SparklesIcon className="w-4 h-4 mr-2" />}
                    {isLoading ? 'Analizando...' : `Analizar con IA (${AI_CREDIT_COSTS.generateForecast} créditos)`}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                        <TrendingUpIcon className="w-5 h-5"/> Flujo de Caja Proyectado (Próximos 6 Meses)
                    </h2>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={forecastData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2c2c2c" />
                            <XAxis dataKey="month" tick={{ fill: '#a0a0a0' }} />
                            <YAxis tickFormatter={(value) => `€${value.toLocaleString('es-ES')}`} tick={{ fill: '#a0a0a0' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2c2c2c' }}
                                formatter={(value: number) => `€${value.toLocaleString('es-ES')}`}
                            />
                            <Legend wrapperStyle={{ color: '#a0a0a0' }} />
                            <Line type="monotone" dataKey="ingresos" stroke="#22c55e" name="Ingresos Proyectados" strokeWidth={2} />
                            <Line type="monotone" dataKey="gastos" stroke="#ef4444" name="Gastos Recurrentes" strokeWidth={2} />
                            <Line type="monotone" dataKey="flujoNeto" stroke="#f000b8" name="Flujo Neto" strokeWidth={3} />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {analysis && (
                <Card>
                    <CardHeader><h2 className="text-lg font-semibold text-white">Análisis de la IA</h2></CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-primary-400 mb-2">Resumen General</h3>
                            <p className="text-gray-300">{analysis.summary}</p>
                        </div>
                        {analysis.potentialRisks.length > 0 && (
                             <div>
                                <h3 className="font-semibold text-yellow-400 mb-2 flex items-center gap-2"><AlertTriangleIcon/> Riesgos Potenciales</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-300">
                                    {analysis.potentialRisks.map((risk, i) => <li key={i}>{risk}</li>)}
                                </ul>
                            </div>
                        )}
                        {analysis.suggestions.length > 0 && (
                            <div>
                                <h3 className="font-semibold text-green-400 mb-2 flex items-center gap-2"><CheckCircleIcon/> Sugerencias y Oportunidades</h3>
                                <ul className="list-disc list-inside space-y-1 text-gray-300">
                                    {analysis.suggestions.map((sug, i) => <li key={i}>{sug}</li>)}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
            
            <Suspense fallback={null}>
              <BuyCreditsModal isOpen={isBuyCreditsModalOpen} onClose={() => setIsBuyCreditsModalOpen(false)} />
            </Suspense>
        </div>
    );
};

export default ForecastingPage;
