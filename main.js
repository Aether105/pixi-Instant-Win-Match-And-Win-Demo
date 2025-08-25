import { Application, Text, Container, Graphics } from './node_modules/pixi.js/dist/pixi.mjs';

// --- Loads external data ---
let gameData;
async function loadGameData(){
    const res = await fetch("./data.json");
    gameData = await res.json();
}

(async () => {
    await loadGameData();

    const app = new Application();
    await app.init({
        resizeTo: window,
        background: 0x1099bb
    });
    document.body.appendChild(app.canvas);

    // --- Balance and ticket price setup ---
    let balance = 2000; // Starting balance in pence.
    let ticketPrice = gameData.ticketPrices[0]; // Default ticket price set at £1.
    let winThisTicket = 0; // How much the current ticket won.

    // The container for the main game (everything goes inside of this).
    const mainContainer = new Container();
    app.stage.addChild(mainContainer);

    
    const hudText = new Text("", {
        fill: 0xffffff,
        fontSize: 20,
        fontWeight: 'bold'
    });
    hudText.anchor.set(0.5, 0);
    hudText.x = app.screen.width * 0.5;
    hudText.y = 1;
    app.stage.addChild(hudText);

    // Winning Numbers title.
    const winningTitle = new Text("Winning Numbers", {
        fill: 0xffffff,
        fontSize: 32,
        fontWeight: 'bold'
    });
    winningTitle.anchor.set(0.5);
    mainContainer.addChild(winningTitle);

    // Player Numbers title.
    const playerTitle = new Text("Player Numbers", {
        fill: 0xffffff,
        fontSize: 32,
        fontWeight: 'bold'
    });
    playerTitle.anchor.set(0.5);
    mainContainer.addChild(playerTitle);

    // Instruction / result text.
    const resultText = new Text("Click a card to reveal a number", {
        fill: 0xffffff,
        fontSize: 24,
        fontWeight: 'bold'
    });
    resultText.anchor.set(0.5);
    mainContainer.addChild(resultText);

    // Container for winning number cards.
    const winningContainer = new Container();
    mainContainer.addChild(winningContainer);

    // Container for player cards.
    const playerContainer = new Container();
    mainContainer.addChild(playerContainer);
    

    // --- Buy Ticket Button ---
    const buyBtn = new Graphics().roundRect(0, 0, 140, 50, 12).fill(0x0066ff);
    buyBtn.interactive = true;
    buyBtn.cursor = 'pointer';

    const buyLabel = new Text("Buy Ticket", {
        fill: 0xffffff,
        fontSize: 23,
        fontWeight: 'bold'
    });
    buyLabel.anchor.set(0.5);
    buyLabel.position.set(70, 25);
    buyBtn.addChild(buyLabel);
    

    mainContainer.addChild(buyBtn);

    // --- Game data (initialised per ticket) ---
    let winningNumbers = [];
    let playerNumbers = [];
    let winFound = false;

    // --- Functions ---
    function updateHUD() {
        hudText.text = `Balance: £${(balance/100).toFixed(2)} | Ticket: £${(ticketPrice/100).toFixed(2)}`;
    }

    function startNewTicket() {
        if (balance < ticketPrice){
            resultText.text = "Insufficient funds!";
            return;
        }

        /// Deducts ticket cost.
        balance -= ticketPrice;
        updateHUD();

        winFound = false;
        winThisTicket = 0;

        // Picks a random scenario from the JSON.
        const scenario = gameData.scenarios[
            Math.floor(Math.random() * gameData.scenarios.length)
        ];

        winningNumbers = scenario.winningNumbers.slice();
        playerNumbers = scenario.playerNumbers.slice();

        // Clears the old cards.
        winningContainer.removeChildren();
        playerContainer.removeChildren();


        // Creates the winning and player cards.
        setupCards(winningContainer, winningNumbers, true);
        setupCards(playerContainer, playerNumbers, false);

        resultText.text = "Click a card to reveal a number";
        onResize();
    }

    function endTicket() {
        if (winThisTicket > 0) {
            balance += winThisTicket; // Add winnings.
            resultText.text += `You Won: £${(winThisTicket/100).toFixed(2)}!`;
        } else {
            resultText.text = "You Lost! Better luck next time!";
        }
        updateHUD();
    }

    // Creates a row of cards.
    function setupCards(container, numbers, isWinningRow) {
        // Creates card graphics for each number.
        numbers.forEach((num, index) => {
            const card = createCard(num, isWinningRow);
            // Arranges them in a grid: 3 per row.
            card.x = (index % 3) * 150;
            card.y = Math.floor(index / 3) * 150;
            container.addChild(card);
        });
    }

    // Creates a single card (white square).
    function createCard(num, isWinningRow) {
        const card = new Graphics().rect(0, 0, 100, 100).fill(0xffffff);
        card.interactive = true;
        card.cursor = 'pointer';

        const q = new Text("?", {
            fill: 0x000000,
            fontSize: 48
        });
        q.anchor.set(0.5);
        q.position.set(50, 50);
        card.addChild(q);

        card.on('pointerdown', () => {
            if (card.revealed) return; // Ignores if card has already been flipped.
            card.revealed = true;
            q.visible = false;

            const numberText = new Text(num.toString(), {
                fill: 0x000000,
                fontSize: 36
            });
            numberText.anchor.set(0.5);
            numberText.position.set(50, 50);
            card.addChild(numberText);

            // Only checks for wins on player cards.
            if (!isWinningRow) {
                if (Object.keys(gameData.instantWins).includes(num)) {
                    winFound = true;
                    resultText.text = `Instant Win: ${num}! `;
                    card.tint = 0xffff00; // Highlights yellow.
                    winThisTicket += gameData.instantWins[num];
                } else if (winningNumbers.includes(num)) {
                    winFound = true;
                    resultText.text = `Matched ${num}! `;
                    card.tint = 0xffff00;
                    winThisTicket += ticketPrice * gameData.prizeMultipliers.match;
                } else if (!winFound) {
                    resultText.text = "No match yet...";
                }

                // --- End the ticket when all cards have been revealed ---
                const allRevealed = playerContainer.children.every(c => c.revealed);
                if (allRevealed) {
                    endTicket();
                }
            }
        });

        return card;
    }

    // --- Handles the layout and centring ---
    function onResize() {
        const gapTitleToRow = 5; // Space under the titles.
        const gapGroups = 50; // Space between the winning and player groups.
        const gapBottom = 60; // Space before the result text.

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

        // Places 'Buy Ticket' below the resultText.
        buyBtn.x = -buyBtn.width * 0.5; // Horizontal centring.
        buyBtn.y = resultText.y + resultText.height + 20;

        // Calculates the true bounding box of everything inside the mainContainer.
        const bounds = mainContainer.getLocalBounds();

        // Sets the pivot to the centre of that bounding box.
        mainContainer.pivot.set(bounds.x + bounds.width * 0.5, bounds.y + bounds.height * 0.5);

        // Places that pivot at the centre of the screen.
        mainContainer.position.set(app.screen.width * 0.5, app.screen.height * 0.5);
    }

    buyBtn.on("pointerdown", () => startNewTicket());

    window.addEventListener('resize', onResize);
    updateHUD();
    onResize();

})();
