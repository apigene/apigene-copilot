import { ensureUserExists } from "auth/server";
import { NextResponse } from "next/server";
import { apigeneApi } from "lib/api/apigene-client";
import { clerkServerAdapter } from "lib/auth/clerk/server-adapter";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await ensureUserExists();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the session to access the token
    const session = await clerkServerAdapter.getSession();
    const userToken = session?.accessToken;

    // Set up the API client with the token
    if (userToken) {
      apigeneApi.setTokenGetter(async () => userToken);
    }

    // Fetch user info from backend API using apigene-client
    const backendUserInfo = await apigeneApi.get("/api/user/me");

    // Transform backend response to match our User type
    const userInfo = {
      id: user.id,
      name: backendUserInfo.name || user.name || "User",
      email: backendUserInfo.email || user.email || "",
      image: user.image || null,
      trial_expire_in: backendUserInfo.trial_expire_in,
      // Additional fields from backend
      org_name: backendUserInfo.org_name,
      org_id: backendUserInfo.org_id,
      role: backendUserInfo.role,
      onboarding_completed: backendUserInfo.onboarding_completed,
      features: backendUserInfo.features,
    };

    return NextResponse.json(userInfo);
  } catch (error: any) {
    console.error("Failed to fetch user info:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get user info" },
      { status: 500 },
    );
  }
}
