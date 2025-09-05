// Clerk handles authentication automatically through middleware
// This file is kept for compatibility but Clerk doesn't need explicit auth routes
export async function GET() {
  return new Response("Auth handled by Clerk middleware", { status: 200 });
}

export async function POST() {
  return new Response("Auth handled by Clerk middleware", { status: 200 });
}
