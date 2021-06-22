import { FalloutAnimation } from './fallout/animation';
import { FRM, FRMAnimation } from "./fallout/frm";
import { FRMObject } from './frmobject';
import { MetaData } from './resources';

enum ActionId {
    walk,
    wait,
    fire,
    animate
}

interface CritterAction {
    id: number;
    vars: object;
}

export class Critter {
    name: string;
    frmBase: string;
    animations: string[];

    currentAction: CritterAction;
    actionQueue: CritterAction[] = [];

    animationMapping: object;

    frm: FRM;
    currentCode: string;
    currentAnimation: FRMAnimation;

    onAnimationCodeChanged: (code: string) => void;
    onRenderedFrame: (anim: FRMAnimation) => void;
    onChangePosition: (x: number, y: number) => void;
    onCreateCanvas: (canvas: HTMLCanvasElement) => void;

    parentObject: FRMObject;

    x: number;
    y: number;

    useNativeFramerate: boolean;
    cycleDir: boolean;
    cycleAnimation: boolean;
    stopOnLastFrame: boolean = false;

    loadingFRM: string;

    static newAnimationLoaded: (code: string) => void;

    constructor(parent: FRMObject, name: string, animationMapping: object) {
        this.parentObject = parent;
        this.name = name;
        //this.frmBase = frmBase;
        this.animations = [];
        this.animationMapping = animationMapping;
        for(let anim in animationMapping) {
            this.animations.push(anim);
        }
        
    }

    unregisterOnRenderedFrame() {
        this.onRenderedFrame = null;
        if(this.currentAnimation != null) {
            this.currentAnimation.unregisterOnRenderedFrame();
        }
    }

    registerOnRenderedFrame(func: (anim: FRMAnimation) => void) {
        this.onRenderedFrame = func;
        if(this.currentAnimation != null) {
            this.currentAnimation.registerOnRenderedFrame(func);
        }
    }

    unregisterOnAnimationCode() {
        this.onAnimationCodeChanged = null;
    }

    registerOnAnimationCodeChanged(func: (code: string) => void) {
        this.onAnimationCodeChanged = func;
    }

    execOrQueue(action: CritterAction) {
        if(this.currentAction != null) {
            this.actionQueue.push(action);
            return;
        }
        this.execAction(action);
    }

    handleActionQueue() {
        this.currentAction = null;
        let action = this.actionQueue.shift();
        if(action == null) {
            return;
        }
        this.execAction(action);
    }

    execAction(action: CritterAction) {
        this.currentAction = action;
        let v = action.vars;
        if(action.id == ActionId.fire) {
            this.execFire(action.vars['dir']);
        }
        if(action.id == ActionId.walk) {
            this.execWalk(action.vars['dir'],action.vars['numAnimations']);
        }
        if(action.id == ActionId.wait) {
            this.execDelay(action.vars['time']);
        }
        if(action.id == ActionId.animate) {
            this.execAnimate(v['code'], v['dir'], v['fps'], v['stopOnLastFrame']);
        }
    }


    walkCount: number = 0;

    doAnimation(code: string, dir: number, fps:number, stopOnLastFrame: boolean) {
        this.execOrQueue({ id: ActionId.animate, vars: {
            dir: dir,
            code: code,
            fps: fps,
            stopOnLastFrame: stopOnLastFrame
        }});
    }

    walk(dir: number, numAnimations: number) {
        this.execOrQueue({ id: ActionId.walk, vars: {
            dir: dir,
            numAnimations: numAnimations
        }});
    }

    delay(time: number) {
        this.execOrQueue({ 
                id: ActionId.wait, vars: {
                time: time
            }});
    }

    fire(dir: number) {
        let act: CritterAction = { id: ActionId.fire, vars: {
            dir: dir
        }};
        if(this.currentAction != null) {
            this.actionQueue.push(act);
            return;
        }
        this.currentAction = act;
        this.execFire(dir);
    }

    execAnimate(code: string, dir: number, fps: number, stopOnLastFrame: boolean) {
        this.stopOnLastFrame = stopOnLastFrame;
        this.loadFRM(code, dir, () => {
            this.currentAnimation.setFrameRate(fps);
            this.handleActionQueue();
        });
    }

    execDelay(time: number) {
        setTimeout(() => {
            this.handleActionQueue();
        }, time);
    }

    execWalk(dir: number, numAnimations: number) {
        this.walkCount = 0;
        this.loadFRM('HB', dir, () => {
            this.setDir(dir);
            this.currentAnimation.setFrameRate(10);
            this.currentAnimation.onFirstFrameRendered = (anim) => {
                this.walkCount++;
                // ne
                if (dir == 0) {
                    this.setPosition(this.x+33, this.y-23);
                }
                // e
                if(dir == 1) {
                    this.setPosition(this.x+65, this.y);
                }
                // se 
                if (dir == 2) {
                    this.setPosition(this.x+33, this.y+23);
                }
                // sw
                if (dir == 3) {
                    this.setPosition(this.x-33, this.y+23);
                }
                // w
                if (dir == 4) {
                    this.setPosition(this.x-65, this.y);
                }
                // nw
                if (dir == 5) {
                    this.setPosition(this.x-33, this.y-23);
                }
                if(this.walkCount>numAnimations) {
                    this.stopWalking(dir, () => {
                     this.handleActionQueue();
                    });
                }
                //anim.start();
            };
            //this.PageHandle.forceUpdate();
        });
    }

    execFire(dir) {
        this.loadFRM('HJ', dir);
        this.handleActionQueue();
    }

    stopWalking(dir: number, onStopped: () => void) {
        this.loadFRM('HA', dir, () => {
            this.currentAnimation.stop();
            this.currentAnimation.renderFrame(0);
            onStopped();
        });
    }

