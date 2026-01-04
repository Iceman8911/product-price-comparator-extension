import InlineEnum from "@iceman8911/unplugin-inline-enum/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
	manifest: {
		author: { email: "wuchijss3@gmail.com" },
		description:
			"Product comparison extension for getting the best deals when shopping.",
		name: "Bandwidth Saver & Monitor",
		permissions: ["activeTab", "storage", "offscreen"],
		short_name: "Product Price Optimiser",
		version: "0.0.1",
	},
	modules: ["@wxt-dev/module-solid", "@wxt-dev/auto-icons"],
	vite: () => ({
		plugins: [
			tailwindcss(),
			process.env.NODE_ENV === "production" ? InlineEnum() : [],
		],
	}),
});
