import { createClient } from "@/lib/supabase/server";
import PageShell from "@/components/PageShell";

export default async function TimelinePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <PageShell
      user={user ? { id: user.id, name: user.user_metadata?.full_name || "", avatar: user.user_metadata?.avatar_url || "" } : null}
      activePage="timeline"
    />
  );
}
