import { FRMObject } from "./frmobject";
import { World } from "./scene";
import { UI } from "./ui";


export enum OPCode {
    createObject,
    clearObjects,
    setEnvironment,
    setAnimationState,
    refreshSelected
    //load,
    //store
}

enum DataType {
    String,
    Int,
    Critter
}

export class VM {
    world: World;
    retValue: any;

    byteCode: string;
    byteCodeIdx: number;

    currentObject: FRMObject;

    wait: boolean;

    constructor(world: World) {
        this.world = world;
    }

    public PopNum() {
        let num = this.byteCode.substring(this.byteCodeIdx, this.byteCodeIdx+4);
        this.IncIndex(4);
        //console.log('popnum:' + num);
        
        return parseInt(num);
    }

    public SetIndex(pos: number) {
        this.byteCodeIdx=pos;
        //console.log('idx:'+this.byteCodeIdx);
    }

    public IncIndex(pos: number) {
        this.byteCodeIdx+=pos;
        //console.log('idx:'+this.byteCodeIdx);
    }

    public PopString() {
        let idx= this.byteCode.indexOf('$', this.byteCodeIdx);
        let str = this.byteCode.substring(this.byteCodeIdx, idx);
        this.SetIndex(idx+1);
        //console.log('popstr:' + str);
        return str;
    }

    public EmitString(str: string) {
        return str.trim()+'$';
    }

    public EmitNum(num: number) {
        let numStr = num.toString();
        if(numStr.length > 4) {
            throw('num length > 4:' + numStr);
        }

        if(numStr.length <= 4) {
            for(let i=numStr.length;i<4;i++) {
                if(num<0) {
                    numStr = numStr.slice(0,1) + '0' + numStr.slice(1);
                } else {
                    numStr = '0'+numStr;
                }
            }
        }
        return numStr;
    }

    public async Process(byteCode: string) {
        //console.log(byteCode.length);
        this.byteCodeIdx=0;
        this.byteCode = byteCode;
        while(this.byteCodeIdx != this.byteCode.length) {
            await this.HandleOP(parseInt(this.byteCode[this.byteCodeIdx]) as unknown as OPCode);
        }
    }

    public async HandleOP(op: OPCode) {
        this.IncIndex(op.toString().length);
        //console.log('op:' + op);
        switch(op) {
            case OPCode.createObject: await this.createObject(this.PopString(), this.PopString(), this.PopNum(), this.PopNum(), this.PopNum(), this.PopNum()); break;
            case OPCode.clearObjects: this.clearObjects(); break;
            case OPCode.setEnvironment: this.setEnvironment(this.PopString()); break;
            case OPCode.setAnimationState: this.setAnimationState(this.PopNum(), this.PopNum(), this.PopNum(), this.PopNum(), this.PopNum()); break;
            case OPCode.refreshSelected: this.refreshSelected(); break;
            default: throw('Unknown opcode:' + parseInt(op));
        }
    }

    public setAnimationState(frame: number, isRunning: number, cycleDir: number, cycleAnim: number, useNativeFramerate: number) {
        this.currentObject.critter.cycleDir = cycleDir == 1;
        this.currentObject.critter.cycleAnimation = cycleAnim == 1;
        this.currentObject.critter.currentAnimation.current = frame;
        this.currentObject.critter.currentAnimation.renderFrame(frame);
        this.currentObject.critter.currentAnimation.isRunning = isRunning == 1;
        this.currentObject.critter.useNativeFramerate = useNativeFramerate == 1;
    }

    public refreshSelected() {
        this.world.selectObject(this.currentObject);
    }

    public setEnvironment(env: string) {
        this.world.setEnvironment(env);
    }

    public clearObjects() {
        this.world.objectRenderer.suspendObjectRendering();
        this.world.clearObjects();
        this.world.objectRenderer.startObjectRendering();
        this.world.onUpdateCritters();
    }

    public async createObject(name: string, code: string, x: number, y: number, dir: number, fps: number) {
        let obj = this.world.objectRenderer.createObject(name);

        obj.setAnimation(code, 0, () => {
            obj.setPosition(x, y);
            obj.setDirection(dir);
            obj.setFrameRate(fps);
        });
        while(obj?.critter?.currentAnimation == null) { await new Promise(r => setTimeout(r, 10)); }

        this.currentObject = obj;
    }

    public Compile(code: string) {
        this.byteCode = '';
        let idx = 0;
        while(idx < code.length) {
            let eol = code.indexOf(';', idx);
            let funcIdx = code.indexOf('(', idx);
            let funcEndIdx = code.indexOf(')', idx);
            let func = code.substring(idx, funcIdx).trim();

            let args = code.substring(funcIdx+1, funcEndIdx);

            this.byteCode += this.FuncToOp(func);
            this.OpArgs(this.FuncToOp(func), args.split(','));

            idx=eol+1;
        }
    }

    public OpArgs(op: OPCode, args:string[]) {
        if(op == OPCode.createObject) {
            this.byteCode+=this.EmitString(args[0]);
            this.byteCode+=this.EmitString(args[1]);
            this.byteCode+=this.EmitNum(parseInt(args[2]));
            this.byteCode+=this.EmitNum(parseInt(args[3]));
            this.byteCode+=this.EmitNum(parseInt(args[4]));
            this.byteCode+=this.EmitNum(parseInt(args[5]));
        } else if(op == OPCode.setEnvironment) {
            this.byteCode+=this.EmitString(args[0]);
        } else if(op == OPCode.setAnimationState) {
            this.byteCode+=this.EmitNum(parseInt(args[0]));
            this.byteCode+=this.EmitNum(parseInt(args[1]));
            this.byteCode+=this.EmitNum(parseInt(args[2]));
            this.byteCode+=this.EmitNum(parseInt(args[3]));
            this.byteCode+=this.EmitNum(parseInt(args[4]));
        }
    }

    public FuncToOp(func: string) {
        switch(func) {
            case 'setEnvironment': return OPCode.setEnvironment;
            case 'createObject': return OPCode.createObject;
            case 'clearObjects': return OPCode.clearObjects;
            case 'setAnimationState': return OPCode.setAnimationState;
            case 'refreshSelected': return OPCode.refreshSelected;
            default: throw('Unknown func: ' + func);
        }
    }
}