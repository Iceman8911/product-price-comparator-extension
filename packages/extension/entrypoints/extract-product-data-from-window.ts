import { extractProductDataFromWindow } from "@bandwidth-saver/shared";

export default defineUnlistedScript(async () => {
	const product = await extractProductDataFromWindow([
		window,
		// (query) =>
		// 	sendQueryToPhindAiFromInjectedScriptViaContentScript({
		// 		query,
		// 		search: false,
		// 	}),
	]);

	console.log("Product is:", product);
});
