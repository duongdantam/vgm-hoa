// Webpack config file for packing service worker module
const path = require('path');
module.exports = {
  mode: process.env.NODE_ENV || 'development',
  entry: path.join(__dirname, './src/service-worker/service-worker.js'),
  // module: {
  //   rules: [
  //     {
  //       test: /\.tsx?$/,
  //       loader: 'ts-loader',
  //     },
  //   ],
  // },
  devtool: 'inline-source-map',

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.json'],
    plugins: [],
  },

  output: {
    filename: 'sw.js',
    path: path.join(__dirname, 'src/service-worker'),
  },
  watchOptions: {
    ignored: /node_modules|dist|\.js/g,
  },
};
