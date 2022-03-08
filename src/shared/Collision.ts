import { GraphNode } from "./GraphNode";
import { Direction } from "./shared";

export interface Collision{
    fromNode: GraphNode,
    toNode: GraphNode, 
    faceOnToNode?: Direction,
    faceOnFromNode: Direction,
}