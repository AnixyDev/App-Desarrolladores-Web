
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Invoice, Expense } from '../../types';

interface ChartProps {
  invoices: Invoice[];
  expenses: Expense[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value / 100);

const processChartData = (invoices: Invoice[], expenses: Expense[]) => {
    const dataByMonth: { [key: string]: { name: string; ingresos: number; gastos: number; sortDate: Date } } = {};
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    // Limit to last 6 months for better visibility
    const today = new Date();
    for(let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        dataByMonth[key] = { 
            name: monthNames[d.getMonth()], 
            ingresos: 0, 
            gastos: 0,
            sortDate: d 
        };
    }

    invoices.forEach(invoice => {
        if (invoice.paid && invoice.payment_date) {
            const date = new Date(invoice.payment_date);
            const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
            if (dataByMonth[monthKey]) {
                dataByMonth[monthKey].ingresos += invoice.total_cents;
            }
        }
    });

    expenses.forEach(expense => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        if (dataByMonth[monthKey]) {
            dataByMonth[monthKey].gastos += expense.amount_cents;
        }
    });

    return Object.values(dataByMonth).sort((a,b) => a.sortDate.getTime() - b.sortDate.getTime());
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl text-xs">
                <p className="text-slate-300 font-semibold mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 mb-1 last:mb-0">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-slate-400 capitalize">{entry.name}:</span>
                        <span className="text-white font-mono font-medium">
                            {formatCurrency(entry.value * 100)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};


const IncomeExpenseChart: React.FC<ChartProps> = ({ invoices, expenses }) => {
  const data = processChartData(invoices, expenses);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={4}>
        <defs>
          <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d946ef" stopOpacity={1}/>
            <stop offset="100%" stopColor="#a21caf" stopOpacity={0.8}/>
          </linearGradient>
          <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={1}/>
            <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.8}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis 
            dataKey="name" 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
            dy={10}
        />
        <YAxis 
            tickFormatter={(value) => `${(value / 100 / 1000).toFixed(0)}k`} 
            tick={{ fill: '#64748b', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)', radius: 4 }} />
        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
        <Bar 
            dataKey="ingresos" 
            fill="url(#colorIncome)" 
            name="Ingresos" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={40}
        />
        <Bar 
            dataKey="gastos" 
            fill="url(#colorExpense)" 
            name="Gastos" 
            radius={[4, 4, 0, 0]} 
            maxBarSize={40}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default IncomeExpenseChart;
