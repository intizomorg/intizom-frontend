import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  metadataBase: new URL("https://intizom.org"),
  title: {
    default: "Better Call Odil",
    template: "%s | Better Call Odil",
  },
  description: "Better Call Odil – intizom va motivatsiyaga asoslangan zamonaviy platforma.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Better Call Odil",
    description: "Better Call Odil – intizom va motivatsiya platformasi.",
    url: "https://intizom.org",
    siteName: "Better Call Odil",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
