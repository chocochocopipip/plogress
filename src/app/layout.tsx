import type { Metadata } from "next";
import ColorInitializer from "@/components/ColorInitializer";
import "./globals.css";

export const metadata: Metadata = {
  title: "Plogress",
  description: "イラスト練習記録アプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <ColorInitializer />
        {children}
      </body>
    </html>
  );
}
