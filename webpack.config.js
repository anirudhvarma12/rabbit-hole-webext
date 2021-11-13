const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const SRC_DIR = path.join(__dirname, "src");
const DIST_DIR = path.join(__dirname, "dist");

module.exports = {
  entry: {
    background: path.join(SRC_DIR, "background-script.ts"),
    viewer: path.join(SRC_DIR, "viewer.ts"),
    sidebar: path.join(SRC_DIR, "sidebar.ts"),
  },
  output: {
    path: DIST_DIR,
    filename: "js/[name].js",
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  devtool: "inline-source-map",
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "src/viewer.html", to: "viewer.html" },
        { from: "src/sidebar.html", to: "sidebar.html" },
        { from: "src/viewer.css", to: "viewer.css" },
        { from: "assets", to: "assets" },
        {
          from: "node_modules/webextension-polyfill/dist/browser-polyfill.js",
          to: "js",
        },
      ],
    }),
  ],
};
