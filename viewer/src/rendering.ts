import { FRMObject } from "./frmobject";

export class CanvasContainer {
    static container: HTMLElement;

    static init(container: HTMLElement) {
        this.container = container;
    }

    static destroyCanvas(canvas: HTMLCanvasElement) {
        if(canvas != null) {
            canvas.parentElement.removeChild(canvas);
            canvas = null;
        }
    }

    static generateId() {
        for(let i=0;i<999;i++) {
            let id = 'cid_'+i;
            if (this.container.querySelector('#'+id) == null) {
                return id;
            }
        }
        alert('Max number of canvases created.');
    }

    static createCanvas(objectId: number, width: number, height: number) {
        let canvas = document.createElement('canvas');
        canvas.id = this.generateId();
        canvas.style.position = 'absolute';
        canvas.setAttribute('width', width+ 'px');
        canvas.setAttribute('height', height +'px');
        canvas.setAttribute('data-id', objectId.toString());
        canvas.ondblclick = (ev: any) => {
            FRMObject.onFRMCanvasDoubleClicked(ev.target.getAttribute('data-id'));
        };

        this.container.appendChild(canvas);
        return canvas;
    }

}