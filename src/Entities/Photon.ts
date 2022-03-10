import { vec3 } from "gl-matrix";
import { Collision } from "../shared/Collision";
import { Position } from "../shared/Position";
import { Color } from "../shared/shared";

/**
 * How many euclidian units per second a photon can move.
 */
const photonSpeed = 3
/**
 * How many euclidian units a photon can move before expriring
 * Photons expire on equality (default scenario) else do one extra tick (scenario if there's rounding issues)
 * EX if photonSpeed=2 defaultMaxDistance=4 the photon will do 2 ticks, traveling 4.
 *    if photonSpeed=2 defaultMaxDistance=2.1 the photon will do 2 ticks, traveling 4.
 * 
 */
const defaultMaxDistance = 9


/**
 * Photos travel away from a source entity (usually the player) in a straight WorldLine, for a fixed distance. 
 * 
 * When they collide with something, they call their 'oncollision' callback.
 */
export class Photon {
    position: Position
    TickVector: vec3
    onCollision: (collision: Collision, p: Photon)=> void
    onExpire: (p: Photon) => void
    distanceTravelled: number
    maxDistance: number
    interval?: NodeJS.Timer

    opaque = false
    color = Color.none;
    private shouldTick = true;

    /**
     * 
     * @param p 
     * @param direction 
     * @param oncollision What to do when this photon hits node g from global discrete direction d
     * @param onExpire What to do if this photon has travelled max distance without hitting anything.
     */
    constructor({
        position, direction, onCollision, onExpire, maxDistance = defaultMaxDistance
    }:{position: Position, direction: vec3, onCollision: (collision: Collision, p: Photon)=> void, onExpire: (p: Photon) => void , maxDistance?: number}){
        this.position = position
        this.onCollision = onCollision
        this.onExpire = onExpire
        this.distanceTravelled = 0
        this.maxDistance = maxDistance

        this.TickVector = this.rescaleToPhotonSpeed(direction)
    }

    public startTicks(ms: number){
        /**
        * It's best if photons can get all the way to the end of their path in .5 seconds or less.
        * That means maxDistance / speed * ticksPerSec should be less than .5
        */
        if (this.maxDistance / photonSpeed * ms / 1000 > .5){
            throw new Error("Trying to make a photon that will take more than .5 seconds to traverse")
        }

        this.shouldTick = true;
        this.interval = setInterval(() => this.tick(), ms)
    }

    stopTicks(){
        this.shouldTick = false
        if (this.interval){
            clearInterval(this.interval)
        }
    }

    /**
     * Move the photon forward 'photonSpeed', reporting any collisions if they happen.
     * 
     * If total distance is now maxDistance or more, expire this photon. 
     * @returns 
     */
    public async tick(){
        if (!this.shouldTick){
            // This way, if the intervals queued up more ticks, but this photon has expired, it won't do anything.
            // Should only matter if there's computational strain.
            return;
        }

        const {lastAdded, remainingToAdd, collision} = 
        this.position.addVector(
            this.TickVector, 
            node => (!node) || node.isOpaque()
        )


        if (collision){
            // If collision is not null, neither will remainingToAdd be.
            this.distanceTravelled += vec3.distance(remainingToAdd!, this.TickVector)
            this.stopTicks()
            this.onCollision(collision, this)

            // TODO it's possible that you could be way behind, and the 
            // interval stacks 5 calls to tick() onto the event loop, 
            // but that first call should have cleared things. Figure out
            // how to prevent that bug.
           
        } else {
            this.distanceTravelled += photonSpeed
            this.TickVector = this.rescaleToPhotonSpeed(lastAdded!)
            if (this.distanceTravelled >= this.maxDistance){
                this.stopTicks()
                this.onExpire(this)
            }
        }
    }

    private rescaleToPhotonSpeed(vector: vec3): vec3{
        const result = vec3.clone(vector)
        vec3.normalize(result, result)
        vec3.scale(result, result, photonSpeed)
        return result
    }
}