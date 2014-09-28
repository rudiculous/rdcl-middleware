"use strict";

var swig = require('swig');
var utils = require('./utilities');

/**
 * @class
 *
 * @augments swig.loaders.fs
 *
 * @param {String} templateRoot An absolute path to the templates.
 */
function TemplateLoader(templateRoot) {
    this.__proto__.__proto__ = swig.loaders.fs();
    this.root = templateRoot;
}

TemplateLoader.prototype = {

    /**
     * Resolves `to` to an absolute path or unique identifier.
     *
     * @param {String} to   Non-absolute identifier or pathname to a file.
     * @param {String} from If given, should attempt to find the to path in relation to this given, known path.
     */
    'resolve': function resolve(to, from) {
        var parent = this.__proto__;

        if (utils.startsWith(to, this.root)) {
            // base path
            return to;
        }
        else if (utils.startsWith(to, '/')) {
            // absolute path
            return this.root + to;
        }
        else {
            // relative path
            return parent.resolve.apply(this.fs, arguments);
        }
    },

};

module.exports = TemplateLoader;
