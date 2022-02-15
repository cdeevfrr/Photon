import {vec3} from 'gl-matrix'
import { OperationCanceledException } from 'typescript'
import { GraphNode } from './GraphNode'

export type NodeContents = {
    nodeType: number,
    extraData?: any,
}

export type GraphEdge = {
    destination: GraphNode
}

export enum Direction {
    forward = 'f',
    backward = 'b',
    up = 'u',
    down = 'd',
    left = 'l' ,
    right = 'r',
}

/**
 * Return the Direction associated with this normalized, unit vector
 * @param vector 
 */
export function fromVector(vector: vec3 | number[]): Direction {
    if (vector[0] === 1){
        return Direction.right
    }
    if (vector[0] === -1){
        return Direction.left
    }
    if (vector[1] === 1){
        return Direction.up
    }
    if (vector[1] === -1){
        return Direction.down
    }
    if (vector[2] === 1){
        return Direction.backward
    }
    if (vector[2] === -1){
        return Direction.forward
    }
    throw new Error(`Cannot find direction for vector ${vector}, are you sure it's a unit vector?`)
}

export function fromIndexAndPositivity(index: number, positive: boolean): Direction{
    if (index == 0){
        if (positive){
            return Direction.right
        } else {
            return Direction.left
        }
    }
    if (index == 1){
        if (positive){
            return Direction.up
        } else {
            return Direction.down
        }
    }
    if (index == 2){
        if (positive){
            return Direction.backward
        } else {
            return Direction.forward
        }
    }
    throw new Error(`Attempted to find a direction for index ${index} and positivity ${positive}`)
}

const opposites = {
    [Direction.up]: Direction.down,
    [Direction.down]: Direction.up,
    [Direction.left]: Direction.right,
    [Direction.right]: Direction.left,
    [Direction.forward]: Direction.backward,
    [Direction.backward]: Direction.forward,
}
export function opposite(d: Direction){
    return opposites[d]
}

export type WorldRay = Array<Direction>
