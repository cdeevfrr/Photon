import { vec3, mat3 } from 'gl-matrix'
import { WorldRay } from '../shared/shared'
import { GraphNode } from '../shared/GraphNode'
import { renderScene } from './render'
import { rescaleToLine } from './VectorToLine'
export { drawScene }


// https://learnopengl.com/Getting-started/Camera
// Camera points toward negative Z axis by convention.
// positive X is right
// positive Y is up.

const defaultLines = [
    [[2,2,-2], [2,2,-1], [2,2,0], [2,2,1], [2,2,2]],
    [[2,1,-2], [2,1,-1], [2,1,0], [2,1,1], [2,1,2]],
    [[2,0,-2], [2,0,-1], [2,0,0], [2,0,1], [2,0,2]],
    [[2,-1,-2], [2,-1,-1], [2,-1,0], [2,-1,1], [2,-1,2]],
    [[2,-2,-2], [2,-2,-1], [2,-2,0], [2,-2,1], [2,-2,2]],
]

/**
 * Given camera orientation information, create lines
 * for each pixel that will be displayed. 
 */
function makeLines(pitchDegrees: number, yawDegrees: number){
    const pitch = pitchDegrees * 180 / Math.PI
    const yaw = yawDegrees * 180 / Math.PI
    const forwardDirection = vec3.fromValues(
        Math.cos(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.sin(yaw) * Math.cos(pitch)
    )
    const rightYaw = (yawDegrees - 90) * 180 / Math.PI
    const rightDirection = vec3.fromValues(
        Math.cos(rightYaw),
        0,
        Math.sin(rightYaw),
    )
    const upDirection = vec3.create()
    vec3.cross(upDirection, rightDirection, forwardDirection)

    const rotationMatrix = mat3.fromValues(
        forwardDirection[0], upDirection[0], rightDirection[0], 
        forwardDirection[1], upDirection[1], rightDirection[1],
        forwardDirection[2], upDirection[2], rightDirection[2],
    )

    return defaultLines.map(row => {
        return row.map(vector => {
            const ray = vec3.fromValues(vector[0], vector[1], vector[2])
            vec3.transformMat3(ray, ray, rotationMatrix)
            return rescaleToLine(ray, 5)
        })
    })
}

function traceLine(position: GraphNode, direction: WorldRay, distance: number): Array<GraphNode>{
    let rayIndex = 0
    let currentNodes = [position]
    while (distance > 1){
        const nextDirection = direction[rayIndex]
        currentNodes = currentNodes.flatMap(node => node.adjacentNodes(nextDirection))
        rayIndex += 1
        rayIndex = rayIndex % direction.length 
        distance -= 1
    }
    return currentNodes
}

function drawScene(pitchDegrees: number, yawDegrees: number, position: GraphNode){
    const rays: Array<Array<WorldRay>> = makeLines(pitchDegrees, yawDegrees)
    const nodes: Array<Array<Array<GraphNode>>> = 
      rays.map(row => 
          row.map( ray =>
              traceLine(position, ray, 5) 
          )
      )
    // TODO may later handle rendering with multiple out edges
    // For now, just take the first visible node.
    const individualNodes = nodes.map(row => row.map(nodes => nodes[0]))

    renderScene(individualNodes)
}