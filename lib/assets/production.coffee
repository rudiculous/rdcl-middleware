"use strict"

# Dependencies.
path = require 'path'
utils = require '../utilities'

# Sets up assets for production.
#
# @param {Object} options
# @param {String} options.assetsBaseURI Assets are served from this URI.
# @param {Object} options.manifest      A mapping of all assets that can be served.
# @returns {Function}
exports = module.exports = (options) ->
  {manifest, assetsBaseURI} = options

  addJavascriptTag = addTagFactory(
    manifest, assetsBaseURI, 'javascripts', 'script', 'src',
      type: 'text/javascript'
    , utils.html.OPENCLOSE
  )

  addStylesheetTag = addTagFactory(
    manifest, assetsBaseURI, 'stylesheets', 'link', 'href',
      rel: 'stylesheet'
      type: 'text/css'
    , utils.html.AUTOCLOSE
  )

  # @todo HTML escaping?
  appcacheAttr = " manifest=\"#{assetsBaseURI}/manifest.appcache\" "
  getAppcacheAttr = () -> appcacheAttr

  assets = (req, res, next) ->
    res.locals.add_javascript_tag = addJavascriptTag
    res.locals.add_stylesheet_link = addStylesheetTag
    res.locals.appcache_attr = getAppcacheAttr
    next()

  assets.serveAssets = (req, res, next) ->
    next new Error('Refusing to serve assets in production mode.')

  return assets


# Generates a method to create a HTML tag.
#
# @param {Object}  manifest      An object describing all available assets.
# @param {String}  assetsBaseURI The path from where static files will be served.
# @param {String}  type          The asset type.
# @param {String}  tag           The HTML tag to use.
# @param {String}  srcAttr       Which attributes to use for the source (e.g. href="" or src="").
# @param {Object} [attributes]   Extra HTML attributes to use.
# @param {Number} [opts=0]       Which opts to use when generating the HTML.
# @returns {Function}
addTagFactory = (manifest, assetsBaseURI, type, tag, srcAttr, attributes, opts = 0) ->
  attributes ||= {}

  return (file, options) ->
    file = manifest[file] if utils.defined manifest[file]

    attrs = utils.copy options, attributes
    attrs[srcAttr] = "#{assetsBaseURI}/#{file}"
    return utils.html tag, attrs, opts
