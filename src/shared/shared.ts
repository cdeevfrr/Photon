import {vec3} from 'gl-matrix'
import { GraphNode } from './GraphNode'

/**
 * Unline minecraft entities, in this game blocks and moving things are both 'stuff that can go inside nodes'. They're both entities.
 * 
 * If there are some performance optimizations minecraft made based on the distinction, we'll just let entities declare themselves to be subject to those same optimizations 
 *   (however, I suspect that those optimizations were based on linear algebra and won't apply here)
 */
export type Entity = {
    opaque: boolean,
    color: Color,
}

export enum Color{
    blue = '#6060ff',
    green = '#60ff60',
    red = '#ff0000',
    black = '#000000',
    empty = '#888888', 
    none = '',
}

export interface Block extends Entity{
    blockTypeId: number,
    blockId: number,
}

export type GraphEdge = {
    destination: GraphNode
    inEdge?: Direction
}

export enum Direction {
    forward = 'f',
    backward = 'b',
    up = 'u',
    down = 'd',
    left = 'l' ,
    right = 'r',
}

const indexAndPositivity = {
    [Direction.forward]: {index: 2, positive: false}, // forward is the negative Z direction
    [Direction.backward]: {index: 2, positive: true},
    [Direction.up]: {index: 1, positive: true},
    [Direction.down]: {index: 1, positive: false},
    [Direction.left]: {index: 0, positive: false},
    [Direction.right]: {index: 0, positive: true},
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

export function toIndexAndPositivity(d: Direction){
    return indexAndPositivity[d]
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

export function randomChoice(a: Array<any>){
    return a[Math.floor(Math.random()*a.length)]
}
