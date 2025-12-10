import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'DeepDive.ai',
  // Optional: pages can override with `export const metadata` and will be combined with this template
  // title: { default: 'DeepDive.ai', template: '%s | DeepDive.ai' },
  icons: {
    icon: '/favicon.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}


