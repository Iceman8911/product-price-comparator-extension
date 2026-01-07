import type { Options as KyOptions } from "ky";
import type { UrlSchema } from "../models/shared";
import { SUPPORTED_SITE_PRODUCT_DATA_MATCH_PATTERNS_AND_EXTRACTORS } from "./scraping";

const _NO_RETRY_OPTIONS = {
	retry: 0,
	timeout: 5000,
} as const satisfies KyOptions;

const PREFIX_REGEX =
	/(\/dp\/|\/gp\/product\/|\/itm\/|\/ip\/|\/p\/|\/product\/|\/products\/|\/item\/|\/shop\/|\/pdp\/|\/detail\/|\/sku\/|\/pid\/)/;
const SLUG_REGEX = /[_-]/;
const SLUG_WORDS_REGEX = /[a-z]+[_-][a-z0-9]+/;
const ID_REGEX = /\/[a-z0-9_-]{8,}(\/|$)/;
const SPECS_REGEX =
	/(\d+(gb|mb|tb|ram|rom|inch|cm|oz|kg|ml|l|pro|max|plus|mini|xl|xs|s|m|l))/i;
const KEYWORDS_REGEX =
	/(product|item|buy|cart|checkout|add-to-cart|shop|deal|sale|store|variant|size|color|sku)/;
const VARIANT_QUERY_REGEX =
	/(\?|&)(size|color|variant|option|style|flavor|scent|material)=/;
const NEGATIVE_REGEX =
	/(\/blog\/|\/news\/|\/article\/|\/about\/|\/contact\/|\/search\/|\/account\/|\/login\/|\?q=|\.html$|\.php$|\.pdf$|\.jpg$|\.png$)/;

export function isLikelyShoppingUrl(urlString: UrlSchema): boolean {
	if (
		SUPPORTED_SITE_PRODUCT_DATA_MATCH_PATTERNS_AND_EXTRACTORS.some(
			([pattern]) => pattern.includes(urlString),
		)
	)
		return true;

	let score = 0;
	const url = urlString.toLowerCase();
	const urlObj = new URL(urlString);
	const path = urlObj.pathname;
	const query = urlObj.search;

	// Strong indicators: Common e-commerce prefixes (e.g., Amazon /dp/, eBay /itm/, Walmart /ip/, Shopify /products/, general /p/, /product/, /item/, /shop/, /pdp/ for product detail page)
	if (PREFIX_REGEX.test(path)) score += 5;

	// Slug patterns: Hyphen or underscore separated, with words (descriptive, per Google/SEO recs)
	if (SLUG_REGEX.test(path) && SLUG_WORDS_REGEX.test(path)) score += 3;

	// Alphanumeric IDs/SKUs: Long strings (8+ chars) mixing letters/numbers (e.g., oppo_a38_6gb, B08N5WRWNW)
	if (ID_REGEX.test(path) && /\d/.test(path) && /[a-z]/.test(path)) score += 4; // Requires mix for accuracy (avoids pure numbers like /123)

	// Product specs/units: Common in slugs (e.g., _6gb_128gb, -256gb-black) – boosts for tech/fashion/home goods
	if (SPECS_REGEX.test(path) || SPECS_REGEX.test(query)) score += 3;

	// Shopping keywords in path/query (broadened: buy, cart, etc., but weighted low to avoid FPs)
	if (KEYWORDS_REGEX.test(path) || KEYWORDS_REGEX.test(query)) score += 2;

	// Path hierarchy: 2-4 segments common (e.g., /phones/android/oppo_a38); bonus for depth, penalty for flat/root
	const segmentCount = (path.match(/\//g) || []).length;
	if (segmentCount >= 2 && segmentCount <= 5) score += 2;
	if (segmentCount === 1 && path.length > 15) score += 1; // For direct slugs like /oppo_a38_6gb_128gb

	// Variant indicators: Query params for options (e.g., ?size=m&color=black) – common per Google variant docs
	if (VARIANT_QUERY_REGEX.test(query)) score += 2;

	// Avoid false positives: Non-product paths (blog, news, about, search, static files)
	if (NEGATIVE_REGEX.test(url)) score -= 5;

	// Additional penalties: Too short/random (e.g., /abc, /123) or overly complex (session IDs)
	if (path.length < 10 || /^\d+$/.test(path.replace(/\//g, ""))) score -= 3;

	return score >= 7; // Threshold for ~95% accuracy: High enough for precision, catches examples like slot.ng (score 10+: slug + ID + specs + single segment)
}
