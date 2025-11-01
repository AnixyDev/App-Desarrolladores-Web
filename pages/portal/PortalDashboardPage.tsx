

import React from 'react';
import { useParams } from 'react-router-dom';
// FIX: Added .tsx extension to the import path.
import { useAppStore } from '../../hooks/useAppStore.tsx';
import Card, { CardHeader, CardContent } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils.ts';
import { Link } from 'react-router-dom';

const PortalDashboardPage: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const { clients, invoices, budgets, proposals } = useAppStore();

    const client = clients.find(c => c.id === clientId);
    const clientInvoices = invoices.filter(i => i.client_id === clientId);
    const clientBudgets = budgets.filter(b => b.client_id === clientId);
    const clientProposals = proposals.filter(p => p.client_id === clientId);

    if (!client) {
        return <div className="text-center text-red-500">Cliente no encontrado.</div>;
    }

    return (
        <div className="space-y-8">
            <h2 className="text-3xl font-bold text-white">Bienvenido, {client.name}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardHeader><h3 className="text-lg font-semibold text-white">Facturas</h3></CardHeader>
                    <CardContent>
                        {clientInvoices.length > 0 ? (
                             <ul className='space-y-2'>
                                {clientInvoices.map(inv => (
                                    <li key={inv.id} className='flex justify-between'>
                                        <Link to={`/portal/invoice/${inv.id}`} className="text-primary-400 hover:underline">{inv.invoice_number}</Link>
                                        <span>{formatCurrency(inv.total_cents)}</span>
                                        <span className={inv.paid ? 'text-green-400' : 'text-yellow-400'}>{inv.paid ? 'Pagada' : 'Pendiente'}</span>
                                    </li>
                                ))}
                             </ul>
                        ) : <p className="text-gray-400">No hay facturas.</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><h3 className="text-lg font-semibold text-white">Presupuestos</h3></CardHeader>
                    <CardContent>
                        {clientBudgets.length > 0 ? (
                             <ul className='space-y-2'>
                                {clientBudgets.map(b => (
                                    <li key={b.id} className='flex justify-between'>
                                         <Link to={`/portal/budget/${b.id}`} className="text-primary-400 hover:underline">{b.description}</Link>
                                         <span className='capitalize'>{b.status}</span>
                                    </li>
                                ))}
                             </ul>
                        ) : <p className="text-gray-400">No hay presupuestos.</p>}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader><h3 className="text-lg font-semibold text-white">Propuestas</h3></CardHeader>
                    <CardContent>
                        {clientProposals.length > 0 ? (
                             <ul className='space-y-2'>
                                {clientProposals.map(p => (
                                    <li key={p.id} className='flex justify-between'>
                                        <Link to={`/portal/proposal/${p.id}`} className="text-primary-400 hover:underline">{p.title}</Link>
                                        <span className='capitalize'>{p.status}</span>
                                    </li>
                                ))}
                             </ul>
                        ) : <p className="text-gray-400">No hay propuestas.</p>}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PortalDashboardPage;