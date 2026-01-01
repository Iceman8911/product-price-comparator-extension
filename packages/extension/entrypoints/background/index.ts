import { sendQueryToPhindAi } from "@bandwidth-saver/shared";
import { MessageType } from "@/shared/constants";
import { onMessage } from "@/shared/messaging";

export default defineBackground(async () => {
	onMessage(
		MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER,
		async ({ data: queryArgs }) => sendQueryToPhindAi(...queryArgs),
	);
});
