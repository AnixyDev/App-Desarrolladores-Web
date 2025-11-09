import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Contract } from '../types';
import { formatCurrency } from '../lib/utils';
import { SendIcon, FileSignatureIcon } from '../components/icons/Icon';
import StatusChip from '../components/ui/StatusChip';
import { ContractCard } from '../contracts/ContractCard';
import EmptyState from '../components/ui/EmptyState';
import Input from '../components/ui/Input';
import { useToast } from '../hooks/useToast';

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
    const { profile, contracts, clients, projects, addContract, sendContract, getClientById, getProjectById, setContractExpiration, contractTemplates, addContractTemplate } = useAppStore();
    const { addToast } = useToast();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [contractContent, setContractContent] = useState('');
    const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
    const [saveAsTemplate, setSaveAsTemplate] = useState(false);
    const [templateName, setTemplateName] = useState('');

    const clientProjects = useMemo(() => projects.filter(p => p.client_id === selectedClientId), [projects, selectedClientId]);

    useEffect(() => {
        if (clientProjects.length > 0 && !clientProjects.find(p => p.id === selectedProjectId)) {
            setSelectedProjectId(clientProjects[0].id);
        } else if (clientProjects.length === 0) {
            setSelectedProjectId('');
        }
    }, [clientProjects, selectedProjectId]);
    
    useEffect(() => {
        const project = getProjectById(selectedProjectId);
        const client = getClientById(selectedClientId);
        if (project && client && profile) {
            let templateContent = CONTRACT_TEMPLATE; // Default
            if (loadedTemplateId) {
                const loadedTemplate = contractTemplates.find(t => t.id === loadedTemplateId);
                if (loadedTemplate) {
                    templateContent = loadedTemplate.content_template;
                }
            }
            
            const newContent = templateContent
                .replace(/\[YOUR_NAME\]/g, profile.full_name)
                .replace(/\[YOUR_TAX_ID\]/g, profile.tax_id)
                .replace(/\[CLIENT_NAME\]/g, client.name)
                .replace(/\[CLIENT_COMPANY\]/g, client.company || client.name)
                .replace(/\[PROJECT_NAME\]/g, project.name)
                .replace(/\[PROJECT_DESCRIPTION\]/g, project.description || 'No especificada.')
                .replace(/\[PROJECT_DUE_DATE\]/g, project.due_date)
                .replace(/\[PROJECT_BUDGET\]/g, project.budget_cents ? formatCurrency(project.budget_cents) : 'a convenir')
                .replace(/\[CURRENT_DATE\]/g, new Date().toLocaleDateString('es-ES'));
            setContractContent(newContent);
        } else {
            setContractContent('');
        }
    }, [selectedClientId, selectedProjectId, getProjectById, getClientById, profile, loadedTemplateId, contractTemplates]);

    const handleLoadTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;
        const template = contractTemplates.find(t => t.id === templateId);
        if (template) {
            addToast(`Plantilla "${template.name}" cargada.`, 'info');
        }
        setLoadedTemplateId(templateId || null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (saveAsTemplate && templateName) {
            addContractTemplate({
                name: templateName,
                content_template: contractContent
            });
            addToast(`Plantilla "${templateName}" guardada.`, 'success');
        }

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

        const portalLink = `${window.location.origin}/#/portal/contract/${contract.id}`;
        const subject = `Contrato para el proyecto "${project.name}"`;
        const body = `Hola ${client.name},\n\nTe envío el contrato para nuestro proyecto "${project.name}".\n\nPuedes revisarlo y firmarlo digitalmente a través del siguiente enlace seguro:\n${portalLink}\n\nQuedo a tu disposición para cualquier duda.\n\nSaludos,\n${profile.full_name}`;

        const mailtoLink = `mailto:${client.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoLink, '_blank');
    };

    const openModal = () => {
        setIsModalOpen(true);
        setLoadedTemplateId(null);
        setSaveAsTemplate(false);
        setTemplateName('');
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold text-white">Contratos</h1>
                <Button onClick={openModal}>Crear Contrato</Button>
            </div>

            {contracts.length === 0 ? (
                <EmptyState
                    icon={FileSignatureIcon}
                    title="No tienes contratos"
                    message="Formaliza tus acuerdos creando y enviando contratos digitales para que tus clientes los firmen."
                    action={{ text: "Crear Contrato", onClick: openModal }}
                />
            ) : (
                <Card>
                    <CardContent className="p-0">
                        {/* Mobile View */}
                        <div className="md:hidden space-y-4 p-4">
                            {contracts.map(contract => {
                                const project = getProjectById(contract.project_id);
                                const client = getClientById(contract.client_id);
                                return (
                                    <ContractCard 
                                        key={contract.id}
                                        contract={contract}
                                        projectName={project?.name}
                                        clientName={client?.name}
                                        onSend={handleSendEmail}
                                        onSetExpiration={setContractExpiration}
                                    />
                                );
                            })}
                        </div>

                        {/* Desktop View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="border-b border-slate-800">
                                    <tr>
                                        <th className="p-4 font-semibold whitespace-nowrap">Proyecto</th>
                                        <th className="p-4 font-semibold whitespace-nowrap">Cliente</th>
                                        <th className="p-4 font-semibold whitespace-nowrap">Fecha</th>
                                        <th className="p-4 font-semibold whitespace-nowrap">Estado</th>
                                        <th className="p-4 font-semibold whitespace-nowrap">Vencimiento</th>
                                        <th className="p-4 font-semibold whitespace-nowrap">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contracts.map(contract => {
                                        const project = getProjectById(contract.project_id);
                                        const client = getClientById(contract.client_id);
                                        return (
                                            <tr key={contract.id} className="border-b border-slate-800">
                                                <td className="p-4 text-white">{project?.name}</td>
                                                <td className="p-4 text-slate-300">{client?.name}</td>
                                                <td className="p-4 text-slate-300">{new Date(contract.created_at).toLocaleDateString()}</td>
                                                <td className="p-4">
                                                    <StatusChip type="contract" status={contract.status} />
                                                </td>
                                                <td className="p-4">
                                                    {contract.status === 'draft' ? (
                                                        <input
                                                            type="date"
                                                            value={contract.expires_at || ''}
                                                            onChange={(e) => setContractExpiration(contract.id, e.target.value)}
                                                            className="px-2 py-1 border border-slate-600 rounded-md bg-slate-700 text-white text-sm focus:outline-none focus:ring-1 focus:ring-primary-500"
                                                        />
                                                    ) : (
                                                        <span className="text-slate-500">N/A</span>
                                                    )}
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
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Nuevo Contrato">
                <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] flex flex-col">
                     <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Cargar desde Plantilla</label>
                        <select onChange={handleLoadTemplate} className="block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-slate-800 text-white">
                            <option value="">Usar plantilla estándar</option>
                            {contractTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Cliente</label>
                            <select value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)} className="block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-slate-800 text-white">
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-300 mb-1">Proyecto</label>
                            <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} className="block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-slate-800 text-white" disabled={clientProjects.length === 0}>
                                {clientProjects.length > 0 ? (
                                    clientProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                                ) : (
                                    <option>No hay proyectos para este cliente</option>
                                )}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">Contenido del Contrato</label>
                        <textarea
                            value={contractContent}
                            onChange={e => setContractContent(e.target.value)}
                            rows={15}
                            className="block w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm placeholder-slate-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-slate-800 text-white font-mono text-xs"
                            disabled={!selectedProjectId}
                        />
                    </div>
                    <div className="pt-4 border-t border-slate-700 space-y-3">
                        <div className="flex items-center gap-3">
                            <input type="checkbox" id="saveAsTemplate" name="saveAsTemplate" checked={saveAsTemplate} onChange={(e) => setSaveAsTemplate(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"/>
                            <label htmlFor="saveAsTemplate" className="font-medium text-gray-200">Guardar como Plantilla</label>
                        </div>
                        {saveAsTemplate && (
                            <Input
                                label="Nombre de la Plantilla"
                                name="templateName"
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="Ej: Contrato de Desarrollo Estándar"
                                required={saveAsTemplate}
                            />
                        )}
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