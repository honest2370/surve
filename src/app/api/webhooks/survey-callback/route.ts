import { db } from "@/db";
import {
  users,
  surveyWallSessions,
  transactions,
  notifications,
} from "@/db/schema";
import { usdToPoints } from "@/lib/crypto";
import { eq, sql } from "drizzle-orm";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * RapidoReach Postback/Callback Endpoint
 *
 * Expected query params:
 *   - userId: The user's database ID
 *   - transId: Unique transaction ID from the survey provider
 *   - reward: USD value earned
 *   - status: "complete" or "disqualified"
 *   - signature: HMAC SHA-256 signature for verification
 *
 * IP Whitelist: 161.97.78.55, 173.212.227.149, 75.119.139.250, 75.119.139.251
 */

const WHITELISTED_IPS = [
  "161.97.78.55",
  "173.212.227.149",
  "75.119.139.250",
  "75.119.139.251",
];

function verifySignature(params: Record<string, string>): boolean {
  const secret = process.env.SURVEY_SECRET_KEY;
  if (!secret) return false;

  const incoming = params.signature;
  if (!incoming) return false;

  // Build the payload string from sorted params (excluding signature)
  const keys = Object.keys(params)
    .filter((k) => k !== "signature")
    .sort();
  const payload = keys.map((k) => `${k}=${params[k]}`).join("&");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "hex"),
      Buffer.from(incoming, "hex")
    );
  } catch {
    return expected === incoming;
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });

    const { userId, transId, reward, status } = params;

    // ── Validate required parameters ──
    if (!userId || !transId || !reward || !status) {
      console.error("Missing required parameters:", params);
      return Response.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // ── IP Whitelist Check (optional - check forwarded IP) ──
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim();
    if (clientIp && !WHITELISTED_IPS.includes(clientIp)) {
      console.warn(`Webhook from non-whitelisted IP: ${clientIp}`);
      // Log but don't block — some proxies may alter IP
    }

    // ── Signature Verification ──
    if (params.signature) {
      const valid = verifySignature(params);
      if (!valid) {
        console.error("Invalid signature for transaction:", transId);
        return Response.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    // ── Idempotency Check ──
    const existingSession = await db
      .select()
      .from(surveyWallSessions)
      .where(eq(surveyWallSessions.trackingId, transId))
      .limit(1);

    if (existingSession.length > 0) {
      console.log(`Transaction ${transId} already processed. Skipping.`);
      return Response.json({ status: "already_processed" }, { status: 200 });
    }

    // ── Check user exists ──
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      console.error(`User ${userId} not found for transaction ${transId}`);
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const rewardUsd = parseFloat(reward);
    const points = usdToPoints(rewardUsd);
    const sessionStatus =
      status === "complete" ? "COMPLETED" : "DISQUALIFIED";

    // ── Create survey session record ──
    await db.insert(surveyWallSessions).values({
      userId,
      trackingId: transId,
      status: sessionStatus as "PENDING" | "COMPLETED" | "DISQUALIFIED",
      earnedPoints: sessionStatus === "COMPLETED" ? points : 0,
    });

    if (sessionStatus === "COMPLETED" && points > 0) {
      // ── Credit user points ──
      await db
        .update(users)
        .set({
          pointsBalance: sql`${users.pointsBalance} + ${points}`,
          totalEarned: sql`${users.totalEarned} + ${points}`,
          surveysCompleted: sql`${users.surveysCompleted} + 1`,
          xp: sql`${users.xp} + ${Math.round(points / 10)}`,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // ── Log transaction ──
      await db.insert(transactions).values({
        userId,
        type: "EARNED_SURVEY",
        points,
        currencyAmount: rewardUsd,
        status: "COMPLETED",
        referenceId: transId,
        description: `Survey completed — earned ${points} points ($${rewardUsd.toFixed(2)})`,
      });

      // ── Create notification ──
      await db.insert(notifications).values({
        userId,
        title: "Survey Reward! 🎉",
        message: `You earned ${points} points ($${rewardUsd.toFixed(2)}) from a survey!`,
      });

      console.log(
        `✅ Credited ${points} points to user ${userId} for transaction ${transId}`
      );
    } else {
      // ── Log disqualified transaction ──
      await db.insert(transactions).values({
        userId,
        type: "EARNED_SURVEY",
        points: 0,
        currencyAmount: 0,
        status: "FAILED",
        referenceId: transId,
        description: `Survey disqualified — transaction ${transId}`,
      });

      console.log(`❌ User ${userId} disqualified for transaction ${transId}`);
    }

    return Response.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Also support POST method
export async function POST(request: Request) {
  return GET(request);
}
