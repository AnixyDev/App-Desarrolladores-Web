// FIX: Add a triple-slash directive to explicitly include React types, resolving issues with JSX elements not being recognized by TypeScript.
/// <reference types="react" />

import React, { useState, useMemo } from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card.tsx';
// FIX: Added .tsx extension to the import path.
import { useAppStore } from '../hooks/useAppStore.tsx';
import { formatCurrency } from '../lib/utils.ts';
// FIX: Add .tsx extension to Icon import
import { BookIcon } from '../components/icons/Icon.tsx';
import Input from '../components/ui/Input.tsx';

const TaxLedgerPage: React.FC = () => {
    const { invoices, expenses } = useAppStore();
    const [year, setYear] = useState(new Date().getFullYear());
    const [quarter, setQuarter] = useState(Math.floor(new Date().getMonth() / 3) + 1);
    const [irpfPercentage, setIrpfPercentage] = useState(20);

    const availableYears = useMemo(() => {
        const allDates = [...invoices.map(i => i.issue_date), ...expenses.map(e => e.date)];
        const years = new Set(allDates.map(d => new Date(d).getFullYear()));
        return Array.from(years).sort((a, b) => b - a);
    }, [invoices, expenses]);

    const filteredData = useMemo(() => {
        const startDate = new Date(year, (quarter - 1) * 3, 1);
        const endDate = new Date(year, quarter * 3, 0);

        const filteredInvoices = invoices.filter(i => {
            const issueDate = new Date(i.issue_date);
            return issueDate >= startDate && issueDate <= endDate;
        });
        const filteredExpenses = expenses.filter(e => {
            const expenseDate = new Date(e.date);
            return expenseDate >= startDate && expenseDate <= endDate;
        });

        return { filteredInvoices, filteredExpenses };
    }, [invoices, expenses, year, quarter]);
    
    const totals = useMemo(() => {
        const totalIngresos = filteredData.filteredInvoices.reduce((sum, i) => sum + i.subtotal_cents, 0);
        const totalGastos = filteredData.filteredExpenses.reduce((sum, e) => sum + e.amount_cents, 0);
        const ivaRepercutido = filteredData.filteredInvoices.reduce((sum, i) => sum + (i.total_cents - i.subtotal_cents), 0);
        const ivaSoportado = filteredData.filteredExpenses.reduce((sum, e) => sum + (e.amount_cents * ((e.tax_percent || 0) / 100)), 0);
        const beneficio = totalIngresos - totalGastos;
        // Estimación IRPF (Modelo 130) - ahora configurable
        const irpfEstimado = beneficio > 0 ? beneficio * (irpfPercentage / 100) : 0;
        
        return {
            totalIngresos,
            totalGastos,
            ivaRepercutido,
            ivaSoportado,
            ivaAPagar: ivaRepercutido - ivaSoportado,
            irpfEstimado,
        }

    }, [filteredData, irpfPercentage]);

  return (
    <div className='space-y-6'>
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-semibold text-white">Libro Fiscal</h1>
            <div className='flex gap-2 items-center bg-gray-900 p-2 rounded-lg'>
                <select value={quarter} onChange={e => setQuarter(Number(e.target.value))} className="px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white">
                    <option value={1}>Trimestre 1</option>
                    <option value={2}>Trimestre 2</option>
                    <option value={3}>Trimestre 3</option>
                    <option value={4}>Trimestre 4</option>
                </select>
                 <select value={year} onChange={e => setYear(Number(e.target.value))} className="px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white">
                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <div className="w-40">
                     <Input 
                        label="IRPF Est. (%)" 
                        type="number" 
                        value={irpfPercentage} 
                        onChange={e => setIrpfPercentage(Number(e.target.value))}
                    />
                </div>
            </div>
      </div>
      
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2"><BookIcon className='w-5 h-5'/> Resumen Fiscal Trimestre {quarter}, {year}</h2>
        </CardHeader>
        <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-center'>
                <div className='bg-gray-800/50 p-4 rounded-lg'>
                    <p className='text-sm text-gray-400'>Ingresos (Base)</p>
                    <p className='text-2xl font-bold text-green-400'>{formatCurrency(totals.totalIngresos)}</p>
                </div>
                 <div className='bg-gray-800/50 p-4 rounded-lg'>
                    <p className='text-sm text-gray-400'>Gastos (Base)</p>
                    <p className='text-2xl font-bold text-red-400'>{formatCurrency(totals.totalGastos)}</p>
                </div>
                <div className='bg-gray-800/50 p-4 rounded-lg'>
                    <p className='text-sm text-gray-400'>IVA a Pagar/Devolver</p>
                    <p className={`text-2xl font-bold ${totals.ivaAPagar >= 0 ? 'text-white' : 'text-yellow-400'}`}>{formatCurrency(totals.ivaAPagar)}</p>
                    <p className='text-xs text-gray-500'>{formatCurrency(totals.ivaRepercutido)} - {formatCurrency(totals.ivaSoportado)}</p>
                </div>
                 <div className='bg-gray-800/50 p-4 rounded-lg col-span-1 md:col-span-2 lg:col-span-3'>
                    <p className='text-sm text-gray-400'>Estimación IRPF (Modelo 130)</p>
                    <p className='text-2xl font-bold text-white'>{formatCurrency(totals.irpfEstimado)}</p>
                    <p className='text-xs text-gray-500'>{irpfPercentage}% sobre el beneficio de {formatCurrency(totals.totalIngresos - totals.totalGastos)}. Esto es una estimación, consulta con tu asesor.</p>
                </div>
            </div>
        </CardContent>
      </Card>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card>
            <CardHeader><h3 className='text-lg font-semibold'>Facturas Emitidas</h3></CardHeader>
            <CardContent className='p-0'>
                <table className='w-full text-left'>
                    <tbody>
                    {filteredData.filteredInvoices.map(inv => (
                        <tr key={inv.id} className='border-b border-gray-800'>
                            <td className='p-3'>{inv.invoice_number}</td>
                            <td className='p-3'>{inv.issue_date}</td>
                            <td className='p-3 text-right font-semibold'>{formatCurrency(inv.subtotal_cents)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><h3 className='text-lg font-semibold'>Gastos Soportados</h3></CardHeader>
            <CardContent className='p-0'>
                <table className='w-full text-left'>
                    <tbody>
                    {filteredData.filteredExpenses.map(exp => (
                        <tr key={exp.id} className='border-b border-gray-800'>
                            <td className='p-3'>{exp.description}</td>
                            <td className='p-3'>{exp.date}</td>
                            <td className='p-3 text-right font-semibold'>{formatCurrency(exp.amount_cents)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaxLedgerPage;