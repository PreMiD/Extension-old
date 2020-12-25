import { ensureDirSync, removeSync, writeFileSync } from "fs-extra";

import graphqlRequest from "./src/util/functions/graphql";

let langList = [];
graphqlRequest(`
	query {
		langFiles(project: "extension") {
			lang
		}
	}
`).then(res => res.data.langFiles.forEach(lang => {
	langList.push(lang.lang);
	})).finally(() => {
	removeSync("src/_locales");
	Promise.all(
		langList.map(async langCode => {
			return [
				langCode,
				await translationsInLanguage(langCode, "extension.description.short")
			];
		})
	).then(data => {
		data.map(description => {
			switch (description[0]) {
				case "pt":
					description[0] = "pt_PT";
					break;
				case "ar_SA":
					description[0] = "ar";
					break;
				case "cs_CZ":
					description[0] = "cs";
					break;
				case "da_DK":
					description[0] = "da";
					break;
				case "he_IL":
					description[0] = "he";
					break;
				case "ja_JP":
					description[0] = "ja";
					break;
				case "ko_KR":
					description[0] = "ko";
					break;
				case "sl_SI":
					description[0] = "sl";
					break;
				case "sv_SE":
					description[0] = "sv";
					break;
				case "uk_UA":
					description[0] = "uk";
					break;
				case "bs_BA":
					description[0] = "bs";
					break;
			}

			if (!description[1]) return;

			ensureDirSync(`src/_locales/${description[0]}`);
			writeFileSync(
				`src/_locales/${description[0]}/messages.json`,
				JSON.stringify({
					description: {
						message: description[1]
					}
				})
			);
		});
	});
});

// Obtain extension strings, whole project or specific string (if given) fallbacks to english
async function translationsInLanguage(langCode: string, string?: string): Promise<object|string> {
	const FALLBACK_LOCALE = "en";

	const langFiles = (await graphqlRequest(`
		query {
			langFiles(project: "extension", lang: "${langCode}") {
				translations
			}
		}
	`)).data.langFiles;

	if (langFiles.length === 0) {
		if (langCode !== FALLBACK_LOCALE) {
			return !string
				? await translationsInLanguage(FALLBACK_LOCALE)
				: await translationsInLanguage(FALLBACK_LOCALE, string);

		} else {
			return string ?? {};
		}
	}

	const translations = langFiles[0].translations;

	if (!string) {
		return translations;
	}

	if (translations[string]) {
		return translations[string];

	} else if (langCode !== FALLBACK_LOCALE) {
		return await translationsInLanguage(FALLBACK_LOCALE, string);
	}

	return string;
}