/**
 * Stores all the overlays, HUD, info-meter, and UI update logic.
 */

import { Container, Sprite, Text, Graphics, Polygon } from "https://cdn.jsdelivr.net/npm/pixi.js@8.x/dist/pixi.mjs";
import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js";
import { state } from "./state.js";

export class UI {
  constructor(app) {
    this.app = app;
    const textures = state.textures;

    // Wraps everything in one container.
    this.container = new Container();

    // --- Info-Meter ---
    this.infoMtr = new Sprite(textures.info_meter);
    this.infoMtr.width = 700;
    this.infoMtr.height = 450;
    this.infoMtr.anchor.set(0.5);
    this.container.addChild(this.infoMtr);

    // Info Minus button.
    this.infoMinus = new Sprite(textures.minus);
    this.infoMinus.width = 110;
    this.infoMinus.height = 120;
    this.infoMinus.anchor.set(0.5);
    this.infoMinus.eventMode = 'static'; // The v8 way to receive events in replacement for interactive = true.
    this.infoMinus.cursor = 'pointer';

    this.infoMtr.addChild(this.infoMinus);

    // Relative coordinates inside the meter.
    this.infoMinus.x = this.infoMtr.width * -0.78;
    this.infoMinus.y = this.infoMtr.height * 0.185;

    // Uses the local texture size for the hitArea rather than the 110x120.
    const { width: tw, height: th } = this.infoMinus.texture;

    // The polygon points are expressed as fractions of the texture size, so it works regardless of the size the sprite is drawn at.
    this.infoMinus.hitArea = new Polygon([
      -tw * 0.5, 0,
      -0.30 * tw, -0.40 * th,
      tw * 0.5, -th * 0.5,
      tw * 0.5, th * 0.5,
      -0.30 * tw, 0.40 * th,
    ]);

    // Info Plus button.
    this.infoPlus = new Sprite(textures.plus);
    this.infoPlus.width = 110;
    this.infoPlus.height = 120;
    this.infoPlus.anchor.set(0.5);
    this.infoPlus.eventMode = 'static';
    this.infoPlus.cursor = 'pointer';

    this.infoMtr.addChild(this.infoPlus);

    this.infoPlus.x = this.infoMtr.width * -0.4;
    this.infoPlus.y = this.infoMtr.height * 0.185;

    const { width: tw2, height: th2 } = this.infoPlus.texture;

    this.infoPlus.hitArea = new Polygon([
      -tw2 * 0.5, 0,
      -0.30 * tw2, -0.40 * th2,
      tw2 * 0.5, -th2 * 0.5,
      tw2 * 0.5, th2 * 0.5,
      -0.30 * tw2, 0.40 * th2,
    ]);

    // Ticket price text (between the minus and plus buttons).
    this.priceText = new Text("", {
      fill: 0xffff00,
      fontSize: 42,
      fontWeight: 'bold'
    });
    this.priceText.anchor.set(0.5);
    this.infoMtr.addChild(this.priceText);
    this.priceText.x = (this.infoMinus.x + this.infoPlus.x) * 0.5;
    this.priceText.y = this.infoMinus.y;

    // Balance text.
    this.balanceText = new Text("", {
      fill: 0xffff00,
      fontSize: 42,
      fontWeight: 'bold' });
    this.balanceText.anchor.set(0.5);
    this.infoMtr.addChild(this.balanceText);
    this.balanceText.x = this.priceText.x + 410;
    this.balanceText.y = this.priceText.y;

    //  Win text.
    this.ticketWinText = new Text("£0.00", {
      fill: 0xffff00,
      fontSize: 42,
      fontWeight: 'bold'
    });
    this.ticketWinText.anchor.set(0.5);
    this.infoMtr.addChild(this.ticketWinText);
    this.ticketWinText.x = this.balanceText.x + 435;
    this.ticketWinText.y = this.balanceText.y;

    this.infoMinus.on('pointerdown', () => {
      const index = state.gameData.ticketPrices.indexOf(state.ticketPrice);
      if (index > 0) {
        state.ticketPrice = state.gameData.ticketPrices[index - 1];
        this.updatePriceDisplay();
      }
    });

    this.infoPlus.on('pointerdown', () => {
      const index = state.gameData.ticketPrices.indexOf(state.ticketPrice);
      if (index < state.gameData.ticketPrices.length - 1) {
        state.ticketPrice = state.gameData.ticketPrices[index + 1];
        this.updatePriceDisplay();
      }
    });

    // --- Overlay for the results ---
    this.overlay = new Container();

    this.overlayBg = new Graphics()
      .rect(0, 0, app.screen.width, app.screen.height)
      .fill({ color: 0x000000, alpha: 0.7 });
    this.overlay.addChild(this.overlayBg);

    this.overlayText = new Text("", {
      fill: 0xffff00,
      fontSize: 64,
      fontWeight: 'bold',
      align: 'center',
    });
    this.overlayText.anchor.set(0.5);
    this.overlay.addChild(this.overlayText);

    this.overlay.visible = false;
    this.container.addChild(this.overlay); // Last, on top.

    this.updatePriceDisplay();
    this.updateBalanceDisplay(0);
    this.updateTicketWinDisplay();

    // Initial positioning.
    this.onResize();
  }

  updatePriceDisplay() {
    this.priceText.text = `£${(state.ticketPrice / 100).toFixed(2)}`;
  }

  updateBalanceDisplay(change = 0) {
    this.balanceText.text = `£${(state.balance / 100).toFixed(2)}`;

    this.balanceText.style.fill =
      change > 0 ? 0x00ff00 : change < 0 ? 0xff0000 : 0xffff00;
  }

  updateTicketWinDisplay() {
    this.ticketWinText.text = `£${(state.winThisTicket / 100).toFixed(2)}`;
  }

  showOverlay(message, colour = 0xffff00) {
    this.overlayText.text = message;
    this.overlayText.style.fill = colour;
    this.overlayText.x = this.app.screen.width * 0.5;
    this.overlayText.y = this.app.screen.height * 0.5;
    this.overlayBg.width = this.app.screen.width;
    this.overlayBg.height = this.app.screen.height;
    this.overlay.visible = true;
    this.overlay.alpha = 0;
    gsap.to(this.overlay, { alpha: 1, duration: 0.5 });
    setTimeout(() => {
      gsap.to(this.overlay, { alpha: 0, duration: 0.5, onComplete: () => (this.overlay.visible = false), });
    }, 1500);
  }

  onResize() {
    // Positions the info meter at the bottom centre.
    this.infoMtr.x = this.app.screen.width * 0.5;
    this.infoMtr.y = this.app.screen.height - this.infoMtr.height * 0.5 + 140; // 140px margin.

    this.overlayBg.width = this.app.screen.width;
    this.overlayBg.height = this.app.screen.height;
    this.overlayText.x = this.app.screen.width * 0.5;
    this.overlayText.y = this.app.screen.height * 0.5;
  }
}
