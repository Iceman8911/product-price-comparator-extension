import {
	isLikelyShoppingUrl,
	sendQueryToPhindAi,
	type UrlSchema,
} from "@shopping-optimizer/shared";
import { MessageType } from "@/shared/constants";
import { onExtensionMessage } from "@/shared/messaging/extension";
import { getSearchResults } from "@/shared/search";
import { getCachedProductDataForSite } from "@/shared/storage";
import { extractProductDataFromUrls } from "./scraping";

function sendPromptToPhindAiHandler() {
	onExtensionMessage(
		MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER,
		async ({ data: queryArgs }) => sendQueryToPhindAi(...queryArgs),
	);
}

async function extractAltProductDataFromUrlsHandler() {
	onExtensionMessage(
		MessageType.FETCH_ALT_PRODUCT_DATA_FROM_SEARCH_QUERY_VIA_BACKGROUND_WORKER,
		async ({ data: { productName, query } }) => {
			const productSearchResults = await getSearchResults(query);

			const sitesToTryScraping = productSearchResults.reduce<UrlSchema[]>(
				(validUrls, { url }) => {
					if (isLikelyShoppingUrl(url)) {
						validUrls.push(url);
					}

					return validUrls;
				},
				[],
			);

			const scrapedProductData = await extractProductDataFromUrls(
				...sitesToTryScraping,
			);

			// Filter out duplicates
			const filteredProducts = scrapedProductData.filter(
				(data) =>
					data.name !== productName &&
					scrapedProductData.filter((product) => product.name === data.name)
						.length === 1,
			);

			// Cache product data
			setTimeout(() => {
				for (const product of filteredProducts) {
					getCachedProductDataForSite(product.url).setValue(product);
				}
			}, 1000);

			return filteredProducts;
		},
	);
}

export default defineBackground(() => {
	sendPromptToPhindAiHandler();
	extractAltProductDataFromUrlsHandler();
});
