import * as assert from 'assert'
import { GraphNode } from '../shared/GraphNode'
import { gridOfSize } from '../shared/GraphNodeHelpers'
import { Direction } from '../shared/shared'
import { testInternals } from './viewport'
const findNodes = testInternals.findNodes

/**
 * For all these tests:
 * 
 * [10][0] is the top left rendered square in the view a player sees.
 * [5][5] is the middle
 * [0][0] is the bottom left 
 */
test('renders expected corners from starting point', () => {
    const gridCenterNode = gridOfSize(5)
    //TODO add const renderDistance = 5
    
    const view = findNodes(0, 0, backTwoSteps(gridCenterNode), [0,0,0])

    assert.deepEqual(
        view[10][0].nodeContents.extraData,
        `(0,0,0)` 
    )
    assert.deepEqual(
        view[0][0].nodeContents.extraData,
        `(0,10,0)` 
    )
    assert.deepEqual(
        view[5][5].nodeContents.extraData,
        `(5,5,0)` 
    )
})

test('renders expected corners from moving a bit', () => {
    const gridCenterNode = gridOfSize(6)
    //TODO add const renderDistance = 5
    
    const view = findNodes(0, 0, backTwoSteps(gridCenterNode)
        .adjacentNodes(Direction.backward)[0]
        .adjacentNodes(Direction.backward)[0]
        .adjacentNodes(Direction.down)[0]
        .adjacentNodes(Direction.left)[0],
        [0,0,0]
        )

    assert.deepEqual(
        view[10][0].nodeContents.extraData,
        `(0,0,3)` 
    )
    assert.deepEqual(
        view[0][0].nodeContents.extraData,
        `(0,10,3)` 
    )
    assert.deepEqual(
        view[0][10].nodeContents.extraData,
        `(10,10,3)` 
    )
})

test('renders from turning left 90 degrees', () => {
    const gridCenterNode = gridOfSize(5)
    //TODO add const renderDistance = 5
    
    const view = findNodes(0, -90, takeSteps(gridCenterNode, Direction.right, 2), [0,0,0])

    assert.deepEqual(
        view[0][0].nodeContents.extraData,
        `(0,10,10)` 
    )
    assert.deepEqual(
        view[5][5].nodeContents.extraData,
        `(0,5,5)` 
    )
    assert.deepEqual(
        view[10][0].nodeContents.extraData,
        `(0,0,10)` 
    )
})

test('renders from turning right 90 degrees', () => {
    const gridCenterNode = gridOfSize(5)
    //TODO add const renderDistance = 5
    
    const view = findNodes(0, 90, takeSteps(gridCenterNode, Direction.left, 2), [0,0,0])

    assert.deepEqual(
        view[0][0].nodeContents.extraData,
        `(10,10,0)` 
    )
    assert.deepEqual(
        view[5][5].nodeContents.extraData,
        `(10,5,5)` 
    )
    assert.deepEqual(
        view[10][0].nodeContents.extraData,
        `(10,0,0)` 
    )
})

test('renders correctly from tilting up 90 degrees', () => {
    const gridCenterNode = gridOfSize(5)
    //TODO add const renderDistance = 5
    
    const view = findNodes(-90, 0, takeSteps(gridCenterNode, Direction.down, 2), [0,0,0])

    assert.deepEqual(
        view[10][0].nodeContents.extraData,
        `(0,10,0)` 
    )
    assert.deepEqual(
        view[5][5].nodeContents.extraData,
        `(5,10,5)` 
    )
    assert.deepEqual(
        view[0][0].nodeContents.extraData,
        `(0,10,10)` 
    )
})

test('renders correctly from tilting down 90 degrees', () => {
    const gridCenterNode = gridOfSize(5)
    //TODO add const renderDistance = 5
    
    const view = findNodes(90, 0, takeSteps(gridCenterNode, Direction.up, 2), [0,0,0])

    assert.deepEqual(
        view[10][0].nodeContents.extraData,
        `(0,0,10)` 
    )
    assert.deepEqual(
        view[5][5].nodeContents.extraData,
        `(5,0,5)` 
    )
    assert.deepEqual(
        view[0][0].nodeContents.extraData,
        `(0,0,0)` 
    )
})

test('renders correctly from tilting right 45 degrees', () => {
    const gridCenterNode = gridOfSize(5)
    //TODO add const renderDistance = 5
    
    const view = findNodes(0, 45, backTwoSteps(gridCenterNode), [0,0,0])

    assert.deepEqual(
        view[5][5].nodeContents.extraData,
        `(9,5,3)` 
    )
})

test('renders correctly from tilting up 45 degrees and right 45 degrees', () => {
    const gridCenterNode = gridOfSize(5)
    //TODO add const renderDistance = 5
    
    const view = findNodes(-45, 45, backTwoSteps(gridCenterNode), [0,0,0])

    assert.deepEqual(
        view[5][5].nodeContents.extraData,
        `(8,9,4)` 
    )
})

test('renders correctly from tilting up 45 degrees and right 90 degrees', () => {
    const gridCenterNode = gridOfSize(5)
    //TODO add const renderDistance = 5
    
    const view = findNodes(-45, 90, backTwoSteps(gridCenterNode), [0,0,0])

    assert.deepEqual(
        view[5][5].nodeContents.extraData,
        `(9,9,7)` 
    )
})


/**
 * I don't understand why this test is failing.
 * It should be working... left works, right works, up works, and I'm just using a matrix library, so why isn't up-right working?
 */
test('renders correctly from tilting up 90 degrees and right 90 degrees', () => {
    const gridCenterNode = gridOfSize(5)
    //TODO add const renderDistance = 5
    
    const view = findNodes(-90, 90, takeSteps(gridCenterNode, Direction.down, 2), [0,0,0])

    assert.deepEqual(
        view[5][5].nodeContents.extraData,
        `(5,10,5)` 
    )
    assert.deepEqual(
        view[10][0].nodeContents.extraData,
        `(10,10,0)` 
    )
    assert.deepEqual(
        view[0][0].nodeContents.extraData,
        `(0,10,0)` 
    )
})

function backTwoSteps(node: GraphNode){
    return node.adjacentNodes(Direction.backward)[0].adjacentNodes(Direction.backward)[0]
}

function takeSteps(node: GraphNode, d: Direction, numSteps: number ): GraphNode {
    if (numSteps == 0){
        return node
    }
    return takeSteps(node.adjacentNodes(d)[0], d, numSteps - 1)
}