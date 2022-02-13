import {rescaleToLine} from './VectorToLine'
import * as assert from 'assert'
import {Direction} from '../shared/shared'


test('convertes vector to line', () => {
    assert.deepEqual(
        rescaleToLine([1, 2, -1], 4),
        [
            Direction.forward, 
            Direction.right, 
            Direction.up, 
            Direction.up
        ]
    )

    assert.deepEqual(
        rescaleToLine([2, 4, -2], 4),
        [
            Direction.forward, 
            Direction.right, 
            Direction.up, 
            Direction.up
        ]
    )
});

test('rounds well', () => {
    assert.deepEqual(
        rescaleToLine([5, 2, -1], 4),
        [
            Direction.right,  // could also be direction.forward, close enough.
            Direction.right, 
            Direction.right, 
            Direction.up
        ]
    )
});

test('spreads movement out well', () => {
    assert.deepEqual(
        rescaleToLine([3, 3, -3], 9),
        [
            Direction.forward,
            Direction.right,
            Direction.up,
            Direction.forward,
            Direction.right,
            Direction.up,
            Direction.forward,
            Direction.right,
            Direction.up,
        ]
    )

    assert.deepEqual(
        rescaleToLine([4, 2, -2], 8),
        [
            Direction.right,
            Direction.forward,
            Direction.up,
            Direction.right,
            Direction.right,
            Direction.forward,
            Direction.up,
            Direction.right,
        ]
    )

    assert.deepEqual(
        rescaleToLine([5, 3, -2], 10),
        [
            Direction.right,
            Direction.up,
            Direction.forward,
            Direction.right,
            Direction.right,
            Direction.up,
            Direction.right,
            Direction.forward,
            Direction.up,
            Direction.right,
        ]
    )
});

// TODO right now this test returns 3 directions due to rounding issues, so it fails.
// Correct behavior will actually return 4 directions.
// test('drops tiny fractions', () => {
//     assert.deepEqual(
//         rescaleToLine([10, 1, -1], 4),
//         [
//             Direction.right, 
//             Direction.right, 
//             Direction.right, 
//             Direction.right
//         ]
//     )
// });