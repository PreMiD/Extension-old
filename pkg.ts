import {
  ensureDirSync,
  copySync,
  removeSync,
  writeJsonSync,
  createWriteStream,
  writeJson,
  readJson,
  ensureDir
} from "fs-extra";
import chalk from "chalk";
import { get } from "request-promise-native";
import archiver from "archiver";
import ora from "ora";

var distFolder = "./dist";

var deleteFiles = [
  "package.json",
  "package-lock.json",
  ".gitignore",
  "presenceDev",
  "html/popup/scss",
  "html/tabs/scss"
];

var spinner = ora(chalk.blue("Packaging...")).start();
Promise.all([
  removeSync(`${distFolder}`),
  ensureDirSync(`${distFolder}/chrome`),
  copySync("./Extension", `${distFolder}/chrome`),
  removeFiles(`${distFolder}/chrome/`),
  removeApplications(`${distFolder}/chrome/`),
  updateLanguageFiles(`${distFolder}/chrome/`),
  zipExtension(`${distFolder}/chrome/`, "chrome")
]).then(() => spinner.succeed(chalk.green("Done!")));

function removeFiles(folder: string) {
  return Promise.all(
    deleteFiles.map(f => {
      removeSync(`${folder}${f}`);
    })
  );
}

function removeApplications(folder: string) {
  return new Promise(function(resolve, reject) {
    readJson(`${folder}manifest.json`)
      .then((manifest: any) => {
        delete manifest.applications;
        writeJson(
          `${folder}manifest.json`,
          manifest,
          {
            spaces: 2
          },
          resolve
        );
      })
      .catch(reject);
  });
}

async function updateLanguageFiles(folder: string) {
  spinner.text = chalk.yellow("Fetching language descriptions...");
  return Promise.all(
    JSON.parse(await get("https://api.premid.app/langFile/list")).map(
      async (l: string) => {
        var eDesc: string = JSON.parse(
          await get(`https://api.premid.app/langFile/${l}`)
        )["extension.description"];

        if (eDesc == undefined) return;
        ensureDir(`${folder}_locales/${convertLangCode(l)}`).then(() =>
          writeJsonSync(
            `${folder}_locales/${convertLangCode(l)}/messages.json`,
            {
              description: {
                message: eDesc
              }
            }
          )
        );
      }
    )
  );
}

/**
 * Convert language code to the one used by POEditor
 * @param {string} langCode Language code
 */
function convertLangCode(langCode: string) {
  langCode = langCode.toLocaleLowerCase().replace("_", "-");
  switch (langCode) {
    case "pt-pt":
      langCode = "pt";
      break;
  }

  return langCode;
}

function zipExtension(folder: string, fileName: string) {
  return new Promise(function(resolve, reject) {
    var archive = archiver("zip");
    archive.pipe(createWriteStream(`${distFolder}/${fileName}.zip`));
    archive.directory(folder, false);
    archive.finalize().then(() => resolve());
  });
}
