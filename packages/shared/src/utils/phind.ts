import * as v from "valibot";

const PHIND_AI_ENDPOINT = "https://www.phind.com/api/ai_answer";

type PHIND_AI_BODY_QUERY = {
	/** The query to send to phind */
	query: string;

	/** Whether web search functionality should be used */
	search: boolean;
};

const PhindAiResponse = v.object({ answer: v.string() });

export async function sendQueryToPhindAi(
	bodyQuery: PHIND_AI_BODY_QUERY,
): Promise<string> {
	const res = await fetch(PHIND_AI_ENDPOINT, {
		body: JSON.stringify(bodyQuery),
		method: "POST",
	});

	const { answer } = v.parse(PhindAiResponse, await res.json());

	return answer;
}
