import { vec3, mat3, mat4 } from 'gl-matrix'
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
    [[2,2,-2], [1,2,-2], [0,2,-2], [-1,2,-2], [-2,2,-2]],
    [[2,1,-2], [1,1,-2], [0,1,-2], [-1,1,-2], [-2,1,-2]],
    [[2,0,-2], [1,0,-2], [0,0,-2], [-1,0,-2], [-2,0,-2]],
    [[2,-1,-2], [1,-1,-2], [0,-1,-2], [-1,-1,-2], [-2,-1,-2]],
    [[2,-2,-2], [1,-2,-2], [0,-2,-2], [-1,-2,-2], [-2,-2,-2]],
]

/**
 * Given camera orientation information, create lines
 * for each pixel that will be displayed. 
 */
function makeLines(pitchDegrees: number, yawDegrees: number){
    const pitch = pitchDegrees / 180 * Math.PI
    const yaw = yawDegrees / 180 * Math.PI

    // Create a rotation matrix that will transform vectors made from the default lines into vectors pointing in the right direction.
    const rotationMatrix4 = mat4.create()
    mat4.identity(rotationMatrix4)
    mat4.rotateX(rotationMatrix4, rotationMatrix4, pitch)
    mat4.rotateY(rotationMatrix4, rotationMatrix4, yaw)
    const rotationMatrix = mat3.create()
    mat3.fromMat4(rotationMatrix, rotationMatrix4)

    return defaultLines.map(row => {
        return row.map(vector => {
            const ray = vec3.fromValues(vector[0], vector[1], vector[2])
            vec3.transformMat3(ray, ray, rotationMatrix)

            const distance = vector.reduce((x, y) => Math.abs(x) + Math.abs(y))
            const result = rescaleToLine(ray, distance)
            console.log(`Rendered default line ${vector} with oriented line ${ray} and got line ${result}`)
            return result
        })
    })
}

function traceLine(position: GraphNode, direction: WorldRay, distance: number): Array<GraphNode>{
    let rayIndex = 0
    let currentNodes = [position]
    while (distance > .5){
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
              traceLine(position, ray, ray.length) 
          )
      )
    // TODO may later handle rendering with multiple out edges
    // For now, just take the first visible node.
    const individualNodes = nodes.map(row => row.map(nodes => nodes[0]))

    renderScene(individualNodes)
}