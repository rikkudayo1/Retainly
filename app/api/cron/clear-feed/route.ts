import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  // Verify the request is from Vercel Cron
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Initialize inside the handler so env vars are available at runtime, not build time
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const today = new Date().toISOString().slice(0, 10);

  const { error, count } = await supabase
    .from("group_feed")
    .delete({ count: "exact" })
    .lt("created_at", today);

  if (error) {
    console.error("[cron/clear-feed] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[cron/clear-feed] Deleted ${count} rows older than ${today}`);
  return NextResponse.json({ deleted: count, before: today });
}