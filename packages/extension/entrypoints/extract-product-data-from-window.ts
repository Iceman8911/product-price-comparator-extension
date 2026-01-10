import { MessageType } from "@/shared/constants";
import { onWindowMessage } from "@/shared/messaging/content-script";
import { extractProductDataFromCurrentWindow } from "./shared/extract-product-data";

export default defineUnlistedScript(async () => {
	onWindowMessage(
		MessageType.EXTRACT_PRODUCT_DATA_FROM_INJECTED_SITE,
		async ({ data: shouldUseAi }) =>
			extractProductDataFromCurrentWindow(shouldUseAi),
	);
});
