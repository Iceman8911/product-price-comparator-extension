import * as v from "valibot";
import { PartialExtensionSettingsSchema } from "@/models/storage";
import { ExtensionData } from "@/shared/constants";
import { extractProductDataFromCurrentWindow } from "./shared/extract-product-data";

export default defineUnlistedScript(async () => {
	const rawSettings =
		//@ts-expect-error Populated by the background script in MAIN world
		globalThis[ExtensionData.GLOBAL_NAMESPACE_SETTINGS];

	const parsed = v.safeParse(PartialExtensionSettingsSchema, rawSettings);

	// Never throw on startup; always respond.
	const enableAi = parsed.success ? (parsed.output.enableAi ?? false) : false;

	return extractProductDataFromCurrentWindow(enableAi);
});
