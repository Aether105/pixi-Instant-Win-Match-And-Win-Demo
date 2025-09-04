/**
 * Holds all the asset loading (manifest, data.json, textures) and exposes them to state.
 */

import { Assets } from "https://cdn.jsdelivr.net/npm/pixi.js@8.x/dist/pixi.mjs";
import { state } from "./state.js";

export async function loadGameData() {
  const res = await fetch("./data.json");
  state.gameData = await res.json();
  state.ticketPrice = state.gameData.ticketPrices[0]; // Default ticket price set at £1.
}

export async function loadTextures() {
  // --- Initialises PIXI and Manifest ---
  await Assets.init({ manifest: "./manifest.json" });

  // Loads all the textures from the "main" bundle.
  state.textures = await Assets.loadBundle("main");
}
