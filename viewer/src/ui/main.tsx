import * as React from 'react';
import { CritterData } from '../critter';
import { FalloutAnimation } from '../fallout/animation';
import { FRMObject } from '../frmobject';
import { CanvasContainer } from '../rendering';
import { World } from '../scene';
import { GlobalVariable, GVars } from '../state';

interface State {
    share: string; 

    // world
    environment: string;

    // settings
    settingPage: number;
    backgroundColor: string;
    textColor: string;
    uiShowPosition: boolean;
    uiShowSharelink: boolean;

    // critter data
    dir: number;
    critter: string;
    animation: string;
    posXStr: string;
    posYStr: string;
    fpsStr: string;
    fps: number;
    lockedFPS: boolean;
    cycleDir: boolean;
    cycleAnimation: boolean;
    
    // Animation info
    frameName: string;
    frameInfo: string;

    // script
    byteCode: string;
}

export class Main extends React.Component<{}, State> {

    world: World;
    constructor(props) {
        super(props);

        this.state = { 
            lockedFPS: GVars.fpsLock.get(0) == 1,
            backgroundColor:  GVars.backgroundColor.get('#ccc'),
            textColor: GVars.textColor.get('#fff'),
            byteCode: '',
            dir: GVars.dir.get(0),
            environment: GVars.environment.get('cave'),
            critter: GVars.critter.get('Female_YellowPants_MetalArmor'),
            animation: GVars.anim.get('HA'),
            fps: 0,
            fpsStr: '',
            frameInfo: '',
            frameName: '',
            settingPage: GVars.setting.get(1),
            posXStr: '',
            posYStr: '',
            cycleAnimation: false,
            cycleDir: false,
            uiShowPosition: GVars.uiShowPosition.get(1) == 1,
            uiShowSharelink: GVars.uiShowShare.get(1) == 1,
            share: ''
        }
    }

    componentDidUpdate(prevProps, prevState: State, snapshot) {
        if(prevState.backgroundColor != this.state.backgroundColor) {
            GVars.backgroundColor.set(this.state.backgroundColor);
            document.body.style.background = this.state.backgroundColor;
        }
        if(prevState.textColor != this.state.textColor) {
            GVars.textColor.set(this.state.textColor);
            document.body.style.color = this.state.textColor;
        }
    }

    onCritterSelected() {
        let obj = this.world.selectedObject;
        if(obj.getDir() != null) {
            let cr = obj.critter;
            this.setState({ 
                dir: obj.dir, 
                fps: obj.frameRate })
            if(cr.x != null) {
                this.setPosX(cr.x.toString());
                this.setPosY(cr.y.toString());   
            }
            GVars.fps.set(obj.frameRate);
        }
    }

    getCurrentAnimation() {
        let obj = this.selectedObj();
        if(obj == null 
        || obj.critter == null 
        || obj.critter.currentAnimation == null) {
            return null;
        }
        return obj.critter.currentAnimation;
    }

    critterOptions() {
        return Array.from(CritterData.Critters, (proto, i) => {
            return <option key={i} value={proto.name}>{proto.name}</option>
        });
    }

    critterAnimations() {
        let obj = this.selectedObj();
        if(obj == null) {
            return null;
        }

        return Array.from(obj.critter.animations, (anim, i) => {
            return <option key={i} value={anim}>{FalloutAnimation.CodeDescription(anim)}</option>
        });
    }

