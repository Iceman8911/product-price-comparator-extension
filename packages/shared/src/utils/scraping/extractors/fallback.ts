import { Readability } from "@mozilla/readability";
import { toJsonSchema } from "@valibot/to-json-schema";
import * as v from "valibot";
import { ProductDataSchema } from "../../../models/product";
import { fixCaughtErrorType } from "../../error";
import { chunkifyLargeString } from "../../string";

type ReadabilityParseResult = ReturnType<typeof Readability.prototype.parse>;

// Fallback product data extractor that gets the most probable piece of the DOM and sends it to an AI model for parsing
function extractRelevantDomData(
	document: Document,
): Readonly<ReadabilityParseResult> {
	return new Readability(document.cloneNode(true) as Document).parse();
}

type LlmQuery = (query: string) => Promise<string>;

const QUERY_SIZE = 1800;

const PartialProductDataSchema = v.partial(ProductDataSchema);
type PartialProductDataSchema = v.InferOutput<typeof PartialProductDataSchema>;

const PartialProductDataJsonSchema = toJsonSchema(PartialProductDataSchema);
const ProductDataJsonSchema = toJsonSchema(ProductDataSchema);

const PARTIAL_DATA_EXTRACTOR_QUERY_STRING =
	`Using the given partial JSON schema, ${JSON.stringify(PartialProductDataJsonSchema)}, inspect the below chunked dom data extracted via readability.js and return, in a JSON format, all the properties you can find correct values for. Abide by the given schema's shape at all costs.

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

   Here are the results:

   ` as const;
};

export const llmProductDataExtractor = async (
	window: Window,
	llmQuerier: LlmQuery,
): Promise<ProductDataSchema | null> => {
	const extracted = extractRelevantDomData(window.document);

	if (!extracted) return null;

	const { content: relevantDomData, siteName, title } = extracted;

	if (typeof relevantDomData !== "string") return null;

	const chunkedDomData = chunkifyLargeString(relevantDomData, QUERY_SIZE);

	const queries = chunkedDomData.map(
		(chunk) => `${PARTIAL_DATA_EXTRACTOR_QUERY_STRING}${chunk}` as const,
	);

	const partialResults = (
		await Promise.allSettled(queries.map((query) => llmQuerier(query)))
	).reduce<PartialProductDataSchema[]>((successfulResults, res) => {
		if (res.status === "fulfilled") {
			const parsedPartialProductResult = v.safeParse(
				PartialProductDataSchema,
				res.value,
			);

			if (parsedPartialProductResult.success) {
				successfulResults.push(parsedPartialProductResult.output);
			}
		}

		return successfulResults;
	}, []);

	const combinedResult = await llmQuerier(
		`${getDataCoalescerQueryString({ name: title, store: siteName, url: window.location.href })}${JSON.stringify(partialResults)}`,
	);

	try {
		return v.parse(ProductDataSchema, JSON.parse(combinedResult));
	} catch (e) {
		console.warn("LLM data extraction failed with:", fixCaughtErrorType(e));

		return null;
	}
};
