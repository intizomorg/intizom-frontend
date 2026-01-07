import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  metadataBase: new URL("https://intizom.org"),
  title: {
    default: "Better Call Odil",
    template: "%s | Better Call Odil",
  },
  description: "Better Call Odil – intizom va motivatsiyaga asoslangan zamonaviy platforma.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="uz">
      <body>
        <div className="app-shell">
          <main className="app-main">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
