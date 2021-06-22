import { Critter } from "../critter";
import { DebugManager } from "../debug";
import { CanvasContainer } from "../rendering";
import { FrameData, FRMData, FRMLoader } from "../resources";
import { FalloutPAL } from "./pal";

export interface Coords {
    x: number;
    y: number;
};

interface AdjustedCoords {
    dir: number;
    offset: Coords;
}

// https://fodev.net/files/fo2/frm.html
export class FRM {
    name: string;
    
    frmData: FRMData;
    frames: Frame[] = [];
    adjusted: AdjustedCoords[] = [];

    getAnimation(dir: number, loadedBy?: Critter) {
        if(isNaN(dir)) {
            dir = 0;
        }
        if(!this.hasBeenAdjusted(dir)) {
            this.adjustFrames(dir);
        }
        let frames = this.frames.filter(x => x.dir == dir);
        let anim = new FRMAnimation(loadedBy, this.name, frames, this.frmData.frameRate, dir);
        anim.adjustment = this.getDirAdjustment(dir);
        return anim;
    }

    hasBeenAdjusted(dir: number) {
        return this.getDirAdjustment(dir) != null;
    }

    getDirAdjustment(dir): AdjustedCoords {
        let adj = this.adjusted.filter(x => x.dir == dir);
        if(adj.length == 0) {
            return null
        }
        return adj[0];
    }

    getAllDirections() {
        let dirs: number[] = [];
        for(let f of this.frames) {
            if(dirs.indexOf(f.dir) == -1) {
                dirs.push(f.dir);
            }
        }
        return dirs;
    }

    setAdjusted(dir: number, offsetX: number, offsetY: number) {
        let adj = this.getDirAdjustment(dir);
            if(adj == null) {

            this.adjusted.push( { 
                dir: dir,
                offset: { x: offsetX, y: offsetY }
            });
        } else {
            adj.offset.x = offsetX;
            adj.offset.y = offsetY;
        }
    }

    /**
     * 
     * @param shiftX Amount to shift all frames.
     * @param shiftY Amount to shift all frames.
     */
    calculatePositions(dir?: number, offsetX?: number, offsetY?: number) {
        let spotX = 0;
        let spotY = 0;

        let frames = this.frames;
        if(dir != null) {
            frames = frames.filter(x => x.dir == dir);
        }
        if(offsetX != null && offsetY != null) {
            this.setAdjusted(dir, offsetX ?? 0, offsetY ?? 0);
        }

        for(let frame of frames)
        {
            //console.log('Calculating position for frame ' + frame.index);
            if (frame.index == 0) {
                let center = frame.centerPoint();
                spotX = center.x + (offsetX ?? 0);
                spotY = center.y + (offsetY ?? 0);
            }
            spotX += frame.offsetX;
            spotY += frame.offsetY;
            
            frame.spotX = spotX;
            frame.spotY = spotY;
            frame.x = spotX - Math.floor(frame.width / 2);
            frame.y = spotY - frame.height;

            let dirShift = this.frmData.getDirShiftForDir(frame.dir);

            frame.x = frame.x + dirShift.coords.x;
            frame.y = frame.y + dirShift.coords.y;

            // console.log('dir = '+(dir??0)+', frame.x = ' + frame.x + ', frame.y = ' + frame.y);
        }
    }
    
    adjustFrames(dir: number) {
        let negativeMaxX: number = 0;
        let negativeMaxY: number = 0;

        for(let frame of this.frames.filter(x => x.dir == dir))
        {
            negativeMaxX = Math.min(negativeMaxX, frame.x);
            negativeMaxY = Math.min(negativeMaxY, frame.y);
        }

        // console.log('negativeMax: x=' +negativeMaxX + ', y=' + negativeMaxY);
        if(negativeMaxX < 0 || negativeMaxY < 0) {
            this.calculatePositions(dir, Math.abs(negativeMaxX), Math.abs(negativeMaxY));
        }
    }

    loadFrames(dataFrames: FrameData[]) {
        for(let df of dataFrames) {
            let f = new Frame();
            f.index=df.index;
            f.pixels = df.pixels;
            f.width = df.width;
            f.height = df.height;
            f.offsetX = df.offsetX;
            f.offsetY = df.offsetY;
            f.dir = df.dir;
            this.frames.push(f);
        }
    }

    static Load(name: string, hasLoaded?: (frm: FRM) => void) {
        FRMLoader.Get(name, (frmData: FRMData) => {
            let frm = new FRM();
            frm.name = name;
            frm.frmData = frmData;
            frm.loadFrames(frmData.frameData);
            frm.calculatePositions();
            if(hasLoaded != null) {
                hasLoaded(frm);
            }
        });
    }
}

class Frame {
    index: number;

    width: number;
    height: number;

    offsetX: number;
    offsetY: number;

    pixels: Uint8Array;

    dir: number;

    x: number;
    y: number;

    spotX: number;
    spotY: number;

    img: ImageData;

    frm: FRM;

    imageData(ctx: CanvasRenderingContext2D) {
        if(this.img != null) {
            return this.img;
        }
        this.img = ctx.createImageData(this.width, this.height);
        let pixel=0;
        for (let i = 0; i < this.img.data.length; i += 4) {
            let cur = this.pixels[pixel++];
            let rgb = FalloutPAL.RGB(cur);
            // https://falloutmods.fandom.com/wiki/Pal_files#colorIndex_.3E.3E_rgb
            this.img.data[i + 0] = rgb[0] * 4;  // R value, *4 = high noon
            this.img.data[i + 1] = rgb[1] * 4;  // G value
            this.img.data[i + 2] = rgb[2] * 4;  // B value
            this.img.data[i + 3] = cur == 0 ? 0 : 255;  // A value
        }

        return this.img;
    }

