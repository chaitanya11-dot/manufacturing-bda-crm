import React, { useState, useEffect } from 'react';
import { API } from '../services/api.js';
import { Lead, Activity, Communication, User, Product, Client } from '../types.js';
import { Phone, Mail, MapPin, Tag, Building2, Clock, CheckCircle, Plus, Send, AlertTriangle, FileText, ChevronRight } from 'lucide-react';

interface LeadDetailProps {
  leadId: string;
  user: User;
  onNavigate: (route: string, params?: any) => void;
}

export default function LeadDetail({ leadId, user, onNavigate }: LeadDetailProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [timeline, setTimeline] = useState<Activity[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [comms, setComms] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Right tab selector
  const [activeTab, setActiveTab] = useState<'timeline' | 'comms' | 'convert'>('timeline');

  // Inline inputs state
  const [isEditing, setIsEditing] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [designation, setDesignation] = useState('');
  const [notes, setNotes] = useState('');
  const [estimatedValue, setEstimatedValue] = useState('');
  const [priority, setPriority] = useState<Lead['priority']>('warm');

  // Communication Log Form State
  const [commType, setCommType] = useState<Communication['type']>('call');
  const [commDirection, setCommDirection] = useState<Communication['direction']>('outbound');
  const [commSubject, setCommSubject] = useState('');
  const [commBody, setCommBody] = useState('');
  const [commDuration, setCommDuration] = useState('');
  const [commOutcome, setCommOutcome] = useState<Communication['outcome']>('neutral');
  const [commNextAction, setCommNextAction] = useState('');
  const [commNextActionDate, setCommNextActionDate] = useState('');

  // Conversion Fields State
  const [clientType, setClientType] = useState<Client['type']>('oem');
  const [clientGstin, setClientGstin] = useState('');
  const [clientPan, setClientPan] = useState('');
  const [clientTerms, setClientTerms] = useState('Net 60');
  const [clientLimit, setClientLimit] = useState('5000000');

  useEffect(() => {
    async function loadLeadDetails() {
      try {
        setLoading(true);
        const [obj, actList, prodList, commsList] = await Promise.all([
          API.leads.get(leadId),
          API.leads.getActivities(leadId),
          API.products.list(),
          API.communications.list()
        ]);
        setLead(obj);
        setTimeline(actList);
        setProducts(prodList);
        
        // Filter communication instances mapped to this lead
        setComms(commsList.filter(c => c.lead === leadId));

        // Sync inputs
        setCompanyName(obj.companyName);
        setContactName(obj.contactName);
        setContactEmail(obj.contactEmail);
        setContactPhone(obj.contactPhone);
        setDesignation(obj.designation || '');
        setNotes(obj.notes || '');
        setEstimatedValue(String(obj.estimatedValue || 0));
        setPriority(obj.priority);
      } catch (err) {
        console.error('Failed to load single lead coordinate details page:', err);
      } finally {
        setLoading(false);
      }
    }

    if (leadId) {
      loadLeadDetails();
    }
  }, [leadId]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    try {
      const updated = await API.leads.update(lead._id, {
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        designation,
        notes,
        estimatedValue: Number(estimatedValue || 0),
        priority
      });
      setLead(updated);
      setIsEditing(false);

      // Log assignment change implicitly
      const newAct = await API.leads.logActivity(lead._id, {
        type: 'note',
        description: `CRM Associate modified contact coordinates on profile page.`
      });
      setTimeline([newAct, ...timeline]);
    } catch {
      alert('Failed to synchronize profiles. Verify credentials.');
    }
  };

  const handleLogInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead || !commSubject || !commBody) {
      alert('Please fill out interaction subject and notes description.');
      return;
    }

    try {
      const createdComm = await API.communications.create({
        type: commType,
        direction: commDirection,
        subject: commSubject,
        body: commBody,
        summary: commSubject,
        lead: lead._id,
        contactName: lead.contactName,
        contactEmail: lead.contactEmail,
        contactPhone: lead.contactPhone,
        duration: Number(commDuration || 0),
        outcome: commOutcome,
        nextAction: commNextAction || undefined,
        nextActionDate: commNextActionDate || undefined
      });

      // Reset form fields
      setCommSubject('');
      setCommBody('');
      setCommDuration('');
      setCommNextAction('');
      setCommNextActionDate('');

      // Reload comm history and timeline
      const [actList, commsList] = await Promise.all([
        API.leads.getActivities(lead._id),
        API.communications.list()
      ]);
      setTimeline(actList);
      setComms(commsList.filter(c => c.lead === lead._id));

      // Auto update next follow up date on lead locally if provided
      if (commNextActionDate) {
        const uLead = await API.leads.update(lead._id, { nextFollowUp: commNextActionDate });
        setLead(uLead);
      }

      alert('Interaction successfully logged.');
    } catch {
      alert('Failed to register communication record on history.');
    }
  };

  const handleConvertToCustomer = async () => {
    if (!lead) return;
    if (confirm(`Promote "${lead.companyName}" to our Active Client list and clear current lead tracking?`)) {
      try {
        // Create matching Client corporate record
        const clientObj = await API.clients.create({
          companyName: lead.companyName,
          type: clientType,
          gstin: clientGstin || undefined,
          pan: clientPan || undefined,
          primaryContact: {
            name: lead.contactName,
            email: lead.contactEmail,
            phone: lead.contactPhone,
            designation: lead.designation || 'Specialist'
          },
          billingAddress: {
            street: 'Sourcing address corporate, India',
            city: lead.city || 'Mumbai',
            state: lead.state || 'Maharashtra',
            pincode: '400001',
            country: lead.country || 'India'
          },
          accountManager: lead.assignedTo,
          status: 'active',
          paymentTerms: clientTerms,
          creditLimit: Number(clientLimit || 1000000)
        });

        // Upgrade lead pipeline stage
        await API.leads.updateStage(lead._id, 'closed_won');

        // Automatically create initial Deal for this newly won client using estimated value
        await API.deals.create({
          dealName: `${lead.companyName} Sourcing Contract`,
          client: clientObj._id,
          lead: lead._id,
          value: lead.estimatedValue,
          products: [],
          moq: lead.moq || 100,
          leadTime: 14,
          stage: 'closed_won'
        });

        alert('Account Successfully Converted! Promoted contact to active directory & built Won Sales Deal.');
        onNavigate('clients', { id: clientObj._id });
      } catch (err: any) {
        alert(err.message || 'Operation failed. Client profile validation error.');
      }
    }
  };

  // Quick inline stage upgrade stepper
  const handleStageStepperUpdate = async (st: Lead['stage']) => {
    if (!lead) return;
    try {
      const updated = await API.leads.updateStage(lead._id, st);
      setLead(updated);
      const actList = await API.leads.getActivities(lead._id);
      setTimeline(actList);
    } catch {
      alert('Access denied.');
    }
  };

  const STAGES_ORDERED: Array<Lead['stage']> = [
    'new', 'contacted', 'qualified', 'rfq_sent', 'sample_trial', 'negotiation', 'po_received'
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-20 text-slate-400 font-medium">
        <AlertTriangle className="h-10 w-10 text-red-500 mx-auto mb-2" />
        <p>Lead profile coordinate could not be mapped on network.</p>
        <button onClick={() => onNavigate('leads')} className="mt-4 text-indigo-600 underline font-semibold text-xs">Back to database</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <button onClick={() => onNavigate('leads')} className="text-xs text-indigo-600 hover:underline font-bold mb-2 inline-block">
            ← Back to Leads directory
          </button>
          <h1 className="text-xl sm:text-2xl font-bold font-display text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6 text-slate-400 shrink-0" /> {lead.companyName}
          </h1>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Estimated value</span>
          <span className="text-base sm:text-xl font-bold font-mono text-slate-800">
            ₹{Number(lead.estimatedValue).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Stage Stepper Control Bar */}
      <div className="bg-white p-3.5 border border-slate-100 rounded-xl overflow-x-auto">
        <div className="flex items-center min-w-[700px] justify-between text-xs font-bold text-slate-400">
          {STAGES_ORDERED.map((st, i) => {
            const currentIdx = STAGES_ORDERED.indexOf(lead.stage);
            const isCompleted = STAGES_ORDERED.indexOf(st) < currentIdx;
            const isActive = lead.stage === st;

            return (
              <div key={st} className="flex-1 flex items-center">
                <button
                  onClick={() => handleStageStepperUpdate(st)}
                  className={`flex flex-col items-center transition-all px-2 text-center flex-1 ${
                    isActive ? 'text-indigo-600' : isCompleted ? 'text-emerald-600 hover:text-indigo-500' : 'hover:text-slate-600'
                  }`}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] mb-1.5 transition-all ${
                    isActive ? 'bg-indigo-600 text-white shadow-md' :
                    isCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isCompleted ? '✓' : i + 1}
                  </span>
                  <span className="capitalize tracking-tight whitespace-nowrap text-[10px] sm:text-xs">
                    {st.replace('_', ' ')}
                  </span>
                </button>
                {i < STAGES_ORDERED.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-slate-200 shrink-0 mx-1.5" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left detailed info, right transaction elements tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Profile coordinates card */}
        <div className="space-y-6">
          <div className="bg-white p-5 border border-slate-100 rounded-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <h2 className="text-sm font-bold tracking-tight text-slate-800 uppercase font-display">Target Client Demographics</h2>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs text-indigo-600 font-bold hover:underline"
              >
                {isEditing ? 'Discard' : 'Modify Profile'}
              </button>
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Company legal name</label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full border px-3 py-1.5 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Contact name</label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full border px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Designation</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full border px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Contact email</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full border px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Contact phone</label>
                    <input
                      type="text"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full border px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Est. value (INR)</label>
                    <input
                      type="number"
                      required
                      value={estimatedValue}
                      onChange={(e) => setEstimatedValue(e.target.value)}
                      className="w-full border px-3 py-1.5 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full border px-3 py-1.5 rounded-lg text-xs bg-white"
                    >
                      <option value="hot">🔴 HOT</option>
                      <option value="warm">🟡 WARM</option>
                      <option value="cold">🔵 COLD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Notes description</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="w-full border px-3 py-1.5 rounded-lg text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  Save changes
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-xs font-semibold text-slate-600">
                <div className="flex gap-3">
                  <Clock className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase tracking-wider">Procurement Status</p>
                    <span className="inline-block mt-1 font-bold text-slate-800 text-xs bg-indigo-50 border border-indigo-100 text-indigo-700 px-2 py-0.5 rounded uppercase">
                      {lead.stage.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Tag className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase tracking-wider">Priority ranking</p>
                    <span className="inline-block mt-1 font-bold text-slate-800 text-xs capitalize">
                      {lead.priority === 'hot' ? '🔴 HOT priority' : lead.priority === 'warm' ? '🟡 WARM priority' : '🔵 COLD reference'}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Building2 className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase tracking-wider">Primary contact rep</p>
                    <p className="text-slate-800 text-sm font-bold mt-0.5">{lead.contactName}</p>
                    <p className="text-slate-400 leading-tight">{lead.designation || 'Sourcing officer'}</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Mail className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase tracking-wider">Email address</p>
                    <a href={`mailto:${lead.contactEmail}`} className="text-indigo-600 font-bold hover:underline">{lead.contactEmail}</a>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Phone className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase tracking-wider">Phone number</p>
                    <p className="text-slate-800">{lead.contactPhone}</p>
                  </div>
                </div>

                <div className="flex gap-3 border-t border-slate-50 pt-3">
                  <MapPin className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-slate-400 text-[10px] uppercase tracking-wider">Plant headquarters Location</p>
                    <p className="text-slate-800">{lead.city || 'Faridabad'}, {lead.state || 'Haryana'}, {lead.country || 'India'}</p>
                  </div>
                </div>

                {lead.notes && (
                  <div className="border-t border-slate-50 pt-3">
                    <p className="text-slate-400 text-[10px] uppercase mb-1">Log book remarks</p>
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 italic">
                      "{lead.notes}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Tab widgets */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tabs bar */}
          <div className="flex border-b border-slate-100 gap-4 text-xs font-bold text-slate-400">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`pb-2.5 px-1 border-b-2 transition-all ${
                activeTab === 'timeline' ? 'text-indigo-600 border-indigo-600' : 'border-transparent hover:text-slate-600'
              }`}
            >
              Activity Timeline History ({timeline.length})
            </button>
            <button
              onClick={() => setActiveTab('comms')}
              className={`pb-2.5 px-1 border-b-2 transition-all ${
                activeTab === 'comms' ? 'text-indigo-600 border-indigo-600' : 'border-transparent hover:text-slate-600'
              }`}
            >
              Log Client Interaction
            </button>
            <button
              onClick={() => setActiveTab('convert')}
              className={`pb-2.5 px-1 border-b-2 transition-all ${
                activeTab === 'convert' ? 'text-indigo-600 border-indigo-600' : 'border-transparent hover:text-slate-600'
              }`}
            >
              Convert to Active Client
            </button>
          </div>

          {/* Timeline Tab */}
          {activeTab === 'timeline' && (
            <div className="bg-white p-5 border border-slate-100 rounded-2xl relative">
              <h2 className="text-sm font-bold tracking-tight text-slate-800 mb-4 font-display uppercase">Timeline Logs Feed</h2>
              {timeline.length > 0 ? (
                <div className="relative border-l border-slate-100 pl-4 ml-2.5 space-y-4">
                  {timeline.map((act) => (
                    <div key={act._id} className="relative text-xs text-slate-600">
                      <span className="absolute -left-[21px] top-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 ring-4 ring-white shadow-xs" />
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <p className="font-bold text-slate-700 leading-tight">
                          {act.description}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {new Date(act.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400 italic">No notes logged yet. Log some calls inside interaction tab.</div>
              )}
            </div>
          )}

          {/* Log interaction Tab */}
          {activeTab === 'comms' && (
            <div className="bg-white p-5 border border-slate-100 rounded-2xl">
              <h3 className="text-sm font-bold text-slate-800 mb-4 font-display uppercase">Log interaction event on timeline</h3>
              <form onSubmit={handleLogInteraction} className="space-y-4 text-xs font-semibold text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Channel</label>
                    <select
                      value={commType}
                      onChange={(e) => setCommType(e.target.value as any)}
                      className="w-full border px-3 py-1.5 rounded-lg text-xs bg-white"
                    >
                      <option value="call">📞 Phone Call</option>
                      <option value="email">✉️ Outbound Email</option>
                      <option value="meeting">🤝 Head-to-Head Meeting</option>
                      <option value="whatsapp">📱 Whatsapp / SMS</option>
                      <option value="visit">🏭 Field Plant Visit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Direction</label>
                    <select
                      value={commDirection}
                      onChange={(e) => setCommDirection(e.target.value as any)}
                      className="w-full border px-3 py-1.5 rounded-lg text-xs bg-white"
                    >
                      <option value="outbound">Outbound (Associate Lead)</option>
                      <option value="inbound">Inbound (Client Response)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Call Duration (Minutes)</label>
                    <input
                      type="number"
                      value={commDuration}
                      onChange={(e) => setCommDuration(e.target.value)}
                      placeholder="e.g., 12"
                      className="w-full border px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Subject title *</label>
                    <input
                      type="text"
                      required
                      value={commSubject}
                      onChange={(e) => setCommSubject(e.target.value)}
                      placeholder="e.g., Cylinder design specification review"
                      className="w-full border px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Interaction Outcome *</label>
                    <select
                      value={commOutcome}
                      onChange={(e) => setCommOutcome(e.target.value as any)}
                      className="w-full border px-3 py-1.5 rounded-lg text-xs bg-white"
                    >
                      <option value="positive">🟢 Highly Positive - High interest</option>
                      <option value="neutral">🟡 Neutral - Reviewing material</option>
                      <option value="negative">🔴 Negative/No-Answer - Postponed</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Interactive Log Notes details *</label>
                  <textarea
                    required
                    value={commBody}
                    onChange={(e) => setCommBody(e.target.value)}
                    placeholder="Log summary of talking points, procurement objections, or delivery requirements..."
                    rows={4}
                    className="w-full border px-3 py-1.5 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-50 pt-3">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Planned action follow-up</label>
                    <input
                      type="text"
                      value={commNextAction}
                      onChange={(e) => setCommNextAction(e.target.value)}
                      placeholder="e.g., Ship metal sample to Pune Lab"
                      className="w-full border px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Follow-up trigger date</label>
                    <input
                      type="date"
                      value={commNextActionDate}
                      onChange={(e) => setCommNextActionDate(e.target.value)}
                      className="w-full border px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" /> Log Event To History
                </button>
              </form>
            </div>
          )}

          {/* Convert to Customer Tab */}
          {activeTab === 'convert' && (
            <div className="bg-white p-5 border border-slate-100 rounded-2xl relative space-y-4">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex gap-3 text-xs leading-normal font-semibold text-indigo-800">
                <CheckCircle className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-indigo-950 text-sm">Industrial Account Conversion Suite</p>
                  <p className="mt-1">
                    Converting this lead will list the company inside our active **Clients accounts registry**, open up payment credit parameters, and automatically create a **Won Sourcing Deal** based on the estimated value of ₹{Number(lead.estimatedValue).toLocaleString('en-IN')}.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 pt-2">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Company segment classification</label>
                  <select
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value as any)}
                    className="w-full border px-3 py-2 rounded-lg bg-white"
                  >
                    <option value="oem">Direct Manufacturer (OEM)</option>
                    <option value="distributor">Wholesale Distributor Network</option>
                    <option value="direct">Direct Industrial Purchaser</option>
                    <option value="government">Enterprise Government contractor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Corporate GSTIN (India context)</label>
                  <input
                    type="text"
                    value={clientGstin}
                    onChange={(e) => {
                      setClientGstin(e.target.value);
                      if (e.target.value.length >= 10) setClientPan(e.target.value.substring(2, 12));
                    }}
                    placeholder="e.g., 27AACCT4104P1Z4"
                    className="w-full border px-3 py-2 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Corporate PAN Code</label>
                  <input
                    type="text"
                    value={clientPan}
                    onChange={(e) => setClientPan(e.target.value)}
                    placeholder="e.g., AACCT4104P"
                    className="w-full border px-3 py-2 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Standard Payment terms</label>
                  <select
                    value={clientTerms}
                    onChange={(e) => setClientTerms(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg bg-white"
                  >
                    <option value="Net 30">Net 30 commercial terms</option>
                    <option value="Net 45">Net 45 commercial terms</option>
                    <option value="Net 60">Net 60 OEM standard terms</option>
                    <option value="Net 90">Net 90 defense government standard terms</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Sourcing Credit Limit (INR)</label>
                  <input
                    type="number"
                    value={clientLimit}
                    onChange={(e) => setClientLimit(e.target.value)}
                    className="w-full border px-3 py-2 rounded-lg font-bold font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <button
                  type="button"
                  onClick={handleConvertToCustomer}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 flex justify-center items-center gap-1 text-white rounded-lg text-xs font-bold transition-shadow hover:shadow-lg shadow-emerald-100"
                >
                  <CheckCircle className="h-4 w-4" /> Finalize Promotion & Convert
                </button>
              </div>
            </div>
          )}

          {/* Communications log history */}
          {comms.length > 0 && (
            <div className="bg-white p-5 border border-slate-100 rounded-2xl relative space-y-4">
              <h2 className="text-sm font-bold tracking-tight text-slate-800 uppercase font-display">Historical Log Entries List</h2>
              <div className="space-y-3.5 max-h-64 overflow-y-auto pr-1">
                {comms.map((item) => (
                  <div key={item._id} className="p-3.5 border border-slate-100 hover:bg-slate-50/50 rounded-xl transition-all text-xs font-semibold">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-800 text-xs truncate max-w-[200px]">{item.subject}</span>
                      <span className="text-[10px] font-bold text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded-sm">
                        {item.type} • {item.direction}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-normal italic text-[11px] mb-2 font-medium">"{item.body}"</p>
                    {item.nextAction && (
                      <p className="text-[10px] text-amber-600 font-bold">🎯 Follow-up: {item.nextAction} [by {item.nextActionDate ? new Date(item.nextActionDate).toLocaleDateString() : 'Unscheduled'}]</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
