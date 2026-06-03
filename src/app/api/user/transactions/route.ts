import { supabaseAdmin } from "@/lib/supabase";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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

    const txns = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, authUser.id))
      .orderBy(desc(transactions.createdAt))
      .limit(50);

    return Response.json({ transactions: txns });
  } catch (error) {
    console.error("Get transactions error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
