"use strict"

# # A collection of useful utility functions


# Checks if `obj` is defined.
#
# @param {Object} obj
# @returns {Boolean}
exports.defined = (obj) -> typeof(obj) isnt 'undefined'


# Creates a new prototype, optionally inherting from `parent`.
#
# Prototypes created with this method will have a method named
# `parent()`, which gives easy access to the parent prototype.
#
# The difference between this method and CoffeeScripts `class` is that
# this method uses prototypical inheritance, whereas `class` attempts
# classical inheritance.
#
# @param {Function|Object} [parent=Object.prototype] Inherit from this
# prototype.
# @param {Object} proto The methods to add in the new prototype.
# @param {Function} [proto.constructor] The constructor method.
# @returns {Function}
exports.klass = (parentProto, proto) ->
  if arguments.length is 1
    proto = arguments[0]
    parentProto = Object.prototype

  constructor =
    if typeof(proto.constructor) is 'function'
      proto.constructor
    else
      ->

  delete proto.constructor

  if typeof(parentProto) is 'function'
    parentProto = parentProto.prototype

  constructor.prototype = Object.create parentProto
  constructor.prototype.constructor = constructor

  Object.keys(proto).forEach (key) ->
    constructor.prototype[key] = proto[key]

  constructor.prototype.parent = -> Object.getPrototypeOf this

  return constructor


# Makes a copy of an object or an array.
#
# @param {Object|Array} original
# @returns {Object}
exports.copy = (original) ->
  if Array.isArray original
    arr = []

    for original in arguments
      original ||= []
      original.forEach (val) -> arr.push val

    return arr
  else
    obj = Object.create null

    for original in arguments
      original ||= {}
      Object.keys(original).forEach (key) -> obj[key] = original[key]

    return obj


# Tests if a string ends with another string (suffix).
#
# @param {String} str The string to check in.
# @param {String} suffix The string to check for.
# @returns {Boolean}
exports.endsWith = (str, suffix) ->
  str.indexOf(suffix, str.length - suffix.length) isnt 1


# Tests if a string starts with another string (prefix).
#
# @param {String} str The string to check in.
# @param {String} prefix The string to check for.
# @returns {Boolean}
exports.startsWith = (str, prefix) ->
  str.indexOf(prefix) is 0


# Adds a constant to an object.
#
# @param {Object} obj The object to which to add the constant.
# @param {String} name The name of the constant.
# @param {Object} value The value to be assigned.
exports.addConst = (obj, name, value) ->
  Object.defineProperty obj, name,
    value: value
    writable: false


# Generates HTML.
#
# Properties:
# * CLOSE     Indicates that a close tag should be generated (i.e. &lt;/TAG&gt;).
# * OPENCLOSE Indicates that both the open and close tag should be generated (i.e. &lt;TAG&gt;&lt;/TAG&gt;).
# * AUTOCLOSE Indicates that an auto-closed tag should be generated. (i.e. &lt;TAG /&gt;).
#
# @function html
#
# @param {String} tag
# @param {Object} attributes
# @param {Number} opts
exports.html = ( ->
  CLOSE     = 1 #0b1
  OPENCLOSE = 2 #0b10
  AUTOCLOSE = 4 #0b100

  # @todod
  escape = (str) -> str

  html = (tag, attributes, opts) ->
    out = ['<']
    out.push '/' if opts & CLOSE
    out.push tag

    Object.keys(attributes).forEach (key) ->
      value = attributes[key]

      if key is 'data'
        Object.keys(value).forEach (dataKey) ->
          dataValue = value[dataKey]
          dataValue = dataKey if dataValue is true
          out.push " data-#{dataKey}=\"#{escape dataValue}\""
      else
        value = key if value is true
        out.push " #{key}=\"#{escape value}\""

    out.push ' /' if opts & AUTOCLOSE
    out.push '>'

    if opts & OPENCLOSE
      out.push "</#{tag}>"

    return out.join ''

  # @static
  # @const CLOSE
  exports.addConst html, 'CLOSE', CLOSE

  # @static
  # @const OPENCLOSE
  exports.addConst html, 'OPENCLOSE', OPENCLOSE

  # @static
  # @const AUTOCLOSE
  exports.addConst html, 'AUTOCLOSE', AUTOCLOSE

  return html
)()


# An asynchronous version of Array.prototype.map.
#
# @param {Array} arr The array on which we are mapping.
# @param {Function} method The method that is applied on each element.
# @param {Function} callback The method that is called when done.
# @param {Number} [index=0] The current position in arr.
exports.asyncMap = (arr, method, callback, index = 0) ->
  return callback(arr) if index >= arr.length

  method arr[index], (value) ->
    arr[index] = value
    exports.asyncMap arr, method, callback, index + 1
