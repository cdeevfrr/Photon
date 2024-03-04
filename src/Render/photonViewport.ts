import { vec3 } from 'gl-matrix'
import { Cursor } from '../Entities/Cursor'
import { Photon, PhotonEndListener, PhotonHash } from '../Entities/Photon'
import { Collision } from '../shared/Collision'
import { GraphNode } from '../shared/GraphNode'
import { Position } from '../shared/Position'
import { Color, Direction } from '../shared/shared'
import { makeRotationMatrix } from './RotationMatrix'

export class PhotonViewport implements PhotonEndListener {
    // Imagine a player looking at a wall of different color blocks.
    // The screen will represent an array of such blocks, from 
    // at the top left [-photonsWide / 2, photonsHigh / 2, -renderDistance] in model space, [0,0] on the screen
    // to the bottom right at  [photonsWide / 2, -photonsHigh / 2, -renderDistance] in model space, [photonsWide, photonsHigh] on the screen
    // if the player were at [0,0,0] facing [0,0,-1].
    // (By convention, a player on the ground moves on the x and z planes; y is up.)
    // The "wall of blocks" is just to get you oriented.
    // In reality, we'll send out one photon towards the center of each block from the player.
    // Whatever the photon hits, the correct color is shown on the screen.
    photonsHigh = 5
    photonsWide = 5
    renderDistance = 7

    // This will keep track of the screen x&y positions for all emitted photons.
    // If there's a collision then we'll end up updating the same pixel twice, seems acceptable.
    photonLocations: {[key: PhotonHash]: {x: number, y: number}}= {}

    decayTimeout = 1000
    lastMoveTime = Date.now()

    canvas: HTMLCanvasElement 
    cxt: CanvasRenderingContext2D

    squareLength: number = 0
    squareHeight: number = 0

    photonsTickedByThisViewport: Set<Photon>
    photonTickingInterval: NodeJS.Timer

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
        /**
         * The time until the decay effect stops rendering.
         * The normal decay effect makes squares greyed out
         * if a photon hasn't updated that square for a while.
         */
        visualDecayTimeout?: number
    }){
        this.photonsHigh = photonsHigh || this.photonsHigh 
        this.photonsWide = photonsWide || this.photonsWide  
        this.renderDistance = renderDistance || this.renderDistance
        this.decayTimeout = decayTimeout || this.decayTimeout
        this.photonsTickedByThisViewport = new Set()
        this.photonTickingInterval = setInterval(() => this.tickAllPhotons(), 100)

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

    private isCenterPhoton(photonx: number, photony: number){
        return photonx == Math.ceil(this.photonsWide / 2) 
          && photony ==  Math.ceil(this.photonsHigh / 2)
    }

    // Implement photonEnd listener functions 

    // TODO Remove onExpire and just let photons do an onCollision with 
    // toNode: null. This has to be handled anyway if a node has no out-edge
    // in the direction the photon wants to travel.
    /**
     * 
     * @param entity 
     */
    public onExpire(p: Photon) {
        const {x: photonx, y: photony} = this.photonLocations[p.photonHash()]

        this.photonFinished({
            g: p.position.node, 
            photonx, 
            photony})
        // TODO This check doesn't need to be done for every collision. Pass in a different onCollision instead.
        if (this.isCenterPhoton(photonx, photony)){
            this.updateCursorLocation(null)
        }
        delete this.photonLocations[p.photonHash()]
        this.photonsTickedByThisViewport.delete(p)

    }

    public onCollision (p: Photon, c: Collision){
        const {x: photonx, y: photony} = this.photonLocations[p.photonHash()]

        if (c.toNode == null){
            this.photonLeftGraph(photonx, photony)
        } else {
            this.photonFinished({
                g: c.toNode, 
                photonx, 
                photony, 
                faceOnToNode: c.faceOnToNode,
            })
            this.fadeDistance(p, photonx, photony) // TODO combine with previous call so that we only call cxt once.
            // TODO This check doesn't need to be done for every collision. Pass in a different onCollision instead.
            if (this.isCenterPhoton(photonx, photony)){
                this.updateCursorLocation(c.toNode)
            }
        }
        delete this.photonLocations[p.photonHash()]
        this.photonsTickedByThisViewport.delete(p)

    }

    private emitPhoton(photonx: number, photony: number, pitchDegrees: number, yawDegrees: number, position: Position){
        const rotationMatrix = makeRotationMatrix(pitchDegrees, yawDegrees)
        const defaultLine = this.defaultLines[photony][photonx]
        const ray = vec3.fromValues(defaultLine[0], defaultLine[1], defaultLine[2])
        vec3.transformMat3(ray, ray, rotationMatrix)
    
        const emittedPhoton = new Photon({
            position: position.clone(), 
            direction: ray, 
        })

        emittedPhoton.addEndListener(this)

        this.photonLocations[emittedPhoton.photonHash()] = {x: photonx, y: photony}

        // Photons normally tick themselves, but the viewport has
        // to create so many photons that it's worth it to use a single 
        // interval rather than creating & removing length*width intervals 
        // every tenth of a second. Testing showed that interval creation time
        // was exceeding photon traversal time.
        // 
        // This also has the nice side effect of allowing vision photons
        // to move at a different speed from normal photons, if someone wants.
        // 
        // emittedPhoton.startTicks(100)
        this.photonsTickedByThisViewport.add(emittedPhoton)
    }

    public tickAllPhotons(){
        this.photonsTickedByThisViewport.forEach(p => p.tick())
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

    photonFinished({g, photonx, photony, faceOnToNode}:
        {g: GraphNode, photonx: number, photony: number, faceOnToNode?: Direction}){

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
                height: this.squareHeight,
                drawingFace: faceOnToNode,
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



