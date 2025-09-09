/**
 * Builds the game board, player/winning titles, coins logic, and game loop.
 */

import { Container, Text } from "https://cdn.jsdelivr.net/npm/pixi.js@8.x/dist/pixi.mjs";
import { state } from "./state.js";
import Coin from "./Coin.js";
import { parseScenario } from "./utils.js";

export class Game {
  constructor(app, ui) {
    this.app = app;
    this.ui = ui;

    this.container = new Container();

    // Winning Coins title.
    this.winningTitle = new Text("Winning Coins", {
      fill: 0xffff00,
      fontSize: 32,
      fontWeight: 'bold'
    });
    this.winningTitle.anchor.set(0.5);
    this.container.addChild(this.winningTitle);

    // Player Coins title.
    this.playerTitle = new Text("Player Coins", {
      fill: 0xffff00,
      fontSize: 32,
      fontWeight: 'bold'
    });
    this.playerTitle.anchor.set(0.5);
    this.container.addChild(this.playerTitle);

    // Container for winning number coins.
    this.winningContainer = new Container();
    this.container.addChild(this.winningContainer);

    // Container for player number coins.
    this.playerContainer = new Container();
    this.container.addChild(this.playerContainer);
  }

  // Enables/disables both rows.
  setAllCoinsEnabled(enabled) {
    [...this.winningContainer.children, ...this.playerContainer.children].forEach(coin => {
      coin.interactive = enabled;
      coin.cursor = enabled ? 'pointer' : 'default';
    });
  }

  // Enables and disables the player numbers.
  setPlayerCoinsEnabled(enabled) {
    this.playerContainer.children.forEach((coin) => {
      coin.interactive = enabled;
      coin.cursor = enabled ? 'pointer' : 'not-allowed';
    });
  }

  // Creates a grid of coins and keeps the rows centred under their titles.
  setupCoins(container, numbers, isWinningRow) {
    const perRow = 3;
    const spacing = 150;
    const coinSize = 100;
    const coinHalf = coinSize * 0.5;

    for (let i = 0; i < numbers.length; i++) {
      const num = numbers[i];
      const coin = new Coin(num, isWinningRow, (coinInstance) => this.handleReveal(coinInstance), state.textures);
      const col = i % perRow;
      const row = Math.floor(i / perRow);

      coin.x = col * spacing + coinHalf;
      coin.y = row * spacing + coinHalf;
      container.addChild(coin);
    }
  }

  handleReveal(coin) {
    const textures = state.textures;
    if (coin.isWinningRow) {
      // Shows the revealed chest and number.
      coin.setReveal(textures.treasure_chest_revealed, coin.number);

      const allRevealed = this.winningContainer.children.every((c) => c.revealed);
      if (allRevealed) {
        this.setPlayerCoinsEnabled(true); // Unlocks the coins.
      }
    } else {
      if (Object.keys(state.gameData.instantWins).includes(coin.number.toString())) {
        coin.setReveal(
          textures.barrel_of_coins_revealed,
          `+${state.gameData.instantWins[coin.number][state.ticketPrice] / 100}`
        );
        state.winThisTicket += state.gameData.instantWins[coin.number][state.ticketPrice];
        this.ui.updateTicketWinDisplay();
      } else if (state.winningNumbers.includes(coin.number)) {
        coin.setReveal(textures.treasure_chest_revealed_GREEN, coin.number);
        state.winThisTicket += state.ticketPrice * state.gameData.prizeMultipliers.match;
        this.ui.updateTicketWinDisplay();

        // Flips the matching winning chest, green.
        this.winningContainer.children.forEach(wc => {
          if (wc.number === coin.number && wc.revealed) {
            wc.back.texture = textures.treasure_chest_revealed_GREEN;
          }
        });
      } else {
        coin.setReveal(textures.pirate_ship_revealed_red, coin.number);
      }
      // --- Ends the ticket when all the coins have been revealed ---
      const allRevealed = this.playerContainer.children.every((c) => c.revealed);
      if (allRevealed) {
        this.endTicket();
      }
    }
  }

