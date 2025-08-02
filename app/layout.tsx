import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../styles/globals.css"
import { AuthProvider } from "@/components/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import { SessionConflictHandler } from "@/components/session-conflict-handler"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "JCU Gym Management System",
  description: "James Cook University Gym Management and Booking System",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionConflictHandler />
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
