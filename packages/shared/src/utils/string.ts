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

/** Breaks down long text into separate chunks with preceding identifier */
export function chunkifyLargeString(
	longStr: string,
	maxChunkSize: number = 2000,
): ReadonlyArray<string> {
	if (typeof longStr !== "string" || longStr.length === 0) return [];
	if (maxChunkSize <= 0) maxChunkSize = 2000;

	if (longStr.length <= maxChunkSize) {
		return [`Chunk 1: ${longStr.trim()}`];
	}

	const chunks: string[] = [];
	let start = 0;
	let chunkIndex = 1;

	while (start < longStr.length) {
		let end = Math.min(start + maxChunkSize, longStr.length);

		// Try to break at a sentence boundary or whitespace, but only if not at the end
		if (end < longStr.length) {
			const lookaheadEnd = Math.min(end + 200, longStr.length);
			const slice = longStr.slice(start, lookaheadEnd);

			// Prefer to break at a sentence boundary
			const sentenceMatch = slice.match(/([.!?]["']?)\s+/);
			if (sentenceMatch && sentenceMatch.index !== undefined) {
				const matchPos = sentenceMatch.index + sentenceMatch[0].length;
				if (matchPos <= maxChunkSize + 200) {
					end = start + matchPos;
				}
			} else {
				// Otherwise, break at the last whitespace before the limit
				const spaceMatch = slice
					.slice(0, maxChunkSize + 200)
					.match(/\s(?!.*\s)/);
				if (spaceMatch && spaceMatch.index !== undefined) {
					end = start + spaceMatch.index + 1;
				}
			}

			// Fallback: ensure we always make progress
			if (end <= start) end = Math.min(start + maxChunkSize, longStr.length);
			// Avoid tiny chunks
			if (end - start < 100 && end < longStr.length) {
				end = Math.min(start + maxChunkSize, longStr.length);
			}
		}

		const content = longStr.slice(start, end).trim();
		if (content) {
			chunks.push(`Chunk ${chunkIndex}: ${content}`);
			chunkIndex++;
		}

		// Move start forward, but don't overlap past the beginning
		start = end - CHUNK_OVERLAP;
		if (start < 0) start = 0;
		if (start >= longStr.length || end === longStr.length) break;
	}

	return chunks;
}
