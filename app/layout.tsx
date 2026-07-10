import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { OfflineIndicator } from "@/components/ui/offline-indicator";
import { Toaster } from "@/components/ui/toast";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Neta",
  description: "Self-hosted freelancer operating dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Neta",
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={cn("font-sans", geist.variable)}
      suppressHydrationWarning
    >
      <body>
        {children}
        <OfflineIndicator />
        <Toaster />
      </body>
    </html>
  );
}
