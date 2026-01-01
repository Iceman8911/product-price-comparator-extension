import { Readability } from "@mozilla/readability";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";
import { sendQueryToPhindAiViaBackgroundWorker } from "@/utils/phind";
import { ProductDataSchema } from "../../../shared/src/models/product";

const ProductDataJsonSchema = toJsonSchema(ProductDataSchema);

async function sendShoppingDomContentToBackground() {
	const bodyQuery = {
		query: `If a product in the given DOM text exists, return a JSON object that exactly matches the valibot json schema: ${JSON.stringify(ProductDataJsonSchema)}.

			Otherwise return \`null\`.

			Here's the dom text:

			${document.querySelector("body")?.outerHTML}`,
		search: false,
	} as const;

	const res = await sendQueryToPhindAiViaBackgroundWorker(bodyQuery);

	try {
		return v.parse(ProductDataSchema, JSON.parse(res));
	} catch (e) {
		console.warn(e);
		console.warn("But the sent data was,", bodyQuery);

		return null;
	}
}

export default defineContentScript({
	async main() {
		document.addEventListener("DOMContentLoaded", () => {
			sendShoppingDomContentToBackground();

			console.log("Readability!:", new Readability(document, {}).parse());
		});
	},
	matches: ["<all_urls>"],
	runAt: "document_idle",
});
