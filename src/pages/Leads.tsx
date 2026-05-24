import React, { useState, useEffect } from 'react';
import { API } from '../services/api.js';
import { Lead, User } from '../types.js';
import { Search, Plus, Filter, UserPlus, Eye, Trash2, Calendar, FileSpreadsheet, X } from 'lucide-react';

interface LeadsProps {
  user: User;
  onNavigate: (route: string, params?: any) => void;
}

export default function Leads({ user, onNavigate }: LeadsProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  // Slide Over state
  const [isSlideOpen, setIsSlideOpen] = useState(false);
  const [formCompany, setFormCompany] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formDesignation, setFormDesignation] = useState('');
  const [formEstValue, setFormEstValue] = useState('');
  const [formPriority, setFormPriority] = useState<Lead['priority']>('warm');
  const [formSource, setFormSource] = useState<Lead['leadSource']>('linkedin');
  const [formMOQ, setFormMOQ] = useState('100');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [formNotes, setFormNotes] = useState('');

  // Pagination parameters
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const loadLeadsData = async () => {
    try {
      setLoading(true);
      const [leadsList, usersList] = await Promise.all([
        API.leads.list(),
        user.role !== 'bda' ? API.users.list() : Promise.resolve([])
      ]);
      setLeads(leadsList);
      setUsers(usersList);
    } catch (err) {
      console.error('Failed to parse leads catalog list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeadsData();
  }, []);

  // Filter computations
  const getFilteredLeads = () => {
    return leads.filter(l => {
      const matchesSearch =
        l.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStage = stageFilter ? l.stage === stageFilter : true;
      const matchesPriority = priorityFilter ? l.priority === priorityFilter : true;
      return matchesSearch && matchesStage && matchesPriority;
    });
  };

  const filteredItems = getFilteredLeads();
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCompany || !formContactName || !formContactEmail || !formContactPhone) {
      alert('Please fill out all mandatory contact elements.');
      return;
    }

    try {
      await API.leads.create({
        companyName: formCompany,
        contactName: formContactName,
        contactEmail: formContactEmail,
        contactPhone: formContactPhone,
        designation: formDesignation,
        estimatedValue: Number(formEstValue || 0),
        priority: formPriority,
        leadSource: formSource,
        moq: Number(formMOQ),
        productInterest: selectedInterests,
        notes: formNotes
      });

      // Clear states
      setFormCompany('');
      setFormContactName('');
      setFormContactEmail('');
      setFormContactPhone('');
      setFormDesignation('');
      setFormEstValue('');
      setFormPriority('warm');
      setFormSource('linkedin');
      setFormMOQ('100');
      setSelectedInterests([]);
      setFormNotes('');
      setIsSlideOpen(false);

      loadLeadsData();
    } catch {
       alert('Operation failed. Please verify form inputs.');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (confirm('Delete this lead registration copy permanently? This is irreversible.')) {
      try {
        await API.leads.delete(id);
        loadLeadsData();
      } catch (err) {
        alert('Forbidden. Users without executive permissions cannot delete objects.');
      }
    }
  };

  const toggleInterest = (sku: string) => {
    if (selectedInterests.includes(sku)) {
      setSelectedInterests(selectedInterests.filter(i => i !== sku));
    } else {
      setSelectedInterests([...selectedInterests, sku]);
    }
  };

  const exportCSV = () => {
    const headers = ['Company', 'Contact', 'Email', 'Phone', 'Stage', 'Priority', 'Value', 'Score'];
    const rows = filteredItems.map(l => [
      l.companyName,
      l.contactName,
      l.contactEmail,
      l.contactPhone,
      l.stage,
      l.priority,
      l.estimatedValue,
      l.score
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `manufacturing_leads_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 relative">
      {/* Visual Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight">Accounts Lead Register</h1>
          <p className="text-sm text-slate-500 mt-0.5">Filter, search, or convert warm manufacturing sourcing contacts.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={exportCSV}
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 rounded-lg transition-all flex items-center gap-1.5"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export Filtered (.CSV)
          </button>
          <button
            onClick={() => setIsSlideOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs hover:shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Create Contact Lead
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl flex flex-col md:flex-row gap-4 items-center shadow-sm text-left">
        <div className="w-full md:flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search company, contact, or email..."
            className="w-full pl-10 pr-3 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg text-xs"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto font-semibold text-xs text-slate-700">
          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={stageFilter}
              onChange={(e) => { setStageFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent focus:outline-none"
            >
              <option value="">Any Stage</option>
              <option value="new">NEW</option>
              <option value="contacted">CONTACTED</option>
              <option value="qualified">QUALIFIED</option>
              <option value="rfq_sent">RFQ SENT</option>
              <option value="sample_trial">SAMPLE TRIAL</option>
              <option value="negotiation">NEGOTIATION</option>
              <option value="po_received">PO RECEIVED</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              className="bg-transparent focus:outline-none"
            >
              <option value="">Any Priority</option>
              <option value="hot">🔴 HOT</option>
              <option value="warm">🟡 WARM</option>
              <option value="cold">🔵 COLD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Shell */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-left">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-4">Company & Source</th>
                <th className="py-3.5 px-4">Contact Person</th>
                <th className="py-3.5 px-4 font-center">Lead Score</th>
                <th className="py-3.5 px-4">Current Stage</th>
                <th className="py-3.5 px-4">Estimated Capital</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
              {paginatedItems.map((lead) => (
                <tr key={lead._id} className="hover:bg-slate-50/40 transition-colors">
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-800 text-xs uppercase">{lead.companyName}</p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded-sm bg-slate-100 text-[9px] text-slate-400 font-bold capitalize">
                      {lead.leadSource.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <p className="font-bold text-slate-800">{lead.contactName}</p>
                    <p className="text-[10px] text-slate-400">{lead.contactEmail}</p>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-8 text-center text-[11px] font-bold font-mono px-1 py-0.5 rounded ${
                        lead.score >= 80 ? 'bg-emerald-50 text-emerald-700' :
                        lead.score >= 50 ? 'bg-indigo-50 text-indigo-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {lead.score}
                      </span>
                      <div className="w-16 bg-slate-150 h-1 rounded-full overflow-hidden shrink-0">
                        <div
                          className={`h-full ${
                            lead.score >= 80 ? 'bg-emerald-500' : lead.score >= 50 ? 'bg-indigo-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] capitalize font-bold ${
                      lead.stage === 'closed_won' || lead.stage === 'po_received' ? 'bg-emerald-50 text-emerald-700' :
                      lead.stage === 'closed_lost' ? 'bg-red-50 text-red-700' :
                      lead.stage === 'rfq_sent' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {lead.stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4 font-mono text-slate-800">
                    ₹{Number(lead.estimatedValue).toLocaleString('en-IN')}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onNavigate('leads', { id: lead._id })}
                        title="View Detailed Logs"
                        className="p-1 px-2.5 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 hover:border-indigo-200 rounded-lg transition-all flex items-center gap-1 shrink-0 font-bold"
                      >
                        <Eye className="h-3 w-3" /> Inspect Details
                      </button>
                      {(user.role === 'admin' || user.role === 'manager') && (
                        <button
                          onClick={() => handleDeleteLead(lead._id)}
                          className="p-1.5 text-red-600 bg-red-50 border border-red-100 hover:bg-red-100/50 rounded-lg transition-colors shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                    No leads discovered matching the filter coordinates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {filteredItems.length > itemsPerPage && (
          <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50 flex justify-between items-center text-xs font-semibold text-slate-500">
            <span>Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} records</span>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-2.5 py-1 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-2.5 py-1 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Slide-over Side Drawer Overlay for Quick Add Lead */}
      {isSlideOpen && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 bg-slate-900/60 transition-opacity backdrop-blur-xs" onClick={() => setIsSlideOpen(false)} />
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-md transform transition-all">
              <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl border-l border-slate-100 font-sans">
                {/* Header */}
                <div className="bg-indigo-600 py-6 px-4 sm:px-6 flex justify-between items-center text-white">
                  <div>
                    <h2 className="text-lg font-bold font-display tracking-tight">Register Procurement Lead</h2>
                    <p className="text-xs text-indigo-200 mt-0.5 font-medium">Add prospective industrial accounts manually.</p>
                  </div>
                  <button onClick={() => setIsSlideOpen(false)} className="rounded-md hover:bg-indigo-500 p-1.5 transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Form fields */}
                <form className="flex-1 py-6 px-4 sm:px-6 space-y-4" onSubmit={handleCreateLead}>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Company legal name *</label>
                    <input
                      required
                      type="text"
                      value={formCompany}
                      onChange={(e) => setFormCompany(e.target.value)}
                      placeholder="e.g., Godrej Aerospace Ltd."
                      className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Contact Name *</label>
                      <input
                        required
                        type="text"
                        value={formContactName}
                        onChange={(e) => setFormContactName(e.target.value)}
                        placeholder="e.g., Rohan Kapoor"
                        className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Designation</label>
                      <input
                        type="text"
                        value={formDesignation}
                        onChange={(e) => setFormDesignation(e.target.value)}
                        placeholder="e.g., Sourcing lead"
                        className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Contact Email *</label>
                      <input
                        required
                        type="email"
                        value={formContactEmail}
                        onChange={(e) => setFormContactEmail(e.target.value)}
                        placeholder="rohan@godrej.com"
                        className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Contact Phone *</label>
                      <input
                        required
                        type="text"
                        value={formContactPhone}
                        onChange={(e) => setFormContactPhone(e.target.value)}
                        placeholder="+91 99887 76655"
                        className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Est. Value (INR) *</label>
                      <input
                        required
                        type="number"
                        value={formEstValue}
                        onChange={(e) => setFormEstValue(e.target.value)}
                        placeholder="e.g., 3500000"
                        className="w-full text-xs font-bold font-mono px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">MOQ Limit</label>
                      <input
                        type="number"
                        value={formMOQ}
                        onChange={(e) => setFormMOQ(e.target.value)}
                        defaultValue="100"
                        className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pb-2">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Lead Source</label>
                      <select
                        value={formSource}
                        onChange={(e) => setFormSource(e.target.value as any)}
                        className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                      >
                        <option value="cold_call">☎️ Cold Call</option>
                        <option value="email">✉️ Direct Email</option>
                        <option value="linkedin">🌐 LinkedIn</option>
                        <option value="trade_show">🎪 Trade Show</option>
                        <option value="referral">👥 Referral</option>
                        <option value="website">💻 Corporate Website</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Priority Badge</label>
                      <select
                        value={formPriority}
                        onChange={(e) => setFormPriority(e.target.value as any)}
                        className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                      >
                        <option value="hot">🔴 HOT</option>
                        <option value="warm">🟡 WARM</option>
                        <option value="cold">🔵 COLD</option>
                      </select>
                    </div>
                  </div>

                  {/* Catalog SKU selection capsules */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Product SKUs interest selection</label>
                    <div className="flex flex-wrap gap-1.5">
                      {['PSG-102', 'AGA-505', 'HDC-982', 'CMG-240', 'HTF-011'].map((sku) => {
                        const isSelected = selectedInterests.includes(sku);
                        return (
                          <button
                            key={sku}
                            type="button"
                            onClick={() => toggleInterest(sku)}
                            className={`px-2.5 py-1 text-[11px] rounded-lg font-bold font-mono transition-all border ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {sku}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Background Information notes</label>
                    <textarea
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Add introductory meeting details..."
                      rows={3}
                      className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSlideOpen(false)}
                      className="flex-1 py-2 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                    >
                      Build Lead Record
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
