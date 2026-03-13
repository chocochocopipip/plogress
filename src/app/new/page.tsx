"use client";

import EntryForm from "@/components/EntryForm";
import SimpleHeader from "@/components/SimpleHeader";
import { createEntryAction } from "@/lib/actions";

export default function NewEntryPage() {
  return (
    <>
      <SimpleHeader />
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>
        <EntryForm onSubmit={createEntryAction} />
      </main>
    </>
  );
}
