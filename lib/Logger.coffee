"use strict"

# Dependencies.
util = require 'util'
utils = require './utilities'

# Log levels.
__levels =
  ERROR: 0
  WARNING: 1
  INFO: 2
  DEBUG: 3

class Logger

  # @param {String} [level=INFO]
  constructor: (level = 'INFO') ->
    @level(level) if level isnt undefined

  # Sets or gets the log level.
  #
  # @param {String} [level] If present, sets the log level.
  level: (level) ->
    if level isnt undefined
      level = String(level).toUpperCase()
      lvl = __levels[level]

      if lvl is undefined
        throw new Error("Invalid log level, #{level}")

      @__lvl = lvl
    return @__lvl

  error: (message) -> _write.call @, process.stderr, 'ERROR', arguments
  warning: (message) -> _write.call @, process.stderr, 'WARNING', arguments
  info: (message) -> _write.call @, process.stdout, 'INFO', arguments
  debug: (message) -> _write.call @, process.stdout, 'DEBUG', arguments


# Private methods. Should be called with `.call(@, ...)`.

# Pads a numeric value.
#
# @param {Number} nr
# @returns {String}
_pad = (nr) -> (if nr < 10 then '0' else '') + String(nr)

# Returns a formatted date.
#
# @returns {String}
_formatDate = ->
  now = new Date()

  return [
    now.getFullYear(),
    _pad.call @, now.getMonth(),
    _pad.call @, now.getDate(),
  ].join('-') + ' ' + [
    _pad.call @, now.getHours(),
    _pad.call @, now.getMinutes(),
  ].join(':')

# Writes a message to `stream`.
#
# @param {Stream} stream A stream object.
# @param {String} level The level at which this message is written.
# @param {Array} messages an Array of messages to be shown.
_write = (stream, level, messages) ->
  date = _formatDate.call @

  return if @level() < __levels[level]

  output = util.format.apply {}, messages
  output.split('\n').forEach (message) ->
    stream.write util.format('[%s][%s] %s\n', date, level, message)

module.exports = Logger
