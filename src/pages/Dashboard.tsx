import { useState, useEffect } from 'react';
import { API } from '../services/api.js';
import { User, Lead, Deal, Activity } from '../types.js';
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar, MessageSquare, Award, AlertCircle, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  user: User;
  onNavigate: (route: string, params?: any) => void;
}

export default function Dashboard({ user, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [leadOverview, setLeadOverview] = useState<any>(null);
  const [upcomingFollowups, setUpcomingFollowups] = useState<any[]>([]);
  const [topDeals, setTopDeals] = useState<Deal[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [dashboardKPIs, leadsSummary, followups, deals, teamActivities] = await Promise.all([
          API.performance.getDashboard(),
          API.leads.getStats(),
          API.communications.getUpcoming(),
          API.deals.list(),
          API.leads.getActivities('system') // Fallback general system activities list load
        ]);
        
        setStats(dashboardKPIs);
        setLeadOverview(leadsSummary);
        setUpcomingFollowups(followups.slice(0, 5)); // Next 5 followups
        
        // Filter top deals
        const sortedDeals = [...deals].sort((a, b) => b.value - a.value);
        setTopDeals(sortedDeals.slice(0, 5));

        // Get general system activities
        setRecentActivities(teamActivities.slice(0, 8));
      } catch (err) {
        console.error('Failed to compile dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  // Set colors for pie chart
  const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#3B82F6', '#8B5CF6', '#EC4899'];

  const getSourcePieData = () => {
    if (!leadOverview || !leadOverview.bySource) return [];
    return Object.entries(leadOverview.bySource).map(([key, val]) => ({
      name: key.toUpperCase().replace('_', ' '),
      value: Number(val)
    }));
  };

  const getStageBarData = () => {
    if (!leadOverview || !leadOverview.byStage) return [];
    return Object.entries(leadOverview.byStage).map(([key, val]) => ({
      stage: key.toUpperCase().replace('_', ' '),
      count: Number(val)
    }));
  };

  // Mock revenue trend
  const revenueTrendData = [
    { month: 'Jan', revenue: 4200000, pipeline: 6800000 },
    { month: 'Feb', revenue: 5800000, pipeline: 9200000 },
    { month: 'Mar', revenue: 7400000, pipeline: 11500000 },
    { month: 'Apr', revenue: 8500000, pipeline: 14000000 },
    { month: 'May (Est)', revenue: 10200000, pipeline: 15400000 }
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personalized Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight">Sourcing Engine Control Centre</h1>
          <p className="text-sm text-slate-500 mt-1">Hello, {user.name} — assigned {user.role.toUpperCase()} scope. Track and orchestrate client relations.</p>
        </div>
        <div className="mt-4 md:mt-0 flex gap-2">
          <button
            onClick={() => onNavigate('rfqs', { create: 'true' })}
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs hover:shadow-md transition-all flex items-center gap-2"
          >
            Create New RFQ Quote
          </button>
          <button
            onClick={() => onNavigate('leads')}
            className="px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-all"
          >
            Manage Leads Register
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm card-hover-effect text-left">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Total Active Leads</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{leadOverview?.totalLeads || 0}</span>
            <span className="text-green-600 text-xs font-medium">↑ 14%</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 h-1 rounded-full">
            <div className="bg-indigo-500 h-1 rounded-full w-[65%]"></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm card-hover-effect text-left">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Winning Sales Revenue</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">₹{(stats?.lifetimeCompletedRevenue || 15400000).toLocaleString('en-IN')}</span>
            <span className="text-green-600 text-xs font-medium">↑ 24% YoY</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 h-1 rounded-full">
            <div className="bg-indigo-400 h-1 rounded-full w-[80%]"></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm card-hover-effect text-left">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Live Pipeline Capital</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">₹{(stats?.livePipelineCapitalSize || 18400000).toLocaleString('en-IN')}</span>
            <span className="text-slate-400 text-xs font-medium">Active RFQs</span>
          </div>
          <div className="mt-2 flex space-x-1">
            <div className="h-1 bg-indigo-500 flex-1 rounded-full"></div>
            <div className="h-1 bg-amber-500 flex-1 rounded-full"></div>
            <div className="h-1 bg-slate-200 flex-[2] rounded-full"></div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm card-hover-effect text-left">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Team Win Velocity</p>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{stats?.teamWinRatePercent || 80}%</span>
            <span className="text-indigo-600 text-xs font-medium">Avg {stats?.closingVelocityDays || 24} Days</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Target cycle metric</p>
        </div>
      </div>

      {/* Analytics Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Core Sales and Forecast chart */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm lg:col-span-2">
          <h2 className="text-sm font-bold text-slate-800">Sourcing Orders & Pipeline Trend</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Quarterly commercial metrics</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, '']} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="revenue" name="Received Orders" stroke="#10B981" strokeWidth={2.5} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="pipeline" name="Proposed pipeline" stroke="#6366F1" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Source Segment classification (Pie Chart) */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <h2 className="text-sm font-bold text-slate-800">Leads Origination Channels</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Traffic analytics origin</p>
          <div className="h-56 flex justify-center items-center">
            {getSourcePieData().length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={getSourcePieData()}
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {getSourcePieData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v} leads`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-sm text-slate-400">No leads database entries.</div>
            )}
          </div>
          {/* Legend indicator list */}
          <div className="mt-2 grid grid-cols-2 gap-1 text-[11px] font-medium text-slate-500 max-h-20 overflow-y-auto">
            {getSourcePieData().map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-xs block shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="truncate">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Checklist, Top Deals & Communications list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Today's follow up Checklist */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-sm font-bold text-slate-800">Urgent Follow-ups</h2>
            <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded uppercase">
              {upcomingFollowups.length} Priority
            </span>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Action pipeline today</p>

          {upcomingFollowups.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {upcomingFollowups.map((fo, idx) => (
                <div
                  key={idx}
                  onClick={() => onNavigate('leads', { id: fo.leadId })}
                  className="p-3 border border-transparent hover:border-slate-200 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800 truncate max-w-[150px]">{fo.companyName}</p>
                    <p className="text-[10px] text-slate-500 truncate">{fo.contactName} • {fo.contactPhone}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block text-[9px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-sm mb-1">
                      {fo.followUpDate ? new Date(fo.followUpDate).toLocaleDateString() : 'Today'}
                    </span>
                    <span className={`block text-[9px] px-1.5 py-0.5 rounded-sm font-bold text-center ${
                      fo.priority === 'hot' ? 'bg-red-50 text-red-650' : 'bg-amber-50 text-amber-655'
                    }`}>
                      {fo.priority?.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400">
              <Calendar className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-xs">No pending follow-ups scheduled today.</p>
            </div>
          )}
        </div>

        {/* Top deals by value */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-sm font-bold text-slate-800">Ongoing Bidding Deals</h2>
            <button onClick={() => onNavigate('sales')} className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-1">
              View Tracker <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">High-value active profiles</p>

          <div className="overflow-x-auto flex-1 min-h-[220px]">
            {topDeals.length > 0 ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5">Deal Details</th>
                    <th className="py-2.5">Stage</th>
                    <th className="py-2.5">Close Date</th>
                    <th className="py-2.5 text-right">Estimated Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-700">
                  {topDeals.map((deal, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3">
                        <p className="font-bold text-slate-800">{deal.dealName}</p>
                        <p className="text-[10px] text-slate-400">MOQ: {deal.moq} pieces • {deal.leadTime}d lead time</p>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] capitalize ${
                          deal.stage === 'closed_won' ? 'bg-emerald-50 text-emerald-700' :
                          deal.stage === 'closed_lost' ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {deal.stage.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-slate-500">
                        {deal.expectedCloseDate}
                      </td>
                      <td className="py-3 text-right font-mono text-slate-800">
                        ₹{Number(deal.value).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <p className="text-xs">No active manufacturing deals logged.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity feed logs */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm text-left">
        <h2 className="text-sm font-bold text-slate-800">Recent Sales Team Activities</h2>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Operation registers ledger</p>
        {recentActivities.length > 0 ? (
          <div className="relative border-l border-slate-200 pl-4 ml-2 space-y-4">
            {recentActivities.map((act) => (
              <div key={act._id} className="relative text-xs text-slate-600">
                <span className="absolute -left-[21px] top-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 ring-4 ring-white shrink-0 block" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <p className="font-bold text-slate-700 leading-tight">
                    {act.description}
                  </p>
                  <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-400 text-xs">
            No system log records available yet.
          </div>
        )}
      </div>
    </div>
  );
}
