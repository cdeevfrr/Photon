import { canvasId } from "../commonIds";
import { GraphNode } from "../shared/GraphNode"

const red = '#ff0000'
const blue = '#6060ff'
const black = '#000000'

/**
 * 
 * @param inputNodeArray must be square, like this:
 * 
 * [ 1, 2, 3]
 * [ 4, 5, 6]
 * [ 7, 8, 9]
 * 
 */
export function renderScene(inputNodeArray: Array<Array<GraphNode>>){
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    const nodesLong = inputNodeArray[0].length
    const nodesHigh = inputNodeArray.length

    const canvasLength = canvas.getBoundingClientRect().width
    const canvasHeight = canvas.getBoundingClientRect().height

    const nodeLength = canvasLength / nodesLong
    const nodeHeight = canvasHeight / nodesHigh

    const cxt = canvas.getContext("2d")!

    for (let i = 0; i < nodesLong; i += 1){
        for (let j = 0; j < nodesHigh; j += 1){
            const node = inputNodeArray[i][j]
            cxt.fillStyle = black
            if (node === null){
                cxt.fillRect(j * nodeLength, i * nodeHeight, nodeLength, nodeHeight)
                return
            }
            console.log(`Looking at node ${JSON.stringify(node.nodeContents)}`)
            if (node.nodeContents.nodeType === 0){
                cxt.fillStyle = red
            }
            if (node.nodeContents.nodeType === 1){
                cxt.fillStyle = blue
            } 
            cxt.fillRect(j * nodeLength, i * nodeHeight, nodeLength, nodeHeight)

            cxt.fillStyle = black
            cxt.fillText(node.nodeContents.extraData,j * nodeLength, i * nodeHeight + 10)
        }
    }
}