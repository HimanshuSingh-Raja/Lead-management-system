import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { leadSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const input = leadSchema.parse(await request.json());

    // Use Admin SDK if credentials provided, otherwise fallback to Client SDK
    const hasAdminCreds =
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY;

    if (hasAdminCreds) {
      const now = FieldValue.serverTimestamp();
      await adminDb().collection("leads").add({
        ...input,
        status: "New",
        createdAt: now,
        updatedAt: now,
      });
    } else {
      const now = serverTimestamp();
      await addDoc(collection(db, "leads"), {
        ...input,
        status: "New",
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Lead submission error:", error);
    const message =
      error instanceof Error && error.name === "ZodError"
        ? "Please check the form fields."
        : "Unable to submit your lead right now.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
