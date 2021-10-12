import { vec3 } from 'gl-matrix'
import { fromVector, WorldRay } from '../shared/shared'
export { rescaleToLine }

/**
 * Given this vector that uses real numbers, rescale it to
 * a Spawn line (an ordered list of directions) where the
 * number of directions is scale.
 * 
 * This can seriously be simplified using vec3.floor & vec3.round.
 * 
 * @param vector 
 * @param scale 
 */
 function rescaleToLine(vector: vec3, scale: number) : WorldRay{

    // rescale the vector so that it will have scale
    // total moves in it.
    const workingVector = vec3.clone(vector)
    const sum = (workingVector as number[]).reduce(
        (x, y) => Math.abs(x) + Math.abs(y), 0)
    vec3.scale(workingVector, workingVector, scale / sum)

    // Round each component individually.
    vec3.round(workingVector, workingVector)

    // Rounding may give too much or to little to each component, 
    //   up to 1.5 (.5 too much for each component)
    //   but remember, `sum(vector)` is within epsilon of `scale`.
    // If the positive sum is too much after rounding 
    //   (eg rescaling gives us [1.61, 2.62, 1.63] -> [2, 3, 2])
    //   we can adjust it in the next line.
    // TODO

    
    // make lines that prioritize Z, then X, then Y
    // That way we prioritize forward, left, then up.
    const result: WorldRay = []

    for (const index of [2, 0, 1]){
        const sign = workingVector[index] > 0? 1 : -1
        // this is creating a 'direction' of size 1. 
        // Note that I'm just currently making directions vectors 
        //  - they will eventually be their own type.
        const newDirectionVector = [0,0,0]
        newDirectionVector[index] = sign
        const newDirection = fromVector(newDirectionVector)

        const numberMoves = Math.abs(workingVector[index])
        for (let i = 0; i < numberMoves; i += 1){
            result.push(newDirection)
        }
    }

    return result
}

