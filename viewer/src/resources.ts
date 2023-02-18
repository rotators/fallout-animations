import { CritterData } from "./critter";
import { Coords } from "./fallout/frm";
import { StreamReader } from "./stream";

export interface FrameData {
    index: number;
    dir: number;

    width: number;
    height: number;

    offsetX: number;
    offsetY: number;

    pixels: Uint8Array;
}

export interface DirShift {
    coords: Coords;
    dir: number;
}

// https://fodev.net/files/fo2/frm.html
export class FRMData {
    // not in the file
    filename: string;
    numberOfDir: number;
    // in the file
    version: number;      // Version number of the FRM format
    frameRate: number;    // FPS - Frames per second rate of the animation 
    actionFrame: number;  // Action frame - Frame of the animation on which actions occur (shot, open doors, etc.)
    framesPerDir: number; 

    dirShift: DirShift[] = [];

    frameData: FrameData[] = [];
    
    constructor(filename: string, stream: StreamReader) {
        this.filename = filename;
        this.numberOfDir = this.isDirSpecificFRM() ? 1 : 6;

        try {
            this.loadHeader(stream);
        } catch {
            alert('['+filename+'] Failed to parse header');
        }
        this.loadFrames(stream);
    }

    // *.fr
    isDirSpecificFRM() {
        return this.filename.toLocaleLowerCase().indexOf('.frm') == -1;
    }
    
    getDirShiftForDir(dir: number) {
        return this.dirShift.filter(x => x.dir == dir)[0];
    }

    getDirection(dir: number) {
        if(!this.isDirSpecificFRM()) {
            return dir;
        }
        let lower = this.filename.toLocaleLowerCase();
        if(lower.indexOf('.fr0') != -1) return 0;
        if(lower.indexOf('.fr1') != -1) return 1;
        if(lower.indexOf('.fr2') != -1) return 2;
        if(lower.indexOf('.fr3') != -1) return 3;
        if(lower.indexOf('.fr4') != -1) return 4;
        if(lower.indexOf('.fr5') != -1) return 5;
        return 0;
    }

    loadHeader(stream: StreamReader) {
        this.version = stream.uint32();
        this.frameRate = stream.uint16();
        this.actionFrame = stream.uint16();
        this.framesPerDir = stream.uint16();

        for(let i = 0; i < this.numberOfDir; i++) {
            this.dirShift.push({
                coords: { x: stream.int16(), y: 0 },
                dir: this.getDirection(i)
            });
        }
        for(let i = 0; i < this.numberOfDir; i++) {
            let dir = this.getDirection(i);
            let ds = this.dirShift.filter(x => x.dir == dir)[0];
            ds.coords.y = stream.int16();
        }
    }

    loadFrames(stream: StreamReader) {
        stream.offset = 0x3E;
        for(let dir=0; dir < this.numberOfDir; dir++) {
            for(let i=0;i<this.framesPerDir;i++) {
                try {
                    let width = stream.uint16();
                    let height = stream.uint16();
                    let numPixels = stream.uint32();
                    let x = stream.int16();
                    let y = stream.int16();
                    let frmPixels = stream.uint8Buffer(numPixels);
                    this.frameData.push({
                        height: height,
                        width: width,
                        offsetX: x,
                        offsetY: y,
                        pixels: frmPixels,
                        dir: this.getDirection(dir),
                        index: i
                    });
                } catch {
                    alert('['+this.filename+'] Failed to load frame ' + i+1 + ', dir='+dir + ', offset=' + stream.offset);
                    return;
                }
            }
        }
    }
}

export class MetaData {
    static LoadXHR(onLoaded: () => void) {
        let r = new XMLHttpRequest();
        r.open("GET", 'https://rotators.github.io/fallout-animations/fallout-animations.json', true);
        r.responseType = 'json';
        r.onload = _ => {
            let anims = r.response['fallout-animations']['frm'];
            for(let critter in anims) {
                let codes = anims[critter];
                    CritterData.Critters.push({
                        animationCodes: codes,
                        name: critter,
                    });
                }
                if(onLoaded != null) {
                    onLoaded();
                }
            }
            r.send();
        }
}

class Resources {
    static FRM: FRMData[] = [];

    static isLocal() {
        return window.location.hostname.indexOf('localhost') != -1;
    }

}

export class FRMLoader {
    static Load(filename: string, onLoad: (stream: StreamReader) => void) {
        let url = Resources.isLocal() ? "http://localhost:8080/frm/" : "anims/";
        return this.FromURL(url, filename, onLoad)
    }

    private static FromURL(baseURL: string, filename: string, onLoad: (stream: StreamReader) => void) {
        XHRArrayBuffer.Load(baseURL + filename, onLoad);
    }

    static Get(filename: string, onLoad: (frmData: FRMData) => void) {
        let loaded = Resources.FRM.filter(x => x.filename == filename);
        if(loaded.length>0) {
            onLoad(loaded[0]);
            return;
        }

        this.Load(filename, (stream) => {
            let data = new FRMData(filename, stream);
            Resources.FRM.push(data);
            onLoad(data);
        });
    }
}


class XHRArrayBuffer {
    static Load(url: string, onLoad: (stream: StreamReader) => void) {
        let r = new XMLHttpRequest();
        r.open("GET", url, true);
        r.responseType = "arraybuffer";

        r.onload = (oEvent) => {
            onLoad(new StreamReader(r.response, 0));
        }

        r.send();
    }

}