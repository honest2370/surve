import { supabaseAdmin } from "@/lib/supabase";
import { db } from "@/db";
import { users, transactions, notifications, surveyWallSessions } from "@/db/schema";
import { desc, sql } from "drizzle-orm";

const ADMIN_EMAIL = "honesttech237@gmail.com";

async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
  if (error || !user || user.email !== ADMIN_EMAIL) return null;
  return user;
}

export const dynamic = "force-dynamic";

// GET /api/admin — fetch all users, transactions, stats
export async function GET(request: Request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        pointsBalance: users.pointsBalance,
        totalEarned: users.totalEarned,
        surveysCompleted: users.surveysCompleted,
        level: users.level,
        referralCode: users.referralCode,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    const allTransactions = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(200);

    const allSessions = await db
      .select()
      .from(surveyWallSessions)
      .orderBy(desc(surveyWallSessions.createdAt))
      .limit(200);

    const stats = await db
      .select({
        totalUsers: sql<number>`count(*)`,
        totalPoints: sql<number>`sum(${users.totalEarned})`,
        totalSurveys: sql<number>`sum(${users.surveysCompleted})`,
      })
      .from(users);

    return Response.json({
      users: allUsers,
      transactions: allTransactions,
      sessions: allSessions,
      stats: stats[0],
    });
  } catch (error) {
    console.error("Admin GET error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin — admin actions (adjust points, send notification, delete user)
export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { action, userId, points, title, message } = body;

    if (action === "adjust_points") {
      await db
        .update(users)
        .set({
          pointsBalance: sql`${users.pointsBalance} + ${points}`,
          totalEarned: sql`CASE WHEN ${points} > 0 THEN ${users.totalEarned} + ${points} ELSE ${users.totalEarned} END`,
          updatedAt: new Date(),
        })
        .where(sql`${users.id} = ${userId}`);

      await db.insert(transactions).values({
        userId,
        type: points > 0 ? "ACHIEVEMENT" : "WITHDRAWAL",
        points,
        currencyAmount: points / 1000,
        status: "COMPLETED",
        description: `Admin adjustment: ${points > 0 ? "+" : ""}${points} points`,
      });

      return Response.json({ success: true });
    }

    if (action === "send_notification") {
      if (userId === "all") {
        const allUsers = await db.select({ id: users.id }).from(users);
        await Promise.all(
          allUsers.map((u) =>
            db.insert(notifications).values({
              userId: u.id,
              title,
              message,
            })
          )
        );
      } else {
        await db.insert(notifications).values({ userId, title, message });
      }
      return Response.json({ success: true });
    }

    if (action === "delete_user") {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      await db.delete(users).where(sql`${users.id} = ${userId}`);
      return Response.json({ success: true });
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("Admin POST error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
