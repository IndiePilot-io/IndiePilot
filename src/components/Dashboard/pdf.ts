import jsPDF from 'jspdf';

interface InvoiceData {
  invoiceNumber: string;
  company: {
    companyName: string;
    email: string;
    phone: string;
    address: string;
    brandColor?: string;
  };
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  issueDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  tax: number;
  taxRate: number;
  total: number;
  notes?: string;
  terms?: string;
}

export function generateInvoicePDF(data: InvoiceData) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  let yPos = margin;

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 37, g: 99, b: 235 }; // Default blue
  };

  const brandColor = hexToRgb(data.company.brandColor || '#2563eb');

  // Header with Invoice Badge
  pdf.setFillColor(brandColor.r, brandColor.g, brandColor.b);
  pdf.rect(pageWidth - 70, yPos, 50, 20, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INVOICE', pageWidth - 45, yPos + 13, { align: 'center' });
  
  // Company Name (Left)
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.company.companyName, margin, yPos + 10);
  
  yPos += 30;

  // Invoice Details (Right aligned)
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Invoice No: ${data.invoiceNumber}`, pageWidth - margin, yPos, { align: 'right' });
  pdf.text(`Issue Date: ${data.issueDate}`, pageWidth - margin, yPos + 5, { align: 'right' });
  pdf.text(`Due Date: ${data.dueDate}`, pageWidth - margin, yPos + 10, { align: 'right' });

  // Company Details (Left)
  pdf.setTextColor(0, 0, 0);
  pdf.text(data.company.address, margin, yPos);
  pdf.text(data.company.email, margin, yPos + 5);
  pdf.text(data.company.phone, margin, yPos + 10);

  yPos += 30;

  // Bill From / Bill To Section
  pdf.setFillColor(245, 247, 250);
  pdf.rect(margin, yPos, (pageWidth - 2 * margin) / 2 - 5, 35, 'F');
  pdf.rect(margin + (pageWidth - 2 * margin) / 2 + 5, yPos, (pageWidth - 2 * margin) / 2 - 5, 35, 'F');

  // Bill From
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('BILL FROM', margin + 5, yPos + 8);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(data.company.companyName, margin + 5, yPos + 15);
  pdf.text(data.company.address, margin + 5, yPos + 20);
  pdf.text(`${data.company.email} | ${data.company.phone}`, margin + 5, yPos + 25);

  // Bill To
  const billToX = margin + (pageWidth - 2 * margin) / 2 + 10;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('BILL TO', billToX, yPos + 8);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(data.clientName, billToX, yPos + 15);
  if (data.clientAddress) {
    pdf.text(data.clientAddress, billToX, yPos + 20);
    pdf.text(data.clientEmail, billToX, yPos + 25);
  } else {
    pdf.text(data.clientEmail, billToX, yPos + 20);
  }

  yPos += 45;

  // Items Table Header
  pdf.setFillColor(brandColor.r, brandColor.g, brandColor.b);
  pdf.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.text('Description', margin + 5, yPos + 7);
  pdf.text('Qty', pageWidth - 80, yPos + 7);
  pdf.text('Rate', pageWidth - 60, yPos + 7);
  pdf.text('Amount', pageWidth - margin - 5, yPos + 7, { align: 'right' });

  yPos += 10;

  // Items
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  data.items.forEach((item, index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
    }
    
    pdf.text(item.description, margin + 5, yPos + 7);
    pdf.text(item.quantity.toString(), pageWidth - 80, yPos + 7);
    pdf.text(`$${item.rate.toFixed(2)}`, pageWidth - 60, yPos + 7);
    pdf.text(`$${item.amount.toFixed(2)}`, pageWidth - margin - 5, yPos + 7, { align: 'right' });
    
    yPos += 10;
  });

  yPos += 5;

  // Totals
  const totalsX = pageWidth - 70;
  
  // Subtotal
  pdf.setFont('helvetica', 'normal');
  pdf.text('Subtotal:', totalsX, yPos);
  pdf.text(`$${data.subtotal.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 7;
  
  // Tax
  if (data.taxRate > 0) {
    pdf.text(`Tax (${data.taxRate}%):`, totalsX, yPos);
    pdf.text(`$${data.tax.toFixed(2)}`, pageWidth - margin, yPos, { align: 'right' });
    yPos += 7;
  }
  
  // Total
  pdf.setDrawColor(brandColor.r, brandColor.g, brandColor.b);
  pdf.setLineWidth(0.5);
  pdf.line(totalsX - 5, yPos - 2, pageWidth - margin, yPos - 2);
  
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('Total:', totalsX, yPos + 5);
  pdf.text(`$${data.total.toFixed(2)}`, pageWidth - margin, yPos + 5, { align: 'right' });

  yPos += 20;

  // Notes & Terms
  if (data.notes || data.terms) {
    if (yPos > pageHeight - 60) {
      pdf.addPage();
      yPos = margin;
    }

    if (data.notes) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Notes', margin, yPos);
      yPos += 5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const noteLines = pdf.splitTextToSize(data.notes, pageWidth - 2 * margin);
      noteLines.forEach((line: string) => {
        pdf.text(line, margin, yPos);
        yPos += 5;
      });
      yPos += 5;
    }

    if (data.terms) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Terms & Conditions', margin, yPos);
      yPos += 5;
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      const termLines = pdf.splitTextToSize(data.terms, pageWidth - 2 * margin);
      termLines.forEach((line: string) => {
        pdf.text(line, margin, yPos);
        yPos += 5;
      });
    }
  }

  // Footer
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(9);
  pdf.text(
    `${data.company.companyName} • Generated with IndiePilot`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save the PDF
  pdf.save(`${data.invoiceNumber}.pdf`);
}

