"use strict"

# Dependencies.
fs = require 'fs'
pathM = require 'path'
coffee = require 'coffee-script'
coffeeReact = require 'coffee-react'
less = require 'less'
reactTools = require 'react-tools'
etag = require 'etag'
helpers = require './helpers'
utils = require '../utilities'


# Sets up assets for development.
#
# @param {Object} options
# @param {String} options.root                   The application root. Assets are resolved relative to this path.
# @param {String} options.assetsBaseURI          Assets are served from this URI.
# @param {Array}  options.manifest.options.paths Assets are located in these directories.
# @param {Object} options.manifest.javascripts   A mapping of the JavaScript assets.
# @param {Object} options.manifest.stylesheets   A mapping of the stylesheet assets.
# @returns {Function}
exports = module.exports = (options) ->
  {manifest, root, assetsBaseURI} = options

  javascriptFiles = helpers.resolveGlobs(
    root,
    manifest.options.paths,
    'javascripts',
    manifest.javascripts
  )
  console.log(':', javascriptFiles)

  stylesheetFiles = helpers.resolveGlobs(
    root,
    manifest.options.paths,
    'stylesheets',
    manifest.stylesheets
  )

  # THe asset cache stores files that are ready to serve.
  assetCache = {}

  # The paths that the less parser searches for imports on.
  lessPaths = manifest.options.paths.map (path) ->
    pathM.join root, path, 'stylesheets'

  addJavascriptTag = addTagFactory(
    javascriptFiles, assetsBaseURI, 'script', 'src',
      type: 'text/javascript'
    , utils.html.OPENCLOSE
  )

  addStylesheetTag = addTagFactory(
    stylesheetFiles, assetsBaseURI, 'link', 'href',
      rel: 'stylesheet'
      type: 'text/css'
    , utils.html.AUTOCLOSE
  )

  getAppcacheAttr = -> ''

  assets = (req, res, next) ->
    res.locals.add_javascript_tag = addJavascriptTag
    res.locals.add_stylesheet_link = addStylesheetTag
    res.locals.appcache_attr = getAppcacheAttr
    next()

  assets.serveAssets = (req, res, next) ->
    {url} = req

    if utils.defined assetCache[url]
      return assetCache[url].serve(res)

    fs.readFile pathM.join(root, url), (err, data) ->
      contentTypeJS = 'application/javascript; charset=utf-8'
      contentTypeCSS = 'text/css; charset=utf-8'
      contentTypeMap = 'application/octet-stream'

      switch
        when err
          return next err
        when url.match /\.js$/
          assetCache[url] = new Asset(contentTypeJS, data)
        when url.match /\.coffee$/
          compiled = coffee.compile data.toString('utf-8'),
            sourceMap: true
            filename: url

          sourceMapUrl = url.replace /\.coffee$/, '.map'
          assetCache[sourceMapUrl] = new Asset(
            contentTypeMap,
            compiled.v3SourceMap
          )

          assetCache[url] = new Asset(contentTypeJS, compiled.js)
        when url.match /\.jsx$/
          transformed = reactTools.transform data.toString('utf-8'),
            sourceMap: true
            filename: url

          assetCache[url] = new Asset(contentTypeJS, transformed)
        when url.match /\.cjsx$/
          transformed = coffeeReact.transform data.toString('utf-8'),
            sourceMap: true
            filename: url

          compiled = coffee.compile transformed,
            sourceMap: true
            filename: url

          sourceMapUrl = url.replace /\.cjsx$/, '.map'
          assetCache[sourceMapUrl] = new Asset(
            contentTypeMap,
            compiled.v3SourceMap
          )

          assetCache[url] = new Asset(contentTypeJS, compiled.js)
        when url.match /\.css$/
          assetCache[url] = new Asset(contentType, data)
        when url.match /\.less$/
          lessParser = new less.Parser
            paths: lessPaths
            filename: url

          lessParser.parse data.toString('utf-8'), (err, tree) ->
            return next err if err
            css = tree.toCSS
              sourceMap: true

            assetCache[url] = new Asset(contentTypeCSS, css)
            return assetCache[url].serve(res);

          return
        when url.match /\.(gif|jpe?g|png)$/
          # Image assets.

          contentType =
            switch
              when url.match /\.gif$/ then 'image/gif'
              when url.match /\.jpe?g$/ then 'image/jpeg'
              when url.match /\.png$/ then 'image/png'
              else console.warn "Unknown content type for #{url}."

          assetCache[url] = new Asset(contentType, data)
        when url.match /\.(woff|eot|svg|ttf)$/
          # Font assets.

          contentType =
            switch
              when url.match /\.woff$/ then 'application/x-font-woff'
              when url.match /\.ttf$/ then 'application/octet-stream'
              when url.match /\.eot$/ then 'application/vnd.ms-fontobject'
              when url.match /\.svg$/ then 'image/svg+xml; charset=utf-8'
              else console.warn "Unknown content type for #{url}."

          assetCache[url] = new Asset(contentType, data)

      return assetCache[url].serve(res)

  return assets


class Asset

  constructor: (@contentType, @contents) ->
    @contentLength = contents.length
    @etag = etag(contents)

  serve: (res) ->
    res.set
      'Content-Type': @contentType
      'Content-Length': @contentLength
      'ETag': @etag
      'Cache-Control': 'no-cache, no-store, must-revalidate'
      'Pragma': 'no-cache'
      'Expires': '0'

    res.end @contents


# Generates a method to create a HTML tag.
#
# @param {Object}  files         An object describing all available assets.
# @param {String}  assetsBaseURI The base URI from where assets are served.
# @param {String}  tag           The HTML tag to use.
# @param {String}  srcAttr       Which attributes to use for the source (e.g. href="" or src="").
# @param {Object} [attributes]   Extra HTML attributes to use.
# @param {Number} [opts=0]       Which opts to use when generating the HTML.
# @returns {Function}
addTagFactory = (files, assetsBaseURI, tag, srcAttr, attributes, opts = 0) ->
  attributes ||= {}

  return (file, options) ->
    filePaths =
      if utils.defined files[file]
        files[file]
      else
        [file]
    out = []

    console.log filePaths, files, file

    filePaths.forEach (file) ->
      attrs = utils.copy options, attributes
      attrs[srcAttr] = "#{assetsBaseURI}/#{file}"
      out.push utils.html(tag, attrs, opts)

    return out.join '\n'
