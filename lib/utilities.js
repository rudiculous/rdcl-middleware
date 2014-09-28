"use strict";

/**
 * A collection of useful utility functions.
 */

/**
 * Checks if `obj` is defined.
 *
 * @param   {Object}  obj
 * @returns {Boolean}
 */
exports.defined = function defined(obj) {
    return 'undefined' !== typeof obj;
}

/**
 * Makes a shallow copy of an object or an array.
 *
 * @param   {Object|Array} original
 * @returns {Object}
 */
exports.copy = function copy(original) {
    if (Array.isArray(original)) {
        var arr = [];

        for (var i = 0; i < arguments.lenngth; i++) {
            original = arguments[i] || [];
            original.forEach(function(val) {
                arr.push(val);
            });
        }

        return arr;
    }
    else {
        var obj = {};

        for (var i = 0; i < arguments.length; i++) {
            original = arguments[i] || {};
            Object.keys(original).forEach(function(key) {
                obj[key] = original[key];
            });
        }

        return obj;
    }
};

/**
 * Tests if a string ends with another string (suffix).
 *
 * @param   {String}  str    The string to check in.
 * @param   {String}  suffix The string to check for.
 * @returns {Boolean}
 */
exports.endsWith = function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
};

/**
 * Tests if a string starts with another string (prefix).
 *
 * @param   {String}  str    The string to check in.
 * @param   {String}  prefix The string to check for.
 * @returns {Boolean}
 */
exports.startsWith = function startsWith(str, prefix) {
    return str.indexOf(prefix) === 0;
};

/**
 * Adds a constant to an object.
 *
 * @param {Object} obj   The object to which to add the constant.
 * @param {String} name  The name of the constant.
 * @param {Object} value The value that's to be assigned.
 */
exports.addConst = function addConst(obj, name, value) {
    Object.defineProperty(obj, name, {
        'value': value,
        'writable': false
    });
};

/**
 * Generates HTML.
 *
 * Properties:
 * * CLOSE     Indicates that a close tag should be generated (i.e. &lt;/TAG&gt;).
 * * OPENCLOSE Indicates that both the open and close tag should be generated (i.e. &lt;TAG&gt;&lt;/TAG&gt;).
 * * AUTOCLOSE Indicates that an auto-closed tag should be generated. (i.e. &lt;TAG /&gt;).
 *
 * @function html
 *
 * @param {String} tag
 * @param {Object} attributes
 * @param {Number} opts
 */
exports.html = (function() {
    var CLOSE     = 1, //0b1
        OPENCLOSE = 2, //0b10
        AUTOCLOSE = 4; //0b100

    /** @todo */
    function escape(str) {
        return str;
    }

    function html(tag, attributes, opts) {
        var out = ['<'];
        if (opts & CLOSE) {
            out.push('/');
        }
        out.push(tag);

        Object.keys(attributes).forEach(function(key) {
            var value = attributes[key];

            if (key === 'data') {
                Object.keys(value).forEach(function(dataKey) {
                    var dataValue = value[dataKey];

                    if (dataValue === true) {
                        dataValue = dataKey;
                    }

                    out.push(' data-' + dataKey + '="' + escape(dataValue) + '"');
                });
            }
            else {
                if (value === true) {
                    value = key;
                }

                out.push(' ' + key + '="' + escape(value) + '"');
            }
        });

        if (opts & AUTOCLOSE) {
            out.push(' /');
        }
        out.push('>');

        if (opts & OPENCLOSE) {
            out.push('</' + tag + '>');
        }

        return out.join('');
    }

    /**
    * @static
    * @const CLOSE
    */
    exports.addConst(html, 'CLOSE', CLOSE);

    /**
    * @static
    * @const OPENCLOSE
    */
    exports.addConst(html, 'OPENCLOSE', OPENCLOSE);

    /**
    * @static
    * @const AUTOCLOSE
    */
    exports.addConst(html, 'AUTOCLOSE', AUTOCLOSE);

    return html;
}());


/**
 * An asynchronous version of Array.prototype.map.
 *
 * @param {Array}    arr       The array on which we are mapping.
 * @param {Function} method    The method that is applied on each element.
 * @param {Function} callback  The method that is called when done.
 * @param {Number}   [index=0] The current position in arr.
 */
exports.asyncMap = function asyncMap(arr, method, callback, index) {
    index = index || 0;

    if (index >= arr.length) {
        return callback(arr);
    }

    method(arr[index], function(value) {
        arr[index] = value;
        asyncMap(arr, method, callback, index + 1);
    });
};
