// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
// Check if the component exists at this path
// If not, we'll need to create it or adjust the path
import { 
  FileText, 
  FileSignature, 
  Brain, 
  LogOut,
  Settings,
  DollarSign,
  Users,
  BarChart3,
  Plus,
  TrendingUp
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [stats, setStats] = useState({
    totalIncome: 0,
    invoiceCount: 0,
    contractCount: 0,
    clientCount: 0
  });

  // Load stats
  useEffect(() => {
    if (!currentUser) return;

    // Listen to income entries for total
    const incomeQuery = query(collection(db, `users/${currentUser.uid}/incomeEntries`));
    const unsubscribeIncome = onSnapshot(incomeQuery, (snapshot) => {
      let total = 0;
      snapshot.forEach((doc) => {
        total += doc.data().amount || 0;
      });
      setStats(prev => ({ ...prev, totalIncome: total }));
    });

    return () => {
      unsubscribeIncome();
    };
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">IndiePilot</h1>
              <span className="ml-4 text-sm text-gray-500">
                Welcome, {currentUser?.email}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center text-gray-600 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span className="ml-2 hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats.totalIncome)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.invoiceCount}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contracts</p>
                <p className="text-2xl font-bold text-gray-900">{stats.contractCount}</p>
              </div>
              <FileSignature className="w-8 h-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Clients</p>
                <p className="text-2xl font-bold text-gray-900">{stats.clientCount}</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </div>
        </div>

        {/* Main Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Tracker Widget - Inline for now */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
                  <h2 className="text-lg font-semibold">Income Tracker</h2>
                </div>
                <button className="flex items-center text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Entry
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-4">
                <p className="text-3xl font-bold text-green-600 mb-2">
                  {formatCurrency(stats.totalIncome)}
                </p>
                <p className="text-gray-500">
                  Total income tracked
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Click "Add Entry" to start tracking your income
                </p>
              </div>
            </div>
          </div>

          {/* Invoice Generator Widget */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold">Invoice Generator</h2>
                </div>
                <button className="flex items-center text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4 mr-1" />
                  New Invoice
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-center py-8">
                Create professional invoices for your clients.
              </p>
            </div>
          </div>

          {/* Contract Generator Widget */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileSignature className="w-5 h-5 text-purple-600 mr-2" />
                  <h2 className="text-lg font-semibold">Contract Generator</h2>
                </div>
                <button className="flex items-center text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors">
                  <Plus className="w-4 h-4 mr-1" />
                  New Contract
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-center py-8">
                Generate service agreements and contracts.
              </p>
            </div>
          </div>

          {/* AI Assistant Widget */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Brain className="w-5 h-5 text-indigo-600 mr-2" />
                  <h2 className="text-lg font-semibold">AI Assistant</h2>
                </div>
                <button className="flex items-center text-sm bg-indigo-600 text-white px-3 py-1.5 rounded hover:bg-indigo-700 transition-colors">
                  Ask Question
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-center py-8">
                Ask business questions and get AI-powered answers.
              </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <div className="flex items-center">
              <BarChart3 className="w-5 h-5 text-gray-600 mr-2" />
              <h2 className="text-lg font-semibold">Recent Activity</h2>
            </div>
          </div>
          <div className="p-6">
            <p className="text-gray-500 text-center py-4">
              Your recent activities will appear here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;