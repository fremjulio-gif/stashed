import type { Metadata, Viewport } from "next";
import "./globals.css";
import { GlobalAudioPlayer } from "@/components/audio/GlobalAudioPlayer";

export const metadata: Metadata = {
  title: "Stashed • Bibliothèque Audio Studio",
  description:
    "Bibliothèque audio personnelle pour ingénieurs du son et producteurs. Déposez, organisez et partagez vos mixes et masters en streaming haute résolution.",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#060709",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className="min-h-screen bg-studio-950 text-white selection:bg-accent-cyan selection:text-black">
        {children}
        {/* Global Persistent DAW Audio Player */}
        <GlobalAudioPlayer />
      </body>
    </html>
  );
}
