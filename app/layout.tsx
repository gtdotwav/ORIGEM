import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import { AuthSessionProvider } from "@/components/providers/session-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { authEnabled } from "@/lib/auth"
import "./globals.css"

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "ORIGEM — Psychosemantic AI Engine",
  description:
    "Decompose language into atomic meaning. Orchestrate AI agents on an infinite canvas.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`font-sans antialiased ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <AuthSessionProvider enabled={authEnabled}>
            {children}
          </AuthSessionProvider>
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  )
}
