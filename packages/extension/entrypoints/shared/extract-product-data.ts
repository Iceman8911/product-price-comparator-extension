import { extractProductDataFromDocumentOrWindow } from "@shopping-optimizer/shared";
import { sendQueryToPhindAiFromInjectedScriptViaContentScript } from "@/utils/phind/content-script";
import type { ProductDataSchema } from "../../../shared/src/models/product";

/**
 * Extract product data from the current page.
 *
 * `shouldUseAi` enables a bridge that lets page/injected context call Phind via
 * the content script → background worker.
 */
export async function extractProductDataFromCurrentWindow(
	shouldUseAi: boolean,
): Promise<ProductDataSchema | null> {
	const product = await extractProductDataFromDocumentOrWindow([
		window,
		shouldUseAi
			? (...queries) =>
					sendQueryToPhindAiFromInjectedScriptViaContentScript(
						...queries.map((query) => ({
							query,
							search: false,
						})),
					)
			: undefined,
	]);

	return product;
}
