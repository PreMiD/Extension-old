import { getStorage } from "./asyncStorage";
import { releaseType, requiredAppVersion } from "../../config";

export default async function consoleHeader() {
	console.log(
		`%cPreMiD\n%c© 2018-${new Date().getFullYear()} Timeraa\n\n%cVersion: %c${
			chrome.runtime.getManifest().version_name
		}\n%cRelease type: %c${releaseType}\n%cReq App build: %c${requiredAppVersion}\n%cScience Id: %c${
			(await getStorage("local", "identifier")).identifier
		}`,
		"font-family:sans-serif;font-size:2.5rem;font-weight:bold;color: #596cae",
		"font-size:1rem;font-weight:bold;color:rgb(70,200,70);",
		"font-size:1rem;",
		"font-size:1rem;color:#99AAB5;",
		"font-size:1rem;",
		"font-size:1rem;color:#99AAB5;",
		"font-size:1rem;",
		"font-size:1rem;color:#99AAB5;",
		"font-size:1rem;",
		"font-size:1rem;color:#99AAB5;"
	);
}
