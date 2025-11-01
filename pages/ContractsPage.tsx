import React, { useState, useMemo, useEffect } from 'react';
// FIX: Added .tsx extension to the import path.
import { useAppStore } from '../hooks/useAppStore.tsx';
import Card, { CardContent } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import Modal from '../components/ui/Modal.tsx';
// FIX: Added .ts extension to the import path.
import { Contract } from '../types.ts';
import { formatCurrency } from '../lib/utils.ts';
// FIX: Add .tsx extension to Icon import
import { SendIcon, FileSignatureIcon } from '../components/icons/Icon.tsx';
import StatusChip from '../components/ui/StatusChip.tsx';

const CONTRACT_TEMPLATE = `CONTRATO DE PRESTACIÓN DE SERVICIOS FREELANCE

Este contrato se celebra entre:

- [YOUR_NAME] (en adelante, "el Freelancer"), con NIF [YOUR_TAX_ID].
- [CLIENT_NAME], en representación de [CLIENT_COMPANY] (en adelante, "el Cliente").

Ambas partes acuerdan lo siguiente:

1. OBJETO DEL CONTRATO
El Freelancer se compromete a realizar los servicios profesionales para el proyecto "[PROJECT_NAME]".
Descripción del proyecto: [PROJECT_DESCRIPTION].

2. DURACIÓN Y ENTREGA
Este contrato entrará en vigor en la fecha de su firma. La fecha de entrega estimada para la finalización del proyecto es el [PROJECT_DUE_DATE].

3. HONORARIOS Y FORMA DE PAGO
El coste total de los servicios será de [PROJECT_BUDGET]. El pago se realizará según los plazos acordados en la factura correspondiente.

4. CONFIDENCIALIDAD
Ambas partes se comprometen a mantener la confidencialidad de toda la información compartida durante la duración de este contrato.

Firmado a [CURRENT_DATE].
`;

const ContractsPage: React.FC = () => {
    const { profile, contracts, clients, projects, addContract, sendContract, getClientById, getProjectById } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [contractContent, setContractContent] = useState('');

    const clientProjects = useMemo(() => projects.filter(p => p.client_id === selectedClientId), [projects, selectedClientId]);

    useEffect(() => {
        if (clientProjects.length > 0) {
            setSelectedProjectId(clientProjects[0].id);
        } else {
            setSelectedProjectId('');
        }
    }, [clientProjects]);
    
    useEffect(() => {
        if (selectedProjectId) {
            const project = getProjectById(selectedProjectId);
            const client = getClientById(selectedClientId);
            if (project && client && profile) {
                const newContent = CONTRACT_TEMPLATE
                    .replace('[YOUR_NAME]', profile.full_name)
                    .replace('[YOUR_TAX_ID]', profile.tax_id)
                    .replace('[CLIENT_NAME]', client.name)
                    .replace('[CLIENT_COMPANY]', client.company || client.name)
                    .replace('[PROJECT_NAME]', project.name)
                    .replace('[PROJECT_DESCRIPTION]', project.description || 'No especificada.')
                    .replace('[PROJECT_DUE_DATE]', project.due_date)
                    .replace('[PROJECT_BUDGET]', project.budget_cents ? formatCurrency(project.budget_cents) : 'a convenir')
                    .replace('[CURRENT_DATE]', new Date().toLocaleDateString('es-ES'));
                setContractContent(newContent);
            }
        } else {
            setContractContent('');
        }
    }, [selectedClientId, selectedProjectId, getProjectById, getClientById, profile]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedClientId && selectedProjectId && contractContent) {
            addContract({
                client_id: selectedClientId,
                project_id: selectedProjectId,
                content: contractContent,
            });
            setIsModalOpen(false);
        }
    };

    const handleSendEmail = (contract: Contract) => {
        const client = getClientById(contract.client_id);
        const project = getProjectById(contract.project_id);
        if (!client || !client.email || !project) {
            alert('Faltan datos del cliente o del proyecto para enviar el email.');
            return;
        }

        sendContract(contract.id);

        const portalLink = `${window.location.origin}${window.location.pathname}#/portal/contract/${contract.id}`;
        const subject = `Contrato para el proyecto "${project.name}"`;
        const body = `Hola ${client.name},\n\nTe envío el contrato para nuestro proyecto "${project.name}".\n\nPuedes revisarlo y firmarlo digitalmente a través del siguiente enlace seguro:\n${portalLink}\n\nQuedo a tu disposición para cualquier duda.\n\nSaludos,\n${profile.full_name}`;

        const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold text-white">Contratos</h1>
                <Button onClick={() => setIsModalOpen(true)}>Crear Contrato</Button>
            </div>

            <Card>
                <CardContent className="p-4 md:p-0">
                    {/* Mobile View */}
                    <div className="md:hidden space-y-4">
                        {contracts.map(contract => {
                            const project = getProjectById(contract.project_id);
                            const client = getClientById(contract.client_id);
                            return (
                                <div key={contract.id} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-semibold text-white pr-2">{project?.name}</p>
                                            <p className="text-sm text-gray-300">{client?.name}</p>
                                        </div>
                                        <StatusChip type="contract" status={contract.status} />
                                    </div>
                                    <div className="text-sm space-y-2 text-gray-400 border-t border-gray-700 pt-3 mt-3">
                                        <p className='flex justify-between'><span>Fecha:</span> <span className="text-gray-200">{new Date(contract.created_at).toLocaleDateString()}</span></p>
                                    </div>
                                    <div className="flex justify-end mt-4">
                                        {contract.status === 'draft' && (
                                            <Button size="sm" variant="secondary" onClick={() => handleSendEmail(contract)} title="Enviar por Email">
                                                <SendIcon className="w-4 h-4 mr-2" /> Enviar
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:block">
                        <table className="w-full text-left">
                            <thead className="border-b border-gray-800">
                                <tr>
                                    <th className="p-4 font-semibold whitespace-nowrap">Proyecto</th>
                                    <th className="p-4 font-semibold whitespace-nowrap">Cliente</th>
                                    <th className="p-4 font-semibold whitespace-nowrap">Fecha</th>
                                    <th className="p-4 font-semibold whitespace-nowrap">Estado</th>
                                    <th className="p-4 font-semibold whitespace-nowrap">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contracts.map(contract => {
                                    const project = getProjectById(contract.project_id);
                                    const client = getClientById(contract.client_id);
                                    return (
                                        <tr key={contract.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                            <td className="p-4 text-white">{project?.name}</td>
                                            <td className="p-4 text-gray-300">{client?.name}</td>
                                            <td className="p-4 text-gray-300">{new Date(contract.created_at).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <StatusChip type="contract" status={contract.status} />
                                            </td>
                                            <td className="p-4">
                                                {contract.status === 'draft' && (
                                                    <Button size="sm" variant="secondary" onClick={() => handleSendEmail(contract)} title="Enviar por Email">
                                                        <SendIcon className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nuevo Contrato">
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] flex flex-col">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Cliente</label>
                            <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white">
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Proyecto</label>
                            <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white" disabled={clientProjects.length === 0}>
                                {clientProjects.length > 0 ? (
                                    clientProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                                ) : (
                                    <option>No hay proyectos para este cliente</option>
                                )}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Contenido del Contrato</label>
                        <textarea
                            value={contractContent}
                            onChange={e => setContractContent(e.target.value)}
                            rows={15}
                            className="block w-full px-3 py-2 border border-gray-600 rounded-md shadow-sm placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-gray-800 text-white font-mono text-xs"
                            disabled={!selectedProjectId}
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={!selectedProjectId}>Guardar Contrato</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default ContractsPage;