import type React from "react"
import type { Metadata } from "next"
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
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
    icon: "/favicon.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body
        className={`font-sans antialiased ${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
      >
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
