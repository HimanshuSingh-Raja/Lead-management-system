"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Lead } from "@/lib/types";

interface AnalyticsChartsProps {
  leads: Lead[];
}

const STATUS_COLORS = {
  New: "#f59e0b",
  Contacted: "#38bdf8",
  Closed: "#10b981",
  Lost: "#f43f5e",
};

const SOURCE_COLORS = ["#8b5cf6", "#ec4899", "#3b82f6", "#10b981", "#f59e0b", "#64748b"];

export function AnalyticsCharts({ leads }: AnalyticsChartsProps) {
  // Status breakdown data
  const statusData = useMemo(() => {
    const counts = { New: 0, Contacted: 0, Closed: 0, Lost: 0 };
    leads.forEach((l) => {
      const st = l.status || "New";
      counts[st] = (counts[st] || 0) + 1;
    });
    return [
      { name: "New", value: counts.New, color: STATUS_COLORS.New },
      { name: "Contacted", value: counts.Contacted, color: STATUS_COLORS.Contacted },
      { name: "Closed", value: counts.Closed, color: STATUS_COLORS.Closed },
      { name: "Lost", value: counts.Lost, color: STATUS_COLORS.Lost },
    ].filter((d) => d.value > 0);
  }, [leads]);

  // Source breakdown data
  const sourceData = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach((l) => {
      const src = l.source || "Website";
      map[src] = (map[src] || 0) + 1;
    });
    return Object.keys(map).map((key, i) => ({
      name: key,
      count: map[key],
      fill: SOURCE_COLORS[i % SOURCE_COLORS.length],
    }));
  }, [leads]);

  // Trend mock/calculated data
  const trendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    return months.map((m, idx) => ({
      month: m,
      leads: Math.max(2, Math.floor(leads.length * ((idx + 3) / 10))),
      conversions: Math.max(1, Math.floor(leads.length * ((idx + 1) / 15))),
    }));
  }, [leads]);

  // Conversion metrics
  const conversionRate = useMemo(() => {
    if (!leads.length) return "0%";
    const closed = leads.filter((l) => l.status === "Closed").length;
    return `${((closed / leads.length) * 100).toFixed(1)}%`;
  }, [leads]);

  return (
    <div className="space-y-6">
      {/* Top Metric Bar */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="glass rounded-2xl border border-white/10 p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-400">Total Leads Handled</span>
          <p className="text-2xl font-bold text-white mt-2">{leads.length}</p>
        </div>
        <div className="glass rounded-2xl border border-white/10 p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-400">Conversion Rate</span>
          <p className="text-2xl font-bold text-emerald-400 mt-2">{conversionRate}</p>
        </div>
        <div className="glass rounded-2xl border border-white/10 p-4 flex flex-col justify-between">
          <span className="text-xs font-medium text-slate-400">Avg Response Target</span>
          <p className="text-2xl font-bold text-brand-300 mt-2">&lt; 2 Hours</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Trend Area Chart */}
        <div className="glass rounded-2xl border border-white/10 p-5 space-y-4">
          <h4 className="text-sm font-semibold text-white">Pipeline Trend & Conversion Growth</h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorClosed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }} />
                <Area type="monotone" dataKey="leads" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorLeads)" name="Total Leads" />
                <Area type="monotone" dataKey="conversions" stroke="#10b981" fillOpacity={1} fill="url(#colorClosed)" name="Conversions" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Donut Chart */}
        <div className="glass rounded-2xl border border-white/10 p-5 space-y-4">
          <h4 className="text-sm font-semibold text-white">Leads Breakdown by Status</h4>
          <div className="h-64 w-full flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-slate-500">No lead data to display</p>
            )}
          </div>
        </div>

        {/* Lead Source Bar Chart */}
        <div className="glass rounded-2xl border border-white/10 p-5 space-y-4 lg:col-span-2">
          <h4 className="text-sm font-semibold text-white">Lead Acquisition by Channel</h4>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", color: "#fff" }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} name="Acquisitions">
                  {sourceData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
