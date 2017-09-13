# AtlasUtils

## Logger

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


## Errors

    let errors = require('atlasutils/errors');
    throw new errors.ForbiddenError('You do not have access to this resource');

#### Error Classes

* `UserError` | `User` - sets status to 400
* `UnauthorizedError` | `Unauthorized` - sets status to 401
* `ForbiddenError` | `Forbidden` - sets status to 403 
* `NotFoundError` | `NotFound` - sets status to 404
* `ServerError` | `Server` - sets status to 500
* `DoneError` | `Done` - indicates whether the `.catch()` block should ignore this error. Useful when using `atlasutils/middleware`


## Middleware

    let app = express();
    let middleware = require('atlasutils/middleware');
    app.use(middleware);

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

