// Integration with Shamela.ws using web scraping
// ⚠️ IMPORTANTE: 
// - Verifica i termini di servizio di Shamela.ws prima di usare
// - Lo scraping potrebbe violare i ToS del sito
// - Usa con responsabilità e rispetta rate limiting

import { searchShamelaTexts as scrapeSearch, getShamelaTextById as scrapeGetById, getShamelaTextByUrl } from "./shamela-scraper";

export interface ShamelaSearchResult {
  id: number;
  title: string;
  author: string;
  category?: string;
  era?: string;
  content: string;
  introduction?: string; // Introduzione del libro da Shamela
  metadata?: Record<string, any>;
  url?: string;
  pages?: number; // Numero totale di pagine
  currentPage?: number; // Pagina corrente se applicabile
  chapters?: Array<{ id: number; title: string; page?: number }>; // Lista capitoli
}

/**
 * Search texts from Shamela.ws using web scraping
 * 
 * ⚠️ LEGAL WARNING: Web scraping potrebbe violare i termini di servizio.
 * Usa con responsabilità e implementa rate limiting appropriato.
 */
export async function searchShamelaTexts(
  query: string,
  author?: string,
  category?: string,
  era?: string
): Promise<ShamelaSearchResult[]> {
  // Check if scraping is enabled
  const enableScraping = process.env.ENABLE_SHAMELA_SCRAPING === "true";
  
  if (!enableScraping) {
    // Non loggare ogni volta, solo se debug mode
    if (process.env.NODE_ENV === "development" && Math.random() < 0.1) {
      console.log("Shamela scraping disabled - set ENABLE_SHAMELA_SCRAPING=true in .env to enable");
    }
    return [];
  }

  try {
    return await scrapeSearch(query, author, category, era);
  } catch (error) {
    console.error("Shamela scraping error:", error);
    return [];
  }
}

/**
 * Get a specific text from Shamela by ID using scraping
 */
export async function getShamelaTextById(id: number): Promise<ShamelaSearchResult | null> {
  const enableScraping = process.env.ENABLE_SHAMELA_SCRAPING === "true";
  
  if (!enableScraping) {
    return null;
  }

  try {
    return await scrapeGetById(id);
  } catch (error) {
    console.error("Error fetching Shamela text:", error);
    return null;
  }
}

/**
 * Get text by URL
 */
export { getShamelaTextByUrl };

/**
 * Get a specific page from a Shamela book
 */
export async function getShamelaPage(bookId: number, pageNumber: number): Promise<ShamelaSearchResult | null> {
  const enableScraping = process.env.ENABLE_SHAMELA_SCRAPING === "true";
  
  if (!enableScraping) {
    return null;
  }

  try {
    const { getShamelaPage: scrapePage } = await import("./shamela-scraper");
    return await scrapePage(bookId, pageNumber);
  } catch (error) {
    console.error("Error fetching Shamela page:", error);
    return null;
  }
}

/**
 * Sync Shamela search results to local database
 */
export async function syncShamelaToDatabase(
  results: ShamelaSearchResult[],
  storage: any
): Promise<void> {
  for (const result of results) {
    try {
      await storage.createText({
        id: result.id,
        title: result.title,
        author: result.author,
        category: result.category,
        era: result.era,
        content: result.content,
        introduction: result.introduction,
        metadata: {
          ...result.metadata,
          chapters: result.chapters,
          pages: result.pages,
          currentPage: result.currentPage,
          source: "shamela.ws",
        },
      });
    } catch (error) {
      // Text might already exist, skip
      console.log(`Text ${result.id} already exists or error: ${error}`);
    }
  }
}

