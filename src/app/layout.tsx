import type { Metadata, Viewport } from "next";
import { Fredoka } from "next/font/google";
import { OfflineBereit } from "@/components/OfflineBereit";
import "./globals.css";

const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tims toller Tag",
  description:
    "Ein liebevolles Mitmachspiel für Kinder ab 4 Jahren — nach dem Bilderbuch „Tims toller Tag“.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Tims toller Tag",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#fdf6ec",
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
    <html lang="de" className={`${fredoka.variable} h-full antialiased`}>
      <body className="min-h-full">
        {children}
        <OfflineBereit />
      </body>
    </html>
  );
}
