

import React, { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../../hooks/useAppStore';
import Card, { CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { formatCurrency } from '../../lib/utils';
import Button from '../../components/ui/Button';
import { CreditCard, DownloadIcon } from '../../components/icons/Icon';
import { generateInvoicePdf } from '../../services/pdfService';
import { useToast } from '../../hooks/useToast';
import { redirectToCheckout } from '../../services/stripeService';

const CommentThread = lazy(() => import('../../components/portal/CommentThread'));
const FileList = lazy(() => import('../../components/portal/FileList'));

const PortalInvoiceViewPage: React.FC = () => {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const { invoices, getClientById, profile } = useAppStore();
    const { addToast } = useToast();

    const invoice = invoices.find(i => i.id === invoiceId);

    if (!invoice) {
        return <div className="text-center text-red-500">Factura no encontrada.</div>;
    }
    
    const client = getClientById(invoice.client_id);
    const subtotal = invoice.items.reduce((sum, item) => sum + item.price_cents * item.quantity, 0);
    const taxAmount = invoice.total_cents - subtotal;
    
    const handleDownloadPdf = async () => {
        if (client && profile) {
            await generateInvoicePdf(invoice, client, profile);
            addToast('Descargando PDF...', 'success');
        } else {
            addToast('Error al generar PDF.', 'error');
        }
    };

    const handlePayment = async () => {
        if (client) {
            try {
                // FIX: Call redirectToCheckout with the correct arguments for an invoice payment.
                await redirectToCheckout('invoice_payment', {
                    invoiceId: invoice.id,
                    amount_cents: invoice.total_cents,
                    description: `#${invoice.invoice_number}`,
                });
            } catch (error) {
                addToast((error as Error).message, 'error');
            }
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <Card>
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white font-mono">FACTURA #{invoice.invoice_number}</h2>
                        <p className="text-gray-400">Fecha de emisión: {invoice.issue_date}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm capitalize ${
                        invoice.paid ? 'bg-green-500/20 text-green-400' :
                        new Date(invoice.due_date) < new Date() ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                    }`}>
                        {invoice.paid ? 'Pagada' : new Date(invoice.due_date) < new Date() ? 'Vencida' : 'Pendiente'}
                    </span>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-2">De:</h4>
                            <p className="text-white">{profile.business_name}</p>
                            <p className="text-gray-400">{profile.full_name}</p>
                            <p className="text-gray-400">{profile.tax_id}</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-300 mb-2">Para:</h4>
                            <p className="text-white">{client?.name}</p>
                            <p className="text-gray-400">{client?.company}</p>
                        </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[500px] text-left mb-8">
                            <thead className='border-b border-gray-700'>
                                <tr>
                                    <th className='p-2 font-semibold'>Descripción</th>
                                    <th className='p-2 font-semibold text-center'>Cantidad</th>
                                    <th className='p-2 font-semibold text-right'>Precio Unit.</th>
                                    <th className='p-2 font-semibold text-right'>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item, index) => (
                                    <tr key={index} className='border-b border-gray-800'>
                                        <td className='p-2'>{item.description}</td>
                                        <td className='p-2 text-center'>{item.quantity}</td>
                                        <td className='p-2 text-right'>{formatCurrency(item.price_cents)}</td>
                                        <td className='p-2 text-right'>{formatCurrency(item.price_cents * item.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-end">
                        <div className="w-full max-w-xs space-y-2 text-right">
                            <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(subtotal)}</span></div>
                            <div className="flex justify-between"><span>IVA ({invoice.tax_percent}%):</span><span>{formatCurrency(taxAmount)}</span></div>
                            <div className="flex justify-between font-bold text-white text-lg border-t border-gray-700 pt-2 mt-2">
                                <span>TOTAL:</span>
                                <span>{formatCurrency(invoice.total_cents)}</span>
                            </div>
                        </div>
                    </div>

                </CardContent>
                <CardFooter className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <Button variant="secondary" onClick={handleDownloadPdf}><DownloadIcon className="w-4 h-4 mr-2"/>Descargar PDF</Button>
                    {!invoice.paid && (
                        <Button onClick={handlePayment}>
                            <CreditCard className="w-4 h-4 mr-2"/> Pagar con Tarjeta
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-white">Comentarios y Archivos</h3>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Suspense fallback={<div>Cargando...</div>}>
                        {client && <CommentThread entityId={invoice.id} currentUser={{ name: client.name, avatar: '' }} />}
                        {client && <FileList entityId={invoice.id} currentUser={{ name: client.name }} />}
                    </Suspense>
                </CardContent>
            </Card>
        </div>
    );
};

export default PortalInvoiceViewPage;