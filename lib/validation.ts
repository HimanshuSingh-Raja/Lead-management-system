import { z } from "zod";

export const leadSchema = z.object({
  fullName: z.string().min(2, "Enter full name (minimum 2 characters)").max(80),
  email: z.string().email("Enter a valid email address"),
  phone: z.string().optional().or(z.literal("")),
  company: z.string().optional().or(z.literal("")),
  budget: z.string().min(1, "Choose a budget range"),
  message: z.string().min(5, "Please enter a message (minimum 5 characters)").max(2000),
  status: z.enum(["New", "Contacted", "Closed", "Lost"]).optional().default("New"),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional().default("Medium"),
  source: z.enum(["Website", "Referral", "LinkedIn", "Cold Call", "Organic", "Other"]).optional().default("Website"),
  assignedTo: z.string().optional().or(z.literal("")),
  assignedToName: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  followUpDate: z.string().optional().nullable().or(z.literal("")),
  tags: z.array(z.string()).optional().default([]),
});

export const leadUpdateSchema = leadSchema.partial();

export const leadNoteSchema = z.object({
  content: z.string().min(2, "Note content cannot be empty"),
  author: z.string().optional(),
});

export const csvRowSchema = z.object({
  fullName: z.string().min(2, "Invalid name"),
  email: z.string().email("Invalid email"),
  budget: z.string().default("Under $5,000"),
  message: z.string().min(1, "Invalid message").default("Imported lead inquiry"),
  company: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  status: z.enum(["New", "Contacted", "Closed", "Lost"]).optional().default("New"),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).optional().default("Medium"),
  source: z.enum(["Website", "Referral", "LinkedIn", "Cold Call", "Organic", "Other"]).optional().default("Other"),
});

export type LeadInput = z.infer<typeof leadSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;
export type LeadNoteInput = z.infer<typeof leadNoteSchema>;
