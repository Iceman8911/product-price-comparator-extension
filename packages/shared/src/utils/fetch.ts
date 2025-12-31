import type { Options as KyOptions } from "ky";

const _NO_RETRY_OPTIONS = {
	retry: 0,
	timeout: 5000,
} as const satisfies KyOptions;
