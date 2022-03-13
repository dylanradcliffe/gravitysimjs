export class Button {
    constructor(x, y, label, scene, callback) {
        
        const button = scene.add.text(x, y, label)
            .setOrigin(0.5)
            .setPadding(10)
            .setScrollFactor(0)
            .setStyle({ backgroundColor: '#333'})
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', this.ifEnabled(() => callback()))
         //   .on('pointerover', () => button.setStyle({ fill: '#f39c12' }))
         //   .on('pointerout', () => button.setStyle({ fill: '#FFF' }));
            .on('pointerover', this.ifEnabled(() => button.setStyle({ backgroundColor: '#777' })))
            .on('pointerout', () => button.setStyle({ backgroundColor: '#333' }));
        this.button = button;
        this.enable()

    }
    setText(text) {
        this.button.text = text;
    }

    disable() {
        this.enabled = false;
        this.button.setStyle({ fill: '#777', backgroundColor: '#333' })
    }

    enable() {
        this.enabled = true;
        this.button.setStyle({ fill: '#FFF' })
    }
    
    ifEnabled(wrapped) {
        const button = this; // hold the button object in closuree
                             // as 'this' take on different context
        return function() {
            if (button.enabled) 
                return wrapped.apply(this, arguments);
        }
    }
}
