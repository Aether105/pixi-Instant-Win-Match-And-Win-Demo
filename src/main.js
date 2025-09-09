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

  // --- Play Buttons ---
  const PLAY_BTN_WIDTH = 200;
  const PLAY_BTN_HEIGHT = 110;

  const playBtnStart = new Sprite(state.textures.play_button);
  playBtnStart.anchor.set(0.5);
  startScreen.addChild(playBtnStart);

  const playBtnGame = new Sprite(state.textures.play_button);
  playBtnGame.anchor.set(0.5);
  gameScreen.addChild(playBtnGame);

  // Helper to enable/disable the buttons visually.
  function setPlayButtonEnabled(btn, enabled){
    btn.interactive = enabled;
    btn.cursor = enabled ? 'pointer' : 'default';
    btn.alpha = enabled ? 1 : 0.5;
    btn.width = PLAY_BTN_WIDTH;
    btn.height = PLAY_BTN_HEIGHT;
  }

  // Common behaviour for both buttons.
  function attachButtonFX(btn){
    btn.interactive = true;
    btn.cursor = 'pointer';
    setPlayButtonEnabled(btn, true);

    btn.on('pointerover', () => {
      if (!btn.interactive) return;
      btn.width = PLAY_BTN_WIDTH * 1.05;
      btn.height = PLAY_BTN_HEIGHT * 1.05;
    });

    btn.on('pointerout', () => {
      btn.width = PLAY_BTN_WIDTH;
      btn.height = PLAY_BTN_HEIGHT;
    });

    btn.on('pointerdown', () => {
      if (!btn.interactive) return;
      btn.width = PLAY_BTN_WIDTH * 0.95;
      btn.height = PLAY_BTN_HEIGHT * 0.95;
    });

    btn.on('pointerup', () => {
      if (!btn.interactive) return;
      btn.width = PLAY_BTN_WIDTH * 1.05;
      btn.height = PLAY_BTN_HEIGHT * 1.05;
    });
  }

  attachButtonFX(playBtnStart);
  attachButtonFX(playBtnGame);

  // --- Play button behaviour ---
  function handlePlayButton(btn) {
    if (state.gamePhase === "start") {
      startScreen.visible = false;
      gameScreen.visible = true;
      ui.container.visible = true; // Shows the UI only in the game.
      state.gamePhase = "setup";
      game.startNewTicket(); // Creates a new ticket, but with no cost deduction.
      setPlayButtonEnabled(playBtnGame, true);
    } else if (state.gamePhase === "setup" && btn === playBtnGame) {
      game.beginTicketPlay(); // Now deducts the cost and enables the winning coins.
      state.gamePhase = "playing";
      setPlayButtonEnabled(playBtnGame, false); // Disables the play button while playing.
    }
  }

  playBtnStart.on('pointertap', () => handlePlayButton(playBtnStart));
  playBtnGame.on('pointertap', () => handlePlayButton(playBtnGame));

  // The play button is then re-enabled when the tickets ends.
  game.onTicketEnd = () => {
    state.gamePhase = "setup";
    game.startNewTicket();
    setPlayButtonEnabled(playBtnGame, true);
  };

  // --- Dev. scenario panel ---
  const devPanel = document.createElement('div');
  devPanel.style.position = 'fixed';
  devPanel.style.top = '10px';
  devPanel.style.left = '10px';
  devPanel.style.background = 'rgb(0, 0, 0, 0.8)';
  devPanel.style.color = '#fff';
  devPanel.style.padding = '10px';
  devPanel.style.maxHeight = '80vh';
  devPanel.style.overflowY = 'auto';
  devPanel.style.zIndex = '9999';
  devPanel.style.fontFamily = 'monospace';
  devPanel.style.fontSize = '14px';
  devPanel.style.display = 'none';
  document.body.appendChild(devPanel);

  window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'f'){
      devPanel.style.display = devPanel.style.display === 'none' ? 'block' : 'none';
    }
  });

  function populateDevPanel() {
    devPanel.innerHTML = '<strong>Select a Scenario</strong><br>';
    state.gameData.scenarios.forEach((scenarioStr, index) => {
      const btn = document.createElement('button');
      btn.textContent = `Scenario ${index + 1}`;
      btn.style.margin = '2px';
      btn.onclick = () => {
        state.forcedScenario = scenarioStr;
        alert(`Next ticket will use scenario ${index + 1}`);
      };
      devPanel.appendChild(btn);
    });
  }
  populateDevPanel();

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

  // Initialises the state.
  state.gamePhase = "start";
  setPlayButtonEnabled(playBtnStart, true);
  setPlayButtonEnabled(playBtnGame, true);
})();
