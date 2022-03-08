import * as assert from 'assert'
import { vec3 } from 'gl-matrix'
import { GraphNode } from './GraphNode'
import { gridOfSize } from './GraphNodeHelpers'
import { Position, rotate } from './Position'
import { Direction } from './shared'


test('leaving +x entering +y rotates correctly', () => {
    assert.deepEqual(
        rotate(Direction.right, Direction.up, [1, 0, 0]),
        vec3.clone([0, -1, 0])
    )
    assert.deepEqual(
        rotate(Direction.right, Direction.up, [0, 1, 0]),
        vec3.clone([1, 0, 0])
    )
    assert.deepEqual(
        rotate(Direction.right, Direction.up, [0, 0, 1]),
        vec3.clone([0, 0, 1])
    )
})


// test('leaving -x entering +y rotates correctly', () => {
//     assert.deepEqual(
//         rotate(Direction.left, Direction.up, [1, 0, 0]),
//         []
//     )
// })

const gridCenter = gridOfSize(1)

test('Adding a vector with no rotation happy path', () => {
    const p = new Position(gridCenter, [0.1,0.1,0.1])
    const vectorToAdd: vec3 = [1.4, 1.5, 1.6]
    const result = p.addVector(vectorToAdd, () => false)
    // assert that resultOrientation is a scaling of the added vector
    assert.ok(result.lastAdded![0] / vectorToAdd[0] - result.lastAdded![1] / vectorToAdd[1] < 0.01)
    assert.ok(result.lastAdded![1] / vectorToAdd[1] - result.lastAdded![2] / vectorToAdd[2] < 0.01)
    
    assert.deepEqual(p.position, 
        gridCenter
        .adjacentNodes(Direction.backward)[0]
        .adjacentNodes(Direction.up)[0]
        .adjacentNodes(Direction.right)[0]
    )
})

test('Near edges of boxes happy path', () => {
    const p = new Position(gridCenter, [0.1,0.1,0.1])
    const vectorToAdd: vec3 = [1, 1, 1]
    const result = p.addVector(vectorToAdd, () => false)
    // assert that resultOrientation is a scaling of the added vector
    assert.ok(result.lastAdded![0] / vectorToAdd[0] - result.lastAdded![1] / vectorToAdd[1] < 0.01)
    assert.ok(result.lastAdded![1] / vectorToAdd[1] - result.lastAdded![2] / vectorToAdd[2] < 0.01)

    assert.deepEqual(p.position, 
        gridCenter
        .adjacentNodes(Direction.backward)[0]
        .adjacentNodes(Direction.up)[0]
        .adjacentNodes(Direction.right)[0]
    )
})

test('Rounds ok', () => {
    const p = new Position(gridCenter, [0,0,0])
    const vectorToAdd: vec3 = [1.1, 0, 0]
    const result = p.addVector(vectorToAdd, () => false)
    // assert that resultOrientation is a scaling of the added vector
    assert.ok(result.lastAdded![0] - .1 < .001)
    assert.deepEqual(p.position, 
        gridCenter
        .adjacentNodes(Direction.right)[0]
    )
})
