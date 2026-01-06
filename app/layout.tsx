import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: {
    default: "intiZOM — Discipline based social network",
    template: "%s | intiZOM",
  },
  description:
    "intiZOM — motivatsiya, intizom va rivojlanishga asoslangan ijtimoiy tarmoq. Reels, postlar va foydali kontentlar.",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "intiZOM",
    description:
      "Motivatsiya va intizom asosidagi zamonaviy ijtimoiy tarmoq.",
    url: "https://intizom.org",
    siteName: "intiZOM",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "intiZOM",
      },
    ],
    locale: "uz_UZ",
    type: "website",
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
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
