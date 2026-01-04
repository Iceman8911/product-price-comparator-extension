import { extractProductDataFromWindow } from "@bandwidth-saver/shared";
import { sendQueryToPhindAiViaBackgroundWorker } from "@/utils/phind";

export default defineContentScript({
	async main() {
		document.addEventListener("DOMContentLoaded", async () => {
			const product = await extractProductDataFromWindow([
				window,
				(query) =>
					sendQueryToPhindAiViaBackgroundWorker({ query, search: false }),
			]);

			console.log("Product is:", product);
		});
	},
	matches: ["<all_urls>"],
	runAt: "document_start",
});
