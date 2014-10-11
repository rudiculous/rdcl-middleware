"use strict"

swig = require 'swig'
utils = require './utilities'

class TemplateLoader

  # @param {String} templateRoot The absolute path to the templates.
  constructor: (@templateRoot) ->
    @defaultLoader = swig.loaders.fs()

  # Resolves `to` to an absolute path or unique identifier.
  #
  # @param {String} to Non-absolute identifier or pathname to a file.
  # @param {String} from If given, should attempt to find the path in
  # relation to this given, known path.
  resolve: (to, from) ->
    if utils.startsWith to, @templateRoot
      # base path
      to
    else if utils.startsWith to, '/'
      # absolute path
      @templateRoot + to
    else
      # relative path
      @defaultLoader.resolve.apply(@defaultLoader, arguments)

  load: ->
    @defaultLoader.load.apply(@defaultLoader, arguments)

module.exports = TemplateLoader
