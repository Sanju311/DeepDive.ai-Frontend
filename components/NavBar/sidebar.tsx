"use client"

import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, Home, BookOpen, BarChart3, Settings, User, Bell } from "lucide-react"
import { useState } from "react"

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [expandedReady, setExpandedReady] = useState(!isCollapsed)

  const handleTransitionEnd = (e: React.TransitionEvent<HTMLElement>) => {
    if (e.propertyName === "width") {
      setExpandedReady(!isCollapsed)
    }
  }

  const toggleSidebar = () => {
    const nextIsCollapsed = !isCollapsed
    if (!nextIsCollapsed) {
      // If we are expanding, hide text until the width transition finishes
      setExpandedReady(false)
    }
    setIsCollapsed(nextIsCollapsed)
  }

  const navItems = [
    { icon: BookOpen, label: 'Problems', href: '/home', color: 'text-blue-400 hover:text-blue-300' },
    { icon: BarChart3, label: 'Analytics', href: '/analytics', color: 'text-green-400 hover:text-green-300' },
    { icon: Bell, label: 'Notifications', href: '/notifications', color: 'text-purple-400 hover:text-purple-300' },
  ]

  return (
    <aside
      className={cn(
        "border-r transition-all duration-300 h-full flex flex-col",
        isCollapsed ? "w-16" : "w-64"
      )}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* Header */}
      <div className={cn('flex items-center justify-between p-6', isCollapsed ? 'px-4' : 'px-6')}>
        {!isCollapsed && expandedReady && (
          <h2 className="text-lg font-bold text-purple-400 whitespace-nowrap">Interview AI</h2>
        )}
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.label} className="flex rounded-xl h-12 hover:bg-muted">
                <a
                  href={item.href}
                  className={cn(
                    'flex px-6 items-center rounded-xl transition-colors',
                    item.color,
                    isCollapsed ? 'justify-center' : 'gap-3'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {!isCollapsed && expandedReady && (
                    <span className="font-medium whitespace-nowrap">{item.label}</span>
                  )}
                </a>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className={cn(
          'flex items-center gap-4 rounded-xl',
          isCollapsed ? 'justify-center' : ''
        )}>
          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-400 via-blue-400 to-green-400 flex items-center justify-center">
            <User className="h-4 w-4 text-black" />
          </div>
          {!isCollapsed && expandedReady && (
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground text-sm whitespace-nowrap">Sanju Sathiyamoorthy</p>
              <p className="text-xs text-muted-foreground whitespace-nowrap">sanjumoorthy622@gmail.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
