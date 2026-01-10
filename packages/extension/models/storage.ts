import * as v from "valibot";

export const ExtensionSettingsSchema = v.object({
	enableAi: v.boolean(),
	/** Could be the user's city or country or whatever, but it's used for improving product recommendations */
	location: v.string(),
});
export type ExtensionSettingsSchema = v.InferOutput<
	typeof ExtensionSettingsSchema
>;

/** Just some extra type safety for direct tab scripting injection */
export const PartialExtensionSettingsSchema = v.partial(
	ExtensionSettingsSchema,
);
export type PartialExtensionSettingsSchema = v.InferOutput<
	typeof PartialExtensionSettingsSchema
>;

export const DEFAULT_EXTENSION_SETTINGS = {
	enableAi: true,
	location: "USA",
} as const satisfies ExtensionSettingsSchema;
