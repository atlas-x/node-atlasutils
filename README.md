# AtlasUtils

* [Logger](#logger)  
* [Errors](#errors)  
* [Slack](#slack)
* [Middleware](#middleware)


#### Example minimal usage:  

    let app = express();
    let utils = require('atlasutils');
    
    utils.configureSlack({token: 'xxxxx'});
    utils.configureLogger({
      slack: utils.Slack,
      channel: 'errors'
    });
    utils.configureMiddleware({ logger: utils.Logger });
    
    app.use(utils.Middleware);
    
      

#### Example full usage:

    let app = express();
    let utils = require('atlasutils');
    utils.configureSlack({token: 'xxxxxxxx'});

    utils.configureLogger({
      env: 'production',
      transports: [{
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
      slack: {
        instance: utils.Slack,
        channel: 'errors'
      }
    });

    utils.configureErrors({
      normalize: function(error, Errors) {
        if (error instanceof DB.MySQLNotFound) {
          return new Errors.NotFound(error.message);
        }
      }
    });

    utils.configureMiddleware({
      log: ['serverError'],
      logger: utils.Logger,
      getUser: function(req) {
        return req.user ? req.user.username : 'Unauthorized';
      }
    });

    app.use(utils.Middleware);

    app.use('/', (req, res) => {
      return DB.query('DELETE FROM users WHERE id = 5')
        .then(dbresult => {
          require('atlasutils/slack').send('general', 'omg someone deleted our data');
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

    let logger = require('atlasutils').Logger(__filename);
    logger.log('test');
    // [2017-09-13T11:31:00.345Z] DEBUG (home/index.js) - test
    logger.error('oh no!');
    // [2017-09-13T11:31:00.534Z] ERROR (home/index.js) - oh no!

#### Methods:

* `logger.log(<any>)` | `logger.debug(<any>)`: level `debug`
* `logger.info(<any>)`: level `info`
* `logger.warn(<any>)`: level `warn`
* `logger.error(<any>)`: level `error`

#### Require directly:

    let logger = require('atlasutils/logger')(__filename);

#### Configure:  

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

* `config.env` default `process.env.NODE_ENV || 'development' - environment to prepend to log lines
* `config.verbose` default `false` - whether to print logs during testing
* `config.cwd` default `process.cwd()` - trims cwd from filenames, so `'(C:\Users\Test\server.js)'` just becomes `'(server.js)'`
* `config.transports` Array of `transport` types
  * `transport.type` - default `Console` - any of Winston transport types, including `DailyRotateFile`
  * `transport.properties` - any Winston transport properties. 
* `config.slack` 
  * `slack.instance` default `null` - An instance of `atlasutils/slack`, if logging should be sent to slack as well
  * `slack.levels` default `['error', 'warn']` - Array of levels to log to slack
  * `slack.channel` default `'general'` - Channel to log errors to. 



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
slack.send('general', 'hi guys!');
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



