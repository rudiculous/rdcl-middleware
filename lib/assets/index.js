"use strict";

/**
 * Sets up assets.
 *
 * @param {Object} options
 * @param {String} options.environment Should be either `development` or `production`.
 */
module.exports = function setupAssets(options) {
    var environment = options.environment;
    if (environment === 'development') {
        return require('./development.js')(options);
    }
    else if (environment === 'production') {
        return require('./production.js')(options);
    }
    else {
        throw new Error('Invalid value for environment, should be one of `development` or `production`.');
    }
};
