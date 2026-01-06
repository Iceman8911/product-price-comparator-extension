import { getOpenSerpGeneralSearchResults } from "@shopping-optimizer/shared";

export async function getSearchResults(
	query: Parameters<typeof getOpenSerpGeneralSearchResults>[1],
) {
	return getOpenSerpGeneralSearchResults(
		import.meta.env.OPEN_SERP_ENDPOINT,
		query,
	);
}
