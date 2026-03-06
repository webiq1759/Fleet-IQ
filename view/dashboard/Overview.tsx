
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DollarSign, Activity, Calendar, TrendingUp } from 'lucide-react';
import { StatCard } from '../../components/DashboardComponents';
import { Booking, Asset, CrewMember } from '../../types';
import { usePreferences } from '../../contexts/PreferencesContext';

interface OverviewProps {
  bookings: Booking[];
  fleets: Asset[];
  crew: CrewMember[];
}

export const Overview: React.FC<OverviewProps> = ({ bookings, fleets, crew, onNavigate }) => {
  const { formatPrice } = usePreferences();
  const [filter, setFilter] = React.useState('Year');

  // 1. Total Revenue: Only 'Completed' trips
  const totalRevenue = bookings
    .filter(b => b.status === 'Completed')
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // 2. Active Rentals: Status is 'Trip' or 'Ongoing'
  const activeRentals = bookings.filter(b => b.status === 'Trip' || b.status === 'Ongoing').length;

  // 3. Upcoming Trips: Status 'Assigned' or 'New'
  const upcomingTrips = bookings.filter(b => b.status === 'Assigned' || b.status === 'New').length;

  // 4. Fleet Health
  const availableFleets = fleets.filter(f => f.isAvailable).length;
  const healthPercentage = fleets.length > 0 ? Math.round((availableFleets / fleets.length) * 100) : 0;

  // 5. Chart Data with Filters
  const getRevenueChartData = () => {
    let data: { name: string; value: number }[] = [];
    const now = new Date();

    if (filter === 'Year') {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData: Record<string, number> = {};
      months.forEach(m => monthlyData[m] = 0);

      bookings.forEach(b => {
        if (b.status === 'Completed' && b.requestedOn) {
          const date = new Date(b.requestedOn);
          if (date.getFullYear() === now.getFullYear()) {
            monthlyData[months[date.getMonth()]] += b.totalAmount;
          }
        }
      });
      data = months.map(name => ({ name, value: monthlyData[name] }));

    } else if (filter === 'Month') {
      // Days of the current month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const dailyData: Record<number, number> = {};
      for (let i = 1; i <= daysInMonth; i++) dailyData[i] = 0;

      bookings.forEach(b => {
        if (b.status === 'Completed' && b.requestedOn) {
          const date = new Date(b.requestedOn);
          if (date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
            dailyData[date.getDate()] += b.totalAmount;
          }
        }
      });
      data = Object.keys(dailyData).map(d => ({ name: d, value: dailyData[Number(d)] }));

    } else if (filter === 'Week') {
      // Current week (Mon-Sun)
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weeklyData: Record<string, number> = {};
      days.forEach(d => weeklyData[d] = 0);

      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay() || 7; // Get current day number, converting Sun (0) to 7
      if (day !== 1) startOfWeek.setHours(-24 * (day - 1)); // Set to Monday of this week
      else startOfWeek.setHours(0, 0, 0, 0);

      bookings.forEach(b => {
        if (b.status === 'Completed' && b.requestedOn) {
          const date = new Date(b.requestedOn);
          if (date >= startOfWeek) {
            const dayName = days[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Adjust for 0-indexed Sunday
            weeklyData[dayName] += b.totalAmount;
          }
        }
      });
      data = days.map(name => ({ name, value: weeklyData[name] }));
    } else if (filter === 'Day') {
      // Hourly for today
      const hourlyData: Record<string, number> = {};
      for (let i = 0; i < 24; i++) hourlyData[`${i}:00`] = 0;

      bookings.forEach(b => {
        if (b.status === 'Completed' && b.requestedOn) {
          const date = new Date(b.requestedOn);
          if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
            hourlyData[`${date.getHours()}:00`] += b.totalAmount;
          }
        }
      });
      data = Object.keys(hourlyData).map(name => ({ name, value: hourlyData[name] }));
    }

    return data;
  };

  const revenueData = getRevenueChartData();

  // 6. Operational Tasks Generation
  const getOperationalTasks = () => {
    const tasks = [];

    // Task: Assign Crew
    const unassignedBookings = bookings.filter(b => b.status === 'New' || b.status === 'Paid');
    if (unassignedBookings.length > 0) {
      tasks.push({
        title: 'Assign Crew',
        description: `You have ${unassignedBookings.length} booking(s) waiting for crew assignment.`,
        action: 'Go to Dispatch',
        targetTab: 'dispatch',
        priority: 'High',
        count: unassignedBookings.length,
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-100 dark:border-orange-900/30',
        text: 'text-orange-900 dark:text-orange-100',
        btn: 'text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300'
      });
    }

    // Task: Dispatch Asset
    const readyForDispatch = bookings.filter(b => b.status === 'Assigned');
    if (readyForDispatch.length > 0) {
      tasks.push({
        title: 'Dispatch Assets',
        description: `${readyForDispatch.length} asset(s) are ready for dispatch.`,
        action: 'Go to Dispatch',
        targetTab: 'dispatch',
        priority: 'High',
        count: readyForDispatch.length,
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-100 dark:border-blue-900/30',
        text: 'text-blue-900 dark:text-blue-100',
        btn: 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300'
      });
    }

    // Task: Add Fleet (if low inventory)
    if (fleets.length === 0) {
      tasks.push({
        title: 'Add First Asset',
        description: 'Your fleet is empty. Add your first asset to start earning.',
        action: 'Add Asset',
        targetTab: 'registry',
        priority: 'Medium',
        count: 0,
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-100 dark:border-purple-900/30',
        text: 'text-purple-900 dark:text-purple-100',
        btn: 'text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300'
      });
    }

    // Task: Add Crew (if assets exist but no crew assigned)
    const assetsWithCrew = new Set(crew.map(c => c.assignedAssetId).filter(Boolean));
    const assetsMissingCrew = fleets.filter(f => !assetsWithCrew.has(f.id));

    if (fleets.length > 0 && assetsMissingCrew.length > 0) {
      tasks.push({
        title: 'Add Crew to Fleet',
        description: `You have ${assetsMissingCrew.length} asset(s) without assigned crew. They will not be visible in the marketplace.`,
        action: 'Manage Crew',
        targetTab: 'crew',
        priority: 'High',
        count: assetsMissingCrew.length,
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-100 dark:border-red-900/30',
        text: 'text-red-900 dark:text-red-100',
        btn: 'text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300'
      });
    }

    // Task: Expiring Crew Licenses
    const expiringLicenses = crew.filter(c => {
      if (!c.expiryDate) return false;
      const expiry = new Date(c.expiryDate);
      const now = new Date();
      const diffTime = expiry.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30; // Expiring in 30 days or less (includes expired)
    });

    if (expiringLicenses.length > 0) {
      tasks.push({
        title: 'Crew Licenses Expiring',
        description: `${expiringLicenses.length} crew member(s) have licenses expired or expiring soon. Update to maintain compliance.`,
        action: 'View Crew',
        targetTab: 'crew',
        priority: 'Critical',
        count: expiringLicenses.length,
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-100 dark:border-amber-900/30',
        text: 'text-amber-900 dark:text-amber-100',
        btn: 'text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300'
      });
    }

    return tasks;
  };

  const tasks = getOperationalTasks();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Paid': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Assigned': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Trip': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Ongoing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Completed': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
      case 'Cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  // Recent logs
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.requestedOn).getTime() - new Date(a.requestedOn).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-24 md:pb-0">
      {/* 1. Stat Cards: horizontally scrollable on mobile, grid on desktop */}
      <div className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory gap-4 pb-4 -mx-6 px-6 md:mx-0 md:px-0 lg:grid lg:grid-cols-4 lg:gap-6 lg:pb-0 lg:overflow-visible flex-nowrap">
        <div className="snap-center shrink-0 w-[80vw] sm:w-[320px] lg:w-auto">
          <StatCard
            title="Total Revenue"
            value={formatPrice(totalRevenue)}
            change={totalRevenue > 0 ? "+100%" : "0%"}
            trend="up"
            icon={DollarSign}
          />
        </div>
        <div className="snap-center shrink-0 w-[80vw] sm:w-[320px] lg:w-auto">
          <StatCard
            title="Active Rentals"
            value={activeRentals.toString()}
            change={activeRentals > 0 ? "Active" : "None"}
            trend={activeRentals > 0 ? "up" : "neutral"}
            icon={Activity}
          />
        </div>
        <div className="snap-center shrink-0 w-[80vw] sm:w-[320px] lg:w-auto">
          <StatCard
            title="Upcoming Trips"
            value={upcomingTrips.toString()}
            change="Scheduled"
            trend="neutral"
            icon={Calendar}
          />
        </div>
        <div className="snap-center shrink-0 w-[80vw] sm:w-[320px] lg:w-auto">
          <StatCard
            title="Fleet Availability"
            value={`${healthPercentage}%`}
            change="Capacity"
            trend={healthPercentage > 80 ? "up" : "down"}
            icon={TrendingUp}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Analytics */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Revenue Analytics</h2>
            <div className="flex flex-wrap bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-fit">
              {['Year', 'Month', 'Week', 'Day'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${filter === f
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f56565" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f56565" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} tickFormatter={(value) => `${value >= 1000 ? value / 1000 + 'k' : value}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#f8fafc' }}
                  labelStyle={{ color: '#94a3b8' }}
                  formatter={(value: number) => formatPrice(value)}
                />
                <Area type="monotone" dataKey="value" stroke="#f56565" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operational Tasks */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-200 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Operational Tasks</h2>
          </div>
          <div className="flex-1 overflow-y-auto space-y-4">
            {tasks.length > 0 ? (
              tasks.map((task, index) => (
                <div key={index} className={`p-4 rounded-lg border ${task.bg} ${task.border}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className={`font-semibold text-sm ${task.text}`}>{task.title}</h3>
                    {task.count > 0 && (
                      <span className="bg-white/50 dark:bg-black/20 text-xs px-2 py-0.5 rounded-full font-medium shadow-sm text-slate-700 dark:text-slate-300">
                        {task.count} Pending
                      </span>
                    )}
                  </div>
                  <p className={`text-xs mb-3 line-clamp-2 opacity-80 ${task.text}`}>
                    {task.description}
                  </p>
                  <button
                    onClick={() => onNavigate(task.targetTab)}
                    className={`text-xs font-bold hover:underline flex items-center ${task.btn}`}
                  >
                    {task.action} &rarr;
                  </button>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
                  <Activity className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-slate-900 dark:text-white font-medium text-sm">All Caught Up!</h3>
                <p className="text-xs text-slate-500 mt-1">No pending operational tasks.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Trips Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Dispatch Logs</h2>
        </div>
        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">
              <tr>
                <th className="px-6 py-4">Booking ID</th>
                <th className="px-6 py-4">Asset</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentBookings.length > 0 ? recentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900 dark:text-white font-mono">
                    {booking.bookingCode || booking.id.substring(0, 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                    {booking.assetTitle}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {new Date(booking.requestedOn).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-900 dark:text-white font-mono">
                    {formatPrice(booking.totalAmount)}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                    No recent activity found.
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
