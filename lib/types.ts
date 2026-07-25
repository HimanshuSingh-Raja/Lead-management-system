import { Timestamp } from "firebase/firestore";
export type LeadStatus = "New" | "Contacted" | "Closed";
export interface Lead { id: string; fullName: string; email: string; budget: string; message: string; status: LeadStatus; createdAt: Timestamp | null; updatedAt: Timestamp | null; }

export interface UserProfile {
  uid: string;
  email: string;
  role?: string;
  displayName?: string;
  createdAt?: Timestamp | null;
}
