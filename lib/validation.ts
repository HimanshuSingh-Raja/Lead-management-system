import { z } from "zod";
export const leadSchema = z.object({ fullName: z.string().min(2, "Enter your full name").max(80), email: z.string().email("Enter a valid email"), budget: z.string().min(1, "Choose a budget range"), message: z.string().min(10, "Please share a little more (10 characters minimum)").max(2000) });
export type LeadInput = z.infer<typeof leadSchema>;
