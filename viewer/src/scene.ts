import { Critter } from "./critter";
import { Direction } from "./fallout/consts";
import { FRMAnimation } from "./fallout/frm";
import { FRMObject, ObjectRenderer } from "./frmobject";
import { CanvasContainer } from "./rendering";
import { FRMData } from "./resources";
import { GVars } from "./state";
import { VM } from "./vm";

export interface animationInfo {
    frameInfo: string;
    frameName: string;
}

export interface critterInfo {
    animationCode: string;
    critterName: string;
    dir: Direction;
    posX: number;
    posY: number;
    fps: number;
}

// Scene + interactions
export class World {
    selectedObject: FRMObject;
    objectRenderer: ObjectRenderer;
    vm: VM;

    onCritterSelected: () => void;
    onUpdateCritters: () => void
    onCritterInfoChanged: (info: critterInfo) => void;
    onFramerateChanged: (framerate) => void;
    onAnimationInfoChanged: (info: animationInfo) => void;
    onAnimationCodeChanged: (code: string) => void;
    onEnvironmentChanged: (env: string) => void;
    onLoaded: () => void;

    environment: string;

    constructor() {
        this.objectRenderer = new ObjectRenderer();
        this.objectRenderer.startObjectRendering();
        this.environment = GVars.environment.get('intersection');
        this.vm = new VM(this);
        CanvasContainer.init(document.getElementById('canvas-container'));
        Critter.newAnimationLoaded = (code) => {
            this.eventUpdateCritters();
        }
        FRMObject.onFRMLoaded = (id, frmData: FRMData) => {
            this.eventUpdateCritters();
        };
        FRMObject.onFRMPosChanged = (id, x, y) => {
            this.eventUpdateCritters();
        };
        FRMObject.onFRMCanvasDoubleClicked = (id) => {
            if(this.selectedObject.id == id) {
                return;
            }
            let objs = this.objectRenderer.objects.filter(x => x.id == id);
            if(objs.length > 0) {
                this.selectObject(objs[0]);
            }
        }

        this.loaded();
    }

    loaded() {
        if(GVars.test.get(0) == 0) {
            let obj = this.createCritter({
                critterName: GVars.critter.get('Female_YellowPants_MetalArmor'),
                animationCode: GVars.anim.get('HA'),
                dir: GVars.dir.get(0),
                fps: GVars.fps.get(10),
                posX: GVars.posX.get(250),
                posY: GVars.posY.get(175)
            });

            if(GVars.fpsLock.get(0) == 1) {
                obj.setNativeFPS(true);
            }

            
        }

        if(GVars.test.get(0) == 1) {
            this.setEnvironment('intersection');
            let obj = this.objectRenderer.createObject('Male_BlackDude_CombatArmor');
            obj.setPosition(276, 233);
            obj.setFrameRate(10);
            obj.critter.walk(2, 3);
            obj.critter.delay(500);
            obj.critter.fire(2);
            obj.critter.delay(3500);
            obj.critter.walk(0, 3);
            obj.critter.delay(500);
            obj.critter.walk(5, 3);
            obj.critter.doAnimation('BL', 5, 5, true);
    
            let yp = this.objectRenderer.createObject('Female_YellowPants_MetalArmor');
            
            yp.setAnimation('HA', 5, () => {
                yp.setPosition(488, 437);
                yp.critter.currentAnimation.stop();
                yp.critter.currentAnimation.renderFrame(0);
            });
    
            yp.critter.delay(3800);
            yp.critter.doAnimation('HE', 5, 50, false);
            yp.critter.delay(4000);
            yp.critter.walk(5, 7);
            yp.critter.fire(0);
        }
        if(GVars.test.get(0) == 2) {
            this.objectRenderer.clearObjects();
                for(let i=0;i<900;i++) {
                
                let yp = this.objectRenderer.createObject('Female_YellowPants_MetalArmor');
                yp.setAnimation('IJ', 2, () => {
                    yp.dir = 0;
                    yp.setPosition(1+i, 1+i);
                    yp.setFrameRate(10);
    
                });
            }
        }
        if(GVars.test.get(0) == 3) {
            this.vm.Process('12intersection$0Male_BlackDude_CombatArmor$RD$03150205000100103000000010000000000000Male_BlackDude_CombatArmor$BD$03150205000100103001600010000000000004');
        }

        if(GVars.test.get(0) == 4) {}
           
    }

    environmentImage() {
        if(this.environment == 'empty' || this.environment == null) {
            return '';
        }
        return 'environments/'+ this.environment + '.png';
    }

    critterStateChanged() {
        let cr = this.selectedObject.critter;
        let obj = this.selectedObject;
        GVars.anim.set(cr.currentCode);
        GVars.dir.set(obj.dir);
        GVars.critter.set(cr.name);
        this.onCritterSelected();
        this.eventUpdateCritters();
    }

