import { supabaseAdmin } from "@/lib/supabase";
import { db } from "@/db";
import { users, surveyWallSessions, transactions, notifications } from "@/db/schema";
import { usdToPoints } from "@/lib/crypto";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: { user: authUser }, error } =
      await supabaseAdmin.auth.getUser(authHeader.slice(7));

    if (error || !authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const rewardUsd = body.reward || 0.5;
    const points = usdToPoints(rewardUsd);
    const transId = `SIM-${crypto.randomUUID()}`;

    await db.insert(surveyWallSessions).values({
      userId: authUser.id,
      trackingId: transId,
      status: "COMPLETED",
      earnedPoints: points,
    });

    await db
      .update(users)
      .set({
        pointsBalance: sql`${users.pointsBalance} + ${points}`,
        totalEarned: sql`${users.totalEarned} + ${points}`,
        surveysCompleted: sql`${users.surveysCompleted} + 1`,
        xp: sql`${users.xp} + ${Math.round(points / 10)}`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, authUser.id));

    await db.insert(transactions).values({
      userId: authUser.id,
      type: "EARNED_SURVEY",
      points,
      currencyAmount: rewardUsd,
      status: "COMPLETED",
      referenceId: transId,
      description: `[SIMULATED] Survey completed — earned ${points} points ($${rewardUsd.toFixed(2)})`,
    });

    await db.insert(notifications).values({
      userId: authUser.id,
      title: "Test Reward! 🧪",
      message: `[TEST] You earned ${points} points ($${rewardUsd.toFixed(2)})`,
    });

    const [updatedUser] = await db
      .select({
        pointsBalance: users.pointsBalance,
        totalEarned: users.totalEarned,
        surveysCompleted: users.surveysCompleted,
        xp: users.xp,
      })
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    return Response.json({ status: "simulated", transId, points, rewardUsd, user: updatedUser });
  } catch (error) {
    console.error("Simulate error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
