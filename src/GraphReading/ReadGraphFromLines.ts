import { GraphNode } from '../shared/GraphNode';
import { Block, Color, Direction } from '../shared/shared';

/**
 * GridFormatGraph (gfg) file:
 * Grids with block entities in them.
 *  
 * Start at y=0, x=0, z=0.
 * Each row of the file represents incrementing values of x.
 * A single newline represents incrementing z and resetting x.
 * A double newline represents incrementing y and resetting both x and z. Additional newlines after this are ignored.
 * A "_" character represents "don't make a node, but increment x y or z". An E represents "make a node with no contents."
 * 
 * Other letters determine what entity to put in the node, ex B = blue block
 * 
 * 
 * Edge cases:
 * Files MUST start with characters. An empty newline as the first character is NOT allowed.
 * 
 * 
Example valid files,  :


File1: a 5X3X4 grid (x, y, z) with mostly empty nodes
"""
EEEEE
EEEEE
EEEEE
EEEEE

EEBEE
EEEEE
EEEBE
EGEEE

GEEEE
EGEEE
EEGEE
EEEGE
"""

File 2: A plane with one node above it and one node below it, and 
a gap in the middle of the plane. The center node of the plane (the one that has 
nodes above & below) is blue.

"""
_
_ 
__E

EEEEE
EEE_E
EEBEE
EEEEE

_
_ 
__E
"""

 * 
 * 
 */


export async function readGFGLines(lines: Iterable<string>) {
    // nodes[y][z][x] to keep the algorithm simple.
    const nodes: Array<Array<Array<GraphNode | null>>> = [[]] // setup y=0 array & z=0 array, the x=0 entry will happen on first iteration.
    let x = 0
    let y = 0
    let z = -1 // First pass is guaranteed to increment z.
    let newlineCounter = 0

    let firstNode = null

    for await (const line of lines) {
        if (line.length == 0) {
            newlineCounter++
            continue
        }
        // Ok, we've got characters.
        const row: (GraphNode|null)[] = []
        // Are they adding to Z or to Y?
        if (newlineCounter > 0) {
            x = 0
            z = 0
            nodes.push([]) // new Z row
            y++
            nodes[y].push(row) // new X row
            newlineCounter = 0
        } else {
            x = 0
            z++
            nodes[y].push(row) // new X row
        }
        // Now actually fill out the x row.
        for (const char of line) {
            const newNode = makeNode(char, {x, y, z})
            if (newNode){
                connectIfExists({ x: x - 1, y: y, z: z }, nodes, newNode, Direction.left)
                connectIfExists({ x: x, y: y - 1, z: z }, nodes, newNode, Direction.down)
                connectIfExists({ x: x, y: y, z: z - 1 }, nodes, newNode, Direction.forward)
            }
            firstNode = firstNode || newNode
            nodes[y][z].push(newNode)
            x++
        }
    }
    if (firstNode == null){
        throw new Error(`Tried to read a graph, but given no lines!`)
    }
    return {nodes, firstNode} 
}

function makeNode(char: string, { x, y, z }: { x: number, y: number, z: number }): GraphNode | null {
    if (char === "_") {
        return null;
    }

    const result = new GraphNode([x, y, z])

    if (char === "E") {
        return result;
    }


    switch (char) {
        case "B":
            const blueBlock: Block = {
                blockTypeId: 0,
                blockId: 0,
                opaque: true,
                color: Color.blue
            }
            result.addContents(blueBlock)
            break;
        case "G":
            const greenBlock: Block = {
                blockTypeId: 0,
                blockId: 0,
                opaque: true,
                color: Color.green
            }
            result.addContents(greenBlock)
            break;
    }

    return result
}

function connectIfExists(
    { x, y, z }: { x: number, y: number, z: number },
    existingNodes: Array<Array<Array<GraphNode | null>>>,
    newNode: GraphNode,
    direction: Direction,
    ) {
        if (0 <= y && y < existingNodes.length){
            if (0 <= z && z < existingNodes[y].length){
                if (0 <= x && x < existingNodes[y][z].length){
                    const otherNode = existingNodes[y][z][x]
                    if (otherNode != null){
                        newNode.addSymmetricAdjacency(direction, otherNode)
                    }
                }
            }
        }
}



