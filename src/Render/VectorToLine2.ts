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
function rescaleToLine(vector: vec3, position: vec3) : WorldRay{
    // TODO optimization: This would probably benefit from memorization, 
    // since we'll be doing the same calculation over and over.
    // Come up with some kind canonical form 
    //   (maybe the elements of position bounded to be in the range [0-1])
    // and then make a cache (MRU? Most frequently used?)

    const result: WorldRay = []
    let travelledDistance = 0;

    // Timestep loop
    while (travelledDistance < 1 - 10*epsilon){
        // First, decide what scalar of the vector we want to travel this timestep.

        
        // In this timestep, we'll go at most far enough to finish off the whole vector.
        // We can think of this as a 'collision' not with a face, but with the end of the vector.
        let minScalarToCollision = 1 - travelledDistance;

        // In this timestep, we want to go the minimum distance needed to hit a face.
        // Examine each face separately.
        [0,1,2].forEach(index => {
            if (vector[index] == 0){
                return
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
            
            minScalarToCollision = Math.min(scalarForThisIndex, minScalarToCollision)
        })

        // Now, actually travel that scalar.
        travelledDistance += minScalarToCollision
        const movementForThisTimestep = vec3.create()
        vec3.scale(movementForThisTimestep, vector, minScalarToCollision)
        vec3.add(position, position, movementForThisTimestep);
        [0,1,2].forEach(index => {
            // If we're currently on (or nearly on) a face
            if (Math.abs(Math.round(position[index]) - position[index]) < epsilon){
                result.push(fromIndexAndPositivity(index, vector[index] >= 0))
            }
        })
    }
    
    return result
}