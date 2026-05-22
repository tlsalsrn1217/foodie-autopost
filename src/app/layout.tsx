import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jamchelin Studio — AI 음식 리뷰 스튜디오",
  description: "잼슐랭 스튜디오 — 사진과 메모만으로 자동 생성되는 솔직 음식 리뷰",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
