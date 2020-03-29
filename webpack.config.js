const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const SRC_DIR = path.join(__dirname, "src");
const DIST_DIR = path.join(__dirname, "dist");

module.exports = {
  entry: {
    background: path.join(SRC_DIR, "background-script.ts"),
    viewer: path.join(SRC_DIR, "viewer.ts")
  },
  output: {
    path: DIST_DIR,
    filename: "js/[name].js"
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader"
      }
    ]
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"]
  },
  devtool: "inline-source-map",
  plugins: [
    new CopyPlugin([
      { from: "src/viewer.html", to: "viewer.html" },
      { from: "src/viewer.css", to: "viewer.css" }
    ])
  ]
};
