import * as v from "valibot";

const PHIND_AI_ENDPOINT = "https://www.phind.com/api/ai_answer";

type PHIND_AI_BODY_QUERY = {
	/** The query to send to phind */
	query: string;

	/** Whether web search functionality should be used */
	search: boolean;
};

export type PhindAiQueryRestArgs = ReadonlyArray<PHIND_AI_BODY_QUERY>;

const PhindAiResponse = v.object({ answer: v.string() });

export async function sendQueryToPhindAi(
	...bodyQueries: PhindAiQueryRestArgs
): Promise<ReadonlyArray<string>> {
	const results = await Promise.allSettled(
		bodyQueries.map((query) =>
			fetch(PHIND_AI_ENDPOINT, {
				body: JSON.stringify(query),
				method: "POST",
			}).then((res) => res.json()),
		),
	);

	const answers = results.reduce<string[]>(
		(successfullyParsedResults, result) => {
			if (result.status === "fulfilled") {
				const { answer } = v.parse(PhindAiResponse, result.value);

				successfullyParsedResults.push(answer);
			}

			return successfullyParsedResults;
		},
		[],
	);

	return answers;
}
