import Phaser from 'phaser';
import rocketImg from './res/iss.png';
import earthImg from './res/earth.jpg';
import {Button} from './button.js'
import {RingBuffer} from './ringbuffer.js'

const State = {
    INIT: 0,
    DRAGGING: 1, // mouse dragging
    INPROGRESS: 2, // running or paused
    CRASHED: 3, // rocket has crashed
}

const Focus = {
    BOTH: 0,
    SPEED: 1,
    ANGLE: 2,
    MAX: 2
}

const SPEED_MULTIPLIER = Phaser.Math.GetSpeed(1,1);
const START_SPEED = 100;

const DRAG_SCALER = 0.5;
const DRAG_SPEED_SNAP = 5;
const DRAG_ANGLE_SNAP = 10;

const MAX_TRAIL_SIZE = 1000;
const TRAIL_GRAD_START = 0xa0a0a0
const TRAIL_GRAD_END = 0x505050

const trailGraident = (pos) =>{
    return TRAIL_GRAD_START ;//+ (TRAIL_GRAD_END - TRAIL_GRAD_START) * (pos/MAX_TRAIL_SIZE);
}

class MyGame extends Phaser.Scene
{
    constructor ()
    {
        super();      
    }

    setState(state) {
        this.state = state;
        if (state == State.INIT) {
            this.angleText.clearTint();
            this.speedText.clearTint();
            this.startButton.enable();
            this.resetButton.enable();
            this.rocket.visible = true;
            this.crashText.setVisible(false);
        } else if (state == State.DRAGGING) {
            this.startButton.disable();
            this.resetButton.disable();
            this.rocket.visible = true;
            this.crashText.setVisible(false);
            this.focus = Focus.MAX;
            this.toggleFocus()
            this.savedRocketv = this.rocketv.clone();
        } else if (state == State.INPROGRESS) {
            this.startButton.enable();
            this.resetButton.enable();
            this.rocket.visible = true;
            this.crashText.setVisible(false);
        } else if (state == State.CRASHED) {
            this.startButton.disable();
            this.resetButton.enable();
            this.rocket.visible = false;
            this.crashText.setVisible(true);
        }
    }


    // keyboard input toggle
    toggleFocus() {
        this.focus = (this.focus + 1) % (Focus.MAX+1);
        if (this.focus == Focus.BOTH) {
            this.speedText.setTint(0xFF0000);
            this.angleText.setTint(0xFF0000);
        } else if (this.focus == Focus.SPEED) {
            this.speedText.setTint(0xFF0000);
            this.angleText.clearTint();
        } else {
            this.angleText.setTint(0xFF0000);
            this.speedText.clearTint();
        }
    }

    // only process mouse movements if reset
    stateGuard(wrapped, state) {
        game = this;
        return function() {
            if (game.state == state) 
                return wrapped.apply(this, arguments);
        }
    }

    resetSimulation() 
    {
        this.rocketpos = new Phaser.Math.Vector2(0, -250);
        this.trail = new RingBuffer(MAX_TRAIL_SIZE, true);
        
        if (this.state == State.INIT || this.state === undefined) { 
            this.rocketv = new Phaser.Math.Vector2(START_SPEED * SPEED_MULTIPLIER, 0);
            this.startingRocketv = this.rocketv.clone();
        } else {
            this.rocketv = this.startingRocketv.clone();
        }

        // update sprite 
        this.rocket.x = this.rocketpos.x;
        this.rocket.y = this.rocketpos.y;  

        this.toggleSimulation(false)
        this.setState(State.INIT);

    }

    toggleSimulation(force)
    {
        if (force !== undefined) {
            this.running = force;
        } else if (this.state == State.INIT) {
            this.setState(State.INPROGRESS);
            this.running = true;
            
        } else if (force==undefined)
            this.running = !this.running;
       
        this.startButton.setText(this.running ? "Pause" : "Start"); 
    }

   

    updateSimulation(time, delta)
    {
        // save previous pos in trail
        this.trail.write(this.rocketpos.clone());

        // update position
        this.rocketpos.add(new Phaser.Math.Vector2(this.rocketv).scale(delta))
        
        // update velocity
        const rsquared = this.rocketpos.length() ** 2
        const accel = (new Phaser.Math.Vector2(this.rocketpos)).normalize().scale(-1 * G /rsquared)
        const deltav = accel.scale(delta)
        this.rocketv.add(deltav)


        

        // update sprite 
        this.rocket.x = this.rocketpos.x;
        this.rocket.y = this.rocketpos.y;  

       

    }


