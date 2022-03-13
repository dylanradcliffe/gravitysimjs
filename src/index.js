import Phaser from 'phaser';
import rocketImg from './res/iss.png';
import earthImg from './res/earth.jpg';
import {Button} from './button.js'

const State = {
    INIT: 0,
    DRAGGING: 1, // mouse dragging
    INPROGRESS: 2, // running or paused
}

const SPEED_MULTIPLIER = Phaser.Math.GetSpeed(1,1);
const START_SPEED = 100;

class MyGame extends Phaser.Scene
{
    constructor ()
    {
        super();      
    }

    setState(state) {
        this.state = state;
        if (state == State.INIT) {
            this.startButton.enable();
            this.resetButtton.disable();
        } else if (state == State.DRAGGING) {
            this.startButton.disable();
            this.resetButtton.disable();
        } else if (state == State.INPROGRESS) {
            this.startButton.enable();
            this.resetButtton.enable();
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
        this.rocketv = new Phaser.Math.Vector2(START_SPEED * SPEED_MULTIPLIER, 0);
            
        // update sprite 
        this.rocket.x = this.rocketpos.x;
        this.rocket.y = this.rocketpos.y;  

        this.toggleSimulation(false)
        this.setState(State.INIT);

    }

    toggleSimulation(force)
    {
        if (this.state == State.INIT) {
            this.setState(State.INPROGRESS);
            this.running = true;
        } else if (this.state != State.INPROGRESS) {
            return;
        } else if (force==undefined)
            this.running = !this.running;
        else
            this.running = force;

        this.startButton.setText(this.running ? "Pause" : "Start"); 
    }

    

    updateSimulation(time, delta)
    {
        // update position
        //console.log(this.rocketpos)
        //console.log(this.rocketv)
        this.rocketpos.add(new Phaser.Math.Vector2(this.rocketv).scale(delta))
        
        // update velocity
        const rsquared = this.rocketpos.length() ** 2
        const accel = (new Phaser.Math.Vector2(this.rocketpos)).normalize().scale(-1 * G /rsquared)
        const deltav = accel.scale(delta)
        this.rocketv.add(deltav)

        //console.log(rsquared)
        //console.log(accel)
        //console.log(deltav)
        

        // update sprite 
        this.rocket.x = this.rocketpos.x;
        this.rocket.y = this.rocketpos.y;  

       

    }


    mouseDown(pointer) {
        if (this.state == State.INPROGRESS)
            return; // do nonthing if simulationn in progress
        
        if (this.state == State.INIT) {
            this.startDragPos = pointer.position;
            this.setState(State.DRAGGING);
        } else if (this.state == State.DRAGGING){
            this.currentDragPos = undefined;
            this.setState(State.INIT);
        }

    }

    preload ()
    {
        this.load.image('rocket', rocketImg);
        this.load.image('earth', earthImg);

    }
    
    

    create ()
    {
        // Set up camera
        this.cameras.main.setBounds(-config.width/2, -config.height/2,config.width/2, config.height/2);

        // Set up srites
        this.earth = this.add.image(0, 0, 'earth');
        this.earth.setScale(0.3);
            
        this.rocket = this.add.image(0,0, 'rocket')
        this.rocket.setScale(0.13);

        this.velocityText = this.add.text(1300,0, "Speed:1000  Angle:999°")
            .setScrollFactor(0)
            .setStyle({ fontSize: '20px' })
            .setFontFamily('courier')

        // Set up buttons
        this.startButton = new Button(50, 850, 'Start', this, () => {this.toggleSimulation()});
        this.resetButtton = new Button(130, 850, 'Reset', this, () => {this.resetSimulation()});
        
        // Set up mouse controls
        this.input.on('pointerdown', (pointer) => this.mouseDown(pointer));
        
        this.resetSimulation();

    }

    update(time, delta)
    {
       if (this.state == State.INPROGRESS && this.running) {
           this.updateSimulation(time, delta);
       }

       // show velocity
       // show velocity
       const speed = this.rocketv.length() / SPEED_MULTIPLIER
       const angle = this.rocketv.angle() * 360 / Phaser.Math.PI2
       const speedStr = speed.toLocaleString('en-US', {maximumFractionDigits:0, useGrouping:false})
                   .padStart(5, " ")
       const angleStr = angle.toLocaleString('en-US', {maximumFractionDigits:0, useGrouping:false})
                   .padStart(3, " ")

       this.velocityText.text = 'Speed:' + speedStr +  '  Angle:' + angleStr +'°'

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
    
        
};

const G = 3.0;
const game = new Phaser.Game(config);