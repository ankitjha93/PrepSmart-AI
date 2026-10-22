import { Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import MouseEffect from "@/components/MouseEffect";
import ScrollEffects from "@/components/ScrollEffects";
import { ThemeProvider } from "@/components/theme-provider";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";

const inter = Outfit({ subsets: ["latin"] });

export const metadata = {
  title: "PrepSmart AI | Next-Gen AI Mock Interview Platform",
  description: "Master behavioral and technical interviews with real-time AI feedback and speech analytics",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/logo.png", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0F172A" },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <SmoothScrollProvider>
              <Toaster />
              <MouseEffect />
              <ScrollEffects />
              {children}
            </SmoothScrollProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
