import { supabaseAdmin } from "@/lib/supabase";
import { db } from "@/db";
import { users } from "@/db/schema";
import { generateReferralCode } from "@/lib/crypto";
import { eq } from "drizzle-orm";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, displayName, referralCode } = body as {
      email: string;
      password: string;
      displayName?: string;
      referralCode?: string;
    };

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password,
        email_confirm: true, // auto-confirm so user can login immediately
      });

    if (authError) {
      if (authError.message.includes("already registered")) {
        return Response.json(
          { error: "Email already registered" },
          { status: 409 }
        );
      }
      return Response.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;
    const newRefCode = generateReferralCode();

    // 2. Find referrer if code provided
    let referrerId: string | null = null;
    if (referralCode) {
      const referrer = await db
        .select()
        .from(users)
        .where(eq(users.referralCode, referralCode))
        .limit(1);
      if (referrer.length > 0) {
        referrerId = referrer[0].id;
      }
    }

    // 3. Create profile row in our users table using Supabase Auth UUID
    const [user] = await db
      .insert(users)
      .values({
        id: userId, // use Supabase Auth UUID
        email: email.toLowerCase(),
        passwordHash: "", // not needed — Supabase Auth handles passwords
        displayName: displayName || email.split("@")[0],
        referralCode: newRefCode,
        referredBy: referrerId,
        pointsBalance: 500,
        totalEarned: 500,
      })
      .returning();

    // 4. Sign in to get session token
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: email.toLowerCase(),
      });

    // Return user profile — frontend will sign in separately
    return Response.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        pointsBalance: user.pointsBalance,
        referralCode: user.referralCode,
      },
    });
  } catch (error) {
    console.error("Register error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
