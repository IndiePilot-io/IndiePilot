// src/components/Dashboard/IncomeTracker.tsx
import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../context/AuthContext';
import { 
  TrendingUp, 
  Plus, 
  X, 
  DollarSign, 
  Calendar,
  Tag
} from 'lucide-react';

interface IncomeEntry {
  id?: string;
  amount: number;
  description: string;
  date: string;
  category: 'service' | 'product' | 'consulting' | 'other';
  createdAt?: Timestamp;
}

const IncomeTracker: React.FC = () => {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<IncomeEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalIncome, setTotalIncome] = useState(0);
  
  // Form state
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<IncomeEntry['category']>('service');

  // Debug logging
  console.log('IncomeTracker rendered, showForm:', showForm);

  // Load income entries
  useEffect(() => {
    if (!currentUser) return;

    console.log('Setting up Firestore listener for user:', currentUser.uid);

    const q = query(
      collection(db, `users/${currentUser.uid}/incomeEntries`),
      orderBy('date', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        console.log('Firestore snapshot received, docs count:', snapshot.size);
        const incomeData: IncomeEntry[] = [];
        let total = 0;
        
        snapshot.forEach((doc) => {
          const data = doc.data() as IncomeEntry;
          incomeData.push({
            id: doc.id,
            ...data
          });
          total += data.amount || 0;
        });
        
        setEntries(incomeData);
        setTotalIncome(total);
      },
      (error) => {
        console.error('Firestore error:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleToggleForm = () => {
    console.log('Toggle form clicked, current state:', showForm);
    setShowForm(!showForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted');
    
    if (!currentUser) {
      console.error('No current user');
      return;
    }

    setLoading(true);
    try {
      const docData = {
        amount: parseFloat(amount),
        description,
        date,
        category,
        createdAt: serverTimestamp()
      };
      
      console.log('Adding document:', docData);
      
      const docRef = await addDoc(
        collection(db, `users/${currentUser.uid}/incomeEntries`), 
        docData
      );
      
      console.log('Document added with ID:', docRef.id);

      // Reset form
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('service');
      setShowForm(false);
    } catch (error) {
      console.error('Error adding income entry:', error);
      alert('Failed to add income entry: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'service': return 'bg-blue-100 text-blue-800';
      case 'product': return 'bg-green-100 text-green-800';
      case 'consulting': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            <h2 className="text-lg font-semibold">Income Tracker</h2>
          </div>
          <button
            onClick={handleToggleForm}
            type="button"
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
                Add Entry
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <div className="p-6 border-b bg-gray-50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Project payment, product sale, etc."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IncomeEntry['category'])}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                >
                  <option value="service">Service</option>
                  <option value="product">Product</option>
                  <option value="consulting">Consulting</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Income'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Total Income Display */}
      <div className="p-6 border-b bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Total Income</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(totalIncome)}</p>
          </div>
          <DollarSign className="w-10 h-10 text-green-500 opacity-50" />
        </div>
      </div>

      {/* Income Entries List */}
      <div className="p-6">
        {entries.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No income entries yet. Click "Add Entry" to start tracking.
          </p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium">{entry.description}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(entry.category)}`}>
                      {entry.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{entry.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{formatCurrency(entry.amount)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeTracker;