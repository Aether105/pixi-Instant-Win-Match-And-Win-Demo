import { Application, Text, Container, Sprite, Assets, Graphics } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.x/dist/pixi.mjs';
import gsap from "https://cdn.jsdelivr.net/npm/gsap@3.12.5/index.js";

// --- Loads external data ---
let gameData;
async function loadGameData() {
    const res = await fetch("./data.json");
    gameData = await res.json();
}

(async () => {
    await loadGameData();

    // --- Initialises PIXI and Manifest ---
    await Assets.init({ manifest: "./manifest.json" });

    // Loads all the textures from the "main" bundle.
    const textures = await Assets.loadBundle("main");

    const app = new Application();
    await app.init({
        resizeTo: window,
        background: 0x1099bb
    });
    document.body.appendChild(app.canvas);

    // --- Background ---
    const bg = Sprite.from(textures.background);
    bg.width = app.screen.width;
    bg.height = app.screen.height;
    app.stage.addChild(bg);

    // --- Balance and ticket price setup ---
    let balance = 2000; // Starting balance in pence.
    let ticketPrice = gameData.ticketPrices[0]; // Default ticket price set at £1.
    let winThisTicket = 0; // How much the current ticket won.

    // The container for the main game (everything goes inside of this).
    const mainContainer = new Container();
    app.stage.addChild(mainContainer);

    const hudText = new Text("", {
        fill: 0xffff00,
        fontSize: 20,
        fontWeight: 'bold'
    });
    hudText.anchor.set(0.5, 0);
    hudText.x = app.screen.width * 0.5;
    hudText.y = 1;
    app.stage.addChild(hudText);

    // --- Ticket Price Selector ---
    const selectorContainer = new Container();
    app.stage.addChild(selectorContainer);

    function createPriceButton(price, index) {
        const btn = new Graphics().roundRect(0, 0, 80, 40, 8).fill(0x444444);
        btn.interactive = true;
        btn.cursor = 'pointer';

        const label = new Text(`£${(price / 100).toFixed(0)}`, {
            fill: 0xffffff,
            fontSize: 18,
            fontWeight: 'bold'
        });
        label.anchor.set(0.5);
        label.position.set(40, 20);
        btn.addChild(label);

        // Positions the buttons vertically.
        btn.y = index * 50;

        btn.on('pointerdown', () => {
            if (balance >= price) {
                ticketPrice = price;
                updateHUD();
                highlightSelectedPrice(price);
            }
        });

        selectorContainer.addChild(btn);
        return { btn, label, price };
    }

    const priceButtons = gameData.ticketPrices.map((p, i) => createPriceButton(p, i));

    function highlightSelectedPrice(selected) {
        priceButtons.forEach(({ btn, price }) => {
            btn.tint = (price === selected) ? 0x07f03a : 0xffffff;
        });
    }

    function updatePriceButtons() {
        priceButtons.forEach(({ btn, price }) => {
            if (balance < price) {
                btn.alpha = 0.4;
                btn.interactive = false;
            } else {
                btn.alpha = 1;
                btn.interactive = true;
            }
        });
    }

    highlightSelectedPrice(ticketPrice);

    // Winning Coins title.
    const winningTitle = new Text("Winning Coins", {
        fill: 0xffff00,
        fontSize: 32,
        fontWeight: 'bold'
    });
    winningTitle.anchor.set(0.5);
    mainContainer.addChild(winningTitle);

    // Player Coins title.
    const playerTitle = new Text("Player Coins", {
        fill: 0xffff00,
        fontSize: 32,
        fontWeight: 'bold'
    });
    playerTitle.anchor.set(0.5);
    mainContainer.addChild(playerTitle);

    // Instruction / result text.
    const resultText = new Text("Click a coin to reveal a number", {
        fill: 0xffff00,
        fontSize: 24,
        fontWeight: 'bold'
    });
    resultText.anchor.set(0.5);
    mainContainer.addChild(resultText);

    // Container for winning number coins.
    const winningContainer = new Container();
    mainContainer.addChild(winningContainer);

    // Container for winning number coins.
    const playerContainer = new Container();
    mainContainer.addChild(playerContainer);

    // --- Play Button ---
    const playBtn = new Sprite(textures.play_button);
    playBtn.width = 200;
    playBtn.height = 110;
    playBtn.anchor.set(0.5);
    playBtn.interactive = true;
    playBtn.cursor = 'pointer';
    app.stage.addChild(playBtn);

    // --- Game data (initialised per ticket) ---
    let winningNumbers = [];
    let playerNumbers = [];
    let winFound = false;
    let allWinningRevealed = false;
    let ticketInProgress = false;

    function updateHUD() {
        hudText.text = `Balance: £${(balance / 100).toFixed(2)} | Ticket: £${(ticketPrice / 100).toFixed(2)}`;
        updatePriceButtons();
    }

    // Parses the scenario strings.
    function parseScenario(scenarioStr) {
        const parts = scenarioStr.split(";");

        // Extracts the winning numbers (after "W:").
        const winningNumbers = parts[0]
            .replace("W:", "")
            .split(",")
            .map(v => isNaN(v) ? v : Number(v));

        // Extracts the player numbers (after "P:").
        const playerNumbers = parts[1]
            .replace("P:", "")
            .split(",")
            .map(v => isNaN(v) ? v : Number(v));

        return { winningNumbers, playerNumbers };
    }

    // Enables and disables the player numbers.
    function setPlayerCoinsEnabled(enabled){
        playerContainer.children.forEach(coin => {
            coin.interactive = enabled;
            coin.cursor = enabled ? 'pointer' : 'not-allowed';
            coin.alpha = enabled ? 1 : 0.5;
        });
    }

    function startNewTicket() {
        if (ticketInProgress) {
            resultText.text = "Finish your current ticket first! ";
            return;
        }
        if (balance < ticketPrice) {
            resultText.text = "Insufficient funds!";
            return;
        }

        // Deducts ticket cost.
        balance -= ticketPrice;
        updateHUD();

        winFound = false;
        winThisTicket = 0;
        allWinningRevealed = false;
        ticketInProgress = true;

        // Picks a random scenario from the JSON.
        const scenarioStr = gameData.scenarios[
            Math.floor(Math.random() * gameData.scenarios.length)
        ];

        // Parses it into structured data.
        const scenario = parseScenario(scenarioStr);

        winningNumbers = scenario.winningNumbers.slice();
        playerNumbers = scenario.playerNumbers.slice();

        // Clears the old coins.
        winningContainer.removeChildren();
        playerContainer.removeChildren();

        // Creates the winning and player coins.
        setupCoins(winningContainer, winningNumbers, true);
        setupCoins(playerContainer, playerNumbers, false);

        setPlayerCoinsEnabled(false) // Unlocks the coins.; // Locks the coins at the start.

        resultText.text = "Click a winning number to reveal!";
        onResize();
    }

    function endTicket() {
        if (winThisTicket > 0) {
            balance += winThisTicket; // Adds winnings.
            resultText.text += `You Won: £${(winThisTicket / 100).toFixed(2)}!`;
        } else {
            resultText.text = "You Lost! Better luck next time!";
        }
        updateHUD();

        ticketInProgress = false; // Allows for a new ticket to be bought.
    }

    // Creates a row of coins.
    function setupCoins(container, numbers, isWinningRow) {
        // Creates coin graphics for each number.
        numbers.forEach((num, index) => {
            const coin = createCoin(num, isWinningRow);
            // Arranges them in a grid: 3 per row.
            coin.x = (index % 3) * 150;
            coin.y = Math.floor(index / 3) * 150;
            container.addChild(coin);
        });
    }

    // Creates a single coin.
    function createCoin(num, isWinningRow) {
        const coin = new Container();
        coin.number = num; // Stores the number for later lookup.

        const front = new Sprite(isWinningRow ? Assets.get("treasure_chest") : Assets.get("pirate_ship"));
        front.width = 100;
        front.height = 100;
        front.anchor.set(0.5);
        front.x = 50;
        front.y = 50;
        front.name = "front";

        const back = new Sprite();
        back.width = 100;
        back.height = 100;
        back.anchor.set(0.5);
        back.x = 50;
        back.y = 50;
        back.visible = false;
        back.name = "back";

        coin.addChild(front, back);
        coin.interactive = true;
        coin.cursor = 'pointer';

        coin.on('pointerdown', () => {
            if (coin.revealed) return; // Ignores, if the coin has already been flipped.
            coin.revealed = true;

            gsap.to(coin.scale, {
                x: 0,
                duration: 0.3,
                onComplete: () => {
                    if (isWinningRow) {
                        back.texture = Assets.get("treasure_chest_revealed");
                    } else {
                        if (Object.keys(gameData.instantWins).includes(num.toString())) {
                            back.texture = Assets.get("barrel_of_coins_revealed");
                            winThisTicket += gameData.instantWins[num][ticketPrice];
                            winFound = true;
                            resultText.text = `Instant Win: ${num}! `;
                        } else if (winningNumbers.includes(num)) {
                            back.texture = Assets.get("pirate_ship_revealed");
                            winThisTicket += ticketPrice * gameData.prizeMultipliers.match;
                            winFound = true;
                            resultText.text = `Matched ${num}! `;

                            // Flip the matching winning chest green
                            winningContainer.children.forEach(wc => {
                                if (wc.number === num && wc.revealed) {
                                    // FIXED: Corrected asset name to match expected capitalization
                                    wc.getChildByName("back").texture = Assets.get("treasure_chest_revealed_GREEN");
                                }
                            });
                        } else {
                            back.texture = Assets.get("pirate_ship_revealed_red");
                            if (!winFound) resultText.text = "No match yet...";
                        }
                    }

                    front.visible = false;
                    back.visible = true;
                    gsap.to(coin.scale, { x: 1, duration: 0.3 });

                    if (isWinningRow) {
                        const allRevealed = winningContainer.children.every(c => c.revealed);
                        if (allRevealed) {
                            allWinningRevealed = true;
                            resultText.text = "Now reveal your coins!";
                            setPlayerCoinsEnabled(true); // Unlocks the coins.
                        }
                    } else {
                        // --- Ends the ticket when all the cards have been revealed ---
                        const allRevealed = playerContainer.children.every(c => c.revealed);
                        if (allRevealed){
                            endTicket();
                        }
                    }
                }
            });
        });

        return coin;
    }

    // --- Handles the layout and centring ---
    function onResize() {
        const gapTitleToRow = 5; // Space under the titles.
        const gapGroups = 50; // Space between the winning and player groups.
        const gapBottom = 60; // Space before the result text.
        const padding = 20;

        // Positions the HUD at the top centre.
        hudText.x = app.screen.width * 0.5;

        // Positions the selector at the bottom right.
        selectorContainer.x = app.screen.width - selectorContainer.width - padding;
        selectorContainer.y = app.screen.height - selectorContainer.height - padding;

        // Positions the play button (right-centre above the selector).
        playBtn.x = app.screen.width - selectorContainer.width - padding - 30;
        playBtn.y = app.screen.height * 0.5;

        // Titles centred horizontally.
        winningTitle.x = 0;
        playerTitle.x = 0;
        resultText.x = 0;

        // Row containers pivoted to their middle so they stay centred.
        winningContainer.pivot.x = winningContainer.width * 0.5;
        playerContainer.pivot.x = playerContainer.width * 0.5;
        winningContainer.x = 0;
        playerContainer.x = 0;

        // Stacks everything vertically.
        let currentY = 0;
        winningTitle.y = currentY;
        currentY += winningTitle.height + gapTitleToRow;
        winningContainer.y = currentY;

        currentY += winningContainer.height + gapGroups;
        playerTitle.y = currentY;
        currentY += playerTitle.height + gapTitleToRow;
        playerContainer.y = currentY;

        currentY += playerContainer.height + gapBottom;
        resultText.y = currentY;

        // Calculates the true bounding box of everything inside the mainContainer.
        const bounds = mainContainer.getLocalBounds();

        // Sets the pivot to the centre of that bounding box.
        mainContainer.pivot.set(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.5);

        // Places that pivot at the centre of the screen.
        mainContainer.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
    }

    playBtn.on("pointerdown", () => startNewTicket());

    window.addEventListener('resize', onResize);
    updateHUD();
    onResize();

})();