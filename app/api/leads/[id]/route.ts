import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { adminDb } from "@/lib/firebase-admin";
import { db } from "@/lib/firebase";
import { leadUpdateSchema } from "@/lib/validation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updateData = leadUpdateSchema.parse(body);

    const hasAdminCreds =
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY;

    if (hasAdminCreds) {
      const now = FieldValue.serverTimestamp();
      await adminDb().collection("leads").doc(id).update({
        ...updateData,
        updatedAt: now,
      });

      await adminDb().collection("activity_logs").add({
        leadId: id,
        type: "UPDATED",
        description: `Lead updated via API. Status: ${updateData.status || "Unchanged"}`,
        performedBy: "System/API",
        timestamp: now,
      });
    } else {
      const leadRef = doc(db, "leads", id);
      await updateDoc(leadRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });
    }

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (error) {
    console.error("PUT lead error:", error);
    const message =
      error instanceof Error && error.name === "ZodError"
        ? "Invalid fields submitted for update."
        : "Failed to update lead.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const hasAdminCreds =
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY;

    if (hasAdminCreds) {
      await adminDb().collection("leads").doc(id).delete();
      await adminDb().collection("activity_logs").add({
        leadId: id,
        type: "DELETED",
        description: `Lead ${id} deleted from system`,
        performedBy: "System/API",
        timestamp: FieldValue.serverTimestamp(),
      });
    } else {
      await deleteDoc(doc(db, "leads", id));
    }

    return NextResponse.json({ ok: true, id }, { status: 200 });
  } catch (error) {
    console.error("DELETE lead error:", error);
    return NextResponse.json({ error: "Unable to delete lead." }, { status: 400 });
  }
}
