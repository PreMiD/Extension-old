import axios from "axios";
import { getStorage } from "./asyncStorage";
import { apiBase, releaseType } from "../../config";

export default async function hasAlphaBetaAccess() {
	const { authorizedBetaAlpha } = await getStorage(
		"local",
		"authorizedBetaAlpha"
	);

	if (!authorizedBetaAlpha) {
		let redirectURL =
			"https://cpoegcmgabanfledhkjdicdclgpmghog.chromiumapp.org";
		// @ts-ignore //* Firefox detection
		if (typeof browser !== "undefined")
			// @ts-ignore
			redirectURL = await browser.identity.getRedirectURL();

		const allowedAccess = await new Promise(resolve =>
			chrome.identity.launchWebAuthFlow(
				{
					url: `https://discordapp.com/api/oauth2/authorize?response_type=token&client_id=503557087041683458&scope=identify&redirect_uri=${redirectURL}`,
					interactive: true
				},
				async responseUrl => {
					if (!responseUrl || !responseUrl.match(/(&access_token=[\d\w]+)/g)) {
						//* So chrome shuts up
						chrome.runtime.lastError;
						resolve();
						return;
					}

					const accessToken = responseUrl
						.match(/(&access_token=[\d\w]+)/g)[0]
						.replace("&access_token=", "");

					const dUser = (
						await axios("https://discordapp.com/api/users/@me", {
							headers: {
								Authorization: `Bearer ${accessToken}`
							}
						})
					).data;

					let allowedAccess: boolean;
					if (releaseType === "BETA") {
						allowedAccess = (await axios(apiBase + "betaAccess/" + dUser.id))
							.data.access;
					} else if (releaseType === "ALPHA")
						allowedAccess = (await axios(apiBase + "alphaAccess/" + dUser.id))
							.data.access;

					resolve(allowedAccess);
				}
			)
		);

		chrome.storage.local.set({
			authorizedBetaAlpha: allowedAccess
		});
	}
}
