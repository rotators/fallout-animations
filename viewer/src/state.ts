import * as React from "react";

export class GlobalVariable<T> {
    share: boolean;
    name: string;
    key: string;
    param: string;
    val: T;

    constructor(key: string, param: string) {
        this.key = key;
        this.param = param;
        this.share = localStorage.getItem(this.key+'_share') == '1';

        let urlParam = GVars.urlParams.find(x => x.key == this.param);
        if(urlParam != null) {
            this.set(urlParam.value as unknown as T);
        }
    }

    public toggleShare(reactPage: React.Component) {
        this.share = !this.share;
        this.setShare();
        reactPage.forceUpdate();
    }

    public setShare() {
        localStorage.setItem(this.key+'_share', this.share ? '1' : '0');
    }

    public get(def: T): T {
        let r = localStorage.getItem(this.key) as unknown as T;
        if(r == null) {
            this.set(def);
            return def;
        }
        return r;
    } 

    public set(val: T) {
        localStorage.setItem(this.key, val as unknown as string);
    }
}

class Param {
    key: string;
    value: string;
}

export class GVars {
    static backgroundColor: GlobalVariable<string>;
    static textColor: GlobalVariable<string>;
    static posX: GlobalVariable<number>;
    static posY: GlobalVariable<number>;
    static environment: GlobalVariable<string>;
    static dir: GlobalVariable<number>;
    static fps: GlobalVariable<number>;
    static fpsLock: GlobalVariable<number>;
    static anim: GlobalVariable<string>;
    static critter: GlobalVariable<string>;
    static setting: GlobalVariable<number>;
    static mode: GlobalVariable<number>;

    static test: GlobalVariable<number>;

    static uiShowPosition: GlobalVariable<number>;
    static uiShowShare: GlobalVariable<number>;

    static urlParams: Param[] = [];

    public static allGVars: GlobalVariable<any>[];

    public static init() {
        this.parseParams();
        if(this.urlParams.findIndex(x => x.key == 'clear_localstorage') != -1) {
            let clearKeys = ['obj_x', 'obj_y', 'obj_dir', 'obj_anim', 'obj_critter', 'obj_fps', 'obj_fps_lock', 'test'];
            clearKeys.map(x => localStorage.removeItem(x));
        }

        GVars.backgroundColor = new GlobalVariable<string>('html_backgroundcolor', 'bg');
        GVars.textColor = new GlobalVariable<string>('html_textcolor', 'tc');
        GVars.posX = new GlobalVariable<number>('obj_x', 'x');
        GVars.posY = new GlobalVariable<number>('obj_y', 'y');
        GVars.environment = new GlobalVariable<string>('obj_env', 'env');
        GVars.dir = new GlobalVariable<number>('obj_dir', 'dir');
        GVars.anim = new GlobalVariable<string>('obj_anim', 'anim');
        GVars.critter = new GlobalVariable<string>('obj_critter', 'cr');
        GVars.fps = new GlobalVariable<number>('obj_fps', 'fps');
        GVars.fpsLock = new GlobalVariable<number>('obj_fps_lock', 'fpsl');
        GVars.setting = new GlobalVariable<number>('ui_setting', '');
        GVars.test = new GlobalVariable<number>('test', 'test');
        GVars.allGVars = [GVars.backgroundColor, GVars.textColor, GVars.posX, GVars.posY, GVars.environment, GVars.dir, GVars.anim,
            GVars.critter, GVars.fps, GVars.fpsLock];
        GVars.uiShowShare = new GlobalVariable<number>('ui_share', '');
        GVars.uiShowPosition = new GlobalVariable<number>('ui_position', '');
        GVars.mode = new GlobalVariable<number>('mode', 'm');
    }

    public static GVARString(vars: GlobalVariable<any>[]) {
        let str = '';
        let first = true;
        for(let v of vars) {
            if(!first) {
                str+='&';
            }
            first = false;
            str+=v.param+'='+v.get('');
        }
        return str;
    }

    public static shareLink() {
        let url = location.protocol + '//' + location.host + location.pathname;
        
        let vars: GlobalVariable<any>[] = [];
        for(let v of GVars.allGVars) {
            if(v.share) {
                vars.push(v);
            }
        }

        return url + '?' + this.GVARString(vars);
    }

    public static parseParams() {
        let url = document.URL;
        let idx = url.indexOf('?');
        let args = url.substr(idx+1);
        let splArgs: string[] = [];
        if (args.indexOf('&') != -1) {
            splArgs = args.split('&');
        } else {
            splArgs = [args];
        }
        for (let arg of splArgs) {
            if (arg.indexOf('=') == -1) {
                continue;
            }
            let p = arg.split('=');
            GVars.urlParams.push({ key: p[0], value: p[1] })
        }
    }


}

