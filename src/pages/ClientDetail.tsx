import React, { useState, useEffect } from 'react';
import { API } from '../services/api.js';
import { Client, Deal, Communication, RFQ } from '../types.js';
import { FileText, Plus, Landmark, Users, Clock, ShieldCheck, Mail, Phone, ChevronRight, DollarSign } from 'lucide-react';

interface ClientDetailProps {
  clientId: string;
  onNavigate: (route: string, params?: any) => void;
}

export default function ClientDetail({ clientId, onNavigate }: ClientDetailProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [comms, setComms] = useState<Communication[]>([]);
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);

  // Contacts addition form overlay
  const [showAddContact, setShowAddContact] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactDesignation, setContactDesignation] = useState('');

  const loadClientDetails = async () => {
    try {
      setLoading(true);
      const [clientObj, dealsList, commsList, rfqsList] = await Promise.all([
        API.clients.get(clientId),
        API.clients.getDeals(clientId),
        API.clients.getCommunications(clientId),
        API.clients.getRfqs(clientId)
      ]);
      setClient(clientObj);
      setDeals(dealsList);
      setComms(commsList);
      setRfqs(rfqsList);
    } catch (err) {
      console.error('Failed to parse client account metrics on details panel:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      loadClientDetails();
    }
  }, [clientId]);

  const handleAddAlternateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client || !contactName) {
      alert('Contact name is required.');
      return;
    }

    try {
      const updatedClient = await API.clients.addContact(client._id, {
        name: contactName,
        email: contactEmail || undefined,
        phone: contactPhone || undefined,
        designation: contactDesignation || 'Sourcing Agent'
      });
      setClient(updatedClient);
      setShowAddContact(false);
      setContactName('');
      setContactEmail('');
      setContactPhone('');
      setContactDesignation('');
      alert('Representative contact registered successfully.');
    } catch {
      alert('Failed to insert representative contact catalog.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-20 text-slate-400">
        <p>No client company matched specified index reference.</p>
        <button onClick={() => onNavigate('clients')} className="mt-4 text-indigo-600 underline font-semibold text-xs">Directories list</button>
      </div>
    );
  }

  const activeDeals = deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost');
  const finishedDeals = deals.filter(d => d.stage === 'closed_won');

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-100">
        <div>
          <button onClick={() => onNavigate('clients')} className="text-xs text-indigo-100 bg-indigo-600 font-bold hover:bg-indigo-700 px-3 py-1 rounded-md mb-2 inline-block">
            ← Back to Accounts
          </button>
          <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight uppercase">{client.companyName}</h1>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">Historical Revenue Sourced</span>
          <span className="text-lg sm:text-2xl font-bold font-mono text-emerald-600">
            ₹{Number(client.totalRevenue || 0).toLocaleString('en-IN')}
          </span>
        </div>
      </div>

      {/* Grid: Financial limits on left, and linked CRM deals lists on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side: Overview Details */}
        <div className="space-y-6">
          <div className="bg-white p-5 border border-slate-100 rounded-2xl space-y-4">
            <h2 className="text-xs font-bold tracking-tight text-slate-400 uppercase font-display border-b border-slate-50 pb-2.5">Partnership Credit Limits</h2>
            <div className="space-y-3 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">GSTIN India:</span>
                <span className="font-mono text-slate-800 font-bold">{client.gstin || 'Unrecorded'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">PAN Register:</span>
                <span className="font-mono text-slate-800">{client.pan || 'Unrecorded'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Standard Payment terms:</span>
                <span className="text-slate-800 bg-slate-50 border px-2 py-0.5 rounded capitalize">{client.paymentTerms}</span>
              </div>
              <div className="flex justify-between border-t border-slate-50 pt-3">
                <span className="text-slate-400">Credit Limit Cap:</span>
                <span className="font-mono text-slate-800 font-bold">₹{Number(client.creditLimit || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Partnership class:</span>
                <span className="capitalize text-slate-800">{client.type} Account</span>
              </div>
            </div>
          </div>

          {/* Alternate Contact representatives registers */}
          <div className="bg-white p-5 border border-slate-100 rounded-2xl space-y-4 relative">
            <div className="flex justify-between items-center border-b border-slate-50 pb-2.5">
              <h2 className="text-xs font-bold text-slate-400 uppercase font-display">Secondary representatives</h2>
              <button
                onClick={() => setShowAddContact(!showAddContact)}
                className="text-xs font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5 bg-indigo-50 px-2 py-0.5 rounded"
              >
                <Plus className="h-3 w-3" /> Insert New
              </button>
            </div>

            {/* Primary highlighted */}
            <div className="p-3 bg-indigo-50/40 border border-indigo-100 rounded-xl space-y-1.5 text-xs font-semibold text-slate-700">
              <span className="inline-block bg-indigo-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded-sm shrink-0">PRIMARY contact</span>
              <p className="font-bold text-slate-800 mt-1">{client.primaryContact.name}</p>
              <p className="text-[10px] text-slate-400 italic">"{client.primaryContact.designation || 'Specialist'}"</p>
              <p className="text-[10px] text-slate-500 font-mono inline-block mr-2">{client.primaryContact.phone}</p>
              <p className="text-[10px] text-indigo-600 font-bold">{client.primaryContact.email}</p>
            </div>

            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {client.contacts?.length > 1 ? (
                client.contacts.filter(c => !c.isPrimary).map((ct, idx) => (
                  <div key={idx} className="p-3 border border-slate-100 rounded-xl space-y-1 text-xs font-semibold text-slate-600">
                    <p className="font-bold text-slate-700">{ct.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">"{ct.designation}"</p>
                    <p className="text-[10px] text-slate-500 font-mono inline-block mr-2">{ct.phone}</p>
                    <p className="text-[10px] text-indigo-600 leading-tight block">{ct.email}</p>
                  </div>
                ))
              ) : null}
            </div>

            {/* In-app contacts addition slider */}
            {showAddContact && (
              <form onSubmit={handleAddAlternateContact} className="space-y-3 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-0.5">Contact full name *</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g., Sunil Varma"
                    className="w-full border px-2 py-1 rounded bg-white text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-0.5">Phone number</label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91..."
                      className="w-full border px-2 py-1 rounded bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-0.5">Designation</label>
                    <input
                      type="text"
                      value={contactDesignation}
                      onChange={(e) => setContactDesignation(e.target.value)}
                      placeholder="e.g., Lead QC Inspector"
                      className="w-full border px-2 py-1 rounded bg-white text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-0.5">Email address</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="sunil@client.com"
                    className="w-full border px-2 py-1 rounded bg-white text-xs"
                  />
                </div>
                <div className="flex gap-2 pt-1.5">
                  <button type="button" onClick={() => setShowAddContact(false)} className="flex-1 py-1 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded text-[11px]">Cancel</button>
                  <button type="submit" className="flex-1 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold">Register</button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Side: Account Activity Records (Deals and RFQs) */}
        <div className="lg:col-span-2 space-y-6">

          {/* Deals register list */}
          <div className="bg-white p-5 border border-slate-100 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight font-display border-b border-slate-50 pb-2.5">Sourcing Deals History ({deals.length})</h2>
            
            {deals.length > 0 ? (
              <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                {deals.map(deal => (
                  <div key={deal._id} className="p-3.5 border border-slate-100 hover:border-slate-200 bg-slate-50/30 hover:bg-slate-50/50 rounded-xl transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs font-semibold">
                    <div>
                      <p className="font-bold text-slate-800 text-sm leading-tight uppercase">{deal.dealName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">MOQ target: {deal.moq} pieces • expected close: {deal.expectedCloseDate}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-slate-800 font-bold font-mono text-[13px]">₹{Number(deal.value).toLocaleString('en-IN')}</p>
                      <span className={`inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm capitalize ${
                        deal.stage === 'closed_won' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                        deal.stage === 'closed_lost' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
                      }`}>
                        {deal.stage.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs italic">No Sourcing deals opened for this Client.</div>
            )}
          </div>

          {/* Direct Quotations (RFQs) history list */}
          <div className="bg-white p-5 border border-slate-100 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight font-display border-b border-slate-50 pb-2.5">Quotation Inquiries (RFQs) ({rfqs.length})</h2>
            
            {rfqs.length > 0 ? (
              <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
                {rfqs.map(rfq => (
                  <div key={rfq._id} className="p-3.5 border border-slate-100 hover:border-slate-200 rounded-xl transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs font-semibold">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-800">{rfq.rfqNumber} — {rfq.title}</p>
                      <p className="text-[10px] text-slate-400">Items count: {rfq.items?.length || 0} line products • Version: V{rfq.version}</p>
                      {rfq.terms && <p className="text-[10px] text-slate-500 leading-snug italic">Terms: "{rfq.terms}"</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        rfq.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' :
                        rfq.status === 'under_review' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {rfq.status}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">valid until: {rfq.validUntil}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs italic">No quotation iterations archived. Try sending a quote from LeadDetail panel.</div>
            )}
          </div>

          {/* Historical Communications feed log timeline */}
          <div className="bg-white p-5 border border-slate-100 rounded-2xl space-y-4">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight font-display border-b border-slate-50 pb-2.5">Interaction Log Archive ({comms.length})</h2>
            
            {comms.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {comms.map((item) => (
                  <div key={item._id} className="p-3.5 border border-slate-50 hover:bg-slate-50/50 rounded-xl transition-all text-xs font-semibold">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-800 text-xs truncate max-w-[200px]">{item.subject}</span>
                      <span className="text-[9px] font-extrabold text-slate-400 capitalize bg-slate-100 px-2 py-0.5 rounded-sm">
                        {item.type} • {item.direction}
                      </span>
                    </div>
                    <p className="text-slate-600 leading-normal italic text-[11px] font-medium">"{item.body}"</p>
                    {item.nextAction && (
                      <p className="text-[10px] text-amber-600 font-bold">🎯 Follow-up: {item.nextAction} [by {item.nextActionDate ? new Date(item.nextActionDate).toLocaleDateString() : 'Unscheduled'}]</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-slate-400 text-xs italic">No client correspondence in CRM register yet.</div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
