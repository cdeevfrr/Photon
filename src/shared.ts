export type GraphNode = {
    nodeType: number
}

export const Direction = {
    forward: [0,0,-1],
    backward: [0,0,1],
    up: [0,1,0],
    down: [0,-1,0],
    left: [-1, 0, 0],
    right: [1, 0, 0],
}