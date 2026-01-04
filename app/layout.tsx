// frontend/app/layout.tsx
import "./globals.css";
import type { ReactNode } from "react";
import AuthProvider from "@/context/AuthContext";

export const metadata = {
  title: "intiZOM",
  description: "Discipline-based social network",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};


export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
