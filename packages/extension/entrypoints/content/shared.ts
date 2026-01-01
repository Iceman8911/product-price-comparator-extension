/** **Only works in content scripts** */
export function getUserLanguage() {
	return navigator.language ?? "en_US";
}
