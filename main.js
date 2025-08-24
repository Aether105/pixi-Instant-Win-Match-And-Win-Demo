const winningContainer = document.getElementById("winning");
const playerContainer = document.getElementById("players");
const result = document.getElementById("result");

// Generates random numbers.
const winningNumbers = pickNumbers(2, 30); // Picks 2 random numbers between 1 and 30.
const playerNumbers = pickNumbers(6, 30); // Picks 6 random numbers between 1 and 30.
const instantWins = ["IW1", "IW2"];

// A flag to see if the player has matched yet.
let winFound = false;

// Renders the cards into the page.
setupCards(winningContainer, winningNumbers, true);
setupCards(playerContainer, playerNumbers, false);

function pickNumbers(count, max) {
    const nums = [];
    while (nums.length < count) {
        const n = Math.floor(Math.random() * max) + 1;
        if (!nums.includes(n)) nums.push(n);
    }
    return nums;
}

function setupCards(container, numbers, isWinningRow) {
    if (!isWinningRow){
        // Decides if an instant win should be included.
        if (Math.random() < 0.2){ // 20% chance of an IW.
            const randomIndex = Math.floor(Math.random() * numbers.length);
            numbers[randomIndex] = instantWins[Math.floor(Math.random() * instantWins.length)];
        }
    }

    numbers.forEach(num => {
        const card = document.createElement("div");
        card.className = "card";
        card.textContent = "?"; // hidden until it's clicked.
        container.appendChild(card);

        card.addEventListener("click", () => {
            card.textContent = num;
            card.classList.add("revealed");

            if (!isWinningRow){
                if (instantWins.includes(num)){
                    winFound = true;
                    result.textContent = `You found an Instant Win: ${num}! You win!`;
                } else if (winningNumbers.includes(num)){
                    winFound = true;
                    result.textContent = `You matched ${num}! You win!`;
                } else if (!winFound) {
                    result.textContent = "No match yet...";
                }
            }
        }, { once: true }); // Makes sure each card can only be clicked once.
    });
}