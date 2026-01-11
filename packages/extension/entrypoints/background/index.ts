import {
	isLikelyShoppingUrl,
	type ProductDataSchema,
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

			const cachedProducts: ProductDataSchema[] = [];
			const sitesWithoutCachedProducts: UrlSchema[] = [];
			const cacheSearchPromises: Promise<void>[] = [];

			for (const site of sitesToTryScraping) {
				const storageItem = getCachedProductDataForSite(site);

				cacheSearchPromises.push(
					storageItem.getValue().then((val) => {
						if (val) cachedProducts.push(val);
						else sitesWithoutCachedProducts.push(site);
					}),
				);
			}

			await Promise.all(cacheSearchPromises);

			const scrapedProductData = cachedProducts.concat(
				await extractProductDataFromUrls(...sitesWithoutCachedProducts),
			);

			// Filter out duplicates
			const filteredProducts = scrapedProductData.filter(
				(data) =>
					data.name !== productName &&
					scrapedProductData.filter((product) => product.name === data.name)
						.length === 1,
			);

			// Cache product data
			const cacheSavePromises: Promise<void>[] = [];
			for (const product of filteredProducts) {
				cacheSavePromises.push(
					getCachedProductDataForSite(product.url).setValue(product),
				);
			}
			await Promise.all(cacheSavePromises);

			return filteredProducts;
		},
	);
}

export default defineBackground(() => {
	sendPromptToPhindAiHandler();
	extractAltProductDataFromUrlsHandler();
});
