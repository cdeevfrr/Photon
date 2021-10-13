import { vec3 } from 'gl-matrix'
import { makeRotationMatrix } from './RotationMatrix'
import { WorldRay } from '../shared/shared'
import { GraphNode } from '../shared/GraphNode'
import { renderScene } from './render'
import { rescaleToLine } from './VectorToLine'
export { drawScene }


// https://learnopengl.com/Getting-started/Camera
// Camera points toward negative Z axis by convention.
// positive X is right
// positive Y is up.

const defaultLines: Array<Array<Array<number>>> = []
const renderDistance = 5
for(let y = renderDistance; y > -renderDistance - 1; y --){
    const row = []
    for (let x = -renderDistance; x < renderDistance + 1; x ++){
        row.push([x, y, -renderDistance])
    }
    defaultLines.push(row)
}

const viewDebugLevel = 2


function drawScene(pitchDegrees: number, yawDegrees: number, position: GraphNode, canvas: HTMLCanvasElement){
    if (viewDebugLevel > 1){
        console.log(`Rendering from node ${position.nodeContents.extraData} with pitch ${pitchDegrees} and yaw ${yawDegrees}`)
    }
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

    renderScene(individualNodes, canvas)
}

/**
 * Given camera orientation information, create lines
 * for each pixel that will be displayed. 
 */
function makeLines(pitchDegrees: number, yawDegrees: number){
    const rotationMatrix = makeRotationMatrix(pitchDegrees, yawDegrees)
    
    return defaultLines.map(row => {
        return row.map(vector => {
            const ray = vec3.fromValues(vector[0], vector[1], vector[2])
            vec3.transformMat3(ray, ray, rotationMatrix)

            const distance = vector.reduce((x, y) => Math.abs(x) + Math.abs(y))
            const result = rescaleToLine(ray, distance)
            if (viewDebugLevel > 10){
                console.log(`Rendered default line ${vector} with oriented line ${ray} and got line ${result}`)
            }
            return result
        })
    })
}

function traceLine(position: GraphNode, direction: WorldRay, distance: number): Array<GraphNode>{
    let rayIndex = 0
    let currentNodes = [position]
    while (distance > .5){
        const nextDirection = direction[rayIndex]
        // TODO optimize this so we quit trying to render once we hit an opaque node
        currentNodes = currentNodes.flatMap(node => node.opaque? node: node.adjacentNodes(nextDirection))
        rayIndex += 1
        rayIndex = rayIndex % direction.length 
        distance -= 1
    }
    return currentNodes
}