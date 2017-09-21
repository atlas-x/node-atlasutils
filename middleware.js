// used for `require('atlasutils/logger')` - source in ./src
let mw = require('./dist/middleware');

let exportFunc = mw.middleware;
exportFunc.configure = mw.configure;

module.exports = exportFunc;