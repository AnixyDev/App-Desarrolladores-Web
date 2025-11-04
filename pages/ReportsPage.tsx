import React, { useState, useMemo, lazy, Suspense } from 'react';
import { useAppStore } from '../hooks/useAppStore.tsx';
import Card, { CardContent, CardHeader } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import { formatCurrency } from '../lib/utils.ts';
import { DownloadIcon, DollarSignIcon, TrendingUpIcon, UsersIcon, ClockIcon, SparklesIcon, RefreshCwIcon } from '../components/icons/Icon.tsx';
import { analyzeProfitability, AI_CREDIT_COSTS } from '../services/geminiService.ts';
import { useToast } from '../hooks/useToast.ts';

const ProfitabilityByClientChart = lazy(() => import('../components/charts/ProfitabilityByClientChart.tsx'));
const BuyCreditsModal = lazy(() => import('../components/modals/BuyCreditsModal.tsx'));

interface FinancialAnalysis {
    summary: string;
    topPerformers: string[];
    areasForImprovement: string[];
}

const ReportsPage: React.FC = () => {
  const { invoices, expenses, clients, projects, timeEntries, profile, consumeCredits } = useAppStore();
  const { addToast } = useToast();
  
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [startDate, setStartDate] = useState(firstDayOfMonth.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(today.toISOString().split('T')[0]);
  const [analysis, setAnalysis] = useState<FinancialAnalysis | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isBuyCreditsModalOpen, setIsBuyCreditsModalOpen] = useState(false);

  const filteredData = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the whole end day

    const filteredInvoices = invoices.filter(i => {
      const issueDate = new Date(i.issue_date);
      return issueDate >= start && issueDate <= end;
    });

    const filteredExpenses = expenses.filter(e => {
      const expenseDate = new Date(e.date);
      return expenseDate >= start && expenseDate <= end;
    });
    
    const filteredTimeEntries = timeEntries.filter(t => {
       const entryDate = new Date(t.start_time);
       return entryDate >= start && entryDate <= end;
    });

    return { filteredInvoices, filteredExpenses, filteredTimeEntries };
  }, [invoices, expenses, timeEntries, startDate, endDate]);

  const reportKpis = useMemo(() => {
    const paidInvoices = filteredData.filteredInvoices.filter(i => i.paid);
    const totalIncome = paidInvoices.reduce((sum, inv) => sum + inv.total_cents, 0);
    const totalExpenses = filteredData.filteredExpenses.reduce((sum, exp) => sum + exp.amount_cents, 0);
    const netProfit = totalIncome - totalExpenses;
    
    const clientProfitability = clients.map(client => {
        const clientInvoices = paidInvoices.filter(i => i.client_id === client.id);
        const clientIncome = clientInvoices.reduce((sum, i) => sum + i.subtotal_cents, 0);
        
        const clientProjectIds = projects.filter(p => p.client_id === client.id).map(p => p.id);
        const clientExpenses = filteredData.filteredExpenses
            .filter(e => e.project_id && clientProjectIds.includes(e.project_id))
            .reduce((sum, e) => sum + e.amount_cents, 0);

        return { name: client.name, profit: clientIncome - clientExpenses };
    }).filter(c => c.profit > 0).sort((a, b) => b.profit - a.profit);

    const totalHoursTracked = filteredData.filteredTimeEntries.reduce((sum, entry) => sum + entry.duration_seconds, 0) / 3600;

    return {
        totalIncome,
        totalExpenses,
        netProfit,
        clientProfitability,
        totalHoursTracked,
    };
  }, [filteredData, clients, projects]);
  
  const handleExportPdf = async () => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Reporte Financiero (${startDate} a ${endDate})`, 14, 22);

    doc.setFontSize(12);
    doc.text(`Preparado para: ${profile.full_name}`, 14, 32);

    autoTable(doc, {
        startY: 40,
        head: [['Métrica', 'Valor']],
        body: [
            ['Ingresos Totales (Pagado)', formatCurrency(reportKpis.totalIncome)],
            ['Gastos Totales', formatCurrency(reportKpis.totalExpenses)],
            ['Beneficio Neto', formatCurrency(reportKpis.netProfit)],
            ['Horas Registradas', `${reportKpis.totalHoursTracked.toFixed(2)}h`],
        ],
    });
    
     autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [['Cliente', 'Beneficio Neto']],
        body: reportKpis.clientProfitability.map(c => [c.name, formatCurrency(c.profit)]),
    });

    doc.save(`Reporte_DevFreelancer_${startDate}_${endDate}.pdf`);
  };
  
   const handleAiAnalysis = async () => {
        if (profile.ai_credits < AI_CREDIT_COSTS.analyzeProfitability) {
            setIsBuyCreditsModalOpen(true);
            return;
        }
        setIsAiLoading(true);
        setAnalysis(null);
        try {
            const result = await analyzeProfitability(reportKpis);
            if (result) {
                setAnalysis(result);
                consumeCredits(AI_CREDIT_COSTS.analyzeProfitability);
                addToast("Análisis de rentabilidad completado.", "success");
            } else {
                addToast("No se pudo generar el análisis.", "error");
            }
        } catch (error) {
            addToast((error as Error).message, 'error');
        } finally {
            setIsAiLoading(false);
        }
    };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-semibold text-white">Reportes</h1>
          <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white" />
              <span className="text-gray-400">a</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white" />
              <Button onClick={handleAiAnalysis} disabled={isAiLoading}>
                  {isAiLoading ? <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin"/> : <SparklesIcon className="w-4 h-4 mr-2" />}
                  {isAiLoading ? 'Analizando...' : 'Analizar con IA'}
              </Button>
              <Button onClick={handleExportPdf} variant="secondary"><DownloadIcon className="w-4 h-4 mr-2" /> Exportar PDF</Button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={DollarSignIcon} title="Ingresos Totales" value={formatCurrency(reportKpis.totalIncome)} />
          <StatCard icon={TrendingUpIcon} title="Gastos Totales" value={formatCurrency(reportKpis.totalExpenses)} color="text-red-400" />
          <StatCard icon={DollarSignIcon} title="Beneficio Neto" value={formatCurrency(reportKpis.netProfit)} color="text-green-400" />
          <StatCard icon={ClockIcon} title="Horas Registradas" value={`${reportKpis.totalHoursTracked.toFixed(2)}h`} />
      </div>

      {analysis && (
            <Card>
                <CardHeader><h2 className="text-lg font-semibold text-white">Análisis de Rentabilidad por IA</h2></CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-primary-400 mb-2">Resumen</h3>
                        <p className="text-gray-300">{analysis.summary}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold text-green-400 mb-2">Clientes y Proyectos Estrella</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-300">
                            {analysis.topPerformers.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                     <div>
                        <h3 className="font-semibold text-yellow-400 mb-2">Áreas de Mejora</h3>
                        <ul className="list-disc list-inside space-y-1 text-gray-300">
                            {analysis.areasForImprovement.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                    </div>
                </CardContent>
            </Card>
      )}

      <Card>
        <CardHeader><h2 className="text-lg font-semibold text-white flex items-center gap-2"><UsersIcon className="w-5 h-5"/> Rentabilidad por Cliente</h2></CardHeader>
        <CardContent>
            {reportKpis.clientProfitability.length > 0 ? (
                <Suspense fallback={<div className="h-[300px] flex items-center justify-center text-gray-400">Cargando gráfico...</div>}>
                    <ProfitabilityByClientChart data={reportKpis.clientProfitability} />
                </Suspense>
            ) : (
                <p className="text-gray-400 text-center py-8">No hay suficientes datos de ingresos para mostrar este gráfico.</p>
            )}
        </CardContent>
      </Card>
      
        <Suspense fallback={null}>
            {isBuyCreditsModalOpen && <BuyCreditsModal isOpen={isBuyCreditsModalOpen} onClose={() => setIsBuyCreditsModalOpen(false)} />}
        </Suspense>
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, color = 'text-white' }: { icon: React.ElementType, title: string, value: string | number, color?: string }) => (
    <Card>
        <CardContent className="p-4">
             <div className="flex items-center">
                 <div className="p-3 rounded-full bg-primary-600/20 text-primary-400 mr-4">
                     <Icon className="w-6 h-6" />
                 </div>
                <div>
                    <p className="text-sm text-gray-400">{title}</p>
                    <p className={`text-2xl font-bold ${color}`}>{value}</p>
                </div>
            </div>
        </CardContent>
    </Card>
);


export default ReportsPage;