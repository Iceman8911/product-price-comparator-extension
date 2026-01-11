import webAutoExtractor from "@marbec/web-auto-extractor";
import { Readability } from "@mozilla/readability";
import { toJsonSchema } from "@valibot/to-json-schema";
import Defuddle from "defuddle";
import * as v from "valibot";
import { ProductDataSchema } from "../../../models/product";
import { fixCaughtErrorType } from "../../error";
import { getResultsOfMultipleSelectors } from "../../selector";
import { chunkifyLargeString } from "../../string";

type ReadabilityParseResult = ReturnType<typeof Readability.prototype.parse>;

// Fallback product data extractor that gets the most probable piece of the DOM and sends it to an AI model for parsing
function extractRelevantDomData(
	documentArg: Document,
): Readonly<ReadabilityParseResult> {
	return new Readability(documentArg.cloneNode(true) as Document).parse();
}

type LlmQuery = (
	...queries: ReadonlyArray<string>
) => Promise<ReadonlyArray<string>>;

const QUERY_SIZE = 1800;

const PartialProductDataSchema = v.partial(ProductDataSchema);
type PartialProductDataSchema = v.InferOutput<typeof PartialProductDataSchema>;

const PartialProductDataJsonSchema = toJsonSchema(PartialProductDataSchema);
const ProductDataJsonSchema = toJsonSchema(ProductDataSchema);

const PARTIAL_DATA_EXTRACTOR_QUERY_STRING =
	`Using the given partial JSON schema, ${JSON.stringify(PartialProductDataJsonSchema)}, inspect the below chunked data and return, in a JSON format, all the properties you can find correct values for. Abide by the given schema's shape at all costs.

	By JSON format, I mean "{}" over \`\`\`json{}\`\`\`.

	Note that the "store" should be succinct (ideally a single word or two). If it cannot be expressed briefly, omit it.

  Here's the data:

  ` as const;

const getDataCoalescerQueryString = (possibleInferredData: {
	name?: string | undefined | null;
	store?: string | undefined | null;
	url: string;
}) => {
	const { url, name, store } = possibleInferredData;

	return `Abiding by the given JSON schema, ${JSON.stringify(ProductDataJsonSchema)}, coalesce the following partial results appropriately into a single JSON object. By JSON format, I mean "{}" over \`\`\`json{}\`\`\`.

  If the given data is unsalvageably incomplete, the combined data makes little sense as an actual product sold from a legitimate shopping site, or the data is seemingly from a captcha block, simply return \`null\`, however it's more preferable to return completely valid data.

	For some strong hints; ${name && !name.includes("Just a moment") ? ` the product name could be "${name}"` : ""} ${store ? `, the store name could be "${store}"` : ""}, the url is "${url}", the price will always be more than 0.

  Here are the partials:

   ` as const;
};

const ProductDataSchemaKeys = Object.keys(ProductDataSchema.entries);

export const llmProductDataExtractor = async (
	ctx: Document | Window,
	llmQuerier?: LlmQuery | undefined,
	url = ctx.location.href,
): Promise<ProductDataSchema | null> => {
	if (!llmQuerier) return null;

	const documentArg = ctx instanceof Document ? ctx : ctx.document;

	const extracted = extractRelevantDomData(documentArg);

	if (!extracted) return null;

	const { content: relevantDomData, siteName, title } = extracted;

	if (typeof relevantDomData !== "string") return null;

	const extractedDefuddleData = new Defuddle(
		documentArg.cloneNode(true) as Document,
		{ url },
	).parse();

	const extractedWebAutoExtractorData = new webAutoExtractor({}).parse(
		documentArg.documentElement.outerHTML,
	);

	// Last resort for more info, scrape generically
	const genericScrapedData = ProductDataSchemaKeys.flatMap((key) =>
		getResultsOfMultipleSelectors(documentArg, `[class*=${key}]`).map((node) =>
			node instanceof Element ? node.outerHTML : String(node),
		),
	);

	const chunkedData = chunkifyLargeString(
		`${JSON.stringify(extractedWebAutoExtractorData)} ${JSON.stringify(extractedDefuddleData)} ${genericScrapedData} ${relevantDomData}`,
		QUERY_SIZE,
	);

	const queries = chunkedData.map(
		(chunk) => `${PARTIAL_DATA_EXTRACTOR_QUERY_STRING}${chunk}` as const,
	);

	const resolvedQueries = await llmQuerier(...queries);

	// console.log("resolvedQueries:", resolvedQueries);

	const partialResults = resolvedQueries.reduce<PartialProductDataSchema[]>(
		(successfulResults, res) => {
			const parsedPartialProductResult = v.safeParse(
				PartialProductDataSchema,
				JSON.parse(res),
			);

			if (parsedPartialProductResult.success) {
				successfulResults.push(parsedPartialProductResult.output);
			}

			return successfulResults;
		},
		[],
	);

	const combinedResult = await llmQuerier(
		`${getDataCoalescerQueryString({ name: title, store: siteName, url })}${JSON.stringify(partialResults)}`,
	);

	try {
		return v.parse(ProductDataSchema, JSON.parse(combinedResult[0] ?? ""));
	} catch (e) {
		console.warn("LLM data extraction failed with:", fixCaughtErrorType(e));

		return null;
	}
};
