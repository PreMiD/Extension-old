import tabHasPresence from "./tabHasPresence";
import { success } from "../debug";

export default async function injectPresence(
	tabId: number,
	presence: presenceStorage[0]
) {
	if (await tabHasPresence(tabId)) return false;

	return new Promise(resolve => {
		chrome.tabs.executeScript(
			tabId,
			{
				code:
					`let PreMiD_Presence=true;let PMD_Info={tabId:${tabId}};let PreMiD_Metadata=${JSON.stringify(
						presence.metadata
					)};` + presence.presence,
				runAt: "document_start"
			},
			resolve
		);

		success("injectPresence.ts", `Injected ${presence.metadata.service}`);
	});
}
