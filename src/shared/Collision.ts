import { GraphNode } from "./GraphNode";
import { Direction } from "./shared";

export interface Collision{
    fromNode: GraphNode,
    toNode: GraphNode | null, 
    faceOnToNode?: Direction,
    faceOnFromNode: Direction,
}