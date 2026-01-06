import "./globals.css";
import type { ReactNode } from "react";

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

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
