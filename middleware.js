// used for `require('atlasutils/logger')` - source in ./src
let mw = require('./dist/middleware');

let exportFunc = mw.middleware;
exportFunc.configure = mw.configure;
exportFunc.logRequests = mw.logRequests;


module.exports = exportFunc;