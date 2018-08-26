const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const utils = require('./utils');
const config = require('./config');
const baseWebpackConfig = require('./webpack.base.conf');

// NOTE IMPORTANT: this file will run at runtime

// add hot-reload related code to entry chunks
Object.keys(baseWebpackConfig.entry).forEach((name) => {
  baseWebpackConfig.entry[name] = [path.join(__dirname, 'dev-client')].concat(baseWebpackConfig.entry[name]);
});

module.exports = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap }),
  },

  // cheap-module-eval-source-map is faster for development
  devtool: '#cheap-module-eval-source-map',

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': "'development'",
    }),

    // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
    new webpack.HotModuleReplacementPlugin(),

    new webpack.NoEmitOnErrorsPlugin(),

    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.join(__dirname, '..', 'views', 'index.html'),
      inject: true,
    }),

    new FriendlyErrorsPlugin(),
  ],
});
