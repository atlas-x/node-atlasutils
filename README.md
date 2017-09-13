# AtlasUtils

### Logger

Basic Usage:  

    let logger = require('atlasutils').Logger(__filename);
    logger.log('test');
    // [2017-09-13T11:31:00.345Z] DEBUG (home/index.js) - test
    logger.error('oh no!');
    // [2017-09-13T11:31:00.534Z] ERROR (home/index.js) - oh no!

Require directly:

    let logger = require('atlasutils/logger')(__filename);

Configure:  
    // require('atlasutils/logger').configure({...});

    require('atlasutils').configureLogger({
      env: process.env.NODE_ENV || 'development',
      verbose: false,
      cwd: process.cwd(),
      transports: [{
        type: 'Console',
        properties: {
          level: 'debug',
          colorize: true,
        }
      }, {
        type: 'DailyRotateFile',
        properties: {
          name: 'applog',
          filename: './logs/applog.log',
          level: 'info',
        }
      }]
    });

