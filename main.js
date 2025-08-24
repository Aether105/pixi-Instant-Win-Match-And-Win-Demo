import { Application, Text, Container, Graphics } from './node_modules/pixi.js/dist/pixi.mjs';

(async () => {
    const app = new Application();
    await app.init({
        resizeTo: window,
        background: 0x1099bb
    });
    document.body.appendChild(app.canvas);

    // --- Balance and ticket price setup ---
    let balance = 2000; // Starting balance in pence.
    let ticketPrice = 100; // Default ticket price set at £1.
    let winThisTicket = 0; // How much the current ticket won.

    const hudText = new Text(`Balance: £${(balance/100).toFixed(2)} | Ticket: £${(ticketPrice/100).toFixed(2)}`, {
        fill: 0xffffff,
        fontSize: 20,
        fontWeight: 'bold'
    });
    hudText.anchor.set(0.5, 0);
    hudText.x = app.screen.width * 0.5;
    hudText.y = 10;
    app.stage.addChild(hudText);

    // --- Game data (initialised per ticket) ---
    let winningNumbers = [];
    let playerNumbers = [];
    const instantWins = ["IW1", "IW2"];
    let winFound = false;

    // Card layout settings.
    const cardSpacing = 150; // Space between the cards.
    const cardWidth = 100;
    const cardHeight = 100;

    // The container for the main game (everything goes inside of this).
    const mainContainer = new Container();
    app.stage.addChild(mainContainer);

    // Winning Numbers title.
    const winningTitle = new Text("Winning Numbers", {
        fill: 0xffffff,
        fontSize: 32,
        fontWeight: 'bold'
    });
    winningTitle.anchor.set(0.5);
    mainContainer.addChild(winningTitle);

    // Container for winning number cards.
    const winningContainer = new Container();
    mainContainer.addChild(winningContainer);

    // Player Numbers title.
    const playerTitle = new Text("Player Numbers", {
        fill: 0xffffff,
        fontSize: 32,
        fontWeight: 'bold'
    });
    playerTitle.anchor.set(0.5);
    mainContainer.addChild(playerTitle);

    // Container for player cards.
    const playerContainer = new Container();
    mainContainer.addChild(playerContainer);

    // Instruction / result text.
    const resultText = new Text("Click 'Buy Ticket' to play", {
        fill: 0xffffff,
        fontSize: 24,
        fontWeight: 'bold'
    });
    resultText.anchor.set(0.5);
    mainContainer.addChild(resultText);

    // --- Buy Ticket Button ---
    const buyBtn = new Graphics().roundRect(0, 0, 200, 60, 10).fill(0x0066ff);
    buyBtn.interactive = true;
    buyBtn.cursor = 'pointer';
    const buyLabel = new Text("Buy Ticket", {
        fill: 0xffffff,
        fontSize: 24,
        fontWeight: 'bold'
    });
    buyLabel.anchor.set(0.5);
    buyLabel.position.set(100,30);
    buyBtn.addChild(buyLabel);
    buyBtn.x = app.screen.width * 0.5 - 100;
    buyBtn.y = app.screen.height - 65;
    app.stage.addChild(buyBtn);

    buyBtn.on("pointerdown", () => {
        if (balance < ticketPrice) {
            resultText.text = "Not enough funds!";
            return;
        }
        balance -= ticketPrice; // Pays for a ticket.
        winThisTicket = 0;
        startNewTicket();
        updateHUD();
    });

    // --- Functions ---
    function updateHUD() {
        hudText.text = `Balance: £${(balance/100).toFixed(2)} | Ticket: £${(ticketPrice/100).toFixed(2)}`;
    }

    function startNewTicket() {
        // Resets the state.
        mainContainer.removeChild(winningContainer);
        mainContainer.removeChild(playerContainer);
        winningContainer.removeChildren();
        playerContainer.removeChildren();
        mainContainer.addChild(winningContainer);
        mainContainer.addChild(playerContainer);
        winFound = false;

        // Generates numbers.
        winningNumbers = pickNumbers(2, 30);
        playerNumbers = pickNumbers(6, 30);

        // Adds a possible instant win.
        if (Math.random() < 0.2) {
            const randomIndex = Math.floor(Math.random() * playerNumbers.length);
            playerNumbers[randomIndex] = instantWins[Math.floor(Math.random() * instantWins.length)];
        }

        // Creates the winning and player cards.
        setupCards(winningContainer, winningNumbers, true);
        setupCards(playerContainer, playerNumbers, false);

        resultText.text = "Click a card to reveal a number";
        onResize();
    }

    function endTicket() {
        balance += winThisTicket; // Add winnings.
        updateHUD();
        if (winThisTicket > 0) {
            resultText.text = `Ticket Won: £${(winThisTicket/100).toFixed(2)}!`;
        } else {
            resultText.text = "Ticket Lost!";
        }
    }

    function pickNumbers(count, max) {
        const nums = [];
        while (nums.length < count) {
            const n = Math.floor(Math.random() * max) + 1;
            if (!nums.includes(n)) nums.push(n);
        }
        return nums;
    }

    // Creates a row of cards.
    function setupCards(container, numbers, isWinningRow) {
        // Creates card graphics for each number.
        numbers.forEach((num, index) => {
            const card = createCard(num, isWinningRow);
            // Arranges them in a grid: 3 per row.
            card.x = (index % 3) * cardSpacing;
            card.y = Math.floor(index / 3) * cardSpacing;
            container.addChild(card);
        });
    }

    // Creates a single card (white square).
    function createCard(num, isWinningRow) {
        const card = new Graphics().rect(0, 0, cardWidth, cardHeight).fill(0xffffff);
        card.interactive = true;
        card.cursor = 'pointer';

        const q = new Text("?", {
            fill: 0x000000,
            fontSize: 48
        });
        q.anchor.set(0.5);
        q.position.set(cardWidth * 0.5, cardHeight * 0.5);
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
            numberText.position.set(cardWidth * 0.5, cardHeight * 0.5);
            card.addChild(numberText);

            // Only checks for wins on player cards.
            if (!isWinningRow) {
                if (["IW1","IW2"].includes(num)) {
                    winFound = true;
                    resultText.text = `Instant Win: ${num}!`;
                    card.tint = 0xffff00; // Highlights yellow.
                    winThisTicket += ticketPrice * 10; // Example fixed prize (10x the ticket).
                } else if (winningNumbers.includes(num)) {
                    winFound = true;
                    resultText.text = `Matched ${num}!`;
                    card.tint = 0xffff00;
                    winThisTicket += ticketPrice * 5; // Example prize (5x the ticket).
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
        const gapBottom = 40; // Space before the result text.

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

    window.addEventListener('resize', onResize);
    onResize();

})();
