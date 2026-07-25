"use client";

import { useEffect, useState } from "react";
import { Activity, Clock, History, Loader2, User } from "lucide-react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ActivityLog } from "@/lib/types";

export function ActivityLogDrawer() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const logsQuery = query(
      collection(db, "activity_logs"),
      orderBy("timestamp", "desc"),
      limit(30)
    );

    const unsubscribe = onSnapshot(
      logsQuery,
      (snapshot) => {
        const fetchedLogs: ActivityLog[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            leadId: data.leadId || "",
            type: data.type || "UPDATED",
            description: data.description || "",
            performedBy: data.performedBy || "System",
            timestamp: data.timestamp || null,
          };
        });
        setLogs(fetchedLogs);
        setLoading(false);
      },
      (err) => {
        console.error("Activity log subscription error:", err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin text-brand-400 mr-2" />
        <span className="text-sm">Loading activity trail...</span>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-white/10 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-brand-400" />
          <h3 className="font-semibold text-lg text-white">System Audit & Activity Trail</h3>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-slate-300 font-mono">
          Last 30 Events
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="p-8 text-center text-slate-400">
          <Activity className="h-8 w-8 mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-medium">No activity history recorded yet</p>
          <p className="text-xs text-slate-500 mt-1">Actions performed across the CRM will appear here automatically.</p>
        </div>
      ) : (
        <div className="relative border-l border-white/10 ml-3 space-y-6 pl-6">
          {logs.map((log) => (
            <div key={log.id} className="relative group">
              <span className="absolute -left-[31px] top-1.5 grid h-4 w-4 place-items-center rounded-full bg-brand-500 ring-4 ring-[#080b16]" />
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-brand-500/20 text-brand-300">
                    {log.type}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <User className="h-3 w-3" /> {log.performedBy}
                  </span>
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 ml-auto">
                    <Clock className="h-3 w-3" />{" "}
                    {log.timestamp && (log.timestamp as { toDate?: () => Date }).toDate
                      ? (log.timestamp as { toDate: () => Date }).toDate().toLocaleString()
                      : new Date().toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-200">{log.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
