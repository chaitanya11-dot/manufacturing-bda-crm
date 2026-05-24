import React, { useState, useEffect } from 'react';
import { API } from '../services/api.js';
import { RFQ, Client, Product, User } from '../types.js';
import { FileText, Plus, ShoppingCart, RefreshCw, Layers, Calendar, ChevronRight } from 'lucide-react';

interface RFQProps {
  user: User;
  onNavigate: (route: string, params?: any) => void;
}

export default function RFQManagement({ user, onNavigate }: RFQProps) {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Drafting wizard layout state
  const [showDraftForm, setShowDraftForm] = useState(false);
  const [draftTitle, setDraftTitle] = useState('');
  const [selectedClient, setSelectedClient] = useState('');
  const [validDate, setValidDate] = useState('');
  const [terms, setTerms] = useState('Net 60 Days, Ex-Works Sourcing point');

  // Interactive Line Items State
  const [draftItems, setDraftItems] = useState<Array<{ product: string; quantity: number; targetPrice: number }>>([]);
  const [newSku, setNewSku] = useState('');
  const [newQty, setNewQty] = useState('100');
  const [newPrice, setNewPrice] = useState('100');

  useEffect(() => {
    async function loadRFQData() {
      try {
        setLoading(true);
        const [rfqsList, clientsList, productsList] = await Promise.all([
          API.rfqs.list(),
          API.clients.list(),
          API.products.list()
        ]);
        setRfqs(rfqsList);
        setClients(clientsList);
        setProducts(productsList);
      } catch (err) {
        console.error('Failed to parse RFQ resources catalog list:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRFQData();
  }, []);

  const handleAddLineItem = () => {
    if (!newSku) {
      alert('Please select a Product SKU from catalog first.');
      return;
    }
    const alreadySelected = draftItems.find(i => i.product === newSku);
    if (alreadySelected) {
      alert('This Product SKU is already in the quote line-items list.');
      return;
    }

    setDraftItems([...draftItems, {
      product: newSku,
      quantity: Number(newQty || 1),
      targetPrice: Number(newPrice || 1)
    }]);

    setNewSku('');
    setNewQty('100');
    setNewPrice('100');
  };

  const handleRemoveLineItem = (sku: string) => {
    setDraftItems(draftItems.filter(i => i.product !== sku));
  };

  const handleCreateRFQ = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftTitle || !selectedClient || draftItems.length === 0) {
      alert('Must input Quote Title, Sponsoring Corporate Client, and at least 1 Sourced Line Item.');
      return;
    }

    try {
      await API.rfqs.create({
        title: draftTitle,
        client: selectedClient,
        items: draftItems,
        terms,
        validUntil: validDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });

      // Clear layout drafting inputs
      setShowDraftForm(false);
      setDraftTitle('');
      setSelectedClient('');
      setValidDate('');
      setTerms('Net 60 Days, Ex-Works Sourcing point');
      setDraftItems([]);

      // Reload
      const rfqReloadList = await API.rfqs.list();
      setRfqs(rfqReloadList);
      alert('Draft quotation compiled successfully back-end.');
    } catch {
      alert('Operation rejected. Verify credit limit caps and target quantities.');
    }
  };

  const handleSendClientQuotation = async (id: string) => {
    try {
      await API.rfqs.send(id);
      const rfqReloadList = await API.rfqs.list();
      setRfqs(rfqReloadList);
      alert('Quotation dispatched via simulated SMTP mail client.');
    } catch {
      alert('Dispatch failed. Unauthenticated API server connection.');
    }
  };

  const handleReviseTrigger = async (rfq: RFQ) => {
    const revisedPrice = prompt(`Submit direct commercial REVISION request for Quote ${rfq.rfqNumber}. Input premium pricing for revision line-items:`, '120');
    if (!revisedPrice) return;

    try {
      await API.rfqs.revise(rfq._id, {
        items: rfq.items.map(it => ({
          ...it,
          targetPrice: Number(revisedPrice)
        }))
      });
      const rfqReloadList = await API.rfqs.list();
      setRfqs(rfqReloadList);
      alert('Revised quotation iterations compiled on database history.');
    } catch {
      alert('Failed to register revision. BDA lack authentication privileges.');
    }
  };

  // Line calculations
  const calculateDraftSum = () => {
    return draftItems.reduce((currSum, i) => currSum + (i.quantity * i.targetPrice), 0);
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
          <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight text-left">RFQ Commercial Bidding</h1>
          <p className="text-sm text-slate-500 mt-0.5">Draft procurement versioning contracts & control specifications.</p>
        </div>
        <button
          onClick={() => setShowDraftForm(!showDraftForm)}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs hover:shadow-md transition-all flex items-center gap-1 shrink-0"
        >
          {showDraftForm ? 'Close Quotation Canvas' : 'Draft Sourcing Quote'}
        </button>
      </div>

      {/* Slide-over Quote Drafting Sheet */}
      {showDraftForm && (
        <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-md space-y-4 text-left">
          <h2 className="text-sm font-bold tracking-tight text-indigo-700 uppercase font-display border-b pb-2 flex items-center gap-2">
            <ShoppingCart className="h-4.5 w-4.5" /> Quote Line-Items Generator canvas
          </h2>

          <form className="space-y-4 text-xs font-semibold text-slate-700" onSubmit={handleCreateRFQ}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase mb-1">Inquiry/Quote Title *</label>
                <input
                  required
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="e.g., Godrej Alternator Sourcing Q1"
                  className="w-full border px-3 py-1.5 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-400 text-[10px] uppercase mb-1">Converted corporate client *</label>
                <select
                  required
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full border px-3 py-1.5 rounded-lg bg-white text-xs"
                >
                  <option value="">Select Target Client Company...</option>
                  {clients.map(c => (
                    <option key={c._id} value={c._id}>{c.companyName} (credit: ₹{Number(c.creditLimit).toLocaleString()})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Line-item Interactive Selector Block */}
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              <p className="font-bold text-slate-650 uppercase text-[10px] mb-2 tracking-wider">SKUs billing Calculator matrix</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 items-end pb-3 border-b border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 text-[9px] uppercase mb-1">Catalog SKU *</label>
                  <select
                    value={newSku}
                    onChange={(e) => {
                      setNewSku(e.target.value);
                      const prod = products.find(p => p.sku === e.target.value);
                      if (prod) setNewPrice(String(prod.targetPrice || 100)); // Pre-fill targetprice
                    }}
                    className="w-full border px-2 py-1.5 rounded text-xs bg-white"
                  >
                    <option value="">Select available SKU...</option>
                    {products.map(p => (
                      <option key={p.sku} value={p.sku}>{p.sku} — {p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 text-[9px] uppercase mb-1">Volume Quantity *</label>
                  <input
                    type="number"
                    value={newQty}
                    onChange={(e) => setNewQty(e.target.value)}
                    className="w-full border px-2 py-1 rounded bg-white text-xs text-center"
                  />
                </div>
                <div>
                  <button
                    type="button"
                    onClick={handleAddLineItem}
                    className="w-full py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs font-bold transition-all"
                  >
                    + Add Line item
                  </button>
                </div>
              </div>

              {/* Items table list summaries */}
              {draftItems.length > 0 ? (
                <div className="mt-3 divide-y divide-slate-100">
                  {draftItems.map(item => (
                    <div key={item.product} className="py-2.5 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{item.product}</p>
                        <p className="text-[10px] text-slate-450">Quantity commitment: {item.quantity} pieces • Est unit cost: ₹{item.targetPrice}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <strong className="font-mono text-slate-800 font-bold">₹{(item.quantity * item.targetPrice).toLocaleString()}</strong>
                        <button
                          type="button"
                          onClick={() => handleRemoveLineItem(item.product)}
                          className="text-red-500 hover:text-red-600 font-bold"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Grand total summaries display */}
                  <div className="pt-3 border-t border-slate-200 flex justify-between text-xs font-bold">
                    <span className="text-slate-500">Gross Sourcing Quote total:</span>
                    <strong className="font-mono text-indigo-700 font-black text-sm">₹{calculateDraftSum().toLocaleString('en-IN')}</strong>
                  </div>
                </div>
              ) : (
                <p className="text-center py-5 text-slate-400 italic text-[11px]">No catalog line-items registered yet.</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 text-[10px] uppercase mb-1">Quote Validity Date Limit</label>
                <input
                  type="date"
                  value={validDate}
                  onChange={(e) => setValidDate(e.target.value)}
                  className="w-full border px-3 py-1.5 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] uppercase mb-1">Commercial terms conditions</label>
                <input
                  type="text"
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                  className="w-full border px-3 py-1.5 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3">
              <button
                type="button"
                onClick={() => setShowDraftForm(false)}
                className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded"
              >
                Reset Canvas
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold shadow-xs transition-shadow"
              >
                Compile RFQ Quote
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main quotes database tracker index list */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-left">
        <h2 className="text-sm font-bold text-slate-800 px-4 py-3.5 tracking-tight font-display border-b border-slate-200 text-left">Compiled RFQ Registers Ledger</h2>
        
        <div className="overflow-x-auto text-left">
          {rfqs.length > 0 ? (
            <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">RFQ Number & Title</th>
                  <th className="py-3 px-4">Quote status</th>
                  <th className="py-3 px-4 text-center">Quote Version</th>
                  <th className="py-3 px-4">Validity deadline</th>
                  <th className="py-3 px-4 text-right">Draft Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rfqs.map(rfq => (
                  <tr key={rfq._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 uppercase">
                      <p className="font-bold text-slate-800 text-xs">{rfq.rfqNumber}</p>
                      <p className="font-bold text-indigo-700 text-xs tracking-tight mt-0.5">{rfq.title}</p>
                      <p className="text-[10px] text-slate-400 leading-tight mt-1 truncate max-w-[250px]">Items list: {rfq.items.map(it => `${it.product}(qty:${it.quantity})`).join(', ')}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        rfq.status === 'accepted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        rfq.status === 'under_review' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-50 text-slate-500'
                      }`}>
                        {rfq.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-mono">
                      V{rfq.version}
                    </td>
                    <td className="py-4 px-4 font-mono text-[11px] text-slate-500">
                      {rfq.validUntil}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex justify-end gap-2 text-[10px] font-bold">
                        <button
                          onClick={() => handleSendClientQuotation(rfq._id)}
                          className="px-2.5 py-1 text-white bg-indigo-600 hover:bg-indigo-700 rounded-sm transition-all shadow-xs"
                        >
                          SMTP Dispatch
                        </button>
                        <button
                          onClick={() => handleReviseTrigger(rfq)}
                          className="px-2.5 py-1 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-sm transition-all"
                        >
                          Revise (V{rfq.version + 1})
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12 text-slate-400 italic">No RFQ files constructed on database yet. Try opening the quotation canvas above.</div>
          )}
        </div>
      </div>
    </div>
  );
}
