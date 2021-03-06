'use strict';

import * as errors from '../lib/errors';
import * as util from '../lib';

describe('Errors', () => {
  class MyDBError extends Error {}

  it(`shouldn't crash on configures`, () => {
    errors.configure();
    util.configureErrors();
  });

  it('should call custom normalize', () => {
    let normalize = jest.fn();
    errors.configure({
      normalize
    });
    let err = new Error();
    errors.normalizeError(err);
    expect(normalize).toHaveBeenCalled();
    expect(normalize.mock.calls[0][0]).toBe(err);
    expect(normalize.mock.calls[0][1].ServerError).toBeDefined();
  });

  it(`should return the error if instance of errors`, () => {
    expect(errors.normalizeError(new errors.User())).toBeInstanceOf(errors.UserError);
  });

  it(`should return an error based on status code`, () => {
    let error = {statusCode: 403, message: 'you shall not pass'};
    let norm = errors.normalizeError(error);

    expect(norm).toBeInstanceOf(errors.ForbiddenError);
    expect(norm.message).toBe('you shall not pass');
    expect(norm.status).toBe(403);
  });

  it(`should return a custom error if provided`, () => {
    let error = new MyDBError('heyo');
    let normalize = jest.fn((err) => new errors.NotFoundError(err.message));
    errors.configure({
      normalize
    });
    let norm = errors.normalizeError(error);
    expect(normalize).toHaveBeenCalled();
    expect(norm).toBeInstanceOf(errors.NotFoundError);
    expect(norm.message).toBe('heyo');
  });
})