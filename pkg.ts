import {
  ensureDirSync,
  copySync,
  removeSync,
  readJSONSync,
  writeJsonSync
} from "fs-extra";
import chalk from "chalk";

var distFolder = "./dist";

var files = [
  "package.json",
  "package-lock.json",
  ".gitignore",
  "presenceDev",
  "html/pages/popup/scss",
  "html/pages/tab/scss"
];

(async () => {
  console.log(chalk.blue("Packaging..."));
  await removeSync(`${distFolder}/chrome`);
  await ensureDirSync(`${distFolder}/chrome`);

  await copySync("./Extension", `${distFolder}/chrome`);

  await Promise.all(
    files.map(f => {
      removeSync(`${distFolder}/chrome/${f}`);
    })
  );

  var manifest = await readJSONSync(`${distFolder}/chrome/manifest.json`);
  delete manifest.applications;
  await writeJsonSync(`${distFolder}/chrome/manifest.json`, manifest, {
    spaces: 2
  });

  console.log(chalk.green("Done!"));
})();
