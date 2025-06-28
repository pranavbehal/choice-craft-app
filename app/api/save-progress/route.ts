import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { user_id, mission_id, time_spent, last_updated } = data;

    if (!user_id || !mission_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("user_mission_progress").upsert(
      {
        user_id,
        mission_id,
        time_spent,
        last_updated: last_updated || new Date().toISOString(),
      },
      {
        onConflict: "user_id,mission_id",
        ignoreDuplicates: false,
      }
    );

    if (error) {
      console.error("[save-progress] Supabase error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[save-progress] Unexpected error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
