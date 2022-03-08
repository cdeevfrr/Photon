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
    
    constructor(canvas: HTMLCanvasElement, {
        photonsHigh, 
        photonsWide, 
        renderDistance
    }:{
        photonsHigh?: number, 
        photonsWide?: number, 
        renderDistance?: number
    }){
        this.photonsHigh = photonsHigh || this.photonsHigh 
        this.photonsWide = photonsWide || this.photonsWide  
        this.renderDistance = renderDistance || this.renderDistance

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

    public fadeOut(){
        const canvasLength = this.canvas.getBoundingClientRect().width
        const canvasHeight = this.canvas.getBoundingClientRect().height

        this.cxt.globalAlpha = .2
        this.cxt.fillStyle = Color.black
        this.cxt.fillRect(0,0,canvasLength, canvasHeight)
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

    emitRandomPhoton(pitchDegrees: number, yawDegrees: number, position: Position){
        const photonx = Math.floor(Math.random() * this.photonsWide)
        const photony = Math.floor(Math.random() * this.photonsHigh)
    
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
                viewport.cxt.fillStyle = c.toNode.getContents()[0].color
                viewport.cxt.fillRect(photonx * viewport.squareLength,photony * viewport.squareHeight, viewport.squareLength, viewport.squareHeight)
            }, 
            onExpire: (p: Photon) => {
                viewport.cxt.fillStyle = Color.empty
                viewport.cxt.fillRect(photonx * viewport.squareLength,photony * viewport.squareHeight, viewport.squareLength, viewport.squareHeight)
            }, 
        })
        emittedPhoton.startTicks(100)
    }  
}



