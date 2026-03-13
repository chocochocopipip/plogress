"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("この記録を削除しますか？")) return;
    await fetch(`/api/entries/${id}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  };

  return (
    <button
      onClick={handleDelete}
      className="text-sm text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition"
    >
      削除
    </button>
  );
}
