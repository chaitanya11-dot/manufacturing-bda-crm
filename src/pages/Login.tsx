import React, { useState } from 'react';
import { API } from '../services/api.js';
import { Lock, Mail, Factory, ArrowRight, UserCheck } from 'lucide-react';
import { User } from '../types.js';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'admin' | 'manager' | 'bda'>('bda');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Quick seed user auto-fill list
  const seedUsers = [
    { label: 'Admin Access', email: 'admin@factory.com', labelStyle: 'bg-indigo-50 text-indigo-700', pass: 'admin123', name: 'Anand Sharma (VP Admin)' },
    { label: 'Manager Access', email: 'manager@factory.com', labelStyle: 'bg-emerald-50 text-emerald-700', pass: 'manager123', name: 'Meera Nair (Sales Director)' },
    { label: 'BDA Access', email: 'bda@factory.com', labelStyle: 'bg-amber-50 text-amber-700', pass: 'bda123', name: 'Abhishek Roy (Field BDA)' }
  ];

  const handleSeedFill = (seed: typeof seedUsers[0]) => {
    setEmail(seed.email);
    setPassword(seed.pass);
    setError(null);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        if (!name || !email || !password) {
          throw new Error('Please fill all required inputs.');
        }
        const response = await API.auth.register({ name, email, password, role });
        setError(null);
        alert('Account created! You can now log in using your email and password.');
        setIsRegister(false);
      } else {
        if (!email || !password) {
          throw new Error('Please input both email and password.');
        }
        const response = await API.auth.login(email, password);
        onLoginSuccess(response.user);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-3">
          <div className="bg-indigo-600 text-white p-2.5 rounded-xl shadow-lg shadow-indigo-100">
            <Factory className="h-6 w-6" id="login-logo-icon" />
          </div>
          <span className="text-2xl font-bold font-display text-slate-900 tracking-tight">Apex Forge CRM</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold font-display text-slate-800 tracking-tight">
          {isRegister ? 'Register BDA Account' : 'Partner Portal Sign-In'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Manufacturing Lead & RFQ Orchestration Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-slate-100 rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleAuthSubmit}>
            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                {error}
              </div>
            )}

            {isRegister && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Full Name</label>
                  <div className="mt-1 relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Sunil Varma"
                      className="appearance-none block w-full px-3 py-2 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-800">Assign CRM Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-200 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg"
                  >
                    <option value="bda">Business Development Associate (BDA)</option>
                    <option value="manager">Commercial Team Manager</option>
                    <option value="admin">System Operations Admin</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700">Corporate Email</label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@factory.com"
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700">Secured Password</label>
              <div className="mt-1 relative rounded-md shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="appearance-none block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-xs text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Authenticating...' : isRegister ? 'Register Account' : 'Enter Portal'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-100" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white text-slate-400">Or use seed credentials</span>
              </div>
            </div>

            {/* Quick click options */}
            <div className="mt-4 space-y-2">
              {seedUsers.map((seed, id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSeedFill(seed)}
                  className="w-full flex items-center justify-between p-2.5 text-left border border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50 rounded-lg transition-all text-xs"
                >
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-slate-400" />
                    <div>
                      <p className="font-semibold text-slate-700">{seed.name}</p>
                      <p className="text-[10px] text-slate-400">{seed.email} (pass: {seed.pass})</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${seed.labelStyle}`}>
                    {seed.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold"
            >
              {isRegister ? 'Already have an account? Log in' : 'Request new BDA Associate Access'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
