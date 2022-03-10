import { GraphNode } from "../shared/GraphNode"
import { Direction, Block, Color } from "../shared/shared"
import { canvasId, mapId, positionElementId } from "../commonIds"
import { makeRotationMatrix } from "../Render/RotationMatrix"
import { vec3 } from "gl-matrix"
import { gridOfSize } from "../GraphReading/GraphNodeHelpers"
import { PhotonViewport } from "../Render/photonViewport"
import { Position } from "../shared/Position"
import { readGFGLines } from "../GraphReading/ReadGraphFromLines"

export { mainLoop }


// const centerNode: GraphNode = gridOfSize(10)

// const centerBlock: Block = {
//     blockTypeId: 1,
//     blockId: 1,
//     opaque: true,
//     color: Color.blue
// } 
// centerNode.addContents(centerBlock)

// const centerBlockMinusOneZ: Block = {
//     blockTypeId: 1,
//     blockId: 2,
//     opaque: true,
//     color: Color.green
// }
// centerNode.adjacentNodes(Direction.forward)[0].addContents(centerBlockMinusOneZ)

const keyDirections: {[key: string]: vec3} = {
    a: [-1, 0, 0],
    s: [0,0,1],
    d: [1, 0, 0],
    w: [0,0,-1],
    " ": [0, 1, 0],
    "Shift": [0, -1, 0],
}
const depressedKeys = new Set<string>()
const moveSpeed = .02
const yawSpeed = .05
const pitchSpeed = .05

const clearsPerSecond = 1
const emitsPerClear = 10
const photonsPerEmit = 10

async function mainLoop() {

    let mapElement = document.getElementById(mapId)
    while (!mapElement){
        await new Promise(resolve => setTimeout(resolve, 1000))
        mapElement = document.getElementById(mapId)
    }
    const mapData = mapElement.getAttribute("data")

    if (!mapData){
        throw new Error("Didn't get map data from the webpage!")
    }
    
    const bottomLeftForwardMostNode: GraphNode = (await readGFGLines(mapData?.split("\n"))).firstNode
    


    console.log(`Starting at coords ${bottomLeftForwardMostNode.initialCoordinates}`)

    const currentPosition = new Position(
        bottomLeftForwardMostNode
          .adjacentNodes(Direction.backward)[0]
          .adjacentNodes(Direction.right)[0]
          .adjacentNodes(Direction.up)[0]
          ,[0.5, 0.5, 0.5])

    let pitch = 0
    let yaw = 0
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    const positionIndicator = document.getElementById(positionElementId) as HTMLElement

    positionIndicator.innerText = `Current Position: ${currentPosition.node.initialCoordinates}`


    const photonViewport = new PhotonViewport(canvas, {
        photonsHigh: 7, 
        photonsWide: 10, 
        renderDistance: 10, 
        visualDecayTimeout: 1000 / clearsPerSecond / 2
    })

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

    /**
     * This function gets called every n ms
     * and moves the player based on which keys are pressed right now.
     */
    function movePlayer(){
        if (depressedKeys.size >= 1 && depressedKeys.size <= 2){
            // Find the vector for the direction we're moving
            const direction: vec3 = [0,0,0]
            depressedKeys.forEach((key)=>{
                vec3.add(direction, direction, keyDirections[key])
            })
            vec3.normalize(direction, direction)

            const rotationMatrix = makeRotationMatrix(pitch, yaw)
            const moveDirection = vec3.fromValues(direction[0], direction[1], direction[2])
            vec3.transformMat3(moveDirection, moveDirection, rotationMatrix)
            vec3.scale(moveDirection, moveDirection, moveSpeed )

            currentPosition.addVector(moveDirection, (g) => g.isOpaque()) // TODO rotate your pitch and yaw if there was a rotation.
            positionIndicator.innerText = `Current Position: ${currentPosition.node.initialCoordinates}`

            photonViewport.setLastMoveTime()
        }

        /// TODO NEXT
        // I need to make movePlayer actually run periodically
        // I need to test it out.
    }

    function keyDownListener(event: KeyboardEvent){
        if (event.key in keyDirections){
            depressedKeys.add(event.key)
            if (depressedKeys.size == 1){
                startMovePlayerInterval()
            }
            event.stopPropagation()
        }
    }

    function keyUpListener(event: KeyboardEvent){
        if (event.key in keyDirections){
            depressedKeys.delete(event.key)
            event.stopPropagation()
            if(depressedKeys.size == 0){
                stopMovePlayerInterval()
            }
        }
    }

    let photonEmittingInterval: NodeJS.Timer | null = null
    let movePlayerInterval: NodeJS.Timer | null = null
    function startMovePlayerInterval(){
        movePlayerInterval = movePlayerInterval || setInterval(movePlayer, 10)
    }
    function stopMovePlayerInterval(){
        if (movePlayerInterval){
            clearInterval(movePlayerInterval)
            movePlayerInterval = null
        }
    }


    /**
     * This function makes the mouse go away, and lets you hit escape to get it back.
     */
    function pointerLockChangeListener(){
        if (document.pointerLockElement === canvas){
            console.log("Adding listeners")
            canvas.addEventListener('mousemove', mouseMoveListener, true)
            document.addEventListener('keydown', keyDownListener, true)
            document.addEventListener('keyup', keyUpListener, true)


            photonEmittingInterval = photonEmittingInterval || setInterval(emitPhotons, 1000 / (emitsPerClear * clearsPerSecond))
        } else {
            console.log("Removing listeners")
            canvas.removeEventListener('mousemove', mouseMoveListener, true)
            document.removeEventListener('keydown', keyDownListener, true)
            document.removeEventListener('keyup', keyUpListener, true)

            if(photonEmittingInterval){
                clearInterval(photonEmittingInterval)
                photonEmittingInterval = null
            }
            stopMovePlayerInterval()
        }
    }

    // TODO update pointerLock to work for multiple browsers https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API

    document.addEventListener('pointerlockchange',pointerLockChangeListener, false);

    canvas.onclick = () => {
        canvas.requestPointerLock()
    }
}



