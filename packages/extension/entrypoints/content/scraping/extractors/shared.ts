import type { ProductDataSchema } from "../../../../../shared/src/models/product";

/** Either scrapes or sniffs js globals or smth */
export type ProductDataExtractor = (
	// biome-ignore lint/suspicious/noExplicitAny: <To cover sites that add extra props to the window object>
	siteWindow: Window & Record<string, any>,
) => ProductDataSchema | null;
