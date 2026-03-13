"use client";

import { useState, useRef, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import type { EntryMeta } from "@/lib/entries";
import { getImageUrl } from "@/lib/entries";

interface ImagePreview {
  name: string;
  url: string;
  file?: File;
  isExisting?: boolean;
}

interface Props {
  onSubmit: (formData: FormData) => Promise<void>;
  initial?: EntryMeta;
}

export default function EntryForm({ onSubmit, initial }: Props) {
  const [date, setDate] = useState(
    initial?.date || new Date().toISOString().split("T")[0]
  );
  const [text, setText] = useState(initial?.text || "");
  const [images, setImages] = useState<ImagePreview[]>(() => {
    if (initial) {
      return initial.images.map((name) => ({
        name,
        url: getImageUrl(initial.user_id, initial.id, name),
        isExisting: true,
      }));
    }
    return [];
  });
  const [featured, setFeatured] = useState(initial?.featuredImage || "");
  const [submitting, setSubmitting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const newImages: ImagePreview[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        newImages.push({
          name: file.name,
          url: URL.createObjectURL(file),
          file,
        });
      }
      setImages((prev) => {
        const updated = [...prev, ...newImages];
        if (!featured && updated.length > 0) {
          setFeatured(updated[0].name);
        }
        return updated;
      });
    },
    [featured]
  );

  const removeImage = (name: string) => {
    setImages((prev) => prev.filter((img) => img.name !== name));
    if (featured === name) {
      const remaining = images.filter((img) => img.name !== name);
      setFeatured(remaining.length > 0 ? remaining[0].name : "");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.set("date", date);
    formData.set("text", text);
    formData.set("featuredImage", featured);

    const keepImages: string[] = [];
    for (const img of images) {
      if (img.file) {
        formData.append("images", img.file);
      } else if (img.isExisting) {
        keepImages.push(img.name);
      }
    }
    formData.set("keepImages", JSON.stringify(keepImages));

    await onSubmit(formData);
    setSubmitting(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: 28,
        border: "1px solid #ebebeb",
        maxWidth: 900,
      }}
    >
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>
        {initial ? "記録を編集" : "今日の練習を記録"}
      </h2>
      <form onSubmit={handleSubmit}>
        {/* Date */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "#888",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            日付
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: 14,
              outline: "none",
              color: "var(--color-primary)",
              background: "#fafafa",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Memo — editor + live preview side by side */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "#888",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            メモ
          </label>
          <div style={{ display: "flex", gap: 12 }}>
            {/* Editor */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: "#bbb", marginBottom: 4, fontWeight: 600 }}>編集</div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                placeholder={"今日練習したこと、気づいたことなど\n\nMarkdownが使えます:\n**太字** *イタリック* - リスト"}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 14,
                  outline: "none",
                  width: "100%",
                  height: "100%",
                  minHeight: 180,
                  color: "var(--color-primary)",
                  background: "#fafafa",
                  fontFamily: "inherit",
                  resize: "vertical",
                  lineHeight: 1.6,
                  boxSizing: "border-box",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e0")}
              />
            </div>
            {/* Live preview */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: "#bbb", marginBottom: 4, fontWeight: 600 }}>プレビュー</div>
              <div
                className="md-content"
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 14,
                  minHeight: 180,
                  background: "#fafafa",
                  color: "#555",
                  lineHeight: 1.8,
                  wordBreak: "break-word",
                  overflowY: "auto",
                }}
              >
                {text ? (
                  <ReactMarkdown remarkPlugins={[remarkBreaks]}>{text}</ReactMarkdown>
                ) : (
                  <span style={{ color: "#ccc", fontSize: 13 }}>入力するとここにプレビューが表示されます</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Images */}
        <div style={{ marginBottom: 18 }}>
          <label
            style={{
              display: "block",
              fontSize: 12,
              fontWeight: 600,
              color: "#888",
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            画像（複数可）
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `1.5px dashed ${dragging ? "var(--color-primary)" : "#d4d4d4"}`,
              borderRadius: 10,
              padding: "32px 20px",
              textAlign: "center",
              cursor: "pointer",
              background: dragging ? "#f5f5f5" : "#fafafa",
              transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>↑</div>
            <p style={{ color: "#999", fontSize: 13 }}>
              クリックまたはドラッグ＆ドロップで画像を追加
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              style={{ display: "none" }}
              onChange={(e) => {
                if (e.target.files) addFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>

          {/* Preview thumbnails */}
          {images.length > 0 && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 8,
                marginTop: 12,
              }}
            >
              {images.map((img) => (
                <div key={img.name} style={{ position: "relative" }}>
                  <img
                    src={img.url}
                    alt={img.name}
                    onClick={() => setFeatured(img.name)}
                    style={{
                      width: 72,
                      height: 72,
                      objectFit: "cover",
                      borderRadius: 8,
                      border:
                        featured === img.name
                          ? "2px solid #f59e0b"
                          : "1px solid #e0e0e0",
                      display: "block",
                      cursor: "pointer",
                    }}
                  />
                  {featured === img.name && (
                    <span
                      style={{
                        position: "absolute",
                        bottom: -4,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "var(--color-secondary)",
                        color: "#fff",
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 3,
                        whiteSpace: "nowrap",
                      }}
                    >
                      ハイライト
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.name);
                    }}
                    style={{
                      position: "absolute",
                      top: -5,
                      right: -5,
                      background: "var(--color-primary)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      fontSize: 10,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Buttons */}
        <button
          type="submit"
          disabled={submitting}
          style={{
            background: submitting ? "#e8e8e8" : "var(--color-primary)",
            color: submitting ? "#aaa" : "#fff",
            border: "none",
            borderRadius: 8,
            padding: "11px 0",
            fontWeight: 600,
            fontSize: 14,
            cursor: submitting ? "not-allowed" : "pointer",
            width: "100%",
            transition: "opacity 0.15s",
            marginBottom: 10,
          }}
        >
          {submitting ? "保存中..." : "保存する"}
        </button>
        <a
          href="/"
          style={{
            display: "block",
            textAlign: "center",
            background: "#f0f0ee",
            color: "#555",
            border: "none",
            borderRadius: 8,
            padding: "11px 0",
            fontWeight: 600,
            fontSize: 14,
            cursor: "pointer",
            textDecoration: "none",
          }}
        >
          ← 一覧に戻る
        </a>
      </form>
    </div>
  );
}
