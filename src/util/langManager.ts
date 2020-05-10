import axios from "axios";
import { error, success } from "./debug";
import { apiBase } from "../config";

/**
 * Default language code
 */
export const DEFAULT_LOCALE = "en";

let languages: object = {};

/**
 * Update strings values (extension and presence endpoints) from the API website
 *
 * @param languageCode language code following ISO639-1 spec
 */
export async function updateStrings(languageCode?: string) {
	if (typeof languageCode === "undefined") languageCode = DEFAULT_LOCALE;

	try {
		languages[languageCode] = {
			name: (
				await axios(`langFile/website/${languageCode}`, {
					baseURL: apiBase
				})
			).data["header.language"],
			extension: (
				await axios(`langFile/extension/${languageCode}`, {
					baseURL: apiBase
				})
			).data,
			presence: (
				await axios(`langFile/presence/${languageCode}`, {
					baseURL: apiBase
				})
			).data
		};

		success("langManager.ts", `Updated ${languageCode} translations`);
	} catch (e) {
		error("langManager.ts", `Error while fetching langFiles: ${e.message}`);
		return;
	}

	if (languages[languageCode] && languages[languageCode].error) {
		languages[languageCode] = undefined;
		return;
	}

	await chrome.storage.local.set({ languages });
}

/**
 * Strings that are being loaded by loadStrings function
 */
const loadingLangs = [];

/**
 * Load the strings from the browser local storage, if they are not found in the storage they will be
 * fetch from the API.
 *
 * @param languageCode language code ISO639-1 if not speficied DEFAULT_LOCALE is used
 */
export async function loadStrings(languageCode?: string) {
	if (typeof languageCode === "undefined") languageCode = DEFAULT_LOCALE;

	return new Promise(resolve => {
		if (typeof languages[languageCode] !== "undefined") resolve();

		if (!loadingLangs.includes(languageCode)) {
			loadingLangs.push(languageCode);

			chrome.storage.local.get("languages", async lngs => {
				if (typeof lngs.languages[DEFAULT_LOCALE] === "undefined") {
					await updateStrings(DEFAULT_LOCALE);
				}

				if (typeof lngs.languages[languageCode] === "undefined") {
					await updateStrings(languageCode);

					resolve();
				}

				// merge all languages
				languages = { ...languages, ...lngs.languages };

				loadingLangs.splice(loadingLangs.indexOf(languageCode), 1);
				resolve();
			});
		} else {
			let loadStatus = setInterval(() => {
				if (
					typeof languages !== "undefined" &&
					typeof languages[languageCode] !== "undefined"
				) {
					clearInterval(loadStatus);
					resolve();
				}
			}, 5);
		}
	});
}

/**
 * Get all the translations in the given language and DEFAULT_LOCALE
 *
 * @param languageCode language code ISO639-1 if not speficied DEFAULT_LOCALE is used
 */
export function getStrings(languageCode?: string) {
	if (typeof languageCode === "undefined") languageCode = DEFAULT_LOCALE;

	return new Promise(async resolve => {
		await loadStrings(languageCode);

		if (languages[languageCode] === "undefined") {
			resolve({
				[DEFAULT_LOCALE]: {
					...languages[DEFAULT_LOCALE].extension,
					...languages[DEFAULT_LOCALE].presence
				}
			});
		} else {
			resolve({
				[languageCode]: {
					...languages[languageCode].extension,
					...languages[languageCode].presence
				},
				[DEFAULT_LOCALE]: {
					...languages[DEFAULT_LOCALE].extension,
					...languages[DEFAULT_LOCALE].presence
				}
			});
		}
	});
}

/**
 * Get translation of a specific key
 *
 * @param string name of the string, to get the name of the language use "name" or "header.language"
 * @param languageCode language code ISO639-1 if not speficied DEFAULT_LOCALE is used
 */
export function getString(string: string, languageCode?: string) {
	if (typeof languageCode === "undefined") languageCode = DEFAULT_LOCALE;

	return new Promise(async resolve => {
		await loadStrings(languageCode);

		if (typeof languages[languageCode] !== "undefined") {
			if (
				["name", "header.language"].includes(string) &&
				typeof languages[languageCode].name !== "undefined"
			) {
				return resolve(languages[languageCode].name);
			} else if (
				typeof languages[languageCode].extension !== "undefined" &&
				typeof languages[languageCode].extension[string] !== "undefined"
			) {
				return resolve(languages[languageCode].extension[string]);
			} else if (
				typeof languages[languageCode].presence !== "undefined" &&
				typeof languages[languageCode].presence[string] !== "undefined"
			) {
				return resolve(languages[languageCode].presence[string]);
			}
		}

		// prevent infinite loops
		if (languageCode === DEFAULT_LOCALE) {
			return resolve(string);
		}

		return resolve(await getString(string, DEFAULT_LOCALE));
	});
}

/**
 * Obtain all languages that are 100% translated for a presence
 *
 * @param presenceName name of the presence as specified in the "service" key of the metadata.json file
 */
export async function getPresenceLanguages(presenceName: string) {
	try {
		return (
			await axios(
				`langFile/${encodeURIComponent(presenceName.toLowerCase())}/list`,
				{
					baseURL: apiBase
				}
			)
		).data;
	} catch (e) {
		// 404 error code
	}

	return [];
}
