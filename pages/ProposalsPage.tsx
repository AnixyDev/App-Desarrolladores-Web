import React, { useState } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { Proposal } from '../types';
import { formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import StatusChip from '../components/ui/StatusChip';
import EmptyState from '../components/ui/EmptyState';
import { MessageSquareIcon } from '../components/icons/Icon';
import { useToast } from '../hooks/useToast';


const ProposalsPage: React.FC = () => {
    const { 
        proposals, 
        clients, 
        addProposal,
        getClientById,
        proposalTemplates,
        addProposalTemplate
    } = useAppStore();
    const { addToast } = useToast();

    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const initialProposalState = {
        client_id: clients[0]?.id || '',
        title: '',
        content: '',
        amount_cents: 0,
        saveAsTemplate: false,
        templateName: '',
    };
    const [newProposal, setNewProposal] = useState(initialProposalState);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isCheckbox = type === 'checkbox';
        setNewProposal(prev => ({ 
            ...prev, 
            [name]: isCheckbox ? (e.target as HTMLInputElement).checked : value 
        }));
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const amountInCents = value === '' ? 0 : Math.round(Number(value) * 100);
        setNewProposal(prev => ({ ...prev, amount_cents: amountInCents }));
    };

    const handleLoadTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;
        const template = proposalTemplates.find(t => t.id === templateId);
        if (template) {
            setNewProposal(prev => ({
                ...prev,
                title: template.title_template,
                content: template.content_template,
            }));
            addToast(`Plantilla "${template.name}" cargada.`, 'info');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newProposal.saveAsTemplate && newProposal.templateName) {
            addProposalTemplate({
                name: newProposal.templateName,
                title_template: newProposal.title,
                content_template: newProposal.content,
            });
            addToast(`Plantilla "${newProposal.templateName}" guardada.`, 'success');
        }

        addProposal({
            client_id: newProposal.client_id,
            title: newProposal.title,
            content: newProposal.content,
            amount_cents: newProposal.amount_cents,
        });

        setIsModalOpen(false);
        setNewProposal(initialProposalState);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-white">Propuestas</h1>
                <Button onClick={() => setIsModalOpen(true)}>Crear Propuesta</Button>
            </div>

            {proposals.length === 0 ? (
                <EmptyState
                    icon={MessageSquareIcon}
                    title="No tienes propuestas"
                    message="Crea propuestas profesionales para enviar a tus clientes y ganar nuevos proyectos."
                    action={{ text: "Crear Propuesta", onClick: () => setIsModalOpen(true) }}
                />
            ) : (
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white">Listado de Propuestas</h2>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-gray-800">
                                    <tr>
                                        <th className="p-4">Título</th>
                                        <th className="p-4">Cliente</th>
                                        <th className="p-4">Fecha</th>
                                        <th className="p-4">Importe</th>
                                        <th className="p-4">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {proposals.map(proposal => (
                                        <tr key={proposal.id} className="border-b border-gray-800">
                                            <td className="p-4 text-white font-semibold">{proposal.title}</td>
                                            <td className="p-4 text-primary-400"><Link to={`/clients/${proposal.client_id}`}>{getClientById(proposal.client_id)?.name}</Link></td>
                                            <td className="p-4 text-gray-300">{proposal.created_at}</td>
                                            <td className="p-4 text-white">{formatCurrency(proposal.amount_cents)}</td>
                                            <td className="p-4"><StatusChip type="proposal" status={proposal.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nueva Propuesta">
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                     <div>
                         <label className="block text-sm font-medium text-gray-300 mb-1">Cargar desde Plantilla</label>
                         <select onChange={handleLoadTemplate} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white">
                            <option value="">Seleccionar plantilla...</option>
                            {proposalTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div>
                         <label className="block text-sm font-medium text-gray-300 mb-1">Cliente</label>
                         <select name="client_id" value={newProposal.client_id} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white">
                            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <Input label="Título de la Propuesta" name="title" value={newProposal.title} onChange={handleInputChange} required />
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Contenido</label>
                         <textarea name="content" rows={8} value={newProposal.content} onChange={handleInputChange} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white" />
                    </div>
                    <Input 
                        label="Importe Total (€)" 
                        name="amount_cents" 
                        type="number" 
                        step="0.01" 
                        value={newProposal.amount_cents === 0 ? '' : newProposal.amount_cents / 100}
                        onChange={handleAmountChange} 
                        required 
                    />

                    <div className="pt-4 border-t border-gray-700 space-y-3">
                        <div className="flex items-center gap-3">
                             <input type="checkbox" id="saveAsTemplate" name="saveAsTemplate" checked={newProposal.saveAsTemplate} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"/>
                            <label htmlFor="saveAsTemplate" className="font-medium text-gray-200">Guardar como Plantilla</label>
                        </div>
                        {newProposal.saveAsTemplate && (
                            <Input
                                label="Nombre de la Plantilla"
                                name="templateName"
                                value={newProposal.templateName}
                                onChange={handleInputChange}
                                placeholder="Ej: Propuesta de Desarrollo Web"
                                required
                            />
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit">Guardar y Enviar Propuesta</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ProposalsPage;