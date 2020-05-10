import axios from "axios";
import { ensureDirSync, removeSync, writeFileSync } from "fs-extra";

let base = axios.create({ baseURL: "https://api.premid.app/v2/" });

base.get("langFile/list").then(({ data }) => {
	removeSync("src/_locales");
	Promise.all(
		data.map(async langCode => {
			return [
				langCode,
				(await base.get(`langFile/extension/${langCode}`)).data[
					"extension.description.short"
				]
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
