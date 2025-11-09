import React, { useState, lazy, Suspense } from 'react';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { FileTextIcon, FileSignatureIcon, TrashIcon, CopyIcon, BookIcon } from '../components/icons/Icon';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../hooks/useToast';

const ConfirmationModal = lazy(() => import('../components/modals/ConfirmationModal'));

const TemplatesPage: React.FC = () => {
    const { 
        invoiceTemplates, 
        proposalTemplates,
        contractTemplates,
        deleteInvoiceTemplate,
        deleteProposalTemplate,
        deleteContractTemplate
    } = useAppStore();
    const { addToast } = useToast();

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string, type: 'invoice' | 'proposal' | 'contract' } | null>(null);

    const handleDeleteClick = (id: string, name: string, type: 'invoice' | 'proposal' | 'contract') => {
        setItemToDelete({ id, name, type });
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            if (itemToDelete.type === 'invoice') {
                deleteInvoiceTemplate(itemToDelete.id);
            } else if (itemToDelete.type === 'proposal') {
                deleteProposalTemplate(itemToDelete.id);
            } else if (itemToDelete.type === 'contract') {
                deleteContractTemplate(itemToDelete.id);
            }
            addToast(`Plantilla "${itemToDelete.name}" eliminada.`, 'info');
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-semibold text-white flex items-center gap-2">
                <CopyIcon className="w-6 h-6"/> Gestión de Plantillas
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><FileTextIcon /> Plantillas de Factura</h2>
                    </CardHeader>
                    <CardContent>
                        {invoiceTemplates.length > 0 ? (
                            <ul className="space-y-2">
                                {invoiceTemplates.map(template => (
                                    <li key={template.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                                        <span className="text-white font-medium">{template.name}</span>
                                        <Button size="sm" variant="danger" onClick={() => handleDeleteClick(template.id, template.name, 'invoice')}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <EmptyState icon={FileTextIcon} title="Sin plantillas" message="Guarda una factura como plantilla para reutilizarla."/>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><FileSignatureIcon /> Plantillas de Propuesta</h2>
                    </CardHeader>
                    <CardContent>
                        {proposalTemplates.length > 0 ? (
                             <ul className="space-y-2">
                                {proposalTemplates.map(template => (
                                    <li key={template.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                                        <span className="text-white font-medium">{template.name}</span>
                                        <Button size="sm" variant="danger" onClick={() => handleDeleteClick(template.id, template.name, 'proposal')}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <EmptyState icon={FileSignatureIcon} title="Sin plantillas" message="Guarda una propuesta como plantilla para agilizar tu trabajo."/>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <h2 className="text-lg font-semibold text-white flex items-center gap-2"><BookIcon /> Plantillas de Contrato</h2>
                    </CardHeader>
                    <CardContent>
                        {contractTemplates.length > 0 ? (
                             <ul className="space-y-2">
                                {contractTemplates.map(template => (
                                    <li key={template.id} className="flex justify-between items-center p-3 bg-slate-800/50 rounded-lg">
                                        <span className="text-white font-medium">{template.name}</span>
                                        <Button size="sm" variant="danger" onClick={() => handleDeleteClick(template.id, template.name, 'contract')}>
                                            <TrashIcon className="w-4 h-4" />
                                        </Button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <EmptyState icon={BookIcon} title="Sin plantillas" message="Guarda un contrato como plantilla para formalizar acuerdos rápidamente."/>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            <Suspense fallback={null}>
                {isConfirmModalOpen && itemToDelete && (
                    <ConfirmationModal 
                        isOpen={isConfirmModalOpen}
                        onClose={() => setIsConfirmModalOpen(false)}
                        onConfirm={confirmDelete}
                        title={`¿Eliminar Plantilla?`}
                        message={`¿Estás seguro de que quieres eliminar la plantilla "${itemToDelete.name}"? Esta acción no se puede deshacer.`}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default TemplatesPage;