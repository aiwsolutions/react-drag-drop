const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const ROOT_PATH = path.resolve(__dirname);
const EXAMPLE_PATH = path.join(ROOT_PATH, '/examples');

module.exports = {
    context: EXAMPLE_PATH,
    entry: 'index',
    mode: 'development',
    output: {
        filename: 'bundle.js',
        path: ROOT_PATH
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        modules: [
            EXAMPLE_PATH,
            path.join(ROOT_PATH, 'node_modules')
        ]
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                use: ['babel-loader'],
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            title: 'React Drag Drop examples',
            template: 'index.ejs'
        })
    ]
};
