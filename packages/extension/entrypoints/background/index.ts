import { sendQueryToPhindAi } from "@bandwidth-saver/shared";
import * as v from "valibot";
import { MessageType } from "@/shared/constants";
import { onMessage } from "@/shared/messaging";
import { ProductDataSchema } from "../../../shared/src/models/product";

export default defineBackground(async () => {
	onMessage(
		MessageType.SEND_SHOPPING_SITE_DOM_CONTENT_TO_BACKGROUND,
		async ({ data: queryArgs }) => {
			const json = await sendQueryToPhindAi(...queryArgs);

			try {
				return v.parse(ProductDataSchema, JSON.parse(json));
			} catch (e) {
				console.warn(e);
				console.warn("But the sent data was,", queryArgs);

				return null;
			}
		},
	);
});
