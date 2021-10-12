import { Direction, GraphEdge, NodeContents, opposite } from "./shared"


export class GraphNode{
    nodeContents: NodeContents
    outEdges: { [key in Direction]: Array<GraphEdge>}
    opaque: boolean

    constructor(){
        this.nodeContents = {nodeType: 0}
        this.outEdges = {
            [Direction.up]: [],
            [Direction.down]: [],
            [Direction.left]: [],
            [Direction.right]: [],
            [Direction.forward]: [],
            [Direction.backward]: [],
        }
        this.opaque = false
    }

    adjacentNodes(d: Direction): Array<GraphNode>{
        return this.outEdges[d].map(e => e.destination) || []
    }

    addAdjacency(d: Direction, other: GraphNode): void{
        this.outEdges[d].push({destination: other})
        other.outEdges[opposite(d)].push({destination: this})
    }


}