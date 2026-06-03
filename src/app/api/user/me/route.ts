import { supabaseAdmin } from "@/lib/supabase";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice(7);

    // Verify token with Supabase Auth
    const { data: { user: authUser }, error } =
      await supabaseAdmin.auth.getUser(token);

    if (error || !authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        pointsBalance: users.pointsBalance,
        totalEarned: users.totalEarned,
        surveysCompleted: users.surveysCompleted,
        level: users.level,
        xp: users.xp,
        streak: users.streak,
        referralCode: users.referralCode,
        darkMode: users.darkMode,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    return Response.json({ user });
  } catch (error) {
    console.error("Get user error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
