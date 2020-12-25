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

		let logger = "";

		if (presence.metadata.readLogs) {
			const MAX_LOG_ENTRIES = 100;
			logger = `
				const PreMiD_consoleLogger = document.createElement("script");
				PreMiD_consoleLogger.type = "text/javascript";
				PreMiD_consoleLogger.id = "PreMiD_consoleLogger";
				PreMiD_consoleLogger.innerText = \`
				console.stdlog = console.log.bind(console);
				console.logs = [];
				console.log = function() {
					let inc = Array.from(arguments);
					inc.forEach(arg => {
						console.logs.push(arg);
					});
					while (console.logs.length > ${MAX_LOG_ENTRIES}) {
						console.logs.shift();
					}
					console.stdlog.apply(console, arguments);
				};
				\`;
				document.head.appendChild(PreMiD_consoleLogger);
				`.replace(/(\r\n)|\n/g, "");
		}

		chrome.tabs.executeScript(
			tabId,
			{
				code:
					`let PreMiD_Presence=true;let PreMiD_Identifier="${identifier}";let PMD_Info={tabId:${tabId}};let PreMiD_Metadata=${JSON.stringify(
						presence.metadata
					)};` +
					presence.presence +
					logger,
				runAt: "document_start"
			},
			resolve
		);

		success("injectPresence.ts", `Injected ${presence.metadata.service}`);
		if (presence.metadata.readLogs) {
			success("injectPresence.ts", `Reading logs`);
		}
	});
}
