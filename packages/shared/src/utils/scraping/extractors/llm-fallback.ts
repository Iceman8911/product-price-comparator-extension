import { Readability } from "@mozilla/readability";
import { toJsonSchema } from "@valibot/to-json-schema";
import Defuddle from "defuddle";
import * as v from "valibot";
import { ProductDataSchema } from "../../../models/product";
import { fixCaughtErrorType } from "../../error";
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
	`Using the given partial JSON schema, ${JSON.stringify(PartialProductDataJsonSchema)}, inspect the below chunked dom data extracted via readability.js and return, in a JSON format, all the properties you can find correct values for. Abide by the given schema's shape at all costs.

	By JSON format, I mean "{}" over \`\`\`json{}\`\`\`.

	Note that the "store" should be succinct (ideally a single word or two). If it cannot be expressed briefly, omit it.

  Here's the dom data:

  ` as const;

const getDataCoalescerQueryString = (possibleInferredData: {
	name?: string | undefined | null;
	store?: string | undefined | null;
	url: string;
}) => {
	const { url, name, store } = possibleInferredData;

	return `Using the given JSON schema, ${JSON.stringify(ProductDataJsonSchema)}, coalesce the following partial results appropriately into a single JSON object abiding to the given schema. Ensure to return, in a JSON format, the combined result. If the data is truly undecipherable, simply return \`null\`.

	Note that ${name ? `, the product name could be ${name}` : ""} ${store ? `, the store name could be ${store}` : ""}, the url is ${url}. Feel free to also use these in determining the accurate json data.


	By JSON format, I mean "{}" over \`\`\`json{}\`\`\`.

  Here are the results:

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

	const siteMetaTags = JSON.stringify(
		new Defuddle(documentArg.cloneNode(true) as Document).parse().metaTags,
	);

	// Last resort for more info, scrape generically
	const genericScrapedData = ProductDataSchemaKeys.flatMap((key) =>
		Array.from(documentArg.querySelectorAll(`[class*=${key}]`)).map(
			(ele) => ele.outerHTML,
		),
	);

	const chunkedData = chunkifyLargeString(
		` ${siteMetaTags} ${genericScrapedData} ${relevantDomData}`,
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
