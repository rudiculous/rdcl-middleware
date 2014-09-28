"use strict";


/** Dependencies. */
var fs = require('fs');
var pathM = require('path');
var utils = require('../utilities');


/**
 * Resolves an asset-relative path to an absolute path.
 *
 * @param {String}    root     The application root.
 * @param {Array}     paths    An array containing asset paths.
 * @param {String}    path     The asset-relative path.
 * @param {Function}  callback Called when finished.
 * @param {Number}   [index=0] Start at this asset path.
 */
module.exports.resolve = function resolve(root, paths, path, callback, index) {
    var fullpath;

    index = index || 0;
    if (index >= paths.length) {
        return callback(false);
    }

    fullpath = pathM.join(root, paths[index], path);

    fs.exists(fullpath, function(exists) {
        if (exists) {
            callback(true, fullpath);
        }
        else {
            resolve(root, paths, path, callback, index + 1);
        }
    });
};
