"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  PRIMARY_PRESETS,
  SECONDARY_PRESETS,
  DEFAULT_PRIMARY,
  DEFAULT_SECONDARY,
  loadColors,
  saveColors,
} from "@/lib/colors";

interface UserInfo {
  id: string;
  name: string;
  avatar: string;
}

interface Props {
  entryCount: number;
  entryDates: string[];
  user: UserInfo | null;
  activePage?: "home" | "timeline";
}

// ── Color Picker Row ──

function ColorRow({
  label,
  presets,
  value,
  onChange,
}: {
  label: string;
  presets: string[];
  value: string;
  onChange: (c: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ padding: "8px 0" }}>
      <span
        style={{
          fontSize: 11,
          color: "#888",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          display: "block",
          marginBottom: 6,
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
        {presets.map((c) => (
          <button
            key={c}
            className={`color-swatch ${value === c ? "active" : ""}`}
            style={{ background: c }}
            onClick={() => onChange(c)}
            title={c}
          />
        ))}
        {/* Custom color picker */}
        <div style={{ position: "relative" }}>
          <button
            className={`color-swatch ${!presets.includes(value) ? "active" : ""}`}
            style={{
              background: presets.includes(value)
                ? "conic-gradient(red,yellow,lime,aqua,blue,magenta,red)"
                : value,
              border: !presets.includes(value)
                ? undefined
                : "1.5px dashed #ccc",
            }}
            onClick={() => inputRef.current?.click()}
            title="カスタムカラー"
          />
          <input
            ref={inputRef}
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            style={{
              position: "absolute",
              opacity: 0,
              width: 0,
              height: 0,
              pointerEvents: "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Calendar ──

function CalendarPopup({
  dates,
  primary,
  onSelect,
  onClose,
}: {
  dates: Set<string>;
  primary: string;
  onSelect: (date: string) => void;
  onClose: () => void;
}) {
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [month, setMonth] = useState(() => new Date().getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  function prevMonth() {
    if (month === 0) { setYear(year - 1); setMonth(11); }
    else setMonth(month - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(year + 1); setMonth(0); }
    else setMonth(month + 1);
  }

  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        top: "calc(100% + 4px)",
        right: 0,
        background: "#fff",
        border: "1px solid #e8e8e8",
        borderRadius: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
        padding: 16,
        width: 280,
        zIndex: 300,
        animation: "fadeDown 0.15s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={prevMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#555", padding: "2px 8px", borderRadius: 4 }}>‹</button>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{year}年{month + 1}月</span>
        <button onClick={nextMonth} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "#555", padding: "2px 8px", borderRadius: 4 }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
        {dayNames.map((d) => (
          <div key={d} style={{ textAlign: "center", fontSize: 10, color: "#999", fontWeight: 600, padding: "4px 0" }}>{d}</div>
        ))}
      </div>
      {weeks.map((w, wi) => (
        <div key={wi} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {w.map((d, di) => {
            if (d === null) return <div key={di} style={{ padding: "6px 0" }} />;
            const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
            const hasEntry = dates.has(dateStr);
            return (
              <button
                key={di}
                disabled={!hasEntry}
                onClick={() => { onSelect(dateStr); onClose(); }}
                style={{
                  background: hasEntry ? primary : "transparent",
                  color: hasEntry ? "#fff" : "#ccc",
                  border: "none",
                  borderRadius: 6,
                  padding: "6px 0",
                  fontSize: 12,
                  fontWeight: hasEntry ? 700 : 400,
                  cursor: hasEntry ? "pointer" : "default",
                  transition: "opacity 0.1s",
                }}
                onMouseEnter={(e) => { if (hasEntry) e.currentTarget.style.opacity = "0.75"; }}
                onMouseLeave={(e) => { if (hasEntry) e.currentTarget.style.opacity = "1"; }}
              >
                {d}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Header ──

export default function Header({ entryCount, entryDates, user, activePage = "home" }: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showAllImages, setShowAllImages] = useState(false);
  const [originalSize, setOriginalSize] = useState(true);
  const [primary, setPrimary] = useState(DEFAULT_PRIMARY);
  const [secondary, setSecondary] = useState(DEFAULT_SECONDARY);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const settingsBtnRef = useRef<HTMLButtonElement>(null);

  const dateSet = new Set(entryDates);

  useEffect(() => {
    setShowAllImages(localStorage.getItem("showAllImages") === "true");
    setOriginalSize(localStorage.getItem("originalSize") !== "false");
    const c = loadColors();
    setPrimary(c.primary);
    setSecondary(c.secondary);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        settingsPanelRef.current && !settingsPanelRef.current.contains(e.target as Node) &&
        settingsBtnRef.current && !settingsBtnRef.current.contains(e.target as Node)
      ) {
        setSettingsOpen(false);
      }
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  function toggleShowAll() {
    setShowAllImages((prev) => {
      const next = !prev;
      localStorage.setItem("showAllImages", String(next));
      window.dispatchEvent(new Event("settingsChanged"));
      return next;
    });
  }

  function toggleOriginalSize() {
    setOriginalSize((prev) => {
      const next = !prev;
      localStorage.setItem("originalSize", String(next));
      window.dispatchEvent(new Event("settingsChanged"));
      return next;
    });
  }

  function handlePrimaryChange(c: string) {
    setPrimary(c);
    saveColors(c, secondary);
  }

  function handleSecondaryChange(c: string) {
    setSecondary(c);
    saveColors(primary, c);
  }

  function handleCalendarSelect(date: string) {
    window.dispatchEvent(new CustomEvent("scrollToDate", { detail: { date } }));
  }

  const settingsRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    padding: "6px 0",
  };

  const settingsDivider: React.CSSProperties = {
    borderTop: "1px solid #f3f3f3",
  };

  return (
    <header style={{ background: "#fff", borderBottom: "1px solid #ebebeb", padding: "0 24px", position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a href="/" style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.3px", color: "var(--color-primary)", textDecoration: "none" }}>
            Plogress
          </a>
          <nav style={{ display: "flex", gap: 4 }}>
            <a
              href="/"
              style={{
                fontSize: 12,
                fontWeight: activePage === "home" ? 700 : 500,
                color: activePage === "home" ? "var(--color-primary)" : "#999",
                textDecoration: "none",
                padding: "4px 10px",
                borderRadius: 6,
                background: activePage === "home" ? "#f5f5f5" : "transparent",
                transition: "all 0.15s",
              }}
            >
              マイ記録
            </a>
            <a
              href="/timeline"
              style={{
                fontSize: 12,
                fontWeight: activePage === "timeline" ? 700 : 500,
                color: activePage === "timeline" ? "var(--color-primary)" : "#999",
                textDecoration: "none",
                padding: "4px 10px",
                borderRadius: 6,
                background: activePage === "timeline" ? "#f5f5f5" : "transparent",
                transition: "all 0.15s",
              }}
            >
              タイムライン
            </a>
          </nav>
          <span style={{ fontSize: 12, color: "#999" }}>{entryCount}日 記録済み</span>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {/* Calendar */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => { setCalendarOpen(!calendarOpen); setSettingsOpen(false); }}
              style={{ padding: "7px 10px", lineHeight: 0, background: "transparent", border: "none", cursor: "pointer", borderRadius: 8 }}
              title="カレンダー"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={calendarOpen ? "#38bdf8" : "#555"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.15s" }}>
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </button>
            {calendarOpen && (
              <CalendarPopup dates={dateSet} primary={primary} onSelect={handleCalendarSelect} onClose={() => setCalendarOpen(false)} />
            )}
          </div>

          {/* Settings */}
          <div style={{ position: "relative" }}>
            <button
              ref={settingsBtnRef}
              onClick={() => { setSettingsOpen(!settingsOpen); setCalendarOpen(false); }}
              style={{ padding: "7px 10px", lineHeight: 0, background: "transparent", border: "none", cursor: "pointer", borderRadius: 8 }}
              title="表示設定"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={settingsOpen ? "#38bdf8" : "#555"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "stroke 0.15s" }}>
                <rect x="2" y="5" width="20" height="6" rx="3" />
                <circle cx="16" cy="8" r="2" fill={settingsOpen ? "#38bdf8" : "#555"} stroke="none" />
                <rect x="2" y="13" width="20" height="6" rx="3" />
                <circle cx="8" cy="16" r="2" fill={settingsOpen ? "#38bdf8" : "#555"} stroke="none" />
              </svg>
            </button>

            {settingsOpen && (
              <div
                ref={settingsPanelRef}
                style={{
                  position: "absolute",
                  top: "calc(100% + 4px)",
                  right: 0,
                  background: "#fff",
                  border: "1px solid #e8e8e8",
                  borderRadius: 12,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
                  padding: "14px 16px",
                  minWidth: 280,
                  zIndex: 300,
                  animation: "fadeDown 0.15s ease",
                }}
              >
                {/* Image toggles */}
                <div style={settingsRow}>
                  <span style={{ fontSize: 12, color: "#444", fontWeight: 500 }}>画像を元のサイズで表示する</span>
                  <button className={`toggle-btn ${originalSize ? "on" : ""}`} onClick={toggleOriginalSize}><span className="toggle-knob" /></button>
                </div>
                <div style={{ ...settingsRow, ...settingsDivider }}>
                  <span style={{ fontSize: 12, color: "#444", fontWeight: 500 }}>全画像を表示する</span>
                  <button className={`toggle-btn ${showAllImages ? "on" : ""}`} onClick={toggleShowAll}><span className="toggle-knob" /></button>
                </div>

                {/* Color pickers */}
                <div style={settingsDivider}>
                  <ColorRow
                    label="プライマリーカラー"
                    presets={PRIMARY_PRESETS}
                    value={primary}
                    onChange={handlePrimaryChange}
                  />
                </div>
                <div style={settingsDivider}>
                  <ColorRow
                    label="セカンダリーカラー"
                    presets={SECONDARY_PRESETS}
                    value={secondary}
                    onChange={handleSecondaryChange}
                  />
                </div>
              </div>
            )}
          </div>

          {user ? (
            <>
              <button
                onClick={() => window.dispatchEvent(new Event("openCreatePopup"))}
                style={{
                  background: "var(--color-primary)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  padding: "7px 16px",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "opacity 0.15s",
                }}
              >
                + 記録を追加
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                  />
                ) : (
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#e0e0e0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#888" }}>
                    {user.name?.[0] || "?"}
                  </div>
                )}
                <button
                  onClick={async () => {
                    const supabase = createClient();
                    await supabase.auth.signOut();
                    window.location.href = "/";
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#999", padding: "4px 0" }}
                >
                  ログアウト
                </button>
              </div>
            </>
          ) : (
            <a
              href="/login"
              style={{
                background: "var(--color-primary)",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "7px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "none",
                transition: "opacity 0.15s",
              }}
            >
              ログイン
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
