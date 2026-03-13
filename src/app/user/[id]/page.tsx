import { createClient } from "@/lib/supabase/server";
import UserPageShell from "@/components/UserPageShell";

export default async function UserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: profileId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <UserPageShell
      profileId={profileId}
      currentUser={
        user
          ? {
              id: user.id,
              name: user.user_metadata?.full_name || "",
              avatar: user.user_metadata?.avatar_url || "",
            }
          : null
      }
    />
  );
}
