// src/pages/Dashboard.tsx
import React, { useState, useEffect } from 'react';
import IncomeTracker from '../components/Dashboard/IncomeTracker';
import InvoiceGenerator from '../components/Dashboard/InvoiceGenerator';
import InvoiceList from '../components/Dashboard/InvoiceList';
import { useAuth } from '../context/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
// Import other components as they're created
// import ContractGenerator from '../components/Dashboard/ContractGenerator';
// import AIAssistant from '../components/Dashboard/AIAssistant';

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [totalIncome, setTotalIncome] = useState(0);
  const [invoiceCount, setInvoiceCount] = useState(0);
  const [contractCount, setContractCount] = useState(0);

  // Fetch dashboard statistics
  useEffect(() => {
    if (!currentUser) return;

    // Fetch total income
    const incomeQuery = query(
      collection(db, `users/${currentUser.uid}/incomeEntries`)
    );
    
    const unsubscribeIncome = onSnapshot(incomeQuery, (snapshot) => {
      let total = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        total += data.entry_amount || data.amount || 0;
      });
      setTotalIncome(total);
    });

    // Fetch invoice count
    const invoiceQuery = query(
      collection(db, `users/${currentUser.uid}/invoices`)
    );
    
    const unsubscribeInvoices = onSnapshot(invoiceQuery, (snapshot) => {
      setInvoiceCount(snapshot.size);
    });

    // Fetch contract count (when implemented)
    // const contractQuery = query(
    //   collection(db, `users/${currentUser.uid}/contracts`)
    // );
    
    // const unsubscribeContracts = onSnapshot(contractQuery, (snapshot) => {
    //   setContractCount(snapshot.size);
    // });

    return () => {
      unsubscribeIncome();
      unsubscribeInvoices();
      // unsubscribeContracts();
    };
  }, [currentUser]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Income</p>
                <p className="text-2xl font-bold">${totalIncome.toFixed(2)}</p>
              </div>
              <div className="text-green-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Invoices</p>
                <p className="text-2xl font-bold">{invoiceCount}</p>
              </div>
              <div className="text-blue-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Contracts</p>
                <p className="text-2xl font-bold">{contractCount}</p>
              </div>
              <div className="text-purple-500">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main Dashboard Widgets */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Tracker */}
          <div className="lg:col-span-1">
            <IncomeTracker />
          </div>
          
          {/* Invoice Generator */}
          <div className="lg:col-span-1">
            <InvoiceGenerator />
          </div>
          
          {/* Invoice Management - Full Width */}
          <div className="lg:col-span-2">
            <InvoiceList />
          </div>
          
          {/* Contract Generator - Placeholder */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h2 className="text-lg font-semibold">Contract Generator</h2>
              </div>
              <p className="text-gray-500 text-center py-8">
                Contract Generator coming soon...
              </p>
            </div>
          </div>
          
          {/* AI Assistant - Placeholder */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <svg className="w-5 h-5 text-indigo-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <h2 className="text-lg font-semibold">AI Assistant</h2>
              </div>
              <p className="text-gray-500 text-center py-8">
                AI Assistant coming soon...
              </p>
            </div>
          </div>
        </div>

        {/* Quick Tips Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Quick Tips</h3>
          <ul className="list-disc list-inside text-blue-800 space-y-1">
            <li>Create invoices and they'll appear in Invoice Management as drafts</li>
            <li>Click the mail icon to send invoices with customizable email messages</li>
            <li>Invoices are automatically added to Income Tracker when marked as paid</li>
            <li>Your company profile (Settings) is required before creating invoices</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;