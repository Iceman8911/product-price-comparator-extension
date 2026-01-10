import * as v from "valibot";

export const ExtensionSettingsSchema = v.object({ enableAi: v.boolean() });
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
} as const satisfies ExtensionSettingsSchema;
