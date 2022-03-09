import * as assert from 'assert'
import { readGFGLines } from './ReadGraphFromLines'

test("Happy path", async () => {
    const map = 
`EEE
EEE
EEE

EEB
EEE
EEE

EEE
EEE
EEE`
    const resultNodes = (await readGFGLines(map.split("\n"))).nodes
    assert.deepEqual(resultNodes[0][1][0]!.initialCoordinates, [0,0,1])
    assert.deepEqual(resultNodes[0][0][1]!.initialCoordinates, [1,0,0])
    assert.deepEqual(resultNodes[1][0][0]!.initialCoordinates, [0,1,0])

    assert.ok(resultNodes[1][0][2]!.getContents().length > 0, "The correct node has an entity")

})