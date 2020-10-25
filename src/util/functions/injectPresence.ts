import { getStorage } from "./asyncStorage";
import { success } from "../debug";
import tabHasPresence from "./tabHasPresence";

export default async function injectPresence(
	tabId: number,
	presence: presenceStorage[0]
) {
	if (await tabHasPresence(tabId)) return false;

	return new Promise(async resolve => {
		const identifier = (await getStorage("local", "identifier")).identifier;

		chrome.tabs.executeScript(
			tabId,
			{
				code:
					`let PreMiD_Presence=true;let PreMiD_Identifier="${identifier}";let PMD_Info={tabId:${tabId}};let PreMiD_Metadata=${JSON.stringify(
						presence.metadata
					)};` + presence.presence,
				runAt: "document_start"
			},
			resolve
		);

		success("injectPresence.ts", `Injected ${presence.metadata.service}`);
	});
}
