"use client";

import { useState, useEffect, useCallback, useRef, DragEvent as ReactDragEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import type { EntryMeta } from "@/lib/entries";
import { getImageUrl } from "@/lib/entries";
import {
  createEntryAction,
  updateEntryAction,
  deleteEntryAction,
  setFeaturedImageAction,
  toggleLikeAction,
} from "@/lib/actions";
import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";

const MAX_VISIBLE = 6;

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return "日付なし";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function imgUrl(entry: EntryMeta, img: string): string {
  return getImageUrl(entry.user_id, entry.id, img);
}

function imgStyle(
  originalSize: boolean,
  isFeatured: boolean,
  isCard: boolean = false
): React.CSSProperties {
  if (isCard) {
    return {
      width: "100%",
      aspectRatio: "1/1",
      objectFit: "cover",
      display: "block",
      transition: "opacity 0.15s",
      background: "#f7f7f5",
    };
  }
  if (originalSize) {
    return {
      width: "100%",
      maxHeight: isFeatured ? 260 : undefined,
      objectFit: "contain",
      display: "block",
      transition: "opacity 0.15s",
      background: "#f7f7f5",
    };
  }
  return {
    width: "100%",
    aspectRatio: "1/1",
    objectFit: "cover",
    display: "block",
    transition: "opacity 0.15s",
    background: "#f7f7f5",
  };
}

const memoStyle: React.CSSProperties = {
  fontSize: 14,
  color: "#555",
  lineHeight: 1.8,
  wordBreak: "break-word",
  padding: "14px 16px",
  background: "#fafafa",
  borderRadius: 8,
};

const cardMemoStyle: React.CSSProperties = {
  margin: "10px 2px 6px",
  fontSize: 12,
  color: "#666",
  lineHeight: 1.7,
  wordBreak: "break-word",
  overflow: "hidden",
  maxHeight: "6em",
};

function Markdown({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <div className="md-content" style={style}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]}>{text}</ReactMarkdown>
    </div>
  );
}

// ── Image preview for edit mode ──

interface ImagePreview {
  name: string;
  url: string;
  file?: File;
  isExisting?: boolean;
}

// ── Card ──

