import { vec3 } from "gl-matrix";
import { Collision } from "./Collision";
import { GraphNode } from "./GraphNode";
import { Direction, fromIndexAndPositivity, toIndexAndPositivity, opposite } from "./shared";

const epsilon = 2 ** -50

/**
 * A position is a utility class that's a combination of a graphNode and a fractional position within that graphNode.
 * 
 * The fractionalPosition should NOT be used for physics purposes internal to the node - all entities in a node are in the same place. The fractional position is just a counter to tell how long it takes something to actually leave a node in a given direction.
 * 
 * It's useful for things like knowing where a player is or a photon is.
 * 
 * For interacting with a position, the standard interface is:
 *  - give a position a vector saying where you want it to move to
 *  - It will move as far as it can along that vector, do 1 discrete move (if necessary) and then return the remaining part of the vector (possibly rotated) that needs to be moved.
 * 
 * So, for example, it's correct to do
 *   position.addVector(position.addVector([4,4,4]))    (WITH NULL CHECKS!!!)
 *   but it's usually not correct to do position.addVector([1,1,1]); position.addVector([3,3,3])  because the first move might have rotated things.
 * 
 * Because of this interface, the position needs to know if it ran into a node that stops further movement. That determination is passed in as a function, haltsMovement, of a single node. This is important since different things (eg players vs photons) might be able to move through different nodes.
 * 
 * 
 * 
 * 
 * 
 * Better interface:
 * 
 * move(vec3, haltsMovement(node)) => {stepsTaken, unitVectorInNewDirection} 
 * 
 */
export class Position {
    position: GraphNode
    fractionalPosition: vec3

    constructor(position: GraphNode, fractionalPosition: vec3){
        this.position = position
        this.fractionalPosition = fractionalPosition
    }

    public clone(){
        return new Position(this.position, vec3.clone(this.fractionalPosition))
    }

    /**
     * Add as much of this vector as you can to the current position.
     * Stop just before entering the first node that haltsMovement().
     * 
     * Return either 
     *    1) the last portion of the vector that was added (most common)
     *    or 2) how much of the vector was left to add and the collision.
     * 
     * The position will now have the correct base node and fractionalPosition.
     * @param vector 
     * @param haltsMovement 
     * @returns 
     */
    public addVector(vector: vec3, haltsMovement: (g: GraphNode) => boolean ){
        let {move, remainingVectorToAdd} = this.addVectorInternal(vector)
        while (move != null){
            // Attempt the move, return collision if needed.
            const moveAttemptResults = this.moveNode(move, haltsMovement, remainingVectorToAdd!) // if move != null, remainingVectorToAdd isn't either.

            if (isCollision(moveAttemptResults)){
                return {
                    lastAdded: null, 
                    remainingToAdd: remainingVectorToAdd,
                    collision: moveAttemptResults
                }
            }
            // Travel along the vector within this node
            const update = this.addVectorInternal(moveAttemptResults.rotatedVector)
            // update move & remaining vector to add so the while loop progresses an iteration.
            move = update.move
            // If move is null, we'll leave 'remaining vector to add' as whatever it was last time.
            if (move != null){
                remainingVectorToAdd = update.remainingVectorToAdd
            }
        }
        // remainingVectorToAdd will be the last vector added, or else null if 
        //    we finished without ever entering the while loop. 

        return {
            lastAdded: remainingVectorToAdd || vector, 
            remainingToAdd: null,
            collision: null
        }
    }


