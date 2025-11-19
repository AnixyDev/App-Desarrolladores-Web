
import type { Invoice, Client, Profile, Project } from '../types';

const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
};

export const generateInvoicePdf = async (invoice: Invoice, client: Client, profile: Profile) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    
    // --- Header ---
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(profile.business_name, 14, 22);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(profile.full_name, 14, 30);
    doc.text(profile.tax_id, 14, 35);
    doc.text(profile.email, 14, 40);

    // --- Invoice Info ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`FACTURA`, 200, 22, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Nº: ${invoice.invoice_number}`, 200, 30, { align: 'right' });
    doc.text(`Fecha: ${invoice.issue_date}`, 200, 35, { align: 'right' });
    doc.text(`Vencimiento: ${invoice.due_date}`, 200, 40, { align: 'right' });

    // --- Client Info ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Facturar a:', 14, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(client.name, 14, 65);
    doc.text(client.company || '', 14, 70);
    doc.text(client.email, 14, 75);

    // --- Table ---
    const tableColumn = ["Descripción", "Cantidad", "Precio Unitario", "Total"];
    const tableRows = invoice.items.map(item => [
        item.description,
        item.quantity,
        formatCurrency(item.price_cents),
        formatCurrency(item.price_cents * item.quantity),
    ]);

    autoTable(doc, {
        startY: 90,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: profile.pdf_color || '#d9009f' }, // Use Pro color
    });

    // --- Totals ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const labelX = 170;
    const valueX = 200;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text('Subtotal:', labelX, finalY, { align: 'right' });
    doc.text(formatCurrency(invoice.subtotal_cents), valueX, finalY, { align: 'right' });

    doc.text(`IVA (${invoice.tax_percent}%):`, labelX, finalY + 7, { align: 'right' });
    doc.text(formatCurrency(invoice.total_cents - invoice.subtotal_cents), valueX, finalY + 7, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL:', labelX, finalY + 14, { align: 'right' });
    doc.text(formatCurrency(invoice.total_cents), valueX, finalY + 14, { align: 'right' });
    
    // --- Footer ---
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Gracias por su confianza.', 14, 280);
    
    doc.save(`Factura-${invoice.invoice_number}.pdf`);
};

export const generateProjectBudgetPdf = async (project: Project, client: Client, profile: Profile) => {
    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();
    
    // --- Header ---
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(profile.business_name, 14, 22);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(profile.full_name, 14, 30);
    doc.text(profile.tax_id, 14, 35);
    doc.text(profile.email, 14, 40);

    // --- Document Info ---
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`PRESUPUESTO`, 200, 22, { align: 'right' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 200, 30, { align: 'right' });
    doc.text(`Ref: ${project.name.substring(0, 20)}`, 200, 35, { align: 'right' });

    // --- Client Info ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Para:', 14, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(client.name, 14, 65);
    doc.text(client.company || '', 14, 70);
    doc.text(client.email, 14, 75);

    // --- Table ---
    const tableColumn = ["Descripción", "Importe"];
    const tableRows = [
        [
            `Presupuesto estimado para proyecto: ${project.name}\n${project.description ? project.description.substring(0, 100) + (project.description.length > 100 ? '...' : '') : ''}`,
            formatCurrency(project.budget_cents)
        ]
    ];

    autoTable(doc, {
        startY: 90,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: profile.pdf_color || '#d9009f' },
    });

    // --- Totals ---
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    const labelX = 160;
    const valueX = 195;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', labelX, finalY, { align: 'right' });
    doc.text(formatCurrency(project.budget_cents), valueX, finalY, { align: 'right' });
    
    // --- Footer ---
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Este documento es un presupuesto informativo y no constituye una factura final.', 14, 280);
    
    doc.save(`Presupuesto-${project.name.replace(/\s+/g, '_')}.pdf`);
};
