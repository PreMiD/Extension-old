const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const srcDir = "../src/";

module.exports = {
  stats: "errors-only",
  entry: {
    background: path.join(__dirname, srcDir + "background.ts"),
    helper: path.join(__dirname, srcDir + "helper.ts"),
    contentScript: path.join(__dirname, srcDir + "contentScript.ts"),
    presenceManager: path.join(__dirname, srcDir + "util/presenceManager.ts"),
    iFrameHandler: path.join(__dirname, srcDir + "util/iFrameHandler.ts")
  },
  output: {
    path: path.join(__dirname, "../dist/js"),
    filename: "[name].js",
    library: "pmd"
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          chunks: "all",
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
        test: /\.s[ac]ss$/i,
        use: ["sass-loader"]
      },
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
  plugins: [new CopyPlugin([{ from: ".", to: "../" }], { context: "public" })]
};
