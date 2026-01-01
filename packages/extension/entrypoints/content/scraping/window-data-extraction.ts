// Some shopping sites have the currently viewed product's data somewhere within a global

import type { SupportedSitePatterns } from "@bandwidth-saver/shared";
import type { ProductDataSchema } from "../../../../shared/src/models/product";

/** Either scrapes or sniffs js globals or smth */
type ProductDataExtractor = (siteWindow: Window) => ProductDataSchema | null;

const SUPPORTED_SITE_PRODUCT_DATA_EXTRACTOR = {} as const satisfies {
	[key in SupportedSitePatterns]: ProductDataExtractor;
};

export default SUPPORTED_SITE_PRODUCT_DATA_EXTRACTOR;
