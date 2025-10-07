import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Sidebar } from '@/components/NavBar/sidebar'
import { MainContent } from '@/components/main-content'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Interview AI',
  description: 'AI-powered interview platform',
}

export default function RootLayout({ children,}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <div className="flex h-screen">
          <Sidebar />
          <MainContent>
            {children}
          </MainContent>
        </div>
      </body>
    </html>
  )
}
