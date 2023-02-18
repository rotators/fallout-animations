import { Critter, CritterData } from "./critter";
import { DraggableElement } from "./dom";
import { FRMAnimation } from "./fallout/frm";
import { FRMData } from "./resources";
import { GVars } from "./state";

export class FRMObject {
    critter: Critter | null;

    isSelected: boolean;

    id: number;

    x: number;
    y: number;
    dir: number;
    frameRate: number;

    draggable: DraggableElement;
    isDraggable: boolean;

    canBeDragged: boolean;
    useNativeFramerate: boolean;

    onFramerateChanged: (framerate: number) => void;
    onDirChanged: ((dir: number) => void) | null;
    onAnimationCodeChanged: (code: string) => void;
    onRenderedFrame: ((animation: FRMAnimation) => void) | null;
    onPositionDragged: ((x, y) => void) | undefined;

    static onFRMLoaded: (id, frmData: FRMData) => void;
    static onFRMPosChanged: (id, x, y) => void;
    static onFRMCanvasDoubleClicked: (id) => void;

    static globalId = 1;

    destroy() {
        if(this.critter != null) {
            this.critter.destroy();
        }
        this.critter=null;
    }

    getDir() {
        if(this.critter?.currentAnimation?.dir != this.dir && this.critter?.currentAnimation != null) {
            this.dir = this.critter.currentAnimation.dir
        }
        return this.dir;
    }

    getFRM() {
        return this?.critter?.frm;
    }

    registerOnAnimationCodeChanged(func: (code: string) => void) {
        this.onAnimationCodeChanged = func;
        this.critter?.registerOnAnimationCodeChanged(func);
    }

    registerOnRenderedFrame(onRenderedFrame: (animation: FRMAnimation) => void) {
        this.onRenderedFrame = onRenderedFrame;
        this.critter?.registerOnRenderedFrame(onRenderedFrame);
    }

    unregisterAnimationCodeChanged() {
        this.critter?.unregisterOnAnimationCode();
    }

    unregisterOnRenderedFrame() {
        this.onRenderedFrame = null;
        this.critter?.unregisterOnRenderedFrame();
    }

    enableDragOnCanvas(canvas: HTMLCanvasElement, onPositionDragged?: (x, y) => void) {
        canvas.style.zIndex = '2';
        canvas.style.cursor = 'move';
        this.draggable = new DraggableElement(canvas);
        if(onPositionDragged != null) {
            this.draggable.onDragStop = (x,y) => onPositionDragged(x, y);
        }
    }

    onPositionDraggedHandler(dragX: number, dragY: number) {
        if(this.critter == null) {
            return;
        }

        let x = dragX + this.critter.currentAnimation.adjustedCenterPoint().x;
        let y = dragY + this.critter.currentAnimation.adjustedCenterPoint().y;
        this.setPosition(x, y);
        if(this.onPositionDragged != null) {
            this.onPositionDragged(x, y);
        }
    }

    setDraggable(isDraggable: boolean, onPositionDragged?: (x, y) => void) {
        if(this.critter == null) {
            return;
        }
        this.onPositionDragged = onPositionDragged;
        this.canBeDragged = isDraggable;
        if(isDraggable) {
            if(this.critter.currentAnimation != null) { 
                this.enableDragOnCanvas(this.critter.currentAnimation.getCanvas(), (x, y) => this.onPositionDraggedHandler(x,y))
            }
            this.critter.onCreateCanvas = (canvas) => {
                this.enableDragOnCanvas(canvas, (x, y) => this.onPositionDraggedHandler(x,y));
            };
        } else {
            if(this.critter.currentAnimation != null) {
                let canvas = this.critter.currentAnimation.getCanvas();
                canvas.style.zIndex = '0';
                canvas.style.cursor = 'default';
            }
            if(this.draggable != null) {
                this.draggable.unload();
            }
            this.critter.onCreateCanvas = null;
        }
    }

    hasAnimationCode(code: string) {
        return this.critter?.animations.findIndex(x => x == code) != -1;
    }

    changeCritter(cr: string) {
        let last = this.critter?.currentCode;
        this.critter?.destroy();
        this.critter = CritterData.getCritterInstance(this, cr);
        this.critter?.setPosition(this.x, this.y);
        this.critter?.registerOnRenderedFrame(this.onRenderedFrame);
        if(this.critter != null) {
            this.critter.parentObject = this;
        }
        if(this.hasAnimationCode(last)) {
            this.setAnimation(last, this.dir);
        } else {
            this.setAnimation(this.critter?.animations[0], this.dir);
        }
        this.setFrameRate(this.frameRate);
        this.critter?.setNativeFPS(this.useNativeFramerate);
    }

