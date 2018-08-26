require('./check-versions')();

const config = require('./config');
const path = require('path');
const express = require('express');
const webpack = require('webpack');
const webpackConfig = require('./webpack.dev.conf');

// default port where dev server listens for incoming traffic
const { port } = config.dev;

const app = express();
const compiler = webpack(webpackConfig);

const devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: false,
});

const hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: false,
  heartbeat: 2000,
});

// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', (compilation) => {
  compilation.plugin('html-webpack-plugin-after-emit', (data, cb) => {
    hotMiddleware.publish({ action: 'reload' });
    cb();
  });
});

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')());

// serve webpack bundle output
app.use(devMiddleware);

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware);

// serve pure static assets
const staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory);
app.use(staticPath, express.static(path.resolve('./app/static')));

const uri = `http://localhost:${port}`;

let resolveProm;
const readyPromise = new Promise((resolve) => {
  resolveProm = resolve;
});

console.log('> Starting dev server...');
devMiddleware.waitUntilValid(() => {
  console.log(`> Listening at ${uri}\n`);
  // when env
  resolveProm();
});

const server = app.listen(port);

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close();
  },
};
