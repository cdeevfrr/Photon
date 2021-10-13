import {mat4, mat3} from 'gl-matrix'

export {makeRotationMatrix}

function makeRotationMatrix(pitchDegrees: number, yawDegrees: number){
    const pitch = pitchDegrees / 180 * Math.PI
    const yaw = yawDegrees / 180 * Math.PI

    // Create a rotation matrix that will transform vectors made from the default lines into vectors pointing in the right direction.
    const rotationMatrix4 = mat4.create()
    mat4.identity(rotationMatrix4)
    mat4.rotateX(rotationMatrix4, rotationMatrix4, pitch)
    mat4.rotateY(rotationMatrix4, rotationMatrix4, yaw)
    const rotationMatrix = mat3.create()
    mat3.fromMat4(rotationMatrix, rotationMatrix4)
    return rotationMatrix
}