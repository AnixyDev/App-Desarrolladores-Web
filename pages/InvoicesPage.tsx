import React, { useState, useMemo, lazy, Suspense, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '../hooks/useAppStore';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { Invoice, RecurringInvoice } from '../types';
import { formatCurrency } from '../lib/utils';
import { generateInvoicePdf } from '../services/pdfService';
import { DownloadIcon, TrashIcon, CheckCircleIcon, ClockIcon, RefreshCwIcon, SendIcon, RepeatIcon, LinkIcon, FilterIcon, FileTextIcon } from '../components/icons/Icon';
import StatusChip from '../components/ui/StatusChip';
import { useToast } from '../hooks/useToast';
import EmptyState from '../components/ui/EmptyState';

const UpgradePromptModal = lazy(() => import('../components/modals/UpgradePromptModal'));
const InvoiceFromTimeModal = lazy(() => import('../components/modals/InvoiceFromTimeModal'));
const ConfirmationModal = lazy(() => import('../components/modals/ConfirmationModal'));


const InvoicesPage: React.FC = () => {
    const { 
        invoices,
        recurringInvoices,
        profile, 
        deleteInvoice,
        deleteRecurringInvoice,
        markInvoiceAsPaid,
        getClientById,
        checkAndGenerateRecurringInvoices,
    } = useAppStore();
    const navigate = useNavigate();
    const { addToast } = useToast();

    const [activeTab, setActiveTab] = useState<'single' | 'recurring'>('single');
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [isTimeInvoiceModalOpen, setIsTimeInvoiceModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string, type: 'single' | 'recurring', number?: string } | null>(null);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    
    // Filtros
    const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending'>('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    useEffect(() => {
        checkAndGenerateRecurringInvoices();
    }, []); // Run once on component mount

    const monthlyInvoiceCount = useMemo(() => {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        return invoices.filter(i => {
            const issueDate = new Date(i.created_at);
            return issueDate.getMonth() === currentMonth && issueDate.getFullYear() === currentYear;
        }).length;
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(invoice => {
            if (filterStatus === 'paid' && !invoice.paid) return false;
            if (filterStatus === 'pending' && invoice.paid) return false;
            
            const issueDate = new Date(invoice.issue_date);
            if (startDate && issueDate < new Date(startDate)) return false;
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (issueDate > end) return false;
            }
            return true;
        });
    }, [invoices, filterStatus, startDate, endDate]);

    const filteredRecurringInvoices = useMemo(() => {
        return recurringInvoices.filter(recInvoice => {
            const nextDueDate = new Date(recInvoice.next_due_date);
            if (startDate && nextDueDate < new Date(startDate)) return false;
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                if (nextDueDate > end) return false;
            }
            return true;
        });
    }, [recurringInvoices, startDate, endDate]);

    const resetFilters = () => {
        setFilterStatus('all');
        setStartDate('');
        setEndDate('');
    };

    const handleOpenAdd = () => {
        if (profile.plan === 'Free' && monthlyInvoiceCount >= 3) {
            setIsUpgradeModalOpen(true);
        } else {
            navigate('/invoices/create');
        }
    };

    const handleDownloadPdf = async (invoice: Invoice) => {
        setIsDownloading(invoice.id);
        const client = getClientById(invoice.client_id);
        if (client) {
            await generateInvoicePdf(invoice, client, profile);
        }
        setIsDownloading(null);
    };
    
    const handleGenerateFromTime = (clientId: string, projectId: string, timeEntryIds: string[]) => {
        setIsTimeInvoiceModalOpen(false);
        navigate('/invoices/create', { state: { clientId, projectId, timeEntryIds } });
    };

    const handleDeleteClick = (item: Invoice | RecurringInvoice, type: 'single' | 'recurring') => {
        setItemToDelete({ id: item.id, type, number: (item as Invoice).invoice_number });
        setIsConfirmModalOpen(true);
    };

    const confirmDelete = () => {
        if (itemToDelete) {
            if (itemToDelete.type === 'single') {
                deleteInvoice(itemToDelete.id);
                addToast('Factura eliminada.', 'info');
            } else {
                deleteRecurringInvoice(itemToDelete.id);
                addToast('Factura recurrente eliminada.', 'info');
            }
            setIsConfirmModalOpen(false);
            setItemToDelete(null);
        }
    };
    
    const handleSendReminder = (invoice: Invoice) => {
        const client = getClientById(invoice.client_id);
        if (client) {
            addToast(`Recordatorio de pago simulado para ${client.name}.`, 'success');
        }
    };
    
    const handleCopyPaymentLink = (invoiceId: string) => {
        const portalLink = `${window.location.origin}${window.location.pathname}#/portal/invoice/${invoiceId}`;
        navigator.clipboard.writeText(portalLink);
        addToast('Enlace de pago copiado al portapapeles', 'success');
    };

    const FilterButton: React.FC<{ status: 'all' | 'paid' | 'pending'; label: string; }> = ({ status, label }) => (
        <button
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${filterStatus === status ? 'bg-primary-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
        >
            {label}
        </button>
    );

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

            <Card className="mb-6">
                 <CardHeader>
                    <h2 className="text-lg font-semibold text-white flex items-center gap-2"><FilterIcon className="w-5 h-5"/> Filtros</h2>
                </CardHeader>
                <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-1 w-full">
                        <p className="text-sm font-medium text-gray-300 mb-2">Estado (Facturas Emitidas)</p>
                        <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
                            <FilterButton status="all" label="Todas" />
                            <FilterButton status="paid" label="Pagadas" />
                            <FilterButton status="pending" label="Pendientes" />
                        </div>
                    </div>
                    <div className="flex-1 w-full">
                         <p className="text-sm font-medium text-gray-300 mb-2">Rango de Fechas</p>
                         <div className="flex gap-2 items-center">
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white" />
                            <span className="text-gray-400">-</span>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white" />
                         </div>
                    </div>
                     <div className="pt-5">
                        <Button variant="secondary" onClick={resetFilters}>Limpiar</Button>
                    </div>
                </CardContent>
            </Card>


            <div className="mb-6 border-b border-gray-700">
                <nav className="-mb-px flex space-x-6">
                    <button onClick={() => setActiveTab('single')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'single' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                        Facturas Emitidas
                    </button>
                    <button onClick={() => setActiveTab('recurring')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'recurring' ? 'border-primary-500 text-primary-400' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'}`}>
                        Facturas Recurrentes
                    </button>
                </nav>
            </div>

            {activeTab === 'single' && (
                <Card>
                    <CardContent className="p-0">
                        {filteredInvoices.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[800px]">
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
                                        {filteredInvoices.map(invoice => (
                                            <tr key={invoice.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                                <td className="p-4 font-mono text-white">{invoice.invoice_number}</td>
                                                <td className="p-4 text-primary-400"><Link to={`/clients/${invoice.client_id}`} className="hover:underline">{getClientById(invoice.client_id)?.name}</Link></td>
                                                <td className="p-4 text-gray-300">{invoice.issue_date}</td>
                                                <td className="p-4 text-white font-semibold">{formatCurrency(invoice.total_cents)}</td>
                                                <td className="p-4"><StatusChip type="invoice" status={invoice.paid ? 'paid' : 'pending'} dueDate={invoice.due_date} /></td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        {!invoice.paid && <Button size="sm" variant="secondary" title="Copiar enlace de pago" onClick={() => handleCopyPaymentLink(invoice.id)}><LinkIcon className="w-4 h-4 text-purple-400"/></Button>}
                                                        {!invoice.paid && profile.payment_reminders_enabled && <Button size="sm" variant="secondary" title="Enviar Recordatorio" onClick={() => handleSendReminder(invoice)}><SendIcon className="w-4 h-4 text-blue-400"/></Button>}
                                                        {!invoice.paid && <Button size="sm" variant="secondary" title="Marcar como pagada" aria-label={`Marcar como pagada la factura ${invoice.invoice_number}`} onClick={() => { markInvoiceAsPaid(invoice.id); addToast(`Factura #${invoice.invoice_number} marcada como pagada.`, 'success');}}><CheckCircleIcon className="w-4 h-4 text-green-400"/></Button>}
                                                        <Button size="sm" variant="secondary" title="Descargar PDF" aria-label={`Descargar PDF de la factura ${invoice.invoice_number}`} onClick={() => handleDownloadPdf(invoice)} disabled={isDownloading === invoice.id}>
                                                            {isDownloading === invoice.id ? <RefreshCwIcon className="w-4 h-4 animate-spin" /> : <DownloadIcon className="w-4 h-4" />}
                                                        </Button>
                                                        <Button size="sm" variant="danger" title="Eliminar" aria-label={`Eliminar factura ${invoice.invoice_number}`} onClick={() => handleDeleteClick(invoice, 'single')}><TrashIcon className="w-4 h-4" /></Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="p-8">
                                <EmptyState
                                    icon={FileTextIcon}
                                    title="No se encontraron facturas"
                                    message="Prueba a ajustar los filtros o crea una nueva factura."
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {activeTab === 'recurring' && (
                <Card>
                    <CardContent className="p-0">
                         {filteredRecurringInvoices.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[600px]">
                                    <thead className="border-b border-gray-800">
                                        <tr>
                                            <th className="p-4">Cliente</th>
                                            <th className="p-4">Importe</th>
                                            <th className="p-4">Frecuencia</th>
                                            <th className="p-4">Próxima Emisión</th>
                                            <th className="p-4 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRecurringInvoices.map(recInvoice => {
                                            const amount = recInvoice.items.reduce((sum, item) => sum + (item.price_cents * item.quantity), 0) * (1 + recInvoice.tax_percent / 100);
                                            return (
                                                <tr key={recInvoice.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                                                    <td className="p-4 text-primary-400"><Link to={`/clients/${recInvoice.client_id}`} className="hover:underline">{getClientById(recInvoice.client_id)?.name}</Link></td>
                                                    <td className="p-4 text-white font-semibold">{formatCurrency(amount)}</td>
                                                    <td className="p-4 text-gray-300 capitalize flex items-center gap-2"><RepeatIcon className="w-4 h-4"/>{recInvoice.frequency === 'monthly' ? 'Mensual' : 'Anual'}</td>
                                                    <td className="p-4 text-gray-300">{recInvoice.next_due_date}</td>
                                                    <td className="p-4 text-right">
                                                        <Button size="sm" variant="danger" title="Eliminar" aria-label={`Eliminar factura recurrente`} onClick={() => handleDeleteClick(recInvoice, 'recurring')}><TrashIcon className="w-4 h-4" /></Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                         ) : (
                            <div className="p-8">
                                <EmptyState
                                    icon={RepeatIcon}
                                    title="No se encontraron facturas recurrentes"
                                    message="Prueba a ajustar los filtros o crea una nueva plantilla recurrente."
                                />
                            </div>
                         )}
                    </CardContent>
                </Card>
            )}

            <Suspense fallback={null}>
                {isUpgradeModalOpen && (
                    <UpgradePromptModal 
                        isOpen={isUpgradeModalOpen} 
                        onClose={() => setIsUpgradeModalOpen(false)}
                        featureName="facturas este mes"
                    />
                )}
                {isTimeInvoiceModalOpen && (
                    <InvoiceFromTimeModal
                        isOpen={isTimeInvoiceModalOpen}
                        onClose={() => setIsTimeInvoiceModalOpen(false)}
                        onGenerate={handleGenerateFromTime}
                    />
                )}
                {isConfirmModalOpen && (
                    <ConfirmationModal 
                        isOpen={isConfirmModalOpen}
                        onClose={() => setIsConfirmModalOpen(false)}
                        onConfirm={confirmDelete}
                        title={itemToDelete?.type === 'single' ? `¿Eliminar Factura?` : `¿Eliminar Factura Recurrente?`}
                        message={itemToDelete?.type === 'single' ? `¿Estás seguro de que quieres eliminar la factura #${itemToDelete?.number}?` : `¿Estás seguro de que quieres eliminar esta plantilla de factura recurrente? No se generarán más facturas a partir de ella.`}
                    />
                )}
            </Suspense>
        </div>
    );
};

export default InvoicesPage;