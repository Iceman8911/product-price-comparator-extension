import { fixCaughtErrorType } from "@shopping-optimizer/shared";

/** If this returns `true`, the requested permissions are present */
export async function requestForPermissionsIfDisabled(
	permissions: Browser.permissions.Permissions,
): Promise<boolean> {
	try {
		const isPermissionGranted = await browser.permissions.contains(permissions);

		if (isPermissionGranted) return true;

		return browser.permissions.request(permissions);
	} catch (e) {
		console.error("Permission request failed with", fixCaughtErrorType(e));

		return false;
	}
}
