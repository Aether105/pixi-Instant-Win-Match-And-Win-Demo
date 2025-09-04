/**
 * Holds the helper functions shared by multiple files (formatting, maths, etc.).
 */

// Parses the scenario strings.
export function parseScenario(scenarioStr) {
  const parts = scenarioStr.split(";");

  // Extracts the winning numbers (after "W:").
  const winningNumbers = parts[0]
    .replace("W:", "")
    .split(",")
    .map((v) => (isNaN(v) ? v : Number(v)));

  // Extracts the player numbers (after "P:").
  const playerNumbers = parts[1]
    .replace("P:", "")
    .split(",")
    .map((v) => (isNaN(v) ? v : Number(v)));

  return { winningNumbers, playerNumbers };
}