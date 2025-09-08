import { Container, Sprite } from "https://cdn.jsdelivr.net/npm/pixi.js@8.x/dist/pixi.mjs";
import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js";

export default class Coin extends Container {
  constructor(num, isWinningRow, onReveal, textures) {
    super();
    this.number = num; // Stores the number for later lookup.
    this.isWinningRow = isWinningRow;
    this.revealed = false;

    const frontTex = isWinningRow ? textures.treasure_chest : textures.pirate_ship;

    this.front = new Sprite(frontTex);
    this.front.width = 100;
    this.front.height = 100;
    this.front.anchor.set(0.5);
    this.front.position.set(0, 0); // Centres within the container.
    this.front.name = "front";

    this.back = new Sprite();
    this.back.width = 100;
    this.back.height = 100;
    this.back.anchor.set(0.5);
    
    this.back.position.set(0, 0);
    this.back.visible = false;
    this.back.name = "back";

    this.addChild(this.front, this.back);

    this.pivot.set(0, 0);
    this.position.set(0, 0);

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
          onReveal(this);

          this.front.visible = false;
          this.back.visible = true;
          gsap.to(this.scale, { x: 1, duration: 0.3 });
        },
      });
    });
  }
}
