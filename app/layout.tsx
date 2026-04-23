import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "THE DEVICE",
  description: "LCARS Bio-Scanner Unit — Class IV",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full overflow-hidden bg-black">{children}</body>
    </html>
  );
}
