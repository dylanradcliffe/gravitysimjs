import Phaser from 'phaser';
import rocketImg from './res/iss.png';
import earthImg from './res/earth.jpg'

class MyGame extends Phaser.Scene
{
    constructor ()
    {
        super();
    }

    preload ()
    {
        this.load.image('rocket', rocketImg);
        this.load.image('earth', earthImg);

    }
      
    create ()
    {
        const earth = this.add.image(0, 0, 'earth');
        earth.setScale(0.2);
        //this.cameras.main.setPosition(config.width/2, config.height/2)
        this.cameras.main.setBounds(-config.width/2, -config.height/2,config.width/2, config.height/2);

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

const game = new Phaser.Game(config);