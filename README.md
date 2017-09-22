# AtlasUtils

* [Logger](#logger)  
* [Errors](#errors)  
* [Slack](#slack)
* [Middleware](#middleware)


#### Example minimal usage:  

    let app = express();
    let atlas = require('atlasutils');
    
    atlas.configureSlack({token: 'xxxxx'});
    atlas.configureMiddleware({ logger: atlas.Logger });
    
    app.use(atlas.middleware);
    
      

#### Example full usage:

    let app = express();
    let atlas = require('atlasutils');
    atlas.configureSlack({token: 'xxxxxxxx'});

    atlas.configureLogger({
      env: 'production',
      transports: [{
        type: 'AtlasSlack',
        properties: {
          level: 'warn',
          token: 'xxxxx',
          channel: 'random',
        }
      }, {
        type: 'DailyRotateFile',
        properties: {
          name: 'applog',
          filename: './logs/applog.log',
          level: 'info'
        }
      }, {
        type: 'DailyRotateFile',
        properties: {
          name: 'apperror',
          filename: './logs/apperror.log',
          level: 'warn'
        }
      }],
    });

    atlas.configureErrors({
      normalize: function(error, Errors) {
        if (error instanceof DB.MySQLNotFound) {
          return new Errors.NotFound(error.message);
        }
      }
    });

    atlas.configureMiddleware({
      log: ['serverError'],
      logger: atlas.Logger,
      getUser: function(req) {
        return req.user ? req.user.username : 'Unauthorized';
      }
    });

    app.use(utils.middleware);

    app.use('/', (req, res) => {
      return DB.query('DELETE FROM users WHERE id = 5')
        .then(dbresult => {
          require('atlasutils/slack').slack.send('general', 'omg someone deleted our data');
          res.deleted();
        })
        .catch(res.handleError); // logs error and slack
    });



## <a href="logger"></a>Logger

A logger to format output nicely, uses [winston](https://github.com/winstonjs/winston/blob/master/docs/transports.md) transports, and can log to a customized [slack](#slack) if necessary.  

e.g. 
```
$> logger.error(new Error('hi'))`  
[2017-09-14T02:09:44.814Z] ERROR (test.js) - { message: 'hi', errno: undefined, code: undefined } stack:
Error: hi
    at Object.<anonymous> (C:\code\atlas\atlasutils\test.js:3:14)
    at Module._compile (module.js:571:32)
```

#### Basic Usage:  

JS:

    let logger = require('atlasutils/logger);
    logger.debug('test);
    // [2017-09-13T11:31:00.345Z] DEBUG - test
    logger = require('atlasutils/logger)(__filename);
    // [2017-09-13T11:31:00.345Z] DEBUG (home/index.js) - test
    logger = new require('atlasutils').Logger(__filename);
    // [2017-09-13T11:31:00.345Z] DEBUG (home/index.js) - test

TypeScript:

    import {Logger} from 'atlasutils';
    Logger.debug('test);
    // [2017-09-13T11:31:00.345Z] DEBUG - test
    logger = new Logger(__filename);
    logger.debug('test');
    // [2017-09-13T11:31:00.345Z] DEBUG (home/index.js) - test


#### Methods:

* `logger.log(<any>)` | `logger.debug(<any>)`: level `debug`
* `logger.info(<any>)`: level `info`
* `logger.warn(<any>)`: level `warn`
* `logger.error(<any>)`: level `error`

#### Filename prefix:

    let logger = new Logger(__filename);
    logger.error('test');
    // [2017-09-13T11:31:00.345Z] ERROR (home/index.js) - test


#### Requiring:

##### JS

Require directly for no prefix logger:

    let logger = require('atlasutils/logger');

Pass in a filename to prefix logs with what file is logging:

    let logger = require('atlasutils/logger')(__filename);

Or create a new instance from the main library:

    let logger = new require('atlasutils').Logger(__filename);

##### TypeScript

Import logger and use right away

    import {Logger} from 'atlasutils';
    Logger.debug();

Create a new instance prefixed by string

    import {Logger} from 'atlasutils';
    let logger = new Logger(__filename);

Or require module as a whole:

    import * as Logger from 'atlasutils';


#### Configure:  

    // require('atlasutils/logger').configure({...});
    // import {configure} from 'atlasutils/logger';

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

* `config.env` default `process.env.NODE_ENV || 'development' - environment to prepend to log lines
* `config.verbose` default `false` - whether to print logs during testing
* `config.cwd` default `process.cwd()` - trims cwd from filenames, so `'(C:\Users\Test\server.js)'` just becomes `'(server.js)'`
* `config.transports` Array of `transport` types
  * `transport.type` - default `Console` - any of Winston transport types, including `DailyRotateFile`
  * `transport.properties` - any Winston transport properties. 

### AtlasSlack transport

Bundled with the Logger is a transport that will use [Slack](#slack) called `AtlasSlack`.  Slack must be configured in order for this transport to work.  The options for this transport should look like:

    {
      type: 'AtlasSlack',
      properties: {
        level: 'warn',
        channel: 'random',
        token: 'xxxx',
        env: process.env.NODE_ENV
      }
    }


## <a href="errors"></a>Errors

Useful error classes, also function to help normalize errors into one of those errors (in order to use the [middleware](#middleware)). 

e.g. 
```
return somepromise()
  .then(() => {
    throw new errors.Done();
  })
  .catch(e => {
    if (e instanceof errors.Done) { return; }
    throw e;
  });
```

#### Error Classes

* `UserError` | `User` - sets status to `400`
* `UnauthorizedError` | `Unauthorized` - sets status to `401`
* `ForbiddenError` | `Forbidden` - sets status to `403` 
* `NotFoundError` | `NotFound` - sets status to `404`
* `ServerError` | `Server` - sets status to `500`
* `DoneError` | `Done` - indicates whether the `.catch()` block should ignore this error. Useful when using `atlasutils/middleware`


#### Utility  

* `errors.normalizeError(error)` will take in an error object/class and attempt to normalize it to one of the exported errors.  This is used internally in `atlasutils/middleware` to determine the response type to send.  This can be customized by the `config.normalize` function to provide additional functionality. 

#### Configure  

    // require('atlasutils/errors').configure({...});
    require('atlasutils').configureErrors({
      normalize: function(error, Errors) {
        if (error instanceof MyDB.DBNotFound) {
          return new Errors.NotFound(error);
        }
      }
    });

* `config.normalize` should be a function that takes in two arguments:
  * `error` the error being caught. Inspect however you see fit  
  * `Errors` the exported Error classes to be returned.  
  and returns an instance of `Errors.<Error>`


## <a href="slack"></a>Slack

Class to send slack messages to a specific channel.  This can be used inside the [Logger](#logger) to log errors to slack. 

e.g.
```
let slack = require('atlasutils/slack');
slack.configure(...); // required
slack.slack.send('general', 'hi guys!');
```

#### Configure

Slack must be configured with an API token. 

    // require('atlasutils/slack').configure(...);
    require('atlasutils').configureSlack({
      enabled: true,
      token: '' // api token
    });

#### Methods

* `slack.send(room, message)` - returns a Promise and will send a message to the provided room (assuming the room exists, and your api token user has been invited to that room)

* `slack.tagUser(username)` - will attempt to find the user by username or last name, and wrap it in tag syntax that the bot can recognize.  
  `console.log(slack.tagUser('jon')); // <@jon>`



## <a href="middleware"></a>Middleware

General useful middleware functions to send responses, and also to handle any thrown errors

    let app = express();
    let middleware = require('atlasutils/middleware');
    app.use(middleware);
    app.use('/', (req, res) => {
      res.forbidden('oh noes!');
    });

#### Added methods

* `res.handleError(error)` - will extract the relevant error and send a response with the correct status code.  If the error is of type `errors.DoneError`, it will not do anything. 
* `res.expectsJSON()` - `true|false` if detected XHR headers
* `res.userError(message)`  
  `res.userError(status, message)`  
  `res.userError(status, message, data)`  
  `res.userError({status, message, data})` - sends a `400` response
* `res.unauthorized(...)` - sends a `401` response
* `res.forbidden(...)` - sends a `403` response
* `res.notFound(...)` - sends a `404` response
* `res.serverError(...)` - sends a `500` response  
* `res.created(obj)` - sends a `201` JSON response
* `res.deleted(obj)` - sends a `204` JSON response  


#### Configure  

    // require('atlasutils/middleware').configure({...})
    require('atlasutils').configureMiddleware({
      log: ['serverError'],
      logger: console
    });

or to enable logging with the atlasutils logger  

    require('atlasutils/middleware').configure({
      logger: require('atlasutils/logger')
    });



