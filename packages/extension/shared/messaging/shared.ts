import type { PhindAiQueryRestArgs } from "@bandwidth-saver/shared";
import type { sendQueryToPhindAiViaBackgroundWorker } from "@/utils/phind/backgound-script";
import type { ProductDataSchema } from "../../../shared/src/models/product";
import { MessageType } from "../constants";

export type MessagingProtocolMap = {
	[MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER](
		data: PhindAiQueryRestArgs,
	): ReturnType<typeof sendQueryToPhindAiViaBackgroundWorker>;

	[MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER_USING_CONTENT_SCRIPT](
		data: PhindAiQueryRestArgs,
	): ReturnType<typeof sendQueryToPhindAiViaBackgroundWorker>;

	[MessageType.EXTRACT_PRODUCT_DATA_FROM_INJECTED_SITE](): ProductDataSchema | null;
};
