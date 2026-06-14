import React, { useState, useEffect } from 'react';
import { FiUsers, FiTrendingUp, FiCheckSquare, FiAlertCircle, FiClock, FiFileText } from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { dashboardService } from '../services/api';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    dashboardService.getStats()
      .then((res) => {
        if (res.success) {
          setStats(res.data);
        } else {
          setError(res.message || 'Failed to fetch dashboard statistics.');
        }
      })
      .catch((err) => {
        console.error('Error fetching dashboard stats:', err);
        setError('An error occurred while loading metrics. Please ensure backend is running.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center space-x-3">
        <FiAlertCircle className="w-6 h-6 shrink-0" />
        <div>
          <h4 className="font-bold">Error Loading Dashboard</h4>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const { cards, charts } = stats || { cards: {}, charts: {} };

  // Colors for Donut Chart (Status)
  const STATUS_COLORS = {
    'New': '#3b82f6',                // Blue
    'Under Review': '#6366f1',       // Indigo
    'Shortlisted': '#f59e0b',        // Amber
    'Interview Scheduled': '#8b5cf6', // Purple
    'Selected': '#10b981',           // Emerald
    'Rejected': '#ef4444',           // Red
  };

  const statusPieData = (charts.status || []).filter(item => item.value > 0);

  const cardList = [
    { name: 'Total Applications', value: cards.total, icon: <FiUsers className="w-6 h-6" />, color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { name: "Today's Applications", value: cards.today, icon: <FiTrendingUp className="w-6 h-6" />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { name: 'New Submissions', value: cards.new, icon: <FiClock className="w-6 h-6" />, color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { name: 'Shortlisted', value: cards.shortlisted, icon: <FiFileText className="w-6 h-6" />, color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { name: 'Selected Candidates', value: cards.selected, icon: <FiCheckSquare className="w-6 h-6" />, color: 'bg-teal-50 text-teal-600 border-teal-100' },
    { name: 'Rejected Applications', value: cards.rejected, icon: <FiAlertCircle className="w-6 h-6" />, color: 'bg-rose-50 text-rose-600 border-rose-100' },
  ];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-display">System Overview</h1>
        <p className="text-slate-500 mt-1">Real-time statistics and trends for recruitment workflows.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cardList.map((card) => (
          <div key={card.name} className={`bg-white p-6 rounded-2xl border shadow-sm flex items-center space-x-5 transition-transform hover:-translate-y-1 duration-200 ${card.color}`}>
            <div className={`p-4 rounded-xl ${card.color.split(' ')[0]}`}>
              {card.icon}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">{card.name}</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Submission Trends */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Application Trend</h3>
            <p className="text-xs text-slate-400">Monthly breakdown of received resumes.</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthly || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0' }} />
                <Area type="monotone" dataKey="applications" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorApps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Position-wise Applications */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Applications by Position</h3>
            <p className="text-xs text-slate-400">Total count sorted by target roles.</p>
          </div>
          <div className="h-80 w-full">
            {charts.position && charts.position.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.position} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickFormatter={(str) => str.length > 12 ? `${str.slice(0, 10)}...` : str} />
                  <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0' }} />
                  <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No active positions data available.
              </div>
            )}
          </div>
        </div>

        {/* Status Distribution (Pie Chart) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 lg:col-span-2">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Application Status Distribution</h3>
            <p className="text-xs text-slate-400">Proportional representation of candidate states.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
            <div className="h-72 w-full flex justify-center">
              {statusPieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  No applications recorded in the database yet.
                </div>
              )}
            </div>

            {/* Customized legend */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Legend & Count</h4>
              <div className="grid grid-cols-2 gap-3.5">
                {(charts.status || []).map((status) => (
                  <div key={status.name} className="flex items-center space-x-2.5 p-2 border border-slate-100 rounded-xl bg-slate-50">
                    <span className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[status.name] || '#cbd5e1' }} />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800">{status.value}</p>
                      <p className="text-[10px] font-medium text-slate-400 truncate">{status.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardPage;
