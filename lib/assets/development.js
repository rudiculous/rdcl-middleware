"use strict";

/** Dependencies. */
var fs = require('fs');
var pathM = require('path');
var less = require('less');
var reactTools = require('react-tools');
var etag = require('etag');
var helpers = require('./helpers');
var utils = require('../utilities');


/**
 * Sets up assets for development.
 *
 * @param {Object} options
 * @param {String} options.root                   The application root. Assets are resolved relative to this path.
 * @param {String} options.assetsBaseURI          Assets are served from this URI.
 * @param {Array}  options.manifest.options.paths Assets are located in these directories.
 * @param {Object} options.manifest.javascripts   A mapping of the JavaScript assets.
 * @param {Object} options.manifest.stylesheets   A mapping of the stylesheet assets.
 * @returns {Function}
 */
module.exports = function setupDevelopmentAssets(options) {
    var manifest = options.manifest;

    var javascriptFiles = helpers.resolveGlobs(
        options.root,
        options.manifest.options.paths,
        'javascripts',
        options.manifest.javascripts
    );

    var stylesheetFiles = helpers.resolveGlobs(
        options.root,
        options.manifest.options.paths,
        'stylesheets',
        options.manifest.stylesheets
    );

    /** The asset cache stores files that are ready to serve. */
    var assetCache = {};

    /** The paths that the less parser search for imports on. */
    var lessPaths = manifest.options.paths.map(function(path) {
        return pathM.join(options.root, path, 'stylesheets');
    });

    var addJavascriptTag = addTagFactory(javascriptFiles, options.assetsBaseURI, 'script', 'src', {
        'type': 'text/javascript',
    }, utils.html.OPENCLOSE);

    var addStylesheetTag = addTagFactory(stylesheetFiles, options.assetsBaseURI, 'link', 'href', {
        'rel': 'stylesheet',
        'type': 'text/css',
    }, utils.html.AUTOCLOSE);

    function assets(req, res, next) {
        res.locals.add_javascript_tag = addJavascriptTag;
        res.locals.add_stylesheet_link = addStylesheetTag;
        next();
    };

    assets.serveAssets = function serveAssets(req, res, next) {
        var url = req.url;

        if (utils.defined(assetCache[url])) {
            return assetCache[url].serve(res);
        }

        fs.readFile(pathM.join(options.root, url), 'utf8', function(err, data) {
            var contentType = 'text/plain; charset=utf-8';

            if (err) {
                return next(err);
            }

            if (url.match(/\.js$/)) {
                contentType = 'application/javascript; charset=utf-8';

                assetCache[url] = new Asset(contentType, data);
                return assetCache[url].serve(res);
            }
            else if (url.match(/\.jsx$/)) {
                contentType = 'application/javascript; charset=utf-8';

                var transformed = reactTools.transform(data, {
                    'sourceMap': true,
                    'filename': url,
                });

                assetCache[url] = new Asset(contentType, transformed);
                return assetCache[url].serve(res);
            }
            else if (url.match(/\.css$/)) {
                contentType = 'text/css; charset=utf-8';

                assetCache[url] = new Asset(contentType, data);
                return assetCache[url].serve(res);
            }
            else if (url.match(/\.less$/)) {
                contentType = 'text/css; charset=utf-8';

                var lessParser = new less.Parser({
                    'paths': lessPaths,
                    'filename': url,
                });

                lessParser.parse(data, function(err, tree) {
                    if (err) {
                        return next(err);
                    }

                    var css = tree.toCSS({
                        'sourceMap': true
                    });

                    assetCache[url] = new Asset(contentType, css);
                    return assetCache[url].serve(res);
                });
                return;
            }
        });
    };

    return assets;
};


/**
 * @class
 * @param {String} contentType The value for the Content-Type header.
 * @param {String} contents    The data to serve.
 */
function Asset(contentType, contents) {
    /** @const icontentType */
    Object.defineProperty(this, 'contentType', {
        'value': contentType,
        'writable': false,
    });

    /** @const contents */
    Object.defineProperty(this, 'contents', {
        'value': contents,
        'writable': false,
    });

    /** @const contentLength*/
    Object.defineProperty(this, 'contentLength', {
        'value': contents.length,
        'writable': false,
    });

    /** @const etag */
    Object.defineProperty(this, 'etag', {
        'value': etag(contents),
        'writable': false,
    });
}

Asset.prototype = {
    /**
     * Serves the asset.
     *
     * @public
     * @param {Response} res
     */
    'serve': function serve(res) {
        res.set({
            'Content-Type': this.contentType,
            'Content-Length': this.contentLength,
            'ETag': this.etag,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
        });

        res.end(this.contents);
    }
};

/**
 * Generates a method to create a HTML tag.
 *
 * @param {Object}  files         An object describing all available assets.
 * @param {String}  assetsBaseURI The base URI from where assets are served.
 * @param {String}  tag           The HTML tag to use.
 * @param {String}  srcAttr       Which attributes to use for the source (e.g. href="" or src="").
 * @param {Object} [attributes]   Extra HTML attributes to use.
 * @param {Number} [opts=0]       Which opts to use when generating the HTML.
 * @returns {Function}
 */
function addTagFactory(files, assetsBaseURI, tag, srcAttr, attributes, opts) {
    attributes = attributes || {};
    opts = opts || 0;

    /**
     * Create a HTML tag.
     *
     * @param {String}  file     The file to link to.
     * @param {Object} [options] Extra HTML attributes to use.
     * @returns {String}
     */
    return function add_tag(file, options) {
        var filePaths = utils.defined(files[file])
            ? files[file]
            : [file];
        var out = [];

        filePaths.forEach(function(file) {
            var attrs = utils.copy(options, attributes);
            attrs[srcAttr] = assetsBaseURI + '/' + file; // TODO: Use something like pathM.join...
            
            out.push(utils.html(tag, attrs, opts));
        });

        return out.join('\n');
    }
}
