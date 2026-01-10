type QuerySelectorAllType = {
	querySelectorAll: (selector: string) => NodeList;
};

export function getResultsOfMultipleSelectors(
	parent: QuerySelectorAllType,
	...selectors: ReadonlyArray<string>
): ReadonlyArray<Node> {
	const elements: Node[] = [];

	for (const selector of selectors) {
		parent.querySelectorAll(selector).forEach((ele) => {
			elements.push(ele);
		});
	}

	return elements;
}
