"use strict";

/** Dependencies. */
var util = require('util');

/** log levels */
var __levels = {
    'ERROR': 0,
    'WARNING': 1,
    'INFO': 2,
    'DEBUG': 3,
};

/**
 * @class
 *
 * @augments console
 *
 * @param {String} [level=INFO] Which logs should be displayed?
 */
function Logger(level) {
    this.__proto__.__proto__ = console;

    if (level !== undefined) {
        this.level(level);
    }
}

/** Public methods. */
Logger.prototype = {

    /** @private */
    '__lvl': __levels['INFO'],

    /**
     * Sets or gets the log level.
     *
     * @param {String} [level] If present, sets the log level.
     */
    'level': function level(level) {
        var lvl;

        if (level === undefined) {
            return this.__lvl;
        }
        else {
            level = String(level).toUpperCase();

            lvl = __levels[level];

            if (lvl === undefined) {
                throw new Error('invalid log level, ' + level);
            }

            this.__lvl = lvl;
        }
    },

    /**
     * Writes an error message to stderr.
     *
     * @param {*} message The message to be written.
     */
    'error': function error(message) {
        _write.call(this, process.stderr, 'ERROR', arguments);
    },

    /**
     * Writes a warning message to stderr.
     *
     * @param {*} message The message to be written.
     */
    'warning': function warning(message) {
        _write.call(this, process.stderr, 'WARNING', arguments);
    },

    /**
     * Writes an info message to stdout.
     *
     * @param {*} message The message to be written.
     */
    'info': function info(message) {
        _write.call(this, process.stdout, 'INFO', arguments);
    },

    /**
     * Writes a debug message to stdout.
     *
     * @param {*} message The message to be written.
     */
    'debug': function debug(message) {
        _write.call(this, process.stdout, 'DEBUG', arguments);
    },
};

/** Private methods. Should be called with `.call(this, ...)`. */

/**
 * Pads a numeric value.
 *
 * @param   {Number} nr
 * @returns {String}
 */
function _pad(nr) {
    return (nr < 10 ? '0' : '') + String(nr);
}

/**
 * Returns a formatted date.
 *
 * @returns {String}
 */
function _formatDate() {
    var now = new Date();

    return [
        now.getFullYear(),
        _pad.call(this, now.getMonth()),
        _pad.call(this, now.getDate()),
    ].join('-') + ' ' + [
        _pad.call(this, now.getHours()),
        _pad.call(this, now.getMinutes()),
    ].join(':');
}

/**
 * Writes a message to `stream`.
 *
 * @param {Stream} stream   A stream object.
 * @param {String} level    The level at which this message is written.
 * @param {Array}  messages An array of messages to be shown.
 */
function _write(stream, level, messages) {
    var date = _formatDate.call(this);

    if (this.level() < __levels[level]) {
        return;
    }

    var output = util.format.apply({}, messages);
    output.split('\n').forEach(function(message) {
        stream.write(util.format('[%s][%s] %s\n', date, level, message));
    });
}

module.exports = Logger;
