"use client";

export default function SimpleHeader() {
  return (
    <header
      style={{
        background: "#fff",
        borderBottom: "1px solid #ebebeb",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        style={{
          maxWidth: 1400,
          margin: "0 auto",
          height: 56,
          display: "flex",
          alignItems: "center",
        }}
      >
        <a
          href="/"
          style={{
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: "-0.3px",
            color: "var(--color-primary)",
            textDecoration: "none",
          }}
        >
          Plogress
        </a>
      </div>
    </header>
  );
}
