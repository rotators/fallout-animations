import { UI } from "./ui";

export class DraggableElement {
    pos1: number = 0;
    pos2: number = 0;
    pos3: number = 0;
    pos4: number = 0;

    el: HTMLElement;

    onDragStop: (x: number, y: number) => void;

    constructor(el: HTMLElement) {
        this.el = el;
        this.dragElement(el);
    }

    unload() {
        this.el.onmousedown = null;
        document.onmouseup = null;
        document.onmousemove = null;
        this.el.style.cursor = 'default';
    }

    dragElement(el: HTMLElement) {
        
        el.onmousedown = e => this.dragMouseDown(e);
    }
    
    dragMouseDown(e) {
        e = e || window.event;
        e.preventDefault();
        this.pos3 = e.clientX;
        this.pos4 = e.clientY;
        document.onmouseup = e => this.closeDragElement();
        document.onmousemove = e => this.elementDrag(e);
    }
    
    elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        this.pos1 = this.pos3 - e.clientX;
        this.pos2 = this.pos4 - e.clientY;
        this.pos3 = e.clientX;
        this.pos4 = e.clientY;
        this.el.style.top = (this.el.offsetTop - this.pos2) + "px";
        this.el.style.left = (this.el.offsetLeft - this.pos1) + "px";
    }
    
    closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        if(this.onDragStop != null) {
            let y = parseInt(this.el.style.top.replace('px',''));
            let x = parseInt(this.el.style.left.replace('px',''))
            this.onDragStop(x,y); 
        }
    }
}

/*export class Dialog {
    div: HTMLDivElement;
    constructor(element: string) {
        this.div = document.getElementById(element) as HTMLDivElement;
        this.div.classList.add('dialog');
    }

    open() {
        UI.openDialog = this;
        this.div.classList.add('open');
        this.div.style.display = 'block';
        UI.overlay.style.visibility = 'visible';
    }

    close() {
        UI.openDialog = null;
        this.div.classList.remove('open');
        this.div.style.display = 'none';
        UI.overlay.style.visibility = 'false';
    }
}*/