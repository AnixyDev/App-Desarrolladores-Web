// FIX: Add a triple-slash directive to explicitly include React types, resolving issues with JSX elements not being recognized by TypeScript.
/// <reference types="react" />

import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../hooks/useAppStore.tsx';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Input from '../components/ui/Input.tsx';
import { InvoiceItem } from '../types.ts';
import { PlusIcon, TrashIcon } from '../components/icons/Icon.tsx';
import { useToast } from '../hooks/useToast.ts';

const CreateInvoicePage: React.FC = () => {
    const { 
        clients, 
        projects,
        timeEntries, 
        profile, 
        addInvoice
    } = useAppStore();
    const navigate = useNavigate();
    const location = useLocation();
    const { addToast } = useToast();
    
    const initialInvoiceState = {
        client_id: clients[0]?.id || '',
        project_id: '',
        issue_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: [{ description: '', quantity: 1, price_cents: 0 }],
        tax_percent: 21
    };
    const [newInvoice, setNewInvoice] = useState(initialInvoiceState);
    const [timeEntryIdsToBill, setTimeEntryIdsToBill] = useState<string[]>([]);
    
    useEffect(() => {
        const { projectId, clientId, timeEntryIds } = location.state || {};
        if (clientId && projectId && timeEntryIds && timeEntryIds.length > 0) {
            setTimeEntryIdsToBill(timeEntryIds);
            const entriesToBill = timeEntries.filter(t => timeEntryIds.includes(t.id));

            const totalSeconds = entriesToBill.reduce((sum, entry) => sum + entry.duration_seconds, 0);
            const totalHours = totalSeconds / 3600;

            if (totalHours > 0) {
                const newItem: InvoiceItem = {
                    description: `Desarrollo y consultoría (${totalHours.toFixed(2)} horas)`,
                    quantity: 1,
                    price_cents: Math.round(totalHours * profile.hourly_rate_cents)
                };
                 setNewInvoice(prev => ({
                    ...prev,
                    client_id: clientId,
                    project_id: projectId,
                    items: [newItem],
                }));
                addToast('Concepto de horas no facturadas añadido.', 'info');
            } else {
                 setNewInvoice(prev => ({ ...prev, client_id: clientId, project_id: projectId }));
            }
        }
        // Clear state from navigation after using it
        window.history.replaceState({}, document.title);
    }, [location.state, timeEntries, profile.hourly_rate_cents, addToast]);


    const clientProjects = useMemo(() => {
        return projects.filter(p => p.client_id === newInvoice.client_id)
    }, [projects, newInvoice.client_id]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setNewInvoice(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
        const items = [...newInvoice.items];
        if(field === 'price_cents') {
            items[index][field] = Math.round(Number(value) * 100);
        } else if (field === 'quantity') {
            items[index][field] = Number(value);
        } else {
            items[index][field] = value as string;
        }
        setNewInvoice(prev => ({ ...prev, items }));
    };

    const addItem = () => {
        setNewInvoice(prev => ({
            ...prev,
            items: [...prev.items, { description: '', quantity: 1, price_cents: 0 }]
        }));
    };

    const removeItem = (index: number) => {
        if (newInvoice.items.length > 1) {
            const items = newInvoice.items.filter((_, i) => i !== index);
            setNewInvoice(prev => ({ ...prev, items }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        addInvoice(newInvoice, timeEntryIdsToBill);
        addToast('Factura creada con éxito', 'success');
        navigate('/invoices');
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-white">Crear Factura</h1>
                <Button type="button" variant="secondary" onClick={() => navigate('/invoices')}>Cancelar</Button>
            </div>
            <Card>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-gray-300 mb-1">Cliente</label>
                             <select name="client_id" value={newInvoice.client_id} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white">
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-300 mb-1">Proyecto (Opcional)</label>
                             <select name="project_id" value={newInvoice.project_id} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white">
                                <option value="">Ninguno</option>
                                {clientProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input wrapperClassName="sm:col-span-1" label="Fecha de Emisión" name="issue_date" type="date" value={newInvoice.issue_date} onChange={handleInputChange} />
                        <Input wrapperClassName="sm:col-span-1" label="Fecha de Vencimiento" name="due_date" type="date" value={newInvoice.due_date} onChange={handleInputChange} />
                        <Input wrapperClassName="sm:col-span-1" label="IVA (%)" name="tax_percent" type="number" value={newInvoice.tax_percent} onChange={handleInputChange} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader><h2 className="text-lg font-semibold text-white">Conceptos</h2></CardHeader>
                <CardContent className="space-y-2">
                    {newInvoice.items.map((item, index) => (
                        <div key={index} className="flex gap-2 items-end">
                            <Input label="Descripción" wrapperClassName="flex-1" value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} />
                            <Input label="Cant." type="number" wrapperClassName="w-16" value={item.quantity} onChange={e => handleItemChange(index, 'quantity', e.target.value)} />
                            <Input label="Precio (€)" type="number" step="0.01" wrapperClassName="w-24" value={item.price_cents / 100} onChange={e => handleItemChange(index, 'price_cents', e.target.value)} />
                            <Button type="button" variant="danger" size="sm" onClick={() => removeItem(index)} aria-label="Eliminar concepto"><TrashIcon className="w-4 h-4" /></Button>
                        </div>
                    ))}
                    <Button type="button" variant="secondary" size="sm" onClick={addItem}><PlusIcon className="w-4 h-4 mr-1"/>Añadir Concepto</Button>
                </CardContent>
                <CardFooter className="flex justify-end">
                     <Button type="submit">Guardar Factura</Button>
                </CardFooter>
            </Card>

        </form>
    );
};

export default CreateInvoicePage;