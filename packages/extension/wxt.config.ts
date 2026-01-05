import InlineEnum from "@iceman8911/unplugin-inline-enum/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "wxt";

// See https://wxt.dev/api/config.html
export default defineConfig({
	manifest: {
		author: { email: "wuchijss3@gmail.com" },
		description:
			"Compares the product you're browsing with close alternatives from other popular sites to help you make the best choice.",
		name: "Shopping Optimizer",
		permissions: ["activeTab", "storage", "offscreen"],
		short_name: "Product Price Optimiser",
		version: "0.0.1",
		web_accessible_resources: [
			{
				matches: ["<all_urls>"],
				resources: ["/extract-product-data-from-window.js"],
			},
		],
	},
	modules: ["@wxt-dev/module-solid", "@wxt-dev/auto-icons"],
	vite: () => ({
		plugins: [
			tailwindcss(),
			process.env.NODE_ENV === "production" ? InlineEnum() : [],
		],
	}),
});
