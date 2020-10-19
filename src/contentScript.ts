import { getString } from "./util/langManager";
import { info } from "./util/debug";

let tabPriority: number = null,
	port = chrome.runtime.connect({ name: "contentScript" });

window.addEventListener("PreMiD_UpdatePresence", (data: CustomEvent) =>
	port.postMessage({ action: "updatePresence", presence: data.detail })
);

chrome.runtime.onMessage.addListener(function (data) {
	if (port === null) return;

	if (typeof data.iFrameData !== "undefined") {
		window.dispatchEvent(
			new CustomEvent("PreMiD_iFrameData", {
				detail: data.iFrameData
			})
		);
	}

	if (typeof data.tabPriority !== "undefined") {
		if (data.tabPriority) {
			//* Prevent multiple intervals
			if (tabPriority === null) {
				info("contentScript.ts", `Tab Priority: ${data.tabPriority}`);
				tabPriority = window.setInterval(() => {
					//TODO Find a way to prevent console error spam (context invalidated) > Most likely using runtime.connect()
					chrome.runtime.sendMessage({ iFrameUpdateData: true });

					document.dispatchEvent(new CustomEvent("PreMiD_UpdateData"));

					info("contentScript.ts", "updateData");
				}, 100);
			}
		} else {
			clearInterval(tabPriority);
			tabPriority = null;
		}
	}
});

window.addEventListener("PreMiD_RequestExtensionData", async function (
	data: CustomEvent
) {
	let strings = data.detail.strings;
	const language = data.detail.language;

	(
		await Promise.all(
			Object.keys(strings).map(string => getString(strings[string], language))
		)
	).map((sT, i) => (strings[Object.keys(strings)[i]] = sT));

	window.dispatchEvent(
		new CustomEvent("PreMiD_ReceiveExtensionData", {
			detail: {
				strings: strings
			}
		})
	);
});
