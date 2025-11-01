import React, { useState, useMemo } from 'react';
// FIX: Add .tsx extension to useAppStore import
import { useAppStore } from '../hooks/useAppStore.tsx';
import Card, { CardContent, CardHeader } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Modal from '../components/ui/Modal.tsx';
import Input from '../components/ui/Input.tsx';
// FIX: Add .ts extension to types import
import { Budget, InvoiceItem } from '../types.ts';
import { formatCurrency } from '../lib/utils.ts';
// FIX: Add .tsx extension to Icon import
import { PlusIcon, TrashIcon, CheckCircleIcon, XCircleIcon, MessageSquareIcon } from '../components/icons/Icon.tsx';
import StatusChip from '../components/ui/StatusChip.tsx';
import EmptyState from '../components/ui/EmptyState.tsx';

const BudgetsPage: React.FC = () => {
    const { 
        budgets, 
        clients, 
        addBudget,
        updateBudgetStatus,
        getClientById 
    } = useAppStore();

    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const initialBudgetState = {
        client_id: clients[0]?.id || '',
        description: '',
        items: [{ description: '', quantity: 1, price_cents: 0 }],
    };
    const [newBudget, setNewBudget] = useState(initialBudgetState);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewBudget(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
        const items = [...newBudget.items];
        if(field === 'price_cents') {
            items[index][field] = Math.round(Number(value) * 100);
        } else if (field === 'quantity') {
            items[index][field] = Number(value);
        } else {
            items[index][field] = value as string;
        }
        setNewBudget(prev => ({ ...prev, items }));
    };

    const addItem = () => {
        setNewBudget(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, price_cents: 0 }]
        }));
    };

    const removeItem = (index: number) => {
        if (newBudget.items.length > 1) {
            const items = newBudget.items.filter((_, i) => i !== index);
            setNewBudget(prev => ({ ...prev, items }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addBudget(newBudget);
        setIsModalOpen(false);
        setNewBudget(initialBudgetState);
    };

    const totalAmount = useMemo(() => {
        return newBudget.items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
    }, [newBudget.items]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-white">Presupuestos</h1>
                <Button onClick={() => setIsModalOpen(true)}>Crear Presupuesto</Button>
            </div>

            {budgets.length === 0 ? (
                <EmptyState 
                    icon={MessageSquareIcon}
                    title="No hay presupuestos"
                    message="Crea y envía presupuestos a tus clientes para formalizar tus servicios."
                    action={{ text: "Crear Presupuesto", onClick: () => setIsModalOpen(true) }}
                />
            ) : (
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Listado de Presupuestos</h2>
                    </CardHeader>
                    <CardContent className="p-0">
                        <table className="w-full text-left">
                            <thead className="border-b border-gray-800">
                                <tr>
                                    <th className="p-4">Descripción</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Fecha</th>
                                    <th className="p-4">Importe</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {budgets.map(budget => (
                                    <tr key={budget.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                        <td className="p-4 text-white font-semibold">{budget.description}</td>
                                        <td className="p-4 text-primary-400">{getClientById(budget.client_id)?.name}</td>
                                        <td className="p-4 text-gray-300">{budget.created_at}</td>
                                        <td className="p-4 text-white">{formatCurrency(budget.amount_cents)}</td>
                                        <td className="p-4"><StatusChip type="budget" status={budget.status} /></td>
                                        <td className="p-4 text-right">
                                            {budget.status === 'pending' && (
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="sm" variant="secondary" title="Aceptar" onClick={() => updateBudgetStatus(budget.id, 'accepted')}><CheckCircleIcon className="w-4 h-4 text-green-400"/></Button>
                                                    <Button size="sm" variant="secondary" title="Rechazar" onClick={() => updateBudgetStatus(budget.id, 'rejected')}><XCircleIcon className="w-4 h-4 text-red-400"/></Button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nuevo Presupuesto">
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-gray-300 mb-1">Cliente</label>
                             <select name="client_id" value={newBudget.client_id} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white">
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <Input label="Descripción del Presupuesto" name="description" value={newBudget.description} onChange={handleInputChange} required />
                    </div>
                    
                    <div className="space-y-2 pt-2 border-t border-gray-700">
                        <h4 className="font-semibold text-gray-200">Conceptos</h4>
                        {newBudget.items.map((item, index) => (
                            <div key={index} className="flex gap-2 items-end">
                                <Input label="Descripción" wrapperClassName="flex-1" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} />
                                <Input label="Cant." type="number" wrapperClassName="w-16" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                                <Input label="Precio (€)" type="number" step="0.01" wrapperClassName="w-24" value={item.price_cents / 100} onChange={e => handleItemChange(index, 'price_cents', e.target.value)} />
                                <Button type="button" variant="danger" size="sm" onClick={() => removeItem(index)}><TrashIcon className="w-4 h-4" /></Button>
                            </div>
                        ))}
                         <Button type="button" variant="secondary" size="sm" onClick={addItem}><PlusIcon className="w-4 h-4 mr-1"/>Añadir Concepto</Button>
                    </div>

                    <div className="text-right font-semibold text-white mt-4">Total: {formatCurrency(totalAmount)}</div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit">Guardar Presupuesto</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default BudgetsPage;