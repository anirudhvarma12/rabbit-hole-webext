const path = require("path");

const SRC_DIR = path.join(__dirname, "src");
const DIST_DIR = path.join(__dirname, "dist/js");

module.exports = {
  entry: {
    background: path.join(SRC_DIR, "background-script.ts")
  },
  output: {
    path: DIST_DIR,
    filename: "[name].js"
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
  devtool: "inline-source-map"
};
