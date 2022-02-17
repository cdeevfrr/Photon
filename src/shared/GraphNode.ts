import { Direction, GraphEdge, Entity, opposite } from "./shared"
import {vec3} from 'gl-matrix'

/**
 * Graph nodes are the atomic unit of space in this world.
 * Things move, not in euclidian space, but instead between graph nodes.
 * 
 * There is no 'space' 'inside' a graph node. You might think that each node is a 1X1X1 box, but that's not how the physics works. Instead, the node is rendered based on all the contents it has. It might look different based on which face a photon enters from, but the angle of entry, depth of entry, lighting, and so on have no effect on the visual appearance of a node. Any appearance of a 3D world has to come from large scale, and photons just happening to travel (discretely) between nodes as if they were 1X1X1 (continuous) boxes. 
 * 
 * Graph nodes connect to other graph nodes via the 6 cardinal directions.
 * 
 * Note that "nodes" are distinct from "blocks". Blocks are entities that are usually non-moving, usually opaque, and are contained in nodes.
 * 
 */
export class GraphNode{
    private nodeContents: Array<Entity>
    outEdges: { [key in Direction]: Array<GraphEdge>}
    private opaque: boolean | undefined

    /** NOT UNIQUE!!! You can make another graph node at the same coordinates as this one.
     *  NOT CORRECT!!! You can move nodes around so their initial coords are not their 'current' coords.
     *  Coords are just for convenience, they don't actually relate to any kind of real X,Y,Z dimensions. The real world is actually a graph.
     *  Gameplay may use initialCoords to estimate distance/speed, but that's not part of the base physics.
     */
    initialCoordinates: vec3 


    constructor(initialCoordinates: vec3){
        this.nodeContents = []
        this.outEdges = {
            [Direction.up]: [],
            [Direction.down]: [],
            [Direction.left]: [],
            [Direction.right]: [],
            [Direction.forward]: [],
            [Direction.backward]: [],
        }
        this.initialCoordinates = initialCoordinates
    }

    adjacentNodes(d: Direction): Array<GraphNode>{
        return this.outEdges[d].map(e => e.destination) || []
    }

    addAdjacency(d: Direction, other: GraphNode): void{
        this.outEdges[d].push({destination: other})
        other.outEdges[opposite(d)].push({destination: this})
    }

    // TODO entities should only be able to exist in one node at a time.
    // Eventually, entities should know their containing node, and there
    // should be a registry of these edges that's quick for a node to lookup,
    // rathe than the node keeping track of its contents.
    //
    // For now though, we'll just be careful and make sure the entity-node relationship
    // doesn't get scewed up by being very careful with the coding.
    addContents(e: Entity){
        this.nodeContents.push(e)
        this.opaque = undefined
    }

    removeContents(e: Entity){
        this.nodeContents.splice(this.nodeContents.indexOf(e), 1)
        this.opaque = undefined
    }

    getContents(){
        return [...this.nodeContents]
    }

    isOpaque(){
        if (this.opaque === undefined){
            this.opaque = this.nodeContents.some(entity => entity.opaque)
        } else {
            return this.opaque
        }
    }

}