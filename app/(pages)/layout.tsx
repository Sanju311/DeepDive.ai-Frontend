import { Sidebar } from '@/components/NavBar/sidebar'
import { MainContent } from '@/components/main-content'

export default function AppLayout({ children, }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen dark">
      <Sidebar />
      <MainContent>
        {children}
      </MainContent>
    </div>
  )
}


