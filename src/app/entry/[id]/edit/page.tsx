"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import EntryForm from "@/components/EntryForm";
import SimpleHeader from "@/components/SimpleHeader";
import { updateEntryAction } from "@/lib/actions";
import type { EntryMeta } from "@/lib/entries";

export default function EditEntryPage() {
  const params = useParams();
  const id = params.id as string;
  const [entry, setEntry] = useState<EntryMeta | null>(null);

  useEffect(() => {
    fetch(`/api/entries/${id}`)
      .then((r) => r.json())
      .then(setEntry);
  }, [id]);

  const handleSubmit = async (formData: FormData) => {
    await updateEntryAction(id, formData);
  };

  if (!entry)
    return (
      <>
        <SimpleHeader />
        <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>
          <p style={{ color: "#999" }}>読み込み中...</p>
        </main>
      </>
    );

  return (
    <>
      <SimpleHeader />
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>
        <EntryForm onSubmit={handleSubmit} initial={entry} />
      </main>
    </>
  );
}
