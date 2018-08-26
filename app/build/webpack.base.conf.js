const path = require('path');
const utils = require('./utils');
const config = require('./config');
const friendlyFormatter = require('eslint-friendly-formatter');

const resolve = dir => path.join(__dirname, dir);

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  entry: {
    app: resolve('../src/main.js'),
  },

  output: {
    path: config.build.assetsRoot,
    filename: '[name].js',
    publicPath: isProduction
      ? config.build.assetsPublicPath
      : config.dev.assetsPublicPath,
  },

  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      vue$: 'vue/dist/vue.esm.js',
    },
  },

  module: {
    rules: [
      {
        test: /\.(js|vue)$/,
        loader: 'eslint-loader',
        enforce: 'pre',
        include: [resolve('..')],
        options: {
          formatter: friendlyFormatter,
        },
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: utils.cssLoaders({
            sourceMap: isProduction
              ? config.build.productionSourceMap
              : config.dev.cssSourceMap,
            extract: isProduction,
          }),
        },
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [resolve('../src')],
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('img/[name].[hash:7].[ext]'),
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('fonts/[name].[hash:7].[ext]'),
        },
      },
    ],
  },
};
