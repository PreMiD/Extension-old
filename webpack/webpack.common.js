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
		"html/popup/app.js": path.join(__dirname, srcDir + "html/popup/app.ts")
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
				loaders: "vue-loader"
			},

			{
				test: /\.(png|woff|woff2|eot|ttf|svg)$/,
				loader: "url-loader?limit=100000"
			},

			{
				test: /\.s[ac]ss$/i,
				use: ["vue-style-loader", "css-loader", "sass-loader"]
			},
			{
				test: /\.ts?$/,
				loader: "ts-loader",
				exclude: /node_modules/,
				options: { appendTsSuffixTo: [/\.vue$/] }
			}
		]
	},
	resolve: {
		extensions: [".ts", ".js", ".vue"]
	},
	plugins: [
		new VueLoaderPlugin(),
		new CopyPlugin(
			[
				{ from: "_locales", to: "_locales" },
				{ from: "assets", to: "assets" },
				{ from: "html", to: "html" },
				{ from: "js", to: "js" },
				{ from: "manifest.json", to: "manifest.json" }
			],
			{ context: "src" }
		)
	]
};
