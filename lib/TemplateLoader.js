"use strict";

var swig = require('swig');
var utils = require('./utilities');

/** @class */
module.exports = utils.klass(swig.loaders.fs(), {

    /**
     * @constructor
     *
     * @param {String} templateRoot The absolute path to the templates.
     */
    'constructor': function TemplateLoader(templateRoot) {
        this.root = templateRoot;
    },

    /**
     * Resolves `to` to an absolute path or unique identifier.
     *
     * @param {String} to   Non-absolute identifier or pathname to a file.
     * @param {String} from If given, should attempt to find the to path in relation to this given, known path.
     */
    'resolve': function resolve(to, from) {
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
            return this.parent().resolve.apply(this.parent(), arguments);
        }
    },

});
