import { canvasId, positionElementId } from "./commonIds"

function GameView({tiles, entities}){
    return (
        <div>
            <p id={positionElementId}></p>
            <canvas id={canvasId} width="500" height="500"/>
        </div>)
}

export default GameView