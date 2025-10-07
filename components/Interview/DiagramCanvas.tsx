    "use client"

export function DiagramCanvas() {
  return (
    <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg relative overflow-hidden">
      {/* Placeholder for whiteboard - drag and drop will be added later */}
      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
        <p className="text-sm">Canvas Area - Drag & Drop Coming Soon</p>
      </div>

      {/* Grid background (optional for visual reference) */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(to right, #374151 1px, transparent 1px),
            linear-gradient(to bottom, #374151 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />
    </div>
  )
}
