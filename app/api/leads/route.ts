import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { ZodError } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { leadSchema } from "@/lib/validation";

// Enforce a strict execution timeout so API requests NEVER stay pending forever
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Server operation timed out after ${ms}ms`));
    }, ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    console.log("📥 Incoming lead submission payload:", json);

    // Validate payload against Zod Schema
    const input = leadSchema.parse(json);

    const hasAdminCreds =
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY;

    let docId = "";

    const performWrite = async () => {
      if (hasAdminCreds) {
        const now = FieldValue.serverTimestamp();
        const docRef = await adminDb().collection("leads").add({
          fullName: input.fullName,
          email: input.email,
          phone: input.phone || "",
          company: input.company || "",
          budget: input.budget,
          message: input.message,
          status: input.status || "New",
          priority: input.priority || "Medium",
          source: input.source || "Website",
          createdAt: now,
          updatedAt: now,
        });
        docId = docRef.id;

        // Log Activity Audit Trail via Admin SDK (bypasses security rules)
        try {
          await adminDb().collection("activity_logs").add({
            leadId: docRef.id,
            type: "CREATED",
            description: `New lead created: ${input.fullName} (${input.email})`,
            performedBy: input.email,
            timestamp: now,
          });
        } catch (e) {
          console.warn("Activity log write bypassed:", e);
        }
      } else {
        const now = serverTimestamp();
        const docRef = await addDoc(collection(db, "leads"), {
          fullName: input.fullName,
          email: input.email,
          phone: input.phone || "",
          company: input.company || "",
          budget: input.budget,
          message: input.message,
          status: input.status || "New",
          priority: input.priority || "Medium",
          source: input.source || "Website",
          createdAt: now,
          updatedAt: now,
        });
        docId = docRef.id;
      }
    };

    // Guarantee response within 7 seconds maximum
    await withTimeout(performWrite(), 7000);

    console.log(`✅ Firestore lead created successfully with ID: ${docId}`);
    return NextResponse.json({ success: true, ok: true, id: docId }, { status: 201 });
  } catch (error) {
    console.error("❌ Lead submission error:", error);

    let errorMessage = "Unable to submit your lead right now.";
    const fieldErrors: Record<string, string> = {};

    if (error instanceof ZodError) {
      const details = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
      errorMessage = `Validation error — ${details}`;
      error.errors.forEach((e) => {
        if (e.path.length > 0) {
          fieldErrors[e.path[0].toString()] = e.message;
        }
      });
    } else if (error instanceof Error) {
      if (error.message.includes("permission") || error.message.includes("insufficient")) {
        errorMessage = "Firestore Security Rules restriction: Please publish public create rules for 'leads' collection in Firebase Console.";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json(
      { success: false, error: errorMessage, fieldErrors },
      { status: 400 }
    );
  }
}
