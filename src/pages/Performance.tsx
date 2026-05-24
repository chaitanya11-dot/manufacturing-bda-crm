import { useState, useEffect } from 'react';
import { API } from '../services/api.js';
import { User } from '../types.js';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';
import { Award, Target, Flame, CheckCircle, RefreshCw } from 'lucide-react';

interface LeaderboardUser {
  userId: string;
  name: string;
  leadsCreated: number;
  rfqsCreated: number;
  dealsWon: number;
  totalWonValue: number;
  achievedPercent: number;
  quotaTarget: number;
}

export default function Performance() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaderboardData = async () => {
    try {
      setLoading(true);
      const list = await API.performance.getLeaderboard();
      
      // Map targets onto BDA users
      const mapped: LeaderboardUser[] = list.map(u => {
        const target = 10000000; // 10 Million INR standard target
        const wonVal = u.totalWonValue || 0;
        return {
          userId: u.userId,
          name: u.name,
          leadsCreated: u.leadsCreated || 0,
          rfqsCreated: u.rfqsCreated || 0,
          dealsWon: u.dealsWon || 0,
          totalWonValue: wonVal,
          quotaTarget: target,
          achievedPercent: Math.min(Math.round((wonVal / target) * 100), 100)
        };
      });

      setLeaderboard(mapped);
    } catch (err) {
      console.error('Failed to parse performance report metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboardData();
  }, []);

  // Conversion funnel dropping metrics
  const funnelData = [
    { name: 'Sourcing leads', stageCount: 42, pct: 100, style: 'bg-indigo-600' },
    { name: 'Contacted', stageCount: 34, pct: 80, style: 'bg-indigo-500' },
    { name: 'Qualified status', stageCount: 22, pct: 52, style: 'bg-indigo-400' },
    { name: 'RFQ Proposals Sent', stageCount: 12, pct: 28, style: 'bg-amber-500' },
    { name: 'Deals Closed-Won', stageCount: 7, pct: 16, style: 'bg-emerald-600' }
  ];

  // Colors list
  const PIE_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'];

  const getSourcePieData = () => {
    return [
      { name: 'Cold outreach calls', value: 35 },
      { name: 'Wholesale LinkedIn profiles', value: 25 },
      { name: 'Global tradeshow expo boards', value: 20 },
      { name: 'Corporate inbound website', value: 20 }
    ];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-205">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight text-left">BDA Quota performance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time statistics highlighting direct manufacturing procurement cycles.</p>
        </div>
        <button
          onClick={loadLeaderboardData}
          className="p-2 text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-semibold flex items-center gap-1 text-xs shrink-0 bg-white"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reload Quotas
        </button>
      </div>

      {/* Quota Leaderboards block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leaderboard Table panel */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl lg:col-span-2 space-y-4 shadow-sm text-left">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight font-display flex items-center gap-2 border-b border-slate-150 pb-2.5">
            <Award className="h-5 w-5 text-indigo-600" /> BDA Quota achievement Leaderboard
          </h2>

          <div className="space-y-4.5 max-h-[360px] overflow-y-auto pr-1">
            {leaderboard.map((bda, index) => (
              <div key={bda.userId} className="p-4 border border-slate-200 rounded-xl space-y-2 text-xs font-semibold hover:shadow-xs transition-shadow">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full flex items-center justify-center bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                      {index + 1}
                    </span>
                    <span className="font-bold text-slate-800 text-sm">{bda.name}</span>
                  </div>
                  <span className="font-mono font-bold text-indigo-700">{bda.achievedPercent}% Quota Met</span>
                </div>

                {/* Progress bar metrics */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${bda.achievedPercent}%` }}
                  />
                </div>

                <div className="grid grid-cols-4 gap-2 text-[10px] text-slate-400 font-bold border-t border-slate-50 pt-2 text-center uppercase">
                  <div>
                    <span className="block text-slate-800 font-mono text-xs font-bold">{bda.leadsCreated}</span>
                    <span>Leads Created</span>
                  </div>
                  <div>
                    <span className="block text-slate-800 font-mono text-xs font-bold">{bda.rfqsCreated}</span>
                    <span>Quotes sent</span>
                  </div>
                  <div>
                    <span className="block text-slate-800 font-mono text-xs font-bold">{bda.dealsWon}</span>
                    <span>Closed won</span>
                  </div>
                  <div className="text-right">
                    <span className="block text-emerald-600 font-mono text-xs font-bold">₹{Number(bda.totalWonValue).toLocaleString('en-IN')}</span>
                    <span>Total Sourced</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Funnel pipeline dropping segments */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl space-y-4 shadow-sm text-left">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight font-display flex items-center gap-2 border-b border-slate-150 pb-2.5">
            <Target className="h-5 w-5 text-indigo-600" /> Procurement Stage Funnel
          </h2>

          <div className="space-y-3.5 pt-2">
            {funnelData.map((fn, idx) => (
              <div key={idx} className="space-y-1 text-xs font-semibold text-slate-600">
                <div className="flex justify-between items-center text-xs">
                  <span>{fn.name}</span>
                  <span className="font-mono font-bold text-slate-700">{fn.stageCount} Leads ({fn.pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-4.5 rounded-sm overflow-hidden relative">
                  <div
                    className={`${fn.style} h-full transition-all duration-300`}
                    style={{ width: `${fn.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Origin analytics channels Recharts charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm text-left">
          <h2 className="text-sm font-bold text-slate-800 mb-1">Industrial Client Conversion Trends</h2>
          <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-4">Traffic Channel Share</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getSourcePieData()}
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {getSourcePieData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}% ratio`, 'Conversion Share']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold text-center border-t border-slate-50 pt-3">
            {getSourcePieData().map((sg, idx) => (
              <div key={idx} className="flex items-center gap-1.5 justify-center">
                <span className="w-2.5 h-2.5 rounded-sm shrink-0 block" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                <span>{sg.name} ({sg.value}%)</span>
              </div>
            ))}
          </div>
        </div>

        {/* BDA target metrics summary block */}
        <div className="bg-white p-5 border border-slate-200 rounded-xl flex flex-col justify-between shadow-sm text-left">
          <div>
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight font-display mb-3 border-b border-slate-150 pb-2.5 flex items-center gap-1">
              <Flame className="h-5 w-5 text-indigo-600" /> BDA critical targets checklist
            </h2>
            <div className="space-y-3.5 text-xs font-semibold text-slate-600">
              <div className="flex gap-2.5 items-start">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-800 font-bold leading-tight">MOQ volume commitment check</p>
                  <p className="text-slate-400 text-[10px] leading-snug">Ensure every drafted RFQ items counts are over the threshold limit of 100.</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-800 font-bold leading-tight">GSTIN PAN validation criteria</p>
                  <p className="text-slate-400 text-[10px] leading-snug">Confirm that every converted client profile contains legal tax ID numbers (GSTIN/PAN codes) to permit billings.</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <CheckCircle className="h-4.5 w-4.5 text-slate-300 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-800 font-bold leading-tight">Sample trials feedback log</p>
                  <p className="text-slate-400 text-[10px] leading-snug">Register qualitative inspection notes during sample phases to boost deal closing scores.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-center text-xs text-slate-500 font-semibold leading-normal">
            "Procurement accuracy drives long-term manufacturing contracts."
          </div>
        </div>
      </div>

    </div>
  );
}
