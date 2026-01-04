import { MessageType } from "@/shared/constants";
import { onWindowMessage } from "@/shared/messaging/content-script";
import { sendQueryToPhindAiViaBackgroundWorker } from "@/utils/phind/backgound-script";

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
			registerPhindAiMessageResponderFromInjectedScript();
			await injectScript("/extract-product-data-from-window.js", {
				keepInDom: true,
			});
		},
		{ once: true },
	);
}

export default defineContentScript({
	async main() {
		injectProductDataExtractorScript();
	},
	matches: ["<all_urls>"],
	runAt: "document_start",
});
