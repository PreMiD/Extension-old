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
import axios from "axios";
import * as archiver from "archiver";
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
    (await axios.get("https://api.premid.app/v2/langFile/list")).data.map(
      async (l: string) => {
        var eDesc: string = (await axios.get(
          `https://api.premid.app/v2/langFile/extension/${l}`
        )).data["extension.description.short"];

        if (eDesc == undefined) return;
        ensureDir(`${folder}_locales/${l}`).then(() =>
          writeJsonSync(`${folder}_locales/${l}/messages.json`, {
            description: {
              message: eDesc
            }
          })
        );
      }
    )
  );
}

function zipExtension(folder: string, fileName: string) {
  return new Promise(function(resolve, reject) {
    var archive = archiver.create("zip");
    archive.pipe(createWriteStream(`${distFolder}/${fileName}.zip`));
    archive.directory(folder, false);
    archive.finalize().then(() => resolve());
  });
}
