import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://cuevana3.to";
const SCRAPER_API_KEY = "face5a42440beebf029a84b4b333dcaf";
const SCRAPER_API_URL = "https://api.scraperapi.com";

export interface CuevanaStream {
    quality: string;
    url: string;
    language: string;
}

interface PlayerOption {
    title: string;
    dataPost: string;
    dataNume: string;
}

/**
 * Search for a movie or TV show on Cuevana using direct scraping with anti-bot headers
 */
export async function searchCuevana(
    title: string,
    year?: number,
    type: "movie" | "tv" = "movie",
): Promise<string | null> {
    try {
        const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(title)}`;
        console.log(`Fetching search results from: ${searchUrl}`);
        
        // Try direct scraping first with anti-bot headers
        try {
            const { data } = await axios.get(searchUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
                    "Accept-Encoding": "gzip, deflate, br",
                    "Connection": "keep-alive",
                    "Upgrade-Insecure-Requests": "1",
                    "Sec-Fetch-Dest": "document",
                    "Sec-Fetch-Mode": "navigate",
                    "Sec-Fetch-Site": "none",
                    "Cache-Control": "max-age=0",
                },
                timeout: 15000,
            });
            
            console.log(`Direct scraping HTML received (${data.length} chars)`);
            
            // Debug: Save HTML snippet to see structure
            const htmlSnippet = data.substring(0, 3000);
            console.log(`=== HTML PREVIEW START ===`);
            console.log(htmlSnippet);
            console.log(`=== HTML PREVIEW END ===`);
            
            const $ = cheerio.load(data);
            const results: any[] = [];

            // Try multiple selectors
            const selectors = [
                "article.TPost",
                "article",
                ".TPost",
                ".MovieList article",
                ".search-item",
                ".item-peliculas"
            ];
            
            for (const selector of selectors) {
                const found = $(selector);
                console.log(`Selector "${selector}" found ${found.length} elements`);
                
                if (found.length > 0) {
                    found.each((_, article) => {
                        const $article = $(article);
                        const link =
                            $article.find("div.Image a").attr("href") ||
                            $article.find("a").first().attr("href");
                        const titleText = 
                            $article.find("h2.Title, .Title, h2, h3").first().text().trim() ||
                            $article.find("a").first().attr("title") || "";
                        const yearText = $article.find(".Year, span.Year, .Date").text().trim();
                        const yearMatch = yearText.match(/\d{4}/);
                        const itemYear = yearMatch ? parseInt(yearMatch[0]) : null;

                        if (link && titleText) {
                            results.push({
                                title: titleText,
                                year: itemYear,
                                url: link,
                            });
                        }
                    });
                    
                    if (results.length > 0) {
                        console.log(`Found ${results.length} results with selector: ${selector}`);
                        break;
                    }
                }
            }

            console.log(`Total results found: ${results.length}`);
            
            if (results.length > 0) {
                results.forEach((r) => {
                    console.log(`Found: "${r.title}" (${r.year}) -> ${r.url}`);
                });

                // Find best match
                const normalizedTitle = title.toLowerCase().trim();
                for (const result of results) {
                    const normalizedResultTitle = result.title.toLowerCase().trim();
                    const cleanTitle = normalizedResultTitle.replace(/\s*\(\d{4}\)\s*/g, "").trim();
                    
                    console.log(`Comparing: "${normalizedTitle}" with "${cleanTitle}"`);
                    
                    if (
                        cleanTitle.includes(normalizedTitle) ||
                        normalizedTitle.includes(cleanTitle)
                    ) {
                        if (year) {
                            if (result.year === year) {
                                console.log(`✓ Match found: ${result.url}`);
                                return result.url;
                            }
                        } else {
                            console.log(`✓ Match found (no year check): ${result.url}`);
                            return result.url;
                        }
                    }
                }

                // Fallback: return first result
                console.log(`No exact match, returning first result: ${results[0].url}`);
                return results[0].url;
            }
        } catch (directError: any) {
            console.log(`Direct scraping failed: ${directError.message}`);
            console.log(`Trying with ScraperAPI fallback...`);
        }
        
        // Fallback to ScraperAPI (simple mode, no premium)
        try {
            const scraperUrl = `${SCRAPER_API_URL}/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(searchUrl)}&render=true`;
            
            console.log(`ScraperAPI fallback request...`);
            const { data } = await axios.get(scraperUrl, {
                timeout: 60000,
            });
            
            console.log(`ScraperAPI HTML received (${data.length} chars)`);
            
            const $ = cheerio.load(data);
            const results: any[] = [];

            $("article.TPost").each((_, article) => {
                const $article = $(article);
                const link =
                    $article.find("div.Image a").attr("href") ||
                    $article.find("a").attr("href");
                const titleText = $article.find("h2.Title, .Title").text().trim();
                const yearText = $article.find(".Year, span.Year").text().trim();
                const yearMatch = yearText.match(/\d{4}/);
                const itemYear = yearMatch ? parseInt(yearMatch[0]) : null;

                if (link && titleText) {
                    results.push({
                        title: titleText,
                        year: itemYear,
                        url: link,
                    });
                }
            });

            console.log(`Total results found: ${results.length}`);
            results.forEach((r) => {
                console.log(`Found: "${r.title}" (${r.year}) -> ${r.url}`);
            });

            if (results.length === 0) {
                console.log("No results found in search");
                return null;
            }

            // Find best match
            const normalizedTitle = title.toLowerCase().trim();
            for (const result of results) {
                const normalizedResultTitle = result.title.toLowerCase().trim();
                const cleanTitle = normalizedResultTitle.replace(/\s*\(\d{4}\)\s*/g, "").trim();
                
                console.log(`Comparing: "${normalizedTitle}" with "${cleanTitle}"`);
                
                if (
                    cleanTitle.includes(normalizedTitle) ||
                    normalizedTitle.includes(cleanTitle)
                ) {
                    if (year) {
                        if (result.year === year) {
                            console.log(`✓ Match found: ${result.url}`);
                            return result.url;
                        }
                    } else {
                        console.log(`✓ Match found (no year check): ${result.url}`);
                        return result.url;
                    }
                }
            }

            // Fallback: return first result
            console.log(`No exact match, returning first result: ${results[0].url}`);
            return results.length > 0 ? results[0].url : null;
        } catch (scraperError: any) {
            console.error(`ScraperAPI also failed: ${scraperError.message}`);
            return null;
        }
    } catch (error) {
        console.error("Error searching Cuevana:", error);
        return null;
    }
}

/**
 * Get TV episode URL
 */
export async function getCuevanaEpisodeUrl(
    showUrl: string,
    season: number,
    episode: number,
): Promise<string | null> {
    try {
        const { data } = await axios.get(showUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            },
        });

        const $ = cheerio.load(data);
        let episodeUrl: string | null = null;

        $(".TPTblCn tbody tr").each((_, row) => {
            const $row = $(row);
            const seasonNum = parseInt($row.find("td:nth-child(1)").text());
            const episodeNum = parseInt($row.find("td:nth-child(2)").text());

            if (seasonNum === season && episodeNum === episode) {
                episodeUrl = $row.find("a").attr("href") || null;
                return false; // break
            }
        });

        return episodeUrl;
    } catch (error) {
        console.error("Error getting episode URL:", error);
        return null;
    }
}

/**
 * Extract player options by parsing embedded data from the page
 * Cuevana embeds player data in JavaScript variables
 */
async function getPlayerOptions(
    pageUrl: string,
): Promise<PlayerOption[] | null> {
    try {
        console.log("Fetching player options...");
        
        // Ensure absolute URL
        const absoluteUrl = pageUrl.startsWith('http') ? pageUrl : `${BASE_URL}${pageUrl}`;
        
        // Try direct scraping to get embedded data
        try {
            const { data } = await axios.get(absoluteUrl, {
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
                    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
                    "Referer": BASE_URL,
                },
                timeout: 15000,
            });

            console.log(`Direct scraping player page HTML (${data.length} chars)`);
            
            // Debug: print more of the HTML to find the pattern
            console.log(`=== HTML SAMPLE (first 5000 chars) ===`);
            console.log(data.substring(0, 5000));
            console.log(`=== END HTML SAMPLE ===`);
            
            // Extract data-post from the page source (it's in the HTML, just not in OptUl yet)
            // Try multiple patterns
            let postId = null;
            
            // Pattern 1: data-post="12345"
            let match = data.match(/data-post\s*=\s*["'](\d+)["']/i);
            if (match) postId = match[1];
            
            // Pattern 2: post: 12345 in JavaScript
            if (!postId) {
                match = data.match(/post\s*:\s*["']?(\d+)["']?/i);
                if (match) postId = match[1];
            }
            
            // Pattern 3: Look for post ID in URL path (/5281/joker -> 5281)
            if (!postId) {
                match = pageUrl.match(/\/(\d+)\//);
                if (match) postId = match[1];
            }
            
            console.log(`Found post ID: ${postId} (method: ${match ? 'regex' : 'none'})`);
            
            if (!postId) {
                console.log("Could not find post ID in page");
                return null;
            }
            
            // Get all available player options from Cuevana's internal structure
            // Look for the player tabs data
            const options: PlayerOption[] = [];
            
            // Try to find player option numbers (they usually go from 1 to 5+)
            // Pattern: data-nume="1", data-nume="2", etc.
            const numeMatches = data.matchAll(/data-nume[=\s]*["']?(\d+)["']?/gi);
            const numeSet = new Set<string>();
            
            for (const match of numeMatches) {
                numeSet.add(match[1]);
            }
            
            console.log(`Found ${numeSet.size} unique nume values:`, Array.from(numeSet));
            
            // Create options for each nume (language option)
            // We'll try common ones and any we found
            const allNumes = new Set([...Array.from(numeSet), "1", "2", "3", "4", "5"]);
            
            for (const nume of allNumes) {
                // We'll label them generically since we don't know language yet
                options.push({
                    title: `Opción ${nume}`,
                    dataPost: postId,
                    dataNume: nume,
                });
            }
            
            console.log(`Created ${options.length} player options to test`);
            
            if (options.length > 0) {
                return options;
            }
            
        } catch (directError: any) {
            console.log(`Error fetching player page: ${directError.message}`);
        }
        
        return null;
    } catch (error) {
        console.error("Error extracting player options:", error);
        return null;
    }
}

/**
 * Fetch stream URL from player option
 */
async function fetchStreamUrl(
    dataPost: string,
    dataNume: string,
): Promise<string | null> {
    try {
        const formData = new URLSearchParams();
        formData.append("action", "doo_player_ajax");
        formData.append("post", dataPost);
        formData.append("nume", dataNume);
        formData.append("type", "movie");

        const { data } = await axios.post(
            `${BASE_URL}/wp-admin/admin-ajax.php`,
            formData.toString(),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "User-Agent":
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    Referer: BASE_URL,
                },
            },
        );

        if (data && data.embed_url) {
            return data.embed_url;
        }

        return null;
    } catch (error) {
        console.error("Error fetching stream URL:", error);
        return null;
    }
}

/**
 * Detect language from title
 */
function detectLanguage(title: string): string {
    const titleLower = title.toLowerCase();
    if (
        titleLower.includes("latino") ||
        titleLower.includes("lat") ||
        titleLower.includes("latín")
    ) {
        return "latino";
    }
    if (
        titleLower.includes("español") ||
        titleLower.includes("castellano") ||
        titleLower.includes("esp")
    ) {
        return "español";
    }
    if (
        titleLower.includes("sub") ||
        titleLower.includes("subtitulado") ||
        titleLower.includes("subtítulo")
    ) {
        return "subtitulado";
    }
    return "unknown";
}

/**
 * Main function: Get all streams for a movie or TV episode
 */
export async function getCuevanaStreams(
    title: string,
    year?: number,
    season?: number,
    episode?: number,
    languageFilter?: string,
): Promise<CuevanaStream[]> {
    try {
        const type = season !== undefined ? "tv" : "movie";

        // Step 1: Search for the content
        console.log(`Searching Cuevana for: ${title} (${year || "no year"})`);
        const contentUrl = await searchCuevana(title, year, type);
        if (!contentUrl) {
            console.log("Content not found on Cuevana");
            return [];
        }

        console.log(`Found content at: ${contentUrl}`);

        // Step 2: For TV shows, get episode URL
        let pageUrl = contentUrl;
        if (type === "tv" && season !== undefined && episode !== undefined) {
            const episodeUrl = await getCuevanaEpisodeUrl(
                contentUrl,
                season,
                episode,
            );
            if (!episodeUrl) {
                console.log("Episode not found");
                return [];
            }
            pageUrl = episodeUrl;
            console.log(`Found episode at: ${pageUrl}`);
        }

        // Step 3: Extract player options (try direct scraping first, fallback to ScraperAPI)
        console.log("Extracting player options...");
        const playerOptions = await getPlayerOptions(pageUrl);
        if (!playerOptions || playerOptions.length === 0) {
            console.log("No player options found");
            return [];
        }

        console.log(`Found ${playerOptions.length} player options`);

        // Step 4: Fetch stream URLs
        const streams: CuevanaStream[] = [];
        for (const option of playerOptions) {
            const language = detectLanguage(option.title);

            // Apply language filter if specified
            if (languageFilter && language !== languageFilter) {
                continue;
            }

            const streamUrl = await fetchStreamUrl(
                option.dataPost,
                option.dataNume,
            );
            if (streamUrl) {
                streams.push({
                    quality: option.title,
                    url: streamUrl,
                    language: language,
                });
            }
        }

        console.log(`Successfully extracted ${streams.length} streams`);
        return streams;
    } catch (error) {
        console.error("Error getting Cuevana streams:", error);
        return [];
    }
}
