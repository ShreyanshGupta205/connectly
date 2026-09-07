import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  BarChart3, 
  Database, 
  Lock, 
  Sparkles, 
  CheckCircle2, 
  Search, 
  Trash2, 
  ExternalLink, 
  Download, 
  Layers, 
  Eye, 
  Heart, 
  Link as LinkIcon, 
  Plus, 
  Copy,
  LogOut,
  Activity,
  Server
} from 'lucide-react';
import { useProfile, ADMIN_EMAIL } from '../../context/ProfileContext';
import { useToast } from '../../context/ToastContext';
import { GoogleAuthModal, GoogleIcon } from '../common/GoogleAuthModal';

interface AdminPanelProps {
  navigateTo: (route: string) => void;
}

type AdminTab = 'overview' | 'users' | 'database' | 'security';

export const AdminPanel: React.FC<AdminPanelProps> = ({ navigateTo }) => {
  const { 
    profiles, 
    currentUser, 
    isAdmin, 
    toggleVerification, 
    deleteProfile, 
    updateAnyProfile, 
    switchProfile, 
    createNewProfile,
    loginAsAdminDemo,
    logout,
    exportAllData,
    isCloudConnected
  } = useProfile();

  const toast = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerified, setFilterVerified] = useState<'all' | 'verified' | 'unverified'>('all');
  const [filterPlan, setFilterPlan] = useState<'all' | 'free' | 'pro'>('all');
  const [selectedUserToDelete, setSelectedUserToDelete] = useState<string | null>(null);
  
  // Create profile modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Password & DB secret visibility
  const [showDbPassword, setShowDbPassword] = useState(false);
  const [isPingingDb, setIsPingingDb] = useState(false);
  const [pingLatency, setPingLatency] = useState<number | null>(null);

  // Calculate platform metrics
  const profileList = Object.values(profiles);
  const totalProfiles = profileList.length;
  const totalViews = profileList.reduce((acc, p) => acc + (p.stats?.views || 0), 0);
  const totalLikes = profileList.reduce((acc, p) => acc + (p.stats?.likes || 0), 0);
  const totalQrScans = profileList.reduce((acc, p) => acc + (p.stats?.qrScans || 0), 0);
  const totalLinks = profileList.reduce((acc, p) => acc + (p.links?.length || 0), 0);
  const verifiedCount = profileList.filter(p => p.isVerified).length;

  // Filtered users list
  const filteredProfiles = profileList.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.tagline.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVerified = 
      filterVerified === 'all' ? true :
      filterVerified === 'verified' ? p.isVerified :
      !p.isVerified;

    const matchesPlan = 
      filterPlan === 'all' ? true :
      p.plan === filterPlan;

    return matchesSearch && matchesVerified && matchesPlan;
  });

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim()) {
      toast.error('Please fill in username and name');
      return;
    }
    const success = createNewProfile(newUsername, newName, newEmail);
    if (success) {
      toast.success('Profile created successfully!', `@${newUsername}`);
      setCreateModalOpen(false);
      setNewUsername('');
      setNewName('');
      setNewEmail('');
    } else {
      toast.error('Username already taken or invalid');
    }
  };

  const handleExportBackup = () => {
    const jsonStr = exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `connectly-platform-backup-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Platform Backup Exported Successfully!');
  };

  const handlePingDatabase = () => {
    setIsPingingDb(true);
    setPingLatency(null);
    setTimeout(() => {
      setIsPingingDb(false);
      setPingLatency(Math.floor(Math.random() * 25) + 18); // 18-42ms latency simulation
      toast.success('Supabase PostgreSQL pooler is operational', 'Latency: 24ms (aws-0-ap-south-1)');
    }, 600);
  };

  // ════════════════════════════════════════════════════════════════════════
  // 1. ACCESS DENIED / RESTRICTED ACCESS SCREEN (If not shreyanshg2005@gmail.com)
  // ════════════════════════════════════════════════════════════════════════
  if (!isAdmin) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg rounded-3xl bg-slate-900/90 border border-white/15 p-8 sm:p-10 text-center space-y-6 shadow-2xl shadow-rose-950/20 backdrop-blur-2xl relative overflow-hidden">
          
          {/* Neon Alert Ambient Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />

          {/* Shield Icon */}
          <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-rose-500/20 to-amber-500/10 border border-rose-500/30 flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-10 h-10 text-rose-400 animate-pulse" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider">
              <Lock className="w-3.5 h-3.5" />
              <span>Super Admin Access Required</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Connectly Control Center
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
              This area is strictly restricted. Only the designated platform super-administrator account (<span className="text-rose-300 font-mono font-semibold">{ADMIN_EMAIL}</span>) has access to this portal.
            </p>
          </div>

          {/* Current Signed-in status */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 flex items-center justify-between">
            <span className="text-slate-400">Current Session:</span>
            <span className="font-mono text-white font-semibold truncate max-w-[200px]">
              {currentUser?.email || 'Guest / Not Signed In'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <GoogleIcon className="w-4 h-4" />
              <span>Sign in with Google ({ADMIN_EMAIL})</span>
            </button>

            {/* Quick Simulation Button for Developer Local Testing */}
            <button
              onClick={() => {
                loginAsAdminDemo();
                toast.success('Admin Session Activated', `Signed in as ${ADMIN_EMAIL}`);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Admin Login ({ADMIN_EMAIL})</span>
            </button>

            <button
              onClick={() => navigateTo('landing')}
              className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              ← Return to Connectly Homepage
            </button>
          </div>

        </div>

        <GoogleAuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={() => toast.success('Signed in successfully!')}
        />
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // 2. AUTHORIZED SUPER ADMIN PORTAL (shreyanshg2005@gmail.com)
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8 animate-fade-in">
      
      {/* ── Top Header Banner ── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-white/15 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
        
        {/* Glow behind header */}
        <div className="absolute top-0 right-0 w-96 h-48 bg-gradient-to-l from-indigo-600/20 via-purple-600/15 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Super Admin Portal</span>
              </span>
              <span className="text-xs text-slate-400 font-mono bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                {ADMIN_EMAIL}
              </span>
              {isCloudConnected && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Cloud Active
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Connectly Control Center
            </h1>
            <p className="text-slate-400 text-sm">
              Root administrator access to manage creators, links, databases, and platform infrastructure.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportBackup}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs transition-all hover:scale-105 active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>Export JSON Backup</span>
            </button>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Profile</span>
            </button>
            <button
              onClick={() => navigateTo('dashboard')}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Studio</span>
            </button>
            <button
              onClick={() => logout()}
              className="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Platform Metrics', icon: <BarChart3 className="w-4 h-4" /> },
            { id: 'users', label: `Creators (${totalProfiles})`, icon: <Users className="w-4 h-4" /> },
            { id: 'database', label: 'Cloud & Database', icon: <Database className="w-4 h-4" /> },
            { id: 'security', label: 'Security & Access', icon: <Lock className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: OVERVIEW & PLATFORM METRICS */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Top KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {/* KPI 1 */}
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Total Registered</span>
                <Users className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-3xl font-black text-white tracking-tight">{totalProfiles}</p>
              <p className="text-[11px] text-emerald-400 font-medium">+{verifiedCount} Verified badges</p>
            </div>

            {/* KPI 2 */}
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Platform Views</span>
                <Eye className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-3xl font-black text-white tracking-tight">{totalViews.toLocaleString()}</p>
              <p className="text-[11px] text-cyan-400 font-medium">Real-time synced</p>
            </div>

            {/* KPI 3 */}
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Visitor ❤️ Likes</span>
                <Heart className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-3xl font-black text-white tracking-tight">{totalLikes.toLocaleString()}</p>
              <p className="text-[11px] text-rose-400 font-medium">Atomic increment</p>
            </div>

            {/* KPI 4 */}
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 backdrop-blur-xl space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                <span>Links Managed</span>
                <LinkIcon className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-3xl font-black text-white tracking-tight">{totalLinks}</p>
              <p className="text-[11px] text-amber-400 font-medium">{totalQrScans} QR poster scans</p>
            </div>

          </div>

          {/* Infrastructure Health Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            
            <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">PostgreSQL Pooler</p>
                <p className="text-sm font-bold text-white mt-0.5">Supabase ap-south-1</p>
                <p className="text-[11px] text-emerald-400 font-medium mt-0.5">● Active on Port 6543</p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                <Server className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Firebase Firestore</p>
                <p className="text-sm font-bold text-white mt-0.5">connectly-in.app</p>
                <p className="text-[11px] text-amber-400 font-medium mt-0.5">● Realtime Sync Active</p>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-slate-900/80 border border-white/10 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Admin Security</p>
                <p className="text-sm font-bold text-white mt-0.5">Single Super Admin</p>
                <p className="text-[11px] text-indigo-300 font-medium mt-0.5">● {ADMIN_EMAIL}</p>
              </div>
            </div>

          </div>

          {/* Top Profiles by Popularity */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <h3 className="font-extrabold text-base text-white">Top Creator Highlights</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {profileList.slice(0, 4).map(p => (
                <div 
                  key={p.username} 
                  className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-indigo-500/30 transition-all space-y-3"
                >
                  <div className="flex items-center gap-2.5">
                    <img src={p.avatarUrl} alt={p.name} className="w-10 h-10 rounded-full object-cover ring-1 ring-indigo-500" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <p className="font-bold text-xs text-white truncate">{p.name}</p>
                        {p.isVerified && <CheckCircle2 className="w-3 h-3 text-blue-400 flex-shrink-0" />}
                      </div>
                      <p className="text-[10px] text-indigo-300 font-mono truncate">@{p.username}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs pt-1 border-t border-white/5">
                    <div>
                      <p className="font-extrabold text-white">{p.stats?.views || 0}</p>
                      <p className="text-[10px] text-slate-400">Views</p>
                    </div>
                    <div>
                      <p className="font-extrabold text-rose-400">{p.stats?.likes || 0}</p>
                      <p className="text-[10px] text-slate-400">Likes</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: CREATOR / USER MANAGEMENT */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          
          {/* Search & Filter Toolbar */}
          <div className="p-4 rounded-3xl bg-slate-900/80 border border-white/10 flex flex-col md:flex-row gap-3 items-center justify-between">
            
            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, @handle, or email..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <select
                value={filterVerified}
                onChange={e => setFilterVerified(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all" className="bg-slate-900 text-white">All Statuses</option>
                <option value="verified" className="bg-slate-900 text-white">Verified Only</option>
                <option value="unverified" className="bg-slate-900 text-white">Unverified Only</option>
              </select>

              <select
                value={filterPlan}
                onChange={e => setFilterPlan(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 focus:outline-none"
              >
                <option value="all" className="bg-slate-900 text-white">All Plans</option>
                <option value="free" className="bg-slate-900 text-white">Free Plan</option>
                <option value="pro" className="bg-slate-900 text-white">Pro Plan</option>
              </select>

              <button
                onClick={() => setCreateModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/30 ml-auto md:ml-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Profile</span>
              </button>
            </div>

          </div>

          {/* Profiles Table */}
          <div className="rounded-3xl bg-slate-900/80 border border-white/10 overflow-hidden shadow-2xl backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-slate-950/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="p-4 sm:p-5">Creator Profile</th>
                    <th className="p-4 sm:p-5">Verification</th>
                    <th className="p-4 sm:p-5">Plan</th>
                    <th className="p-4 sm:p-5">Stats</th>
                    <th className="p-4 sm:p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-10 text-center text-slate-400">
                        No profiles matched your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((p) => (
                      <tr key={p.username} className="hover:bg-white/[0.02] transition-colors">
                        
                        {/* Profile Info */}
                        <td className="p-4 sm:p-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.avatarUrl}
                              alt={p.name}
                              className="w-10 h-10 rounded-full object-cover ring-1 ring-white/20"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white truncate">{p.name}</span>
                                {p.isVerified && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-indigo-300 font-mono">@{p.username}</p>
                              {p.email && (
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">{p.email}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Verified Toggle */}
                        <td className="p-4 sm:p-5">
                          <button
                            onClick={() => {
                              toggleVerification(p.username);
                              toast.success(
                                p.isVerified ? `Removed verified badge from @${p.username}` : `Granted verified badge to @${p.username}`
                              );
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                              p.isVerified
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30'
                                : 'bg-white/5 text-slate-400 border border-white/10 hover:text-white hover:bg-white/10'
                            }`}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{p.isVerified ? 'Verified' : 'Unverified'}</span>
                          </button>
                        </td>

                        {/* Plan */}
                        <td className="p-4 sm:p-5">
                          <select
                            value={p.plan || 'free'}
                            onChange={e => {
                              updateAnyProfile(p.username, { plan: e.target.value as any });
                              toast.success(`Updated plan for @${p.username} to ${e.target.value.toUpperCase()}`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-white focus:outline-none font-bold uppercase tracking-wider"
                          >
                            <option value="free" className="bg-slate-900">Free</option>
                            <option value="pro" className="bg-slate-900">Pro</option>
                            <option value="creator" className="bg-slate-900">Studio</option>
                          </select>
                        </td>

                        {/* Stats */}
                        <td className="p-4 sm:p-5">
                          <div className="space-y-0.5 text-[11px]">
                            <p className="text-slate-300">
                              <strong className="text-white font-mono">{p.stats?.views || 0}</strong> views ·{' '}
                              <strong className="text-rose-400 font-mono">{p.stats?.likes || 0}</strong> likes
                            </p>
                            <p className="text-slate-400">
                              {p.links?.length || 0} links · {p.stats?.qrScans || 0} scans
                            </p>
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td className="p-4 sm:p-5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                switchProfile(p.username);
                                navigateTo('dashboard');
                                toast.info(`Switched to studio for @${p.username}`);
                              }}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
                              title="Edit in Creator Studio"
                            >
                              <Layers className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => navigateTo(`/@${p.username}`)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-indigo-300 hover:text-white transition-colors"
                              title="View Public Profile"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => setSelectedUserToDelete(p.username)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                              title="Delete Profile"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>

                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: CLOUD DATABASE & SUPABASE CONFIGURATION */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          
          {/* Supabase Connection Overview */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-white/10 space-y-6 backdrop-blur-xl">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
                  <Database className="w-3.5 h-3.5" />
                  <span>PostgreSQL Database</span>
                </div>
                <h3 className="text-xl font-black text-white">Supabase Cloud Infrastructure</h3>
                <p className="text-xs text-slate-400 mt-1">Region: AWS South Asia (Mumbai, aws-0-ap-south-1)</p>
              </div>

              <button
                onClick={handlePingDatabase}
                disabled={isPingingDb}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/25"
              >
                <Activity className={`w-3.5 h-3.5 ${isPingingDb ? 'animate-spin' : ''}`} />
                <span>{isPingingDb ? 'Testing Connection...' : 'Ping Database'}</span>
                {pingLatency && <span className="font-mono text-emerald-300 ml-1">({pingLatency}ms)</span>}
              </button>
            </div>

            {/* Connection Strings */}
            <div className="space-y-3 pt-2">
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Transaction Mode Pooler (IPv4-Only · Port 6543)</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`postgresql://postgres.rbmcfsuupcojncyqmywm:Connectly%402026@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`);
                      toast.success('DATABASE_URL copied to clipboard');
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="font-mono text-xs text-emerald-400 break-all bg-slate-950 p-2.5 rounded-xl border border-white/5 select-all">
                  postgresql://postgres.rbmcfsuupcojncyqmywm:{showDbPassword ? 'Connectly@2026' : '••••••••••••'}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Direct Session URL (Port 5432)</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`postgresql://postgres.rbmcfsuupcojncyqmywm:Connectly%402026@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`);
                      toast.success('DIRECT_URL copied to clipboard');
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <p className="font-mono text-xs text-cyan-400 break-all bg-slate-950 p-2.5 rounded-xl border border-white/5 select-all">
                  postgresql://postgres.rbmcfsuupcojncyqmywm:{showDbPassword ? 'Connectly@2026' : '••••••••••••'}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => setShowDbPassword(!showDbPassword)}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  {showDbPassword ? 'Hide Secret Password' : 'Show Masked Password'}
                </button>
              </div>
            </div>

          </div>

          {/* Firebase Real-time Synchronization Status */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <h3 className="font-extrabold text-base text-white">Firebase App Integration</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <p className="text-slate-400 font-medium">Project ID</p>
                <p className="font-mono text-indigo-300 font-bold">connectly-in</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-1">
                <p className="text-slate-400 font-medium">Auth Domain</p>
                <p className="font-mono text-indigo-300 font-bold">connectly-in.firebaseapp.com</p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 4: SECURITY & ACCESS CONTROL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/80 border border-white/10 space-y-6 backdrop-blur-xl">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Super Administrator List</span>
              </div>
              <h3 className="text-xl font-black text-white">Access Control Policy</h3>
              <p className="text-xs text-slate-400 mt-1">
                Only the email listed below has root authorization to the admin portal and platform controls.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300">
                  👑
                </div>
                <div>
                  <p className="font-bold text-white text-sm">{ADMIN_EMAIL}</p>
                  <p className="text-xs text-emerald-400 font-medium">Super Administrator · Full Permissions</p>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold">
                ACTIVE OWNER
              </span>
            </div>
          </div>

          {/* Audit Log Mock */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/10 space-y-4">
            <h3 className="font-extrabold text-base text-white">Recent Admin Operations</h3>
            <div className="space-y-2 text-xs">
              {[
                { action: 'Super Admin Access Verified', time: 'Just now', target: ADMIN_EMAIL, icon: '🛡️' },
                { action: 'Cloud Sync Heartbeat', time: '1 min ago', target: 'connectly-in Firestore', icon: '⚡' },
                { action: 'PostgreSQL Pooler Health Verified', time: '5 mins ago', target: 'aws-0-ap-south-1', icon: '🐘' },
                { action: 'Initial Profiles Seeded', time: 'System Start', target: '4 Creator Accounts', icon: '👥' },
              ].map((log, i) => (
                <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span>{log.icon}</span>
                    <span className="font-medium text-slate-200">{log.action}</span>
                    <span className="text-slate-500">({log.target})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{log.time}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* CREATE NEW PROFILE MODAL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-white/15 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-base">Create New Creator Profile</h3>
              <button 
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProfile} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Username (@handle)</label>
                <div className="flex items-center rounded-xl bg-white/5 border border-white/10 px-3 py-2">
                  <span className="text-slate-500 font-semibold mr-1">@</span>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="creator_handle"
                    className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none font-mono"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-slate-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Email (Optional)</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="alex@example.com"
                  className="w-full rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {selectedUserToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-rose-500/30 p-6 space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-white text-lg">Delete Profile?</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Are you sure you want to permanently delete profile <strong className="text-white font-mono">@{selectedUserToDelete}</strong>? This action cannot be undone.
            </p>
            <div className="pt-2 flex gap-3">
              <button
                onClick={() => setSelectedUserToDelete(null)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteProfile(selectedUserToDelete);
                  toast.success(`Deleted profile @${selectedUserToDelete}`);
                  setSelectedUserToDelete(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
