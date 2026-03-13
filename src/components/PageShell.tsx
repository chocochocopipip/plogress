"use client";

import { useState, useEffect, useCallback } from "react";
import type { EntryMeta } from "@/lib/entries";
import Header from "./Header";
import EntryList from "./EntryList";

interface UserInfo {
  id: string;
  name: string;
  avatar: string;
}

interface Props {
  user: UserInfo | null;
  activePage: "home" | "timeline" | "user";
}

export default function PageShell({ user, activePage }: Props) {
  const [entries, setEntries] = useState<EntryMeta[] | null>(null);

  useEffect(() => {
    const params = activePage === "home" ? "?mine=true" : "";
    fetch(`/api/entries${params}`)
      .then((res) => res.json())
      .then((data) => setEntries(data))
      .catch(() => setEntries([]));
  }, [activePage]);

  const fetchEntries = useCallback(() => {
    const params = activePage === "home" ? "?mine=true" : "";
    fetch(`/api/entries${params}`)
      .then((res) => res.json())
      .then((data) => setEntries(data))
      .catch(() => setEntries([]));
  }, [activePage]);

  const dates = entries ? entries.map((e) => e.date).filter(Boolean) : [];

  return (
    <>
      <Header
        entryCount={entries?.length ?? 0}
        entryDates={dates}
        user={user}
        activePage={activePage}
      />
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>
        {entries === null ? (
          <div
            style={{
              display: "flex",
              gap: 14,
              overflowX: "hidden",
              height: "calc(100vh - 150px)",
            }}
          >
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                style={{
                  width: 340,
                  flexShrink: 0,
                  background: "#fff",
                  borderRadius: 12,
                  border: "1px solid #ebebeb",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: 40,
                    borderBottom: "1px solid #f3f3f3",
                    background: "#fafafa",
                  }}
                />
                <div style={{ padding: 12 }}>
                  <div
                    style={{
                      width: "100%",
                      height: 180,
                      background: "#f0f0ee",
                      borderRadius: 8,
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                  <div
                    style={{
                      width: "60%",
                      height: 12,
                      background: "#f0f0ee",
                      borderRadius: 4,
                      marginTop: 12,
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                  <div
                    style={{
                      width: "80%",
                      height: 12,
                      background: "#f0f0ee",
                      borderRadius: 4,
                      marginTop: 8,
                      animation: "pulse 1.5s ease-in-out infinite",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EntryList entries={entries} currentUserId={user?.id || null} onRefresh={fetchEntries} />
        )}
      </main>
    </>
  );
}
