"use client"

import { useEffect, useMemo, useState, useCallback, useRef } from "react"
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  BaseEdge,
  EdgeLabelRenderer,
  addEdge,
  MarkerType,
  useConnection,
  useUpdateNodeInternals,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { NodeEditPopover } from "./NodeEditPopover"
import type { Node, Edge } from "./types"
import { getValidConnectionTypes, DraggingState  } from "./types"
import { EdgeEditPopover } from "./EdgeEditPopover"
import { useInterview } from "../InterviewProvider"
import CustomConnectionLine from "./CustomConnectionLine"
import FloatingEdge from "./FloatingEdge"

interface DiagramCanvasProps {
  dragging?: DraggingState | null
  onEndDrag: () => void
  readOnly?: boolean
}

/**
 * ✅ Wrapper ensures ReactFlow context is available.
 */
export function DiagramCanvasReactFlowWrapper({
  dragging,
  onEndDrag,
  readOnly,
}: DiagramCanvasProps) {
  return (
    <ReactFlowProvider>
      <DiagramCanvas
        dragging={dragging}
        onEndDrag={onEndDrag}
        readOnly={readOnly}
      />
    </ReactFlowProvider>
  )
}

export function DiagramCanvas({
  dragging,
  onEndDrag,
  readOnly,
}: DiagramCanvasProps) {
  const [internalNodes, setInternalNodes, onNodesChange] = useNodesState<any>([])
  const [internalEdges, setInternalEdges, onEdgesChangeRaw] = useEdgesState<any>([])
  const [activeNode, setActiveNode] = useState<Node | null>(null)
  const [activeEdge, setActiveEdge] = useState<Edge | null>(null)
  const connectRef = useRef<{ nodeId: string | null; dragInProgress: boolean }>({ nodeId: null, dragInProgress: false })
  const reactFlowInstance = useReactFlow()
  const { diagramSnapshot, setDiagramSnapshot } = useInterview()


  const NODE_WIDTH = 80
  const NODE_HEIGHT = 80

  const toCamel = (s: string) => s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((part, idx) => idx === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

  const diagramDisplayNode = useCallback(({ id, data }: any) => {
    const connection = useConnection()
    const updateNodeInternals = useUpdateNodeInternals()
    const isTarget = connection.inProgress && connection.fromNode?.id !== id

    // Ensure XYFlow recalculates handle bounds when we toggle handles
    useEffect(() => {
      updateNodeInternals(id)
    }, [id, data?.connectMode, updateNodeInternals])

    return (
      <div
        style={{
          width: `${NODE_WIDTH}px`,
          height: `${NODE_HEIGHT}px`
        }}
        className="relative rounded-md text-center shadow-sm select-none"
      >
        <div
          className="absolute rounded-md border border-border bg-card p-0 overflow-hidden z-10 flex flex-col items-center justify-center gap-1"
          style={{ inset: 0 }}
        >
          <span className="text-xl">{data.icon}</span>

          {(() => {
            const primaryText = (data.label || data.type || "");
            const secondaryText = readOnly ? (id as string) : null;
            return (
              <>
                <span className="text-[10px]  text-foreground text-center break-words leading-tight max-w-[6rem]">
                  {primaryText}
                </span>
                {secondaryText ? (
                  <span className="text-[8px] text-muted-foreground italic leading-none">
                    {secondaryText}
                  </span>
                ) : null}
              </>
            )
          })()}

          {/* Full-area invisible handles over inner area, conditional like xyflow example */}
          {!connection.inProgress && (
            <Handle
              type="source"
              position={Position.Right}
              id="full-source"
              isConnectable={!!data?.connectMode}
              className="!opacity-0"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', left: 0, top: 0, right: 0, bottom: 0, transform: 'none', border: 'none', borderRadius: 0, zIndex: 20, pointerEvents: data?.connectMode ? 'auto' : 'none' }}
            />
          )}
          <Handle
            type="target"
            position={Position.Left}
            id="full-target"
            isConnectableStart={false}
            className="!opacity-0"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', left: 0, top: 0, right: 0, bottom: 0, transform: 'none', border: 'none', borderRadius: 0, zIndex: 20, pointerEvents: connection.inProgress && isTarget ? 'auto' : 'none' }}
          />
        </div>
      </div>
    )
  }, [NODE_WIDTH, NODE_HEIGHT])

  const nodeTypes = useMemo(() => ({ custom: diagramDisplayNode }), [diagramDisplayNode])
  const onEdgesChange = useCallback((changes: any) => {
    onEdgesChangeRaw(changes)
  }, [onEdgesChangeRaw])

  // internal nodes/edges are the single source of truth

  useEffect(() => {

    const handleMouseUp = (event: MouseEvent) => {

      const rfContainer =
        document.querySelector(".react-flow__renderer") ||
        document.querySelector(".react-flow") as HTMLElement;

      if (!rfContainer) return;
    
      const bounds = rfContainer.getBoundingClientRect();

      const isInsideCanvas =
        event.clientX >= bounds.left &&
        event.clientX <= bounds.right &&
        event.clientY >= bounds.top &&
        event.clientY <= bounds.bottom;
    

      if (isInsideCanvas && dragging?.component?.id) {

        // screenToFlowPosition expects screen (client) coordinates and accounts for pan/zoom
        const flowPos = reactFlowInstance.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        })
  
        const position = {
          x: flowPos.x - NODE_WIDTH / 2,
          y: flowPos.y - NODE_HEIGHT / 2,
        }

        const id = dragging.component.id
        const name = dragging.component.name
        const icon = dragging.component.icon
        const options = dragging.component.options
        const baseKey = toCamel(id)
        const existingCount = internalNodes.filter((n: any) => typeof n?.id === 'string' && n.id.startsWith(`${baseKey}-`)).length
        const newId = `${baseKey}-${existingCount + 1}`
        const newNode: any = {
          id: newId,
          type: "custom",
          position,
          draggable: true,
          
          data: {
            icon,
            type: name,
            category: dragging.component.category,
            label: "",
            description: "",
            schema: options, // schema definition for dynamic form
            values: Object.fromEntries(
              Object.entries(options || {}).map(([key, def]: any) => {
                if (Array.isArray(def)) return [key, def[0] ?? ""]
                if (def === "number") return [key, 0]
                if (def === "boolean") return [key, false]
                return [key, ""]
              })
            ),
          },
        }
        setInternalNodes((nds: any[]) => [...nds, newNode])
        setActiveNode(newNode)
      } else {
        console.warn("Dropped outside canvas — ignoring");
      }
    
      // Always run cleanup after handling the drop
      onEndDrag();
      window.removeEventListener("mouseup", handleMouseUp);
      return () => window.removeEventListener("mouseup", handleMouseUp);
    };
    
    window.addEventListener("mouseup", handleMouseUp)
  }, [dragging?.component])

  const edgeTypes = useMemo(() => ({floating: FloatingEdge }), []);

  const connectionLineStyle = useMemo(() => ({ stroke: "#b1b1b7" }), [])
  const defaultEdgeOptions = useMemo(() => ({ 
    type: "floating", 
    markerEnd: { type: MarkerType.ArrowClosed, color: "#999" }
  }), [])

  // When a user connects two nodes, create a new edge and open popover
  const handleConnect = useCallback((params: any) => {
    const sourceNode: any = internalNodes.find((n: any) => n.id === params.source)
    const targetNode: any = internalNodes.find((n: any) => n.id === params.target)
    if (sourceNode == targetNode) return;
    const sourceType = sourceNode?.data?.type
    const targetType = targetNode?.data?.type
    const validTypes = getValidConnectionTypes(sourceType, targetType)

    const newEdge: any = {
      id: `${params.source}-${params.target}`,
      source: params.source,
      target: params.target,
      type: "floating",
      direction: "unidirectional",
      data: { 
        label: "", 
        direction: "unidirectional",
        type: "", 
        description: "",
        schema: undefined,
        values: {},
        _validTypes: validTypes.map(v => ({ id: v.id, name: v.name })),
      },
      style: { stroke: "#999", strokeWidth: 2 , textColor: "black"},
      markerEnd: { type: MarkerType.ArrowClosed },
    };
    setInternalEdges((eds: any[]) => {
      const next = addEdge(newEdge, eds)
      return next
    });
    setActiveEdge(newEdge);
    // reset connect mode on all nodes after a successful connect
    setInternalNodes((nds: any[]) => nds.map((n: any) => ({ ...n, data: { ...n.data, connectMode: false } })))
  }, [internalNodes]);


  //update the diagram snapshot when the nodes or edges change
  useEffect(() => {
    setDiagramSnapshot({ nodes: internalNodes, edges: internalEdges })
  }, [internalNodes, internalEdges])

  // When in read-only mode (e.g., deep-dive), auto-center the diagram whenever content changes
  useEffect(() => {
    if (!readOnly) return
    // Defer slightly to ensure layout measurements are ready
    const id = setTimeout(() => {
      try {
        if (internalNodes.length > 0 || internalEdges.length > 0) {
          reactFlowInstance.fitView({ padding: 0.2, includeHiddenNodes: true, duration: 400 })
        }
      } catch {
        // noop
      }
    }, 50)
    return () => clearTimeout(id)
  }, [readOnly, internalNodes, internalEdges, reactFlowInstance])

  // Hydrate canvas from saved snapshot when present (e.g., returning from another phase)
  useEffect(() => {
    if (diagramSnapshot && internalNodes.length === 0 && internalEdges.length === 0) {
      setInternalNodes(diagramSnapshot.nodes as any[])
      setInternalEdges(diagramSnapshot.edges as any[])
    }
  }, [diagramSnapshot])

  return (
    <div className="flex-1 bg-muted rounded-lg relative overflow-hidden">
      <ReactFlow
        className="react-flow"
        nodes={internalNodes}
        edges={internalEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={readOnly ? undefined : ((_: any, flowNode: any) => {
          // Single click toggles connect mode for this node; drag doesn't trigger click
          if (connectRef.current.dragInProgress) return
          const nodeId = flowNode.id
          connectRef.current.nodeId = nodeId
          setInternalNodes((nds: any[]) => nds.map((n: any) => ({ ...n, data: { ...n.data, connectMode: n.id === nodeId } })))
        })}
        onNodeDragStart={readOnly ? undefined : (() => {
          // Mark dragging in progress and disable any connect mode
          connectRef.current.dragInProgress = true
          if (connectRef.current.nodeId) {
            const id = connectRef.current.nodeId
            setInternalNodes((nds: any[]) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, connectMode: false } } : n))
            connectRef.current.nodeId = null
          }
        })}
        onNodeDoubleClick={readOnly ? undefined : ((_: any, flowNode: any) => {
          const selectedNode: any = internalNodes.find((n: any) => n.id === flowNode.id)
          selectedNode.data.connectMode = false
          if (selectedNode) setActiveNode(selectedNode)
        })}
        onNodeDragStop={readOnly ? undefined : (() => {
          connectRef.current.dragInProgress = false
        })}
        onConnectEnd={readOnly ? undefined : (() => {
          // cancelled → reset connect mode
          if (connectRef.current.nodeId) {
            const id = connectRef.current.nodeId
            setInternalNodes((nds: any[]) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, connectMode: false } } : n))
            connectRef.current.nodeId = null
          }
        })}
        onEdgeDoubleClick={readOnly ? undefined : ((_: any, flowEdge: any) => {
          const selectedEdge: any = internalEdges.find((e: any) => e.id === flowEdge.id)
          if (selectedEdge) setActiveEdge(selectedEdge)
        })}
        onPaneClick={readOnly ? undefined : (() => {
          // click on empty canvas → cancel connect mode
          if (connectRef.current.nodeId) {
            const id = connectRef.current.nodeId
            setInternalNodes((nds: any[]) => nds.map((n: any) => n.id === id ? { ...n, data: { ...n.data, connectMode: false } } : n))
            connectRef.current.nodeId = null
          }
        })}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onConnect={readOnly ? undefined : handleConnect}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineComponent={CustomConnectionLine}
        connectionLineStyle={connectionLineStyle}
        nodesDraggable={!readOnly}
        nodesConnectable={!readOnly}
        elementsSelectable={!readOnly}
        panOnDrag={!readOnly}
        zoomOnScroll={!readOnly}
        zoomOnPinch={!readOnly}
        zoomOnDoubleClick={!readOnly}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </ReactFlow>

      {!readOnly && activeNode && (
        <NodeEditPopover
          node={activeNode}
          onClose={() => setActiveNode(null)}
          onSave={(updated) => {
            setInternalNodes((nds: any[]) => nds.map((n: any) => (n.id === updated.id ? { ...n, data: updated.data } : n)))
          }}
          onDelete={(id: string) => {
            setInternalNodes((nds: any[]) => nds.filter((n: any) => n.id !== id))
            setInternalEdges((eds: any[]) => eds.filter((e: any) => e.source !== id && e.target !== id))
          }}
        />
      )}

      {!readOnly && activeEdge && (
        <EdgeEditPopover
          edge={activeEdge}
          onClose={() => setActiveEdge(null)}
          onSave={(updated: any) => {
            setInternalEdges((eds: any[]) => eds.map((e: any) => (e.id === updated.id ? updated : e)))
          }}
          onDelete={(id: string) => {
            setInternalEdges((eds: any[]) => eds.filter((e: any) => e.id !== id))
            setActiveEdge(null)
          }}
        />
      )}
    </div>
  )
}
