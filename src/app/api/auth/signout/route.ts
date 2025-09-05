import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Always redirect to sign-in page
    // Clerk will handle clearing the session
    return NextResponse.redirect(
      new URL(
        "/sign-in",
        process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "http://localhost:3000",
      ),
    );
  } catch (error) {
    console.error("Sign out error:", error);
    // On error, redirect to sign-in page
    return NextResponse.redirect(
      new URL(
        "/sign-in",
        process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "http://localhost:3000",
      ),
    );
  }
}

export async function POST() {
  // Handle POST requests the same way as GET
  return GET();
}
