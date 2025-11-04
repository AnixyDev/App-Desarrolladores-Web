import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppStore } from '../../hooks/useAppStore.tsx';
import Card, { CardHeader, CardContent, CardFooter } from '../../components/ui/Card.tsx';
import { formatCurrency } from '../../lib/utils.ts';
import Button from '../../components/ui/Button.tsx';
import { generateInvoicePdf } from '../../services/pdfService.ts';
import { DownloadIcon, RefreshCwIcon } from '../../components/icons/Icon.tsx';

const PortalInvoiceViewPage: React.FC = () => {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const { invoices, getClientById, profile } = useAppStore();
    const [isDownloading, setIsDownloading] = useState(false);

    const invoice = invoices.find(i => i.id === invoiceId);

    if (!invoice) {
        return <div className="text-center text-red-500">Factura no encontrada.</div>;
    }
    
    const client = getClientById(invoice.client_id);

    const handleDownload = async () => {
        setIsDownloading(true);
        if (client && profile) {
            await generateInvoicePdf(invoice, client, profile);
        }
        setIsDownloading(false);
    };

    return (
        <Card className="max-w-4xl mx-auto">
            <CardHeader className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                <div>
                    <h2 className="text-2xl font-bold text-white">Factura {invoice.invoice_number}</h2>
                    <p className="text-gray-400">Fecha de emisión: {invoice.issue_date}</p>
                </div>
                <Button onClick={handleDownload} disabled={isDownloading}>
                    {isDownloading ? <RefreshCwIcon className='w-4 h-4 mr-2 animate-spin'/> : <DownloadIcon className='w-4 h-4 mr-2'/>}
                    {isDownloading ? 'Generando...' : 'Descargar PDF'}
                </Button>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
                    <div>
                        <h4 className="font-semibold text-gray-300 mb-2">De:</h4>
                        <p className="text-white">{profile.business_name}</p>
                        <p className="text-gray-400">{profile.full_name}</p>
                        <p className="text-gray-400">{profile.email}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-300 mb-2">Para:</h4>
                        <p className="text-white">{client?.name}</p>
                        <p className="text-gray-400">{client?.company}</p>
                        <p className="text-gray-400">{client?.email}</p>
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
                        <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(invoice.subtotal_cents)}</span></div>
                        <div className="flex justify-between"><span>IVA ({invoice.tax_percent}%):</span><span>{formatCurrency(invoice.total_cents - invoice.subtotal_cents)}</span></div>
                        <div className="flex justify-between font-bold text-white text-lg border-t border-gray-700 pt-2 mt-2"><span>TOTAL:</span><span>{formatCurrency(invoice.total_cents)}</span></div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className='text-center'>
                 <span className={`px-3 py-1 rounded-full text-sm ${invoice.paid ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {invoice.paid ? `Pagada el ${invoice.payment_date}` : `Pendiente - Vence el ${invoice.due_date}`}
                </span>
            </CardFooter>
        </Card>
    );
};

export default PortalInvoiceViewPage;