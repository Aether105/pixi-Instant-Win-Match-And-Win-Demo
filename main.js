import { Application, Text, Container, Sprite, Assets, Graphics, Polygon } from 'https://cdn.jsdelivr.net/npm/pixi.js@8.x/dist/pixi.mjs';
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

    // --- Info-Meter ---
    const infoMtr = new Sprite(textures.info_meter);
    infoMtr.width = 700;
    infoMtr.height = 450;
    infoMtr.anchor.set(0.5);
    app.stage.addChild(infoMtr);

    // Info Minus button.
    const infoMinus = new Sprite(textures.minus);
    infoMinus.width = 110;
    infoMinus.height = 120;
    infoMinus.anchor.set(0.5);
    infoMinus.eventMode = 'static'; // The v8 way to receive events in replacement for interactive = true.
    infoMinus.cursor = 'pointer';
    
    infoMtr.addChild(infoMinus);

    // Relative coordinates inside the meter.
    infoMinus.x = infoMtr.width * -0.78;
    infoMinus.y = infoMtr.height * 0.185;

    // Uses the local texture size for the hitArea rather than the 110x120.
    const { width: tw, height: th } = infoMinus.texture;

    // The polygon points are expressed as fractions of the texture size, so it works regardless of the size the sprite is drawn at.
    infoMinus.hitArea = new Polygon([
        -tw * 0.5, 0,
        -0.30 * tw, -0.40 * th,
        tw * 0.5, -th * 0.5,
        tw * 0.5, th * 0.5,
        -0.30 * tw, 0.40 * th
    ]);

    // Info Plus button.
    const infoPlus = new Sprite(textures.plus);
    infoPlus.width = 110;
    infoPlus.height = 120;
    infoPlus.anchor.set(0.5);
    infoPlus.eventMode = 'static';
    infoPlus.cursor = 'pointer';
    
    infoMtr.addChild(infoPlus);

    infoPlus.x = infoMtr.width * -0.4;
    infoPlus.y = infoMtr.height * 0.185;

    const { width: tw2, height: th2 } = infoPlus.texture;

    infoPlus.hitArea = new Polygon([
        -tw2 * 0.5, 0,
        -0.30 * tw2, -0.40 * th2,
        tw2 * 0.5, -th2 * 0.5,
        tw2 * 0.5, th2 * 0.5,
        -0.30 * tw2, 0.40 * th2
    ]);

    // Ticket price text (between the minus and plus buttons).
    const priceText = new Text("", {
        fill: 0xffff00,
        fontSize: 42,
        fontWeight: 'bold'
    });
    priceText.anchor.set(0.5);
    infoMtr.addChild(priceText);
    priceText.x = (infoMinus.x + infoPlus.x) * 0.5;
    priceText.y = infoMinus.y;

    // Balance text.
    const balanceText = new Text("", {
        fill: 0xffff00,
        fontSize: 42,
        fontWeight: 'bold'
    });
    balanceText.anchor.set(0.5);
    infoMtr.addChild(balanceText);
    balanceText.x = priceText.x + 410;
    balanceText.y = priceText.y;

    // Win text.
    const ticketWinText = new Text("£0.00", {
        fill: 0xffff00,
        fontSize: 42,
        fontWeight: 'bold'
    });
    ticketWinText.anchor.set(0.5);
    infoMtr.addChild(ticketWinText);
    ticketWinText.x = balanceText.x + 435;
    ticketWinText.y = balanceText.y;
    
    function updatePriceDisplay(){
        priceText.text = `£${(ticketPrice / 100).toFixed(2)}`;
    }

    function updateBalanceDisplay(change = 0){
        balanceText.text = `£${(balance / 100).toFixed(2)}`;

        if (change > 0){
            balanceText.style.fill = 0x00ff00;
        } else if (change < 0){
            balanceText.style.fill = 0xff0000;
        } else {
            balanceText.style.fill = 0xffff00;
        }
    }

    function updateTicketWinDisplay(){
        ticketWinText.text = `£${(winThisTicket / 100).toFixed(2)}`;
    }

    infoMinus.on('pointerdown', () => {
        const index = gameData.ticketPrices.indexOf(ticketPrice);
        if (index > 0){
            ticketPrice = gameData.ticketPrices[index - 1];
            updatePriceDisplay();
        }
    });

    infoPlus.on('pointerdown', () => {
        const index = gameData.ticketPrices.indexOf(ticketPrice);
        if (index < gameData.ticketPrices.length -1){
            ticketPrice = gameData.ticketPrices[index + 1];
            updatePriceDisplay();
        }
    });
    
    
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

    // --- Overlay for the results ---
    const overlay = new Container();
    overlay.visible = false;
    app.stage.addChild(overlay);

    const overlayBg = new Graphics()
        .rect(0, 0, app.screen.width, app.screen.height)
        .fill({ color: 0x000000, alpha: 0.7 });
    overlay.addChild(overlayBg);

    const overlayText = new Text("", {
        fill: 0xffff00,
        fontSize: 64,
        fontWeight: 'bold',
        align: 'center'
    });
    overlayText.anchor.set(0.5);
    overlay.addChild(overlayText);

    function showOverlay(message, colour = 0xffff00){
        overlayText.text = message;
        overlayText.style.fill = colour;
        overlayText.x = app.screen.width * 0.5;
        overlayText.y = app.screen.height * 0.5;
        overlayBg.width = app.screen.width;
        overlayBg.height = app.screen.height;
        overlay.visible = true;
        overlay.alpha = 0;
        gsap.to(overlay, { alpha: 1, duration: 0.5 });
        setTimeout(() => {
            gsap.to(overlay, { alpha: 0, duration: 0.5, onComplete: () => overlay.visible = false }, 2500);
        })
    }


    // --- Game data (initialised per ticket) ---
    let winningNumbers = [];
    let playerNumbers = [];
    let winFound = false;
    let allWinningRevealed = false;
    let ticketInProgress = false;
    

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
    function setPlayerCoinsEnabled(enabled) {
        playerContainer.children.forEach(coin => {
            coin.interactive = enabled;
            coin.cursor = enabled ? 'pointer' : 'not-allowed';
            coin.alpha = enabled ? 1 : 0.5;
        });
    }

    function startNewTicket() {
        if (ticketInProgress) {
            return;
        }
        if (balance < ticketPrice) {
            return;
        }

        // Makes sure the overlay is hidden when a new ticket is started.
        overlay.visible = false;
        overlay.alpha = 0;

        // Deducts ticket cost.
        balance -= ticketPrice;
        updateBalanceDisplay(-ticketPrice);

        winFound = false;
        winThisTicket = 0;
        updateTicketWinDisplay(); // Resets the ticket win.
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

        onResize();
    }

    function endTicket() {
        if (winThisTicket > 0) {
            balance += winThisTicket; // Adds winnings.
            updateBalanceDisplay(winThisTicket);
            showOverlay(`Congrats! You Won: £${(winThisTicket / 100).toFixed(2)}!`, 0x00ff00);
        } else {
            updateBalanceDisplay(0);
            showOverlay("You Lost! Better luck next time!", 0xff0000);
        }
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
                            updateTicketWinDisplay();
                            winFound = true;
                        } else if (winningNumbers.includes(num)) {
                            back.texture = Assets.get("treasure_chest_revealed_GREEN");
                            winThisTicket += ticketPrice * gameData.prizeMultipliers.match;
                            updateTicketWinDisplay();
                            winFound = true;

                            // Flips the matching winning chest, green.
                            winningContainer.children.forEach(wc => {
                                if (wc.number === num && wc.revealed) {
                                    wc.getChildByName("back").texture = Assets.get("treasure_chest_revealed_GREEN");
                                }
                            });
                        } else {
                            back.texture = Assets.get("pirate_ship_revealed_red");
                        }
                    }

                    front.visible = false;
                    back.visible = true;
                    gsap.to(coin.scale, { x: 1, duration: 0.3 });

                    if (isWinningRow) {
                        const allRevealed = winningContainer.children.every(c => c.revealed);
                        if (allRevealed) {
                            setPlayerCoinsEnabled(true); // Unlocks the coins.
                        }
                    } else {
                        // --- Ends the ticket when all the cards have been revealed ---
                        const allRevealed = playerContainer.children.every(c => c.revealed);
                        if (allRevealed) {
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
        const padding = 20;

        // Positions the play button (right-centre above the selector).
        playBtn.x = app.screen.width - padding - 100;
        playBtn.y = app.screen.height * 0.5;

        // Titles centred horizontally.
        winningTitle.x = 0;
        playerTitle.x = 0;

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

        // Calculates the true bounding box of everything inside the mainContainer.
        const bounds = mainContainer.getLocalBounds();

        // Sets the pivot to the centre of that bounding box.
        mainContainer.pivot.set(bounds.x + bounds.width * 0.5, bounds.y);

        // Places that pivot at the centre of the screen.
        mainContainer.position.set(app.screen.width * 0.5, 30);

        // Positions the info meter at the bottom centre.
        infoMtr.x = app.screen.width * 0.5;
        infoMtr.y = app.screen.height - infoMtr.height * 0.5 + 140; // 140px margin.
    }

    playBtn.on("pointerdown", () => startNewTicket());

    window.addEventListener('resize', onResize);
    updatePriceDisplay();
    updateBalanceDisplay(0);
    updateTicketWinDisplay();
    onResize();

})();