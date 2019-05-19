/**
 * ---------------------------------------------------------------------------------------
 * webpack.prod.js
 * ---------------------------------------------------------------------------------------
 */

const path = require("path")
const webpack = require("webpack")
const merge = require("webpack-merge")
const TerserPlugin = require("terser-webpack-plugin")
const FaviconsWebpackPlugin = require("favicons-webpack-plugin")
const common = require("./webpack.common")


module.exports = merge(common, {

    mode: "development",

    plugins: [

        new webpack.DefinePlugin({
            "WEBPACK_MODE": `"production"`
        }),

        new webpack.optimize.AggressiveMergingPlugin(),

        new FaviconsWebpackPlugin({
            logo: path.resolve(__dirname, "assets/images/favicon.png"),
            icons: {
                android: false,
                appleIcon: false,
                appleStartup: false,
                coast: false,
                favicons: true,
                firefox: false,
                opengraph: false,
                twitter: false,
                yandex: false,
                windows: false
            }
        }),

    ],

    optimization: {

        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    output: {
                        comments: false,
                    },
                    compress: {
                        drop_console: true,
                    },
                    safari10: true
                },
            })
        ],
        usedExports: true,
        sideEffects: true,

        splitChunks: {
            chunks: 'async',
            minSize: 30000,
            maxSize: 0,
            minChunks: 1,
            maxAsyncRequests: 5,
            maxInitialRequests: 3,
            automaticNameDelimiter: '~',
            name: true,
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true
                }
            }
        }
    }

})

