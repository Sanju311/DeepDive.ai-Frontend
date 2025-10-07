"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Placeholder data - you'll add icons later
const COMPONENTS = [
  { id: "loadbalancer", name: "Load Balancer", icon: "⚖️" },
  { id: "server", name: "Server", icon: "🖥️" },
  { id: "database", name: "Database", icon: "🗄️" },
  { id: "cache", name: "Cache", icon: "⚡" },
  { id: "queue", name: "Queue", icon: "📬" },
  { id: "cdn", name: "CDN", icon: "🌐" },
]

const CONNECTIONS = [
  { id: "http", name: "HTTP", icon: "→" },
  { id: "websocket", name: "WebSocket", icon: "↔" },
  { id: "grpc", name: "gRPC", icon: "⇄" },
  { id: "database", name: "Database Connection", icon: "⟷" },
  { id: "async", name: "Async/Queue", icon: "⤑" },
]

export function DiagramControls() {
  return (
    <div className="w-64 bg-gray-900 border border-gray-800 rounded-lg flex flex-col">
      <Tabs defaultValue="components" className="flex flex-col h-full p-2">
        {/* Tabs List */}
        <TabsList className="grid w-full grid-cols-2 bg-gray-800 border border-gray-700 p-0 h-auto">
          <TabsTrigger 
            value="components"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-l-md"
          >
            Components
          </TabsTrigger>
          <TabsTrigger 
            value="connections"
            className="data-[state=active]:bg-purple-600 data-[state=active]:text-white rounded-r-md"
          >
            Connections
          </TabsTrigger>
        </TabsList>

        {/* Components Tab Content */}
        <TabsContent value="components" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <div className="grid grid-cols-2 gap-2">
            {COMPONENTS.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center justify-center p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 hover:border-purple-600 cursor-pointer transition-all"
              >
                <span className="text-2xl mb-2">{item.icon}</span>
                <span className="text-xs text-center text-gray-300">{item.name}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Connections Tab Content */}
        <TabsContent value="connections" className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          <div className="grid grid-cols-2 gap-2">
            {CONNECTIONS.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center justify-center p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 hover:border-purple-600 cursor-pointer transition-all"
              >
                <span className="text-2xl mb-2">{item.icon}</span>
                <span className="text-xs text-center text-gray-300">{item.name}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
