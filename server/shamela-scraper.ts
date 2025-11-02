// Web scraping integration for Shamela.ws
// ⚠️ IMPORTANTE: Verifica i termini di servizio di Shamela.ws prima di usare
// Implementato con rate limiting e rispetto per il server

import * as cheerio from "cheerio";

interface ShamelaSearchResult {
  id: number;
  title: string;
  author: string;
  category?: string;
  era?: string;
  content: string;
  metadata?: Record<string, any>;
  url?: string;
}

// Rate limiting: max requests per minute
const RATE_LIMIT = 10; // requests per minute
let requestCount = 0;
let lastReset = Date.now();

function checkRateLimit(): boolean {
  const now = Date.now();
  if (now - lastReset > 60000) {
    // Reset ogni minuto
    requestCount = 0;
    lastReset = now;
  }
  
  if (requestCount >= RATE_LIMIT) {
    return false;
  }
  
  requestCount++;
  return true;
}

/**
 * Search texts from Shamela.ws using web scraping
 */
export async function searchShamelaTexts(
  query: string,
  author?: string,
  category?: string,
  era?: string
): Promise<ShamelaSearchResult[]> {
  if (!checkRateLimit()) {
    console.warn("Rate limit exceeded for Shamela scraping");
    return [];
  }

  try {
    const baseUrl = "https://shamela.ws";
    // Try different search URL patterns
    const searchUrls = [
      `${baseUrl}/search`,
      `${baseUrl}/book/search`,
      `${baseUrl}/search/book`,
    ];
    
    let searchUrl = searchUrls[0];
    
    // Build search parameters
    const params = new URLSearchParams({
      q: query,
    });
    
    if (author) params.append("author", author);
    if (category) params.append("category", category);
    if (era) params.append("era", era);

    // Fetch search page with proper headers
    const response = await fetch(`${searchUrl}?${params.toString()}`, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
        "Referer": "https://shamela.ws/",
        "Connection": "keep-alive",
      },
    });

    if (!response.ok) {
      throw new Error(`Shamela scraping error: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    const results: ShamelaSearchResult[] = [];

    // Parse search results - adatta i selettori CSS in base alla struttura reale del sito
    // NOTA: I selettori potrebbero dover essere adattati visitando shamela.ws e ispezionando l'HTML
    
    // Prova diversi pattern comuni per risultati di ricerca
    // Ordine dalla più specifica alla più generale
    const selectors = [
      // Pattern più comuni per siti di libri islamici
      ".search-results .book, .search-results .result",
      ".book-list .book-item, .book-list .item",
      "table.search-results tr, table.results tr",
      ".book-item, .result-item, .book-card",
      ".search-result, .book-result",
      "article.book, .book-list-item",
      "table tr", // Spesso i risultati sono in tabelle
      ".list-item, .item-result",
      // Pattern generici
      "[class*='book'], [class*='result'], [class*='search']",
      "div > a[href*='/book/']", // Link che contengono /book/
    ];

    let found = false;
    
    for (const selector of selectors) {
      const $items = $(selector);
      if ($items.length > 0) {
        found = true;
        
        $items.each((index, element) => {
      try {
        const $el = $(element);
        
        // Estrai link (importante farlo per primo)
        const link = $el.find("a").first().attr("href") || 
                    $el.attr("href") ||
                    ($el.is("a") ? $el.attr("href") : null);
        
        // Se non c'è link valido, salta questo elemento
        if (!link || !link.includes("/book/")) {
          return;
        }
        
        // Estrai ID dall'URL
        const idMatch = link.match(/\/(\d+)/);
        const id = idMatch ? parseInt(idMatch[1]) : index + 1000;
        
        // Estrai titolo - prova diversi selettori
        const title = $el.find("h1, h2, h3, h4, .title, .book-title, [class*='title']").first().text().trim() || 
                     $el.find("a").first().text().trim() ||
                     $el.text().trim().split('\n')[0].trim();
        
        // Estrai autore - prova diversi selettori
        const author = $el.find(".author, .by, .book-author, [class*='author']").text().trim() ||
                      $el.text().trim().match(/di\s+([^\n]+)|by\s+([^\n]+)|(\w+\s+\w+)/)?.[1] || "";
        
        // Valida che abbiamo almeno un titolo valido
        if (title && title.length > 2 && id > 0) {
          const fullUrl = link.startsWith("http") ? link : `${baseUrl}${link.startsWith("/") ? link : "/" + link}`;
          
          // Evita duplicati
          if (!results.find(r => r.id === id)) {
            results.push({
              id,
              title: title.substring(0, 500), // Limita lunghezza
              author: (author || "").substring(0, 200),
              content: "",
              url: fullUrl,
              metadata: {
                source: "shamela.ws",
                scrapedAt: new Date().toISOString(),
                searchQuery: query,
              },
            });
          }
        }
      } catch (error) {
        console.error("Error parsing search result:", error);
      }
    });
    
    break; // Usa il primo selettore che trova risultati
      }
    }
    
    // Se non trova risultati, prova a cercare tutti i link che contengono /book/
    if (results.length === 0) {
      console.log(`[Shamela Scraper] Nessun risultato trovato con selettori standard. Provo pattern alternativi...`);
      
      // Cerca tutti i link che contengono /book/
      $("a[href*='/book/']").each((index, element) => {
        try {
          const $link = $(element);
          const href = $link.attr("href");
          if (!href) return;
          
          const idMatch = href.match(/\/book\/(\d+)/);
          if (!idMatch) return;
          
          const id = parseInt(idMatch[1]);
          const title = $link.text().trim() || 
                       $link.closest("tr, li, div").find(".title, h3, h4").first().text().trim() ||
                       $link.closest("tr, li, div").text().trim().split('\n')[0].trim();
          
          if (title && title.length > 2) {
            // Evita duplicati
            if (!results.find(r => r.id === id)) {
              results.push({
                id,
                title: title.substring(0, 500),
                author: "",
                content: "",
                url: href.startsWith("http") ? href : `${baseUrl}${href.startsWith("/") ? href : "/" + href}`,
                metadata: {
                  source: "shamela.ws",
                  scrapedAt: new Date().toISOString(),
                  searchQuery: query,
                },
              });
            }
          }
        } catch (error) {
          // Skip errore per questo elemento
        }
      });
      
      if (results.length > 0) {
        console.log(`[Shamela Scraper] Trovati ${results.length} risultati con pattern alternativo`);
      }
    }

    return results.slice(0, 50); // Limit to 50 results
  } catch (error) {
    console.error("Error scraping Shamela:", error);
    return [];
  }
}

/**
 * Get full text content from Shamela by book ID or URL
 */
export async function getShamelaTextById(id: number, url?: string): Promise<ShamelaSearchResult | null> {
  if (!checkRateLimit()) {
    console.warn("Rate limit exceeded for Shamela scraping");
    return null;
  }

  try {
    const baseUrl = "https://shamela.ws";
    const bookUrl = url || `${baseUrl}/book/${id}`;

    const response = await fetch(bookUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
        "Referer": "https://shamela.ws/",
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Shamela scraping error: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Estrai informazioni del libro
    const title = $("h1, .book-title, .title, [class*='title']").first().text().trim();
    const author = $(".author, .book-author, .by, [class*='author']").first().text().trim();
    
    // Estrai introduzione - spesso presente prima del contenuto principale
    const introduction = $(".introduction, .intro, .book-intro, [class*='intro'], .description, .summary").first().text().trim() ||
                       $("p:first-of-type, .first-paragraph").first().text().trim();
    
    // Estrai contenuto - prova diversi selettori per il contenuto principale
    // Rimuovi elementi non necessari (header, footer, nav, etc.)
    $("header, footer, nav, .sidebar, .menu, script, style").remove();
    
    const contentSelectors = [
      ".book-content, .content, .text-content, .book-text",
      "#content, main .content, article .content",
      ".book-body, article, main",
      "[class*='content'], [class*='text']",
      "body > *:not(header):not(footer):not(nav)",
    ];
    
    let content = "";
    for (const selector of contentSelectors) {
      const $content = $(selector).first();
      if ($content.length > 0 && $content.text().trim().length > 100) {
        content = $content.text().trim();
        break;
      }
    }
    
    // Se ancora non trovato, prova a prendere tutto il testo principale
    if (!content || content.length < 100) {
      content = $("body").clone().children("header, footer, nav, script, style").remove().end().text().trim();
    }
    
    // Estrai informazioni su pagine/capitoli se disponibili
    const chapters: Array<{ id: number; title: string; page?: number }> = [];
    $("a[href*='/book/'], a[href*='/page/'], .chapter-link, .page-link").each((idx, el) => {
      const $link = $(el);
      const href = $link.attr("href");
      const linkText = $link.text().trim();
      if (href && linkText && (href.includes("/book/") || href.includes("/page/"))) {
        const pageMatch = href.match(/page[\/=](\d+)/);
        const chapterIdMatch = href.match(/book[\/=](\d+)/);
        chapters.push({
          id: chapterIdMatch ? parseInt(chapterIdMatch[1]) : idx,
          title: linkText,
          page: pageMatch ? parseInt(pageMatch[1]) : undefined,
        });
      }
    });

    if (!title && !content) {
      return null;
    }

    return {
      id,
      title: title || `Libro ${id}`,
      author: author || "",
      content: content || "",
      introduction: introduction || undefined,
      url: bookUrl,
      chapters: chapters.length > 0 ? chapters : undefined,
      metadata: {
        source: "shamela.ws",
        scrapedAt: new Date().toISOString(),
        hasIntroduction: !!introduction,
        hasChapters: chapters.length > 0,
      },
    };
  } catch (error) {
    console.error("Error fetching Shamela text:", error);
    return null;
  }
}

/**
 * Get text content from a Shamela URL
 */
export async function getShamelaTextByUrl(url: string): Promise<ShamelaSearchResult | null> {
  const idMatch = url.match(/\/(\d+)/);
  const id = idMatch ? parseInt(idMatch[1]) : 0;
  return getShamelaTextById(id, url);
}

/**
 * Get a specific page/chapter from a Shamela book
 */
export async function getShamelaPage(bookId: number, pageNumber: number): Promise<ShamelaSearchResult | null> {
  if (!checkRateLimit()) {
    console.warn("Rate limit exceeded for Shamela scraping");
    return null;
  }

  try {
    const baseUrl = "https://shamela.ws";
    // Try different URL patterns for pages
    const pageUrls = [
      `${baseUrl}/book/${bookId}/${pageNumber}`,
      `${baseUrl}/book/${bookId}/page/${pageNumber}`,
      `${baseUrl}/book/${bookId}?page=${pageNumber}`,
    ];

    let html = "";
    let successUrl = "";

    // Try each URL pattern until one works
    for (const pageUrl of pageUrls) {
      try {
        const response = await fetch(pageUrl, {
          method: "GET",
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "ar,en-US;q=0.9,en;q=0.8",
            "Referer": `https://shamela.ws/book/${bookId}`,
          },
        });

        if (response.ok) {
          html = await response.text();
          successUrl = pageUrl;
          break;
        }
      } catch (error) {
        // Try next URL pattern
        continue;
      }
    }

    if (!html) {
      return null;
    }

    const $ = cheerio.load(html);

    // Extract page information
    const title = $("h1, .book-title, .title, [class*='title']").first().text().trim();
    const author = $(".author, .book-author, .by, [class*='author']").first().text().trim();

    // Remove unwanted elements
    $("header, footer, nav, .sidebar, .menu, script, style").remove();

    // Extract page content
    const contentSelectors = [
      ".page-content, .content, .text-content, .book-text",
      "#content, main .content, article .content",
      ".book-body, article, main",
      "[class*='content'], [class*='text']",
    ];

    let content = "";
    for (const selector of contentSelectors) {
      const $content = $(selector).first();
      if ($content.length > 0 && $content.text().trim().length > 50) {
        content = $content.text().trim();
        break;
      }
    }

    if (!content || content.length < 50) {
      content = $("body").clone().children("header, footer, nav, script, style").remove().end().text().trim();
    }

    // Extract navigation links (previous/next pages)
    const nextPageLink = $("a[href*='next'], a[rel='next'], .next-page, .pagination a").attr("href");
    const prevPageLink = $("a[href*='prev'], a[rel='prev'], .prev-page").attr("href");

    return {
      id: bookId,
      title: title || `Libro ${bookId} - Pagina ${pageNumber}`,
      author: author || "",
      content: content || "",
      url: successUrl,
      currentPage: pageNumber,
      metadata: {
        source: "shamela.ws",
        scrapedAt: new Date().toISOString(),
        pageNumber,
        hasNextPage: !!nextPageLink,
        hasPrevPage: !!prevPageLink,
      },
    };
  } catch (error) {
    console.error(`Error fetching Shamela page ${pageNumber}:`, error);
    return null;
  }
}

