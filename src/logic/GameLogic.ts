import { drawScene } from "../Render/viewport"
import { GraphNode } from "../shared/GraphNode"
import { Direction } from "../shared/shared"

export {mainLoop}

const centerNode: GraphNode = gridOfSize(5)
centerNode.nodeContents.nodeType = 1

centerNode.adjacentNodes(Direction.forward)[0].nodeContents.nodeType = 1

function mainLoop() {
    const startingNode = centerNode.adjacentNodes(Direction.backward)[0].adjacentNodes(Direction.backward)[0]
    drawScene(
        0, 0, startingNode
    )
    // TODO register mouse listener
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

