import { MessageType } from "@/shared/constants";
import { onWindowMessage } from "@/shared/messaging";

function registerPhindAiMessageResponderFromInjectedScript() {
	onWindowMessage(
		MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER,
		async ({ data: queryArgs }) =>
			sendQueryToPhindAiViaBackgroundWorker(...queryArgs),
	);
}

function injectProductDataExtractorScript() {
	window.addEventListener(
		"load",
		async () => {
			await injectScript("/extract-product-data-from-window.js", {
				keepInDom: true,
			});
		},
		{ once: true },
	);
}

export default defineContentScript({
	async main() {
		registerPhindAiMessageResponderFromInjectedScript();

		injectProductDataExtractorScript();
	},
	matches: ["<all_urls>"],
	runAt: "document_start",
});
