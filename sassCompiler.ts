import { render, Result } from "node-sass";
import { writeFile, watchFile } from "fs";
import chalk from "chalk";
import { basename } from "path";

//* Clear old output
console.clear();

var filesToCompile = require("./sassFiles.json");

filesToCompile.map(async (f: any) => {
  var reqFiles = await compileFile(f.file, f.outFile);

  reqFiles.stats.includedFiles.map(file =>
    watchFile(file, () => {
      console.clear();
      compileFile(f.file, f.outFile);
    })
  );
});

function compileFile(file: string, outFile: string) {
  return new Promise<Result>(async (resolve, reject) => {
    await render(
      {
        file: file,
        outFile: outFile,
        outputStyle: "compressed"
      },
      (err, res) => {
        if (err) {
          // @ts-ignore Ignore as .d.ts file is incorrect
          console.log(chalk.red(err.formatted));
          return;
        }

        writeFile(outFile, res.css, err => {
          if (err) {
            console.error(err);
            reject(err);
            return;
          }

          console.log(
            "✅" +
              chalk.white(
                `  Compiled ${chalk.green(
                  basename(file)
                )} at ${new Date().toLocaleTimeString()}`
              )
          );

          resolve(res);
        });
      }
    );
  });
}