  // Builds a ticket but doesn't deduct the cost yet.
  startNewTicket() {
    state.ticketInProgress = false;

    state.winThisTicket = 0;
    this.ui.updateTicketWinDisplay(); // Resets the ticket win.

    // Clears the containers and builds new coins.
    this.winningContainer.removeChildren();
    this.playerContainer.removeChildren();

    // Uses a forced scenario if the dev panel sets one, otherwise will choose a scenario at random.
    let scenarioStr;
    if (state.forcedScenario){
      scenarioStr = state.forcedScenario;
      state.forcedScenario = null;
    } else {
      // Picks a random scenario from the JSON.
      scenarioStr = state.gameData.scenarios[
        Math.floor(Math.random() * state.gameData.scenarios.length)
      ];
    }

    // Parses it into structured data.
    const scenario = parseScenario(scenarioStr);

    state.winningNumbers = scenario.winningNumbers.slice();
    state.playerNumbers = scenario.playerNumbers.slice();

    // Creates the winning and player coins.
    this.setupCoins(this.winningContainer, state.winningNumbers, true);
    this.setupCoins(this.playerContainer, state.playerNumbers, false);

    // Locks everything until the Play button is pressed again.
    this.setAllCoinsEnabled(false);

    this.onResize();
  }

  // Deducts cost and actually begins the ticket.
  beginTicketPlay() {
    if (state.ticketInProgress) {
      return;
    }
    if (state.balance < state.ticketPrice) {
      return;
    }

    // Deducts ticket cost.
    state.balance -= state.ticketPrice;
    this.ui.updateBalanceDisplay(-state.ticketPrice);

    state.ticketInProgress = true;

    // Makes sure that only the winning coins are clickable at first.
    this.setAllCoinsEnabled(false);
    this.winningContainer.children.forEach(c => {
      c.interactive = true;
      c.cursor = 'pointer';
    });
  }

  endTicket() {
    const winAmount = state.winThisTicket;

    state.ticketInProgress = false; // Allows for a new ticket to be bought.
    state.gamePhase = "setup"; // Goes back to the setup phase.

    // Disables the coins straight away.
    this.setAllCoinsEnabled(false);

    setTimeout(() => {
      if (winAmount > 0) {
        state.balance += winAmount;
        this.ui.updateBalanceDisplay(winAmount);
        this.ui.showOverlay(`Congrats! You Won: £${(state.winThisTicket / 100).toFixed(2)}!`, 0x00ff00);
      } else {
        this.ui.updateBalanceDisplay(0);
        this.ui.showOverlay("You Lost! Better luck next time!", 0xff0000);
      }

      // Notifies the main file so it can re-enable the play button.
      if (typeof this.onTicketEnd === 'function') {
        this.onTicketEnd();
      }
    }, 750); // 0.75 of a second delay before showing the overlay.
  }

  // --- Handles the layout and centring ---
  onResize() {
    const gapTitleToRow = 5; // Space under the titles.
    const gapGroups = 50; // Space between the winning and player groups.

    // Titles centred horizontally.
    this.winningTitle.x = 0;
    this.playerTitle.x = 0;

    // Row containers pivoted to their middle so they stay centred.
    this.winningContainer.pivot.x = this.winningContainer.width * 0.5;
    this.playerContainer.pivot.x = this.playerContainer.width * 0.5;
    this.winningContainer.x = 0;
    this.playerContainer.x = 0;

    // Stacks everything vertically.
    let currentY = 0;
    this.winningTitle.y = currentY;
    currentY += this.winningTitle.height + gapTitleToRow;
    this.winningContainer.y = currentY;

    currentY += this.winningContainer.height + gapGroups;
    this.playerTitle.y = currentY;
    currentY += this.playerTitle.height + gapTitleToRow;
    this.playerContainer.y = currentY;

    // Calculates the true bounding box of everything inside the mainContainer.
    const bounds = this.container.getLocalBounds();

    // Sets the pivot to the centre of that bounding box.
    this.container.pivot.set(bounds.x + bounds.width * 0.5, bounds.y);

    // Places that pivot at the centre of the screen.
    this.container.position.set(this.app.screen.width * 0.5, 30);
  }

}