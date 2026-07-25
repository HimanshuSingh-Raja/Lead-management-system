import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete("__session");
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Session logout error:", error);
    return NextResponse.json({ error: "Failed to clear session cookie" }, { status: 500 });
  }
}