    renderSettings() {
        return <table id='settings-table' style={{width: '200px'}}><tbody>
                <tr>
                    <td colSpan={2}>
                    <select value={this.state.settingPage} onChange={e => { this.setState({ settingPage: parseInt(e.target.value) });
                        GVars.setting.set(parseInt(e.target.value));
                    }}>
                        <option value="0">UI Settings</option>
                        <option value="1">Share Settings</option>
                        <option value="2">Critters</option>
                        <option value="3">World</option>
                    </select>
                    </td>
                </tr>
                <tr><td colSpan={2}><hr style={{ backgroundColor: GVars.textColor.get('#fff') }}/></td>
                </tr>
                { this.state.settingPage == 0 &&
                    <>
                    <tr>
                        <td>Background</td>
                        <td><input style={{ marginLeft: '15px', width: '125px'}}  type="text" value={this.state.backgroundColor} onChange={e => this.setState({ backgroundColor: e.target.value }) } /></td>
                    </tr>
                    <tr>
                        <td>Text</td>
                        <td><input style={{ marginLeft: '15px', width: '125px'}}  type="text" value={this.state.textColor} onChange={e => this.setState({ textColor: e.target.value }) } /></td>
                    </tr>
                    <tr>
                        <td colSpan={2} style={{width: '5px', cursor: 'default'}}>
                        <label><input type="checkbox" checked={this.state.uiShowPosition} onChange={e => { this.setState({
                                uiShowPosition: e.target.checked
                            }); GVars.uiShowPosition.set(e.target.checked ? 1 : 0); }}  /><span style={{ marginLeft: '5px', position: 'relative', bottom: '2px'}}>Show position</span>
                        </label>
                    </td>
                    </tr>
                    <tr>
                        <td colSpan={2} style={{width: '5px', cursor: 'default'}}>
                        <label><input type="checkbox" checked={this.state.uiShowSharelink} onChange={e => { this.setState({
                                uiShowSharelink: e.target.checked
                            }); GVars.uiShowShare.set(e.target.checked ? 1 : 0); }} /><span style={{ marginLeft: '5px', position: 'relative', bottom: '2px'}}>Show sharelink</span></label>
                        </td>
                    </tr>
                    </>
                }
                { this.state.settingPage == 1 &&
                    <>
                    {this.shareCheckbox(GVars.backgroundColor, 'HTML background color')}
                    {this.shareCheckbox(GVars.textColor, 'HTML text color')}
                    {this.shareCheckbox(GVars.critter, 'Critter')}
                    {this.shareCheckbox(GVars.anim, 'Animation')}
                    {this.shareCheckbox(GVars.dir, 'Direction')}
                    {this.shareCheckbox(GVars.environment, 'Environment')}
                    {this.shareCheckbox(GVars.posX, 'Pos X')}
                    {this.shareCheckbox(GVars.posY, 'Pos Y')}
                    {this.shareCheckbox(GVars.fps, 'FPS')}
                    {this.shareCheckbox(GVars.fpsLock, 'FPS lock')}
                    </>
                }
                { this.state.settingPage == 2 &&
                    <>
                        {Array.from(this.critters(), (o,i) => {
                            return <tr key={i}><td><a href="#" onClick={(e => { e.preventDefault(); this.selectCritter(o); })}>{FalloutAnimation.CodeDescription(o.critter.currentCode)} [{o.critter.x},{o.critter.y}]</a></td><td>
                                {o.isSelected ? null : <button onClick={() => this.deleteCritter(o)}>x</button>}</td></tr>
                        })}
                        <tr><td colSpan={2}><hr style={{ backgroundColor: GVars.textColor.get('#fff') }}></hr></td></tr>
                        <tr><td colSpan={2}><button onClick={(e => { e.preventDefault; this.addCritter(); })}>+</button></td></tr>
                        <tr></tr>
                        <tr><td colSpan={2}><button onClick={() => this.dumpState()}>Dump State</button></td></tr>
                    </>
                }
                { this.state.settingPage == 3 &&
                    <>
                        <tr>
                            <td>Environment:</td>
                            <td>
                                <select value={this.state.environment} onChange={e => this.setEnvironment(e.target.value)}>
                                    <option value="empty">Empty</option>
                                    <option value="cave">Cave</option>
                                    <option value="cave2">Cave 2</option>
                                    <option value="desert">Desert</option>
                                    <option value="intersection">Intersection</option>
                                    <option value="junktown">Junktown</option>
                                    <option value="mine">Mine</option>
                                    <option value="outdoors">Outdoors</option>
                                    <option value="streets">Streets</option>
                                    <option value="temple">Temple</option>
                                </select>
                            </td>
                        </tr>
                    </>
                }
            </tbody>
        </table>
    }

    shareCheckbox(v: GlobalVariable<any>, name: string) {
        return <tr>
        <td style={{ width: '5px'}}><input type="checkbox" checked={v.share} onChange={() => v.toggleShare(this)}  /></td>
        <td style={{ cursor: 'default'}} onClick={() => v.toggleShare(this)}>{name}</td>
    </tr>
    }

    getVM() {
        return this.world.vm;
    }

    setDirection(dir: number) {
        this.world.setDirection(dir);
    }

    setAnimation(anim: string) {
        this.world.setAnimation(anim);
    }

    setEnvironment(env: string) {
        this.world.setEnvironment(env);
    }

    compile() {
        let vm = this.getVM();
        vm.Compile(this.state.byteCode);
        this.setState({ byteCode: vm.byteCode }) ;
    }

    exec() {
        let vm = this.getVM();
        vm.Process(this.state.byteCode);
    }

    deleteCritter(o: FRMObject) {
        this.world.deleteObject(o);
        this.forceUpdate();
    }

    addCritter() {
        this.world.createDefaultCritter();
        this.forceUpdate();
    }

    changeCritter(critter: string) {
        this.world.setCritter(critter);
        this.setState({ critter: critter });
    }

    selectCritter(o: FRMObject) {
        this.world.selectObject(o);
    }

    dumpState() {
        this.setState({ byteCode: this.world.generateCodeState() });
    }

    critters() {
        return this.world == null ? [] : this.world.objectRenderer.objects; 
    }

