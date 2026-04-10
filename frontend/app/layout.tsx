import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { RoleProvider } from "@/components/rbac/RoleContext";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CourtSense · VerbaSense",
  description: "Enterprise-grade court proceedings intelligence (demo)",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-full antialiased">
        <RoleProvider>{children}</RoleProvider>
      </body>
    </html>
  );
}
