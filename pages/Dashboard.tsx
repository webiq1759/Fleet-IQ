import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, Activity, Calendar, ArrowUpRight, TrendingUp } from 'lucide-react';

const revenueData = [
  { name: 'Jan', value: 12000 },
  { name: 'Feb', value: 19000 },
  { name: 'Mar', value: 15000 },
  { name: 'Apr', value: 28000 },
  { name: 'May', value: 32000 },
  { name: 'Jun', value: 45000 },
];

const activityData = [
  { name: 'Mon', value: 4 },
  { name: 'Tue', value: 3 },
  { name: 'Wed', value: 7 },
  { name: 'Thu', value: 5 },
  { name: 'Fri', value: 12 },
  { name: 'Sat', value: 18 },
  { name: 'Sun', value: 14 },
];

const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <Icon className="w-5 h-5 text-red-600 dark:text-red-500" />
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend === 'up' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
        {change}
      </span>
    </div>
    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
  </div>
);

export const Dashboard = () => {
  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen transition-colors duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Command Center</h1>
          <p className="text-slate-500 dark:text-slate-400">Welcome back, Prestige Rentals.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-md text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Download Report
          </button>
          <button className="px-4 py-2 bg-slate-900 dark:bg-red-600 text-white rounded-md text-sm font-medium hover:bg-slate-800 dark:hover:bg-red-700 transition-colors">
            Add New Fleet
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Revenue" 
          value="$152,000" 
          change="+12.5%" 
          trend="up" 
          icon={DollarSign} 
        />
        <StatCard 
          title="Active Rentals" 
          value="8" 
          change="+2" 
          trend="up" 
          icon={Activity} 
        />
        <StatCard 
          title="Upcoming Trips" 
          value="14" 
          change="Next 7 days" 
          trend="neutral" 
          icon={Calendar} 
        />
        <StatCard 
          title="Fleet Health" 
          value="98%" 
          change="Optimal" 
          trend="up" 
          icon={TrendingUp} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Analytics</h2>
            <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm p-1 text-slate-900 dark:text-slate-200 focus:outline-none">
              <option>Last 6 Months</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f56565" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f56565" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Area type="monotone" dataKey="value" stroke="#f56565" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
           <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Weekly Activity</h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#334155" radius={[4, 4, 0, 0]} className="dark:fill-slate-700" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* Recent Trips Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Dispatch Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Asset ID</th>
                <th className="px-6 py-4">Renter</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Destination</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {[1, 2, 3].map((i) => (
                <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">FLT-00{i}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center text-slate-900 dark:text-slate-200">
                       <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 mr-2"></div>
                       Global Energy Ltd
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                      In Transit
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">Lagos → Port Harcourt</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white">$4,200</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
