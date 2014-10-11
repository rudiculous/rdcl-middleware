"use strict"

# Sets up assets.
#
# @param {Object} options
# @param {String} options.environment   Should be either `development` or `production`.
# @param {String} options.root          The application root. Assets are resolved relative to this path.
# @param {String} options.assetsBaseURI Assets are served from this URI.
# @param {Object} options.manifest      An object describing the assets. Format depends on whether you are running in development or production mode.
# @returns {Function}
exports = module.exports = (options) ->
  {environment} = options

  if environment is 'development'
    return require('./development')(options)
  else if environment is 'production'
    return require('./production')(options)
  else
    throw new Error 'Invalid value for environment, should be one of `development` or `production`.'

exports.task = require './task'
