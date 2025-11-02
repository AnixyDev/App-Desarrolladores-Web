
import React from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../../hooks/useAppStore.tsx';
import Card, { CardHeader, CardContent, CardFooter } from '../../components/ui/Card.tsx';
import { formatCurrency } from '../../lib/utils.ts';
import Button from '../../components/ui/Button.tsx';

const PortalBudgetViewPage: React.FC = () => {
    const { budgetId } = useParams<{ budgetId: string }>();
    const { budgets, getClientById } = useAppStore();
    
    const budget = budgets.find(b => b.id === budgetId);

    if (!budget) {
        return <div className="text-center text-red-500">Presupuesto no encontrado.</div>;
    }

    const client = getClientById(budget.client_id);
    
    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <h2 className="text-2xl font-bold text-white">Presupuesto: {budget.description}</h2>
                <p className="text-gray-400">Para: {client?.name}</p>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px] text-left mb-8">
                        <thead className='border-b border-gray-700'>
                            <tr>
                                <th className='p-2 font-semibold'>Descripción</th>
                                <th className='p-2 font-semibold text-center'>Cantidad</th>
                                <th className='p-2 font-semibold text-right'>Precio Unit.</th>
                                <th className='p-2 font-semibold text-right'>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {budget.items.map((item, index) => (
                                <tr key={index} className='border-b border-gray-800'>
                                    <td className='p-2'>{item.description}</td>
                                    <td className='p-2 text-center'>{item.quantity}</td>
                                    <td className='p-2 text-right'>{formatCurrency(item.price_cents)}</td>
                                    <td className='p-2 text-right'>{formatCurrency(item.price_cents * item.quantity)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end">
                    <div className="w-full max-w-xs space-y-2 text-right">
                       <div className="flex justify-between font-bold text-white text-lg border-t border-gray-700 pt-2 mt-2">
                            <span>TOTAL:</span><span>{formatCurrency(budget.amount_cents)}</span>
                        </div>
                    </div>
                </div>

            </CardContent>
            <CardFooter className='flex flex-col sm:flex-row justify-between items-center gap-4'>
                 <span className={`px-3 py-1 rounded-full text-sm capitalize ${
                    budget.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    budget.status === 'accepted' ? 'bg-green-500/20 text-green-400' :
                    'bg-red-500/20 text-red-400'
                }`}>
                    Estado: {budget.status}
                </span>
                {budget.status === 'pending' && (
                    <div className='flex gap-2'>
                        <Button variant='danger' size='sm' onClick={() => alert("Presupuesto rechazado (simulación).")}>Rechazar</Button>
                        <Button size='sm' onClick={() => alert("Presupuesto aceptado (simulación).")}>Aceptar</Button>
                    </div>
                )}
            </CardFooter>
        </Card>
    );
};

export default PortalBudgetViewPage;