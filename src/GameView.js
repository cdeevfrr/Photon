import { canvasId } from "./commonIds"

function GameView({tiles, entities}){
    return (
        <div>
            <canvas id={canvasId} width="500" height="500"/>
        </div>)
}

export default GameView