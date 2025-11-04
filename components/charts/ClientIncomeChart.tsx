

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// FIX: Remove .ts extension from import to fix module resolution error.
import type { Invoice } from '../../types';

interface ChartProps {
  invoices: Invoice[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value / 100);

const processChartData = (invoices: Invoice[]) => {
    const dataByMonth: { [key: string]: { name: string; ingresos: number } } = {};
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

    invoices.forEach(invoice => {
        if (invoice.paid && invoice.payment_date) {
            const date = new Date(invoice.payment_date);
            const monthKey = `${date.getFullYear()}-${