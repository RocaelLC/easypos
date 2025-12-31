import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "EasyPOS",
  description: "Punto de venta PWA para cafeterías y postres",
  applicationName: "EasyPOS",
  manifest: "/manifest.json",
  themeColor: "#22c55e",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "EasyPOS",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.jpg", sizes: "192x192", type: "image/jpeg" },
      { url: "/icons/icon-512.jpg", sizes: "512x512", type: "image/jpeg" },
    ],
    apple: "/icons/icon-192.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head />
      <body>{children}</body>
    </html>
  );
}
