"use strict";

/**
 * Dependencies.
 */
var crypto = require('crypto');
var pathM = require('path');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var less = require('less');
var reactTools = require('react-tools');
var uglifyjs = require('uglify-js');
var helpers = require('./helpers');
var utils = require('../utilities');


/**
 * Registers a task that compiles assets.
 *
 * @todo Use `Q.all`.
 *
 * @param {Grunt}  grunt
 * @param {Object} options.manifest  An object describing the available assets.
 * @param {String} options.root      Assets are resolved relative to this dir.
 * @param {String} options.assetsDir Assets are written to this directory.
 */
module.exports = function(grunt, options) {
    /**
     * @task uglify
     */
    grunt.task.registerTask('assets', 'Compiles assets.',
        function() {
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

            var done = this.async();

            var emitter = new EventEmitter();
            var components = {};

            Object.keys(javascriptFiles).forEach(function(name) {
                components[name] = null;
            });
            Object.keys(stylesheetFiles).forEach(function(name) {
                components[name] = null;
            });

            emitter.on('component:updated', function(event) {
                componentUpdated(event, done, components, options);
            });

            if (!fs.existsSync(options.assetsDir)) {
                fs.mkdirSync(options.assetsDir);
            }

            Object.keys(javascriptFiles).forEach(function(name) {
                var files = utils.copy(javascriptFiles[name]);
                if (files.length) {
                    processJavascript(name, files, emitter, options);
                }
                else {
                    writeAsset('', name, emitter, options);
                }
            });

            Object.keys(stylesheetFiles).forEach(function(name) {
                var files = utils.copy(stylesheetFiles[name]);
                if (files.length) {
                    processStylesheet(name, files, emitter, options);
                }
                else {
                    writeAsset('', name, emitter, options);
                }
            });
        });
};



/**
 * Processes the component:updated event.
 *
 * @param {Event}    event      The event that was received.
 * @param {Function} done       The callback to call when everything is done.
 * @param {Object}   components A map containing the components that need updates.
 * @param {Object}   options    The options object.
 */
function componentUpdated(event, done, components, options) {
    if (!event.success) {
        // Die on the first error.
        
        if (utils.defined(event.message)) {
            if (event.message instanceof Error) {
                done(event.message);
            }
            else {
                done(new Error(event.message));
            }
        }
        else {
            done(false);
        }
    }
    else {
        console.log('Written file %s.', event.success);
    }
    
    components[event.name] = event.success;
    
    var $break = new Error('break');
    var status;
    
    try {
        status = Object.keys(components).map(function(val) {
            return components[val];
        }).reduce(function(prev, cur) {
            if (!cur) {
                throw $break;
            }
            return prev && cur;
        });
    }
    catch(err) {
        if (err !== $break) throw err;
    }
    
    if (status) {
        var staticManifest = JSON.stringify(components);
        var fileName = pathM.join(options.assetsDir, 'manifest.json');
    
        if (fs.existsSync(fileName)) {
            fs.truncateSync(fileName);
        }
    
        fs.appendFile(fileName, staticManifest, function(err) {
            if (err) {
                console.error(err);
                done(err);
            }
            else {
                done();
            }
        });
    }
}

/**
 * Processes a javascript.
 *
 * @todo What to do with vendor scripts that already have a minified version?
 * @todo Is it safe to minify JSX files?
 *
 * @param {String}       name    The name of the javascript to process.
 * @param {Array}        files   A list of files associated with this asset.
 * @param {EventEmitter} emitter An event will be emitted when done.
 * @param {Object}       options The options object.
 */
function processJavascript(name, files, emitter, options) {
    utils.asyncMap(files, function mapMethod(file, next) {
        fs.readFile(file, 'utf-8', function(err, data) {
            if (err) {
                console.error(err);
                emitter.emit('component:updated', {
                    'name': name,
                    'success': false,
                    'message': err
                });
            }
            else if (file.match(/\.jsx$/)) {
                next(reactTools.transform(data));
            }
            else {
                next(data);
            }
        });
    }, function mapCallback(files) {
        var result = uglifyjs.minify(files, {
            //'warnings': true,
            'fromString': true,
        }).code;

        writeAsset(result, name, emitter, options);
    });
}

/**
 * Processes a stylesheet.
 *
 * @param {String}       name    The name of the stylesheet to process.
 * @param {Array}        files   A list of files associated with this asset.
 * @param {EventEmitter} emitter An event will be emitted when done.
 * @param {Object}       options The options object.
 */
function processStylesheet(name, files, emitter, options) {
    var parser = new less.Parser({
        'paths': options.manifest.options.paths.map(function(path) {
            return pathM.join(options.root, path, 'stylesheets');
        }),
        'filename': name,
    });
    
    utils.asyncMap(files, function mapMethod(file, next) {
        fs.readFile(file, 'utf-8', function(err, data) {
            if (err) {
                console.error(err);
                emitter.emit('component:updated', {
                    'name': name,
                    'success': false,
                    'message': err
                });
            }
            else if (file.match(/\.less$/)) {
                parser.parse(data, function(err, tree) {
                    if (err) {
                        console.error(err);
                        emitter.emit('component:updated', {
                            'name': name,
                            'success': false,
                            'message': err
                        });
                    }
                    else {
                        var val = tree.toCSS({
                            'compress': true
                        });
                        next(val);
                    }
                });
            }
            else {
                next(data);
            }
        });
    }, function mapCallback(files) {
        var result = files.reduce(function(prev, cur) {
            return prev + '\n' + cur;
        });

        writeAsset(result, name, emitter, options);
    });
}

/**
 * Writes an asset to the filesystem.
 *
 * @param {String}       content The contents to be written.
 * @param {String}       name    The name of the file.
 * @param {EventEmitter} emitter An event will be emitted when done.
 * @param {Object}       options The options object.
 */
function writeAsset(content, name, emitter, options) {
    var shasum = crypto.createHash('sha1');
    shasum.update(content);
    var digest = shasum.digest('hex');
    var fileName = digest + '-' + name;
    var filePath = pathM.join(options.assetsDir, fileName);

    if (fs.existsSync(filePath)) {
        fs.truncateSync(filePath);
    }

    fs.appendFile(filePath, content, function(err) {
        if (err) {
            console.error(err);
            emitter.emit('component:updated', {
                'name': name,
                'success': false,
                'message': err
            });
        }
        else {
            emitter.emit('component:updated', {
                'name': name,
                'success': fileName
            });
        }
    });
}
