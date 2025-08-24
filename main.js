import { Application, Text, Container, Graphics } from './node_modules/pixi.js/dist/pixi.mjs';

(async () => {
    const app = new Application();
    await app.init({
        resizeTo: window,
        background: 0x1099bb
    });
    document.body.appendChild(app.canvas);

    // --- Game data ---
    const winningNumbers = pickNumbers(2, 30);
    const playerNumbers = pickNumbers(6, 30);
    const instantWins = ["IW1", "IW2"];

    // A flag to see if the player has matched yet.
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
    const resultText = new Text("Click a card to reveal a number", {
        fill: 0xffffff,
        fontSize: 24,
        fontWeight: 'bold'
    });
    resultText.anchor.set(0.5);
    mainContainer.addChild(resultText);

    // Creates the winning and player cards.
    setupCards(winningContainer, winningNumbers, true);
    setupCards(playerContainer, playerNumbers, false);

    // --- Handles the layout and centring ---
    function onResize() {
        const gapTitleToRow = 30; // Space under the titles.
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


    function pickNumbers(count, max) {
        const nums = [];
        while (nums.length < count) {
            const n = Math.floor(Math.random() * max) + 1;
            if (!nums.includes(n)) nums.push(n);
        }
        return nums;
    }

    // Create a row of cards.
    function setupCards(container, numbers, isWinningRow) {
        // Adds an instant win randomly into the player's numbers
        if (!isWinningRow && Math.random() < 0.2) {
            const randomIndex = Math.floor(Math.random() * numbers.length);
            numbers[randomIndex] = instantWins[Math.floor(Math.random() * instantWins.length)];
        }

        // Creates card graphics for each number.
        numbers.forEach((num, index) => {
            const card = createCard(num, isWinningRow);
            // Arranges in them in a grid: 3 per row.
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

            // Shows the actual number or instant-win.
            const numberText = new Text(num.toString(), {
                fill: 0x000000,
                fontSize: 36
            });
            numberText.anchor.set(0.5);
            numberText.position.set(cardWidth * 0.5, cardHeight * 0.5);
            card.addChild(numberText);

            // Only checks for wins on player cards.
            if (!isWinningRow) {
                if (["IW1", "IW2"].includes(num)) {
                    winFound = true;
                    resultText.text = `You found an Instant Win: ${num}! You win!`;
                    card.tint = 0xffff00; // Highlights yellow.
                } else if (winningNumbers.includes(num)) {
                    winFound = true;
                    resultText.text = `You matched ${num}! You win!`;
                    card.tint = 0xffff00;
                } else if (!winFound) {
                    resultText.text = "No match yet....";
                }
            }
        });

        return card;
    }
})();