import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader, CardFooter } from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Modal from '../components/ui/Modal';
import { InvoiceItem } from '../types';
import { PlusIcon, TrashIcon, SparklesIcon, RepeatIcon, SaveIcon } from '../components/icons/Icon';
import { useToast } from '../hooks/useToast';
import { generateItemsForDocument, AI_CREDIT_COSTS } from '../services/geminiService';
import BuyCreditsModal from '../components/modals/BuyCreditsModal';


const CreateInvoicePage: React.FC = () => {
    const { 
        clients, 
        projects,
        timeEntries, 
        profile, 
        addInvoice,
        addRecurringInvoice,
        consumeCredits,
        invoiceTemplates,
        addInvoiceTemplate
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
        tax_percent: 21,
        isRecurring: false,
        frequency: 'monthly' as 'monthly' | 'yearly',
        start_date: new Date().toISOString().split('T')[0],
    };
    const [newInvoice, setNewInvoice] = useState(initialInvoiceState);
    const [timeEntryIdsToBill, setTimeEntryIdsToBill] = useState<string[]>([]);
    const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isBuyCreditsModalOpen, setIsBuyCreditsModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');
    
    useEffect(() => {
        const { projectId, clientId, timeEntryIds, budgetItems } = location.state || {};
        let stateHandled = false;

        if (clientId && projectId && timeEntryIds && timeEntryIds.length > 0) {
            stateHandled = true;
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
        } else if (clientId && projectId && budgetItems && budgetItems.length > 0) {
            stateHandled = true;
            setNewInvoice(prev => ({
                ...prev,
                client_id: clientId,
                project_id: projectId,
                items: budgetItems,
            }));
            addToast('Factura pre-rellenada desde el presupuesto del proyecto.', 'info');
        } else if (clientId && projectId) {
            stateHandled = true;
            setNewInvoice(prev => ({
                ...prev,
                client_id: clientId,
                project_id: projectId,
            }));
            addToast('Cliente y proyecto pre-seleccionados.', 'info');
        }

        if (stateHandled) {
            // Clear state from navigation after using it
            window.history.replaceState({}, document.title);
        }
    }, [location.state, timeEntries, profile.hourly_rate_cents, addToast]);


    const clientProjects = useMemo(() => {
        return projects.filter(p => p.client_id === newInvoice.client_id)
    }, [projects, newInvoice.client_id]);


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             setNewInvoice(prev => ({ ...prev, [name]: checked }));
        } else {
            setNewInvoice(prev => ({ ...prev, [name]: value }));
        }
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

    const handleSaveTemplate = () => {
        if (templateName) {
            addInvoiceTemplate({
                name: templateName,
                items: newInvoice.items,
                tax_percent: newInvoice.tax_percent
            });
            addToast(`Plantilla "${templateName}" guardada.`, 'success');
            setIsTemplateModalOpen(false);
            setTemplateName('');
        }
    };

    const handleLoadTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;
        const template = invoiceTemplates.find(t => t.id === templateId);
        if (template) {
            setNewInvoice(prev => ({
                ...prev,
                items: template.items,
                tax_percent: template.tax_percent
            }));
            addToast(`Plantilla "${template.name}" cargada.`, 'info');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newInvoice.isRecurring) {
            addRecurringInvoice({
                client_id: newInvoice.client_id,
                project_id: newInvoice.project_id,
                items: newInvoice.items,
                tax_percent: newInvoice.tax_percent,
                frequency: newInvoice.frequency,
                start_date: newInvoice.start_date,
            });
            addToast('Factura recurrente creada. La primera factura se generará ahora.', 'success');
        } else {
            addInvoice({
                 client_id: newInvoice.client_id,
                 project_id: newInvoice.project_id,
                 issue_date: newInvoice.issue_date,
                 due_date: newInvoice.due_date,
                 items: newInvoice.items,
                 tax_percent: newInvoice.tax_percent,
            }, timeEntryIdsToBill);
            addToast('Factura creada con éxito', 'success');
        }
        navigate('/invoices');
    };
    
    const handleAiGenerate = async () => {
        if (profile.ai_credits < AI_CREDIT_COSTS.generateInvoiceItems) {
            setIsBuyCreditsModalOpen(true);
            return;
        }
        setIsAiLoading(true);
        try {
            const items = await generateItemsForDocument(aiPrompt, profile.hourly_rate_cents);
            if (items && items.length > 0) {
                setNewInvoice(prev => ({ ...prev, items }));
                addToast('Conceptos generados con IA.', 'success');
                consumeCredits(AI_CREDIT_COSTS.generateInvoiceItems);
                setIsAIGeneratorOpen(false);
            } else {
                addToast('No se pudieron generar conceptos. Intenta ser más específico.', 'error');
            }
        } catch (e) {
            addToast((e as Error).message, 'error');
        } finally {
            setIsAiLoading(false);
        }
    };


    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-semibold text-white">Crear Factura</h1>
                <Button type="button" variant="secondary" onClick={() => navigate('/invoices')}>Cancelar</Button>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-end">
                         <Select onChange={handleLoadTemplate} className="w-full sm:w-64">
                            <option value="">Cargar desde plantilla...</option>
                            {invoiceTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                             <label className="block text-sm font-medium text-gray-300 mb-1">Cliente</label>
                             <Select name="client_id" value={newInvoice.client_id} onChange={handleInputChange}>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </Select>
                        </div>
                         <div>
                             <label className="block text-sm font-medium text-gray-300 mb-1">Proyecto (Opcional)</label>
                             <Select name="project_id" value={newInvoice.project_id} onChange={handleInputChange}>
                                <option value="">Ninguno</option>
                                {clientProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input wrapperClassName="sm:col-span-1" label="Fecha de Emisión" name="issue_date" type="date" value={newInvoice.issue_date} onChange={handleInputChange} disabled={newInvoice.isRecurring} />
                        <Input wrapperClassName="sm:col-span-1" label="Fecha de Vencimiento" name="due_date" type="date" value={newInvoice.due_date} onChange={handleInputChange} disabled={newInvoice.isRecurring} />
                        <Input wrapperClassName="sm:col-span-1" label="IVA (%)" name="tax_percent" type="number" value={newInvoice.tax_percent} onChange={handleInputChange} />
                    </div>

                    <div className="pt-4 border-t border-gray-700">
                        <div className="flex items-center gap-3">
                             <input type="checkbox" id="isRecurring" name="isRecurring" checked={newInvoice.isRecurring} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-primary-600 focus:ring-primary-500"/>
                            <label htmlFor="isRecurring" className="font-medium text-gray-200 flex items-center gap-2"><RepeatIcon className="w-4 h-4" /> Hacer esta factura recurrente</label>
                        </div>
                        {newInvoice.isRecurring && (
                            <div className="grid grid-cols-2 gap-4 mt-4 p-4 bg-gray-800/50 rounded-lg">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">Frecuencia</label>
                                    <Select name="frequency" value={newInvoice.frequency} onChange={handleInputChange}>
                                        <option value="monthly">Mensual</option>
                                        <option value="yearly">Anual</option>
                                    </Select>
                                </div>
                                 <Input label="Fecha de Inicio" name="start_date" type="date" value={newInvoice.start_date} onChange={handleInputChange} />
                            </div>
                        )}
                    </div>

                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-white">Conceptos</h2>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setIsAIGeneratorOpen(true)}><SparklesIcon className="w-4 h-4 mr-1"/>Generar con IA</Button>
                </CardHeader>
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
                <CardFooter className="flex justify-end gap-2">
                     <Button type="button" variant="secondary" onClick={() => setIsTemplateModalOpen(true)}>
                        <SaveIcon className="w-4 h-4 mr-2" />Guardar como Plantilla
                     </Button>
                     <Button type="submit">Guardar Factura</Button>
                </CardFooter>
            </Card>

            {/* AI Generator Modal */}
            <Modal isOpen={isAIGeneratorOpen} onClose={() => setIsAIGeneratorOpen(false)} title="Generar Conceptos con IA">
                <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Describe los conceptos a facturar:</label>
                    <Textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} rows={4} placeholder="Ej: desarrollo de API de autenticación, 3 endpoints, y configuración de base de datos."/>
                    <div className="flex justify-end pt-2">
                        <Button onClick={handleAiGenerate} disabled={isAiLoading || !aiPrompt}>
                           {isAiLoading ? 'Generando...' : `Generar (${AI_CREDIT_COSTS.generateInvoiceItems} créditos)`}
                        </Button>
                    </div>
                </div>
            </Modal>
            
            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Guardar Plantilla de Factura">
                <div className="space-y-4">
                    <Input label="Nombre de la Plantilla" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Ej: Factura de Mantenimiento Mensual" />
                    <div className="flex justify-end pt-2">
                        <Button onClick={handleSaveTemplate} disabled={!templateName}>
                            Guardar Plantilla
                        </Button>
                    </div>
                </div>
            </Modal>
            
            <BuyCreditsModal isOpen={isBuyCreditsModalOpen} onClose={() => setIsBuyCreditsModalOpen(false)} />
        </form>
    );
};

export default CreateInvoicePage;