"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import type { EntryMeta } from "@/lib/entries";
import { getImageUrl } from "@/lib/entries";
import {
  deleteEntryAction,
  setFeaturedImageAction,
  toggleLikeAction,
} from "@/lib/actions";
import LikeButton from "./LikeButton";
import CommentSection from "./CommentSection";

const MAX_VISIBLE = 9;

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
  isFeatured: boolean
): React.CSSProperties {
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
  margin: "10px 2px 2px",
  fontSize: 12,
  color: "#666",
  lineHeight: 1.7,
  wordBreak: "break-word",
  overflow: "hidden",
  maxHeight: "4.2em",
};

function Markdown({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <div className="md-content" style={style}>
      <ReactMarkdown remarkPlugins={[remarkBreaks]}>{text}</ReactMarkdown>
    </div>
  );
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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/entry/${entry.id}/edit`;
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
        width: 420,
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
              style={{ width: 20, height: 20, borderRadius: "50%", objectFit: "cover" }}
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
        </div>
        <div
          style={{ display: "flex", gap: 4, alignItems: "center" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Like button */}
          <LikeButton
            liked={entry.likedByMe}
            count={entry.likeCount}
            onClick={() => onToggleLike(entry.id)}
            disabled={!currentUserId}
            small
          />
          {isOwner && (
            <>
              <button
                onClick={handleEdit}
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
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#999")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#ccc")}
              >
                削除
              </button>
            </>
          )}
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: "10px 12px" }}>
        {/* Featured image large */}
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
                style={imgStyle(originalSize, true)}
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

        {/* All images grid */}
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
                      ...imgStyle(originalSize, false),
                      borderRadius: 8,
                      border: isFeatured
                        ? "2px solid var(--color-secondary)"
                        : "1px solid #ebebeb",
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

        {/* Memo (markdown, truncated) */}
        {entry.text && <Markdown text={entry.text} style={cardMemoStyle} />}
      </div>
    </div>
  );
}

// ── Detail Popup ──

function DetailPopup({
  entry,
  originalSize,
  currentUserId,
  onClose,
  onDelete,
  onSetFeatured,
  onToggleLike,
}: {
  entry: EntryMeta;
  originalSize: boolean;
  currentUserId: string | null;
  onClose: () => void;
  onDelete: (id: string) => void;
  onSetFeatured: (id: string, img: string) => void;
  onToggleLike: (id: string) => void;
}) {
  const isOwner = currentUserId === entry.user_id;
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleDelete = () => {
    if (!confirm("この記録を削除しますか？\nこの操作は元に戻せません。")) return;
    onDelete(entry.id);
    onClose();
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxSrc) setLightboxSrc(null);
        else onClose();
      }
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, lightboxSrc]);

  const cols = Math.min(entry.images.length, 3);

  return (
    <>
      <div className="detail-overlay active" onClick={handleOverlayClick}>
        <div
          style={{
            background: "#fff",
            borderRadius: 14,
            width: "100%",
            maxWidth: 680,
            margin: "auto",
            boxShadow: "0 8px 48px rgba(0,0,0,0.2)",
            overflow: "hidden",
            animation: "popupIn 0.18s ease",
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
              {entry.authorAvatar && (
                <img
                  src={entry.authorAvatar}
                  alt=""
                  style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }}
                />
              )}
              <div>
                <span style={{ fontSize: 18, fontWeight: 700 }}>
                  {formatDate(entry.date)}
                </span>
                {entry.authorName && (
                  <span style={{ fontSize: 11, color: "#999", marginLeft: 8 }}>
                    by {entry.authorName}
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <LikeButton
                liked={entry.likedByMe}
                count={entry.likeCount}
                onClick={() => onToggleLike(entry.id)}
                disabled={!currentUserId}
              />
              {isOwner && (
                <>
                  <a
                    href={`/entry/${entry.id}/edit`}
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
                  </a>
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
            {/* All images grid */}
            {entry.images.length > 0 && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `repeat(${cols}, 1fr)`,
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                {entry.images.map((img) => {
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
                        onClick={() => setLightboxSrc(src)}
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
            {entry.text && <Markdown text={entry.text} style={memoStyle} />}

            {/* Comments */}
            <div style={{ marginTop: 20 }}>
              <CommentSection
                entryId={entry.id}
                currentUserId={currentUserId}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div
          className="lightbox active"
          onClick={() => setLightboxSrc(null)}
        >
          <img src={lightboxSrc} alt="" />
        </div>
      )}
    </>
  );
}

// ── Main ──

export default function EntryList({
  entries,
  currentUserId,
}: {
  entries: EntryMeta[];
  currentUserId: string | null;
}) {
  const [showAllImages, setShowAllImages] = useState(false);
  const [originalSize, setOriginalSize] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [entryList, setEntryList] = useState(entries);
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

  const detailEntry = detailId
    ? entryList.find((e) => e.id === detailId) || null
    : null;

  return (
    <>
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
      ) : (
        <div
          ref={scrollRef}
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            height: "calc(100vh - 112px)",
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
            {entryList.map((entry) => (
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

      {detailEntry && (
        <DetailPopup
          entry={detailEntry}
          originalSize={originalSize}
          currentUserId={currentUserId}
          onClose={() => setDetailId(null)}
          onDelete={handleDelete}
          onSetFeatured={handleSetFeatured}
          onToggleLike={handleToggleLike}
        />
      )}
    </>
  );
}
