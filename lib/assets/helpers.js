"use strict";


/** Dependencies. */
var fs = require('fs');
var glob = require('glob');
var pathM = require('path');
var utils = require('../utilities');


/**
 * Resolves all globs (synchronously).
 *
 * Since this method runs synchronously, it should only be called *once*
 * during initialization. It should *never* run during requests!
 *
 * @param {String} root  The globs are resolved relative to this path.
 * @param {Array}  paths These paths are prepended to each file.
 * @param {String} type  The asset type, which is prepended to each file.
 * @param {Object} files All asset files.
 * @returns {Object}
 */
module.exports.resolveGlobs = function resolveGlobs(root, paths, type, files) {
    var file, assets, resolved, fullPath,
        result = {};

    for (file in files) {
        resolved = [];
        assets = files[file];

        assets.forEach(function(asset) {
            paths.forEach(function(path) {
                fullPath = pathM.join(path, type, asset);
                glob.sync(fullPath, {
                    'cwd': root,
                    'root': root,
                }).forEach(function(res) {
                    resolved.push(res);
                });
            });
        });

        /** @todo Remove duplicates from `resolved`. */

        result[file] = resolved;
    }

    return result;
}
