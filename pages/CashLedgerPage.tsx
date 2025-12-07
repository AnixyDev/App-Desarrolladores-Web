
import React, { useState, useMemo } from 'react';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { useAppStore } from '../hooks/useAppStore';
import { formatCurrency } from '../lib/utils';
import { WalletIcon, PlusIcon, TrashIcon, ArrowUpCircleIcon, ArrowDownCircleIcon } from '../components/icons/Icon';
import { useToast } from '../hooks/useToast';
import { CashMovement } from '../types';

const CashLedgerPage: React.FC = () => {
    const { cashMovements, addCashMovement, deleteCashMovement } = useAppStore();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterCategory, setFilterCategory] = useState('all');

    const initialFormState: Omit<CashMovement, 'id' | 'user_id' | 'created_at'> = {
        description: '',
        amount_cents: 0,
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        category: 'Varios',
    };
    const [formData, setFormData] = useState(initialFormState);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addCashMovement({
            ...formData,
            amount_cents: Math.round(Number(formData.amount_cents) * 100)
        });
        addToast('Movimiento registrado correctamente', 'success');
        setIsModalOpen(false);
        setFormData(initialFormState);
    };

    const filteredMovements = useMemo(() => {
        if (filterCategory === 'all') return cashMovements;
        return cashMovements.filter(m => m.category === filterCategory);
    }, [cashMovements, filterCategory]);

    const stats = useMemo(() => {
        const income = cashMovements.filter(m => m.type === 'income').reduce((sum, m) => sum + m.amount_cents, 0);
        const expense = cashMovements.filter(m => m.type === 'expense').reduce((sum, m) => sum + m.amount_cents, 0);
        return { income, expense, balance: income - expense };
    }, [cashMovements]);

    const uniqueCategories = Array.from(new Set(cashMovements.map(m => m.category)));

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                    <WalletIcon className="w-6 h-6"/> Caja y Movimientos (Contabilidad Auxiliar)
                </h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusIcon className="w-4 h-4 mr-2"/> Registrar Movimiento
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-green-900/50">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Total Entradas</p>
                            <p className="text-2xl font-bold text-green-400">{formatCurrency(stats.income)}</p>
                        </div>
                        <div className="p-3 rounded-full bg-green-900/20 text-green-400"><ArrowUpCircleIcon className="w-6 h-6"/></div>
                    </CardContent>
                </Card>
                <Card className="border-red-900/50">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Total Salidas</p>
                            <p className="text-2xl font-bold text-red-400">{formatCurrency(stats.expense)}</p>
                        </div>
                        <div className="p-3 rounded-full bg-red-900/20 text-red-400"><ArrowDownCircleIcon className="w-6 h-6"/></div>
                    </CardContent>
                </Card>
                <Card className="border-blue-900/50">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-400">Saldo Actual</p>
                            <p className={`text-2xl font-bold ${stats.balance >= 0 ? 'text-white' : 'text-yellow-400'}`}>{formatCurrency(stats.balance)}</p>
                        </div>
                        <div className="p-3 rounded-full bg-blue-900/20 text-blue-400"><WalletIcon className="w-6 h-6"/></div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Historial de Movimientos</h2>
                    <select 
                        value={filterCategory} 
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="bg-gray-800 text-white text-sm rounded-lg border border-gray-700 p-2 outline-none focus:border-primary-500"
                    >
                        <option value="all">Todas las Categorías</option>
                        {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-gray-800 bg-gray-900/50">
                                <tr>
                                    <th className="p-4 text-gray-400 font-medium text-sm">Fecha</th>
                                    <th className="p-4 text-gray-400 font-medium text-sm">Descripción</th>
                                    <th className="p-4 text-gray-400 font-medium text-sm">Categoría</th>
                                    <th className="p-4 text-gray-400 font-medium text-sm text-right">Importe</th>
                                    <th className="p-4 text-gray-400 font-medium text-sm text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800">
                                {filteredMovements.length > 0 ? filteredMovements.map(m => (
                                    <tr key={m.id} className="hover:bg-gray-800/50">
                                        <td className="p-4 text-gray-300 whitespace-nowrap">{m.date}</td>
                                        <td className="p-4 text-white font-medium">{m.description}</td>
                                        <td className="p-4"><span className="px-2 py-1 text-xs rounded-full bg-gray-700 text-gray-300">{m.category}</span></td>
                                        <td className={`p-4 text-right font-bold ${m.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                                            {m.type === 'income' ? '+' : '-'}{formatCurrency(m.amount_cents)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <button onClick={() => deleteCashMovement(m.id)} className="text-gray-500 hover:text-red-400 transition-colors p-1">
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={5} className="p-8 text-center text-gray-500">No hay movimientos registrados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Movimiento de Caja">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Tipo</label>
                            <select name="type" value={formData.type} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 bg-gray-800 text-white">
                                <option value="income">Entrada (Ingreso)</option>
                                <option value="expense">Salida (Gasto)</option>
                            </select>
                        </div>
                        <Input label="Fecha" type="date" name="date" value={formData.date} onChange={handleInputChange} required />
                    </div>
                    <Input label="Descripción" name="description" value={formData.description} onChange={handleInputChange} required placeholder="Ej: Venta en efectivo, Compra material oficina..." />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Importe (€)" type="number" step="0.01" name="amount_cents" value={formData.amount_cents} onChange={handleInputChange} required />
                        <Input label="Categoría" name="category" value={formData.category} onChange={handleInputChange} placeholder="Ej: Ventas, Material, Personal" />
                    </div>
                    
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Guardar Movimiento</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default CashLedgerPage;
