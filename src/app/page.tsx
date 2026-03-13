import { getAllEntries } from "@/lib/entries";
import { createClient } from "@/lib/supabase/server";
import Header from "@/components/Header";
import EntryList from "@/components/EntryList";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const entries = await getAllEntries(supabase, user?.id);
  const dates = entries.map((e) => e.date).filter(Boolean);

  return (
    <>
      <Header
        entryCount={entries.length}
        entryDates={dates}
        user={user ? { id: user.id, name: user.user_metadata?.full_name || "", avatar: user.user_metadata?.avatar_url || "" } : null}
      />
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>
        <EntryList entries={entries} currentUserId={user?.id || null} />
      </main>
    </>
  );
}
