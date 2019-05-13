/**
 * ---------------------------------------------------------------------------------------
 * webpack.dev.js
 * ---------------------------------------------------------------------------------------
 */

const path = require("path")
const webpack = require("webpack")
const merge = require("webpack-merge")
const common = require("./webpack.common")
const config = require("config")

const host = config.get("host")
const port = config.get("port")
const distDir = path.resolve(__dirname, config.get("dist_dir"))

module.exports = merge(common, {

    mode: "development",

    devtool: "inline-source-map",

    devServer: {
        host: host,
        port: port,
        open: process.platform === "darwin" ? "Google Chrome" : "chrome.exe",
        contentBase: distDir,
        historyApiFallback: false,
        hot: true,
        inline: true,
        watchOptions: {
            poll: true
        }
    },

    plugins: [

        new webpack.DefinePlugin({
            "WEBPACK_MODE": `"development"`
        }),

        new webpack.HotModuleReplacementPlugin(),

    ]

})