function EntryCard({
  entry,
  showAllImages,
  originalSize,
  currentUserId,
  onOpenDetail,
  onSetFeatured,
  onDelete,
  onToggleLike,
}: {
  entry: EntryMeta;
  showAllImages: boolean;
  originalSize: boolean;
  currentUserId: string | null;
  onOpenDetail: (id: string) => void;
  onSetFeatured: (id: string, img: string) => void;
  onDelete: (id: string) => void;
  onToggleLike: (id: string) => void;
}) {
  const isOwner = currentUserId === entry.user_id;
  const allImages = entry.images;
  const visibleImages = showAllImages
    ? allImages
    : allImages.slice(0, MAX_VISIBLE);
  const hiddenCount = showAllImages
    ? 0
    : Math.max(0, allImages.length - MAX_VISIBLE);
  const cols = Math.min(allImages.length, 3);

  const handleImgClick = (e: React.MouseEvent, img: string) => {
    e.stopPropagation();
    if (isOwner) onSetFeatured(entry.id, img);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("この記録を削除しますか？\nこの操作は元に戻せません。")) return;
    onDelete(entry.id);
  };

  return (
    <div
      onClick={() => onOpenDetail(entry.id)}
      data-date={entry.date}
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #ebebeb",
        overflow: "hidden",
        cursor: "pointer",
        transition: "box-shadow 0.15s, transform 0.15s",
        flexShrink: 0,
        width: 340,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.09)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* Card Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 14px",
          borderBottom: "1px solid #f3f3f3",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {entry.authorAvatar && (
            <img
              src={entry.authorAvatar}
              alt=""
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/user/${entry.user_id}`;
              }}
              style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover", cursor: "pointer" }}
              title={entry.authorName || undefined}
            />
          )}
          <span style={{ fontSize: 13, fontWeight: 700 }}>
            {formatDate(entry.date)}
          </span>
          <span
            style={{
              fontSize: 11,
              color: "#bbb",
              background: "#f5f5f5",
              borderRadius: 4,
              padding: "2px 6px",
            }}
          >
            {entry.images.length}枚
          </span>
          {!entry.isPublic && (
            <span
              style={{
                fontSize: 10,
                color: "#e67e22",
                background: "#fef3e2",
                borderRadius: 4,
                padding: "2px 6px",
                fontWeight: 600,
              }}
            >
              非公開
            </span>
          )}
        </div>
        <div
          style={{ display: "flex", gap: 4, alignItems: "center" }}
          onClick={(e) => e.stopPropagation()}
        >
          <LikeButton
            liked={entry.likedByMe}
            count={entry.likeCount}
            onClick={() => onToggleLike(entry.id)}
            disabled={!currentUserId}
            small
          />
          {isOwner && (
            <button
              onClick={handleDelete}
              style={{
                background: "none",
                border: "none",
                color: "#ccc",
                cursor: "pointer",
                fontSize: 12,
                padding: "3px 6px",
                borderRadius: 6,
                transition: "color 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#999")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#ccc")}
            >
              削除
            </button>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: "10px 12px" }}>
        {entry.featuredImage && (
          <div
            style={{
              marginBottom: 8,
              borderRadius: 8,
              overflow: "hidden",
              background: "#f7f7f5",
            }}
          >
            <div style={{ position: "relative" }}>
              <img
                src={imgUrl(entry, entry.featuredImage)}
                alt=""
                style={{
                  width: "100%",
                  maxHeight: 180,
                  objectFit: "cover",
                  display: "block",
                  background: "#f7f7f5",
                }}
              />
            </div>
            <span
              style={{
                display: "inline-block",
                background: "var(--color-secondary)",
                color: "#fff",
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 4,
                margin: "6px 0 4px",
                letterSpacing: "0.3px",
              }}
            >
              ハイライト
            </span>
          </div>
        )}

        {visibleImages.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: 6,
            }}
          >
            {visibleImages.map((img) => {
              const isFeatured = img === entry.featuredImage;
              return (
                <div
                  key={img}
                  className="img-wrapper"
                  style={{ position: "relative" }}
                  onClick={(e) => handleImgClick(e, img)}
                >
                  <img
                    src={imgUrl(entry, img)}
                    alt=""
                    style={{
                      ...imgStyle(originalSize, false, true),
                      borderRadius: 6,
                      border: isFeatured
                        ? "2px solid var(--color-secondary)"
                        : "1px solid #ebebeb",
                    }}
                  />
                  {isFeatured && (
                    <span
                      style={{
                        position: "absolute",
                        top: 3,
                        left: 3,
                        background: "var(--color-secondary)",
                        color: "#fff",
                        fontSize: 8,
                        fontWeight: 700,
                        padding: "1px 5px",
                        borderRadius: 3,
                      }}
                    >
                      ★
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {hiddenCount > 0 && (
          <p
            style={{
              fontSize: 11,
              color: "#bbb",
              margin: "6px 2px 0",
              textAlign: "right",
            }}
          >
            他 {hiddenCount}枚（クリックして全表示）
          </p>
        )}

        {entry.text && <Markdown text={entry.text} style={cardMemoStyle} />}
      </div>
    </div>
  );
}

// ── Detail / Edit / Create Popup ──

type PopupMode = "view" | "edit" | "create";

function EntryPopup({
  entry,
  mode: initialMode,
  originalSize,
  currentUserId,
  onClose,
  onDelete,
  onSetFeatured,
  onToggleLike,
  onRefresh,
}: {
  entry: EntryMeta | null; // null for create mode
  mode: PopupMode;
  originalSize: boolean;
  currentUserId: string | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onSetFeatured: (id: string, img: string) => void;
  onToggleLike: (id: string) => void;
  onRefresh: () => void;
}) {
  const isOwner = entry ? currentUserId === entry.user_id : true;
  const [mode, setMode] = useState<PopupMode>(initialMode);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit/create form state
  const [editDate, setEditDate] = useState(
    entry?.date || new Date().toISOString().split("T")[0]
  );
  const [editText, setEditText] = useState(entry?.text || "");
  const [editImages, setEditImages] = useState<ImagePreview[]>(() => {
    if (entry) {
      return entry.images.map((name) => ({
        name,
        url: getImageUrl(entry.user_id, entry.id, name),
        isExisting: true,
      }));
    }
    return [];
  });
  const [editFeatured, setEditFeatured] = useState(entry?.featuredImage || "");
  const [editPublic, setEditPublic] = useState(entry?.isPublic !== false);
  const [fileDragging, setFileDragging] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDelete = () => {
    if (!entry) return;
    if (!confirm("この記録を削除しますか？\nこの操作は元に戻せません。")) return;
    onDelete(entry.id);
    onClose();
  };

  const imageCount = entry?.images.length || 0;

  const lightboxPrev = () => {
    if (lightboxIdx === null || imageCount === 0) return;
    setLightboxIdx((lightboxIdx - 1 + imageCount) % imageCount);
  };
  const lightboxNext = () => {
    if (lightboxIdx === null || imageCount === 0) return;
    setLightboxIdx((lightboxIdx + 1) % imageCount);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxIdx !== null) setLightboxIdx(null);
        else onClose();
      } else if (lightboxIdx !== null) {
        if (e.key === "ArrowLeft") lightboxPrev();
        else if (e.key === "ArrowRight") lightboxNext();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, lightboxIdx, imageCount]);

  // Switch to edit mode
  const startEditing = () => {
    if (!entry) return;
    setEditDate(entry.date);
    setEditText(entry.text);
    setEditImages(
      entry.images.map((name) => ({
        name,
        url: getImageUrl(entry.user_id, entry.id, name),
        isExisting: true,
      }))
    );
    setEditFeatured(entry.featuredImage);
    setEditPublic(entry.isPublic !== false);
    setMode("edit");
  };

  const cancelEditing = () => {
    setMode("view");
  };

  // Image handling
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
      setEditImages((prev) => {
        const updated = [...prev, ...newImages];
        if (!editFeatured && updated.length > 0) {
          setEditFeatured(updated[0].name);
        }
        return updated;
      });
    },
    [editFeatured]
  );

  const removeImage = (name: string) => {
    setEditImages((prev) => prev.filter((img) => img.name !== name));
    if (editFeatured === name) {
      const remaining = editImages.filter((img) => img.name !== name);
      setEditFeatured(remaining.length > 0 ? remaining[0].name : "");
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFileDragging(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  // Thumbnail drag-and-drop reorder
  const handleThumbDragStart = (e: ReactDragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleThumbDragOver = (e: ReactDragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIdx(idx);
  };
  const handleThumbDrop = (e: ReactDragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    setEditImages((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIdx, 1);
      updated.splice(idx, 0, moved);
      return updated;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  };
  const handleThumbDragEnd = () => {
    setDragIdx(null);
    setDragOverIdx(null);
  };

  // Submit
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("date", editDate);
      formData.set("text", editText);
      formData.set("featuredImage", editFeatured);

      const keepImages: string[] = [];
      const orderedNames: string[] = [];
      for (const img of editImages) {
        if (img.file) {
          formData.append("images", img.file);
        } else if (img.isExisting) {
          keepImages.push(img.name);
        }
        orderedNames.push(img.name);
      }
      formData.set("keepImages", JSON.stringify(keepImages));
      formData.set("imageOrder", JSON.stringify(orderedNames));
      formData.set("isPublic", editPublic ? "true" : "false");

      if (mode === "create") {
        await createEntryAction(formData);
      } else if (entry) {
        await updateEntryAction(entry.id, formData);
      }

      onRefresh();
      onClose();
    } catch (err) {
      console.error(err);
      alert("保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const cols = entry ? Math.min(entry.images.length, 3) : 3;
  const isEditing = mode === "edit" || mode === "create";

  return (
    <>
      <div className="detail-overlay active" onClick={handleOverlayClick}>
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            width: "100%",
            maxWidth: isEditing ? 760 : 680,
            margin: "auto",
            boxShadow: "0 8px 48px rgba(0,0,0,0.2)",
            overflow: "hidden",
            animation: "popupIn 0.18s ease",
            transition: "max-width 0.2s",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 24px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {!isEditing && entry?.authorAvatar && (
                <img
                  src={entry.authorAvatar}
                  alt=""
                  onClick={() => { window.location.href = `/user/${entry.user_id}`; }}
                  style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", cursor: "pointer" }}
                  title={entry.authorName || undefined}
                />
              )}
              {isEditing ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>
                    {mode === "create" ? "今日の練習を記録" : "記録を編集"}
                  </span>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    style={{
                      border: "1px solid #e0e0e0",
                      borderRadius: 6,
                      padding: "5px 10px",
                      fontSize: 13,
                      outline: "none",
                      color: "var(--color-primary)",
                      background: "#fafafa",
                      fontFamily: "inherit",
                    }}
                  />
                </div>
              ) : (
                <div>
                  <span style={{ fontSize: 18, fontWeight: 700 }}>
                    {formatDate(entry?.date)}
                  </span>
                  {entry?.authorName && (
                    <a
                      href={`/user/${entry.user_id}`}
                      style={{ fontSize: 11, color: "#999", marginLeft: 8, textDecoration: "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      by {entry.authorName}
                    </a>
                  )}
                  {entry && !entry.isPublic && (
                    <span
                      style={{
                        fontSize: 10,
                        color: "#e67e22",
                        background: "#fef3e2",
                        borderRadius: 4,
                        padding: "2px 6px",
                        fontWeight: 600,
                        marginLeft: 8,
                      }}
                    >
                      非公開
                    </span>
                  )}
                </div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {isEditing ? (
                <>
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    style={{
                      background: submitting ? "#e8e8e8" : "var(--color-primary)",
                      color: submitting ? "#aaa" : "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "7px 20px",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: submitting ? "not-allowed" : "pointer",
                    }}
                  >
                    {submitting ? "保存中..." : "保存"}
                  </button>
                  {mode === "edit" && (
                    <button
                      onClick={cancelEditing}
                      style={{
                        background: "#f0f0ee",
                        color: "#555",
                        border: "none",
                        borderRadius: 8,
                        padding: "7px 14px",
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      キャンセル
                    </button>
                  )}
                </>
              ) : (
                <>
                  {entry && (
                    <LikeButton
                      liked={entry.likedByMe}
                      count={entry.likeCount}
                      onClick={() => onToggleLike(entry.id)}
                      disabled={!currentUserId}
                    />
                  )}
                  {isOwner && entry && (
                    <>
                      <button
                        onClick={startEditing}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ccc",
                          cursor: "pointer",
                          fontSize: 12,
                          padding: "3px 6px",
                          borderRadius: 6,
                          textDecoration: "none",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#999")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#ccc")}
                      >
                        編集
                      </button>
                      <button
                        onClick={handleDelete}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ccc",
                          cursor: "pointer",
                          fontSize: 12,
                          padding: "3px 6px",
                          borderRadius: 6,
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#999")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "#ccc")}
                      >
                        削除
                      </button>
                    </>
                  )}
                </>
              )}
              <button
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 20,
                  color: "#bbb",
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: "2px 6px",
                  borderRadius: 6,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#555")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#bbb")}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: "20px 24px", maxHeight: "70vh", overflowY: "auto" }}>
            {isEditing ? (
              /* ── Edit / Create body ── */
              <>
                {/* Image drop zone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setFileDragging(true);
                  }}
                  onDragLeave={() => setFileDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `1.5px dashed ${fileDragging ? "var(--color-primary)" : "#d4d4d4"}`,
                    borderRadius: 10,
                    padding: "20px 16px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: fileDragging ? "#f5f5f5" : "#fafafa",
                    transition: "all 0.15s",
                    marginBottom: 12,
                  }}
                >
                  <p style={{ color: "#999", fontSize: 13, margin: 0 }}>
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

                {/* Editable image grid */}
                {editImages.length > 0 && (
                  <>
                    <div style={{ fontSize: 10, color: "#bbb", marginBottom: 4 }}>
                      ドラッグで順番を変更 ・ クリックでハイライト設定
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${Math.min(editImages.length, 4)}, 1fr)`,
                        gap: 8,
                        marginBottom: 16,
                      }}
                    >
                      {editImages.map((img, idx) => {
                        const isFeatured = editFeatured === img.name;
                        return (
                          <div
                            key={img.name + idx}
                            draggable
                            onDragStart={(e) => handleThumbDragStart(e, idx)}
                            onDragOver={(e) => handleThumbDragOver(e, idx)}
                            onDrop={(e) => handleThumbDrop(e, idx)}
                            onDragEnd={handleThumbDragEnd}
                            style={{
                              position: "relative",
                              opacity: dragIdx === idx ? 0.4 : 1,
                              transform: dragOverIdx === idx && dragIdx !== idx ? "scale(1.05)" : "none",
                              transition: "transform 0.15s, opacity 0.15s",
                            }}
                          >
                            <img
                              src={img.url}
                              alt={img.name}
                              onClick={() => setEditFeatured(img.name)}
                              style={{
                                width: "100%",
                                aspectRatio: "1/1",
                                objectFit: "cover",
                                borderRadius: 8,
                                border: isFeatured
                                  ? "2px solid var(--color-secondary)"
                                  : "1px solid #ebebeb",
                                display: "block",
                                cursor: "grab",
                              }}
                            />
                            {isFeatured && (
                              <span
                                style={{
                                  position: "absolute",
                                  top: 4,
                                  left: 4,
                                  background: "var(--color-secondary)",
                                  color: "#fff",
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding: "2px 6px",
                                  borderRadius: 3,
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
                                width: 20,
                                height: 20,
                                fontSize: 11,
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
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Memo editor + preview */}
                <label
                  style={{
                    display: "block",
                    fontSize: 11,
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: "#bbb", marginBottom: 4, fontWeight: 600 }}>
                      編集
                    </div>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={8}
                      placeholder={"今日練習したこと、気づいたことなど\n\nMarkdownが使えます:\n**太字** *イタリック* - リスト"}
                      style={{
                        border: "1px solid #e0e0e0",
                        borderRadius: 8,
                        padding: "9px 12px",
                        fontSize: 14,
                        outline: "none",
                        width: "100%",
                        minHeight: 160,
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
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 10, color: "#bbb", marginBottom: 4, fontWeight: 600 }}>
                      プレビュー
                    </div>
                    <div
                      className="md-content"
                      style={{
                        border: "1px solid #e0e0e0",
                        borderRadius: 8,
                        padding: "9px 12px",
                        fontSize: 14,
                        minHeight: 160,
                        background: "#fafafa",
                        color: "#555",
                        lineHeight: 1.8,
                        wordBreak: "break-word",
                        overflowY: "auto",
                      }}
                    >
                      {editText ? (
                        <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                          {editText}
                        </ReactMarkdown>
                      ) : (
                        <span style={{ color: "#ccc", fontSize: 13 }}>
                          入力するとここにプレビューが表示されます
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Public/Private toggle */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 16,
                    padding: "12px 14px",
                    background: "#fafafa",
                    borderRadius: 8,
                    border: "1px solid #ebebeb",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#444" }}>
                      {editPublic ? "公開" : "非公開"}
                    </span>
                    <span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>
                      {editPublic
                        ? "タイムラインに表示されます"
                        : "自分だけが見られます"}
                    </span>
                  </div>
                  <button
                    type="button"
                    className={`toggle-btn ${editPublic ? "on" : ""}`}
                    onClick={() => setEditPublic(!editPublic)}
                  >
                    <span className="toggle-knob" />
                  </button>
                </div>
              </>
            ) : (
              /* ── View body ── */
              <>
                {/* All images grid */}
                {entry && entry.images.length > 0 && (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: `repeat(${cols}, 1fr)`,
                      gap: 8,
                      marginBottom: 16,
                    }}
                  >
                    {entry.images.map((img, idx) => {
                      const isFeatured = img === entry.featuredImage;
                      const src = imgUrl(entry, img);
                      return (
                        <div
                          key={img}
                          className="img-wrapper"
                          style={{ position: "relative" }}
                        >
                          <img
                            src={src}
                            alt=""
                            style={{
                              ...imgStyle(originalSize, false),
                              borderRadius: 8,
                              cursor: "zoom-in",
                              border: isFeatured
                                ? "2px solid var(--color-secondary)"
                                : "1px solid #ebebeb",
                            }}
                            onClick={() => setLightboxIdx(idx)}
                          />
                          {isFeatured && (
                            <span
                              style={{
                                position: "absolute",
                                top: 6,
                                left: 6,
                                background: "var(--color-secondary)",
                                color: "#fff",
                                fontSize: 10,
                                fontWeight: 700,
                                padding: "2px 7px",
                                borderRadius: 4,
                              }}
                            >
                              ハイライト
                            </span>
                          )}
                          {isOwner && (
                            <button
                              className={`star-btn ${isFeatured ? "highlighted" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetFeatured(entry.id, img);
                              }}
                              title={isFeatured ? "ハイライト中" : "ハイライトに設定"}
                              style={
                                isFeatured
                                  ? { top: "auto", bottom: 4, left: 4, opacity: 1 }
                                  : {}
                              }
                            >
                              {isFeatured ? "★" : "☆"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Memo */}
                {entry?.text && <Markdown text={entry.text} style={memoStyle} />}

                {/* Comments */}
                {entry && (
                  <div style={{ marginTop: 20 }}>
                    <CommentSection
                      entryId={entry.id}
                      currentUserId={currentUserId}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox with navigation */}
      {lightboxIdx !== null && entry && (
        <div
          className="lightbox active"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxIdx(null);
          }}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIdx(null)}
            style={{
              position: "fixed",
              top: 16,
              right: 16,
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              fontSize: 20,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1001,
            }}
          >
            ✕
          </button>

          {/* Prev button */}
          {imageCount > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); lightboxPrev(); }}
              style={{
                position: "fixed",
                left: 16,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 44,
                height: 44,
                fontSize: 22,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1001,
              }}
            >
              ‹
            </button>
          )}

          {/* Image */}
          <img
            src={imgUrl(entry, entry.images[lightboxIdx])}
            alt=""
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next button */}
          {imageCount > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); lightboxNext(); }}
              style={{
                position: "fixed",
                right: 16,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 44,
                height: 44,
                fontSize: 22,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1001,
              }}
            >
              ›
            </button>
          )}

          {/* Counter */}
          {imageCount > 1 && (
            <div
              style={{
                position: "fixed",
                bottom: 20,
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                fontSize: 13,
                padding: "4px 14px",
                borderRadius: 20,
                zIndex: 1001,
              }}
            >
              {lightboxIdx + 1} / {imageCount}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ── Main ──

export default function EntryList({
  entries,
  currentUserId,
  onRefresh,
}: {
  entries: EntryMeta[];
  currentUserId: string | null;
  onRefresh?: () => void;
}) {
  const [showAllImages, setShowAllImages] = useState(false);
  const [originalSize, setOriginalSize] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [entryList, setEntryList] = useState(entries);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEntryList(entries);
  }, [entries]);

  useEffect(() => {
    const sync = () => {
      setShowAllImages(localStorage.getItem("showAllImages") === "true");
      setOriginalSize(localStorage.getItem("originalSize") !== "false");
    };
    sync();
    window.addEventListener("settingsChanged", sync);
    return () => window.removeEventListener("settingsChanged", sync);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const date = (e as CustomEvent).detail?.date;
      if (!date || !scrollRef.current) return;
      const card = scrollRef.current.querySelector(
        `[data-date="${date}"]`
      ) as HTMLElement | null;
      if (card) {
        card.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    };
    window.addEventListener("scrollToDate", handler);
    return () => window.removeEventListener("scrollToDate", handler);
  }, []);

  // Listen for create popup trigger from header
  useEffect(() => {
    const handler = () => setCreateOpen(true);
    window.addEventListener("openCreatePopup", handler);
    return () => window.removeEventListener("openCreatePopup", handler);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await deleteEntryAction(id);
    setEntryList((prev) => prev.filter((e) => e.id !== id));
    setDetailId(null);
  }, []);

  const handleSetFeatured = useCallback(async (id: string, img: string) => {
    await setFeaturedImageAction(id, img);
    setEntryList((prev) =>
      prev.map((e) => (e.id === id ? { ...e, featuredImage: img } : e))
    );
  }, []);

  const handleToggleLike = useCallback(async (id: string) => {
    if (!currentUserId) return;
    await toggleLikeAction(id);
    setEntryList((prev) =>
      prev.map((e) => {
        if (e.id !== id) return e;
        const wasLiked = e.likedByMe;
        return {
          ...e,
          likedByMe: !wasLiked,
          likeCount: wasLiked ? e.likeCount - 1 : e.likeCount + 1,
        };
      })
    );
  }, [currentUserId]);

  const handleRefresh = useCallback(() => {
    if (onRefresh) onRefresh();
  }, [onRefresh]);

  const filteredEntries = searchQuery.trim()
    ? entryList.filter((e) =>
        e.text.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : entryList;

  const detailEntry = detailId
    ? entryList.find((e) => e.id === detailId) || null
    : null;

  return (
    <>
      {/* Search bar */}
      {entryList.length > 0 && (
        <div style={{ marginBottom: 14, position: "relative", maxWidth: 320 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="テキストで検索..."
            style={{
              width: "100%",
              padding: "8px 12px 8px 32px",
              border: "1px solid #e0e0e0",
              borderRadius: 8,
              fontSize: 13,
              outline: "none",
              background: "#fafafa",
              color: "var(--color-primary)",
              fontFamily: "inherit",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-primary)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "#e0e0e0")}
          />
          <span
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 14,
              color: "#bbb",
              pointerEvents: "none",
            }}
          >
            🔍
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                fontSize: 14,
                color: "#bbb",
                cursor: "pointer",
                padding: "0 4px",
              }}
            >
              ×
            </button>
          )}
        </div>
      )}

      {entryList.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "80px 20px",
            color: "#bbb",
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 16 }}>🎨</div>
          <p style={{ fontSize: 14, lineHeight: 1.8 }}>
            まだ記録がありません。
            <br />
            「+ 記録を追加」から始めましょう。
          </p>
        </div>
      ) : filteredEntries.length === 0 && searchQuery ? (
        <div
          style={{
            textAlign: "center",
            padding: "60px 20px",
            color: "#bbb",
          }}
        >
          <p style={{ fontSize: 14 }}>
            「{searchQuery}」に一致する記録が見つかりませんでした。
          </p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            height: "calc(100vh - 150px)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 14,
              height: "100%",
              paddingBottom: 16,
              alignItems: "flex-start",
            }}
          >
            {filteredEntries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                showAllImages={showAllImages}
                originalSize={originalSize}
                currentUserId={currentUserId}
                onOpenDetail={setDetailId}
                onSetFeatured={handleSetFeatured}
                onDelete={handleDelete}
                onToggleLike={handleToggleLike}
              />
            ))}
          </div>
        </div>
      )}

      {/* View / Edit popup */}
      {detailEntry && (
        <EntryPopup
          entry={detailEntry}
          mode="view"
          originalSize={originalSize}
          currentUserId={currentUserId}
          onClose={() => setDetailId(null)}
          onDelete={handleDelete}
          onSetFeatured={handleSetFeatured}
          onToggleLike={handleToggleLike}
          onRefresh={handleRefresh}
        />
      )}

      {/* Create popup */}
      {createOpen && (
        <EntryPopup
          entry={null}
          mode="create"
          originalSize={originalSize}
          currentUserId={currentUserId}
          onClose={() => setCreateOpen(false)}
          onDelete={() => {}}
          onSetFeatured={() => {}}
          onToggleLike={() => {}}
          onRefresh={handleRefresh}
        />
      )}
    </>
  );
}