    // The center of the image data is the center of the bottom edge of the frame.
    centerPoint() {
        return { 
            x: Math.floor(this.width / 2),
            y: this.height
        };
    }

    render(renderX: number, renderY: number, ctx: CanvasRenderingContext2D) {
       ctx.putImageData(this.imageData(ctx), renderX, renderY);
    }
}

export class FRMAnimation {
    frameRate: number;
    frmName: string;

    parent: Critter;

    shiftX: number;
    shiftY: number;

    adjustment: AdjustedCoords;

    constructor(parent, frmName: string, frames: Frame[], frameRate: number, dir: number) {
        this.parent = parent;
        this.frmName = frmName;
        this.frameRate = frameRate;
        this.targetdt = (1000/this.frameRate);
        this.frames = frames;
        this.current = 0;
        this.dir = dir;
    }

    frames: Frame[];

    current: number;
    isRunning: boolean;
    dir: number;

    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;
    private onRenderedFrame: (anim: FRMAnimation) => void;
    onCreateCanvas: (canvas: HTMLCanvasElement) => void;
    onFirstFrameRendered: (anim: FRMAnimation) => void;
    onLastFrameRendered: (anim: FRMAnimation) => void;

    dt: number = 0;
    targetdt: number;

    firstFrameCenterPoint() {
        return this.frames[0].centerPoint();
    }

    offsetFromCenterPoint(frame: Frame) {
        let center = this.firstFrameCenterPoint();
        let x = center.x - frame.x;
        let y = center.y - frame.y;
        return { x: x, y: y }
    }

    public adjustedCenterPoint() {
        let center = this.firstFrameCenterPoint();

        let adjX = this.adjustment?.offset?.x ?? 0;
        let adjY = this.adjustment?.offset?.y ?? 0;
        return { x: center.x + adjX, y: center.y + adjY }
    }

    public positionCoordToPixels(x: number, y: number): Coords {
        let _x = parseInt(x.toString());
        let _y = parseInt(y.toString());

        let adjusted = this.adjustedCenterPoint();
        return { 
            x: _x + (this.canvas.width - adjusted.x) - this.canvas.width, 
            y: _y + (this.canvas.height - adjusted.y) - this.canvas.height  
        };
    }

    public getCanvasRenderOffset(frame: Frame) {
        return { x: frame.x, y: frame.y }
    }

    public registerOnRenderedFrame(func: (anim: FRMAnimation) => void) {
        if(DebugManager.onRenderedCount > 0) {
            console.log('LEAK!');
        }
        DebugManager.onRenderedCount++;
        this.onRenderedFrame = func;
    }

    public unregisterOnRenderedFrame() {
        DebugManager.onRenderedCount--;
        this.onRenderedFrame = null;
    }

    public renderFrame(num: number) {
        if(this.frames[num] == null) {
            return;
        }
        let canvasPos = this.getCanvasRenderOffset(this.frames[num]);
        this.frames[num].render(canvasPos.x, canvasPos.y, this.getRenderingContext());
    }

    public changeFrame(delta: number) {
        let frame = this.current + delta;
        if(frame < 0) {
            frame = (this.frames.length-1)-frame-1;
        }
        frame = frame % (this.frames.length);
        this.current = frame;
        if(this.frames[frame] == null) {
            return;
        }
        this.renderFrame(frame);
        
        if(frame==0 && this.onFirstFrameRendered != null) {
            this.onFirstFrameRendered(this);
        }
        if(frame==this.frames.length-1 && this.onLastFrameRendered != null) {
            this.onLastFrameRendered(this);
        }

        if(this.onRenderedFrame != null) {
            this.onRenderedFrame(this);
        }
    }

    public animate(dt: number) {
        if(!this.isRunning) {
            return;
        }
        this.dt+=dt;

        if(this.dt > this.targetdt) {
            this.dt = 0;
            this.changeFrame(1);
        }
    }
    
    public setFrameRate(framesPerSecond: number) {
        this.frameRate = framesPerSecond;
        this.targetdt = (1000/this.frameRate);
        this.isRunning = true;
    }

    private canvasSizeNeeded() {
        if(this.frames == null) {
            return null;
        }
        let minWidth = 0;
        let minHeight = 0;

        for(let f of this.frames)
        {
            minWidth = Math.max(minWidth, f.x + f.width);
            minHeight = Math.max(minHeight, f.y + f.height);
        }
        
        return { height: minHeight, width: minWidth };
    }

    private createRenderingContext() {
        let size = this.canvasSizeNeeded();
        if(size == null) {
            return;
        }

        this.canvas = CanvasContainer.createCanvas(this.parent.parentObject.id, size.width, size.height);
        if(this.onCreateCanvas != null) {
            this.onCreateCanvas(this.canvas);
        }
    }

    public getCanvas() {
        if(this.canvas == null) {
            this.createRenderingContext();
        }
        return this.canvas;
    }

    private getRenderingContext() {
        if(this.canvas == null) {
            this.createRenderingContext();
        }

        this.ctx = this.canvas.getContext('2d');

        this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
        return this.ctx;
    }

    public destroy() {
        this.stop();
        this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height);
        CanvasContainer.destroyCanvas(this.canvas)
        this.canvas = null;
    }
    
    public start() {
        if(this.parent == null) {
            return;
        }

        this.getRenderingContext();
        this.renderFrame(0);
        this.isRunning = true;
    }
    
    public stop() {
        this.isRunning = false;
    }

}