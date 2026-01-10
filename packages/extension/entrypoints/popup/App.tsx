import PopupUi from "@/components/popup/base-ui";
import { getLocationNameByIP } from "@/shared/ip";
import { extensionSettingsStorageItem } from "@/shared/storage";

export default function App() {
	onMount(async () => {
		const location = await getLocationNameByIP();

		const extensionSettings = await extensionSettingsStorageItem.getValue();

		extensionSettingsStorageItem.setValue({
			...extensionSettings,
			location: location?.city ?? extensionSettings.location,
		});
	});

	return (
		<div class="aspect-9/10 h-135 p-4">
			<PopupUi />
		</div>
	);
}
