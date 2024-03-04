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
    draw: ({
        cxt, 
        x, 
        y, 
        width, 
        height,
        drawingFace,
    }:{
        cxt: CanvasRenderingContext2D, 
        x: number, 
        y: number, 
        width: number, 
        height: number,
        drawingFace?: Direction
    }) => void
}

export enum Color{
    blue = '#6060ff',
    green = '#60ff60',
    red = '#ff0000',
    black = '#000000',
    empty = '#888888', 
    none = '',
}

// Copied from 
// https://stackoverflow.com/questions/5560248/programmatically-lighten-or-darken-a-hex-color-or-rgb-and-blend-colors
function shadeColor(color: string, percent: number) {

    var R = parseInt(color.substring(1,3),16);
    var G = parseInt(color.substring(3,5),16);
    var B = parseInt(color.substring(5,7),16);

    R = Math.floor(R * (100 + percent) / 100);
    G = Math.floor(G * (100 + percent) / 100);
    B = Math.floor(B * (100 + percent) / 100);

    R = (R<255)?R:255;  
    G = (G<255)?G:255;  
    B = (B<255)?B:255;  

    var RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
    var GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
    var BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

    return "#"+RR+GG+BB;
}

/**
 * Returns a function that can be used as entity.draw
 * for a solid block of color.
 * @param c 
 */
export function makeDrawFunctionFlatBlock(c: Color){
    return function draw({
        cxt, 
        x, 
        y, 
        width, 
        height,
        drawingFace,
    }:{
        cxt: CanvasRenderingContext2D, 
        x: number, 
        y: number, 
        width: number, 
        height: number,
        drawingFace?: Direction,
    }){
        if (drawingFace === Direction.up || drawingFace === Direction.right){
            cxt.fillStyle = shadeColor(c, 20) // 20% lighter
        } else if (drawingFace === Direction.down || drawingFace === Direction.left){
            cxt.fillStyle = shadeColor(c, -20) // 20% darker
        } else {
            cxt.fillStyle = c
        } 
        cxt.fillRect(x, y, width, height)
    }
}

export interface Block extends Entity{
    blockTypeId: number,
    blockId: number,
}

export type GraphEdge = {
    destination: GraphNode
    inEdge?: Direction
}

// See graphNode for an explanation of what Directions are. 
// It's nonintuitive.
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
