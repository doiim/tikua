const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production', // Or 'development' for debugging
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'index.js',
        library: 'cartesi-sdk', // Library name for browser use
        libraryTarget: 'umd',         // UMD for compatibility
        globalObject: 'this'          // Adapt to various environments
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    module: {
        rules: [
            { test: /\.ts$/, loader: 'ts-loader' }
        ]
    },
    externals: {
        "viem": "viem",
        "@urql/core": "@urql/core"
    },
    // plugins: [
    //     new CopyPlugin({
    //         patterns: [
    //             {
    //                 from: path.resolve(__dirname, 'src', 'deployments'),
    //                 to: path.resolve(__dirname, 'dist', 'deployments')
    //             },
    //             {
    //                 from: path.resolve(__dirname, 'src', 'abis'),
    //                 to: path.resolve(__dirname, 'dist', 'abis')
    //             },
    //         ],
    //     }),
    // ]
};