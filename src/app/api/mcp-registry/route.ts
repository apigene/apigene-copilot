import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serverId = searchParams.get("id");
    const limit = searchParams.get("limit");
    const cursor = searchParams.get("cursor");

    let url = "https://registry.modelcontextprotocol.io/v0/servers";
    if (serverId) {
      url += `/${serverId}`;
    } else {
      // Add pagination parameters for list requests
      const urlParams = new URLSearchParams();
      if (limit) {
        const limitNum = parseInt(limit);
        if (limitNum >= 1 && limitNum <= 100) {
          urlParams.set("limit", limit);
        }
      }
      if (cursor) {
        urlParams.set("cursor", cursor);
      }

      if (urlParams.toString()) {
        url += `?${urlParams.toString()}`;
      }
    }

    console.log("Proxying request to:", url);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json, application/problem+json",
        "User-Agent": "Apigene-Copilot/1.0",
      },
    });

    if (!response.ok) {
      console.error(
        "Registry API error:",
        response.status,
        response.statusText,
      );
      return NextResponse.json(
        { error: `Registry API error: ${response.status}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    console.log("Successfully fetched data from registry");

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error proxying registry request:", error);
    return NextResponse.json(
      { error: "Failed to fetch from registry" },
      { status: 500 },
    );
  }
}