    mouseDown(pointer) {
        if (this.state == State.INPROGRESS)
            return; // do nonthing if simulationn in progress
        
        if (this.state == State.INIT) {
            this.startDragPos = new Phaser.Math.Vector2(pointer.position);
            this.setState(State.DRAGGING);
        } else if (this.state == State.DRAGGING){
            this.startDragPos = undefined;
            this.setState(State.INIT);
        }

    }

    updateVelocity(pointer) {
        var speed;
        var angle;
        if (this.focus == Focus.BOTH) { // using the mouse to set speed
            const delta = new Phaser.Math.Vector2(pointer.position)
            delta.subtract(this.startDragPos)
            speed = Phaser.Math.RoundTo(delta.length() * DRAG_SCALER / this.zoomFactor, 1, DRAG_SPEED_SNAP)
            angle = Phaser.Math.RoundTo(Phaser.Math.RadToDeg(delta.angle()), 1, DRAG_ANGLE_SNAP)

        } else if (this.focus == Focus.SPEED) { // using the keyboard
            if (this.enteredText == "") {
                speed = this.savedRocketv.length() / SPEED_MULTIPLIER;
            } else {
                speed = parseInt(this.enteredText.substr(0,4));
            }
            angle = Phaser.Math.RadToDeg(this.rocketv.angle());
        } else if (this.focus == Focus.ANGLE) {
            if (this.enteredText == "") {
                angle = Phaser.Math.RadToDeg(this.savedRocketv.angle());
            } else {
                angle = 450 - parseInt(this.enteredText.substr(0,3)); // have to convert
            }
            speed = this.rocketv.length() / SPEED_MULTIPLIER;
        }
        //const speed = delta.length() * DRAG_SCALER
        this.rocketv.setToPolar(Phaser.Math.DegToRad(angle), speed * SPEED_MULTIPLIER);
        this.startingRocketv = this.rocketv.clone();
    }


    drawArrow() {
        //this.graphics.clear();

        const colour = this.state == State.DRAGGING ? 0xff2020 : 0xffffff;

        this.graphics.lineStyle(5, colour, 1);
        this.graphics.beginPath();

        const arrowVector = new Phaser.Math.Vector2(this.rocketv.x/DRAG_SCALER/SPEED_MULTIPLIER,
                                                    this.rocketv.y/DRAG_SCALER/SPEED_MULTIPLIER
            );
                   
            
        const arrowhead1 = new Phaser.Math.Vector2(-25,-25)
        const arrowhead2 = new Phaser.Math.Vector2(-25, 25)
        
        arrowhead1.rotate(arrowVector.angle());
        arrowhead2.rotate(arrowVector.angle());

        // now transpose the arrow.
        const trans = (new Phaser.Math.Vector2(arrowVector)).scale(0.2);
        trans.add(this.rocketpos);
        
        arrowVector.add(trans);
        arrowhead1.add(arrowVector);
        arrowhead2.add(arrowVector);

        this.graphics.moveTo(trans.x, trans.y);
        this.graphics.lineTo(arrowVector.x, arrowVector.y);
        this.graphics.lineTo(arrowhead1.x, arrowhead1.y);
        this.graphics.moveTo(arrowVector.x, arrowVector.y);
        this.graphics.lineTo(arrowhead2.x, arrowhead2.y);    
                            

        this.graphics.strokePath();
        this.graphics.closePath();
      
    }

    drawTrail() {
        this.graphics.beginPath();

        var posCount = 0;
        for (const pos of this.trail) {
            this.graphics.lineStyle(1, trailGraident(posCount++), 1);
            if (posCount == 0)
                this.graphics.moveTo(pos.x, pos.y);
            else
                this.graphics.lineTo(pos.x, pos.y);
        }

        this.graphics.strokePath();
        this.graphics.closePath();
    }

    crash() {
        this.setState(State.CRASHED);
    }


    zoom (factor) {
        this.cameras.main.setZoom(factor, factor);
        this.zoomFactor = factor;
    }

    zoomIn() {
        this.zoom(this.zoomFactor * 2);
    }

    zoomOut() {
        this.zoom(this.zoomFactor / 2);
    }

    preload ()
    {
        this.load.image('rocket', rocketImg);
        this.load.image('earth', earthImg);

    }
    

    
    openExternalLink (url)
    {
        var s = window.open(url, '_blank');
    }

