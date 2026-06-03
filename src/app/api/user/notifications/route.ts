import { supabaseAdmin } from "@/lib/supabase";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getAuthUser(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const { data: { user }, error } =
    await supabaseAdmin.auth.getUser(authHeader.slice(7));
  if (error || !user) return null;
  return user;
}

export async function GET(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, authUser.id))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    const unreadCount = notifs.filter((n) => !n.read).length;
    return Response.json({ notifications: notifs, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const authUser = await getAuthUser(request);
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(
          eq(notifications.userId, authUser.id),
          eq(notifications.read, false)
        )
      );

    return Response.json({ status: "ok" });
  } catch (error) {
    console.error("Update notifications error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
