// src/components/Dashboard/InvoiceList.tsx
import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  CheckCircle,
  Clock,
  Send,
  DollarSign,
  Eye,
  Download,
  Mail,
  Edit
} from 'lucide-react';
import { generateInvoicePDF } from './pdf';
import { emailService } from '../../services/emailService';

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  total: number;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'pending';
  issueDate: string;
  dueDate: string;
  items: any[];
  companyProfile: any;
  createdAt: any;
  paidAt?: any;
  sentAt?: any;
  viewedAt?: any;
  notes?: string;
  terms?: string;
  subtotal: number;
  tax: number;
  taxRate: number;
  paymentLink?: string;
}

interface EmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSend: (subject: string, message: string) => Promise<void>;
}

const EmailModal: React.FC<EmailModalProps> = ({ isOpen, onClose, invoice, onSend }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (invoice) {
      setSubject(`Invoice ${invoice.invoiceNumber} from ${invoice.companyProfile.companyName}`);
      setMessage(`Dear ${invoice.clientName},

Thank you for your business. Please find attached your invoice ${invoice.invoiceNumber}.

Amount Due: $${invoice.total.toFixed(2)}
Due Date: ${invoice.dueDate}

You can pay this invoice online using the secure payment link included in this email.

If you have any questions about this invoice, please don't hesitate to contact us.

Best regards,
${invoice.companyProfile.companyName}`);
    }
  }, [invoice]);

  const handleSend = async () => {
    setSending(true);
    try {
      await onSend(subject, message);
      onClose();
    } finally {
      setSending(false);
    }
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Send Invoice Email</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
          <input
            type="text"
            value={`${invoice.clientName} <${invoice.clientEmail}>`}
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-50"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded">
          <p className="text-sm text-blue-800">
            <strong>Attachments:</strong> {invoice.invoiceNumber}.pdf<br />
            <strong>Payment Link:</strong> Will be included in the email
          </p>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

const InvoiceList: React.FC = () => {
  const { currentUser } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, `users/${currentUser.uid}/invoices`),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invoiceData: Invoice[] = [];
      snapshot.forEach((doc) => {
        invoiceData.push({
          id: doc.id,
          ...doc.data()
        } as Invoice);
      });
      setInvoices(invoiceData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const updateInvoiceStatus = async (invoiceId: string, newStatus: Invoice['status']) => {
    if (!currentUser) return;

    try {
      const updates: any = {
        status: newStatus,
        updatedAt: serverTimestamp()
      };

      // Add timestamp for specific status changes
      if (newStatus === 'sent') {
        updates.sentAt = serverTimestamp();
      } else if (newStatus === 'viewed') {
        updates.viewedAt = serverTimestamp();
      } else if (newStatus === 'paid') {
        updates.paidAt = serverTimestamp();

        // Find the invoice to sync to income tracker
        const invoice = invoices.find(inv => inv.id === invoiceId);
        if (invoice) {
          // Add to income tracker
          await addDoc(
            collection(db, `users/${currentUser.uid}/incomeEntries`),
            {
              amount: invoice.total,
              description: `Invoice ${invoice.invoiceNumber} - ${invoice.clientName}`,
              date: new Date().toISOString().split('T')[0],
              category: 'service',
              invoice_reference: invoice.invoiceNumber,
              createdAt: serverTimestamp()
            }
          );

          alert(`Invoice marked as paid and added to Income Tracker!`);
        }
      }

      await updateDoc(
        doc(db, `users/${currentUser.uid}/invoices`, invoiceId),
        updates
      );

    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Failed to update invoice status');
    }
  };

  const regeneratePDF = (invoice: Invoice) => {
    generateInvoicePDF({
      invoiceNumber: invoice.invoiceNumber,
      company: invoice.companyProfile,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      clientAddress: invoice.clientAddress || '',
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      items: invoice.items,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      taxRate: invoice.taxRate,
      total: invoice.total,
      notes: invoice.notes || '',
      terms: invoice.terms || ''
    });
  };

  const handleSendEmail = async (invoice: Invoice, subject: string, message: string) => {
    try {
      // Generate payment link and send email
      const result = await emailService.sendInvoiceEmail({
        invoiceNumber: invoice.invoiceNumber,
        clientEmail: invoice.clientEmail,
        clientName: invoice.clientName,
        companyName: invoice.companyProfile.companyName,
        total: invoice.total,
        dueDate: invoice.dueDate,
        invoiceId: invoice.id,
        invoiceData: invoice,
        customSubject: subject,
        customMessage: message
      });

      if (result.success) {
        // Update invoice with payment link and status
        await updateDoc(
          doc(db, `users/${currentUser.uid}/invoices`, invoice.id),
          {
            status: 'sent',
            sentAt: serverTimestamp(),
            paymentLink: result.paymentLink,
            updatedAt: serverTimestamp()
          }
        );

        alert(`Invoice sent to ${invoice.clientEmail}!\n\nPayment link: ${result.paymentLink}`);
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      alert('Failed to send invoice email');
    }
  };

  const openEmailModal = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setEmailModalOpen(true);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            <Clock className="w-3 h-3 mr-1" />
            Draft
          </span>
        );
      case 'sent':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Send className="w-3 h-3 mr-1" />
            Sent
          </span>
        );
      case 'viewed':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Eye className="w-3 h-3 mr-1" />
            Viewed
          </span>
        );
      case 'paid':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Paid
          </span>
        );
      default:
        return null;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    if (filter === 'all') return true;
    if (filter === 'pending') return invoice.status !== 'paid';
    if (filter === 'paid') return invoice.status === 'paid';
    return true;
  });

  const totalPending = invoices
    .filter(inv => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalPaid = invoices
    .filter(inv => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);

  if (loading) {
    return <div className="text-center py-4">Loading invoices...</div>;
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Invoice Management
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded text-sm ${filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                All ({invoices.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 py-1 rounded text-sm ${filter === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Pending
              </button>
              <button
                onClick={() => setFilter('paid')}
                className={`px-3 py-1 rounded text-sm ${filter === 'paid'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                Paid
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="bg-yellow-50 p-3 rounded">
              <p className="text-sm text-yellow-800">Pending</p>
              <p className="text-xl font-semibold text-yellow-900">
                ${totalPending.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded">
              <p className="text-sm text-green-800">Paid</p>
              <p className="text-xl font-semibold text-green-900">
                ${totalPaid.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredInvoices.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No invoices found. Create your first invoice above.
            </p>
          ) : (
            <div className="space-y-3">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="font-medium">{invoice.invoiceNumber}</h3>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {invoice.clientName} • {invoice.clientEmail}
                      </p>
                      <p className="text-sm text-gray-500">
                        Issued: {invoice.issueDate} • Due: {invoice.dueDate}
                      </p>
                      {invoice.paymentLink && (
                        <p className="text-xs text-blue-600 mt-1">
                          Payment link: {invoice.paymentLink}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-semibold">${invoice.total.toFixed(2)}</p>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => regeneratePDF(invoice)}
                          className="p-1 text-gray-600 hover:text-gray-800"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>

                        {(invoice.status === 'draft' || invoice.status === 'pending') && (
                          <button
                            onClick={() => openEmailModal(invoice)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Send Email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                        )}

                        {invoice.status === 'sent' && (
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'viewed')}
                            className="p-1 text-yellow-600 hover:text-yellow-800"
                            title="Mark as Viewed"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        {invoice.status !== 'paid' && (
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                            className="p-1 text-green-600 hover:text-green-800"
                            title="Mark as Paid"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <EmailModal
        isOpen={emailModalOpen}
        onClose={() => {
          setEmailModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
        onSend={(subject, message) => handleSendEmail(selectedInvoice!, subject, message)}
      />
    </>
  );
};

export default InvoiceList;