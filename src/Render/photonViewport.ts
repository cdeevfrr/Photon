import { vec3 } from 'gl-matrix'
import { Photon } from '../Entities/Photon'
import { Collision } from '../shared/Collision'
import { Position } from '../shared/Position'
import { Color } from '../shared/shared'
import { makeRotationMatrix } from './RotationMatrix'




export class PhotonViewport {
    // The screen will represent an array of nodes, from 
    // at the top left [-photonsWide / 2, photonsHigh / 2, -renderDistance] in model space, [0,0] on the screen
    // to the bottom right at  [photonsWide / 2, -photonsHigh / 2, -renderDistance] in model space, [photonsWide, photonsHigh] on the screen
    // if the player were at [0,0,0] facing [0,0,-1].
    photonsHigh = 5
    photonsWide = 5
    renderDistance = 12

    decayTimeout = 1000
    lastMoveTime = Date.now()

    canvas: HTMLCanvasElement 
    cxt: CanvasRenderingContext2D

    squareLength: number = 0
    squareHeight: number = 0

    // This type could probably be Array<Array<Vector>> instead.
    // Screen space:
    // [ 
    //   [[0,0], [1,0], [2,0]]
    //   [[0,1], [1,1], [2,1]]
    //   [[0,2], [1,2], [2,2]]
    // ]
    // Model space:
    //   [[-1, 1,d], [0, 1,d], [1, 1,d]]
    //   [[-1, 0,d], [0, 0,d], [1, 0,d]]
    //   [[-1,-1,d], [0,-1,d], [1,-1,d]]
    defaultLines: Array<Array<Array<number>>> = []

    // A stack of of all (x,y) pairs that we pop off so that we hit every photon.
    photonOrdering: Array<{x: number, y: number}> = []

    decayTimers: {[key: number]: NodeJS.Timer} = {}
    
    constructor(canvas: HTMLCanvasElement, {
        photonsHigh, 
        photonsWide, 
        renderDistance, 
        decayTimeout,
    }:{
        photonsHigh?: number, 
        photonsWide?: number, 
        renderDistance?: number,
        decayTimeout?: number
    }){
        this.photonsHigh = photonsHigh || this.photonsHigh 
        this.photonsWide = photonsWide || this.photonsWide  
        this.renderDistance = renderDistance || this.renderDistance
        this.decayTimeout = decayTimeout || this.decayTimeout

        this.constructDefaultLines()

        this.canvas = canvas
        this.cxt = canvas.getContext("2d")!

        this.resizeCanvas()
        canvas.addEventListener("resize", this.resizeCanvas)
    }

    public resizeCanvas(){
        const canvasLength = this.canvas.getBoundingClientRect().width
        const canvasHeight = this.canvas.getBoundingClientRect().height

        this.squareLength = canvasLength / this.photonsWide
        this.squareHeight = canvasHeight / this.photonsHigh
    }

    public setLastMoveTime(){
        this.lastMoveTime = Date.now()
    }

    public fadeOutSquare(photonx: number, photony: number){
        this.cxt.globalAlpha = .3
        this.cxt.fillStyle = Color.black
        this.cxt.fillRect(
            photonx * this.squareLength,
            photony * this.squareHeight,
            this.squareLength,
            this.squareHeight
            )
        this.cxt.globalAlpha = 1
    }

    private constructDefaultLines(){
        this.defaultLines = []
        for(let y = 0; y < this.photonsHigh; y ++){
            const row = []
            for (let x = 0; x < this.photonsWide; x ++){
                row.push([
                    Math.floor(-this.photonsWide / 2) + x, 
                    Math.floor(this.photonsHigh / 2) - y, 
                    -this.renderDistance
                ])
            }
            this.defaultLines.push(row)
        }
    }

    private emitPhoton(photonx: number, photony: number, pitchDegrees: number, yawDegrees: number, position: Position){
        const rotationMatrix = makeRotationMatrix(pitchDegrees, yawDegrees)
        const defaultLine = this.defaultLines[photony][photonx]
        const ray = vec3.fromValues(defaultLine[0], defaultLine[1], defaultLine[2])
        vec3.transformMat3(ray, ray, rotationMatrix)

        const viewport = this // avoiding binding issues in the onCollision callbacks.
    
        const emittedPhoton = new Photon({
            position: position.clone(), 
            direction: ray, 
            onCollision: (c: Collision) => {
                if (c.toNode.getContents().length < 1){
                    throw new Error(`I got a collission with an empty node: ${c.toNode.initialCoordinates}`)
                }
                viewport.photonFinished(c.toNode.getContents()[0].color, photonx, photony)
            }, 
            onExpire: (p: Photon) => {
                viewport.photonFinished(Color.empty, photonx, photony)
            }, 
        })
        emittedPhoton.startTicks(100)
    }

    emitNextPhoton(pitchDegrees: number, yawDegrees: number, position: Position){
        if (this.photonOrdering.length == 0){
            for (let x = 0; x < this.photonsWide; x ++){
                for(let y = 0; y < this.photonsHigh; y ++){
                    this.photonOrdering.push({x,y})
                }
            }
            shuffle(this.photonOrdering)
        }
        const indexes = this.photonOrdering.pop() 
        this.emitPhoton(
            indexes!.x,
            indexes!.y,
            pitchDegrees,
            yawDegrees,
            position
        )

    }

    emitRandomPhoton(pitchDegrees: number, yawDegrees: number, position: Position){
        this.emitPhoton(
            Math.floor(Math.random() * this.photonsWide),
            Math.floor(Math.random() * this.photonsHigh),
            pitchDegrees,
            yawDegrees,
            position
        )
    } 

    photonFinished(c: Color, photonx: number, photony: number){
        const photonKey = photonx + this.photonsWide * photony
        const existingTimer = this.decayTimers[photonKey]
        if(existingTimer){
            clearInterval(existingTimer)
        }

        this.cxt.fillStyle = c
        this.cxt.fillRect(
            photonx * this.squareLength,
            photony * this.squareHeight, 
            this.squareLength, 
            this.squareHeight
        )

        this.decayTimers[photonKey] = setTimeout(() => {
            // If the player has been sitting still for 2*delayTimeout, stop fading stuff.
            if (Date.now() - this.lastMoveTime < 2 * this.decayTimeout){
                this.fadeOutSquare(photonx, photony)
            }
        }, this.decayTimeout)
    }
}

//https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(a: Array<any>){//array,placeholder,placeholder,placeholder
    let count = a.length
    while(count){
        const b = Math.random()* (count --)|0
        const d=a[count]
        a[count]=a[b]
        a[b]=d
    }
}



