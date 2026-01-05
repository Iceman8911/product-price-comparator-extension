/**
 * Capitalize the first character of a string.
 * Leaves the rest of the string unchanged.
 */
export function capitalizeString<TInput extends string>(
	input: TInput,
): Capitalize<TInput> {
	//@ts-expect-error TS can't tell this is right
	if (input.length === 0) return input;

	//@ts-expect-error TS can't tell this is right
	return input.charAt(0).toUpperCase() + input.slice(1);
}

const CHUNK_OVERLAP = 200;

/** Efficiently breaks down long text into chunks with overlap and optional whitespace boundary */
export function chunkifyLargeString(
	longStr: string,
	maxChunkSize: number = 2000,
): ReadonlyArray<string> {
	if (typeof longStr !== "string" || longStr.length === 0) return [];
	if (maxChunkSize <= 0) maxChunkSize = 2000;

	const chunks: string[] = [];
	let start = 0;
	let chunkIndex = 1;

	while (start < longStr.length) {
		let end = Math.min(start + maxChunkSize, longStr.length);

		// Try to break at the last whitespace before the end
		if (end < longStr.length) {
			const lastSpace = longStr.lastIndexOf(" ", end);
			if (lastSpace > start + 100) {
				end = lastSpace;
			}
		}

		const content = longStr.slice(start, end).trim();
		if (content) {
			chunks.push(`Chunk ${chunkIndex}:\n\n${content}`);
			chunkIndex++;
		}

		start = end - CHUNK_OVERLAP;
		if (start < 0) start = 0;
		if (start >= longStr.length || end === longStr.length) break;
	}

	return chunks;
}
