import "./globals.css";
import { headers } from "next/headers";

export const metadata = {
  title: "intiZOM",
  description: "Discipline-based social network",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  const h = headers();
  const pathname = h.get("x-pathname") || "";

  const bodyClass = pathname.startsWith("/reels") ? "page--reels" : "";

  return (
    <html lang="en">
      <body className={bodyClass}>{children}</body>
    </html>
  );
}
