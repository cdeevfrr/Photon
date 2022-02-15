import { vec3 } from 'gl-matrix'
import { fromIndexAndPositivity, WorldRay } from '../shared/shared'
export { rescaleToLine }

// Experimenting with the direction vector [5,2,1] got machine errors
// already as high as .0000002 due to all the floating adds & divides.
// TODO This was before I prevented situations like 2.5 -> 2.99999 -> 3 when
// calculating the targetFace for a given direction, so maybe it's fixed.
const epsilon = 0.00001

/**
 * Given this vector that uses real numbers, turn it into a spawn line. 
 * 
 * To do this, imagine the vector as a line in a 3d matrix of boxes (or in a grid)
 * Trace along the line to the first box face it hits. That tells you the direction to move first.
 * Continue tracing, looking at each face you hit in order to tell you which direction to move in.
 * 
 * Preserve euclidian distance, not taxicab distance. So, ex, a direction
 * vector of [2.1,2.1,0] might be turned into [r,u,r,u,r,u] since the vector's
 * endpoint is inside the third box from the [0,0] box.
 * 
 * There are edge cases for box edges, box corners, or if the vector ends exactly at a border. 
 * The code is allowed to make whatever choice it wants in those situations, we don't guarantee consistency.
 * 
 * Example
 * 
 * current position: [.1, .1, .1]
 * vector: [2.3, 2.3, 0]
 * result: []
 * 
 * First timestep, we hit [1,1,.1] after moving by the vector [.9, .9, 0]
 * 
 * current position: [1, 1, .1]
 * vector: [1.4, 1.4, 0]
 * result: [r, u]
 * 
 * Now we move by [1, 1, 0]
 * 
 * current position: [2, 2, .1]
 * vector: [0.4, 0.4, 0]
 * result: [r, u, r, u]
 * 
 * Finally, we finish up
 * 
 * current position: [2.4, 2.4, .1]
 * vector: [0, 0, 0]
 * result: [r, u, r, u, r, u]
 * 
 * 
 * Say the input direction vector is []
 * 
 * @param vector 
 * @param position 
 */
function rescaleToLine(vector: vec3, originalPosition: vec3) : WorldRay{
    // TODO optimization: This would probably benefit from memorization, 
    // since we'll be doing the same calculation over and over.
    // Come up with some kind canonical form 
    //   (maybe the elements of position bounded to be in the range [0-1])
    // and then make a cache (MRU? Most frequently used?)

    const result: WorldRay = []
    let travelledDistance = 0;
    const position = vec3.create()
    vec3.copy(position, originalPosition)

    // Timestep loop
    while (travelledDistance < 1 - 10*epsilon){
        // First, decide what scalar of the vector we want to travel this timestep.

        // In this timestep, we want to go the minimum distance needed to hit a face.
        // Examine each face separately.
        const collisionScalars = [0,1,2].map(index => {
            if (Math.abs(vector[index]) < epsilon){ // this prevents division by 0
                return 100
            }

            // We have to add epsilon before truncation because
            // (wlog in the positive case)
            // past calculations may put our position just below the actual
            // whole number for the face.
            const targetFace = vector[index] < 0 ? 
              Math.ceil(position[index] - 1 - epsilon) : 
              Math.floor(position[index] + 1 + epsilon)
            // Note that scalarForThisIndex is always positive (just try both cases)
            // This is how much we'd have to multiply 'vector' by to get to the
            // next face in the 'index' dimension.
            const scalarForThisIndex = (targetFace - position[index]) / vector[index]
            
            return scalarForThisIndex
        })

        // In this timestep, we'll go at most far enough to finish off the whole vector.
        const scalarForThisTimestep = Math.min(Math.min(...collisionScalars), 1 - travelledDistance);


        // Now, actually travel that scalar.
        travelledDistance += scalarForThisTimestep
        const movementForThisTimestep = vec3.create()
        vec3.scale(movementForThisTimestep, vector, scalarForThisTimestep)
        vec3.add(position, position, movementForThisTimestep);
        [0,1,2].forEach(index => {
            // If the scalar for that index is close enough to the scalar we actually used,
            // add that direction to the result. I first tried saying "if you're at a whole number"
            // but your original position might be at a whole number by coincidence.
            // TODO it's possible for us to be really close to both the Y face and the Z face, and then
            // the Z face is picked for this timestep, but we're almost at the Y face. The next timestep
            // might pick Y to finish off, and it feels like (?) it's possible to double-dip in the Y direction
            // because of this. 
            if (collisionScalars[index] - scalarForThisTimestep < epsilon){
                result.push(fromIndexAndPositivity(index, vector[index] >= 0))
            }
        })
    }
    
    return result
}