// Script di test per verificare che lo scraping di Shamela funzioni
// Esegui con: tsx server/test-shamela-scraper.ts

import { searchShamelaTexts, getShamelaTextById } from "./shamela";

async function test() {
  console.log("Testing Shamela scraping...\n");

  // Test 1: Search
  console.log("1. Testing search...");
  try {
    const results = await searchShamelaTexts("التوحيد");
    console.log(`Found ${results.length} results`);
    if (results.length > 0) {
      console.log("First result:", results[0]);
    }
  } catch (error) {
    console.error("Search error:", error);
  }

  // Test 2: Get by ID (se hai un ID valido)
  console.log("\n2. Testing get by ID...");
  try {
    const text = await getShamelaTextById(1);
    if (text) {
      console.log("Text found:", text.title);
    } else {
      console.log("Text not found");
    }
  } catch (error) {
    console.error("Get by ID error:", error);
  }

  console.log("\nTest completed!");
}

// Solo se ENABLE_SHAMELA_SCRAPING=true
if (process.env.ENABLE_SHAMELA_SCRAPING === "true") {
  test();
} else {
  console.log("Shamela scraping is disabled. Set ENABLE_SHAMELA_SCRAPING=true in .env");
}

