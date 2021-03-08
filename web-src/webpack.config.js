const {VueLoaderPlugin} = require("vue-loader");
const HtmlPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const PreloadPlugin = require("@vue/preload-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const path = require("path");
const purgecss = require("@fullhuman/postcss-purgecss");
const glob = require("glob");

const favicon = glob.sync("src/favicon.*").sort((a, b) => (a < b) - (a > b))[0] || null;
// The above is a convenient way to prioritize images by web-ready-ness. WEBP > PNG > JPG > ICO

module.exports = (env, argv) => ({
    entry: "./src/main.js",

    output: {
        path: path.resolve(__dirname, "../web"),
        filename: "main.js",
        assetModuleFilename: "[name].[hash][ext]"
    },

    module: {
        rules: [
            {
                test: /\.vue$/i,
                loader: "vue-loader"
            },
            {
                test: /\.css$/i,
                use: [
                    "vue-style-loader",
                    argv.mode === "production" ? MiniCssExtractPlugin.loader : "style-loader",
                    "css-loader",
                    {
                        loader: "postcss-loader",
                        options: {
                            postcssOptions: {
                                plugins: [
                                    "tailwindcss",
                                    "autoprefixer"
                                ].concat(argv.mode === "production" ? [
                                    purgecss({
                                        content: [
                                            "./src/**/*.html",
                                            "./src/**/*.vue",
                                            "./src/**/*.js"
                                        ],
                                        css: [
                                            "./src/**/*.css"
                                        ]
                                    }),
                                    "cssnano"
                                ] : [])
                            }
                        }
                    }
                ]
            },
            {
                test: /\.(?:png|gif|ico|jpe?g|webp|avif|svg|mp4|webm|mkv)$/i,
                type: "asset",
                parser: {
                    dataUrlCondition: {
                        maxSize: 4096
                    }
                }
            }
        ].concat(argv.mode === "production" ? [
                {
                    test: /\.[mc]?js$/i,
                    exclude: /node_modules/,
                    use: {
                        loader: "babel-loader",
                        options: {
                            presets: [
                                ["@babel/preset-env", {useBuiltIns: "entry", corejs: 3}]
                            ],
                            plugins: [
                                "@babel/plugin-syntax-dynamic-import"
                            ]
                        }
                    }
                }
            ] : [])
    },
    plugins: glob.sync("src/**/index.html").map(f =>
        new HtmlPlugin(Object.assign({
            template: f,
            filename: f.split("/").slice(1).join("/"),
            meta: {
                referrer: "no-referrer",
                keywords: "sharex, image host, dapper, uploader, files, sxcu, pomf",
                author: require("./package.json").author,
                viewport: "width=device-width, initial-scale=1.0"
            },
            hash: argv.mode === "production"
        }, favicon === null ? {} : {favicon}))
    ).concat([
        new VueLoaderPlugin()
    ]).concat(argv.mode === "production" ? [
        new PreloadPlugin(),
        new MiniCssExtractPlugin()
    ] : []),

    optimization: {
        minimize: argv.mode === "production",
        minimizer: [
            new TerserPlugin()
        ],
        splitChunks: {
            chunks: argv.mode === "production" ? "all" : "async"
        }
    }
});