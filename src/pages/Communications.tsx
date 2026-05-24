import React, { useState, useEffect } from 'react';
import { API } from '../services/api.js';
import { Communication, Lead } from '../types.js';
import { MessageSquare, Phone, Mail, Calendar, Filter, Sparkles, Send } from 'lucide-react';

export default function Communications() {
  const [comms, setComms] = useState<Communication[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Email draft helper state
  const [showDraftBox, setShowDraftBox] = useState(false);
  const [draftTo, setDraftTo] = useState('');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftBody, setDraftBody] = useState('');
  const [draftCategory, setDraftCategory] = useState('intro');

  const loadCommunicationsHistory = async () => {
    try {
      setLoading(true);
      const [commsList, leadsList] = await Promise.all([
        API.communications.list(),
        API.leads.list()
      ]);
      setComms(commsList);
      setLeads(leadsList);
    } catch (err) {
      console.error('Failed to parse communications histories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommunicationsHistory();
  }, []);

  const handleApplyEmailTemplate = (category: string) => {
    setDraftCategory(category);
    if (category === 'intro') {
      setDraftSubject('Subject: Apex Forge Sourcing Partnership Inquiry');
      setDraftBody(`Dear procurement team,

I am writing from Apex Forge Manufacturing. We engineer heavy-duty gears and precision cylinders with advanced tensile specifications mapping directly to your assembly lines. 

I would love to set up a quick 10-minute discovery call this Thursday to deliver our catalog and discuss standard commercial payment options.

With respect,
Apex Sales Operations`);
    } else if (category === 'rfq_follow') {
      setDraftSubject('Subject: Status Update: Sourced Price Quote Revision');
      setDraftBody(`Dear sourcing director,

Following up on the direct RFQ quotation we dispatched to Pune headquarters. 

We refined our internal billet prices to accommodate your MOQ requirements. Let us know if we should update the valid terms limit on this contract revision (V2).

Respectfully,
Commercial coordinator`);
    } else if (category === 'payment') {
      setDraftSubject('Subject: Pending Account Review: Sourcing credit update');
      setDraftBody(`Dear accounts partner,

The corporate credit limit calculations on your partner profile have been successfully finalized for immediate Net-60 billings. 

Please find the PAN/GSTIN registration copy enclosed in this record.

Sincerely,
System Operations`);
    }
  };

  const handleSendDraftedEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTo || !draftSubject || !draftBody) {
      alert('Please fill recipient email, subject headers, and body notes.');
      return;
    }

    try {
      // Find matching lead ID if recipient exists
      const matchLead = leads.find(l => l.contactEmail.toLowerCase() === draftTo.toLowerCase());

      await API.communications.create({
        type: 'email',
        direction: 'outbound',
        subject: draftSubject,
        body: draftBody,
        summary: draftSubject,
        lead: matchLead ? matchLead._id : undefined,
        contactName: matchLead ? matchLead.contactName : 'Direct Corporate Rep',
        contactEmail: draftTo,
        outcome: 'neutral'
      });

      // Clear layout state variables
      setDraftTo('');
      setDraftSubject('');
      setDraftBody('');
      setShowDraftBox(false);

      const commsList = await API.communications.list();
      setComms(commsList);
      alert('Email drafted and registered successfully in logs archive.');
    } catch {
      alert('Failed to record template draft interaction.');
    }
  };

  const getFilteredComms = () => {
    return comms.filter(c => {
      const matchesSearch =
        c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.body.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contactEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter ? c.type === typeFilter : true;
      return matchesSearch && matchesType;
    });
  };

  const visibleComms = getFilteredComms();

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
      <div className="flex justify-between items-center pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight text-left">CRM Interaction Centre</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">Trace conversation logs, trigger email drafts, or review outcomes.</p>
        </div>
        <button
          onClick={() => { setShowDraftBox(!showDraftBox); handleApplyEmailTemplate('intro'); }}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs hover:shadow-md transition-all flex items-center gap-1 shrink-0"
        >
          {showDraftBox ? 'Close Composer Panel' : 'Draft Email Template'}
        </button>
      </div>

      {/* Interactive Email template draft composer */}
      {showDraftBox && (
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-md space-y-4 text-left">
          <div className="flex justify-between items-center border-b pb-2.5">
            <h2 className="text-xs font-bold text-indigo-700 uppercase font-display flex items-center gap-1.5">
              <Sparkles className="h-4.5 w-4.5" /> Corporate outbound email composer
            </h2>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => handleApplyEmailTemplate('intro')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-sm border ${draftCategory === 'intro' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 text-slate-600'}`}
              >
                Intro pitch
              </button>
              <button
                type="button"
                onClick={() => handleApplyEmailTemplate('rfq_follow')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-sm border ${draftCategory === 'rfq_follow' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 text-slate-600'}`}
              >
                RFQ follow-up
              </button>
              <button
                type="button"
                onClick={() => handleApplyEmailTemplate('payment')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-sm border ${draftCategory === 'payment' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 text-slate-600'}`}
              >
                Credit review
              </button>
            </div>
          </div>

          <form onSubmit={handleSendDraftedEmail} className="space-y-4 text-xs font-semibold text-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase mb-1">Corporate Client Recipient Email *</label>
                <select
                  required
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  className="w-full border px-3 py-1.5 rounded-lg bg-white text-xs"
                >
                  <option value="">Select target corporate contact recipient...</option>
                  {leads.map(l => (
                    <option key={l._id} value={l.contactEmail}>{l.companyName} — {l.contactName} ({l.contactEmail})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase mb-1">Email Subject Header *</label>
                <input
                  required
                  type="text"
                  value={draftSubject}
                  onChange={(e) => setDraftSubject(e.target.value)}
                  className="w-full border px-3 py-1.5 rounded-lg text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] uppercase mb-1">Mail notes description *</label>
              <textarea
                required
                value={draftBody}
                onChange={(e) => setDraftBody(e.target.value)}
                rows={5}
                className="w-full border px-3 py-1.5 rounded-lg text-xs font-sans whitespace-pre-wrap font-medium text-slate-800"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowDraftBox(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-50 font-bold rounded"
              >
                Discard Composer
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold transition-all flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" /> Log Sent Template
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main CRM conversation filter log book */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl flex flex-col sm:flex-row gap-4 items-center shadow-sm text-left">
        <div className="w-full sm:flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Filter className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search communications logs by keywords or email domains..."
            className="w-full pl-10 pr-3 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg text-xs"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-44 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-xs font-semibold text-slate-700"
        >
          <option value="">Any channel type</option>
          <option value="call">📞 Phone calls</option>
          <option value="email">✉️ Emails correspondence</option>
          <option value="meeting">🤝 Direct meetings</option>
          <option value="whatsapp">📱 Whatsapp / sms</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm text-left">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight font-display border-b border-slate-200 pb-2.5 text-left">CRM master communications history register</h2>
        
        {visibleComms.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
            {visibleComms.map((item) => (
              <div key={item._id} className="p-4 border border-slate-200 bg-slate-50/30 hover:bg-slate-50 rounded-lg transition-colors flex flex-col justify-between text-xs font-semibold">
                <div>
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <span className="font-bold text-slate-800 text-sm leading-tight uppercase">{item.subject}</span>
                    <span className="text-[9px] font-extrabold text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded-sm shrink-0">
                      {item.type} • {item.direction}
                    </span>
                  </div>
                  <p className="text-slate-450 text-[10px] mb-1">Representative: {item.contactName} • {item.contactEmail}</p>
                  <p className="text-slate-650 leading-normal italic text-[11px] mb-2 font-medium">"{item.body}"</p>
                </div>
                
                <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-400">
                  <span>Logged outline: {item.outcome?.toUpperCase() || 'NEUTRAL'}</span>
                  {item.nextActionDate && (
                    <span className="text-amber-600 font-bold">Follow up limit: {item.nextActionDate}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-450 italic">No communication logs recorded on database server yet. Use template composer to compile records.</div>
        )}
      </div>
    </div>
  );
}
