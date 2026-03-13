"use client";

interface Props {
  liked: boolean;
  count: number;
  onClick: () => void;
  disabled?: boolean;
  small?: boolean;
}

export default function LikeButton({ liked, count, onClick, disabled, small }: Props) {
  const size = small ? 14 : 16;
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      title={disabled ? "ログインしていいね" : liked ? "いいね済み" : "いいね"}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 3,
        background: "none",
        border: "none",
        cursor: disabled ? "default" : "pointer",
        padding: small ? "2px 4px" : "3px 6px",
        borderRadius: 6,
        fontSize: small ? 11 : 13,
        color: liked ? "#ef4444" : "#ccc",
        transition: "color 0.15s",
        fontWeight: 600,
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill={liked ? "#ef4444" : "none"}
        stroke={liked ? "#ef4444" : "currentColor"}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
      {count > 0 && <span>{count}</span>}
    </button>
  );
}
