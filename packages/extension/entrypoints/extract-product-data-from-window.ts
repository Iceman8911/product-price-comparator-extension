import { extractProductDataFromDocumentOrWindow } from "@shopping-optimizer/shared";
import { MessageType } from "@/shared/constants";
import { onWindowMessage } from "@/shared/messaging/content-script";
import { sendQueryToPhindAiFromInjectedScriptViaContentScript } from "@/utils/phind/content-script";

export default defineUnlistedScript(async () => {
	onWindowMessage(
		MessageType.EXTRACT_PRODUCT_DATA_FROM_INJECTED_SITE,
		async ({ data: shouldUseAi }) => {
			const product = await extractProductDataFromDocumentOrWindow([
				window.document,
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
		},
	);
});
