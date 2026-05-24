import { useState, useEffect } from 'react';
import { getStoredUser, clearStoredUser, clearStoredToken } from './services/api.js';
import { User } from './types.js';

// Screen Imports
import Login from './pages/Login.js';
import Dashboard from './pages/Dashboard.js';
import Pipeline from './pages/Pipeline.js';
import Leads from './pages/Leads.js';
import LeadDetail from './pages/LeadDetail.js';
import Clients from './pages/Clients.js';
import ClientDetail from './pages/ClientDetail.js';
import Sales from './pages/Sales.js';
import RFQManagement from './pages/RFQManagement.js';
import Communications from './pages/Communications.js';
import Performance from './pages/Performance.js';
import Settings from './pages/Settings.js';

// Icon Imports
import {
  LayoutDashboard,
  GitPullRequest,
  Users,
  Building,
  TrendingUp,
  FileText,
  MessageSquare,
  Award,
  Settings as IconSettings,
  LogOut,
  Bell,
  Search,
  Factory,
  Menu,
  X
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [routeParams, setRouteParams] = useState<any>({});
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);
  const [notificationsCount, setNotificationsCount] = useState(3);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Authenticate session from local storage on mount
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setCurrentUser(stored);
    }
  }, []);

  // Sync route and params based on Hash routes deep-linking
  useEffect(() => {
    const handleHashNavigation = () => {
      const hash = window.location.hash || '#/dashboard';
      const cleanHash = hash.replace(/^#\//, '');
      const [path, queryString] = cleanHash.split('?');

      const params: any = {};
      if (queryString) {
        const searchParams = new URLSearchParams(queryString);
        for (const [key, val] of searchParams.entries()) {
          params[key] = val;
        }
      }

      setCurrentRoute(path || 'dashboard');
      setRouteParams(params);
      setIsSidebarMobileOpen(false); // Auto close sidebar on route changes for mobile
    };

    handleHashNavigation();
    window.addEventListener('hashchange', handleHashNavigation);
    return () => window.removeEventListener('hashchange', handleHashNavigation);
  }, []);

  const navigate = (path: string, params: any = {}) => {
    const query = new URLSearchParams(params).toString();
    window.location.hash = `#/${path}${query ? '?' + query : ''}`;
  };

  const handleLogout = () => {
    clearStoredUser();
    clearStoredToken();
    setCurrentUser(null);
    window.location.hash = '#/dashboard';
  };

  // Sidebar Menu coordinates mapping
  const navigationItems = [
    { key: 'dashboard', label: 'Management desk', icon: LayoutDashboard },
    { key: 'pipeline', label: 'Kanban Sales Pipeline', icon: GitPullRequest },
    { key: 'leads', label: 'Accounts Lead Register', icon: Users },
    { key: 'clients', label: 'Active Client Directory', icon: Building },
    { key: 'sales', label: 'Weighted Sales Tracker', icon: TrendingUp },
    { key: 'rfqs', label: 'RFQ Commercial Quote', icon: FileText },
    { key: 'communications', label: 'CRM Correspondence', icon: MessageSquare },
    { key: 'performance', label: 'BDA Leaderboards', icon: Award },
    { key: 'settings', label: 'SKU Inventory settings', icon: IconSettings }
  ];

  if (!currentUser) {
    return <Login onLoginSuccess={(u) => setCurrentUser(u)} />;
  }

  // Multi view rendering switcher based on current route matches
  const renderActiveScreen = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <Dashboard user={currentUser} onNavigate={navigate} />;
      case 'pipeline':
        return <Pipeline user={currentUser} onNavigate={navigate} />;
      case 'leads':
        if (routeParams.id) {
          return <LeadDetail leadId={routeParams.id} user={currentUser} onNavigate={navigate} />;
        }
        return <Leads user={currentUser} onNavigate={navigate} />;
      case 'clients':
        if (routeParams.id) {
          return <ClientDetail clientId={routeParams.id} onNavigate={navigate} />;
        }
        return <Clients user={currentUser} onNavigate={navigate} />;
      case 'sales':
        return <Sales user={currentUser} onNavigate={navigate} />;
      case 'rfqs':
        return <RFQManagement user={currentUser} onNavigate={navigate} />;
      case 'communications':
        return <Communications />;
      case 'performance':
        return <Performance />;
      case 'settings':
        return <Settings user={currentUser} onUpdateUser={(u) => setCurrentUser(u)} />;
      default:
        return <Dashboard user={currentUser} onNavigate={navigate} />;
    }
  };

  const getBreadcrumbTitle = () => {
    const activeItem = navigationItems.find(item => item.key === currentRoute);
    if (activeItem) return activeItem.label;
    if (currentRoute === 'leads' && routeParams.id) return 'Account Profile Inspection';
    if (currentRoute === 'clients' && routeParams.id) return 'Client Corporate Details';
    return 'Industrial Operations dashboard';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden">
      
      {/* 1. Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-slate-900 text-slate-100 flex-shrink-0 z-20 shadow-xl border-r border-slate-850">
        {/* Brand Header */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center shrink-0">
            <div className="w-4 h-4 border-2 border-white rounded-sm"></div>
          </div>
          <span className="text-white font-bold tracking-tight text-md font-display">FORGE CRM</span>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = currentRoute === item.key;
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                onClick={() => navigate(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-md transition-all text-left ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400 font-semibold'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Session details bottom bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-left">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500 text-white font-bold font-display text-xs flex items-center justify-center uppercase shadow-xs">
              {currentUser.name.charAt(0)}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-200 truncate">{currentUser.name}</p>
              <p className="text-[10px] text-slate-500 capitalize leading-none mt-0.5">{currentUser.role} scope</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-slate-800 font-semibold rounded-lg transition-all text-left"
          >
            <LogOut className="h-4 w-4" /> Sign-Out Portal
          </button>
        </div>
      </aside>

      {/* 2. Mobile Responsive Drawer Sidebar */}
      {isSidebarMobileOpen && (
        <div className="fixed inset-0 overflow-hidden z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/60 transition-opacity backdrop-blur-xs" onClick={() => setIsSidebarMobileOpen(false)} />
          <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full">
            <div className="pointer-events-auto w-64 bg-slate-900 text-slate-100 flex flex-col h-full shadow-2xl transition-transform">
              <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-600 text-white p-1.5 rounded-lg"><Factory className="h-5 w-5" /></div>
                  <span className="text-md font-bold tracking-tight font-display text-white">Apex Forge</span>
                </div>
                <button onClick={() => setIsSidebarMobileOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto">
                {navigationItems.map((item) => {
                  const isActive = currentRoute === item.key;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.key}
                      onClick={() => navigate(item.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all text-left ${
                        isActive ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <Icon className="h-4.5 w-4.5 shrink-0" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-left">
                <p className="text-xs font-bold text-slate-200">{currentUser.name}</p>
                <p className="text-[10px] text-slate-500 capitalize">{currentUser.role}</p>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 mt-3 px-2 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-slate-850 font-bold rounded"
                >
                  <LogOut className="h-3.5 w-3.5" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 flex-shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarMobileOpen(true)}
              className="lg:hidden p-2 text-slate-500 hover:text-slate-800"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-slate-400">/</span>
            <h2 className="text-sm font-medium text-slate-600">
              {getBreadcrumbTitle()}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Global notification indicator */}
            <button
              onClick={() => { setNotificationsCount(0); alert('Procurement logs and email dispatch queues verified green.'); }}
              className="relative p-2 text-slate-400 hover:text-slate-600"
            >
              <Bell className="h-5 w-5" />
              {notificationsCount > 0 && (
                <span className="absolute top-0.5 right-0.5 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>

            {/* Quick search display mock */}
            <div className="relative hidden sm:block w-72">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-450">
                <Search className="h-3.5 w-3.5" />
              </span>
              <div className="block w-full pl-9 pr-12 py-1.5 border border-slate-250 rounded-md bg-slate-50 text-xs text-slate-400 select-none">
                <span>Search leads, RFQs, products...</span>
                <kbd className="absolute right-2.5 top-2 font-sans text-[9px] bg-white border border-slate-200 px-1 rounded text-slate-400 font-bold">⌘K</kbd>
              </div>
            </div>

            {/* Profile Dropdown & Logout Portal */}
            {currentUser && (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2.5 p-1 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                  id="header_profile_dropdown_btn"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold font-display text-xs flex items-center justify-center uppercase shadow-sm">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div className="hidden md:block text-left pr-1">
                    <p className="text-xs font-semibold text-slate-700 leading-none">{currentUser.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{currentUser.role}</p>
                  </div>
                </button>

                {isProfileOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-30" 
                      onClick={() => setIsProfileOpen(false)} 
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-40 text-left">
                      <div className="px-4 py-2 border-b border-slate-150">
                        <p className="text-xs font-bold text-slate-800">{currentUser.name}</p>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">{currentUser.role} scope</p>
                      </div>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('settings');
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium"
                      >
                        <IconSettings className="h-3.5 w-3.5 text-slate-400" /> Inventory Settings
                      </button>
                      <button
                        onClick={() => {
                          setIsProfileOpen(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold border-t border-slate-100"
                        id="header_logout_btn"
                      >
                        <LogOut className="h-3.5 w-3.5 text-red-500" /> Sign Out Portal
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Primary Page Canvas */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-16">
          {renderActiveScreen()}
        </main>
      </div>

    </div>
  );
}
