import { socket } from "../socketManager";
import { info } from "../debug";
import cpObj from "./cpObj";
import { getStorage } from "./asyncStorage";
import { releaseType } from "../../config";

export default async function setActivity(
	presence: any,
	settings: any = undefined
) {
	if (releaseType !== "RELEASE") {
		const { authorizedBetaAlpha } = await getStorage(
			"local",
			"authorizedBetaAlpha"
		);

		if (!authorizedBetaAlpha) return;
	}

	if (!settings) settings = (await getStorage("sync", "settings")).settings;
	if (presence == null || !settings.enabled.value) return;

	let pTS = cpObj(presence);

	if (pTS.trayTitle && settings.titleMenubar.value && pTS.trayTitle.trim())
		pTS.trayTitle = pTS.trayTitle.trim();
	else pTS.trayTitle = "";

	if (!settings.mediaKeys.value) pTS.mediaKeys = false;

	if (pTS.presenceData.details)
		pTS.presenceData.details = pTS.presenceData.details.slice(0, 128).trim();
	if (pTS.presenceData.state)
		pTS.presenceData.state = pTS.presenceData.state.slice(0, 128).trim();

	if (socket.connected) socket.emit("setActivity", pTS);
	info("setActivity.ts", "setActivity");
}
