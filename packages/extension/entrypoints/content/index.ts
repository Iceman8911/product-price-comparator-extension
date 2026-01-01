import { toJsonSchema } from "@valibot/to-json-schema";
import { MessageType } from "@/shared/constants";
import { sendMessage } from "@/shared/messaging";
import { ProductDataSchema } from "../../../shared/src/models/product";

const ProductDataJsonSchema = toJsonSchema(ProductDataSchema);

async function sendShoppingDomContentToBackground() {
	const extractedProduct = await sendMessage(
		MessageType.SEND_SHOPPING_SITE_DOM_CONTENT_TO_BACKGROUND,
		[
			{
				query: `If a product in the given DOM text exists, return a JSON object that exactly matches the valibot json schema: ${JSON.stringify(ProductDataJsonSchema)}.

			Otherwise return \`null\`.

			Here's the dom text:

			${document.querySelector("body")?.outerHTML}`,
				search: false,
			},
		],
	);

	console.log("productData is:", extractedProduct);
}

export default defineContentScript({
	async main() {
		document.addEventListener("DOMContentLoaded", () => {
			sendShoppingDomContentToBackground();
		});
	},
	matches: ["<all_urls>"],
	runAt: "document_idle",
});