// Contract PDF Generator
interface ContractData {
  contractNumber: string;
  company: {
    companyName: string;
    email: string;
    phone: string;
    address: string;
    brandColor?: string;
  };
  clientName: string;
  clientEmail?: string;
  issueDate: string;
  scopeOfWork: string;
  rateLabel: string;
  terms?: string;
  notes?: string;
}

export function generateContractPDF(data: ContractData) {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  let yPos = margin;

  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 37, g: 99, b: 235 };
  };

  const brandColor = hexToRgb(data.company.brandColor || '#2563eb');

  // Header with Agreement Badge
  pdf.setFillColor(brandColor.r, brandColor.g, brandColor.b);
  pdf.rect(pageWidth - 80, yPos, 60, 20, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AGREEMENT', pageWidth - 50, yPos + 13, { align: 'center' });
  
  // Company Name (Left)
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.company.companyName, margin, yPos + 10);
  
  yPos += 30;

  // Contract Details (Right aligned)
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Contract No: ${data.contractNumber}`, pageWidth - margin, yPos, { align: 'right' });
  pdf.text(`Issue Date: ${data.issueDate}`, pageWidth - margin, yPos + 5, { align: 'right' });

  yPos += 20;

  // Parties Section
  pdf.setFillColor(245, 247, 250);
  pdf.rect(margin, yPos, (pageWidth - 2 * margin) / 2 - 5, 35, 'F');
  pdf.rect(margin + (pageWidth - 2 * margin) / 2 + 5, yPos, (pageWidth - 2 * margin) / 2 - 5, 35, 'F');

  // Company (Left)
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('COMPANY', margin + 5, yPos + 8);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(data.company.companyName, margin + 5, yPos + 15);
  pdf.text(data.company.address, margin + 5, yPos + 20);
  pdf.text(`${data.company.email} | ${data.company.phone}`, margin + 5, yPos + 25);

  // Client (Right)
  const clientX = margin + (pageWidth - 2 * margin) / 2 + 10;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text('CLIENT', clientX, yPos + 8);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(data.clientName, clientX, yPos + 15);
  if (data.clientEmail) {
    pdf.text(data.clientEmail, clientX, yPos + 20);
  }

  yPos += 45;

  // Scope of Work
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('SCOPE OF WORK', margin, yPos);
  yPos += 7;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const scopeLines = pdf.splitTextToSize(data.scopeOfWork, pageWidth - 2 * margin);
  scopeLines.forEach((line: string) => {
    if (yPos > pageHeight - 30) {
      pdf.addPage();
      yPos = margin;
    }
    pdf.text(line, margin, yPos);
    yPos += 5;
  });

  yPos += 10;

  // Compensation
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.text('COMPENSATION', margin, yPos);
  yPos += 7;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.text(data.rateLabel, margin, yPos);
  
  yPos += 15;

  // Terms
  if (data.terms) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('TERMS & CONDITIONS', margin, yPos);
    yPos += 7;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const termLines = pdf.splitTextToSize(data.terms, pageWidth - 2 * margin);
    termLines.forEach((line: string) => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.text(line, margin, yPos);
      yPos += 5;
    });
    
    yPos += 10;
  }

  // Notes
  if (data.notes) {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text('ADDITIONAL NOTES', margin, yPos);
    yPos += 7;
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const noteLines = pdf.splitTextToSize(data.notes, pageWidth - 2 * margin);
    noteLines.forEach((line: string) => {
      if (yPos > pageHeight - 30) {
        pdf.addPage();
        yPos = margin;
      }
      pdf.text(line, margin, yPos);
      yPos += 5;
    });
  }

  // Footer
  pdf.setTextColor(150, 150, 150);
  pdf.setFontSize(9);
  pdf.text(
    `${data.company.companyName} • Generated with IndiePilot`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Save the PDF
  pdf.save(`${data.contractNumber}.pdf`);
}