    setPosition(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.critter?.setPosition(x, y);
        FRMObject.onFRMPosChanged(this.id, x, y);
    }

    setNativeFPS(use: boolean) {
        if(use) {
            this.useNativeFramerate = true;
            this.critter?.setNativeFPS(use);
        } else {
            this.useNativeFramerate = false;
        }
    }

    setFrameRate(frameRate: number) {
        this.frameRate = frameRate;
        if(this.critter?.currentAnimation != null) {
            this.critter?.currentAnimation.setFrameRate(frameRate);
        }
        if(this.onFramerateChanged != null) {
            this.onFramerateChanged(frameRate);
        }
    }

    setAnimation(code: string, dir: number, onLoaded?: () => void) {
        if (dir > 6 && dir < 0) {
            alert('dir ' + dir + ' is invalid');    
        }
        this.critter?.loadFRM(code, dir, () => {
            if(this == null || this.critter == null) {
                return;
            }

            FRMObject.onFRMLoaded(this.id, this.critter.frm.frmData);

            if(this.onAnimationCodeChanged != null) {
                this.onAnimationCodeChanged(code);
            }

            if(onLoaded != null) {
                onLoaded();
            }
            if(this.critter.currentAnimation != null) {
                this.critter.currentAnimation.setFrameRate(this.frameRate);
                if(this.canBeDragged) {
                    this.setDraggable(true, this.onPositionDragged);
                }
            }

            this.critter.setPosition(this.x, this.y);
        });
    }

    setDirection(dir: number) {
        this.dir = dir;
        if(this.critter != null) {
            this.setAnimation(this.critter?.currentCode, dir);
        }
        
        if(this.onDirChanged != null) {
            this.onDirChanged(this.dir);
        }
    }

    dirChanged(dir: number) {
        this.dir = dir;
        if(this.onDirChanged != null) {
            this.onDirChanged(this.dir);
        }
    }
}

export class ObjectRenderer {
    objects: FRMObject[] = [];

    rendering: boolean;
    lastTime: number;

    startObjectRendering() {
        this.rendering = true;
        this.update();
    }

    suspendObjectRendering() {
        this.rendering = false;
    }

    generateCodeState() {
        let code = '';
        code += 'clearObjects();'
        code += `setEnvironment(${GVars.environment.get('empty')});`;
        for(let obj of this.objects) {
            code += `createObject(${obj.critter?.name}, ${obj.critter?.currentCode}, ${obj.x}, ${obj.y}, ${obj.dir}, ${obj.frameRate});`;
            code += `setAnimationState(${obj.critter?.currentAnimation.current}, ${obj.critter?.currentAnimation.isRunning ? 1 : 0}, ${obj.critter?.cycleDir ? 1 : 0}, ${obj.critter?.cycleAnimation ? 1 : 0}, ${obj.critter?.useNativeFramerate ? 1 : 0});`;
        }
        code += `refreshSelected();`; 
        return code;
    }

    clearObjects() {
        while(this.objects.length>0) {
            this.deleteObject(this.objects[0]);
        }
    }

    deleteObject(o: FRMObject) {
        o.destroy();
        let idx = this.objects.indexOf(o);
        this.objects.splice(idx, 1);
    }

    createObject(name: string, frameRate?: number) {
        let obj = new FRMObject();
        obj.id = FRMObject.globalId++;
        obj.frameRate = frameRate ?? 10;
        obj.critter = CritterData.getCritterInstance(obj, name);
        if(obj.critter == null) {
            return null;
        }
        obj.critter.parentObject = obj;
        this.objects.push(obj);
        return obj;
    }

    update() {
        let t = Date.now();
        let dt = t - this.lastTime;
        this.lastTime = Date.now();
        for(let i=0;i<this.objects.length;i++) {
            if(this.objects[i].critter?.currentAnimation != null) {
                this.objects[i].critter?.currentAnimation.animate(dt);
            }
        }

        if(!this.rendering) {
            return;
        }
    
        requestAnimationFrame(() => {
           this.update();
        });
    }
}