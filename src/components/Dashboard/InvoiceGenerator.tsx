// src/components/Dashboard/InvoiceGenerator.tsx
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Download,
  X,
  User,
  Mail,
  DollarSign
} from 'lucide-react';
import { generateInvoicePDF } from './pdf';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface CompanyProfile {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  brandColor?: string;
  defaultNotes?: string;
  defaultTerms?: string;
  taxPercent?: number;
  invoicePrefix?: string;
}

const InvoiceGenerator: React.FC = () => {
  const { currentUser } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  // Invoice form state
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: '', quantity: 1, rate: 0, amount: 0 }
  ]);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');

  // Load company profile
  useEffect(() => {
    loadCompanyProfile();
  }, [currentUser]);

  const loadCompanyProfile = async () => {
    if (!currentUser) return;
    
    setProfileLoading(true);
    try {
      const profileDoc = await getDoc(
        doc(db, `users/${currentUser.uid}/profile`, 'companyProfile')
      );
      
      if (profileDoc.exists()) {
        const profile = profileDoc.data() as CompanyProfile;
        setCompanyProfile(profile);
        setNotes(profile.defaultNotes || '');
        setTerms(profile.defaultTerms || 'Payment due within 30 days');
      } else {
        console.log('No company profile found. Please set up your company profile in Settings.');
      }
    } catch (error) {
      console.error('Error loading company profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const getNextInvoiceNumber = async (): Promise<string> => {
    if (!currentUser) throw new Error('No user logged in');
    
    const counterRef = doc(db, `users/${currentUser.uid}/meta`, 'counters');
    
    try {
      // Get current counter
      const counterDoc = await getDoc(counterRef);
      let invoiceNumber = 1;
      
      if (counterDoc.exists()) {
        invoiceNumber = counterDoc.data().invoiceCounter || 1;
        // Increment counter for next time
        await updateDoc(counterRef, {
          invoiceCounter: increment(1)
        });
      } else {
        // Create counter document if it doesn't exist
        await updateDoc(counterRef, {
          invoiceCounter: 2
        });
      }
      
      const prefix = companyProfile?.invoicePrefix || 'INV';
      return `${prefix}-${String(invoiceNumber).padStart(5, '0')}`;
    } catch (error) {
      console.error('Error getting invoice number:', error);
      // Fallback to timestamp-based number
      return `INV-${Date.now()}`;
    }
  };

  const handleAddItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      rate: 0,
      amount: 0
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleItemChange = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Calculate amount
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate;
        }
        return updated;
      }
      return item;
    }));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const taxRate = companyProfile?.taxPercent || 0;
    const tax = subtotal * (taxRate / 100);
    const total = subtotal + tax;
    
    return { subtotal, tax, total, taxRate };
  };

  const handleGenerateInvoice = async () => {
    if (!currentUser) {
      alert('Please log in to generate invoices');
      return;
    }

    if (!companyProfile) {
      alert('Please set up your company profile in Settings first');
      return;
    }

    if (!clientName || !clientEmail) {
      alert('Please fill in client information');
      return;
    }

    const validItems = items.filter(item => item.description && item.amount > 0);
    if (validItems.length === 0) {
      alert('Please add at least one item to the invoice');
      return;
    }

    setLoading(true);
    try {
      // Get invoice number
      const invoiceNumber = await getNextInvoiceNumber();
      const { subtotal, tax, total, taxRate } = calculateTotals();

      // Prepare invoice data
      const invoiceData = {
        invoiceNumber,
        clientName,
        clientEmail,
        clientAddress,
        issueDate,
        dueDate,
        items: validItems,
        subtotal,
        tax,
        taxRate,
        total,
        notes,
        terms,
        status: 'draft', // Start as draft, not pending
        createdAt: serverTimestamp(),
        companyProfile
      };

      // Save to Firestore
      const docRef = await addDoc(
        collection(db, `users/${currentUser.uid}/invoices`),
        invoiceData
      );

      console.log('Invoice saved with ID:', docRef.id);

      // Generate PDF
      generateInvoicePDF({
        invoiceNumber,
        company: companyProfile,
        clientName,
        clientEmail,
        clientAddress,
        issueDate,
        dueDate,
        items: validItems,
        subtotal,
        tax,
        taxRate,
        total,
        notes,
        terms
      });

      // Reset form
      setClientName('');
      setClientEmail('');
      setClientAddress('');
      setItems([{ id: '1', description: '', quantity: 1, rate: 0, amount: 0 }]);
      setShowForm(false);
      
      alert(`Invoice ${invoiceNumber} generated successfully! Check the Invoice Management section below to send it to your client.`);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const { subtotal, tax, total, taxRate } = calculateTotals();

  if (profileLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">Loading company profile...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold">Invoice Generator</h2>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors"
          >
            {showForm ? (
              <>
                <X className="w-4 h-4 mr-1" />
                Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-1" />
                New Invoice
              </>
            )}
          </button>
        </div>
      </div>

      {!companyProfile && (
        <div className="p-6 bg-yellow-50 border-t border-yellow-200">
          <p className="text-yellow-800">
            ⚠️ Please set up your company profile in Settings before creating invoices.
          </p>
        </div>
      )}

      {showForm && companyProfile && (
        <div className="p-6 space-y-6">
          {/* Client Information */}
          <div>
            <h3 className="font-medium mb-3">Client Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Client or Company Name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="client@example.com"
                    required
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Address
                </label>
                <textarea
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="123 Client Street, City, State 12345"
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Invoice Details */}
          <div>
            <h3 className="font-medium mb-3">Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Issue Date
                </label>
                <input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Line Items</h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Item
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={item.id} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="w-20 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                  <input
                    type="number"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={(e) => handleItemChange(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                  <div className="w-24 px-3 py-2 border border-gray-200 rounded bg-gray-50 text-right">
                    ${item.amount.toFixed(2)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="p-2 text-red-600 hover:text-red-700"
                    disabled={items.length === 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-4">
            <div className="space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-medium">${subtotal.toFixed(2)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between">
                  <span>Tax ({taxRate}%):</span>
                  <span className="font-medium">${tax.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes and Terms */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Terms & Conditions
              </label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Payment terms..."
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerateInvoice}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? (
                'Generating...'
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Generate Invoice
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {!showForm && (
        <div className="p-6">
          <p className="text-gray-500 text-center">
            Create professional invoices for your clients. Invoices will be saved as drafts and can be emailed from the Invoice Management section.
          </p>
        </div>
      )}
    </div>
  );
};

export default InvoiceGenerator;