    /**
     * Add the vector to this position. 
     * If you need to move to another node, rather than completely adding the whole vector,
     * get as close as you can & return how much of `vector` still needs to be moved.
     * 
     * The caller should call `moveNode(direction)` and then call `addVector(remainingVector)` to continue.
     * Aside from dealing with collisions, this is also because a move to a new node might change the 
     * orientation of the vector, and it's up to another class to keep track of that orientation.
     * @param vector 
     * @returns 
     */
    private addVectorInternal(vector: vec3){
        let minScalar = 1 // if we don't find a better scalar, use up the rest of the vector.
        let minIndex = -1
        const faceScalars = [0,1,2].forEach(index => {
            // this check prevents division by 0, and happens if something is moving almost in line with one of the cardinal directions.
            if (Math.abs(vector[index]) < epsilon){ 
                return
            }
            const targetFace = vector[index] < 0 ? -1 : 1
            // What would we have to multiply vector by to hit the face in the "index" direction?
            // Note that scalarForThisIndex is always positive (just try both cases)
            const scalarForThisIndex = (targetFace - this.fractionalPosition[index]) / vector[index]
            if (scalarForThisIndex < minScalar){
                minScalar = scalarForThisIndex
                minIndex = index
            }
        })

        const allowedMovement = vec3.create()
        vec3.scale(allowedMovement, vector, minScalar)
        vec3.add(this.fractionalPosition, this.fractionalPosition, allowedMovement);
        if (minIndex == -1){
            return {
                // TODO don't use nulls for signalling intent.
                move: null,
                remainingVectorToAdd: null
            }
        }

        const remainingVectorToAdd = vec3.clone(vector)
        vec3.subtract(remainingVectorToAdd, vector, allowedMovement )

        return {
            move: fromIndexAndPositivity(minIndex, vector[minIndex] >= 0),
            remainingVectorToAdd,
        }
    }

    /**
     * Move your current graphNode to one of the ones in direction d.
     * 
     * Vector v is passed along so that, if there's an orientation change
     * associated with this move, we'll rotate v for you. This is intended to
     * be used for the output of an `addvector` call. 
     * 
     * If the move couldn't be made because of a collission, return the collision details. otherwise return the rotated vector.
     * @param d 
     * @param haltsMovement 
     * @param v 
     * @returns 
     */
    private moveNode(d: Direction, haltsMovement: (g: GraphNode) => boolean, v: vec3) {
        const outEdge = this.position.randomOutEdge(d)
        if (haltsMovement(outEdge.destination)){
            const collision: Collision = {
                fromNode: this.position,
                toNode: outEdge.destination,
                faceOnFromNode: d,
                faceOnToNode: outEdge.inEdge
            }
            return collision
        }

        const {index, positive} = toIndexAndPositivity(d)

        // update fractionalPosition _before_ doing any possible rotations.
        // EX if we exit via the "up" direction and enter via the "right" direction,
        // we'll want to pretend we exited up & endered down, then rotate.
        this.fractionalPosition[index] = positive ? -1 : 1
        let returnVector = v
        if (outEdge.inEdge && outEdge.inEdge != opposite(d)){
            this.fractionalPosition = rotate(d, outEdge.inEdge, this.fractionalPosition)
            returnVector = rotate(d, outEdge.inEdge, v)
        }
        // In the simple case, just move to that node & reset to the
        // correct face for fractionalPosition.
        this.position = outEdge.destination
        
        return {rotatedVector: returnVector}
    }

}

function isCollision(x: Collision | {rotatedVector: vec3}): x is Collision{
    return "fromNode" in x
}


/**
 * Assuming we just left a node in direction outDirection
 * and entered a node in direction inDirection
 * rotate a vector appropriately.
 * 
 * This helper function accomplishes the rotation without any use
 * of matricies or floating point math, just swaps and negation.
 * @param outDirection 
 * @param inDirection 
 * @param toRotate 
 * @returns 
 */
export function rotate(outDirection: Direction, inDirection: Direction, toRotate: vec3): vec3{
   const result = vec3.clone(toRotate)
   if (outDirection == opposite(inDirection)){
       return result
   }
   const {index, positive} = toIndexAndPositivity(outDirection)
   if (outDirection == inDirection){
       result[index] = -result[index]
       return result
   }
   const {index: index2, positive: positive2} = toIndexAndPositivity(inDirection)

   // swap index & index2.
   const holder = result[index]
   result[index] = result[index2]
   result[index2] = holder

   const indexToNegate = positive == positive2 ? index2 : index
   result[indexToNegate] = -result[indexToNegate]
   return result
}