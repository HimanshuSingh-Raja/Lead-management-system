"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Filter,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import type { Lead, LeadStatus } from "@/lib/types";
import { Logo } from "@/components/ui";

const statuses: LeadStatus[] = ["New", "Contacted", "Closed"];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading, logout } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "leads" | "settings">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Protect route
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Subscribe to real-time leads from Firestore
  useEffect(() => {
    if (!user) return;

    const leadsQuery = query(collection(db, "leads"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      leadsQuery,
      (snapshot) => {
        const fetchedLeads: Lead[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            fullName: data.fullName || "Unnamed Lead",
            email: data.email || "",
            budget: data.budget || "",
            message: data.message || "",
            status: (data.status as LeadStatus) || "New",
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
          };
        });
        setLeads(fetchedLeads);
        setLoadingLeads(false);
      },
      (error) => {
        console.error("Firestore subscription error:", error);
        toast.error("Failed to load leads from database.");
        setLoadingLeads(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Update lead status
  const updateStatus = async (leadId: string, newStatus: LeadStatus) => {
    setUpdatingId(leadId);
    try {
      const leadRef = doc(db, "leads", leadId);
      await updateDoc(leadRef, { status: newStatus, updatedAt: serverTimestamp() });
      toast.success(`Lead status updated to ${newStatus}`);
    } catch (error) {
      console.error("Status update error:", error);
      toast.error("Failed to update status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Sign out handler
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully");
      router.replace("/login");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  // Filtered leads calculation
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        searchQuery === "" ||
        lead.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.budget.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [leads, searchQuery, statusFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === "New").length;
    const contactedCount = leads.filter((l) => l.status === "Contacted").length;
    const closedCount = leads.filter((l) => l.status === "Closed").length;
    return { total, newCount, contactedCount, closedCount };
  }, [leads]);

  if (authLoading || (!user && authLoading)) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#080b16]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
          <p className="text-sm font-medium">Verifying access...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-[#080b16] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-[#0c1022]/80 backdrop-blur-xl p-5 sticky top-0 h-screen justify-between">
        <div className="space-y-8">
          <Logo />

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === "dashboard"
                  ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab("leads")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === "leads"
                  ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4" /> All Leads
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                {leads.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === "settings"
                  ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Settings className="h-4 w-4" /> Settings
            </button>
          </nav>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-500/20 text-brand-300 font-semibold border border-brand-400/20">
              {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200 truncate">
                {userProfile?.displayName || user.email}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-400">
                <ShieldCheck className="h-3 w-3" /> {userProfile?.role || "Admin"}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="md:hidden border-b border-white/10 bg-[#0c1022] p-4 flex items-center justify-between sticky top-0 z-30">
        <Logo />
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white"
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#0c1022] p-4 space-y-3 z-30">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/20 text-brand-300 font-semibold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200 truncate">{user.email}</p>
              <p className="text-xs text-brand-400">{userProfile?.role || "Admin"}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab("dashboard");
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-slate-300"
          >
            Dashboard
          </button>
          <button
            onClick={() => {
              setActiveTab("leads");
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-slate-300"
          >
            All Leads ({leads.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("settings");
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-slate-300"
          >
            Settings
          </button>
          <button
            onClick={handleLogout}
            className="block w-full text-left py-2 text-sm text-rose-400"
          >
            Sign out
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 overflow-y-auto">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              {activeTab === "dashboard" && "Dashboard Overview"}
              {activeTab === "leads" && "Lead Management"}
              {activeTab === "settings" && "Account & Settings"}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Welcome back, <span className="text-slate-200 font-medium">{userProfile?.displayName || user.email}</span>. Manage your incoming pipeline.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-400/25 bg-brand-400/10 text-xs font-medium text-brand-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live Firestore Sync
            </span>
          </div>
        </div>

        {/* Tab 1: Dashboard View */}
        {activeTab === "dashboard" && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Leads</span>
                  <Users className="h-5 w-5 text-brand-400" />
                </div>
                <p className="text-3xl font-bold mt-4">{stats.total}</p>
                <p className="text-xs text-slate-500 mt-1">All captured submissions</p>
              </div>

              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">New</span>
                  <Clock className="h-5 w-5 text-amber-400" />
                </div>
                <p className="text-3xl font-bold mt-4 text-amber-400">{stats.newCount}</p>
                <p className="text-xs text-slate-500 mt-1">Awaiting first contact</p>
              </div>

              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">In Contact</span>
                  <BarChart3 className="h-5 w-5 text-sky-400" />
                </div>
                <p className="text-3xl font-bold mt-4 text-sky-400">{stats.contactedCount}</p>
                <p className="text-xs text-slate-500 mt-1">Active conversation</p>
              </div>

              <div className="glass rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Closed</span>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                </div>
                <p className="text-3xl font-bold mt-4 text-emerald-400">{stats.closedCount}</p>
                <p className="text-xs text-slate-500 mt-1">Converted or completed</p>
              </div>
            </div>

            {/* Quick Actions / Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search leads by name, email, or budget..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-brand-400 placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 ml-1" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-white/10 bg-[#151929] px-3 py-2.5 text-sm text-white outline-none focus:border-brand-400"
                >
                  <option value="all">All Statuses</option>
                  <option value="New">New Only</option>
                  <option value="Contacted">Contacted Only</option>
                  <option value="Closed">Closed Only</option>
                </select>
              </div>
            </div>

            {/* Leads List Table */}
            <div className="glass rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-semibold text-base">Pipeline Leads ({filteredLeads.length})</h3>
                {loadingLeads && <Loader2 className="h-4 w-4 animate-spin text-brand-400" />}
              </div>

              {!loadingLeads && filteredLeads.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Users className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                  <p className="text-base font-medium text-slate-300">No leads found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {searchQuery || statusFilter !== "all"
                      ? "Try adjusting your search or status filter."
                      : "New leads will appear here automatically when submitted."}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/5 overflow-x-auto">
                  {filteredLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="p-5 hover:bg-white/[0.02] transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="font-medium text-white">{lead.fullName}</h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              lead.status === "New"
                                ? "bg-amber-400/10 text-amber-300 border-amber-400/20"
                                : lead.status === "Contacted"
                                ? "bg-sky-400/10 text-sky-300 border-sky-400/20"
                                : "bg-emerald-400/10 text-emerald-300 border-emerald-400/20"
                            }`}
                          >
                            {lead.status}
                          </span>
                          <span className="text-xs text-slate-500">
                            Budget: <strong className="text-slate-300">{lead.budget}</strong>
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-slate-500" />
                          <a href={`mailto:${lead.email}`} className="hover:underline text-slate-300">
                            {lead.email}
                          </a>
                        </p>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 italic">
                          &ldquo;{lead.message}&rdquo;
                        </p>
                      </div>

                      {/* Status Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 md:pt-0 border-t md:border-0 border-white/5">
                        <span className="text-xs text-slate-500 mr-1 hidden sm:inline">Set Status:</span>
                        {statuses.map((st) => (
                          <button
                            key={st}
                            disabled={lead.status === st || updatingId === lead.id}
                            onClick={() => updateStatus(lead.id, st)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 ${
                              lead.status === st
                                ? "bg-brand-500 text-white shadow-glow"
                                : "bg-white/5 text-slate-300 hover:bg-white/10"
                            }`}
                          >
                            {updatingId === lead.id && lead.status !== st ? (
                              <Loader2 className="h-3 w-3 animate-spin inline mr-1" />
                            ) : null}
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Leads List View */}
        {activeTab === "leads" && (
          <div className="glass rounded-2xl border border-white/10 p-6 space-y-6">
            <h3 className="font-semibold text-lg">All Captured Leads</h3>
            <p className="text-sm text-slate-400">
              Below is the comprehensive list of leads captured via the landing page form.
            </p>
            <div className="divide-y divide-white/10">
              {leads.map((lead) => (
                <div key={lead.id} className="py-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-white text-base">{lead.fullName}</h4>
                      <p className="text-sm text-slate-400">{lead.email}</p>
                    </div>
                    <span className="text-xs font-medium px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-400/20">
                      {lead.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{lead.message}</p>
                  <p className="text-xs text-slate-500">Budget Range: {lead.budget}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Settings View */}
        {activeTab === "settings" && (
          <div className="glass rounded-2xl border border-white/10 p-6 max-w-2xl space-y-6">
            <h3 className="font-semibold text-lg">User Profile & Auth</h3>
            <div className="space-y-4 text-sm text-slate-300">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase">User UID</label>
                <p className="font-mono text-xs text-slate-200 mt-1 bg-white/5 p-2 rounded-lg">{user.uid}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase">Email</label>
                <p className="text-sm font-medium text-white mt-1">{user.email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase">Role (From Firestore)</label>
                <p className="text-sm font-medium text-brand-400 mt-1">{userProfile?.role || "Admin"}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase">Authentication Method</label>
                <p className="text-sm text-slate-300 mt-1">Firebase Auth (Email & Password)</p>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-white/10 text-center text-xs text-slate-500">
          <a className="transition hover:text-slate-300" href="https://digitalheroesco.com" target="_blank" rel="noreferrer">
            Built for Digital Heroes Training Task
          </a>
        </footer>
      </main>
    </div>
  );
}
