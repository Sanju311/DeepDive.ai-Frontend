// components/Interview/DiagramDesignPhase/types.ts

export type NodeCategory = 'client' | 'server' | 'data' | 'network' | 'messaging'

  export interface DiagramComponent {
    id: string
    name: string
    icon: string
    category: NodeCategory
    options: any
  }
    
  export interface DraggingState {
    component: DiagramComponent
    x: number
    y: number
  }

  // Keep lightweight types for popovers and local helpers
  export type Node = {
    id: string
    type: string
    position: { x: number, y: number }
    data: {
      type: string
      icon?: string
      label: string
      description?: string
      // schema-driven config: render fields dynamically
      schema?: Record<string, any>
      values?: Record<string, any>
    }
  }
  export type Edge = {
    id: string
    source: string
    target: string
    direction?: "unidirectional" | "bidirectional"
    type: string
    data: {
      label: string
      type: string
      description: string
    }
  }

  export const components: DiagramComponent[] = [
    {
      id: "client",
      name: "Client",
      icon: "💻",
      category: 'client',
      options: {
        type: ["Desktop", "Mobile", "Web", "IoT"],
      },
    },
    {
      id: "load_balancer",
      name: "Load Balancer",
      icon: "⚖️",
      category: 'network',
      options: {
        // algorithm: ["round-robin", "least-connections", "ip-hash"],
        // layer: ["L4", "L7"],
      },
    },
    {
      id: "api_gateway",
      name: "API Gateway",
      icon: "🚪",
      category: 'network',
      options: {
        rateLimiting: ["Yes", "No"],
        scaling: ["None", "Horizontal"],
      },
    },
    {
      id: "external_api",
      name: "External API",
      icon: "🔗",
      category: 'server',
      options: {
      },
    },
    {
      id: "web_server",
      name: "Web Server",
      icon: "🌐",
      category: 'server',
      options: {
      },
    },
    {
      id: "app_server",
      name: "App Server",
      icon: "🧠",
      category: 'server',
      options: {
        scaling: ["None", "Horizontal", "Vertical"],
      },
    },
    {
      id: "database",
      name: "Database",
      icon: "🗄️",
      category: 'data',
      options: {
        type: ["SQL", "NoSQL", "Graph"],
        // sharding: ["Yes", "No"],
      },
    },
    {
      id: "cache",
      name: "Cache",
      icon: "⚡",
      category: 'data',
      options: {
        // evictionPolicy: ["LRU", "LFU", "TTL-based"],
      },
    },
    {
      id: "cdn",
      name: "CDN",
      icon: "🌎",
      category: 'server',
      options: {
        // cacheStrategy: ["edge", "origin", "hybrid"],
      },
    },
    {
      id: "message_queue",
      name: "Message Queue",
      icon: "📬",
      category: 'messaging',
      options: {
        // deliveryGuarantee: ["at-most-once", "at-least-once", "exactly-once"],
        // partitioning: ["Yes", "No"],
      },
    },

    {
      id: "blob_storage",
      name: "Blob Storage",
      icon: "🗂️",
      category: 'data',
      options: {
      },
    },
  ]

  // Lookup for type name -> category (based on component name used as node data.type)
  export const TYPE_TO_CATEGORY: Record<string, NodeCategory> = Object.fromEntries(
    components.map(c => [c.name, c.category])
  ) as Record<string, NodeCategory>
  
  // Connection registry and helpers
  export type ConnectionSchema = Record<string, any>
  export type ConnectionTypeDef = {
    id: string
    name: string
    icon?: string
    allowedSourceCategories: NodeCategory[]
    allowedTargetCategories: NodeCategory[]
    schema: ConnectionSchema // schema for dynamic fields
  }

  // Initial, non-exhaustive set; tweak freely in one place
  export const CONNECTION_TYPES: ConnectionTypeDef[] = [
    {
      id: "http",
      name: "HTTP",
      icon: "➡️",
      allowedSourceCategories: ['client','server', 'network'],
      allowedTargetCategories: ['server', 'network'],
      schema: {
      },
    },
    {
      id: "websocket",
      name: "WebSocket",
      icon: "🔁",
      allowedSourceCategories: ['client','server'],
      allowedTargetCategories: ['server'],
      schema: {
      },
    },
    {
      id: "data_query",
      name: "Data Query",
      icon: "🧾",
      allowedSourceCategories: ['server'],
      allowedTargetCategories: ['data'],
      schema: {
      },
    },
    {
      id: "queue",
      name: "Queue",
      icon: "📨",
      allowedSourceCategories: ['server','data'],
      allowedTargetCategories: ['data','server'],
      schema: {
        mode: ["publish", "consume"],
      },
    },
  ]

  export function getValidConnectionTypes(sourceType?: string, targetType?: string) {
    if (!sourceType || !targetType) return [] as ConnectionTypeDef[]
    const sourceCat = TYPE_TO_CATEGORY[sourceType]
    const targetCat = TYPE_TO_CATEGORY[targetType]
    if (!sourceCat || !targetCat) return [] as ConnectionTypeDef[]
    return CONNECTION_TYPES.filter(ct =>
      ct.allowedSourceCategories.includes(sourceCat) && ct.allowedTargetCategories.includes(targetCat)
    )
  }
  