"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import ReactFlow, {
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
} from "reactflow"
import "reactflow/dist/style.css"
import { NodeEditPopover } from "./NodeEditPopover"
import type { Node, Edge } from "./DiagramPhase"
import type { DiagramComponent, DraggingState } from "./types"
import { EdgeEditPopover } from "./EdgeEditPopover"

interface DiagramCanvasProps {
  dragging?: DraggingState | null
  onEndDrag: () => void
}

/**
 * ✅ Wrapper ensures ReactFlow context is available.
 */
export function DiagramCanvasReactFlowWrapper({
  dragging,
  onEndDrag,
}: DiagramCanvasProps) {
  return (
    <ReactFlowProvider>
      <DiagramCanvas
        dragging={dragging}
        onEndDrag={onEndDrag}
      />
    </ReactFlowProvider>
  )
}

export function DiagramCanvas({
  dragging,
  onEndDrag,
}: DiagramCanvasProps) {
  const [internalNodes, setInternalNodes, onNodesChange] = useNodesState([])
  const [internalEdges, setInternalEdges, onEdgesChange] = useEdgesState([])
  const [activeNode, setActiveNode] = useState<Node | null>(null)
  const [activeEdge, setActiveEdge] = useState<Edge | null>(null)
  const reactFlowInstance = useReactFlow()

  const NODE_WIDTH = 80
  const NODE_HEIGHT = 80

  const diagramDisplayNode = useCallback(({ data }: { data: any }) => (
    <div
      style={{
        width: `${NODE_WIDTH}px`,
        height: `${NODE_HEIGHT}px`
      }}
      className="
        flex flex-col items-center justify-center gap-1 
        rounded-md border border-border bg-card text-center shadow-sm select-none
      "
    >
      <span className="text-xl">{data.icon}</span>
      
      {/* Label always visible */}
      <span className="text-xs font-semibold text-foreground text-center break-words leading-tight max-w-[6rem]">
        {data.label || ""}
      </span>

      {/* Type always below label */}
      <span className="text-[10px] text-muted-foreground italic leading-none">
        {data.type || "component"}
      </span>

      {/* Future edge handles (optional) */}
      <Handle type="target" position={Position.Top} className="!bg-transparent" />
      <Handle type="source" position={Position.Bottom} className="!bg-transparent" />
    </div>
  ), [NODE_WIDTH, NODE_HEIGHT])

  const nodeTypes = useMemo(() => ({ custom: diagramDisplayNode }), [diagramDisplayNode])

  const diagrmDisplayedge = ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    style,
    markerEnd,
    data,
  }: any) => {
    const edgePath = `M ${sourceX},${sourceY} L ${targetX},${targetY}`;
  
    return (
      <>
        <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
        <EdgeLabelRenderer>
          {data?.label && (
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${(sourceX + targetX) / 2}px, ${(sourceY + targetY) / 2}px)`,
                background: "white",
                padding: "2px 6px",
                borderRadius: "4px",
                fontSize: 10,
                border: "1px solid #ccc",
                color: "#111",
              }}
            >
              {data.label}
            </div>
          )}
        </EdgeLabelRenderer>
      </>
    );
  };

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

        const {zoom} = reactFlowInstance.getViewport()

        const projectedPosition = reactFlowInstance.project({
          x: (event.clientX - bounds.left),
          y: (event.clientY - bounds.top),
        });
  
        const position = {
          x: projectedPosition.x - (NODE_WIDTH/2)/zoom,
          y: projectedPosition.y - (NODE_HEIGHT/2)/zoom,
        }

        const type = dragging.component.id
        const icon = dragging.component.icon
        const newId = `${type}_${Date.now()}`
        const newNode: any = {
          id: newId,
          type: "custom",
          position,
          data: { icon, label: "", scaling: "none", description: "" },
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

  const edgeTypes = useMemo(() => ({ custom: diagrmDisplayedge }), []);

  // When a user connects two nodes, create a new edge and open popover
  const handleConnect = useCallback((params: any) => {
    const newEdge: any = {
      id: `edge-${params.source}-${params.target}`,
      source: params.source,
      target: params.target,
      type: "custom",
      direction: "unidirectional",
      data: { 
        label: "", 
        type: "custom", 
        description: "" 
      },
      style: { stroke: "#999", strokeWidth: 2 , textColor: "black"},
      markerEnd: "arrowclosed",
    };
    setInternalEdges((eds) => addEdge(newEdge, eds));
    setActiveEdge(newEdge);
  }, []);


  return (
    <div className="flex-1 bg-muted rounded-lg relative overflow-hidden">
      <ReactFlow
        className="react-flow"
        nodes={internalNodes}
        edges={internalEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDoubleClick={(_, flowNode) => {
          const selectedNode: any = internalNodes.find((n: any) => n.id === flowNode.id)
          if (selectedNode) setActiveNode(selectedNode)
        }}
        onEdgeDoubleClick={(_, flowEdge) => {
          const selectedEdge: any = internalEdges.find((e: any) => e.id === flowEdge.id)
          if (selectedEdge) setActiveEdge(selectedEdge)
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onConnect={handleConnect}
      >
        <Background />
      </ReactFlow>

      {activeNode && (
        <NodeEditPopover
          node={activeNode}
          onClose={() => setActiveNode(null)}
          onSave={(updated) => {
            setInternalNodes((nds: any[]) => nds.map((n: any) => (n.id === updated.id ? { ...n, data: updated.data } : n)))
          }}
        />
      )}

      {activeEdge && (
        <EdgeEditPopover
          edge={activeEdge}
          onClose={() => setActiveEdge(null)}
          onSave={(updated: any) => {
            setInternalEdges((eds: any[]) => eds.map((e: any) => (e.id === updated.id ? updated : e)))
          }}
        />
      )}
    </div>
  )
}
