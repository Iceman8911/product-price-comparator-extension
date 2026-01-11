declare module "*.webp" {
	const src: string;
	export default src;
}

declare module "@marbec/web-auto-extractor" {
	interface WebAutoExtractorOptions {
		// Add location information to the root elements in the parsed data.
		// Location is stored as start,end offset values in the @location property.
		addLocation?: boolean;

		// Embed the source HTML in the root elements in the parsed data using the @source property.
		// This property is either a boolean to embed sources for all data types or an array of data types to embed sources for.
		embedSource?: boolean;

		// Skip headings with empty or whitespace-only text content.
		// When true, headings like <h1></h1> or <h2>   </h2> will be excluded from results.
		skipEmptyHeadings?: boolean;

		// Skip headings that are inside layout elements (header, footer, nav, aside).
		// When true, headings within these semantic layout containers will be excluded from results.
		// The isLayoutElement field is only included when this option is false.
		skipLayoutElements?: boolean;
	}

	class webAutoExtractor {
		constructor(options: WebAutoExtractorOptions);
		parse(html: string): {
			metatags: Record<string, ReadonlyArray<string>>;
			microdata: Record<string, unknown>;
			rdfa: Record<string, unknown>;
			jsonld: Record<string, unknown>;
			headings: ReadonlyArray<{
				attributes: ReadonlyArray<{ name: string; value: string }>;
				isLayoutElement: boolean;
				level: number;
				order: string;
				tag: string;
				text: string;
			}>;
			errors: ReadonlyArray<unknown>;
		};
	}

	export default webAutoExtractor;
}
