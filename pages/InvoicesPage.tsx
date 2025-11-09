
import React, { useState, lazy, Suspense } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Invoice, RecurringInvoice } from '../types';
import { formatCurrency } from '../lib/utils';
import { FileTextIcon, PlusIcon, TrashIcon, DownloadIcon, ClockIcon, RepeatIcon } from '../components/icons/Icon';
import StatusChip from '../components/ui/StatusChip';
import EmptyState from '../components/ui/EmptyState';
import { useToast } from '../hooks/useToast';
import { generateInvoicePdf } from '../services/pdfService';

const ConfirmationModal = lazy(() => import('../components/modals/ConfirmationModal'));
const InvoiceFromTimeModal = lazy(() => import('../components/modals/InvoiceFromTimeModal'));


const InvoicesPage: React.FC = () => {
    const { 
        invoices, 
        recurringInvoices, 
        getClientById, 
        deleteInvoice,
        deleteRecurringInvoice,
        markInvoiceAsPaid,
        profile
    } = useAppStore();
    const { addToast } = useToast();
    const navigate = useNavigate();

    const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
    const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

    const filteredInvoices = invoices.filter(invoice => {
        if (filter === 'all') return true;
        if (filter === 'paid') return invoice.paid;
        if (filter === 'pending') return !invoice.paid;
        return true;
    });

    const handleDelete = (invoice: Invoice) => {
        setInvoiceToDelete(invoice);
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = () => {
        if (invoiceToDelete) {
            deleteInvoice(invoiceToDelete.id);
            addToast(`Factura #${invoiceToDelete.invoice_number} eliminada`, 'info');
            setIsConfirmModalOpen(false);
            setInvoiceToDelete(null);
        }
    };
    
    const handleDownloadPdf = async (invoice: Invoice) => {
        const client = getClientById(invoice.client_id);
        if (client && profile) {
            await generateInvoicePdf(invoice, client, profile);
            addToast(`Descargando PDF para #${invoice.invoice_number}`, 'success');
        } else {
            addToast('No se pudieron cargar los datos para generar el PDF.', 'error');
        }
    };

    const handleGenerateFromTime = (clientId: string, projectId: string, timeEntryIds: string[]) => {
        setIsTimeModalOpen(false);
        navigate('/invoices/create', { state: { clientId, projectId, timeEntryIds } });
    };

    const InvoiceRow: React.FC<{invoice: Invoice}> = ({ invoice }) => (
        <tr className="border-b border-gray-800 hover:bg-gray-800/50">
            <td className="p-4 font-semibold text-white font-mono">{invoice.invoice_number}</td>
            <td className="p-4 text-primary-400"><Link to={`/clients/${invoice.client_id}`}>{getClientById(invoice.client_id)?.name}</Link></td>
            <td className="p-4 text-gray-300">{invoice.issue_date}</td>
            <td className="p-4 text-gray-300">{invoice.due_date}</td>
            <td className="p-4 text-white font-semibold">{formatCurrency(invoice.total_cents)}</td>
            <td className="p-4"><StatusChip type="invoice" status={invoice.paid ? 'paid' : 'pending'} dueDate={invoice.due_date}/></td>
            <td className="p-4 text-right">
                <div className="flex gap-2 justify-end">
                    {!invoice.paid && <Button size="sm" variant="secondary" onClick={() => markInvoiceAsPaid(invoice.id)}>Marcar Pagada</Button>}
                    <Button size="sm" variant="secondary" onClick={() => handleDownloadPdf(invoice)} title="Descargar PDF"><DownloadIcon className="w-4 h-4"/></Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(invoice)} title="Eliminar"><TrashIcon className="w-4 h-4"/></Button>
                </div>
            </td>
        </tr>
    );
    
    const RecurringInvoiceRow: React.FC<{recInvoice: RecurringInvoice}> = ({ recInvoice }) => (
         <tr className="border-b border-gray-800 hover:bg-gray-800/50">
            <td className="p-4 text-primary-400"><Link to={`/clients/${recInvoice.client_id}`}>{getClientById(recInvoice.client_id)?.name}</Link></td>
            <td className="p-4 text-gray-300 capitalize">{recInvoice.frequency}</td>
            <td className="p-4 text-gray-300">{recInvoice.next_due_date}</td>
            <td className="p-4 text-white font-semibold">{formatCurrency(recInvoice.items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0))}</td>
             <td className="p-4 text-right">
                <Button size="sm" variant="danger" onClick={() => deleteRecurringInvoice(recInvoice.id)} title="Eliminar recurrencia"><TrashIcon className="w-4 h-4"/></Button>
            </td>
        </tr>
    );

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <h1 className="text-2xl font-semibold text-white">Facturas</h1>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setIsTimeModalOpen(true)}>
                        <ClockIcon className="w-4 h-4 mr-2"/> Facturar Horas
                    </Button>
                    <Button onClick={() => navigate('/invoices/create')}>
                        <PlusIcon className="w-4 h-4 mr-2"/> Nueva Factura
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-semibold text-white">Listado de Facturas</h2>
                            <div className="flex gap-2">
                                <Button size="sm" variant={filter === 'all' ? 'primary' : 'secondary'} onClick={() => setFilter('all')}>Todas</Button>
                                <Button size="sm" variant={filter === 'pending' ? 'primary' : 'secondary'} onClick={() => setFilter('pending')}>Pendientes</Button>
                                <Button size="sm" variant={filter === 'paid' ? 'primary' : 'secondary'} onClick={() => setFilter('paid')}>Pagadas</Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                         {filteredInvoices.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b border-gray-800">
                                        <tr>
                                            <th className="p-4">Número</th>
                                            <th className="p-4">Cliente</th>
                                            <th className="p-4">Emisión</th>
                                            <th className="p-4">Vencimiento</th>
                                            <th className="p-4">Importe</th>
                                            <th className="p-4">Estado</th>
                                            <th className="p-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredInvoices.map(invoice => <InvoiceRow key={invoice.id} invoice={invoice} />)}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState
                                icon={FileTextIcon}
                                title="No hay facturas"
                                message={filter === 'all' ? "Aún no has creado ninguna factura." : "No hay facturas que coincidan con este filtro."}
                                action={filter === 'all' ? { text: 'Crear Factura', onClick: () => navigate('/invoices/create') } : undefined}
                            />
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><h2 className="text-lg font-semibold text-white flex items-center gap-2"><RepeatIcon/> Facturas Recurrentes</h2></CardHeader>
                    <CardContent className="p-0">
                         {recurringInvoices.length > 0 ? (
                             <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="border-b border-gray-800">
                                        <tr>
                                            <th className="p-4">Cliente</th>
                                            <th className="p-4">Frecuencia</th>
                                            <th className="p-4">Próxima Generación</th>
                                            <th className="p-4">Importe Base</th>
                                            <th className="p-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recurringInvoices.map(rec => <RecurringInvoiceRow key={rec.id} recInvoice={rec} />)}
                                    </tbody>
                                </table>
                            </div>
                         ) : (
                            <div className="p-4 text-center text-sm text-gray-500">No tienes facturas recurrentes configuradas.</div>
                         )}
                    </CardContent>
                </Card>
            </div>
            
            <Suspense fallback={null}>
                {isConfirmModalOpen && (
                    <ConfirmationModal 
                        isOpen={isConfirmModalOpen}
                        onClose={() => setIsConfirmModalOpen(false)}
                        onConfirm={confirmDelete}
                        title="¿Eliminar Factura?"
                        message={`¿Estás seguro? Esta acción eliminará la factura #${invoiceToDelete?.invoice_number} permanentemente.`}
                    />
                )}
                {isTimeModalOpen && (
                    <InvoiceFromTimeModal
                        isOpen={isTimeModalOpen}
                        onClose={() => setIsTimeModalOpen(false)}
                        onGenerate={handleGenerateFromTime}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default InvoicesPage;
