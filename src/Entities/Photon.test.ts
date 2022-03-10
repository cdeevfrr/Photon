import * as assert from 'assert'
import { gridOfSize } from '../GraphReading/GraphNodeHelpers'
import { Block, Direction } from '../shared/shared'


const tinyGrid = gridOfSize(1)

test("Photons run their oncollision even if they pass beyond empty space.", ()=> {
    const block: Block = {
        blockTypeId: 0,
        blockId: 0,
        opaque: true,
        draw: () => false
    }
    tinyGrid.adjacentNodes(Direction.forward)[0].addContents(block)
    // TODO finish this up
    assert.ok(true)
})