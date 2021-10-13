import { drawScene } from "../Render/viewport"
import { GraphNode } from "../shared/GraphNode"
import { Direction } from "../shared/shared"
import { canvasId } from "../commonIds"

export { mainLoop }

const centerNode: GraphNode = gridOfSize(5)
centerNode.nodeContents.nodeType = 1

centerNode.adjacentNodes(Direction.forward)[0].nodeContents.nodeType = 1

function mainLoop() {
    const startingNode = centerNode.adjacentNodes(Direction.backward)[0].adjacentNodes(Direction.backward)[0]
    let pitch = 0
    let yaw = -150
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement

    drawScene(pitch, yaw, startingNode, canvas)

    function moveListener(event: MouseEvent){
        yaw -= event.movementX * .05 // subtract because moving X to the right in clip space is moving clockwise, and radians go counterclockwise.
        pitch -= event.movementY * .05 // subtract because +y goes down in clip space
        if (pitch > 89) {pitch = 89}
        if (pitch < -89) {pitch = -89}
        // These next two aren't necessary, just convenient for debugging.
        if (yaw > 181) {yaw -= 360}
        if (yaw < -181) {yaw += 360}
        drawScene(pitch, yaw, startingNode, canvas)
        event.stopPropagation()
    }

    function pointerLockChangeListener(){
        if (document.pointerLockElement === canvas){
            canvas.addEventListener('mousemove', moveListener, true)
        } else {
            console.log("Removing mouse listener")
            canvas.removeEventListener('mousemove', moveListener, true)
        }
    }

    // TODO update pointerLock to work for multiple browsers https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API

    document.addEventListener('pointerlockchange',pointerLockChangeListener, false);

    canvas.onclick = () => {
        canvas.requestPointerLock()
    }
}


/**
 * Construct an array of (2n + 1) by (2n + 1) nodes, 
 * and return the one at the center.
 * @param n 
 */
function gridOfSize(n: number): GraphNode{
    const totalNodes = 2*n + 1
    const resultArray: Array<Array<Array<GraphNode>>>  = Array(totalNodes).fill(0).map(x => Array(totalNodes).fill(0).map(y => Array(totalNodes)))
    for(let i = 0; i < totalNodes; i ++){
        for(let j = 0; j < totalNodes; j ++){
            for(let k = 0; k < totalNodes; k ++){
                // create grid[i][j][k] and attach it to its 3 earlier neighbors
                resultArray[i][j][k] = new GraphNode()
                resultArray[i][j][k].nodeContents.extraData = `(${i},${j},${k})`
                if (i%2 === 0){
                    resultArray[i][j][k].nodeContents.nodeType = 1
                }
                if (i > 0){
                    resultArray[i][j][k].addAdjacency(Direction.left,resultArray[i-1][j][k])
                }
                if (j > 0){
                    resultArray[i][j][k].addAdjacency(Direction.down,resultArray[i][j-1][k])
                }
                if (k > 0){
                    resultArray[i][j][k].addAdjacency(Direction.forward,resultArray[i][j][k-1])
                }
            }
        }
    }
    return resultArray[n][n][n]
}

