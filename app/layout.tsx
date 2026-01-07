import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SRTrack - Self-Regulated Training Tracking System',
  description: 'Monitor SRT compliance and track training sessions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

