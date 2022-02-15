import { vec3 } from 'gl-matrix'
import { fromVector, WorldRay } from '../shared/shared'
export { rescaleToLine }

/**
 * Given this vector that uses real numbers, rescale it to
 * a Spawn line (an ordered list of directions) where the
 * number of directions is scale.
 * 
 * Note that once we have a rounded vector like [-3, 0, 3]
 * we can't just throw each direction one at a time like [b,b,b,l,l,l].
 * That would cause all kinds of bottleneck behavior, even for vision
 * (ex a single opaque block 3 blocks in front of you would cover the whole screen.)
 * We have to spread things out like [b,l,b,l,b,l]
 * 
 * @param vector 
 * @param scale 
 */
 function rescaleToLine(vector: vec3, scale: number) : WorldRay{

    // rescale the vector so that it will have scale
    // total moves in it.
    const roundedVector = vec3.clone(vector)
    const sum = (roundedVector as number[]).reduce(
        (x, y) => Math.abs(x) + Math.abs(y), 0)
    vec3.scale(roundedVector, roundedVector, scale / sum)

    // Round each component individually.
    vec3.round(roundedVector, roundedVector)

    // Rounding may give too much or to little to each component, 
    //   up to 1.5 (.5 too much for each component)
    //   but remember, `sum(vector)` is within epsilon of `scale`.
    // If the positive sum is too much after rounding 
    //   (eg rescaling gives us [1.61, 2.62, 1.63] -> [2, 3, 2])
    //   we can adjust it in the next line.
    // TODO

    
    // make lines by adding in directions one at a time, proportionately.
    // There may be some weirdness near the end. 
    // When forced to choose, prioritize Z, then X, then Y.
    const result: WorldRay = []

    // TODO because we're in discrete land, we could
    // accomplish the same result without division if we
    // multiply everything into common units 
    // (ex, workingVector[0] *= workingVector[1] * workingVector[2])

    const workingVector = vec3.clone(roundedVector)

    const signs = roundedVector.map(x => x > 0? 1 : -1)
    
    const directions = [0, 1, 2].map(index => {
        const newDirectionVector = [0,0,0]
        newDirectionVector[index] = signs[index]
        return fromVector(newDirectionVector)
    })

    function moveTowardsIndex(index: number){
        result.push(directions[index])
        workingVector[index] -= signs[index]
    }

    // Sort indexes based on their abs values in RoundedVector
    // Just make 3 if checks, it's easier than a full sort.
    // For ties, go forward/back (z), then left/right(x), then up/down (y)
    const indexOrdering = [2,0,1]
    if (Math.abs(roundedVector[2]) < Math.abs(roundedVector[0])){
        indexOrdering[0] = 0
        indexOrdering[1] = 2
    }
    if (Math.abs(roundedVector[indexOrdering[1]]) < Math.abs(roundedVector[indexOrdering[2]])){
        const holder = indexOrdering[1]
        indexOrdering[1] = indexOrdering[2]
        indexOrdering[2] = holder
    }
    if (Math.abs(roundedVector[indexOrdering[0]]) < Math.abs(roundedVector[indexOrdering[1]])){
        const holder = indexOrdering[0]
        indexOrdering[0] = indexOrdering[1]
        indexOrdering[1] = holder
    }

    while(workingVector.some(x => x != 0)){
        // Each index has a fraction done.
        //   ex, if the vector is [-3, 0, 3] and we already added a 'back', then 
        //   we're at [1/3, Nan, 0/3] done. For code simplicity, invert this as [2/3, 0, 1]
        // Prioritize things with different fractions done first,
        // then prioritize indexes based on the ordering of abs values
        // in roundedVector.
        const fractionsDone = workingVector.map((x, index) => {
            if (roundedVector[index] == 0){
                // NaN is bigger than all other numbers, so we can't leave it in and then find the max.
                return 0
            } else {
                return x / roundedVector[index]
            }
        })
        const maxValue = Math.max.apply(null, Array.from(fractionsDone));
        indexOrdering.filter(index => 
            fractionsDone[index] === maxValue
        ).forEach(moveTowardsIndex)
    }

    return result
}