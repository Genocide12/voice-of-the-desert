import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/game/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: "Голос Пустыни · Voice of the Desert",
  description:
    "Медитативная игра о странствующем монахе, пересекающем бесконечную пустыню. Каждый день пустыня задаёт тебе коан.",
  keywords: ["koan", "desert", "meditation", "philosophy", "пустыня", "коан", "монах"],
  authors: [{ name: "Voice of the Desert" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Голос Пустыни",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/icons/favicon-32.png"],
  },
  openGraph: {
    title: "Голос Пустыни · Voice of the Desert",
    description: "Медитативная игра-странствие монаха через бесконечную пустыню коанов.",
    type: "website",
    images: [{ url: "/images/og-image.jpg", width: 1200, height: 630, alt: "Голос Пустыни" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Голос Пустыни · Voice of the Desert",
    description: "Медитативная игра-странствие монаха через бесконечную пустыню коанов.",
    images: ["/images/og-image.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5e6c8" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a2e" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        {/* Telegram WebApp SDK */}
        <script src="https://telegram.org/js/telegram-web-app.js" async />
        {/* Service worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch(() => {});
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} antialiased bg-background text-foreground min-h-screen overflow-x-hidden relative`}
      >
        {/* Subtle background texture */}
        <div
          className="fixed inset-0 -z-10 pointer-events-none bg-cover bg-center opacity-[0.04]"
          style={{ backgroundImage: "url(/images/bg-texture.jpg)" }}
          aria-hidden
        />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}
