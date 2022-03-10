import { GraphNode } from "../shared/GraphNode";
import { Color } from "../shared/shared";

/**
 * A cursor is an entity that's in a node - that's the node the
 * player is focusing on right now.
 */
export class Cursor {

    /////// BEGIN This chunk should be abstracted & shared
    private currentPosition: GraphNode | null = null

    moveTo(node: GraphNode | null){
        if(this.currentPosition){
            this.currentPosition.removeContents(this)
        }

        if (node){
            node.addContents(this)
        }
        this.currentPosition = node
    }
    /////// END This chunk should be abstracted & shared

    
    opaque = false // so that this is an entity.

    draw({
        cxt, 
        x, 
        y, 
        width, 
        height
    }:{
        cxt: CanvasRenderingContext2D, 
        x: number, 
        y: number, 
        width: number, 
        height: number
    }){
            cxt.beginPath()
            cxt.strokeStyle = Color.black
            cxt.rect(x, y, width, height)
            cxt.stroke()
    }
}