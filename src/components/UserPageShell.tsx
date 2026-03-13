"use client";

import { useState, useEffect, useCallback } from "react";
import type { EntryMeta } from "@/lib/entries";
import { updateBioAction } from "@/lib/actions";
import Header from "./Header";
import EntryList from "./EntryList";

interface UserInfo {
  id: string;
  name: string;
  avatar: string;
}

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string;
  bio: string | null;
}

interface Props {
  profileId: string;
  currentUser: UserInfo | null;
}

export default function UserPageShell({ profileId, currentUser }: Props) {
  const [entries, setEntries] = useState<EntryMeta[] | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [saving, setSaving] = useState(false);

  const isOwner = currentUser?.id === profileId;

  useEffect(() => {
    fetch(`/api/entries?userId=${profileId}`)
      .then((res) => res.json())
      .then((data) => setEntries(data))
      .catch(() => setEntries([]));
  }, [profileId]);

  useEffect(() => {
    fetch(`/api/profile/${profileId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setProfile(data);
        if (data) setBioText(data.bio || "");
      });
  }, [profileId]);

  const fetchEntries = useCallback(() => {
    fetch(`/api/entries?userId=${profileId}`)
      .then((res) => res.json())
      .then((data) => setEntries(data))
      .catch(() => setEntries([]));
  }, [profileId]);

  const handleSaveBio = async () => {
    setSaving(true);
    try {
      await updateBioAction(bioText);
      setProfile((prev) => (prev ? { ...prev, bio: bioText } : prev));
      setEditingBio(false);
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const dates = entries ? entries.map((e) => e.date).filter(Boolean) : [];

  return (
    <>
      <Header
        entryCount={entries?.length ?? 0}
        entryDates={dates}
        user={currentUser}
        activePage="user"
      />
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "28px 24px" }}>
        {/* Profile section */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 16,
            marginBottom: 24,
            padding: "20px 24px",
            background: "#fff",
            borderRadius: 12,
            border: "1px solid #ebebeb",
          }}
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                objectFit: "cover",
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "#e0e0e0",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                fontWeight: 700,
                color: "#888",
                flexShrink: 0,
              }}
            >
              {profile?.display_name?.[0] || "?"}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <span style={{ fontSize: 18, fontWeight: 700 }}>
                {profile?.display_name || "ユーザー"}
              </span>
              <span style={{ fontSize: 12, color: "#999" }}>
                {entries?.length ?? 0}件の記録
              </span>
            </div>
            {editingBio ? (
              <div>
                <textarea
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value.slice(0, 240))}
                  placeholder="自己紹介を入力（240文字以内）"
                  rows={3}
                  style={{
                    width: "100%",
                    border: "1px solid #e0e0e0",
                    borderRadius: 8,
                    padding: "8px 12px",
                    fontSize: 13,
                    outline: "none",
                    fontFamily: "inherit",
                    resize: "vertical",
                    lineHeight: 1.6,
                    boxSizing: "border-box",
                    color: "var(--color-primary)",
                    background: "#fafafa",
                  }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = "var(--color-primary)")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = "#e0e0e0")
                  }
                />
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 6,
                  }}
                >
                  <button
                    onClick={handleSaveBio}
                    disabled={saving}
                    style={{
                      background: "var(--color-primary)",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      padding: "5px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: saving ? "not-allowed" : "pointer",
                    }}
                  >
                    {saving ? "保存中..." : "保存"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingBio(false);
                      setBioText(profile?.bio || "");
                    }}
                    style={{
                      background: "#f0f0ee",
                      color: "#555",
                      border: "none",
                      borderRadius: 6,
                      padding: "5px 14px",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    キャンセル
                  </button>
                  <span style={{ fontSize: 11, color: "#bbb" }}>
                    {bioText.length}/240
                  </span>
                </div>
              </div>
            ) : (
              <div>
                {profile?.bio ? (
                  <p
                    style={{
                      fontSize: 13,
                      color: "#666",
                      lineHeight: 1.7,
                      margin: 0,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {profile.bio}
                  </p>
                ) : isOwner ? (
                  <p style={{ fontSize: 13, color: "#bbb", margin: 0 }}>
                    自己紹介がまだありません
                  </p>
                ) : null}
                {isOwner && (
                  <button
                    onClick={() => setEditingBio(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#999",
                      cursor: "pointer",
                      fontSize: 11,
                      padding: "4px 0",
                      marginTop: 4,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#555")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#999")
                    }
                  >
                    {profile?.bio ? "自己紹介を編集" : "自己紹介を追加"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Entries */}
        {entries === null ? (
          <div
            style={{
              display: "flex",
              gap: 14,
              overflowX: "hidden",
              height: "calc(100vh - 250px)",
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
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EntryList
            entries={entries}
            currentUserId={currentUser?.id || null}
            onRefresh={fetchEntries}
          />
        )}
      </main>
    </>
  );
}
