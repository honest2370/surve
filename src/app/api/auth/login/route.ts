// Login is now handled entirely on the frontend via Supabase JS client.
// This route is kept as a no-op for backwards compatibility.
export async function POST() {
  return Response.json(
    { error: "Use Supabase client-side auth" },
    { status: 410 }
  );
}
