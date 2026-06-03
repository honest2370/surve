import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
    if (error || !user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appId = process.env.RAPIDOREACH_APP_ID;
    const appKey = process.env.RAPIDOREACH_APP_KEY;

    if (!appId || !appKey) {
      return Response.json({ error: "Survey provider not configured" }, { status: 503 });
    }

    // Fetch available surveys from RapidoReach
    const rrRes = await fetch(
      `https://api.rapidoreach.com/v1/surveys?app_id=${appId}&user_id=${user.id}`,
      {
        headers: {
          Authorization: `Bearer ${appKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!rrRes.ok) {
      console.error("RapidoReach API error:", rrRes.status, await rrRes.text());
      return Response.json({ surveys: [], wallUrl: buildWallUrl(appId, user.id) });
    }

    const data = await rrRes.json();
    return Response.json({
      surveys: data.surveys || [],
      wallUrl: buildWallUrl(appId, user.id),
    });
  } catch (error) {
    console.error("Surveys error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

function buildWallUrl(appId: string, userId: string) {
  return `https://www.rapidoreach.com/web_offerwall?app_id=${appId}&user_id=${userId}`;
}