    currentAnimation() {
        return this.world.getSelectedAnimation();
    }

    setFrame(frame: number) {
        this.currentAnimation().changeFrame(frame);
    }

    setLockedFPS(locked: boolean) {
        let cr = this.world.selectedObject.critter;
        cr.setNativeFPS(locked);
        GVars.fpsLock.set(locked ? 1 : 0);
        if(GVars.fpsLock.share) {
            this.setState({ share: GVars.shareLink() });
        }
        this.setState({ lockedFPS: locked });
    }

    setPosX(x: string) {
        x = x.replace(/\D/g,'');
        let num = parseInt(x);
        if(!isNaN(num)) {
            this.world.setPositionX(num);
            GVars.posX.set(num);
        }
        this.setState({ posXStr: x });
    }

    setPosY(y: string) {
        y = y.replace(/\D/g,'');
        let num = parseInt(y);
        if(!isNaN(num)) {
            this.world.setPositionY(num);
            GVars.posY.set(num);
        }
        this.setState({ posYStr: y });
    }

    setCycleDir(enabled: boolean) {
        this.setState({
            cycleDir: enabled
        });

        let obj = this.selectedObj();
        obj.critter.setCycleDir(enabled);
    }

    setCycleAnimation(enabled: boolean) {
        this.setState({
            cycleAnimation: enabled
        });

        let obj = this.selectedObj();
        obj.critter.cycleAnimation = enabled;
    }

    hasSelectedObj() {
        return this.selectedObj() != null;
    }

    selectedObj() {
        return this?.world?.selectedObject;
    }

    nativeFPSText() {
        if(!this.hasSelectedObj()) {
            return '';
        }
        return 'Lock to native (' + this.selectedObj().critter.nativeFramerate() +')';
    }

    setFPS(fps: string) {
        fps = fps.replace(/\D/g,'');
        let num = parseInt(fps);
        if(!isNaN(num)) {
            this.setState({ fps: num  });
            this.world.setSelectedFramerate(num);
            GVars.fps.set(num);
        }
        this.setState({ fpsStr: fps })
    }

    updateFPS(fps: number) {
        this.setState({ fpsStr: fps.toString() });
    }

    animationControl() {
        let animation = this.currentAnimation();
        if(animation.isRunning) {
            animation.stop();
        } else {
            animation.start();
        }
        this.forceUpdate();
    }

    loaded() {
        return this.world != null && this.getCurrentAnimation() != null;
    }

    animationControlText() {
        if(!this.loaded()) {
            return '';
        }

        let currentAnimation = this.world.getSelectedAnimation();
        if(currentAnimation == null) {
            return '';
        }
        return currentAnimation.isRunning ? 'Stop animation' : 'Start animation';
    }

    environmentImage() {
        if(this.state.environment == 'empty' || this.state.environment == null) {
            return '';
        }
        return 'environments/'+ this.state.environment + '.png';
    }

    componentDidMount() {
        CanvasContainer.init(document.getElementById('canvas-container'));
        this.world = new World();
        this.world.onAnimationCodeChanged = (code) => {
            this.setState({animation: code});
        }
        this.world.onAnimationInfoChanged = (info) => {
            this.setState({frameInfo: info.frameInfo, frameName: info.frameName });
        }
        this.world.onFramerateChanged = (framerate) => {
            this.updateFPS(framerate.toString());
        };

        this.world.onEnvironmentChanged = (env) => {
            this.setState({ environment: env});
        };

        this.world.onCritterSelected  = () => {

            let obj = this.selectedObj();
            this.setState({
                cycleAnimation: obj.critter?.cycleAnimation ?? false,
                cycleDir: obj.critter?.cycleDir ?? false,
                fps: obj.frameRate,
                fpsStr: obj.frameRate.toString(),
                dir: obj.dir,
                animation: obj.critter.currentCode,
                posXStr: obj.x.toString(),
                posYStr: obj.y.toString()
            })
        };

        document.onkeypress = (ev: any) => {
            if(ev.key == ',') {
                this.world.rotateObject(-1);
            }
            if (ev.key == '.') {
                this.world.rotateObject(1);
            }
        };
    }

