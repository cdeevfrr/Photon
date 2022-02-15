import { GraphNode } from "../shared/GraphNode"

const red = '#ff0000'
const blue = '#6060ff'
const black = '#000000'

/**
 * 
 * @param inputNodeArray rendered like this on the screen:
 * 
 * topleft    topright
 *    [ 1, 2, 3   ]
 *    [ 4, 5, 6   ]
 *    [ 7, 8, null]
 * 
 */
export function renderScene(inputNodeArray: Array<Array<GraphNode>>, canvas: HTMLCanvasElement){
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
            if (!(node)){
                cxt.fillRect(j * nodeLength, i * nodeHeight, nodeLength, nodeHeight)
                continue;
            }
            const entitiesToRender = node.getContents()
            if (entitiesToRender.length == 0){
                cxt.fillStyle = red
            } else {
                // TODO this is just a first pass for rendering when nodes only contain blocks.
                const keyEntity = entitiesToRender[0]
                cxt.fillStyle = keyEntity.color
            }
            cxt.fillRect(j * nodeLength, i * nodeHeight, nodeLength, nodeHeight)

            cxt.fillStyle = black
            cxt.fillText(node.initialCoordinates + "",j * nodeLength, i * nodeHeight + 10)
        }
    }
}