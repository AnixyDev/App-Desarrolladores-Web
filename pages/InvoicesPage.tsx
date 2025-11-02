import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../hooks/useAppStore.tsx';
import Card, { CardContent, CardHeader } from '../components/ui/Card.tsx';
import Button from '../components/ui/Button.tsx';
import { Invoice } from '../types.ts';
import { formatCurrency } from '../lib/utils.ts';
import { generateInvoicePdf } from '../services/pdfService.ts';
import { DownloadIcon, TrashIcon, CheckCircleIcon, ClockIcon } from '../components/icons/Icon.tsx';
import StatusChip from '../components/ui/StatusChip.tsx';
import UpgradePromptModal from '../components/modals/UpgradePromptModal.tsx';
import InvoiceFromTimeModal from '../components/modals/InvoiceFromTimeModal.tsx';
import ConfirmationModal from '../components/modals/ConfirmationModal.tsx';


const InvoicesPage: React.FC = () => {
    const { 
        invoices, 
        profile, 
        deleteInvoice,
        markInvoiceAsPaid,
        getClientById 
    } = useAppStore();
    const navigate = useNavigate();

    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isTimeInvoiceModalOpen, setIsTimeInvoiceModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);

    const monthlyInvoiceCount = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        return invoices.filter(i => {
            const issueDate = new Date(i.created_at);
            return issueDate.getMonth() === currentMonth && issueDate.getFullYear() === currentYear;
        }).length;
    }, [invoices]);

    const handleOpenAdd = () => {
        if (profile.plan === 'Free' && monthlyInvoiceCount >= 3) {
            setIsUpgradeModalOpen(true);
        } else {
            navigate('/invoices/create');
        }
    };

    const handleDownloadPdf = (invoice: Invoice) => {
        const client = getClientById(invoice.client_id);
        if (client) {
            generateInvoicePdf(invoice, client, profile);
        }
    };
    
    const handleGenerateFromTime = (clientId: string, projectId: string, timeEntryIds: string[]) => {
        setIsTimeInvoiceModalOpen(false);
        navigate('/invoices/create', { state: { clientId, projectId, timeEntryIds } });
    };

    const handleDeleteClick = (invoice: Invoice) => {
        setInvoiceToDelete(invoice);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = () => {
        if (invoiceToDelete) {
            deleteInvoice(invoiceToDelete.id);
            setIsConfirmModalOpen(false);
            setInvoiceToDelete(null);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-semibold text-white">Facturas</h1>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setIsTimeInvoiceModalOpen(true)}>
                        <ClockIcon className="w-4 h-4 mr-2" />Facturar Horas
                    </Button>
                    <Button onClick={handleOpenAdd}>Crear Factura</Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <h2 className="text-lg font-semibold text-white">Listado de Facturas</h2>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="hidden md:block">
                        <table className="w-full text-left">
                            <thead className="border-b border-gray-800">
                                <tr>
                                    <th className="p-4">Nº Factura</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4">Fecha Emisión</th>
                                    <th className="p-4">Total</th>
                                    <th className="p-4">Estado</th>
                                    <th className="p-4">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map(invoice => (
                                    <tr key={invoice.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                        <td className="p-4 font-mono text-white">{invoice.invoice_number}</td>
                                        <td className="p-4 text-primary-400"><Link to={`/clients/${invoice.client_id}`}>{getClientById(invoice.client_id)?.name}</Link></td>
                                        <td className="p-4 text-gray-300">{invoice.issue_date}</td>
                                        <td className="p-4 text-white font-semibold">{formatCurrency(invoice.total_cents)}</td>
                                        <td className="p-4"><StatusChip type="invoice" status={invoice.paid ? 'paid' : 'pending'} dueDate={invoice.due_date} /></td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {!invoice.paid && <Button size="sm" variant="secondary" title="Marcar como pagada" aria-label={`Marcar como pagada la factura ${invoice.invoice_number}`} onClick={() => markInvoiceAsPaid(invoice.id)}><CheckCircleIcon className="w-4 h-4 text-green-400"/></Button>}
                                                <Button size="sm" variant="secondary" title="Descargar PDF" aria-label={`Descargar PDF de la factura ${invoice.invoice_number}`} onClick={() => handleDownloadPdf(invoice)}><DownloadIcon className="w-4 h-4" /></Button>
                                                <Button size="sm" variant="danger" title="Eliminar" aria-label={`Eliminar factura ${invoice.invoice_number}`} onClick={() => handleDeleteClick(invoice)}><TrashIcon className="w-4 h-4" /></Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <UpgradePromptModal 
                isOpen={isUpgradeModalOpen} 
                onClose={() => setIsUpgradeModalOpen(false)}
                featureName="facturas este mes"
            />
            
            <InvoiceFromTimeModal
                isOpen={isTimeInvoiceModalOpen}
                onClose={() => setIsTimeInvoiceModalOpen(false)}
                onGenerate={handleGenerateFromTime}
            />
            
            <ConfirmationModal 
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDelete}
                title="¿Eliminar Factura?"
                message={`¿Estás seguro de que quieres eliminar la factura #${invoiceToDelete?.invoice_number}? Esta acción no se puede deshacer.`}
            />
        </div>
    );
};

export default InvoicesPage;
