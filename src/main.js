/**
 * Bootstraps the PIXI app, loads data/textures, creates the screens (intro/game), holds the play buttons,
 * handles the screen switching and top-level resize.
 */

import { Application, Container, Sprite } from "https://cdn.jsdelivr.net/npm/pixi.js@8.x/dist/pixi.mjs";
import { loadGameData, loadTextures } from "./loader.js";
import { state } from "./state.js";
import { UI } from "./ui.js";
import { Game } from "./game.js";

(async () => {
  await loadGameData();
  await loadTextures();

  const app = new Application();
  await app.init({ resizeTo: window, background: 0x1099bb });
  document.body.appendChild(app.canvas);
  state.app = app;

  // --- Screens ---
  const startScreen = new Container();
  app.stage.addChild(startScreen);

  const gameScreen = new Container();
  gameScreen.visible = false;
  app.stage.addChild(gameScreen);

  // --- Backgrounds ---
  const startBg = Sprite.from(state.textures.startScreen);
  startBg.width = app.screen.width;
  startBg.height = app.screen.height;
  startScreen.addChild(startBg);

  const gameBg = Sprite.from(state.textures.background);
  gameBg.width = app.screen.width;
  gameBg.height = app.screen.height;
  gameScreen.addChild(gameBg);

  // UI and Game.
  const ui = new UI(app); // UI container but not added yet.
  const game = new Game(app, ui);
  gameScreen.addChild(game.container); // Game graphics inside gameScreen.

  // Adds the UI last so the overlay sits on top of everything.
  app.stage.addChild(ui.container);
  ui.container.visible = false; // Hides it on the startScreen initially.

  // --- Play Button ---
  const playBtnStart = new Sprite(state.textures.play_button);
  playBtnStart.width = 200;
  playBtnStart.height = 110;
  playBtnStart.anchor.set(0.5);
  playBtnStart.interactive = true;
  playBtnStart.cursor = 'pointer'; // Starts on the intro screen.
  startScreen.addChild(playBtnStart);

  const playBtnGame = new Sprite(state.textures.play_button);
  playBtnGame.width = 200;
  playBtnGame.height = 110;
  playBtnGame.anchor.set(0.5);
  playBtnGame.interactive = true;
  playBtnGame.cursor = 'pointer'; // Continues onto the game screen.
  gameScreen.addChild(playBtnGame);

  // --- Play button behaviour ---
  function handlePlayButton() {
    if (state.gamePhase === "start") {
      startScreen.visible = false;
      gameScreen.visible = true;
      ui.container.visible = true; // Shows the UI only in the game.
      state.gamePhase = "setup";
    } else if (state.gamePhase === "setup") {
      game.startNewTicket();
      state.gamePhase = "playing";
    }
  }

  playBtnStart.on('pointerdown', handlePlayButton);
  playBtnGame.on('pointerdown', handlePlayButton);

  function onResize() {
    // Backgrounds.
    startBg.width = app.screen.width;
    startBg.height = app.screen.height;
    gameBg.width = app.screen.width;
    gameBg.height = app.screen.height;

    // Positions the play button at the right centre.
    playBtnStart.x = app.screen.width - 120;
    playBtnStart.y = app.screen.height * 0.5;
    playBtnGame.x = app.screen.width - 120;
    playBtnGame.y = app.screen.height * 0.5;

    // Repositions the game elements and the UI.
    game.onResize();
    ui.onResize();
  }

  window.addEventListener('resize', onResize);
  onResize();
})();