    generateCodeState() {
        return this.objectRenderer.generateCodeState();
    }

    getSelectedAnimation() {
        return this.selectedObject?.critter?.currentAnimation;
    }

    setAsSelected(obj: FRMObject) {
        obj.isSelected = true;
        if(obj.critter != null) {
            GVars.fpsLock.set(obj.useNativeFramerate ? 1 : 0);
        }

        this.monitorObj(obj);
        obj.setDraggable(true, (x, y) => this.setPositionInfo(x, y));
        this.selectedObject = obj;
        this.critterStateChanged();
    }

    unselect(obj: FRMObject) {
        if(obj == null) {
            return;
        }

        obj.onDirChanged = null;
        obj.setDraggable(false);
        obj.isSelected = false;
        if(obj.critter != null) { 
            obj.unregisterAnimationCodeChanged();
            obj.unregisterOnRenderedFrame();
        }
    }

    createCritter(critterInfo: critterInfo) {
        let obj = this.objectRenderer.createObject(critterInfo.critterName, critterInfo.fps);
        if(obj != null) {
            obj.setAnimation(critterInfo.animationCode, critterInfo.dir, () => {
                obj.setPosition(critterInfo.posX, critterInfo.posY);
                obj.setDirection(critterInfo.dir);
                this.selectObject(obj);
            });
        }
        this.eventUpdateCritters();
        return obj;
    }

    eventUpdateCritters() {
        if(this.onUpdateCritters != null) {
            this.onUpdateCritters();
        }
    }

    createDefaultCritter() {
        let obj = this.objectRenderer.createObject('Female_YellowPants_MetalArmor');
        obj.setAnimation('HA', 0, () => {
            obj.setPosition(320, 240);
            obj.setDirection(0);
            this.selectObject(obj);
        });
        this.eventUpdateCritters();
    }

    clearObjects() {
        this.selectedObject = null;
        this.objectRenderer.clearObjects();
    }

    deleteObjectId(id: number) {
        let obj = this.objectRenderer.objects.filter(x => x.id == id);
        if(obj.length>0) {
            this.deleteObject(obj[0]);
            return true;
        }
        return false;
    }

    deleteObject(o: FRMObject) {
        this.objectRenderer.deleteObject(o);
    }

    selectObject(obj: FRMObject) {
        this.unselect(this.selectedObject);
        this.setAsSelected(obj);
    }

    setCritter(critter: string) {
        if(this.selectedObject == null) {
            return;
        }

        this.selectedObject.changeCritter(critter);
    }

    setAnimation(animation: string) {
        this.selectedObject.setAnimation(animation, this.selectedObject.dir, () => {
            this.critterStateChanged();
        });
    }
    
    setSelectedFramerate(fps: number) {
        this.selectedObject.setFrameRate(fps);
        GVars.fps.set(fps);
    }

    setDirection(dir: number) {
        this.selectedObject.setDirection(dir);
    }

    rotateObject(delta: number) {
        if(this.selectedObject == null || this.selectedObject.critter == null) {
            return;
        }
        let dir = this.selectedObject.dir;
        dir = (dir+delta) % 6;
        if(dir == -1) {
            dir = 5;
        }
        this.setDirection(dir);
    }

    renderFrameDelta(delta: number) {
        let anim = this.getSelectedAnimation();
        if(anim == null) {
            return;
        }
        anim.changeFrame(delta);
    }

    setPositionX(x: number) {
        this.selectedObject.setPosition(x, this.selectedObject.y);
    }

    setPositionY(y: number) {
        this.selectedObject.setPosition(this.selectedObject.x, y);
    }

    setEnvironment(environment: string) {
        this.environment = environment;
        if(this.onEnvironmentChanged != null) {
            this.onEnvironmentChanged(environment);
        }
        
        GVars.environment.set(environment);
        this.onEnvironmentChanged(environment);
    }

    setPositionInfo(x: number, y: number) {
        this.critterStateChanged();
        GVars.posX.set(x);
        GVars.posY.set(y);
    }

    monitorObj(o: FRMObject) {
        o.registerOnAnimationCodeChanged(code => {
            if(this.onAnimationCodeChanged != null) {
                GVars.anim.set(code);
                this.onAnimationCodeChanged(code);
            }
        });

        o.onFramerateChanged = (framerate) => {
            this.onFramerateChanged(framerate);
        }

        o.onDirChanged = (dir) => {
            this.critterStateChanged();
        }

        o.registerOnRenderedFrame((anim) => {
            this.updateAnimationInfo(anim);
        });
        if(o.critter.currentAnimation != null) {
            this.updateAnimationInfo(o.critter.currentAnimation);
        }
    }

    updateAnimationInfo(anim: FRMAnimation) {
        this.onAnimationInfoChanged({
            frameInfo: anim.current + 1 + ' / ' + anim.frames.length,
            frameName: anim.frmName
        });
    }
}