"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Filter,
  History,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import type { Lead, LeadPriority, LeadSource, LeadStatus } from "@/lib/types";
import { Logo } from "@/components/ui";

// CRM Sub-components
import { EditLeadModal } from "@/components/crm/edit-lead-modal";
import { DeleteConfirmModal } from "@/components/crm/delete-confirm-modal";
import { ImportCsvModal } from "@/components/crm/import-csv-modal";
import { ExportTools } from "@/components/crm/export-tools";
import { AnalyticsCharts } from "@/components/crm/analytics-charts";
import { ActivityLogDrawer } from "@/components/crm/activity-log-drawer";
import { NotificationsPopover } from "@/components/crm/notifications-popover";

const statuses: LeadStatus[] = ["New", "Contacted", "Closed", "Lost"];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, userProfile, loading: authLoading, role, canDeleteLead, canEditLead, logout } = useAuth();
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(true);
  const [activeTab, setActiveTab] = useState<"analytics" | "leads" | "activity" | "settings">("analytics");
  
  // Filtering, Search, Sorting & Pagination State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"createdAt" | "fullName" | "priority">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Modals & Action States
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const [selectedLeadForDelete, setSelectedLeadForDelete] = useState<Lead | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Protected route check
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  // Subscribe to real-time Firestore leads
  useEffect(() => {
    if (!user) return;

    const leadsQuery = query(collection(db, "leads"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      leadsQuery,
      (snapshot) => {
        const fetched: Lead[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            fullName: data.fullName || "Unnamed Lead",
            email: data.email || "",
            phone: data.phone || "",
            company: data.company || "",
            budget: data.budget || "Under $5,000",
            message: data.message || "",
            status: (data.status as LeadStatus) || "New",
            priority: (data.priority as LeadPriority) || "Medium",
            source: (data.source as LeadSource) || "Website",
            assignedTo: data.assignedTo || "",
            assignedToName: data.assignedToName || "",
            address: data.address || "",
            tags: data.tags || [],
            followUpDate: data.followUpDate || null,
            notes: data.notes || [],
            createdAt: data.createdAt || null,
            updatedAt: data.updatedAt || null,
          };
        });
        setLeads(fetched);
        setLoadingLeads(false);
      },
      (err) => {
        console.error("Firestore subscription error:", err);
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
      await updateDoc(leadRef, {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      toast.success(`Status updated to ${newStatus}`);
    } catch (err) {
      console.error("Status update error:", err);
      toast.error("Failed to update lead status.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully");
      router.replace("/login");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  // Multi-column filtering & sorting calculation
  const filteredAndSortedLeads = useMemo(() => {
    const queryLower = searchQuery.toLowerCase().trim();
    const result = leads.filter((lead) => {
      const matchesSearch =
        queryLower === "" ||
        lead.fullName.toLowerCase().includes(queryLower) ||
        lead.email.toLowerCase().includes(queryLower) ||
        (lead.company || "").toLowerCase().includes(queryLower) ||
        (lead.phone || "").toLowerCase().includes(queryLower) ||
        lead.message.toLowerCase().includes(queryLower) ||
        lead.budget.toLowerCase().includes(queryLower);

      const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort
    return [...result].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (sortBy === "createdAt") {
        valA = (a.createdAt as { seconds?: number })?.seconds || 0;
        valB = (b.createdAt as { seconds?: number })?.seconds || 0;
      } else {
        valA = String(a[sortBy] || "");
        valB = String(b[sortBy] || "");
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [leads, searchQuery, statusFilter, priorityFilter, sortBy, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredAndSortedLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedLeads.slice(start, start + pageSize);
  }, [filteredAndSortedLeads, currentPage, pageSize]);

  // Overall Stats
  const stats = useMemo(() => {
    const total = leads.length;
    const newCount = leads.filter((l) => l.status === "New").length;
    const contactedCount = leads.filter((l) => l.status === "Contacted").length;
    const closedCount = leads.filter((l) => l.status === "Closed").length;
    const lostCount = leads.filter((l) => l.status === "Lost").length;
    return { total, newCount, contactedCount, closedCount, lostCount };
  }, [leads]);

  if (authLoading || (!user && authLoading)) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#080b16]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
          <p className="text-sm font-medium">Verifying CRM Authorization...</p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#080b16] text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r border-white/10 bg-[#0c1022]/80 backdrop-blur-xl p-5 sticky top-0 h-screen justify-between z-20">
        <div className="space-y-8">
          <Logo />

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab("analytics")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === "analytics"
                  ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" /> Analytics & KPIs
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
                <Users className="h-4 w-4" /> Leads Pipeline
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                {leads.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("activity")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === "activity"
                  ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <History className="h-4 w-4" /> Audit Trail Log
            </button>

            <button
              onClick={() => setActiveTab("settings")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === "settings"
                  ? "bg-brand-500/20 text-brand-300 border border-brand-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
              }`}
            >
              <Settings className="h-4 w-4" /> Team & Roles
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
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-400 uppercase">
                <ShieldCheck className="h-3 w-3" /> {role} Role
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
        <div className="flex items-center gap-2">
          <NotificationsPopover />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#0c1022] p-4 space-y-3 z-30">
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-500/20 text-brand-300 font-semibold">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200 truncate">{user.email}</p>
              <p className="text-xs text-brand-400 uppercase font-semibold">{role} Role</p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab("analytics");
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-slate-300"
          >
            Analytics & KPIs
          </button>
          <button
            onClick={() => {
              setActiveTab("leads");
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-slate-300"
          >
            Leads Pipeline ({leads.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("activity");
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-slate-300"
          >
            Audit Trail Log
          </button>
          <button
            onClick={() => {
              setActiveTab("settings");
              setMobileMenuOpen(false);
            }}
            className="block w-full text-left py-2 text-sm text-slate-300"
          >
            Team & Roles
          </button>
          <button onClick={handleLogout} className="block w-full text-left py-2 text-sm text-rose-400">
            Sign out
          </button>
        </div>
      )}

      {/* Main Content View */}
      <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-7xl mx-auto space-y-8 overflow-y-auto">
        {/* Top App Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
              {activeTab === "analytics" && "Analytics & Performance Dashboard"}
              {activeTab === "leads" && "Enterprise Lead Pipeline"}
              {activeTab === "activity" && "Audit History Trail"}
              {activeTab === "settings" && "RBAC & Team Administration"}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Welcome back, <span className="text-slate-200 font-medium">{userProfile?.displayName || user.email}</span>. Live CRM sync active.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <ExportTools leads={leads} />
            <button
              onClick={() => setImportModalOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-brand-400/30 bg-brand-400/10 px-3.5 py-2 text-xs font-semibold text-brand-300 hover:bg-brand-400/20 transition"
            >
              <Upload className="h-3.5 w-3.5" /> Import CSV
            </button>
            <NotificationsPopover />
          </div>
        </div>

        {/* TAB 1: Analytics & KPIs View */}
        {activeTab === "analytics" && (
          <div className="space-y-8">
            <AnalyticsCharts leads={leads} />
          </div>
        )}

        {/* TAB 2: Advanced Leads Table View */}
        {activeTab === "leads" && (
          <div className="space-y-6">
            {/* Quick KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <div className="glass rounded-2xl p-4 border border-white/10">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total</span>
                <p className="text-2xl font-bold mt-2 text-white">{stats.total}</p>
              </div>
              <div className="glass rounded-2xl p-4 border border-white/10">
                <span className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">New</span>
                <p className="text-2xl font-bold mt-2 text-amber-400">{stats.newCount}</p>
              </div>
              <div className="glass rounded-2xl p-4 border border-white/10">
                <span className="text-[11px] font-medium text-sky-400 uppercase tracking-wider">Contacted</span>
                <p className="text-2xl font-bold mt-2 text-sky-400">{stats.contactedCount}</p>
              </div>
              <div className="glass rounded-2xl p-4 border border-white/10">
                <span className="text-[11px] font-medium text-emerald-400 uppercase tracking-wider">Closed</span>
                <p className="text-2xl font-bold mt-2 text-emerald-400">{stats.closedCount}</p>
              </div>
              <div className="glass rounded-2xl p-4 border border-white/10">
                <span className="text-[11px] font-medium text-rose-400 uppercase tracking-wider">Lost</span>
                <p className="text-2xl font-bold mt-2 text-rose-400">{stats.lostCount}</p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="glass rounded-2xl p-4 border border-white/10 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by Name, Email, Company, Phone, or Message..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-2.5 text-sm text-white outline-none focus:border-brand-400 placeholder:text-slate-600"
                />
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Filter className="h-3.5 w-3.5 text-slate-400" /> Status:
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-white/10 bg-[#151929] px-2.5 py-2 text-xs text-white outline-none focus:border-brand-400"
                  >
                    <option value="all">All Statuses</option>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Closed">Closed</option>
                    <option value="Lost">Lost</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  Priority:
                  <select
                    value={priorityFilter}
                    onChange={(e) => {
                      setPriorityFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="rounded-xl border border-white/10 bg-[#151929] px-2.5 py-2 text-xs text-white outline-none focus:border-brand-400"
                  >
                    <option value="all">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  Sort:
                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [field, order] = e.target.value.split("-");
                      setSortBy(field as "createdAt" | "fullName" | "priority");
                      setSortOrder(order as "asc" | "desc");
                    }}
                    className="rounded-xl border border-white/10 bg-[#151929] px-2.5 py-2 text-xs text-white outline-none focus:border-brand-400"
                  >
                    <option value="createdAt-desc">Newest First</option>
                    <option value="createdAt-asc">Oldest First</option>
                    <option value="fullName-asc">Name (A-Z)</option>
                    <option value="fullName-desc">Name (Z-A)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Leads Table Container */}
            <div className="glass rounded-2xl border border-white/10 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
                <h3 className="font-semibold text-sm text-white">
                  Lead Entries ({filteredAndSortedLeads.length} total)
                </h3>
                {loadingLeads && <Loader2 className="h-4 w-4 animate-spin text-brand-400" />}
              </div>

              {!loadingLeads && paginatedLeads.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Users className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                  <p className="text-base font-medium text-slate-300">No matching leads found</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Try clearing your search query or filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="border-b border-white/10 bg-white/[0.02] uppercase tracking-wider text-slate-400 font-semibold">
                      <tr>
                        <th className="p-4">Lead Contact</th>
                        <th className="p-4">Company / Phone</th>
                        <th className="p-4">Budget</th>
                        <th className="p-4">Priority</th>
                        <th className="p-4">Status</th>
                        <th className="p-4">Follow-up</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {paginatedLeads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-white/[0.02] transition">
                          <td className="p-4">
                            <p className="font-semibold text-white">{lead.fullName}</p>
                            <p className="text-slate-400 text-[11px]">{lead.email}</p>
                            {lead.message && (
                              <p className="text-[11px] text-slate-500 line-clamp-1 italic mt-0.5">
                                &ldquo;{lead.message}&rdquo;
                              </p>
                            )}
                          </td>
                          <td className="p-4">
                            <p className="text-slate-200">{lead.company || "N/A"}</p>
                            <p className="text-slate-500 text-[11px]">{lead.phone || "No phone"}</p>
                          </td>
                          <td className="p-4 font-medium text-slate-200">{lead.budget}</td>
                          <td className="p-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                                lead.priority === "Urgent"
                                  ? "bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse"
                                  : lead.priority === "High"
                                  ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                                  : lead.priority === "Medium"
                                  ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
                                  : "bg-slate-500/20 text-slate-400 border-slate-500/30"
                              }`}
                            >
                              {lead.priority || "Medium"}
                            </span>
                          </td>
                          <td className="p-4">
                            <select
                              value={lead.status}
                              disabled={updatingId === lead.id || !canEditLead(lead)}
                              onChange={(e) => updateStatus(lead.id, e.target.value as LeadStatus)}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold border outline-none cursor-pointer transition ${
                                lead.status === "New"
                                  ? "bg-amber-400/10 text-amber-300 border-amber-400/20"
                                  : lead.status === "Contacted"
                                  ? "bg-sky-400/10 text-sky-300 border-sky-400/20"
                                  : lead.status === "Closed"
                                  ? "bg-emerald-400/10 text-emerald-300 border-emerald-400/20"
                                  : "bg-rose-400/10 text-rose-300 border-rose-400/20"
                              }`}
                            >
                              {statuses.map((st) => (
                                <option key={st} value={st} className="bg-[#151929] text-white">
                                  {st}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-4 text-slate-400 text-[11px]">
                            {lead.followUpDate ? (
                              <span className="flex items-center gap-1 text-brand-300">
                                <Calendar className="h-3 w-3" /> {lead.followUpDate}
                              </span>
                            ) : (
                              "Not set"
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {canEditLead(lead) && (
                                <button
                                  onClick={() => setSelectedLeadForEdit(lead)}
                                  className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 transition"
                                  title="Edit lead details"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </button>
                              )}

                              {canDeleteLead() && (
                                <button
                                  onClick={() => setSelectedLeadForDelete(lead)}
                                  className="p-1.5 rounded-lg border border-rose-500/20 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition"
                                  title="Delete lead document"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Pagination Bar */}
              <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <span>Rows per page:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="rounded-lg border border-white/10 bg-[#151929] px-2 py-1 text-white outline-none"
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                  <span>
                    Showing {Math.min((currentPage - 1) * pageSize + 1, filteredAndSortedLeads.length)} -{" "}
                    {Math.min(currentPage * pageSize, filteredAndSortedLeads.length)} of {filteredAndSortedLeads.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg border border-white/10 bg-white/5 disabled:opacity-30 hover:bg-white/10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-semibold text-slate-200">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg border border-white/10 bg-white/5 disabled:opacity-30 hover:bg-white/10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Activity History Trail View */}
        {activeTab === "activity" && <ActivityLogDrawer />}

        {/* TAB 4: Team Settings View */}
        {activeTab === "settings" && (
          <div className="glass rounded-2xl border border-white/10 p-6 max-w-3xl space-y-6">
            <h3 className="font-semibold text-lg text-white">RBAC Role Administration</h3>
            <p className="text-xs text-slate-400">
              Role-Based Access Control enforces feature permissions across the CRM system.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-brand-400/30 bg-brand-400/10 p-4 space-y-2">
                <span className="text-xs font-bold text-brand-300 uppercase">Admin Role</span>
                <p className="text-xs text-slate-300">Full Access: Create, Edit, Delete, Assign Leads & Manage Team Settings.</p>
              </div>
              <div className="rounded-xl border border-sky-400/30 bg-sky-400/10 p-4 space-y-2">
                <span className="text-xs font-bold text-sky-300 uppercase">Manager Role</span>
                <p className="text-xs text-slate-300">Team Manager: View, Edit & Assign leads to team members.</p>
              </div>
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 space-y-2">
                <span className="text-xs font-bold text-emerald-300 uppercase">Sales Role</span>
                <p className="text-xs text-slate-300">Sales Rep: View & Update status for assigned pipeline leads.</p>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10 text-sm text-slate-300">
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase">User UID</label>
                <p className="font-mono text-xs text-slate-200 mt-1 bg-white/5 p-2.5 rounded-xl">{user.uid}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase">Email Address</label>
                <p className="text-sm font-medium text-white mt-1">{user.email}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 uppercase">Current Assigned Role</label>
                <p className="text-sm font-bold text-brand-400 mt-1 uppercase">{role}</p>
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 pt-6 border-t border-white/10 text-center text-xs text-slate-500">
          Built for{" "}
          <a
            className="transition hover:text-slate-300 underline underline-offset-4"
            href="https://digitalheroesco.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Digital Heroes Training Task
          </a>
        </footer>
      </main>

      {/* CRM Modals */}
      <EditLeadModal
        lead={selectedLeadForEdit}
        isOpen={!!selectedLeadForEdit}
        onClose={() => setSelectedLeadForEdit(null)}
      />
      <DeleteConfirmModal
        lead={selectedLeadForDelete}
        isOpen={!!selectedLeadForDelete}
        onClose={() => setSelectedLeadForDelete(null)}
      />
      <ImportCsvModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />
    </div>
  );
}
