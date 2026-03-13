import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllEntries } from "@/lib/entries";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const entries = await getAllEntries(supabase, user?.id);
  return NextResponse.json(entries);
}
