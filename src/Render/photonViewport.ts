import { vec3 } from 'gl-matrix'
import { Cursor } from '../Entities/Cursor'
import { Photon } from '../Entities/Photon'
import { Collision } from '../shared/Collision'
import { GraphNode } from '../shared/GraphNode'
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
    renderDistance = 7

    decayTimeout = 1000
    lastMoveTime = Date.now()

    canvas: HTMLCanvasElement 
    cxt: CanvasRenderingContext2D

    squareLength: number = 0
    squareHeight: number = 0

    cursor: Cursor

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
        visualDecayTimeout: decayTimeout,
    }:{
        photonsHigh?: number, 
        photonsWide?: number, 
        renderDistance?: number,
        visualDecayTimeout?: number
    }){
        this.photonsHigh = photonsHigh || this.photonsHigh 
        this.photonsWide = photonsWide || this.photonsWide  
        this.renderDistance = renderDistance || this.renderDistance
        this.decayTimeout = decayTimeout || this.decayTimeout

        this.cursor = new Cursor()

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

    public fadeDistance(p: Photon, photonx: number, photony: number){
        this.cxt.globalAlpha = p.distanceTravelled / p.maxDistance
        this.cxt.fillStyle = Color.empty
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

    public updateCursorLocation(node: GraphNode | null){
        this.cursor.moveTo(node)
    }

    private emitPhoton(photonx: number, photony: number, pitchDegrees: number, yawDegrees: number, position: Position){
        const rotationMatrix = makeRotationMatrix(pitchDegrees, yawDegrees)
        const defaultLine = this.defaultLines[photony][photonx]
        const ray = vec3.fromValues(defaultLine[0], defaultLine[1], defaultLine[2])
        vec3.transformMat3(ray, ray, rotationMatrix)

        const isCenterPhoton = 
          photonx == Math.ceil(this.photonsWide / 2) 
          && photony ==  Math.ceil(this.photonsHigh / 2)

        const viewport = this // avoiding binding issues in the onCollision callbacks.
    
        const emittedPhoton = new Photon({
            position: position.clone(), 
            direction: ray, 
            onCollision: (c: Collision, p: Photon) => {
                if (c.toNode == null){
                    viewport.photonLeftGraph(photonx, photony)
                } else {
                    viewport.photonFinished(c.toNode, photonx, photony)
                    viewport.fadeDistance(p, photonx, photony) // TODO combine with previous call so that we only call cxt once.
                    // TODO This check doesn't need to be done for every collision. Pass in a different onCollision instead.
                    if (isCenterPhoton){
                        viewport.updateCursorLocation(c.toNode)
                    }
                }
            }, 
            onExpire: (p: Photon) => {
                viewport.photonFinished(p.position.node, photonx, photony)
                // TODO This check doesn't need to be done for every collision. Pass in a different onCollision instead.
                if (isCenterPhoton){
                    viewport.updateCursorLocation(null)
                }
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

    photonLeftGraph(photonx: number, photony: number){
        this.cxt.fillStyle = Color.black
        this.cxt.fillRect(
            photonx * this.squareLength,
            photony * this.squareHeight, 
            this.squareLength, 
            this.squareHeight
        )
    }

    photonFinished(g: GraphNode, photonx: number, photony: number){
        const photonKey = photonx + this.photonsWide * photony
        const existingTimer = this.decayTimers[photonKey]
        if(existingTimer){
            clearInterval(existingTimer)
        }

        // BEGIN this should be abstracted into a function
        for (const entity of g.getContents()){
            entity.draw({
                cxt: this.cxt,
                x: photonx * this.squareLength,
                y: photony * this.squareHeight, 
                width: this.squareLength, 
                height: this.squareHeight
            })
        }
        if (g.getContents().length == 0){
            this.cxt.fillStyle = Color.empty
            this.cxt.fillRect(
                photonx * this.squareLength,
                photony * this.squareHeight, 
                this.squareLength, 
                this.squareHeight
            )
        }
        

        this.cxt.fillStyle = Color.black
        this.cxt.fillText("" + g.initialCoordinates,photonx * this.squareLength,
        photony * this.squareHeight + 20)
        // END this should be abstracted into a function

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



