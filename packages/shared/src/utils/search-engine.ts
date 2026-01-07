import * as v from "valibot";
import { UrlSchema } from "../models/shared";
import { fixCaughtErrorType } from "./error";

const OpenSerpSupportedSearchEngineSchema = v.picklist([
	"google",
	"yandex",
	"baidu",
	"bing",
	"duckduckgo",
]);

const OpenSerpSearchResultSchema = v.object({
	ad: v.boolean(),
	description: v.string(),
	engine: OpenSerpSupportedSearchEngineSchema,
	rank: v.number(),
	title: v.string(),
	url: UrlSchema,
});

/** https://github.com/karust/openserp */
const OpenSerpSearchResultsSchema = v.array(OpenSerpSearchResultSchema);

type OpenSerpSearchResultsSchema = v.InferOutput<
	typeof OpenSerpSearchResultsSchema
>;

/**
 * Schema for search query parameters.
 */
export const OpenSerpSearchQuerySchema = v.object({
	/** Include Q&A results */
	answers: v.optional(v.boolean()),
	/** Date range in format YYYYMMDD..YYYYMMDD */
	date: v.optional(v.pipe(v.string(), v.regex(/^(\d{8})\.\.(\d{8})$/))),
	/** Search engines to use */
	engines: v.optional(v.array(OpenSerpSupportedSearchEngineSchema)),
	/** File extension */
	file: v.optional(v.picklist(["PDF", "DOC", "XLS"])),
	/** Language code */
	lang: v.optional(v.picklist(["EN", "DE", "RU", "ES"])),
	/** Number of results (max of 50) */
	limit: v.pipe(v.number(), v.toMaxValue(50)),
	/** Site-specific search  */
	site: v.optional(v.string()),
	/** Search query text */
	text: v.string(),
});

export type OpenSerpSearchQuerySchema = v.InferOutput<
	typeof OpenSerpSearchQuerySchema
>;

export async function getOpenSerpGeneralSearchResults(
	baseEndpoint: UrlSchema,
	query: OpenSerpSearchQuerySchema,
): Promise<OpenSerpSearchResultsSchema> {
	try {
		const generalSearchUrl = new URL(`${baseEndpoint}/mega/search`);

		let key: keyof OpenSerpSearchQuerySchema;
		for (key in query) {
			const value = query[key];

			generalSearchUrl.searchParams.append(
				key,
				`${Array.isArray(value) ? value.join(",") : value}`,
			);
		}

		const json = await (await fetch(generalSearchUrl)).json();

		return v.parse(OpenSerpSearchResultsSchema, json);
	} catch (e) {
		console.error(
			"General OpenSerp Search failed with:",
			fixCaughtErrorType(e),
		);
		return [];
	}
}
