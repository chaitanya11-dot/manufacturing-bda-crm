import React, { useState, useEffect } from 'react';
import { API } from '../services/api.js';
import { Product, User } from '../types.js';
import { Settings as IconSettings, Shield, Layers, Plus, BookOpen } from 'lucide-react';

interface SettingsProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

export default function Settings({ user, onUpdateUser }: SettingsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile update form state
  const [profileName, setProfileName] = useState(user.name);
  const [profileEmail, setProfileEmail] = useState(user.email);

  // New catalog item state
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('150');
  const [minMoq, setMinMoq] = useState('100');
  const [desc, setDesc] = useState('');

  const loadProducts = async () => {
    try {
      setLoading(true);
      const list = await API.products.list();
      setProducts(list);
    } catch (err) {
      console.error('Failed to parse inventory resources catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName) return;

    try {
      const updated = await API.users.update(user._id, { name: profileName, email: profileEmail });
      onUpdateUser(updated);
      alert('Personal coordinates updated successfully.');
    } catch {
       alert('Operation rejected. Unauthenticated security token.');
    }
  };

  const handleCreateCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !name || !price) {
      alert('Must fill SKU, Product Name, and Target Sourcing price.');
      return;
    }

    try {
      await API.products.create({
        sku,
        name,
        targetPrice: Number(price),
        minMoq: Number(minMoq),
        description: desc
      });

      // Clear states
      setSku('');
      setName('');
      setPrice('150');
      setMinMoq('100');
      setDesc('');

      // Reload
      loadProducts();
      alert('New SKU item integrated into factory ledger catalogue.');
    } catch {
      alert('Operation rejected. Only Admin/Managers can expand the catalog.');
    }
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
      <div className="pb-4 border-b border-slate-100 text-left">
        <h1 className="text-2xl font-bold font-display text-slate-800 tracking-tight">System Settings panel</h1>
        <p className="text-sm text-slate-500 mt-0.5">Configure target sales profiles or expand the factory inventory catalog.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Update Panel */}
        <div className="bg-white p-5 border border-slate-100 rounded-2xl space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight font-display flex items-center gap-1.5 border-b pb-2">
            <IconSettings className="h-4.5 w-4.5 text-indigo-600" /> BDA Personal Identity
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-semibold text-slate-700">
            <div>
              <label className="block text-slate-400 text-[10px] uppercase mb-1">Associate Full Name</label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full border px-3 py-1.5 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] uppercase mb-1">Corporate Email Address</label>
              <input
                type="email"
                required
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full border px-3 py-1.5 rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-[10px] uppercase mb-1">Assigned CRM Security Role</label>
              <div className="flex items-center gap-1.5 p-2.5 bg-slate-50 border rounded-lg text-[11px] text-slate-600">
                <Shield className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="capitalize font-bold">{user.role} Scope Authority</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors"
            >
              Update credentials
            </button>
          </form>
        </div>

        {/* Catalog Items expansion ledger */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Form to insert catalog SKU */}
          {(user.role === 'admin' || user.role === 'manager') && (
            <div className="bg-white p-5 border border-slate-100 rounded-2xl space-y-4">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-tight font-display flex items-center gap-1.5 border-b pb-2">
                <Plus className="h-4.5 w-4.5 text-indigo-600" /> Expand Manufacturing Catalogue Inventory
              </h2>

              <form onSubmit={handleCreateCatalogItem} className="space-y-4 text-xs font-semibold text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Unique Product SKU Code *</label>
                    <input
                      required
                      type="text"
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g., PLM-303"
                      className="w-full border px-3 py-1.5 rounded-lg font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Product Name Identifier *</label>
                    <input
                      required
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Planetary Gear Assembly"
                      className="w-full border px-3 py-1.5 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Target price per unit (INR) *</label>
                    <input
                      required
                      type="number"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full border px-3 py-1.5 rounded-lg text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">Minimum MOQ Capacity threshold</label>
                    <input
                      type="number"
                      value={minMoq}
                      onChange={(e) => setMinMoq(e.target.value)}
                      className="w-full border px-3 py-1.5 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 text-[10px] uppercase mb-1">Outline specifications description</label>
                  <textarea
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    placeholder="Provide weight, steel grades, or tensile strength specs..."
                    rows={2}
                    className="w-full border px-3 py-1.5 rounded-lg text-xs font-medium"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all"
                >
                  Save inventory SKU
                </button>
              </form>
            </div>
          )}

          {/* Current product listing */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 uppercase px-4 py-3 tracking-tight font-display border-b border-slate-50 flex items-center gap-1.5 text-left">
              <BookOpen className="h-4.5 w-4.5 text-indigo-700" /> Active factory supply lines catalogue ({products.length} Items)
            </h3>

            <div className="overflow-x-auto text-left">
              <table className="w-full text-left border-collapse text-xs font-semibold text-slate-700">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2.5 px-4">SKU Code</th>
                    <th className="py-2.5 px-4">Product descriptions</th>
                    <th className="py-2.5 px-4">Minimum MOQ</th>
                    <th className="py-2.5 px-4 text-right">Standard unit Price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(prod => (
                    <tr key={prod._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700 text-xs">
                        {prod.sku}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-800">{prod.name}</p>
                        {prod.description && <p className="text-[10px] text-slate-450 italic mt-0.5 font-medium">"{prod.description}"</p>}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {prod.minMoq} pieces
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-800 font-bold text-xs">
                        ₹{Number(prod.targetPrice).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
