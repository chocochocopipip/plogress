import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAllEntries } from "@/lib/entries";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const mine = request.nextUrl.searchParams.get("mine") === "true";
  const filterUserId = mine ? user?.id : undefined;

  const entries = await getAllEntries(supabase, user?.id, filterUserId);
  return NextResponse.json(entries);
}
