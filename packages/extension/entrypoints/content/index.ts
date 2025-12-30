export default defineContentScript({
	async main() {},
	matches: ["<all_urls>"],
	runAt: "document_start",
});
