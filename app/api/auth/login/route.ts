import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    const cookieStore = await cookies();
    cookieStore.set("__session", idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 5, // 5 days
      path: "/",
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Session login error:", error);
    return NextResponse.json({ error: "Failed to set session cookie" }, { status: 500 });
  }
}
