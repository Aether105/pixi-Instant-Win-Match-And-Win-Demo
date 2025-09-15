import { Container, Sprite, Text } from "https://cdn.jsdelivr.net/npm/pixi.js@8.x/dist/pixi.mjs";
import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js";

export default class Coin extends Container {
  constructor(num, isWinningRow, onReveal, textures) {
    super();
    this.number = num; // Stores the number for later lookup.
    this.isWinningRow = isWinningRow;
    this.revealed = false;
    this.onReveal = onReveal;

    const frontTex = isWinningRow ? textures.treasure_chest : textures.pirate_ship;

    // Keeps a default size reference for scaling purposes.
    this.defaultSize = 100;

    this.front = new Sprite(frontTex);
    this.front.width = this.defaultSize;
    this.front.height = this.defaultSize;
    this.front.anchor.set(0.5);
    this.front.position.set(0, 0); // Centres within the container.
    this.front.name = "front";

    this.back = new Sprite();
    this.back.width = this.defaultSize;
    this.back.height = this.defaultSize;
    this.back.anchor.set(0.5);
    this.back.position.set(0, 0);
    this.back.visible = false;
    this.back.name = "back";

    this.addChild(this.front, this.back);

    this.pivot.set(0, 0);
    this.position.set(0, 0);

    // Label for the text in the middle of the coins.
    this.label = new Text('', {
      fill: 0xffffff,
      fontSize: 20,
      fontWeight: 'bold'
    });
    this.label.anchor.set(0.5);
    this.label.visible = false;
    this.addChild(this.label);

    this.interactive = true;
    this.cursor = 'pointer';

    this.on('pointerdown', () => {
      if (this.revealed) return; // Ignores, if the coin has already been flipped.
      this.revealed = true;
      this.interactive = false;
      this.cursor = 'default';

      gsap.to(this.scale, {
        x: 0,
        duration: 0.3,
        onComplete: () => {
          if (this.onReveal){
            this.onReveal(this);
          }
          this.front.visible = false;
          this.back.visible = true;
          gsap.to(this.scale, { x: 1, duration: 0.3 });
        },
      });
    });
  }

  // Lets the game scale the coins cleanly.
  resizeTo(coinSize){
    const scale = coinSize / this.defaultSize;
    this.front.width = this.defaultSize * scale;
    this.front.height = this.defaultSize * scale;
    this.back.width = this.defaultSize * scale;
    this.back.height = this.defaultSize * scale;
    this.label.style.fontSize = 20 * scale;
  }

  // Calls this from Game.handleReveal to set the revealed texture and text.
  setReveal(texture, text){
    this.back.texture = texture;
    this.label.text = text || '';
    this.label.visible = !!text;
  }
}
