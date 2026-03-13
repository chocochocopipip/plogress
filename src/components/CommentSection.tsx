"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { addCommentAction, deleteCommentAction } from "@/lib/actions";
import type { Comment } from "@/lib/entries";

interface Props {
  entryId: string;
  currentUserId: string | null;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return "今";
  if (diff < 3600) return `${Math.floor(diff / 60)}分前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}時間前`;
  return `${Math.floor(diff / 86400)}日前`;
}

export default function CommentSection({ entryId, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("entry_id", entryId)
      .order("created_at", { ascending: true });

    if (data) {
      // Fetch profiles
      const userIds = Array.from(new Set(data.map((c) => c.user_id)));
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("id, display_name, avatar_url").in("id", userIds)
        : { data: [] };
      const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

      setComments(
        data.map((c) => {
          const profile = profileMap.get(c.user_id);
          return {
            id: c.id,
            entryId: c.entry_id,
            userId: c.user_id,
            body: c.body,
            createdAt: c.created_at,
            authorName: profile?.display_name || "",
            authorAvatar: profile?.avatar_url || "",
          };
        })
      );
    }
    setLoading(false);
  }, [entryId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSubmitting(true);
    await addCommentAction(entryId, body.trim());
    setBody("");
    await fetchComments();
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    await deleteCommentAction(commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  return (
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#888",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          marginBottom: 10,
        }}
      >
        コメント ({comments.length})
      </div>

      {loading ? (
        <p style={{ fontSize: 12, color: "#ccc" }}>読み込み中...</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              {c.authorAvatar ? (
                <img
                  src={c.authorAvatar}
                  alt=""
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    objectFit: "cover",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    background: "#e8e8e8",
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#444" }}>
                    {c.authorName || "匿名"}
                  </span>
                  <span style={{ fontSize: 10, color: "#bbb" }}>
                    {timeAgo(c.createdAt)}
                  </span>
                  {currentUserId === c.userId && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#ccc",
                        cursor: "pointer",
                        fontSize: 10,
                        padding: "0 4px",
                      }}
                    >
                      削除
                    </button>
                  )}
                </div>
                <p
                  style={{
                    fontSize: 13,
                    color: "#555",
                    lineHeight: 1.6,
                    margin: "2px 0 0",
                    wordBreak: "break-word",
                  }}
                >
                  {c.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {currentUserId ? (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            gap: 8,
            marginTop: 12,
          }}
        >
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="コメントを入力..."
            style={{
              flex: 1,
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              outline: "none",
              fontFamily: "inherit",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e0")}
          />
          <button
            type="submit"
            disabled={submitting || !body.trim()}
            style={{
              background: "var(--color-primary)",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting || !body.trim() ? 0.5 : 1,
              whiteSpace: "nowrap",
            }}
          >
            送信
          </button>
        </form>
      ) : (
        <p style={{ fontSize: 12, color: "#bbb", marginTop: 10 }}>
          <a href="/login" style={{ color: "#2563eb", textDecoration: "underline" }}>
            ログイン
          </a>
          してコメントする
        </p>
      )}
    </div>
  );
}
