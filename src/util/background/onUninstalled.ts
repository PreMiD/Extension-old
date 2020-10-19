import { apiBase } from "../../config";

chrome.storage.local.get("identifier", s => {
	if (s.identifier) {
		chrome.runtime.setUninstallURL(`${apiBase}science/${s.identifier}/`);
	}
});
