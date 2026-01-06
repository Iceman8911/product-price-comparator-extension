import { fixCaughtErrorType, type UrlSchema } from "@shopping-optimizer/shared";
import SearchIcon from "lucide-solid/icons/search";
import type { Setter } from "solid-js";
import { MessageType } from "@/shared/constants";
import { sendExtensionMessage } from "@/shared/messaging/extension";
import {
	extensionSettingsStorageItem,
	getCachedProductDataForSite,
} from "@/shared/storage";
import type { ProductDataSchema } from "../../../shared/src/models/product";

type SharedProps = {
	setMainProduct: Setter<ProductDataSchema | undefined | null>;
	activeTab: {
		url: UrlSchema;
		id: number;
	};
};

type DetectProductOnCurrentSiteButtonProps = SharedProps & {
	isDetectingProduct: boolean;
	setIsDetectingProduct: Setter<boolean>;
};

function DetectProductOnCurrentSiteButton(
	props: DetectProductOnCurrentSiteButtonProps,
) {
	const handleBtnClick = async () => {
		const cachedProductData = await getCachedProductDataForSite(
			props.activeTab.url,
		).getValue();

		if (cachedProductData) {
			props.setMainProduct(cachedProductData);
			return;
		}

		props.setIsDetectingProduct(true);

		try {
			const possibleProductData = await sendExtensionMessage(
				MessageType.EXTRACT_PRODUCT_DATA_FROM_INJECTED_SITE,
				(await extensionSettingsStorageItem.getValue()).enableAi,
				props.activeTab.id,
			);

			props.setMainProduct(possibleProductData);
		} catch (e) {
			console.error(
				"Product Data Extraction in popup failed with:",
				fixCaughtErrorType(e),
			);
		}

		props.setIsDetectingProduct(false);
	};

	return (
		<BaseButton
			aria-label="Detect Product on Current Site"
			class="btn-circle btn-primary size-14"
			disabled={props.isDetectingProduct}
			onClick={handleBtnClick}
		>
			<Show
				fallback={<div class="loading loading-spinner size-8"></div>}
				when={!props.isDetectingProduct}
			>
				<SearchIcon class="size-8" />
			</Show>
		</BaseButton>
	);
}

type NoProductDetectedOnCurrentSiteYetUiProps = SharedProps;

export default function NoProductDetectedOnCurrentSiteYetUi(
	props: NoProductDetectedOnCurrentSiteYetUiProps,
) {
	const [isDetectingProduct, setIsDetectingProduct] = createSignal(false);

	return (
		<div class="flex flex-col items-center justify-center gap-8">
			<h2 class="text-center text-base">
				<Show
					fallback={"Click the button below to begin product detection."}
					when={isDetectingProduct()}
				>
					Please wait...
				</Show>
			</h2>
			<DetectProductOnCurrentSiteButton
				activeTab={props.activeTab}
				isDetectingProduct={isDetectingProduct()}
				setIsDetectingProduct={setIsDetectingProduct}
				setMainProduct={props.setMainProduct}
			/>
		</div>
	);
}
