
import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts';
import { usePreferences } from '../../contexts/PreferencesContext';
import { Booking, Asset } from '../../types';

const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#22c55e', '#8b5cf6'];

interface ReportsProps {
  bookings: Booking[];
  fleets: Asset[];
}

type TimeRange = 'weekly' | 'monthly' | 'yearly';

export const Reports: React.FC<ReportsProps> = ({ bookings, fleets }) => {
  const { formatPrice } = usePreferences();
  const [timeRange, setTimeRange] = useState<TimeRange>('yearly');

  // Only count completed bookings for revenue (matches Finance section logic)
  const completedBookings = bookings.filter(b => b.status === 'Completed');

  const getRevenueData = (): { name: string; value: number }[] => {
    const now = new Date();

    if (timeRange === 'yearly') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const data = months.map(m => ({ name: m, value: 0 }));
      const currentYear = now.getFullYear();
      completedBookings.forEach(b => {
        if (!b.requestedOn) return;
        const d = new Date(b.requestedOn);
        if (d.getFullYear() === currentYear) {
          data[d.getMonth()].value += Number(b.totalAmount) || 0;
        }
      });
      return data;
    }

    if (timeRange === 'monthly') {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const data = Array.from({ length: daysInMonth }, (_, i) => ({ name: `${i + 1}`, value: 0 }));
      completedBookings.forEach(b => {
        if (!b.requestedOn) return;
        const d = new Date(b.requestedOn);
        if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
          data[d.getDate() - 1].value += Number(b.totalAmount) || 0;
        }
      });
      return data;
    }

    // Weekly: Mon–Sun of current week
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const data = dayNames.map(n => ({ name: n, value: 0 }));
    const startOfWeek = new Date(now);
    const day = now.getDay(); // 0 = Sun
    startOfWeek.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    startOfWeek.setHours(0, 0, 0, 0);
    completedBookings.forEach(b => {
      if (!b.requestedOn) return;
      const d = new Date(b.requestedOn);
      if (d >= startOfWeek) {
        const idx = Math.min(Math.floor((d.getTime() - startOfWeek.getTime()) / 86400000), 6);
        data[idx].value += Number(b.totalAmount) || 0;
      }
    });
    return data;
  };

  const revenueData = getRevenueData();
  const totalRevenue = revenueData.reduce((acc, curr) => acc + curr.value, 0);

  const rangeLabel: Record<TimeRange, string> = {
    weekly: 'this week',
    monthly: 'this month',
    yearly: 'this year',
  };

  // Top Assets by Trip Count (all bookings)
  const getTopAssets = () => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      counts[b.assetTitle] = (counts[b.assetTitle] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, trips]) => ({ name, trips }))
      .sort((a, b) => b.trips - a.trips)
      .slice(0, 5);
  };

  const topAssetsData = getTopAssets();

  // Status Breakdown (all bookings)
  const getStatusData = () => {
    const counts: Record<string, number> = {};
    bookings.forEach(b => {
      counts[b.status] = (counts[b.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const statusData = getStatusData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded-lg shadow-xl">
          <p className="text-slate-300 text-xs mb-1">{label}</p>
          <p className="text-white font-bold text-sm">
            {formatPrice(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-24">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mt-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics &amp; Reports</h1>
          <p className="text-slate-500 dark:text-slate-400">Deep dive into fleet performance and financial metrics.</p>
        </div>
      </div>

      {/* Revenue Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Trends</h2>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                {formatPrice(totalRevenue)}
              </span>
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                total {rangeLabel[timeRange]}
              </span>
            </div>
          </div>

          {/* Time Range Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1 self-start sm:self-auto">
            {(['weekly', 'monthly', 'yearly'] as TimeRange[]).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all duration-200 ${timeRange === range
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                  }`}
              >
                {range === 'yearly' ? 'Year' : range === 'monthly' ? 'Month' : 'Week'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickFormatter={(value) => `${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ef4444', strokeWidth: 1, strokeDasharray: '5 5' }} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#ef4444"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRevenue)"
                activeDot={{ r: 6, stroke: '#fff', strokeWidth: 2, fill: '#ef4444' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Assets by Trips */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Top Assets by Trip Count</h2>
          <div className="h-[300px]">
            {topAssetsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={topAssetsData} margin={{ top: 0, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 500 }}
                    width={100}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Bar dataKey="trips" fill="#f97316" radius={[0, 4, 4, 0]} barSize={24}>
                    {topAssetsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                No trip data available.
              </div>
            )}
          </div>
        </div>

        {/* Activity Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Activity Breakdown</h2>
          <div className="h-[300px] flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    formatter={(value) => <span className="text-slate-600 dark:text-slate-300 font-medium ml-1">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-slate-500">No data to display.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
