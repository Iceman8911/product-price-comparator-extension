import SearchIcon from "lucide-solid/icons/search";

function DetectProductOnCurrentSiteButton() {
	return (
		<BaseButton
			aria-label="Detect Product on Current Site"
			class="btn-circle btn-primary size-14"
		>
			<SearchIcon class="size-8" />
		</BaseButton>
	);
}

function NoProductDetectedOnCurrentSiteYetUi() {
	return (
		<div class="flex flex-col items-center justify-center gap-8">
			<h2 class="text-center text-base">
				Seems like no product has been autodetected. Click the button below to
				begin manual detection.
			</h2>
			<DetectProductOnCurrentSiteButton />
		</div>
	);
}

export default function PopupUi() {
	return (
		<div class="glass grid size-full place-items-center rounded-box bg-base-200 p-4">
			<NoProductDetectedOnCurrentSiteYetUi />
		</div>
	);
}
