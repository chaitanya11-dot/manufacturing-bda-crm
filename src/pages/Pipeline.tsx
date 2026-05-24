import React, { useState, useEffect } from 'react';
import { API } from '../services/api.js';
import { Lead, User } from '../types.js';
import { Phone, Mail, ChevronRight, AlertTriangle, Calendar, UserCheck, RefreshCw } from 'lucide-react';

interface PipelineProps {
  user: User;
  onNavigate: (route: string, params?: any) => void;
}

interface Column {
  id: Lead['stage'];
  title: string;
  color: string;
}

export default function Pipeline({ user, onNavigate }: PipelineProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedBDA, setSelectedBDA] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedInterest, setSelectedInterest] = useState<string>('');

  const loadPipeline = async () => {
    try {
      setLoading(true);
      const [leadsList, usersList] = await Promise.all([
        API.leads.list(),
        user.role !== 'bda' ? API.users.list() : Promise.resolve([])
      ]);
      setLeads(leadsList);
      setUsers(usersList);
    } catch (err) {
      console.error('Failed to load CRM pipeline:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  // 7 core stages sequence matching spec
  const COLUMNS: Column[] = [
    { id: 'new', title: 'New Leads', color: 'border-t-slate-400 bg-slate-50/50' },
    { id: 'contacted', title: 'Contacted', color: 'border-t-blue-400 bg-blue-50/10' },
    { id: 'qualified', title: 'Qualified', color: 'border-t-indigo-400 bg-indigo-50/10' },
    { id: 'rfq_sent', title: 'RFQ Sent', color: 'border-t-amber-400 bg-amber-50/10' },
    { id: 'sample_trial', title: 'Sample Trial', color: 'border-t-purple-400 bg-purple-50/10' },
    { id: 'negotiation', title: 'Negotiation', color: 'border-t-orange-400 bg-orange-50/10' },
    { id: 'po_received', title: 'PO Received', color: 'border-t-emerald-400 bg-emerald-50/10' }
  ];

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStage: Lead['stage']) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (!leadId) return;

    // Guard update locally first
    const updatedLeads = leads.map(l => {
      if (l._id === leadId) {
        return { ...l, stage: targetStage, updatedAt: new Date().toISOString() };
      }
      return l;
    });
    setLeads(updatedLeads);

    try {
      await API.leads.updateStage(leadId, targetStage);
    } catch (err) {
      console.error('Failed to update stage on database sync:', err);
      // Revert if error
      loadPipeline();
    }
  };

  // Quick drag status update
  const quickMoveStage = async (id: string, next: Lead['stage']) => {
    const updated = leads.map(l => (l._id === id ? { ...l, stage: next } : l));
    setLeads(updated);
    try {
      await API.leads.updateStage(id, next);
    } catch {
      loadPipeline();
    }
  };

  // Computed Values
  const getColItems = (stage: Lead['stage']) => {
    return leads.filter(l => {
      if (l.stage !== stage) return false;
      if (selectedBDA && l.assignedTo !== selectedBDA) return false;
      if (selectedPriority && l.priority !== selectedPriority) return false;
      if (selectedInterest && !l.productInterest.includes(selectedInterest)) return false;
      return true;
    });
  };

  // Rotting check: returns true if lead has no update (updatedAt) in >7 days
  const isRotting = (updatedAt: string) => {
    const lastUpdate = new Date(updatedAt).getTime();
    const now = Date.now();
    const daysSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 7;
  };

  // Helper: calculate days in current stage
  const getDaysInStage = (createdAt: string) => {
    const start = new Date(createdAt).getTime();
    const elapsed = Date.now() - start;
    return Math.floor(elapsed / (1000 * 60 * 60 * 24));
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight">Active Accounts Pipeline</h1>
          <p className="text-sm text-slate-500 mt-0.5">Drag & drop leads between manufacturing procurement stages.</p>
        </div>
        <button
          onClick={loadPipeline}
          className="p-2 text-slate-500 hover:text-indigo-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all flex items-center gap-1 text-xs font-semibold shrink-0"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reload Board
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-700 shadow-sm text-left">
        {user.role !== 'bda' && (
          <div>
            <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1">Assigned BDA Associate</label>
            <select
              value={selectedBDA}
              onChange={(e) => setSelectedBDA(e.target.value)}
              className="w-full border border-slate-200 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            >
              <option value="">All Field Associates</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.role.toUpperCase()})</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1">Priority Class</label>
          <select
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            className="w-full border border-slate-200 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="">All Priorities</option>
            <option value="hot">🔴 Hot Priority</option>
            <option value="warm">🟡 Warm Priority</option>
            <option value="cold">🔵 Cold Priority</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 uppercase tracking-widest text-[9px] mb-1">SKU Interest</label>
          <select
            value={selectedInterest}
            onChange={(e) => setSelectedInterest(e.target.value)}
            className="w-full border border-slate-200 rounded-lg py-1.5 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
          >
            <option value="">Any SKU Catalog Item</option>
            <option value="PSG-102">Precision Steel Gears (PSG-102)</option>
            <option value="AGA-505">Automotive Alternators (AGA-505)</option>
            <option value="HDC-982">Heavy Duty Hydraulic Cylinders (HDC-982)</option>
            <option value="CMG-240">Custom Molded Gaskets (CMG-240)</option>
            <option value="HTF-011">High-Tensile Titanium Fasteners (HTF-011)</option>
          </select>
        </div>
      </div>

      {/* Kanban Board Shell */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1200px] h-[640px]">
          {COLUMNS.map((col) => {
            const items = getColItems(col.id);
            const totalEstVal = items.reduce((sum, item) => sum + (item.estimatedValue || 0), 0);

            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`flex-1 flex flex-col rounded-xl border border-slate-200 ${col.color} p-3 h-full`}
              >
                {/* Column Header */}
                <div className="flex justify-between items-center mb-3 text-left">
                  <h3 className="text-xs font-bold text-slate-800 tracking-tight uppercase font-display">{col.title}</h3>
                  <span className="text-[10px] font-bold bg-white shadow-xs px-2 py-0.5 rounded-full text-slate-500 border border-slate-200">
                    {items.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 py-1">
                  {items.map((lead) => {
                    const rotting = isRotting(lead.updatedAt);
                    const ageDays = getDaysInStage(lead.createdAt);

                    return (
                      <div
                        key={lead._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, lead._id)}
                        className={`bg-white p-3 border rounded-lg hover:shadow-md transition-all active:cursor-grabbing cursor-grab relative flex flex-col gap-2 ${
                          rotting ? 'border-red-400 ring-2 ring-red-50/50' : 'border-slate-200 shadow-xs'
                        }`}
                      >
                        {/* Rotting warning tag */}
                        {rotting && (
                          <div className="flex items-center gap-1 bg-red-50 text-red-700 text-[9px] font-bold px-2 py-0.5 rounded-sm shrink-0">
                            <AlertTriangle className="h-3 w-3" /> STALE {">"} 7 DAYS NO UPDATE
                          </div>
                        )}

                        {/* Card details */}
                        <div onClick={() => onNavigate('leads', { id: lead._id })} className="space-y-1.5 cursor-pointer">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="font-bold text-slate-800 text-[13px] leading-tight hover:text-indigo-600 transition-colors uppercase">
                              {lead.companyName}
                            </h4>
                            <span className={`px-1.5 py-0.5 rounded-sm text-[9px] font-extrabold shrink-0 uppercase ${
                              lead.priority === 'hot' ? 'bg-red-50 text-red-600' :
                              lead.priority === 'warm' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                            }`}>
                              {lead.priority}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 font-medium">
                            {lead.contactName} • {lead.designation || 'Buyer'}
                          </p>
                        </div>

                        {/* Stats / Interest badge rows */}
                        <div className="flex flex-wrap gap-1">
                          {lead.productInterest.slice(0, 2).map((sku) => (
                            <span key={sku} className="text-[9px] font-bold font-mono text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-sm px-1.5 py-0.5">
                              {sku}
                            </span>
                          ))}
                        </div>

                        {/* Timeline trigger summaries */}
                        <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold border-t border-slate-50 pt-2.5">
                          <span>Age: {ageDays ?? 0} days</span>
                          {lead.nextFollowUp ? (
                            <span className="flex items-center gap-0.5 text-amber-600">
                              <Calendar className="h-3 w-3" /> {new Date(lead.nextFollowUp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                          ) : (
                            <span className="text-slate-300">No followup due</span>
                          )}
                        </div>

                        {/* Card Quick Actions control line */}
                        <div className="flex justify-between items-center border-t border-slate-50 pt-2.5 mt-0.5">
                          <div className="flex gap-1.5">
                            <a
                              href={`tel:${lead.contactPhone}`}
                              title="Trigger Call Log Dialog"
                              onClick={(e) => { e.stopPropagation(); onNavigate('leads', { id: lead._id, action: 'call' }); }}
                              className="p-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 rounded-md transition-colors"
                            >
                              <Phone className="h-3.5 w-3.5" />
                            </a>
                            <a
                              href={`mailto:${lead.contactEmail}`}
                              title="Draft standard template email envelope"
                              onClick={(e) => { e.stopPropagation(); onNavigate('leads', { id: lead._id, action: 'email' }); }}
                              className="p-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 text-slate-400 rounded-md transition-colors"
                            >
                              <Mail className="h-3.5 w-3.5" />
                            </a>
                          </div>

                          <button
                            onClick={() => {
                              // Fast sequential stage shift
                              const curIdx = COLUMNS.findIndex(col => col.id === lead.stage);
                              if (curIdx !== -1 && curIdx < COLUMNS.length - 1) {
                                quickMoveStage(lead._id, COLUMNS[curIdx + 1].id);
                              }
                            }}
                            className="text-[10px] font-bold text-slate-500 hover:text-indigo-600 flex items-center transition-all bg-slate-50 hover:bg-slate-100 rounded px-1.5 py-0.5 ml-auto text-right"
                          >
                            Advance <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {items.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-slate-200/50 rounded-xl flex items-center justify-center text-slate-400 text-xs">
                      Drop lead here
                    </div>
                  )}
                </div>

                {/* Column total Footer summary */}
                <div className="border-t border-slate-150 pt-2 text-[10px] sm:text-xs font-semibold text-slate-400 flex flex-col gap-0.5 shrink-0">
                  <div className="flex justify-between">
                    <span>Active Cases:</span>
                    <span className="font-bold text-slate-600">{items.length} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Value Sum:</span>
                    <span className="font-bold text-slate-700 font-mono">₹{totalEstVal.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
