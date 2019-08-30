const webpack = require("webpack");
const WebpackShellPlugin = require("webpack-shell-plugin");
const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = "../src/";

module.exports = {
  entry: {
    background: path.join(__dirname, srcDir + "background.ts"),
    popup: path.join(__dirname, srcDir + "popup.ts"),
    tabs: path.join(__dirname, srcDir + "tabs.ts"),
    contentScript: path.join(__dirname, srcDir + "contentScript.ts"),
    presenceManager: path.join(__dirname, srcDir + "util/presenceManager.ts"),
    iFrameHandler: path.join(__dirname, srcDir + "util/iFrameHandler.ts")
  },
  output: {
    path: path.join(__dirname, "../dist/js"),
    filename: "[name].js",
    library: "pmd",
    libraryTarget: "var"
  },
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendors: {
          name: "vendor",
          test(module) {
            var context = module.context;

            if (typeof context !== "string") {
              return false;
            }

            return context.indexOf("node_modules") !== -1;
          }
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".js"]
  },
  plugins: [
    new CopyPlugin([{ from: ".", to: "../" }], { context: "public" }),
    new WebpackShellPlugin({
      onBuildStart: [
        "tsc src/util/presence/devHelper.ts --outFile dist/js/devHelper.js"
      ]
    })
  ]
};
