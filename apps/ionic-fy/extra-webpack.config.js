// Webpack config file for packing service worker module
// const path = require('path');
// const webpack = require('webpack');
// const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
// const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
// const WorkboxPlugin = require('workbox-webpack-plugin');
module.exports = {
  plugins: [
    // fixes Module not found: Error: Can't resolve 'stream' in '.../node_modules/nofilter/lib'
    // new NodePolyfillPlugin(),
    // Note: stream-browserify has assumption about `Buffer` global in its
    // dependencies causing runtime errors. This is a workaround to provide
    // global `Buffer` until https://github.com/isaacs/core-util-is/issues/29
    // is fixed.
    // new webpack.ProvidePlugin({
    //   Buffer: ['buffer', 'Buffer'],
    //   process: 'process/browser',
    // }),
    // new WorkboxPlugin.InjectManifest({
    //   swSrc: path.resolve(__dirname, './src/worker/service-worker.js'),
    //   swDest: 'service-worker.js',
    // }),
    // new WorkboxPlugin.InjectManifest({
    //   swSrc: path.resolve(__dirname, './src/worker/shared-worker.js'),
    //   swDest: 'shared-worker.js',
    // }),
  ],
  // optimization: {
  //   minimizer: [
  //     // Default flags break js-ipfs: https://github.com/ipfs-shipyard/ipfs-companion/issues/521
  //     new UglifyJsPlugin({
  //       parallel: true,
  //       extractComments: true,
  //       uglifyOptions: {
  //         compress: {
  //           unused: false,
  //           drop_console: true,
  //         },
  //         mangle: true,
  //       },
  //     }),
  //   ],
  // },
  node: {
    path: true,
    crypto: true,
    fs: 'empty',
  },
  // resolve: {
  //   alias: {
  //     crypto: 'crypto-browserify',
  //   },
  // },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          // uncomment here for turning off console
          {
            loader: 'remove-console-loader',
            options: {
              exclude: ['error', 'warn'],
            },
          },
          // {
          //   loader: 'babel-loader',
          //   options: {
          //     presets: [
          //       [
          //         '@babel/preset-env',
          //         {
          //           targets: {
          //             esmodules: true,
          //           },
          //         },
          //       ],
          //     ],
          //   },
          // },
        ],
      },
      {
        test: /(chunk\-ATGUPOGX)|(chunk\-SINVUGUJ)|(chunk\-5UWJICAP)\.js$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: {
                      esmodules: true,
                    },
                  },
                ],
              ],
            },
          },
        ],
      },
    ],
  },
};
