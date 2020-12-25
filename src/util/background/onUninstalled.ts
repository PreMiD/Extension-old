import { apiBase } from "../../config";

chrome.storage.local.get("identifier", s => {
	if (s.identifier) {
		chrome.runtime.setUninstallURL(
			`${apiBase.replace("/v3/", "/v2/")}science/${s.identifier}`
		);
	}

	// TODO Uninstall page
	// graphqlRequest(`
	// mutation {
	// 	deleteScience(identifier: "${s.identifier}") {
	// 		identifier
	// 	}
	// }
	// `);
});
