import {rescaleToLine} from './VectorToLine2'
import * as assert from 'assert'
import {Direction} from '../shared/shared'


test('simple happy path converts vector to line preserving distance', () => {
    assert.deepEqual(
        rescaleToLine([1, 2, -1], [0.1,0.1,0.1]),
        [
            Direction.forward, 
            Direction.up, 
            Direction.right, 
            Direction.up,
        ]
    )

    assert.deepEqual(
        rescaleToLine([2, 4, -2], [0.1,0.1,0.1]),
        [
            Direction.forward,
            Direction.up, 
            Direction.right, 
            Direction.up,
            Direction.forward, 
            Direction.up, 
            Direction.right, 
            Direction.up,
        ]
    )
});

test('rounds well', () => {
    assert.deepEqual(
        rescaleToLine([4.99, 2, 1.1], [0,0,0]),
        [
            Direction.right,
            Direction.right,
            Direction.up,
            Direction.right, 
            Direction.right,
            Direction.backward,
            Direction.up,
        ]
    )
});

test('rounds well with negatives', () => {
    assert.deepEqual(
        rescaleToLine([4.99, 2, -1.1], [0,0,0]),
        [
            Direction.right,
            Direction.right,
            Direction.up,
            Direction.right, 
            Direction.right,
            Direction.forward,
            Direction.up,
        ]
    )
});

test('Doesnt change dramatically from small changes in input', () => {
    const smallResult = rescaleToLine([4.99, 2, 1.1], [0,0,0])
    const bigResult = rescaleToLine([5, 2, 1.1], [0,0,0])
    assert.ok(
        bigResult.length -smallResult.length< 2,
        `
        Got results 
        ${bigResult}
        and 
        ${smallResult}
        `
    )
});

test('respects initial position correctly', () => {
    assert.deepEqual(
        rescaleToLine([2, 2, -2], [-5.2,1.5,1.1]),
        [
            Direction.forward,
            Direction.right,
            Direction.up,
            Direction.forward,
            Direction.right,
            Direction.up,
        ]
    )
});