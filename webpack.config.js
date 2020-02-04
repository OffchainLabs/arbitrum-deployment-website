const { resolve } = require('path')

const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebPackPlugin = require('html-webpack-plugin');
const isDevelopment = process.env.NODE_ENV !== 'production';

const babelOptions = {
  "presets": [
    "@babel/preset-env"
  ]
};

module.exports = {
    entry: resolve('./src/index.ts'),
    devtool: 'inline-source-map',
    devServer: {
        contentBase: "./dist"
    },
    resolve: {
        extensions: ['.ts', '.js'], //resolve all the modules other than index.ts
        plugins: [
            new TsconfigPathsPlugin({ configFile: "tsconfig.json" })
        ]
    },
    node: { fs: 'empty', child_process: 'empty'},
    module: {
        rules: [
            {
                test: /\.html$/,
                use: [
                    {
                        loader: 'html-loader',
                        options: { minimize: !isDevelopment }
                    }
                ]
            },
            {
                test: /\.css$/,
                use: ["style-loader", "css-loader"]
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    'style-loader',
                    // Translates CSS into CommonJS
                    'css-loader',
                    // Compiles Sass to CSS
                    'sass-loader',
                ],
            },
            {
                test: /\.svg$/,
                loader: "svg-inline-loader"
            },
            {
                test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: "[name].[ext]",
                            outputPath: "fonts/"
                        }
                    }
                ]
            },
            {
                test: /\.ts(x?)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: babelOptions
                    },
                    {
                        loader: 'ts-loader'
                    }
                ]
            },
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: babelOptions
                    }
                ]
            }
        ]
    },
    plugins: [
        new HtmlWebPackPlugin({
            template: resolve(__dirname, 'src', 'index.html'),
            filename: 'index.html'
        })
    ]
}