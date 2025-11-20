
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatCurrency } from '../../lib/utils';

interface ProfitabilityData {
  name: string;
  profit: number;
}

interface ChartProps {
  data: ProfitabilityData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-3 rounded-lg shadow-xl text-xs">
                <p className="text-slate-300 font-semibold mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <span className="text-slate-400">Beneficio:</span>
                    <span className="text-emerald-400 font-mono font-bold">
                        {formatCurrency(payload[0].value)}
                    </span>
                </div>
            </div>
        );
    }
    return null;
};

const ProfitabilityByClientChart: React.FC<ChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 0, bottom: 5 }} barSize={24}>
        <defs>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="100%" stopColor="#d946ef" stopOpacity={1}/>
            </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
        <XAxis 
            type="number" 
            tickFormatter={(value) => `${(value / 100 / 1000).toFixed(0)}k`} 
            tick={{ fill: '#64748b', fontSize: 11 }} 
            axisLine={false}
            tickLine={false}
        />
        <YAxis 
            type="category" 
            dataKey="name" 
            tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }} 
            width={100}
            axisLine={false}
            tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 255, 255, 0.03)', radius: 4 }} />
        <Bar 
            dataKey="profit" 
            name="Beneficio Neto" 
            fill="url(#colorProfit)" 
            radius={[0, 4, 4, 0]} 
            background={{ fill: 'rgba(255,255,255,0.02)', radius: 4 }}
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default ProfitabilityByClientChart;
