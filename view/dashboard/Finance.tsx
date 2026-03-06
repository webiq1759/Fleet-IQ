
import React, { useState, Fragment } from 'react';
import { Booking } from '../../types';
import { usePreferences } from '../../contexts/PreferencesContext';
import {
   ArrowUpRight, ArrowDownRight, DollarSign, Search,
   FileText, TrendingUp, TrendingDown, Wallet, ChevronLeft, ChevronRight
} from 'lucide-react';

const FINANCE_PAGE_SIZE = 20;

interface FinanceProps {
   bookings: Booking[];
   expenses?: any[];
}

interface Transaction {
   id: string;
   title: string;
   type: 'Income' | 'Expense';
   category: string;
   date: string;
   vehicle?: string;
   amount: number;
}

export const Finance: React.FC<FinanceProps> = ({ bookings, expenses = [] }) => {
   const { formatPrice } = usePreferences();
   const [filter, setFilter] = useState<'All' | 'Income' | 'Expense'>('All');
   const [searchQuery, setSearchQuery] = useState('');
   const [finPage, setFinPage] = useState(1);

   // Transform completed bookings into Income transactions
   // Note: payment_status is always 'Pending' in our escrow model — use booking status instead
   const bookingTransactions: Transaction[] = bookings
      .filter(b => b.status === 'Completed')
      .map(b => ({
         id: b.id,
         title: `Booking Revenue - ${b.clientName}`,
         type: 'Income',
         category: 'Booking',
         date: b.requestedOn,
         vehicle: b.assetTitle,
         amount: b.totalAmount
      }));

   // Transform manual transactions (fetched from DB) into unified Transaction format
   const expenseTransactions: Transaction[] = expenses.map(e => ({
      id: e.id,
      title: e.description,
      type: (e.type === 'Income' ? 'Income' : 'Expense') as 'Income' | 'Expense',
      category: e.category,
      date: e.date,
      vehicle: e.assetId ? 'Vehicle' : '-',
      amount: Number(e.amount)
   }));

   const sixMonthsAgoFin = new Date();
   sixMonthsAgoFin.setMonth(sixMonthsAgoFin.getMonth() - 6);
   const transactions = [...bookingTransactions, ...expenseTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
   const recentTransactions = transactions.filter(t => new Date(t.date) >= sixMonthsAgoFin);

   const filteredTransactions = recentTransactions.filter(trx => {
      const matchesFilter = filter === 'All' || trx.type === filter;
      const matchesSearch = trx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         trx.vehicle?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesSearch;
   });

   const totalIncome = transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
   const totalExpenses = transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
   const netProfit = totalIncome - totalExpenses;

   const finTotalPages = Math.ceil(filteredTransactions.length / FINANCE_PAGE_SIZE);
   const pagedTransactions = filteredTransactions.slice((finPage - 1) * FINANCE_PAGE_SIZE, finPage * FINANCE_PAGE_SIZE);

   // Reset page when filter/search changes
   React.useEffect(() => { setFinPage(1); }, [filter, searchQuery]);

   return (
      <div className="space-y-8 animate-in fade-in duration-300 pb-40 md:pb-8">

         {/* Header Section */}


         {/* Cards Section */}
         <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 md:grid md:grid-cols-3 md:gap-6 pb-4 md:pb-0 pr-4 md:pr-0 no-scrollbar">

            {/* Total Income Card */}
            <div className="snap-start shrink-0 w-[80vw] sm:w-[300px] md:w-auto">
               <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group h-full">
                  <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                           <ArrowUpRight className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Income</span>
                     </div>
                     <div className="flex items-baseline gap-3">
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white truncate">{formatPrice(totalIncome)}</h3>
                     </div>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                     <TrendingUp className="w-32 h-32 text-green-500" />
                  </div>
               </div>
            </div>

            {/* Total Expenses Card */}
            <div className="snap-start shrink-0 w-[80vw] sm:w-[300px] md:w-auto">
               <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group h-full">
                  <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                           <ArrowDownRight className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Expenses</span>
                     </div>
                     <div className="flex items-baseline gap-3">
                        <h3 className="text-3xl font-extrabold text-slate-900 dark:text-white truncate">{formatPrice(totalExpenses)}</h3>
                     </div>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                     <TrendingDown className="w-32 h-32 text-red-500" />
                  </div>
               </div>
            </div>

            {/* Net Profit Card */}
            <div className="snap-start shrink-0 w-[80vw] sm:w-[300px] md:w-auto">
               <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group h-full">
                  <div className="relative z-10">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                           <DollarSign className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Net Profit</span>
                     </div>
                     <div className="flex items-baseline gap-3">
                        <h3 className="text-3xl font-extrabold text-green-600 dark:text-green-400 truncate">{formatPrice(netProfit)}</h3>
                     </div>
                  </div>
                  <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                     <Wallet className="w-32 h-32 text-slate-500" />
                  </div>
               </div>
            </div>

         </div>

         {/* Transaction History Section */}
         <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <h2 className="text-lg font-bold text-slate-900 dark:text-white">Transaction History</h2>

               <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                     {(['All', 'Income', 'Expense'] as const).map((f) => (
                        <button
                           key={f}
                           onClick={() => setFilter(f)}
                           className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === f
                              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                              }`}
                        >
                           {f}
                        </button>
                     ))}
                  </div>

                  <button
                     onClick={() => {
                        const headers = ['Date', 'Type', 'Category', 'Description/Title', 'Amount', 'Vehicle'];
                        const csvContent = [
                           headers.join(','),
                           ...filteredTransactions.map(t => [
                              t.date,
                              t.type,
                              t.category,
                              `"${t.title}"`,
                              t.amount,
                              t.vehicle || '-'
                           ].join(','))
                        ].join('\n');

                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', `finance_export_${new Date().toISOString().split('T')[0]}.csv`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                     }}
                     className="hidden md:flex px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors items-center gap-2"
                  >
                     <FileText className="w-4 h-4" />
                     Export CSV
                  </button>

                  <div className="relative w-full sm:w-auto">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                     <input
                        type="text"
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-red-500 text-slate-900 dark:text-white w-full sm:w-64"
                     />
                  </div>
               </div>
            </div>

            {/* Table View (Scrollable on mobile) */}
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm min-w-[800px]">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-wider">
                     <tr>
                        <th className="px-6 py-4">Transaction Details</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Ref / Vehicle</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4 text-center">Docs</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {pagedTransactions.map((trx) => (
                        <tr key={trx.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-start gap-3">
                                 <div className={`p-2 rounded-lg mt-0.5 ${trx.type === 'Income'
                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-600'
                                    : 'bg-red-50 dark:bg-red-900/20 text-red-600'
                                    }`}>
                                    {trx.type === 'Income' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                 </div>
                                 <div className="whitespace-nowrap">
                                    <p className="font-semibold text-slate-900 dark:text-white">{trx.title}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wide mt-0.5">{trx.category}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                              {trx.date}
                           </td>
                           <td className="px-6 py-4 text-slate-900 dark:text-white font-medium whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                 {trx.vehicle && <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>}
                                 {trx.vehicle || '-'}
                              </div>
                           </td>
                           <td className={`px-6 py-4 text-right font-bold text-base whitespace-nowrap ${trx.type === 'Income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                              }`}>
                              {trx.type === 'Income' ? '+' : '-'}{formatPrice(trx.amount)}
                           </td>
                           <td className="px-6 py-4 text-center">
                              {trx.type === 'Income' ? (
                                 <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="View Booking Invoice">
                                    <FileText className="w-4 h-4" />
                                 </button>
                              ) : (
                                 <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors" title="View Expense Receipt">
                                    <FileText className="w-4 h-4" />
                                 </button>
                              )}
                           </td>
                        </tr>
                     ))}
                     {filteredTransactions.length === 0 && (
                        <tr>
                           <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                              No transactions recorded yet.
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            </div>


         </div>
      </div>
   );
};
