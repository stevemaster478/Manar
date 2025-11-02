import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { insertTextSchema, insertBookmarkSchema, insertReadingHistorySchema } from "@shared/schema";
import { z } from "zod";
import { searchShamelaTexts, syncShamelaToDatabase } from "./shamela";

// Gemini AI for translations
async function translateWithGemini(text: string, targetLang: string = "it", isFullPage: boolean = false): Promise<string> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_AI_API_KEY non configurata");
  }

  const prompt = isFullPage
    ? `Traduci il seguente testo arabo completo in italiano. Mantieni la struttura del testo (paragrafi, linee, ecc.) e fornisci una traduzione accurata e fluente:\n\n${text}`
    : `Traduci il seguente testo arabo in italiano. Fornisci solo la traduzione, senza spiegazioni o commenti aggiuntivi:\n\n${text}`;

  // Use gemini-pro model (more stable) or try gemini-1.5-pro
  const modelName = "gemini-pro"; // Changed from gemini-1.5-flash which is not available
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: isFullPage ? 8192 : 2048,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Errore Gemini API: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!translatedText) {
    throw new Error("Nessuna traduzione ricevuta da Gemini");
  }

  return translatedText.trim();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes are now handled in server/auth.ts

  // Text search and retrieval
  app.get("/api/texts/search", isAuthenticated, async (req, res) => {
    try {
      const { q, author, category, era, useShamela } = req.query;
      
      // If useShamela is true, search via Shamela API first
      if (useShamela === "true" && q) {
        try {
          const shamelaResults = await searchShamelaTexts(
            q as string,
            author as string,
            category as string,
            era as string
          );
          
          // Sync results to local database
          if (shamelaResults.length > 0) {
            await syncShamelaToDatabase(shamelaResults, storage);
          }
        } catch (shamelaError) {
          console.error("Shamela API error (continuing with local search):", shamelaError);
          // Continue with local search if Shamela fails
        }
      }
      
      // Always search local database (includes synced Shamela results)
      const texts = await storage.searchTexts(
        q as string,
        author as string,
        category as string,
        era as string
      );
      
      res.json(texts);
    } catch (error) {
      console.error("Error searching texts:", error);
      res.status(500).json({ message: "Failed to search texts" });
    }
  });

  app.get("/api/texts/:id", isAuthenticated, async (req, res) => {
    try {
      const textId = parseInt(req.params.id);
      const { fromShamela, page } = req.query;
      
      // Se fromShamela=true e page specificata, scarica quella pagina specifica
      if (fromShamela === "true" && page && process.env.ENABLE_SHAMELA_SCRAPING === "true") {
        try {
          const { getShamelaPage } = await import("./shamela");
          const pageNumber = parseInt(page as string);
          const shamelaPage = await getShamelaPage(textId, pageNumber);
          
          if (shamelaPage) {
            // Ritorna la pagina senza salvare (le pagine sono dinamiche)
            return res.json(shamelaPage);
          }
        } catch (shamelaError) {
          console.error("Error fetching page from Shamela:", shamelaError);
          // Fallback al database locale
        }
      }
      
      // Se fromShamela=true (senza page), scarica il testo completo
      if (fromShamela === "true" && process.env.ENABLE_SHAMELA_SCRAPING === "true") {
        try {
          const { getShamelaTextById } = await import("./shamela-scraper");
          const shamelaText = await getShamelaTextById(textId);
          
          if (shamelaText) {
            // Sincronizza con il database locale
            await syncShamelaToDatabase([shamelaText], storage);
            // Ritorna il testo aggiornato dal database
            const text = await storage.getTextById(textId);
            if (text) {
              return res.json(text);
            }
          }
        } catch (shamelaError) {
          console.error("Error fetching from Shamela:", shamelaError);
          // Fallback al database locale
        }
      }
      
      const text = await storage.getTextById(textId);
      if (!text) {
        return res.status(404).json({ message: "Text not found" });
      }
      res.json(text);
    } catch (error) {
      console.error("Error fetching text:", error);
      res.status(500).json({ message: "Failed to fetch text" });
    }
  });

  // Translation endpoint
  app.post("/api/translate", isAuthenticated, async (req: any, res) => {
    try {
      const { textId, originalText, isFullPage } = req.body;

      if (!textId || !originalText) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // For full page translations, use a truncated key for caching
      const cacheKey = isFullPage ? originalText.substring(0, 100) + "...[FULL]" : originalText;
      
      // Check cache first
      const cached = await storage.getTranslation(textId, cacheKey);
      if (cached) {
        return res.json(cached);
      }

      // Translate with Gemini
      const translatedText = await translateWithGemini(originalText, "it", isFullPage);

      // Save to cache
      const translation = await storage.createTranslation({
        textId,
        originalText: cacheKey,
        translatedText,
        sourceLanguage: "ar",
        targetLanguage: "it",
        model: "gemini-pro",
      });

      res.json(translation);
    } catch (error) {
      console.error("Error translating text:", error);
      res.status(500).json({ message: error instanceof Error ? error.message : "Failed to translate text" });
    }
  });

  // Bookmarks
  app.get("/api/bookmarks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const bookmarks = await storage.getBookmarksByUserId(userId);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.get("/api/bookmarks/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const bookmarks = await storage.getRecentBookmarksByUserId(userId, 5);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching recent bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch recent bookmarks" });
    }
  });

  app.post("/api/bookmarks", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const data = insertBookmarkSchema.parse({ ...req.body, userId });
      const bookmark = await storage.createBookmark(data);
      res.status(201).json(bookmark);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid bookmark data", errors: error.errors });
      }
      console.error("Error creating bookmark:", error);
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  app.delete("/api/bookmarks/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const bookmarkId = req.params.id;
      await storage.deleteBookmark(bookmarkId, userId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  // Reading history
  app.get("/api/reading-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const history = await storage.getReadingHistoryByUserId(userId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching reading history:", error);
      res.status(500).json({ message: "Failed to fetch reading history" });
    }
  });

  app.get("/api/reading-history/recent", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const history = await storage.getRecentReadingHistoryByUserId(userId, 5);
      res.json(history);
    } catch (error) {
      console.error("Error fetching recent reading history:", error);
      res.status(500).json({ message: "Failed to fetch recent reading history" });
    }
  });

  app.post("/api/reading-history", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.id;
      const data = insertReadingHistorySchema.parse({ ...req.body, userId });
      const history = await storage.upsertReadingHistory(data);
      res.status(201).json(history);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid history data", errors: error.errors });
      }
      console.error("Error saving reading history:", error);
      res.status(500).json({ message: "Failed to save reading history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
