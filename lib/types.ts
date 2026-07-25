import { Timestamp } from "firebase/firestore";

export type LeadStatus = "New" | "Contacted" | "Closed" | "Lost";
export type LeadPriority = "Low" | "Medium" | "High" | "Urgent";
export type LeadSource = "Website" | "Referral" | "LinkedIn" | "Cold Call" | "Organic" | "Other";
export type UserRole = "Admin" | "Manager" | "Sales";

export interface LeadNote {
  id: string;
  content: string;
  author: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  company?: string;
  budget: string;
  message: string;
  status: LeadStatus;
  priority: LeadPriority;
  source: LeadSource;
  assignedTo?: string;
  assignedToName?: string;
  address?: string;
  tags?: string[];
  followUpDate?: string | null;
  lastContactDate?: string | null;
  notes?: LeadNote[];
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  displayName?: string;
  createdAt?: Timestamp | null;
}

export interface ActivityLog {
  id: string;
  leadId?: string;
  type: "CREATED" | "UPDATED" | "DELETED" | "STATUS_CHANGED" | "ASSIGNED" | "NOTE_ADDED";
  description: string;
  performedBy: string;
  timestamp: Timestamp | null;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "ASSIGNMENT" | "STATUS" | "FOLLOWUP" | "NEW_LEAD";
  read: boolean;
  targetUserEmail?: string;
  createdAt: Timestamp | null;
}
