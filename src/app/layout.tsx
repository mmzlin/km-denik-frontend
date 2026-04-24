import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const viewport: Viewport = {
  themeColor: "#0a0a12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  // KRITICKÉ pro iOS PWA s notchem — aktivuje safe-area-inset CSS proměnné
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Cyklodeník",
  description: "Osobní cyklistický deník — záznamy jízd a statistiky",
  manifest: "/manifest.webmanifest",
  applicationName: "Cyklodeník",
  appleWebApp: {
    capable: true,
    // 'default' = standardní status bar (bezpečnější než black-translucent
    // který může způsobit "chin gap" na některých iOS verzích)
    statusBarStyle: "default",
    title: "Cyklodeník",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="cs"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
