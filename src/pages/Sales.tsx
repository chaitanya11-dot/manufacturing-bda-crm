import { useState, useEffect } from 'react';
import { API } from '../services/api.js';
import { Deal, User } from '../types.js';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, RefreshCw, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';

interface SalesProps {
  user: User;
  onNavigate: (route: string, params?: any) => void;
}

export default function Sales({ user, onNavigate }: SalesProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  const loadDeals = async () => {
    try {
      setLoading(true);
      const list = await API.deals.list();
      setDeals(list);
    } catch (err) {
      console.error('Failed to parse sales deal forecast ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDeals();
  }, []);

  const getProbabilityMultiplier = (stage: string): number => {
    switch (stage) {
      case 'qualification': return 0.20;
      case 'proposal_sent': return 0.50;
      case 'negotiation': return 0.80;
      case 'closed_won': return 1.0;
      case 'closed_lost': return 0.0;
      default: return 0.40;
    }
  };

  const calculateWeightedValue = (value: number, stage: string): number => {
    return value * getProbabilityMultiplier(stage);
  };

  const handleStageChange = async (dealId: string, nextStage: string) => {
    try {
      await API.deals.updateStage(dealId, { stage: nextStage });
      loadDeals();
    } catch {
      alert('Operation failed. Please review system authorization.');
    }
  };

  const getFilteredDeals = () => {
    return deals.filter(d => {
      const matchesSearch = d.dealName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStage = stageFilter ? d.stage === stageFilter : true;
      return matchesSearch && matchesStage;
    });
  };

  const visibleDeals = getFilteredDeals();

  // Compute stats metrics totals
  const totalValue = visibleDeals.reduce((sum, d) => sum + d.value, 0);
  const totalWeighted = visibleDeals.reduce((sum, d) => sum + calculateWeightedValue(d.value, d.stage), 0);
  const totalWonCount = visibleDeals.filter(d => d.stage === 'closed_won').length;

  // Chart data calculation
  const getChartData = () => {
    const stages = ['qualification', 'proposal_sent', 'negotiation', 'closed_won'];
    return stages.map(st => {
      const stageDeals = deals.filter(d => d.stage === st);
      const rawSum = stageDeals.reduce((sum, d) => sum + d.value, 0);
      const weightedSum = stageDeals.reduce((sum, d) => sum + calculateWeightedValue(d.value, d.stage), 0);
      return {
        stage: st.toUpperCase().replace('_', ' '),
        'Raw Potential': rawSum,
        'Weighted Forecast': weightedSum
      };
    });
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
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 text-left">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight text-left">Industrial Sales Tracker</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Weighted commercial forecasting and volume commitments ledger.</p>
        </div>
        <button
          onClick={loadDeals}
          className="p-2 text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all font-semibold flex items-center gap-1 text-xs shrink-0 bg-white"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Forecast
        </button>
      </div>

      {/* Probability weight banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-left">
        <div className="bg-indigo-600/90 text-white p-5 rounded-xl shadow-md relative overflow-hidden text-left">
          <div className="absolute right-3 top-3 opacity-20"><Sparkles className="h-10 w-10" /></div>
          <p className="text-xs uppercase font-bold text-indigo-200 tracking-wider">Weighted Sourcing Pipeline</p>
          <p className="text-2xl font-black font-mono tracking-tight mt-1">₹{totalWeighted.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-indigo-100 mt-2 block">Probability filtered commercial revenue projection</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative text-left">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Gross Sourcing Pipeline Size</p>
          <p className="text-2xl font-bold font-mono text-slate-800 mt-1">₹{totalValue.toLocaleString('en-IN')}</p>
          <span className="text-[10px] text-slate-500 mt-2 block">Value sum from active industrial negotiations</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative text-left">
          <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">Confirmed commercial orders</p>
          <p className="text-2xl font-bold text-emerald-600 font-mono mt-1">{totalWonCount} Deals Closed-Won</p>
          <span className="text-[10px] text-slate-500 mt-2 block">Average lead manufacturing cycle: 14 days</span>
        </div>
      </div>

      {/* Analytics Recharts panel */}
      <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-sm text-left">
        <h2 className="text-sm font-bold text-slate-850 mb-1">Raw vs. Weighted Pipeline Valuation</h2>
        <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-4">Stage commercial summary</p>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getChartData()}>
              <XAxis dataKey="stage" stroke="#94A3B8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
              <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Raw Potential" fill="#A5B4FC" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Weighted Forecast" fill="#4F46E5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Deals tracker register ledger */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-left">
        <div className="p-4 border-b border-slate-205 flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
          <h2 className="text-sm font-bold text-slate-800 uppercase font-display tracking-tight text-left">Active Negotiations ledger</h2>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto text-xs font-semibold text-slate-700">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contracts by name..."
              className="px-3 py-1.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg text-xs flex-1"
            />

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="border border-slate-200 rounded-lg py-1.5 px-2 bg-white"
            >
              <option value="">Any Stage</option>
              <option value="qualification">QUALIFICATION (20%)</option>
              <option value="proposal_sent">PROPOSAL SENT (50%)</option>
              <option value="negotiation">NEGOTIATION (80%)</option>
              <option value="closed_won">CLOSED WON (100%)</option>
              <option value="closed_lost">CLOSED LOST (0%)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto text-left">
          <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Deal specs</th>
                <th className="py-3 px-4">Target Stage</th>
                <th className="py-3 px-4">Close expected Date</th>
                <th className="py-3 px-4">Production lead-time</th>
                <th className="py-3 px-4 text-center">Probability weighted value</th>
                <th className="py-3 px-4 text-right">Raw Capital Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visibleDeals.map((deal) => {
                const weighted = calculateWeightedValue(deal.value, deal.stage);
                const probPercent = getProbabilityMultiplier(deal.stage) * 100;

                return (
                  <tr key={deal._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 uppercase">
                      <p className="font-bold text-slate-800 text-xs">{deal.dealName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">MOQ target: {deal.moq} pieces</p>
                    </td>
                    <td className="py-4 px-4">
                      <select
                        value={deal.stage}
                        aria-label="Target stage selection select"
                        onChange={(e) => handleStageChange(deal._id, e.target.value)}
                        className={`font-semibold text-xs border rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white ${
                          deal.stage === 'closed_won' ? 'text-emerald-700 border-emerald-100' :
                          deal.stage === 'closed_lost' ? 'text-red-700 border-red-100' : 'text-indigo-700'
                        }`}
                      >
                        <option value="qualification">QUALIFICATION (20%)</option>
                        <option value="proposal_sent">PROPOSAL SENT (50%)</option>
                        <option value="negotiation">NEGOTIATION (80%)</option>
                        <option value="closed_won">CLOSED WON (100%)</option>
                        <option value="closed_lost">CLOSED LOST (0%)</option>
                      </select>
                    </td>
                    <td className="py-4 px-4 text-slate-500 font-mono text-[11px]">
                      {deal.expectedCloseDate}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      {deal.leadTime} Calendar days
                    </td>
                    <td className="py-4 px-4 text-center">
                      <p className="font-bold text-slate-800 font-mono">₹{weighted.toLocaleString('en-IN')}</p>
                      <p className="text-[9px] text-slate-400">weighted {probPercent}%</p>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-800 font-bold text-xs">
                      ₹{deal.value.toLocaleString('en-IN')}
                    </td>
                  </tr>
                );
              })}

              {visibleDeals.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                    No active raw deals logged inside ledger search limits.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
