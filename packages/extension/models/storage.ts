import * as v from "valibot";

export const ExtensionSettingsSchema = v.object({ enableAi: v.boolean() });
export type ExtensionSettingsSchema = v.InferOutput<
	typeof ExtensionSettingsSchema
>;

export const DEFAULT_EXTENSION_SETTINGS = {
	enableAi: true,
} as const satisfies ExtensionSettingsSchema;