    animationsOptions() {
        return Array.from(this.animations, (anim, i) => {
            return `<option value=${anim}>${FalloutAnimation.CodeDescription(anim)}</option>`
        }).join('\n');
    }

    getFRMFilename(code: string, dir: number) {
        let files = this.animationMapping[code] as string | Array<string>;
        
        // *.fr files
        if(Array.isArray(files)) {
            if(files[files.length-1].toLowerCase().indexOf('.frm') != -1) {
                files = files[files.length-1];
            } else {
                files = files[dir];
            }
        }

        return files;
    }

    destroy() {
        this.actionQueue = [];
        if(this.currentAnimation != null) {
            this.currentAnimation.destroy();
        }
    }

    setDir(dir: number) {
        this.loadFRM(this.currentCode, dir);
        if(this.parentObject != null) {
            this.parentObject.dir = dir;
        }
    }

    onLastFrameRendered() {
        if(this.cycleDir) {
            let dontCycle = this.cycleAnimation && this.parentObject.dir == 5;
            let dir = (this.parentObject.dir+1) % 6;
            if(!dontCycle) {
                this.setDir(dir);
            }
        }
        if(this.cycleAnimation) {
            let dontCycle = this.cycleDir && this.parentObject.dir != 5;
            let idx = this.animations.indexOf(this.currentCode)+1;
            let nextIdx = (idx%(this.animations.length));
            let next = this.animations[nextIdx];
            let dir = this.cycleDir ? 0 : this.parentObject.dir;
            if(!dontCycle) {
                this.loadFRM(next, dir);
            }
        }

        if(this.stopOnLastFrame) {
            this.currentAnimation.stop();
        }
    }

    setCycleDir(enabled: boolean) {
        this.cycleDir = enabled;
    }

    setPosition(x: number, y: number) {
        if(x == null || y == null) {
            return;
        }
        if(this.currentAnimation != null) {
            if(this.currentAnimation.canvas != null) {
                let screenPosition = this.currentAnimation.positionCoordToPixels(x, y);
                this.currentAnimation.canvas.style.left = screenPosition.x + 'px';
                this.currentAnimation.canvas.style.top = screenPosition.y + 'px';
            }
        }
        this.x = x;
        this.y = y;
        if(this.parentObject != null) {
            this.parentObject.x = this.x;
            this.parentObject.y = this.y;
        }
    }

    frmIsLoaded() {
        return this.frm?.frmData != null;
    }

    nativeFramerate() {
        if(!this.frmIsLoaded())
            return -1;
        return this.frm.frmData.frameRate;
    }

    setNewFramerate(fps: number) {
        this.parentObject.setFrameRate(fps);
    }

    setNativeFPS(use: boolean) {
        if(use) {
            this.useNativeFramerate = true;
            this.setNewFramerate(this.nativeFramerate());
        } else {
            this.useNativeFramerate = false;
        }
    }

    stopAnimation() {
        if(this.currentAnimation != null) {
            this.currentAnimation.stop();
        }
    }

    startAnimation(animation: FRMAnimation, frm: FRM) {
        this.loadAnimation(animation, frm);
        this.currentAnimation.onLastFrameRendered = (anim) => {
            this.onLastFrameRendered();
        };
        animation.start();
    }

    loadAnimation(animation: FRMAnimation, frm: FRM) {
        if(this.currentAnimation != null) {
            this.currentAnimation.destroy();
        }
        if(this.onCreateCanvas != null) {
            animation.onCreateCanvas = (canvas) => this.onCreateCanvas(canvas);
        }
        if(this.onRenderedFrame != null) {
            animation.registerOnRenderedFrame(this.onRenderedFrame);
        }

        this.currentAnimation = animation;
        if(this.useNativeFramerate) {
            this.parentObject.setFrameRate(frm.frmData.frameRate);
        } else {
            this.currentAnimation.setFrameRate(this.parentObject.frameRate);
        }
        this.setPosition(this.x, this.y);
    }
    
    loadFRM(code: string, dir: number, onLoaded?: () => void) {
        let filename = this.getFRMFilename(code, dir);
        if(filename == null) {
            return;
        }
        this.loadingFRM = this.name + '/' + filename;
        FRM.Load(this.name + '/' + filename, (frm) => {
            if(this.loadingFRM != frm.name) {
                console.log('FRM no longer relevant.');
                return;
            }
            this.frm = frm;

            if(this.frm == null) {
                return;
            }

            if(this.useNativeFramerate) {
                this.setNewFramerate(this.nativeFramerate());
            }

            if(Critter.newAnimationLoaded != null) {
                Critter.newAnimationLoaded(code);
            }
            
            this.parentObject.dirChanged(dir);
            this.startAnimation(this.frm.getAnimation(dir, this), this.frm);
            this.currentCode = code;
            if(this.onAnimationCodeChanged != null) {
                this.onAnimationCodeChanged(this.currentCode);
            }
            this.setPosition(this.x, this.y);
            if(onLoaded != null)
                onLoaded();
        });
    }
}

interface CritterPrototype {
    name: string;
    animationCodes: string[];
}

export class CritterData {
    public static Critters: CritterPrototype[] = [];

    public static getCritterInstance(obj: FRMObject, name: string) {
        let proto = CritterData.Critters.filter(x => x.name == name)[0];
        if(proto == null) {
            alert('Unable to find critter with the name "'+proto+'"');
            return null;
        }

        return new Critter(obj, proto.name, proto.animationCodes);
    }

    public static Load(onLoaded: () => void) {
        MetaData.LoadXHR(() => onLoaded());
    }
}