export async function getActiveTab() {
	const tabs = await browser.tabs.query({ active: true, currentWindow: true });
	const activeTab = tabs[0];

	if (!activeTab) return null;

	return activeTab;
}
