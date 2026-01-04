import { extractProductDataFromWindow } from "@bandwidth-saver/shared";
import { sendQueryToPhindAiFromInjectedScriptViaContentScript } from "@/utils/phind/content-script";

export default defineUnlistedScript(async () => {
	const product = await extractProductDataFromWindow([
		window,
		(query) =>
			sendQueryToPhindAiFromInjectedScriptViaContentScript({
				query,
				search: false,
			}),
	]);

	console.log("Product is:", product);
});
