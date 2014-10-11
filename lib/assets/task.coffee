"use strict"

# Dependencies.
crypto          = require 'crypto'
pathM           = require 'path'
{EventEmitter}  = require 'events'
fs              = require 'fs'
coffee          = require 'coffee-script'
coffeeReact     = require 'coffee-react'
less            = require 'less'
reactTools      = require 'react-tools'
uglifyjs        = require 'uglify-js'
helpers         = require './helpers'
utils           = require '../utilities'

# Registers a task that compiles assets.
#
# @todo Use `Q.all`.
#
# @param {Grunt}  grunt
# @param {Object} options.manifest   An object describing the available assets.
# @param {String} options.root       Assets are resolved relative to this dir.
# @param {String} options.assetsDir  Assets are written to this directory.
# @param {String} options.staticBase Assets will be served from this location (used for appcache).
exports = module.exports = (grunt, options) ->
  # @task uglify
  grunt.task.registerTask 'assets', 'Compiles assets.', ->
    javascriptFiles = helpers.resolveGlobs(
      options.root,
      options.manifest.options.paths,
      'javascripts',
      options.manifest.javascripts
    )

    stylesheetFiles = helpers.resolveGlobs(
      options.root,
      options.manifest.options.paths,
      'stylesheets',
      options.manifest.stylesheets
    )

    done = this.async()

    emitter = new EventEmitter()
    components = {}

    Object.keys(javascriptFiles).forEach (name) -> components[name] = null
    Object.keys(stylesheetFiles).forEach (name) -> components[name] = null

    emitter.on 'component:updated', (event) ->
      componentUpdated event, done, components, options

    unless fs.existsSync options.assetsDir
      fs.mkdirSync options.assetsDir

    Object.keys(javascriptFiles).forEach (name) ->
      files = utils.copy javascriptFiles[name]
      if files.length
        processJavascript name, files, emitter, options
      else
        writeAsset '', name, emitter, options

    Object.keys(stylesheetFiles).forEach (name) ->
      files = utils.copy stylesheetFiles[name]
      if files.length
        processStylesheet name, files, emitter, options
      else
        writeAsset '', name, emitter, options


# Processes the component:updated event.
#
# @param {Event}    event      The event that was received.
# @param {Function} done       The callback to call when everything is done.
# @param {Object}   components A map containing the components that need updates.
# @param {Object}   options    The options object.
componentUpdated = (event, done, components, options) ->
  if event.success
    console.log 'Written file %s.', event.success
  else
    # Die on the first error.

    if utils.defined event.message
      if event.message instanceOf Error
        return done event.message
      else
        return done new Error(event.message)
    else
      return done false

  components[event.name] = event.success
  $break = new Error('break')

  try
    status = Object.keys(components).map((val) ->
      components[val]
    ).reduce((prev, cur) ->
      throw $break unless cur
      return prev && cur
    )
  catch err
    throw err if err isnt $break

  if status
    staticManifest = JSON.stringify components
    fileName = pathM.join options.assetsDir, 'manifest.json'
    appcache = pathM.join options.assetsDir, 'manifest.appcache'

    if options.staticBase
      appcacheData = 'CACHE MANIFEST\n'

      Object.keys(components).forEach (key) ->
        file = components[key]
        appcacheData += "#{options.staticBase}/#{file}\n"

      fs.truncateSync appcache if fs.existsSync appcache

    fs.truncateSync fileName if fs.existsSync appcache

    fs.appendFile fileName, staticManifest, (err) ->
      if err
        console.error err
        return done err

      console.log 'Written file manifest.json.'

      if appcacheData
        fs.appendFile appcache, appcacheData, (err) ->
          if err
            console.error err
            return done err

          console.log 'Written file manifest.appcache.'
          return done()
      else
        return done()


# Processes a javascript.
#
# @todo What to do with vendor scripts that already have a minified version?
# @todo Is it safe to minify JSX files?
#
# @param {String}       name    The name of the javascript to process.
# @param {Array}        files   A list of files associated with this asset.
# @param {EventEmitter} emitter An event will be emitted when done.
# @param {Object}       options The options object.
processJavascript = (name, files, emitter, options) ->
  utils.asyncMap files, (file, next) ->
    fs.readFile file, 'utf-8', (err, data) ->
      switch
        when err
          console.error err
          emitter.emit 'component:updated',
            name: name
            success: false
            message: err
        when file.match /\.jsx$/
          next reactTools.transform(data)
        when file.match /\.cjsx$/
          next coffee.compile(coffeeReact.transform(data))
        when file.match /\.coffee$/
          next coffee.compile(data)
        else
          next data
  , (files) ->
    result = uglifyjs.minify(files,
      #warnings: true
      fromString: true
    ).code

    writeAsset result, name, emitter, options


# Processes a stylesheet.
#
# @param {String}       name    The name of the stylesheet to process.
# @param {Array}        files   A list of files associated with this asset.
# @param {EventEmitter} emitter An event will be emitted when done.
# @param {Object}       options The options object.
processStylesheet = (name, files, emitter, options) ->
  parser = new less.Parser
    paths: options.manifest.options.paths.map (path) ->
      pathM.join options.root, path, 'stylesheets'
    filename: name

  utils.asyncMap files, (file, next) ->
    fs.readFile file, 'utf-8', (err, data) ->
      switch
        when err
          console.error err
          emitter.emit 'component:updated',
            name: name
            success: false
            message: err
        when file.match /\.less$/
          parser.parse data, (err, tree) ->
            if err
              console.error err
              emitter.emit 'component:updated',
                name: name
                success: false
                message: err
            else
              val = tree.toCSS
                compress: true
              next val
        else
          next data
  , (files) ->
    result = files.reduce (prev, cur) -> prev + '\n' + cur
    writeAsset result, name, emitter, options


# Writes an asset to the filesystem.
#
# @param {String}       content The contents to be written.
# @param {String}       name    The name of the file.
# @param {EventEmitter} emitter An event will be emitted when done.
# @param {Object}       options The options object.
writeAsset = (content, name, emitter, options) ->
  shasum = crypto.createHash('sha1')
  shasum.update content
  digest = shasum.digest 'hex'
  filename = "#{digest}-#{name}"
  filepath = pathM.join options.assetsDir, filename

  fs.truncateSync filepath if fs.existsSync filepath

  fs.appendFile filepath, content, (err) ->
    if err
      console.error err
      emitter.emit 'component:updated',
        name: name
        success: false
        message: err
    else
      emitter.emit 'component:updated',
        name: name
        success: filename
