import { useState, useEffect } from 'react';
import { API } from '../services/api.js';
import { Client, User } from '../types.js';
import { Search, Grid, List, Building, Briefcase, ChevronRight, UserCheck, Shield } from 'lucide-react';

interface ClientsProps {
  user: User;
  onNavigate: (route: string, params?: any) => void;
}

export default function Clients({ user, onNavigate }: ClientsProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Search/Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadClients = async () => {
    try {
      setLoading(true);
      const list = await API.clients.list();
      setClients(list);
    } catch (err) {
      console.error('Failed to parse client accounts register:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const getFilteredClients = () => {
    return clients.filter(c => {
      const matchesSearch =
        c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.primaryContact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.gstin && c.gstin.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = typeFilter ? c.type === typeFilter : true;
      return matchesSearch && matchesType;
    });
  };

  const visibleClients = getFilteredClients();

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
          <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight text-left">Active Client Accounts</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage corporate partnerships, credit ranges, and dispatch accounts.</p>
        </div>
        
        {/* Grid / Table layout switcher */}
        <div className="flex border border-slate-200 rounded-lg overflow-hidden shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-700' : 'bg-white hover:bg-slate-50 text-slate-400'}`}
          >
            <Grid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`p-2 border-l border-slate-200 ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-700' : 'bg-white hover:bg-slate-50 text-slate-400'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white p-4 border border-slate-200 rounded-xl flex flex-col sm:flex-row gap-4 items-center shadow-sm text-left">
        <div className="w-full sm:flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search clients by name, contact, or GSTIN code..."
            className="w-full pl-10 pr-3 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-lg text-xs"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full sm:w-48 border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white text-xs font-semibold text-slate-700"
        >
          <option value="">Any Partnership Segment</option>
          <option value="oem">Manufacturer (OEM)</option>
          <option value="distributor">Wholesale Distributor</option>
          <option value="direct">Direct Industrial Buyer</option>
          <option value="government">Enterprise Government</option>
        </select>
      </div>

      {/* Grid Mode Display layout */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleClients.map((client) => (
            <div
              key={client._id}
              onClick={() => onNavigate('clients', { id: client._id })}
              className="bg-white border border-slate-250 rounded-xl p-5 card-hover-effect cursor-pointer flex flex-col hover:border-indigo-200 relative text-left shadow-xs"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-0.5">
                  <h3 className="font-bold text-slate-800 text-sm tracking-tight uppercase leading-snug">
                    {client.companyName}
                  </h3>
                  <span className={`inline-block px-2 py-0.5 rounded text-[9px] uppercase font-bold ${
                    client.type === 'oem' ? 'bg-indigo-50 text-indigo-700' :
                    client.type === 'distributor' ? 'text-amber-700 bg-amber-50' : 'text-slate-600 bg-slate-100'
                  }`}>
                    {client.type.toUpperCase()} Segment
                  </span>
                </div>
                <div className="p-2 bg-slate-50 text-slate-400 rounded-lg block">
                  <Building className="h-4 w-4 shrink-0" />
                </div>
              </div>

              {/* Financial and credit info blocks */}
              <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 text-xs font-semibold text-slate-650">
                <div>
                  <p className="text-slate-450 text-[10px] uppercase tracking-wider">Gross Sourced Revenue</p>
                  <p className="text-slate-800 font-bold font-mono text-[13px] mt-0.5">
                    ₹{Number(client.totalRevenue || 0).toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-slate-450 text-[10px] uppercase tracking-wider">Credit range limit</p>
                  <p className="text-slate-800 font-bold font-mono text-[13px] mt-0.5">
                    ₹{Number(client.creditLimit || 0).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Contact info block */}
              <div className="mt-4 border-t border-slate-200 pt-3 text-xs leading-normal font-semibold text-slate-650">
                <p className="text-slate-450 text-[10px] uppercase tracking-wider">Corporate Point Person</p>
                <p className="text-slate-800 font-bold mt-0.5">{client.primaryContact.name}</p>
                <p className="text-slate-400 text-[10px]">{client.primaryContact.email} • {client.primaryContact.phone}</p>
              </div>

              {/* GSTIN panel summary */}
              {client.gstin && (
                <div className="mt-3 bg-slate-50 p-2 border border-slate-200 rounded-md text-[10px] font-mono text-slate-500 text-left">
                  GSTIN: {client.gstin}
                </div>
              )}

              <div className="mt-auto pt-4 border-t border-slate-205 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Terms: {client.paymentTerms}</span>
                <span className="text-indigo-600 hover:underline flex items-center gap-0.5">
                  Inspect Account <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          ))}

          {visibleClients.length === 0 && (
            <div className="col-span-full text-center py-20 text-slate-400 italic">
              No corporate accounts matched listing searches.
            </div>
          )}
        </div>
      ) : (
        /* Table Mode Display layout */
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm text-left">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Corporate Accounts Name</th>
                  <th className="py-3 px-4">Partnership Segment</th>
                  <th className="py-3 px-4">Corporate Representative</th>
                  <th className="py-3 px-4">Payment terms</th>
                  <th className="py-3 px-4 text-right">Lifetime Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleClients.map((client) => (
                  <tr
                    key={client._id}
                    onClick={() => onNavigate('clients', { id: client._id })}
                    className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800 text-xs uppercase">{client.companyName}</p>
                      {client.gstin && <p className="text-[10px] font-mono text-slate-400">GSTIN: {client.gstin}</p>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100">
                        {client.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{client.primaryContact.name}</p>
                      <p className="text-[10px] text-slate-400">{client.primaryContact.phone}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {client.paymentTerms}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-800 font-bold text-xs">
                      ₹{Number(client.totalRevenue || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}

                {visibleClients.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 italic">
                      No matching clients discoverable back-end.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
