// src/pages/PaymentPage.tsx
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CreditCard, CheckCircle, AlertCircle, FileText, Calendar, DollarSign } from 'lucide-react';

interface InvoiceDetails {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  total: number;
  status: string;
  dueDate: string;
  issueDate: string;
  companyProfile: {
    companyName: string;
    brandColor?: string;
    email?: string;
    phone?: string;
  };
}

const PaymentPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  const invoiceId = searchParams.get('invoice');
  const amount = searchParams.get('amount');

  useEffect(() => {
    loadInvoice();
  }, [invoiceId]);

  const loadInvoice = async () => {
    if (!invoiceId) {
      setError('Invalid payment link');
      setLoading(false);
      return;
    }

    try {
      // In production, fetch from a public API endpoint
      // For demo, we'll use mock data
      setLoading(false);
      
      setInvoice({
        id: invoiceId,
        invoiceNumber: 'INV-00001',
        clientName: 'Client Name',
        clientEmail: 'client@example.com',
        total: parseFloat(amount || '0'),
        status: 'sent',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        issueDate: new Date().toISOString().split('T')[0],
        companyProfile: {
          companyName: 'Your Company',
          brandColor: '#667eea',
          email: 'contact@company.com',
          phone: '(555) 123-4567'
        }
      });
    } catch (err) {
      setError('Failed to load invoice details');
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!invoice) return;

    // Basic validation
    if (!cardNumber || !cardName || !expiryDate || !cvv) {
      alert('Please fill in all payment fields');
      return;
    }

    setProcessing(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production:
      // 1. Tokenize card with Stripe
      // 2. Process payment
      // 3. Update invoice status via webhook
      
      setPaymentComplete(true);
    } catch (err) {
      setError('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (paymentComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for your payment. A receipt has been sent to your email.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-600">Invoice Number</p>
            <p className="font-semibold">{invoice?.invoiceNumber}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Amount Paid</p>
            <p className="text-2xl font-bold text-green-600">
              ${invoice?.total.toFixed(2)}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Transaction ID: TXN-{Date.now()}
          </p>
        </div>
      </div>
    );
  }

  const brandColor = invoice?.companyProfile.brandColor || '#667eea';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Company Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: brandColor }}>
            {invoice?.companyProfile.companyName}
          </h1>
          <p className="text-gray-600 mt-2">Secure Payment Portal</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="md:flex">
            {/* Invoice Details Side */}
            <div className="md:w-2/5 p-8" style={{ background: `linear-gradient(135deg, ${brandColor}22 0%, ${brandColor}11 100%)` }}>
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Invoice Details
              </h2>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Invoice Number</p>
                  <p className="font-semibold text-lg">{invoice?.invoiceNumber}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Bill To</p>
                  <p className="font-semibold">{invoice?.clientName}</p>
                  <p className="text-sm text-gray-600">{invoice?.clientEmail}</p>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Due: {invoice?.dueDate}</span>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">Amount Due</p>
                  <p className="text-3xl font-bold" style={{ color: brandColor }}>
                    ${invoice?.total.toFixed(2)}
                  </p>
                </div>

                <div className="pt-4">
                  <p className="text-xs text-gray-500">
                    Questions? Contact us:<br/>
                    {invoice?.companyProfile.email}<br/>
                    {invoice?.companyProfile.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Form Side */}
            <div className="md:w-3/5 p-8">
              <h2 className="text-xl font-semibold mb-6 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Information
              </h2>

              {/* Test Mode Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Test Mode:</strong> Use card number 4242 4242 4242 4242 with any future date and any CVC.
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handlePayment(); }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cardholder Name
                    </label>
                    <input
                      type="text"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      placeholder="John Doe"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                        placeholder="MM/YY"
                        maxLength={5}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CVV
                      </label>
                      <input
                        type="text"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={processing}
                  className={`w-full mt-6 py-3 px-4 rounded-lg font-semibold text-white transition-all ${
                    processing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'hover:shadow-lg transform hover:-translate-y-0.5'
                  }`}
                  style={{ background: processing ? '#9ca3af' : `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)` }}
                >
                  {processing ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Pay ${invoice?.total.toFixed(2)}
                    </span>
                  )}
                </button>
              </form>

              <div className="mt-6 flex items-center justify-center space-x-4">
                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6 opacity-50" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/41/Visa_Logo.png" alt="Visa" className="h-6 opacity-50" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Mastercard_2019_logo.svg" alt="Mastercard" className="h-6 opacity-50" />
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                Your payment information is encrypted and secure. We never store your card details.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-600">
          Powered by IndiePilot • Secure Payment Processing
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;