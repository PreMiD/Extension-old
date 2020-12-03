import axios from "axios";

import { releaseType } from "../../config";
import { getStorage } from "./asyncStorage";
import graphqlRequest from "./graphql";

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
							.replace("&access_token=", ""),
						dUser = (
							await axios("https://discordapp.com/api/users/@me", {
								headers: {
									Authorization: `Bearer ${accessToken}`
								}
							})
						).data,
						accessType = (
							await graphqlRequest(`
						query {
							alphaBetaAccess(userId: "${dUser.id}") {
								betaAccess
								alphaAccess
							}
						}
					`)
						).data.alphaBetaAccess[0];

					let allowedAccess: boolean;
					if (releaseType === "BETA") {
						allowedAccess = accessType.betaAccess;
					} else if (releaseType === "ALPHA")
						allowedAccess = accessType.alphaAccess;

					resolve(allowedAccess);
				}
			)
		);

		chrome.storage.local.set({
			authorizedBetaAlpha: allowedAccess
		});
	}
}
