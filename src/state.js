/**
 * Global state: holds the balance, ticket price, win amount and loaded textures.
 */

// Shared state for balance, ticket, etc.
export const state = {
  app: null,
  textures: null,
  gameData: null,

  balance: 2000, // Starting balance in pence.
  ticketPrice: 0,
  winThisTicket: 0,
  winningNumbers: [],
  playerNumbers: [],
  ticketInProgress: false,
  gamePhase: "start", // Start -> setup -> playing.
};
