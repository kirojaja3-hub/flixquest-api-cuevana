import { chromium } from "playwright-core";
import chromeLauncher from "chrome-aws-lambda";
import axios from "axios";
import * as cheerio from "cheerio";

const BASE_URL = "https://cuevana3.to";

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
 * Search for a movie or TV show on Cuevana using Playwright (to bypass Cloudflare)
 */
export async function searchCuevana(
    title: string,
    year?: number,
    type: "movie" | "tv" = "movie",
): Promise<string | null> {
    let browser;
    try {
        const searchUrl = `${BASE_URL}/?s=${encodeURIComponent(title)}`;
        console.log(`Fetching search results from: ${searchUrl}`);
        
        // Use Playwright to bypass Cloudflare
        const execPath = await chromeLauncher.executablePath;
        
        browser = await chromium.launch({
            headless: true,
            executablePath: execPath,
            args: chromeLauncher.args,
        });

        const context = await browser.newContext({
            userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        });
        const page = await context.newPage();

        await page.goto(searchUrl, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
        });

        // Wait for results to load
        await page.waitForTimeout(2000);

        // Extract search results
        const results = await page.evaluate(() => {
            const items: any[] = [];
            const articles = document.querySelectorAll("article.TPost");

            articles.forEach((article) => {
                const link =
                    article.querySelector("div.Image a")?.getAttribute("href") ||
                    article.querySelector("a")?.getAttribute("href");
                const titleEl = article.querySelector("h2.Title, .Title");
                const titleText = titleEl?.textContent?.trim() || "";
                const yearEl = article.querySelector(".Year, span.Year");
                const yearText = yearEl?.textContent?.trim() || "";
                const yearMatch = yearText.match(/\d{4}/);
                const itemYear = yearMatch ? parseInt(yearMatch[0]) : null;

                if (link && titleText) {
                    items.push({
                        title: titleText,
                        year: itemYear,
                        url: link,
                    });
                }
            });

            return items;
        });

        await browser.close();

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
            
            // Remove year from title if present (e.g., "Joker (2019)" -> "joker")
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

        // Fallback: return first result if no exact match
        console.log(`No exact match, returning first result: ${results[0].url}`);
        return results.length > 0 ? results[0].url : null;
    } catch (error) {
        console.error("Error searching Cuevana:", error);
        if (browser) {
            try {
                await browser.close();
            } catch (e) {
                console.error("Error closing browser:", e);
            }
        }
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
 * Extract player options using Playwright (JavaScript execution required)
 */
async function getPlayerOptions(
    pageUrl: string,
): Promise<PlayerOption[] | null> {
    let browser;
    try {
        console.log("Launching browser with chrome-aws-lambda...");
        
        // Use chrome-aws-lambda for Render compatibility
        browser = await chromium.launch({
            headless: true,
            executablePath: await chromeLauncher.executablePath,
            args: chromeLauncher.args,
        });

        console.log("Creating new page...");
        const context = await browser.newContext({
            userAgent:
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        });
        const page = await context.newPage();

        console.log(`Navigating to: ${pageUrl}`);
        await page.goto(pageUrl, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
        });

        console.log("Waiting for player options...");
        // Wait for player options to load
        await page.waitForSelector("#OptUl li", { timeout: 15000 });

        console.log("Extracting player options...");
        // Extract player options
        const options = await page.evaluate(() => {
            const items: PlayerOption[] = [];
            const optionElements = document.querySelectorAll("#OptUl li");

            optionElements.forEach((li) => {
                const title =
                    li.querySelector(".title")?.textContent?.trim() || "";
                const dataPost = li.getAttribute("data-post") || "";
                const dataNume = li.getAttribute("data-nume") || "";

                if (dataPost && dataNume && dataPost !== "undefined") {
                    items.push({ title, dataPost, dataNume });
                }
            });

            return items;
        });

        await browser.close();
        console.log(`Extracted ${options.length} player options`);
        return options.length > 0 ? options : null;
    } catch (error) {
        console.error("Error extracting player options:", error);
        if (browser) {
            try {
                await browser.close();
            } catch (e) {
                console.error("Error closing browser:", e);
            }
        }
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

        // Step 3: Extract player options with Puppeteer
        console.log("Extracting player options with Puppeteer...");
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
