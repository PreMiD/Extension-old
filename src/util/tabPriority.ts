import clearActivity from "./functions/clearActivity";
import { getPresenceMetadata } from "./functions/graphql";
import { getStorage } from "./functions/asyncStorage";
import graphql from "./functions/graphql";
import injectPresence from "./functions/injectPresence";
import tabHasPresence from "./functions/tabHasPresence";

export let priorityTab: number = null;
export let oldPresence: any = null;

export let currentPresence = null;

let currTimeout: number;

export async function tabPriority(info: any = undefined) {
	//* Get last focused window
	let lastFocusedWindow = await new Promise<chrome.windows.Window>(resolve =>
			chrome.windows.getLastFocused(resolve)
		),
		activeTab = (
			await new Promise<chrome.tabs.Tab[]>(resolve =>
				chrome.tabs.query(
					{ active: true, windowId: lastFocusedWindow.id },
					tabs => resolve(tabs)
				)
			)
		)[0],
		presence: presenceStorage = (await getStorage("local", "presences"))
			.presences;

	//* No point to continue if theres no url
	if (
		!activeTab.url ||
		activeTab.url.startsWith("chrome") ||
		activeTab.url.startsWith("edge")
	)
		return;

	//* Check if this website uses the PreMiD_Presence meta tag
	let pmdMetaTag: string = await new Promise(resolve =>
		chrome.tabs.executeScript(
			activeTab.id,
			{
				code: `try{document.querySelector('meta[name="PreMiD_Presence"]').content}catch(e){false}`
			},
			res => {
				if (!res) {
					resolve(undefined);
					return;
				}

				resolve(res[0]);
			}
		)
	);

	presence = presence.filter(p => {
		if (p.metaTag && p.metadata.service === pmdMetaTag) {
			return false;
		}

		let res = null;

		//* If not enabled return false
		if (!p.enabled) return false;

		if (typeof p.metadata.regExp !== "undefined") {
			res = activeTab.url.match(
				new RegExp("^(https?:|file:[/]?)[/]{2}" + p.metadata.regExp)
			);

			if (res === null) return false;
			else return res.length > 0;
		}

		if (Array.isArray(p.metadata.url))
			res =
				p.metadata.url.filter(url => new URL(activeTab.url).hostname === url)
					.length > 0;
		else res = new URL(activeTab.url).hostname === p.metadata.url;

		return res;
	});

	//* If PreMiD has no presence to inject here, inject one if pmdMetaTag has one
	if (presence.length === 0 && pmdMetaTag) {
		let metadata = (await getPresenceMetadata(pmdMetaTag)).data.metadata,
			prs: any = {
				metadata: metadata,
				presence: null,
				enabled: true,
				metaTag: true,
				hidden: false
			};

		const presenceJsCode = (await graphql(`
			query {
				presences(service: "${pmdMetaTag}") {
					presenceJs
					${metadata.iframe ? 'iframeJs' : ''}
				}
			}
		`)).data.presences[0];
		prs.presence = presenceJsCode.presenceJs;

		if (metadata.iframe) {
			prs.iframe = presenceJsCode.iframeJs;
		}
		presence = [prs];

		chrome.storage.local.get("presences", data => {
			let exPresence = data.presences.findIndex(
				p =>
					p.metadata.service === prs.metadata.service &&
					p.metaTag === prs.metaTag
			);

			if (exPresence > -1) {
				const enabled = data.presences[exPresence].enabled;
				let presence1 = prs;
				presence1.enabled = enabled;
				presence1.hidden = false;
				data.presences[exPresence] = presence1;
			} else data.presences.push(prs);
			chrome.storage.local.set(data);
		});
	}

	//* Presence available for currUrl
	if (presence.length > 0) {
		//* Check if this tab already has a presence injected
		let tabHasPrs = await tabHasPresence(activeTab.id);

		//* If a tab is already prioritized, run 5 sec timeout
		if (priorityTab) {
			//* If timeout ends change priorityTab
			if (!currTimeout && priorityTab !== activeTab.id)
				currTimeout = window.setTimeout(async () => {
					//* Clear old activity
					clearActivity();
					//* Disable tabPriority on old priorityTab
					chrome.tabs.sendMessage(priorityTab, { tabPriority: false });
					//* Update tab to be this one
					priorityTab = activeTab.id;

					//* If tab doesn't have presence, inject
					if (!tabHasPrs) await injectPresence(priorityTab, presence[0]);

					oldPresence = presence[0];
					chrome.tabs.sendMessage(priorityTab, { tabPriority: true });

					updatePopupVisibility();

					//* Reset Timeout
					currTimeout = null;
				}, 5 * 1000);
			else {
				//* Check if presence injected, if not inject and send TabPriority
				if (
					priorityTab === activeTab.id &&
					!tabHasPrs &&
					info &&
					info.status &&
					info.status === "complete"
				) {
					//* Only clear presence if old presence != new presence
					if (
						oldPresence !== null &&
						oldPresence.metadata.service !== presence[0].metadata.service
					) {
						//* Clear old presence from previous page
						clearActivity();
					}
					//* inject new presence
					await injectPresence(priorityTab, presence[0]);
					chrome.tabs.sendMessage(priorityTab, {
						tabPriority: true
					});
					oldPresence = presence[0];
					updatePopupVisibility();
				}
			}
		} else {
			oldPresence = presence[0];
			priorityTab = activeTab.id;

			if (!tabHasPrs) await injectPresence(priorityTab, presence[0]);

			chrome.tabs.sendMessage(priorityTab, {
				tabPriority: true
			});
			updatePopupVisibility();
		}
	} else {
		if (priorityTab === activeTab.id) {
			oldPresence = null;
			clearActivity(true);
		}
		clearTimeout(currTimeout);
		currTimeout = null;
	}
}

export function setPriorityTab(value: any) {
	priorityTab = value;
}

function updatePopupVisibility() {
	chrome.storage.local.get("presences", ({ presences }) => {
		let presenceToShow = presences.findIndex(
				p =>
					p.metaTag &&
					p.hidden &&
					p.metadata.service === oldPresence.metadata.service
			),
			presenceToHide = presences.findIndex(
				p =>
					p.metaTag &&
					!p.hidden &&
					p.metadata.service !== oldPresence.metadata.service
			);

		if (presenceToShow > -1) presences[presenceToShow].hidden = false;
		if (presenceToHide > -1) presences[presenceToHide].hidden = true;

		chrome.storage.local.set({ presences: presences });
	});
}

export function hideMetaTagPresences() {
	chrome.storage.local.get("presences", ({ presences }) => {
		let presenceToHide = presences.findIndex(p => p.metaTag && !p.hidden);

		if (presenceToHide > -1) presences[presenceToHide].hidden = true;

		chrome.storage.local.set({ presences: presences });
	});
}