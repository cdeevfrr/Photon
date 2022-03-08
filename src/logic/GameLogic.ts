import { GraphNode } from "../shared/GraphNode"
import { Direction, Block, Color } from "../shared/shared"
import { canvasId, positionElementId } from "../commonIds"
import { makeRotationMatrix } from "../Render/RotationMatrix"
import { vec3 } from "gl-matrix"
import { gridOfSize } from "../shared/GraphNodeHelpers"
import { PhotonViewport } from "../Render/photonViewport"
import { Position } from "../shared/Position"

export { mainLoop }


const centerNode: GraphNode = gridOfSize(10)

const centerBlock: Block = {
    blockTypeId: 1,
    blockId: 1,
    opaque: true,
    color: Color.blue
} 
centerNode.addContents(centerBlock)

const centerBlockMinusOneZ: Block = {
    blockTypeId: 1,
    blockId: 2,
    opaque: true,
    color: Color.green
}
centerNode.adjacentNodes(Direction.forward)[0].addContents(centerBlockMinusOneZ)

const keyDirections: {[key: string]: Array<number>} = {
    a: [-1, 0, 0],
    s: [0,0,1],
    d: [1, 0, 0],
    w: [0,0,-1],
    " ": [0, 1, 0],
    "Shift": [0, -1, 0],
}
const moveSpeed = .5
const yawSpeed = .05
const pitchSpeed = .05

const clearsPerSecond = 1
const emitsPerClear = 10
const photonsPerEmit = 10

function mainLoop() {
    const currentPosition = new Position(
        centerNode.adjacentNodes(Direction.backward)[0].adjacentNodes(Direction.backward)[0],
        vec3.create())

    let pitch = 0
    let yaw = 0
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    const positionIndicator = document.getElementById(positionElementId) as HTMLElement

    positionIndicator.innerText = `Current Position: ${currentPosition.position.initialCoordinates}`


    const photonViewport = new PhotonViewport(canvas, {photonsHigh: 7, photonsWide: 10, renderDistance: 10, decayTimeout: 1000 / clearsPerSecond / 2})

    function emitPhotons(){
        for (let i = 0; i < photonsPerEmit; i ++){
            photonViewport.emitNextPhoton(pitch, yaw, currentPosition)
        }
    }

    function mouseMoveListener(event: MouseEvent){
        yaw += event.movementX * yawSpeed 
        pitch += event.movementY * pitchSpeed 
        if (pitch > 89) {pitch = 89}
        if (pitch < -89) {pitch = -89}
        // These next two aren't necessary, just convenient for debugging.
        if (yaw > 181) {yaw -= 360}
        if (yaw < -181) {yaw += 360}
        photonViewport.setLastMoveTime()
        event.stopPropagation()
    }

    function keyPressListener(event: KeyboardEvent){
        console.log(`Got an event ${event.key}`)
        // Find the vector for the direction we're moving
        const direction = keyDirections[event.key]
        if (direction === undefined){
            return
        }

        const rotationMatrix = makeRotationMatrix(pitch, yaw)
        const moveDirection = vec3.fromValues(direction[0], direction[1], direction[2])
        vec3.transformMat3(moveDirection, moveDirection, rotationMatrix)
        vec3.scale(moveDirection, moveDirection, moveSpeed )

        // TODO while the key is pressed, repeat the following: 

        // Add that vector to the current FractionalPosition vector

        currentPosition.addVector(moveDirection, (g) => g.isOpaque()) // TODO rotate your pitch and yaw if there was a rotation.
        positionIndicator.innerText = `Current Position: ${currentPosition.position.initialCoordinates}`

        photonViewport.setLastMoveTime()
        event.stopPropagation()
    }

    let photonEmittingInterval: NodeJS.Timer | null = null

    /**
     * This function makes the mouse go away, and lets you hit escape to get it back.
     */
    function pointerLockChangeListener(){
        if (document.pointerLockElement === canvas){
            console.log("Adding listeners")
            canvas.addEventListener('mousemove', mouseMoveListener, true)
            document.addEventListener('keydown', keyPressListener, true)

            photonEmittingInterval = photonEmittingInterval || setInterval(emitPhotons, 1000 / (emitsPerClear * clearsPerSecond))
        } else {
            console.log("Removing listeners")
            canvas.removeEventListener('mousemove', mouseMoveListener, true)
            document.removeEventListener('keydown', keyPressListener, true)
            if(photonEmittingInterval){
                clearInterval(photonEmittingInterval)
                photonEmittingInterval = null
            }
        }
    }

    // TODO update pointerLock to work for multiple browsers https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API

    document.addEventListener('pointerlockchange',pointerLockChangeListener, false);

    canvas.onclick = () => {
        canvas.requestPointerLock()
    }
}



