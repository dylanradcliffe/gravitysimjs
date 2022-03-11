import Phaser from 'phaser';
import rocketImg from './res/iss.png';
import earthImg from './res/earth.jpg'

class MyGame extends Phaser.Scene
{
    constructor ()
    {
        super();

        this.rocketpos = new Phaser.Math.Vector2(0, -250);
        this.rocketv = new Phaser.Math.Vector2(Phaser.Math.GetSpeed(100, 1), 0);

    }

    preload ()
    {
        this.load.image('rocket', rocketImg);
        this.load.image('earth', earthImg);

    }
      
    create ()
    {
        this.cameras.main.setBounds(-config.width/2, -config.height/2,config.width/2, config.height/2);

        this.earth = this.add.image(0, 0, 'earth');
        this.earth.setScale(0.2);
            
        this.rocket = this.add.image(this.rocketpos.x, this.rocketpos.y, 'rocket')
        this.rocket.setScale(0.2);

    }

    update(time, delta)
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
    
}

const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    scale: {
        mode: Phaser.Scale.FIT,
    },
    width: 1600,
    height: 900,
    scene: MyGame
};

const G = 3.0;
const game = new Phaser.Game(config);