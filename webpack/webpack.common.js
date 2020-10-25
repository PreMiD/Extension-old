const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const { VueLoaderPlugin } = require("vue-loader");
const srcDir = "../src/";

module.exports = {
	entry: {
		"js/background.js": path.join(__dirname, srcDir + "background.ts"),
		"js/helper.js": path.join(__dirname, srcDir + "helper.ts"),
		"js/contentScript.js": path.join(__dirname, srcDir + "contentScript.ts"),
		"js/presenceManager.js": path.join(
			__dirname,
			srcDir + "util/presenceManager.ts"
		),
		"js/iFrameHandler.js": path.join(
			__dirname,
			srcDir + "util/iFrameHandler.ts"
		),
		"html/popup/app.js": path.join(__dirname, srcDir + "html/popup/app.ts"),
		"js/devHelper.js": path.join(__dirname, srcDir + "util/presence/devHelper.ts")
	},
	output: {
		path: path.join(__dirname, "../dist/"),
		filename: "[name]",
		library: "pmd"
	},
	optimization: {
		splitChunks: {
			cacheGroups: {
				vendors: {
					chunks: "all",
					name: "js/vendor.js",
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
				test: /\.vue$/,
				loader: "vue-loader"
			},

			{
				test: /\.(png|woff|woff2|eot|ttf|svg)$/,
				use: [
					{
						loader: "url-loader",
						options: {
							limit: 100000
						}
					}
				]
			},

			{
				test: /\.s[ac]ss$/i,
				use: ["vue-style-loader", "css-loader", "sass-loader"]
			},
			{
				test: /\.ts?$/,
				use: [
					{
						loader: "ts-loader",
						options: {
							appendTsSuffixTo: [/\.vue$/]
						}
					}
				],
				exclude: /node_modules/
			}
		]
	},
	resolve: {
		extensions: [".ts", ".js", ".vue"]
	},
	plugins: [
		new VueLoaderPlugin(),
		new CopyPlugin({
			patterns: [
				{ from: "_locales", to: "_locales", context: "src" },
				{ from: "assets", to: "assets", context: "src" },
				{ from: "html", to: "html", context: "src" },
				{ from: "js", to: "js", context: "dist" },
				{ from: "manifest.json", to: "manifest.json", context: "src" }
			]
		})
	]
};
