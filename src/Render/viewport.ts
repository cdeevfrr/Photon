import { vec3 } from 'gl-matrix'
import { makeRotationMatrix } from './RotationMatrix'
import { WorldRay } from '../shared/shared'
import { GraphNode } from '../shared/GraphNode'
import { renderScene } from './render'
import { rescaleToLine } from './VectorToLine2'
export { drawScene, testInternals }

const testInternals = {findNodes}


// https://learnopengl.com/Getting-started/Camera
// Camera points toward negative Z axis by convention.
// positive X is right
// positive Y is up.

// This type could probably be Array<Array<Vector>> instead.
const defaultLines: Array<Array<Array<number>>> = []
const renderDistance = 7
const viewportlength = renderDistance - 2
for(let y = viewportlength; y > -viewportlength - 1; y --){
    const row = []
    for (let x = -viewportlength; x < viewportlength + 1; x ++){
        row.push([x, y, -renderDistance])
    }
    defaultLines.push(row)
}
const viewDebugLevel = 0

if (viewDebugLevel > 1){
    console.log(`Using render rays ${JSON.stringify(defaultLines)}`)
}



function drawScene(pitchDegrees: number, yawDegrees: number, fractionalPosition: vec3, position: GraphNode, canvas: HTMLCanvasElement){
    const individualNodes = findNodes(pitchDegrees, yawDegrees, position, fractionalPosition)
    renderScene(individualNodes, canvas)
}

function findNodes(pitchDegrees: number, yawDegrees: number, position: GraphNode, fractionalPosition: vec3){
    if (viewDebugLevel > 1){
        console.log(`Rendering from node ${position.nodeContents.extraData} with pitch ${pitchDegrees} and yaw ${yawDegrees}`)
    }
    const rays: Array<Array<WorldRay>> = makeLines(pitchDegrees, yawDegrees, fractionalPosition)
    const nodes: Array<Array<Array<GraphNode>>> = 
      rays.map(row => 
          row.map( ray =>
              traceLine(position, ray, ray.length) 
          )
      )
    // TODO may later handle rendering with multiple out edges
    // For now, just take the first visible node.
    return nodes.map(row => row.map(nodes => nodes[0]))
}

/**
 * Given camera orientation information, create lines
 * for each pixel that will be displayed. 
 */
function makeLines(pitchDegrees: number, yawDegrees: number, fractionalPosition: vec3){
    const rotationMatrix = makeRotationMatrix(pitchDegrees, yawDegrees)

    
    return defaultLines.map(row => {
        return row.map(vector => {
            const ray = vec3.fromValues(vector[0], vector[1], vector[2])
            vec3.transformMat3(ray, ray, rotationMatrix)

            const result = rescaleToLine(ray, fractionalPosition)
            if (viewDebugLevel > 10){
                console.log(`Rendered default line ${vector} with oriented line ${ray} and got line ${result}`)
            }
            return result
        })
    })
}

/** Follow this line (worldRay, a list of Directions), in parallel if a single direction connects out to more than 1 node.
 * @param position 
 * @param direction 
 * @param distance 
 * @returns 
 */
function traceLine(position: GraphNode, direction: WorldRay, distance: number): Array<GraphNode>{
    let rayIndex = 0
    let currentNodes = [position]
    while (distance > .5){
        const nextDirection = direction[rayIndex]
        // TODO optimize this so we quit trying to render once we hit an opaque node
        // Note that we stay 'stuck' inside opaque nodes - not in the node before an opaque node. This
        // ensures that we don't, say, have light fail to pass through a node going forward, but then just
        // go left at the next timestep - the opaque node has 'absorbed' the light.
        currentNodes = currentNodes.flatMap(node => node.opaque? node: node.adjacentNodes(nextDirection))
        rayIndex += 1
        rayIndex = rayIndex % direction.length 
        distance -= 1
    }
    return currentNodes
}