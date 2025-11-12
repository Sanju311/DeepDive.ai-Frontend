import { BaseEdge, EdgeLabelRenderer, getStraightPath, useInternalNode } from "@xyflow/react"
import { getEdgeParams } from "./edgeUtils"
import { CONNECTION_TYPES } from "./types"

export default function FloatingEdge({ id, source, target, markerEnd, style, data }: any) {
  const sourceNode = useInternalNode(source) as any
  const targetNode = useInternalNode(target) as any

  if (!sourceNode || !targetNode) {
    console.log('[FloatingEdge] missing nodes', { id, source, target, sourceNode, targetNode })
    return null
  }

  const { sx, sy, tx, ty } = getEdgeParams(sourceNode, targetNode)
  const [path] = getStraightPath({ sourceX: sx, sourceY: sy, targetX: tx, targetY: ty })
  // console.log('[FloatingEdge] path', { id, sx, sy, tx, ty })

  const fallbackTypeName = data?.type
    ? (CONNECTION_TYPES.find(t => t.id === data.type)?.name ?? data.type)
    : ""
  const displayText = data?.label || fallbackTypeName || ""

  return (
    <>
      <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
      {(
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${(sx + tx) / 2}px, ${(sy + ty) / 2}px)`,
              background: 'white',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 10,
              border: '1px solid #ccc',
              color: '#111',
            }}
          >
            {displayText}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}