    processKey(event) {
        if (event.keyCode == Phaser.Input.Keyboard.KeyCodes.ENTER) {
            this.enteredText = "";
            if (this.state == State.INIT) {
                this.setState(State.DRAGGING);
                this.toggleFocus();
            } else if (this.state == State.DRAGGING) {
                if (this.focus == Focus.MAX) {
                    this.setState(State.INIT);
                } else {
                    this.toggleFocus();
                }
            }
        } else if (this.state == State.DRAGGING) {

            if (event.keyCode >= Phaser.Input.Keyboard.KeyCodes.ZERO
                && event.keyCode <= Phaser.Input.Keyboard.KeyCodes.NINE
                && this.enteredText.length < 4) {
                this.enteredText += event.key;
            } else if (event.keyCode == Phaser.Input.Keyboard.KeyCodes.BACKSPACE) {
                this.enteredText = this.enteredText.substr(0, Math.max(0, this.enteredText.length-1))
            }
        }
    }

    create ()
    {
        // Set up sprites
        this.earth = this.matter.add.image(0, 0, 'earth').setStatic(true);
        this.earth.setBody({type: 'circle', radius: 250});
        this.earth.setStatic(true);
        this.earth.setScale(0.3);
            
        this.rocket = this.matter.add.image(0,0, 'rocket').setBounce(0);
        this.rocket.setScale(0.13);
        
        // Set up display text
        this.speedText = this.add.text(1450,0, "Speed:1000")
            .setStyle({ fontSize: '20px' })
            .setFontFamily('courier')
        this.angleText = this.add.text(1450,this.speedText.height, "Angle:999??")
            .setStyle({ fontSize: '20px' })
            .setFontFamily('courier')

        // Set crash text
        this.crashText = this.add.text(700, 800, "CRASHED!")
            .setStyle({ fontSize: '40px' })

        // Set up buttons
        this.startButton = new Button(50, 850, 'Start', this, () => {this.toggleSimulation()});
        this.resetButton = new Button(130, 850, 'Reset', this, () => {this.resetSimulation()});
        this.zoomInButton = new Button(1500, 850, '+', this, () => {this.zoomIn()});
        this.zoomOutButton = new Button(1540, 850, '-', this, () => {this.zoomOut()});
        this.aboutButton = new Button(50, 10, 'About', this, () => {
                this.openExternalLink('https://github.com/dylanradcliffe/gravitysimjs#simple-gravity-simulation-written-in-javascript')
            });

        // Set up events 
        this.input.on('pointerdown', (pointer) => this.mouseDown(pointer));
        this.graphics = this.add.graphics();
        this.matter.world.on('collisionstart', () => this.crash());
        this.input.keyboard.on('keyup', (event)=>this.processKey(event));

        // Set up cameras
        //main
        this.cameras.main.ignore([this.startButton.button, this.resetButton.button,
                                  this.zoomInButton.button, this.zoomOutButton.button,
                                  this.aboutButton.button,
                                  this.speedText, this.angleText, this.crashText])
        this.cameras.main.centerOn(0,0);
        this.zoom(1);

        // UI came
        const UICam = this.cameras.add();
        UICam.ignore([this.earth, this.rocket, this.graphics]);

        this.resetSimulation();


        

    }

    update(time, delta)
    {
        this.graphics.clear();
        if (this.state == State.INPROGRESS && this.running) {
            this.updateSimulation(time, delta);
            this.drawTrail();
        } else if (this.state == State.DRAGGING) {
            this.updateVelocity(this.input.activePointer);
            this.drawArrow();
        } else if (this.state == State.INIT) {
            this.drawArrow();
        } else if (this.state == State.CRASHED) {
            this.drawTrail();
        }

        // show velocity
        // show velocity
        const speed = this.rocketv.length() / SPEED_MULTIPLIER
        const angle = (450 - Phaser.Math.RadToDeg(this.rocketv.angle())) % 360;  // reverse 
        
        const speedStr = speed.toLocaleString('en-US', {maximumFractionDigits:0, useGrouping:false})
                   .padStart(4, " ")
        const angleStr = angle.toLocaleString('en-US', {maximumFractionDigits:0, useGrouping:false})
                   .padStart(3, " ")

        // in entry mode display the literal string entered
        this.speedText.text = 'Speed: ' +
            ((this.state == State.DRAGGING && this.focus == Focus.SPEED && this.enteredText.length > 0)?
            this.enteredText.padStart(4) : speedStr);
        this.angleText.text = 'Angle:  ' +
            ((this.state == State.DRAGGING && this.focus == Focus.ANGLE && this.enteredText.length > 0)?
            this.enteredText.padStart(3) : angleStr)
            +'??';
       

    }
    
}



const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    scale: {
        mode: Phaser.Scale.FIT,
    },
    width: 1600,
    height: 900,
    scene: MyGame,
    fps: {
        target: 25,
        forceSetTimeOut: true
    },
    
    physics: {
        default: 'matter',
        matter: {
            gravity: {
                x: 0,
                y: 0
            },
            debug: false,
        }
    },
};

const G = 3.0;
const game = new Phaser.Game(config);