import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: {
    default: "Better Call Odil",
    template: "%s | Better Call Odil",
  },
  description: "Better Call Odil – zamonaviy platforma",
  icons: {
    icon: "/favicon.ico",
  },
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
