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