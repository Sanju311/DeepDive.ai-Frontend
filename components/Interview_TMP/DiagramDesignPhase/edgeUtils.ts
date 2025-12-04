// Utilities for floating edges: compute intersection points and edge params between nodes

type RFNode = {
  id?: string
  width?: number
  height?: number
  positionAbsolute?: { x: number; y: number }
  // Support @xyflow/react internal shapes too
  measured?: { width?: number; height?: number }
  internals?: { positionAbsolute?: { x: number; y: number } }
  // Allow extra properties without narrowing to {}
  [key: string]: any
}

function getNodeCenter(node: RFNode) {
  const width = (node.width ?? node.measured?.width) || 0
  const height = (node.height ?? node.measured?.height) || 0
  const pos = node.positionAbsolute || node.internals?.positionAbsolute || { x: 0, y: 0 }
  return {
    x: pos.x + width / 2,
    y: pos.y + height / 2,
  }
}

export function getNodeIntersection(intersectionNode: RFNode, targetNode: RFNode) {
  const nodeA = intersectionNode
  const nodeB = targetNode

  const centerA = getNodeCenter(nodeA)
  const centerB = getNodeCenter(nodeB)

  const width = (nodeA.width ?? nodeA.measured?.width) || 0
  const height = (nodeA.height ?? nodeA.measured?.height) || 0
  const pos = nodeA.positionAbsolute || nodeA.internals?.positionAbsolute || { x: 0, y: 0 }

  const dx = centerB.x - centerA.x
  const dy = centerB.y - centerA.y

  // avoid division by zero
  const m = dx === 0 ? Number.POSITIVE_INFINITY : dy / dx

  // Determine intersection with rectangle sides
  // Compare slope against aspect ratio
  let x = 0
  let y = 0

  if (Math.abs(m) < height / Math.max(width, 1)) {
    // hit left or right side
    if (dx >= 0) {
      x = pos.x + width
      y = centerA.y + (x - centerA.x) * m
    } else {
      x = pos.x
      y = centerA.y + (x - centerA.x) * m
    }
  } else {
    // hit top or bottom side
    if (dy >= 0) {
      y = pos.y + height
      x = centerA.x + (y - centerA.y) / (m === 0 ? 1e-6 : m)
    } else {
      y = pos.y
      x = centerA.x + (y - centerA.y) / (m === 0 ? 1e-6 : m)
    }
  }

  return { x, y }
}

export function getEdgeParams(source: RFNode, target: RFNode) {
  const sourceIntersect = getNodeIntersection(source, target)
  const targetIntersect = getNodeIntersection(target, source)
  return {
    sx: sourceIntersect.x,
    sy: sourceIntersect.y,
    tx: targetIntersect.x,
    ty: targetIntersect.y,
  }
}


