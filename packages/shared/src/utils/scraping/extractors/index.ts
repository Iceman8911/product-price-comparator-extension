// Some shopping sites have the currently viewed product's data somewhere within a global

import { SupportedSitePatterns } from "@shopping-optimizer/shared";
import { MatchPattern } from "@webext-core/match-patterns";
import type { ProductDataSchema } from "../../../models/product";
import { jumiaProductDataExtractor } from "./jumia";
import { kongaProductDataExtractor } from "./konga";
import { llmProductDataExtractor } from "./llm-fallback";
import { schemaOrgProductDataExtractor } from "./schema.org";
import type { ProductDataExtractor } from "./shared";
import { temuProductDataExtractor } from "./temu";

const SUPPORTED_SITE_PRODUCT_DATA_EXTRACTOR = {
	[SupportedSitePatterns.JUMIA]: jumiaProductDataExtractor,
	[SupportedSitePatterns.KONGA]: kongaProductDataExtractor,
	[SupportedSitePatterns.TEMU]: temuProductDataExtractor,
} as const satisfies {
	[key in SupportedSitePatterns]?: ProductDataExtractor;
};

export const SUPPORTED_SITE_PRODUCT_DATA_MATCH_PATTERNS_AND_EXTRACTORS =
	Object.entries(SUPPORTED_SITE_PRODUCT_DATA_EXTRACTOR).map(
		(entry) => [new MatchPattern(entry[0]), entry[1]] as const,
	);

const START_LABEL = "started for";
const SUCCESS_LABEL = "succeeded for";
const FAILURE_LABEL = "failed for";

const EXPLICITLY_SUPPORTED_EXTRACTOR_LABEL = "Supported site extractor";
const SCHEMA_ORG_EXTRACTOR_LABEL = "Schema org extractor";
const LLM_EXTRACTOR_LABEL = "LLM extractor";

const log = (...args: Parameters<typeof console.log>) => console.log(...args);

const backupProductDataExtractor = async ([
	ctx,
	llmQuerier,
	url = ctx.location.href,
]: Parameters<typeof llmProductDataExtractor>) => {
	log(SCHEMA_ORG_EXTRACTOR_LABEL, START_LABEL, url);

	const schemaOrgResult = schemaOrgProductDataExtractor(ctx, url);

	if (schemaOrgResult) {
		log(SCHEMA_ORG_EXTRACTOR_LABEL, SUCCESS_LABEL, url);

		return schemaOrgResult;
	}
	log(SCHEMA_ORG_EXTRACTOR_LABEL, FAILURE_LABEL, url);

	log(LLM_EXTRACTOR_LABEL, START_LABEL, url);

	const llmResult = await llmProductDataExtractor(ctx, llmQuerier, url);

	if (llmResult) {
		log(LLM_EXTRACTOR_LABEL, SUCCESS_LABEL, url);

		return llmResult;
	}
	log(LLM_EXTRACTOR_LABEL, FAILURE_LABEL, url);

	return null;
};

/** All encompassing product extractor */
export const extractProductDataFromDocumentOrWindow = async ([
	documentArg,
	llmQuerier,
	url,
]: Parameters<
	typeof llmProductDataExtractor
>): Promise<ProductDataSchema | null> => {
	const siteUrl = url ?? documentArg.location.href;

	const matchingSupportedExtractor =
		SUPPORTED_SITE_PRODUCT_DATA_MATCH_PATTERNS_AND_EXTRACTORS.find(
			([matchPattern]) => {
				return matchPattern.includes(siteUrl);
			},
		);

	if (matchingSupportedExtractor) {
		log(EXPLICITLY_SUPPORTED_EXTRACTOR_LABEL, START_LABEL, url);
		const matchingExtractorResult = matchingSupportedExtractor[1](
			documentArg,
			url,
		);

		if (matchingExtractorResult) {
			log(EXPLICITLY_SUPPORTED_EXTRACTOR_LABEL, SUCCESS_LABEL, url);

			return matchingExtractorResult;
		}

		log(EXPLICITLY_SUPPORTED_EXTRACTOR_LABEL, FAILURE_LABEL, url);

		return backupProductDataExtractor([documentArg, llmQuerier, url]);
	}

	return backupProductDataExtractor([documentArg, llmQuerier, url]);
};
