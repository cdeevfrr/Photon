import { vec3, mat3 } from 'gl-matrix'
export{}


// https://learnopengl.com/Getting-started/Camera
// Camera points toward negative Z axis by convention.
// positive X is right
// positive Y is up.

const defaultLines = [
    [2,2,-2], [2,2,-1], [2,2,0], [2,2,1], [2,2,2],
    [2,1,-2], [2,1,-1], [2,1,0], [2,1,1], [2,1,2],
    [2,0,-2], [2,0,-1], [2,0,0], [2,0,1], [2,0,2],
    [2,-1,-2], [2,-1,-1], [2,-1,0], [2,-1,1], [2,-1,2],
    [2,-2,-2], [2,-2,-1], [2,-2,0], [2,-2,1], [2,-2,2]
]

/**
 * Given camera orientation information, create lines
 * for each pixel that will be displayed. 
 */
function makeLines(pitchDegrees: number, yawDegrees: number){
    const pitch = pitchDegrees * 180 / Math.PI
    const yaw = yawDegrees * 180 / Math.PI
    const direction = [
        Math.cos(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.sin(yaw) * Math.cos(pitch)
    ]

}