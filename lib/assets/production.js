"use strict";

/** Dependencies. */
var path = require('path');

/**
 * Sets up assets for production.
 *
 * @param {Object} options
 * @param {String} options.assetsBaseURI Assets are served from this URI.
 * @param {Object} options.manifest      A mapping of all assets that can be served.
 * @returns {Function}
 */
module.exports = function setupProductionAssets(options) {
    var manifest = options.manifest;

    function assets(req, res, next) {
        /**
         * Create a script-tag.
         *
         * @function
         */
        res.locals.add_javascript_tag = addTagFactory(manifest, options.assetsBaseURI, 'javascripts', 'script', 'src', {
            'type': 'text/javascript',
        }, utils.html.OPENCLOSE);

        /**
         * Create a link rel="stylesheet" tag.
         *
         * @function
         */
        res.locals.add_stylesheet_link = addTagFactory(manifest, options.assetsBaseURI, 'stylesheets', 'link', 'href', {
            'rel': 'stylesheet',
            'type': 'text/css',
        }, utils.html.AUTOCLOSE);
    };

    assets.serveAssets = function(req, res, next) {
        next(new Error('Refusing to serve assets in production mode.'));
    };

    return assets;
};

/**
 * Generates a method to create a HTML tag.
 *
 * @param {Object}  manifest      An object describing all available assets.
 * @param {String}  assetsBaseURI The path from where static files will be served.
 * @param {String}  type          The asset type.
 * @param {String}  tag           The HTML tag to use.
 * @param {String}  srcAttr       Which attributes to use for the source (e.g. href="" or src="").
 * @param {Object} [attributes]   Extra HTML attributes to use.
 * @param {Number} [opts=0]       Which opts to use when generating the HTML.
 * @returns {Function}
 */
function addTagFactory(manifest, assetsBaseURI, type, tag, srcAttr, attributes, opts) {
    attributes = attributes || {};
    opts = opts || 0;

    /**
     * Create a HTML tag.
     *
     * @param {String} file      The file to link to.
     * @param {Object} [options] Extra HTML attributes to use.
     * @returns {String}
     */
    return function add_tag(file, options) {
        if (utils.defined(manifest[file])) {
            file = manifest[file];
        }

        var attrs = utils.copy(options, attributes);
        attrs[srcAttr] = path.join(assetsBaseURI, 'assets', file);
        return utils.html(tag, attrs, opts);
    }
}
