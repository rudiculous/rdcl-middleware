"use strict"

# Dependencies.
fs = require 'fs'
glob = require 'glob'
pathM = require 'path'
utils = require '../utilities'


# Resolves all globs (synchronously).
#
# Since this method runs synchronously, it should only be called *once*
# during initialization. It should *never* run during requests!
#
# @param {String} root  The globs are resolved relative to this path.
# @param {Array}  paths These paths are prepended to each file.
# @param {String} type  The asset type, which is prepended to each file.
# @param {Object} files All asset files.
# @returns {Object}
exports.resolveGlobs = (root, paths, type, files) ->
  result = {}
  inResolved = {}

  for file, assets of files
    resolved = []
    assets.forEach (asset) ->
      paths.forEach (path) ->
        fullpath = pathM.join path, type, asset
        glob.sync(fullpath,
          cwd: root
          root: root
        ).forEach (res) ->
          unless inResolved[res]
            resolved.push res
            inResolved[res] = true

    result[file] = resolved
    inResolved = {}

  return result
