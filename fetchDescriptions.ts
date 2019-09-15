import axios from "axios";
import { ensureDirSync, writeFileSync } from "fs-extra";

var base = axios.create({ baseURL: "https://api.premid.app/v2/" });

base.get("langFile/list").then(({ data }) => {
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
      ensureDirSync(`public/_locales/${description[0]}`);
      writeFileSync(
        `public/_locales/${description[0]}/messages.json`,
        JSON.stringify({
          description: {
            message: description[1]
          }
        })
      );
    });
  });
});
