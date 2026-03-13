"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  // If already logged in, redirect to home
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) window.location.href = "/";
    });
  }, []);

  async function handleGoogleLogin() {
    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f7f7f5",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 12,
          padding: "40px 36px",
          border: "1px solid #ebebeb",
          maxWidth: 380,
          width: "100%",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 8,
            color: "var(--color-primary)",
          }}
        >
          Plogress
        </h1>
        <p style={{ fontSize: 13, color: "#999", marginBottom: 32 }}>
          ログインして記録を始めよう
        </p>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            padding: "11px 0",
            border: "1px solid #e0e0e0",
            borderRadius: 8,
            background: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            color: "#333",
            transition: "background 0.15s",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {loading ? "ログイン中..." : "Googleでログイン"}
        </button>

        {error && (
          <p style={{ fontSize: 12, color: "#ef4444", marginTop: 16 }}>
            ログインに失敗しました ({error})
          </p>
        )}

        <a
          href="/"
          style={{
            display: "block",
            marginTop: 20,
            fontSize: 13,
            color: "#999",
            textDecoration: "none",
          }}
        >
          ← 一覧に戻る
        </a>
      </div>
    </div>
  );
}
