import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ElementType;
  trend: 'up' | 'down' | 'neutral';
}

interface RegistryCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  bgClass: string;
  colorClass: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, change, icon: Icon, trend }) => (
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

export const RegistryCard: React.FC<RegistryCardProps> = ({ title, value, icon: Icon, colorClass, bgClass }) => (
  <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200 flex items-center justify-between">
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{value}</h3>
    </div>
    <div className={`p-3 rounded-xl ${bgClass}`}>
      <Icon className={`w-6 h-6 ${colorClass}`} />
    </div>
  </div>
);