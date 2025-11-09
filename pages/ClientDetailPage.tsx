
// pages/ClientDetailPage.tsx
import React, { useState, lazy, Suspense, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import Card, { CardContent, CardHeader } from '../components/ui/Card';
import { useAppStore } from '../hooks/useAppStore';
import { formatCurrency } from '../lib/utils';
import { BriefcaseIcon, FileTextIcon, EditIcon, TrashIcon, PhoneIcon, MailIcon, DollarSignIcon, UserIcon, Building, CreditCard, CheckCircleIcon, RefreshCwIcon } from '../components/icons/Icon';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Client, NewClient, Invoice } from '../types';
import StatusChip from '../components/ui/StatusChip';
import EmptyState from '../components/ui/EmptyState';
import Input from '../components/ui/Input';
import { useToast } from '../hooks/useToast';
import { redirectToCustomerPortal } from '../services/stripeService';


const ClientIncomeChart = lazy(() => import('../components/charts/ClientIncomeChart'));
const ConfirmationModal = lazy(() => import('../components/modals/ConfirmationModal'));

const ClientDetailPage: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const navigate = useNavigate();
    const { addToast } = useToast();
    const { getClientById, projects, invoices, updateClient, deleteClient, setClientPaymentMethodStatus } = useAppStore();

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [invoiceTab, setInvoiceTab] = useState<'pending' | 'paid'>('pending');
    const [isPortalLoading, setIsPortalLoading] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    
    const client = clientId ? getClientById(clientId) : undefined;
    const [formData, setFormData] = useState<Client | NewClient | null>(client || null);
    
    useEffect(() => {
        if (searchParams.get('stripe_portal_return') === 'true' && client) {
            setClientPaymentMethodStatus(client.id, true);
            addToast('Método de pago guardado con éxito a través de Stripe.', 'success');
            searchParams.delete('stripe_portal_return');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, client, setClientPaymentMethodStatus, addToast, setSearchParams]);


    const clientProjects = projects.filter(p => p.client_id === clientId);
    const clientInvoices = invoices.filter(i => i.client_id === clientId);
    
    const financialSummary = useMemo(() => {
        const paidInvoices = clientInvoices.filter(i => i.paid);
        const pendingInvoices = clientInvoices.filter(i => !i.paid);
        
        const totalBilled = paidInvoices.reduce((sum, i) => sum + i.total_cents, 0);
        const totalPending = pendingInvoices.reduce((sum, i) => sum + i.total_cents, 0);

        return { paidInvoices, pendingInvoices, totalBilled, totalPending };
    }, [clientInvoices]);

    if (!client) {
        return <div className="text-center text-red-500">Cliente no encontrado.</div>;
    }
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => prev ? ({ ...prev, [name]: value }) : null);
    };

    const openEditModal = () => {
        setFormData(client);
        setIsEditModalOpen(true);
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData && 'id' in formData && formData.name && formData.email) {
            updateClient(formData as Client);
            addToast('Cliente actualizado con éxito', 'success');
            setIsEditModalOpen(false);
        }
    };
    
    const handleDelete = () => {
        deleteClient(client.id);
        addToast(`Cliente "${client.name}" eliminado`, 'info');
        navigate('/clients');
    };

    const handleManagePaymentMethods = async () => {
        setIsPortalLoading(true);
        try {
            await redirectToCustomerPortal({
                email: client.email,
                name: client.name,
                id: client.id
            });
        } catch (error) {
            addToast((error as Error).message, 'error');
            setIsPortalLoading(false);
        }
    };

    const InvoiceList: React.FC<{invoices: Invoice[]}> = ({ invoices }) => (
        <ul className="divide-y divide-gray-800">
            {invoices.map(invoice => (
                <li key={invoice.id} className="p-3 sm:p-4">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                            <p className="font-semibold text-white font-mono">{invoice.invoice_number}</p>
                            <p className="text-sm text-gray-400">
                                {invoice.paid ? `Pagada el: ${invoice.payment_date}` : `Vence el: ${invoice.due_date}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="font-semibold text-white">{formatCurrency(invoice.total_cents)}</p>
                            <StatusChip type="invoice" status={invoice.paid ? 'paid' : 'pending'} dueDate={invoice.due_date} />
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">{client.name}</h1>
                    <p className="text-lg text-gray-400">Panel de Cliente</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={openEditModal} size="md" variant="secondary" title="Editar"><EditIcon className="w-5 h-5" /></Button>
                    <Button onClick={() => setIsDeleteModalOpen(true)} size="md" variant="secondary" className="text-red-400 hover:bg-red-500/20 hover:text-red-300" title="Eliminar"><TrashIcon className="w-5 h-5" /></Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Columna Izquierda */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader><h2 className="text-lg font-semibold text-white flex items-center gap-2"><BriefcaseIcon className="w-5 h-5"/> Proyectos</h2></CardHeader>
                        <CardContent className="p-0">
                             {clientProjects.length > 0 ? (
                                <ul className="divide-y divide-gray-800">
                                    {clientProjects.map(p => (
                                        <li key={p.id} className="p-4 hover:bg-gray-800/50">
                                            <Link to={`/projects/${p.id}`} className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold text-white">{p.name}</p>
                                                    <p className="text-sm text-gray-400">Vence: {p.due_date}</p>
                                                </div>
                                                <StatusChip type="project" status={p.status} />
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : <div className="p-4"><EmptyState icon={BriefcaseIcon} title="Sin Proyectos" message="No hay proyectos asociados a este cliente." /></div>}
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardHeader className="p-0">
                            <div className="flex border-b border-gray-800">
                                <button onClick={() => setInvoiceTab('pending')} className={`flex-1 p-4 text-sm font-semibold ${invoiceTab === 'pending' ? 'text-primary-400 border-b-2 border-primary-500' : 'text-gray-400'}`}>
                                    Pendientes ({financialSummary.pendingInvoices.length})
                                </button>
                                <button onClick={() => setInvoiceTab('paid')} className={`flex-1 p-4 text-sm font-semibold ${invoiceTab === 'paid' ? 'text-primary-400 border-b-2 border-primary-500' : 'text-gray-400'}`}>
                                    Historial de Pagos ({financialSummary.paidInvoices.length})
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {invoiceTab === 'pending' ? (
                                financialSummary.pendingInvoices.length > 0 ? <InvoiceList invoices={financialSummary.pendingInvoices} /> : <div className="p-4"><EmptyState icon={FileTextIcon} title="Todo al día" message="No hay facturas pendientes de pago." /></div>
                            ) : (
                                financialSummary.paidInvoices.length > 0 ? <InvoiceList invoices={financialSummary.paidInvoices} /> : <div className="p-4"><EmptyState icon={FileTextIcon} title="Sin Pagos" message="Aún no se han registrado pagos para este cliente." /></div>
                            )}
                        </CardContent>
                    </Card>
                </div>
                
                {/* Columna Derecha */}
                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader><h2 className="text-lg font-semibold">Detalles de Contacto</h2></CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center gap-3">
                                <UserIcon className="w-5 h-5 text-gray-500 shrink-0" />
                                <div>
                                    <p className="text-gray-400">Nombre</p>
                                    <p className="text-white font-medium">{client.name}</p>
                                </div>
                            </div>
                            {client.company && (
                                <div className="flex items-center gap-3">
                                    <Building className="w-5 h-5 text-gray-500 shrink-0" />
                                    <div>
                                        <p className="text-gray-400">Empresa</p>
                                        <p className="text-white font-medium">{client.company}</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <MailIcon className="w-5 h-5 text-gray-500 shrink-0" />
                                <div>
                                    <p className="text-gray-400">Email</p>
                                    <a href={`mailto:${client.email}`} className="text-white hover:underline truncate">{client.email}</a>
                                </div>
                            </div>
                            {client.phone && (
                                <div className="flex items-center gap-3">
                                    <PhoneIcon className="w-5 h-5 text-gray-500 shrink-0" />
                                    <div>
                                        <p className="text-gray-400">Teléfono</p>
                                        <a href={`tel:${client.phone}`} className="text-white hover:underline">{client.phone}</a>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><h2 className="text-lg font-semibold flex items-center gap-2"><DollarSignIcon/> Resumen Financiero</h2></CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-400">Ingresos Totales (Pagado)</p>
                                <p className="text-2xl font-bold text-green-400">{formatCurrency(financialSummary.totalBilled)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Pendiente de Cobro</p>
                                <p className="text-2xl font-bold text-yellow-400">{formatCurrency(financialSummary.totalPending)}</p>
                            </div>
                             <div className="pt-4 border-t border-gray-800">
                                <p className="text-sm text-gray-400 flex items-center gap-2 mb-2"><CreditCard/> Método de pago</p>
                                {client.payment_method_on_file && (
                                    <p className="text-sm text-green-400 flex items-center gap-2 mb-2"><CheckCircleIcon/> Método de pago guardado en Stripe</p>
                                )}
                                <Button onClick={handleManagePaymentMethods} disabled={isPortalLoading} className="w-full">
                                    {isPortalLoading ? <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" /> : null}
                                    Gestionar Métodos de Pago
                                </Button>
                                <p className="text-xs text-gray-500 mt-2">El cliente será redirigido a un portal seguro de Stripe para gestionar sus tarjetas.</p>
                            </div>
                            <Suspense fallback={<div className="h-[200px] flex items-center justify-center text-gray-400">Cargando gráfico...</div>}>
                                <ClientIncomeChart invoices={clientInvoices} />
                            </Suspense>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Cliente">
                {formData && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input name="name" label="Nombre Completo" value={formData.name} onChange={handleInputChange} required />
                    <Input name="company" label="Empresa (Opcional)" value={formData.company} onChange={handleInputChange} />
                    <Input name="email" label="Email" type="email" value={formData.email} onChange={handleInputChange} required />
                    <Input name="phone" label="Teléfono (Opcional)" value={formData.phone} onChange={handleInputChange} />
                    <div className="flex justify-end pt-4">
                        <Button type="submit">Guardar Cambios</Button>
                    </div>
                </form>
                )}
            </Modal>
            
            <Suspense fallback={null}>
                <ConfirmationModal 
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDelete}
                    title="¿Eliminar Cliente?"
                    message={`¿Estás seguro? Se eliminarán permanentemente todos los datos asociados a "${client.name}", incluyendo proyectos y facturas. Esta acción no se puede deshacer.`}
                />
            </Suspense>
        </div>
    );
};

export default ClientDetailPage;
