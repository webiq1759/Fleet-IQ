import React from 'react';

interface SectionPlaceholderProps {
  title: string;
  icon: React.ElementType;
}

export const SectionPlaceholder: React.FC<SectionPlaceholderProps> = ({ title, icon: Icon }) => {
  return (
    <div className="flex flex-col items-center justify-center h-[500px] text-center p-8 animate-in fade-in duration-300">
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
         <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
        {title}
      </h2>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm">
        This module is available in the full enterprise version of Fleet IQ.
      </p>
    </div>
  );
};