    render() {
        if(GVars.mode.get(0) == 2) {
           return <div style={{ margin: 'auto', width: '500px', clear: 'both' }}>
                <div id='canvas-container' style={{ position: 'relative', marginTop: '60px' }}>
                    <img src={this.environmentImage()}></img>
                </div>
            </div>
        }
        
        return <><div style={{textAlign: 'center' }}>
            <div style={{width: '500px', margin: 'auto' }}>
                <div style={{ textAlign: 'left', position: 'absolute', transform: 'translateX(-250px)' }}>
                    {this.renderSettings()}
                </div>
                <div style={{ float: 'left', textAlign: 'left', paddingBottom: '20px'}} >
                    <table>
                        <tbody>
                            <tr><td><label>Critter:</label></td>
                                <td>
                                    <select style={{ width: '250px'}} value={this.state.critter} onChange={e => this.changeCritter(e.target.value) }>
                                    {this.critterOptions()}
                                    </select>
                                </td>
                            </tr>
                            <tr><td><label>Animation:</label></td>
                                <td><select style={{ maxWidth: '250px' }} value={this.state.animation} onChange={e => this.setAnimation(e.target.value)}>{this.critterAnimations()}</select></td>
                            </tr>
                            <tr><td><label>Direction:</label></td>
                                <td>
                                    <select value={this.state.dir} onChange={e => this.setDirection(parseInt(e.target.value))}>
                                        <option value="0">NE</option>
                                        <option value="1">E</option>
                                        <option value="2">SE</option>
                                        <option value="3">SW</option>
                                        <option value="4">W</option>
                                        <option value="5">NW</option>
                                    </select>
                            </td>
                            </tr>
                            { this.state.uiShowPosition &&
                            <>
                                <tr>
                                    <td><label>Position X:</label></td>
                                    <td><input style={{ width: '50px' }}  type="text" value={this.state.posXStr} onChange={e => this.setPosX(e.target.value)} /></td>
                                </tr>
                                <tr>
                                    <td><label>Position Y:</label></td>
                                    <td><input style={{ width: '50px' }}  type="text" value={this.state.posYStr} onChange={e => this.setPosY(e.target.value) } /></td>
                                </tr>
                            </>
                            }
                            <tr>
                                <td><label>FPS:</label></td>
                                <td>
                                    <input style={{ width: '50px' }}  type="text" value={this.state.fpsStr} 
                                    onChange={e => this.setFPS(e.target.value) }  disabled={this.state.lockedFPS} />
                                    <label style={{ marginLeft: '5px', position: 'relative',  top: '2px'}}>
                                    <input type="checkbox" checked={this.state.lockedFPS} onChange={e => this.setLockedFPS(e.target.checked) } />
                                    <span style={{top: '-2px', position: 'relative' }}>{this.nativeFPSText()}</span>
                                    </label>
                                </td>
                            </tr>
                            { this.state.uiShowSharelink &&
                                <tr>
                                    <td><label>Share:</label></td>
                                    <td><input onChange={_ => {}} readOnly={true} style={{ width: '555px'}} type="text" value={GVars.shareLink()}></input></td>
                                </tr>
                            }
                        </tbody>
                        </table>
                        </div>
                        <div style={{ textAlign: 'left', position: 'absolute', transform: 'translateX(350px)' }}>
                        { this.state.frameName != '' &&
                        <>
                        <p>Animation information</p>
                        <table>
                            <tbody>
                                <tr>
                                    <td><label>File:</label></td>
                                    <td>{this.state.frameName}</td>
                                </tr>   
                                <tr>
                                    <td><label>Frame:</label></td>
                                    <td>{this.state.frameInfo}</td>
                                </tr>
                                <tr>
                                    <td colSpan={2}><button onClick={() => this.animationControl()}>{this.animationControlText()}</button></td>
                                </tr>
                                <tr>
                                    <td><button onClick={() => this.setFrame(-1)}>Prev</button></td>
                                    <td><button onClick={() => this.setFrame(1)}>Next</button>
                                    <label style={{ marginLeft: '3px', top: '2px', position: 'relative'}}><input type="checkbox" checked={this.state.cycleDir} onChange={e => this.setCycleDir(e.target.checked)} /><span style={{ marginLeft: '3px', position: 'relative', bottom: '2px'}}>Cycle dir</span></label>
                                    <label style={{ marginLeft: '3px', top: '2px', position: 'relative'}}><input type="checkbox" checked={this.state.cycleAnimation} onChange={e => this.setCycleAnimation(e.target.checked)} /><span style={{ marginLeft: '3px', position: 'relative', bottom: '2px'}}>Cycle animation</span></label></td>
                                </tr>
                            </tbody>
                        </table>
                        </>
                        }
                    </div>
            <div style={{ margin: 'auto', width: '500px', clear: 'both' }}>
                <div id='canvas-container' style={{ position: 'relative', marginTop: '60px' }}>
                    <img src={this.environmentImage()}></img>
                </div>
            </div>
            <div style={{ textAlign: 'left', margin: 'auto', width: '500px', marginTop: '10px' }}>
                <textarea style={{ width: '635px', height: '100px', margin: 'auto'}} value={this.state.byteCode} onChange={e => this.setState({ byteCode: e.target.value })}></textarea>
                <button onClick={() => this.exec()}>Run</button>
                <button onClick={() => this.compile()}>Compile</button>
            </div>
        </div>
    </div>
    
    </>
    }
}