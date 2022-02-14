import { drawScene } from "../Render/viewport"
import { GraphNode } from "../shared/GraphNode"
import { Direction, fromVector } from "../shared/shared"
import { canvasId } from "../commonIds"
import { makeRotationMatrix } from "../Render/RotationMatrix"
import { vec3 } from "gl-matrix"
import { gridOfSize } from "../shared/GraphNodeHelpers"

export { mainLoop }


const centerNode: GraphNode = gridOfSize(10)
centerNode.nodeContents.nodeType = 1
centerNode.opaque = true

centerNode.adjacentNodes(Direction.forward)[0].nodeContents.nodeType = 1

const keyDirections: {[key: string]: Array<number>} = {
    a: [-1, 0, 0],
    s: [0,0,1],
    d: [1, 0, 0],
    w: [0,0,-1],
}
const moveSpeed = 1
const yawSpeed = .05
const pitchSpeed = .05

function mainLoop() {
    let currentPosition = centerNode.adjacentNodes(Direction.backward)[0].adjacentNodes(Direction.backward)[0]
    const currentFractionalPosition = vec3.create()

    let pitch = 0
    let yaw = 0
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement

    drawScene(pitch, yaw, currentPosition, canvas)

    function mouseMoveListener(event: MouseEvent){
        yaw += event.movementX * yawSpeed 
        pitch += event.movementY * pitchSpeed 
        if (pitch > 89) {pitch = 89}
        if (pitch < -89) {pitch = -89}
        // These next two aren't necessary, just convenient for debugging.
        if (yaw > 181) {yaw -= 360}
        if (yaw < -181) {yaw += 360}
        drawScene(pitch, yaw, currentPosition, canvas)
        event.stopPropagation()
    }

    function movePlayer(direction: Array<number>){
        currentPosition = currentPosition.adjacentNodes(fromVector(direction))[0]
        drawScene(pitch, yaw, currentPosition, canvas)
    }

    function keyPressListener(event: KeyboardEvent){
        console.log(`Got an event ${event.key}`)
        // Find the vector for the direction we're moving
        const direction = keyDirections[event.key]
        const rotationMatrix = makeRotationMatrix(pitch, yaw)
        const moveDirection = vec3.fromValues(direction[0], direction[1], direction[2])
        vec3.transformMat3(moveDirection, moveDirection, rotationMatrix)
        vec3.scale(moveDirection, moveDirection, moveSpeed )

        // TODO while the key is pressed, repeat the following: 

        // Add that vector to the current FractionalPosition vector
        vec3.add(currentFractionalPosition, currentFractionalPosition, moveDirection)
        console.log(`CurrentFractionalPosition: ${currentFractionalPosition}`)

        // If the fractionalPosition vector has any part greater than 1, move in that direction.
        for(const index of [2, 0, 1]){
            const fractionalAmount = currentFractionalPosition[index]
            if (Math.abs(fractionalAmount) >= 1){
                const direction = [0,0,0]
                direction[index] = fractionalAmount > 0? 1 : -1
                movePlayer(direction)
                currentFractionalPosition[index] -= direction[index]
                console.log(`Moved the player to ${currentPosition.nodeContents.extraData}. Fractional position: ${currentFractionalPosition}`)
            }
        }
    }

    function pointerLockChangeListener(){
        if (document.pointerLockElement === canvas){
            canvas.addEventListener('mousemove', mouseMoveListener, true)
            document.addEventListener('keydown', keyPressListener, true)
        } else {
            console.log("Removing listeners")
            canvas.removeEventListener('mousemove', mouseMoveListener, true)
            document.removeEventListener('keydown', keyPressListener, true)
        }
    }

    // TODO update pointerLock to work for multiple browsers https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API

    document.addEventListener('pointerlockchange',pointerLockChangeListener, false);

    canvas.onclick = () => {
        canvas.requestPointerLock()
    }
}



