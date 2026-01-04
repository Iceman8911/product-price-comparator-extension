import { sendQueryToPhindAi } from "@bandwidth-saver/shared";
import { MessageType } from "@/shared/constants";
import { onExtensionMessage } from "@/shared/messaging";

export default defineBackground(async () => {
	onExtensionMessage(
		MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER,
		async ({ data: queryArgs }) => sendQueryToPhindAi(...queryArgs),
	);
});
