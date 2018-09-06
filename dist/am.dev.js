var AM = (function (exports) {
'use strict';

/**
 * Copied from node_modules/fetch-ponyfill/build/fetch-browser.js.
 *
 * Types added where necessary.
 *
 * Moved out of IIFE module type, placed `self` declaration to top
 * of `fetchPonyfill` function scope.
 */
var fetchPonyfill = function fetchPonyfill(options) {
    var window = window ? window : false;
    var self = typeof self === "undefined" ? window ? window : global : self;
    var Promise = options && options.Promise || self.Promise;
    var XMLHttpRequest = options && options.XMLHttpRequest || self.XMLHttpRequest;
    var global = self;
    return function () {
        var self = Object.create(global, {
            fetch: {
                value: undefined,
                writable: true
            }
        });
        (function (self) {
            if (self.fetch) {
                return;
            }
            var support = {
                searchParams: "URLSearchParams" in self,
                iterable: "Symbol" in self && "iterator" in Symbol,
                blob: "FileReader" in self && "Blob" in self && function () {
                    try {
                        new Blob();
                        return true;
                    } catch (e) {
                        return false;
                    }
                }(),
                formData: "FormData" in self,
                arrayBuffer: "ArrayBuffer" in self
            };
            if (support.arrayBuffer) {
                var viewClasses = ["[object Int8Array]", "[object Uint8Array]", "[object Uint8ClampedArray]", "[object Int16Array]", "[object Uint16Array]", "[object Int32Array]", "[object Uint32Array]", "[object Float32Array]", "[object Float64Array]"];
                var isDataView = function isDataView(obj) {
                    return obj && DataView.prototype.isPrototypeOf(obj);
                };
                var isArrayBufferView = ArrayBuffer.isView || function (obj) {
                    return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
                };
            }
            function normalizeName(name) {
                if (typeof name !== "string") {
                    name = String(name);
                }
                if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
                    throw new TypeError("Invalid character in header field name");
                }
                return name.toLowerCase();
            }
            function normalizeValue(value) {
                if (typeof value !== "string") {
                    value = String(value);
                }
                return value;
            }
            // Build a destructive iterator for the value list
            function iteratorFor(items) {
                var iterator = {
                    next: function next() {
                        var value = items.shift();
                        return { done: value === undefined, value: value };
                    }
                };
                if (support.iterable) {
                    iterator[Symbol.iterator] = function () {
                        return iterator;
                    };
                }
                return iterator;
            }
            function Headers(headers) {
                this.map = {};
                if (headers instanceof Headers) {
                    headers.forEach(function (value, name) {
                        this.append(name, value);
                    }, this);
                } else if (Array.isArray(headers)) {
                    headers.forEach(function (header) {
                        this.append(header[0], header[1]);
                    }, this);
                } else if (headers) {
                    Object.getOwnPropertyNames(headers).forEach(function (name) {
                        this.append(name, headers[name]);
                    }, this);
                }
            }
            Headers.prototype.append = function (name, value) {
                name = normalizeName(name);
                value = normalizeValue(value);
                var oldValue = this.map[name];
                this.map[name] = oldValue ? oldValue + "," + value : value;
            };
            Headers.prototype["delete"] = function (name) {
                delete this.map[normalizeName(name)];
            };
            Headers.prototype.get = function (name) {
                name = normalizeName(name);
                return this.has(name) ? this.map[name] : null;
            };
            Headers.prototype.has = function (name) {
                return this.map.hasOwnProperty(normalizeName(name));
            };
            Headers.prototype.set = function (name, value) {
                this.map[normalizeName(name)] = normalizeValue(value);
            };
            Headers.prototype.forEach = function (callback, thisArg) {
                for (var name in this.map) {
                    if (this.map.hasOwnProperty(name)) {
                        callback.call(thisArg, this.map[name], name, this);
                    }
                }
            };
            Headers.prototype.keys = function () {
                var items = [];
                this.forEach(function (value, name) {
                    items.push(name);
                });
                return iteratorFor(items);
            };
            Headers.prototype.values = function () {
                var items = [];
                this.forEach(function (value) {
                    items.push(value);
                });
                return iteratorFor(items);
            };
            Headers.prototype.entries = function () {
                var items = [];
                this.forEach(function (value, name) {
                    items.push([name, value]);
                });
                return iteratorFor(items);
            };
            if (support.iterable) {
                Headers.prototype[Symbol.iterator] = Headers.prototype.entries;
            }
            function consumed(body) {
                if (body.bodyUsed) {
                    return Promise.reject(new TypeError("Already read"));
                }
                body.bodyUsed = true;
            }
            function fileReaderReady(reader) {
                return new Promise(function (resolve, reject) {
                    reader.onload = function () {
                        resolve(reader.result);
                    };
                    reader.onerror = function () {
                        reject(reader.error);
                    };
                });
            }
            function readBlobAsArrayBuffer(blob) {
                var reader = new FileReader();
                var promise = fileReaderReady(reader);
                reader.readAsArrayBuffer(blob);
                return promise;
            }
            function readBlobAsText(blob) {
                var reader = new FileReader();
                var promise = fileReaderReady(reader);
                reader.readAsText(blob);
                return promise;
            }
            function readArrayBufferAsText(buf) {
                var view = new Uint8Array(buf);
                var chars = new Array(view.length);
                for (var i = 0; i < view.length; i++) {
                    chars[i] = String.fromCharCode(view[i]);
                }
                return chars.join("");
            }
            function bufferClone(buf) {
                if (buf.slice) {
                    return buf.slice(0);
                } else {
                    var view = new Uint8Array(buf.byteLength);
                    view.set(new Uint8Array(buf));
                    return view.buffer;
                }
            }
            function Body() {
                this.bodyUsed = false;
                this._initBody = function (body) {
                    this._bodyInit = body;
                    if (!body) {
                        this._bodyText = "";
                    } else if (typeof body === "string") {
                        this._bodyText = body;
                    } else if (support.blob && Blob.prototype.isPrototypeOf(body)) {
                        this._bodyBlob = body;
                    } else if (support.formData && FormData.prototype.isPrototypeOf(body)) {
                        this._bodyFormData = body;
                    } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
                        this._bodyText = body.toString();
                    } else if (support.arrayBuffer && support.blob && isDataView(body)) {
                        this._bodyArrayBuffer = bufferClone(body.buffer);
                        // IE 10-11 can't handle a DataView body.
                        this._bodyInit = new Blob([this._bodyArrayBuffer]);
                    } else if (support.arrayBuffer && (ArrayBuffer.prototype.isPrototypeOf(body) || isArrayBufferView(body))) {
                        this._bodyArrayBuffer = bufferClone(body);
                    } else {
                        throw new Error("unsupported BodyInit type");
                    }
                    if (!this.headers.get("content-type")) {
                        if (typeof body === "string") {
                            this.headers.set("content-type", "text/plain;charset=UTF-8");
                        } else if (this._bodyBlob && this._bodyBlob.type) {
                            this.headers.set("content-type", this._bodyBlob.type);
                        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
                            this.headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8");
                        }
                    }
                };
                if (support.blob) {
                    this.blob = function () {
                        var rejected = consumed(this);
                        if (rejected) {
                            return rejected;
                        }
                        if (this._bodyBlob) {
                            return Promise.resolve(this._bodyBlob);
                        } else if (this._bodyArrayBuffer) {
                            return Promise.resolve(new Blob([this._bodyArrayBuffer]));
                        } else if (this._bodyFormData) {
                            throw new Error("could not read FormData body as blob");
                        } else {
                            return Promise.resolve(new Blob([this._bodyText]));
                        }
                    };
                    this.arrayBuffer = function () {
                        if (this._bodyArrayBuffer) {
                            return consumed(this) || Promise.resolve(this._bodyArrayBuffer);
                        } else {
                            return this.blob().then(readBlobAsArrayBuffer);
                        }
                    };
                }
                this.text = function () {
                    var rejected = consumed(this);
                    if (rejected) {
                        return rejected;
                    }
                    if (this._bodyBlob) {
                        return readBlobAsText(this._bodyBlob);
                    } else if (this._bodyArrayBuffer) {
                        return Promise.resolve(readArrayBufferAsText(this._bodyArrayBuffer));
                    } else if (this._bodyFormData) {
                        throw new Error("could not read FormData body as text");
                    } else {
                        return Promise.resolve(this._bodyText);
                    }
                };
                if (support.formData) {
                    this.formData = function () {
                        return this.text().then(decode);
                    };
                }
                this.json = function () {
                    return this.text().then(JSON.parse);
                };
                return this;
            }
            // HTTP methods whose capitalization should be normalized
            var methods = ["DELETE", "GET", "HEAD", "OPTIONS", "POST", "PUT"];
            function normalizeMethod(method) {
                var upcased = method.toUpperCase();
                return methods.indexOf(upcased) > -1 ? upcased : method;
            }
            function Request(input, options) {
                options = options || {};
                var body = options.body;
                if (input instanceof Request) {
                    if (input.bodyUsed) {
                        throw new TypeError("Already read");
                    }
                    this.url = input.url;
                    this.credentials = input.credentials;
                    if (!options.headers) {
                        this.headers = new Headers(input.headers);
                    }
                    this.method = input.method;
                    this.mode = input.mode;
                    if (!body && input._bodyInit != null) {
                        body = input._bodyInit;
                        input.bodyUsed = true;
                    }
                } else {
                    this.url = String(input);
                }
                this.credentials = options.credentials || this.credentials || "omit";
                if (options.headers || !this.headers) {
                    this.headers = new Headers(options.headers);
                }
                this.method = normalizeMethod(options.method || this.method || "GET");
                this.mode = options.mode || this.mode || null;
                this.referrer = null;
                if ((this.method === "GET" || this.method === "HEAD") && body) {
                    throw new TypeError("Body not allowed for GET or HEAD requests");
                }
                this._initBody(body);
            }
            Request.prototype.clone = function () {
                return new Request(this, { body: this._bodyInit });
            };
            function decode(body) {
                var form = new FormData();
                body.trim().split("&").forEach(function (bytes) {
                    if (bytes) {
                        var split = bytes.split("=");
                        var name = split.shift().replace(/\+/g, " ");
                        var value = split.join("=").replace(/\+/g, " ");
                        form.append(decodeURIComponent(name), decodeURIComponent(value));
                    }
                });
                return form;
            }
            function parseHeaders(rawHeaders) {
                var headers = new Headers({});
                rawHeaders.split(/\r?\n/).forEach(function (line) {
                    var parts = line.split(":");
                    var key = parts.shift().trim();
                    if (key) {
                        var value = parts.join(":").trim();
                        headers.append(key, value);
                    }
                });
                return headers;
            }
            Body.call(Request.prototype);
            var Response = function Response(bodyInit, options) {
                if (!options) {
                    options = {};
                }
                this.type = "default";
                this.status = "status" in options ? options.status : 200;
                this.ok = this.status >= 200 && this.status < 300;
                this.statusText = "statusText" in options ? options.statusText : "OK";
                this.headers = new Headers(options.headers);
                this.url = options.url || "";
                this._initBody(bodyInit);
            };
            Body.call(Response.prototype);
            Response.prototype.clone = function () {
                return new Response(this._bodyInit, {
                    status: this.status,
                    statusText: this.statusText,
                    headers: new Headers(this.headers),
                    url: this.url
                });
            };
            Response.error = function () {
                var response = new Response(null, { status: 0, statusText: "" });
                response.type = "error";
                return response;
            };
            var redirectStatuses = [301, 302, 303, 307, 308];
            Response.redirect = function (url, status) {
                if (redirectStatuses.indexOf(status) === -1) {
                    throw new RangeError("Invalid status code");
                }
                return new Response(null, {
                    status: status,
                    headers: { location: url }
                });
            };
            self.Headers = Headers;
            self.Request = Request;
            self.Response = Response;
            self.fetch = function (input, init) {
                return new Promise(function (resolve, reject) {
                    var request = new Request(input, init);
                    var xhr = new XMLHttpRequest();
                    xhr.onload = function () {
                        var options = {
                            status: xhr.status,
                            statusText: xhr.statusText,
                            headers: parseHeaders(xhr.getAllResponseHeaders() || "")
                        };
                        options.url = "responseURL" in xhr ? xhr.responseURL : options.headers.get("X-Request-URL");
                        var body = "response" in xhr ? xhr.response : xhr.responseText;
                        resolve(new Response(body, options));
                    };
                    xhr.onerror = function () {
                        reject(new TypeError("Network request failed"));
                    };
                    xhr.ontimeout = function () {
                        reject(new TypeError("Network request failed"));
                    };
                    xhr.open(request.method, request.url, true);
                    if (request.credentials === "include") {
                        xhr.withCredentials = true;
                    }
                    if ("responseType" in xhr && support.blob) {
                        xhr.responseType = "blob";
                    }
                    request.headers.forEach(function (value, name) {
                        xhr.setRequestHeader(name, value);
                    });
                    xhr.send(typeof request._bodyInit === "undefined" ? null : request._bodyInit);
                });
            };
            self.fetch.polyfill = true;
        })(typeof self !== "undefined" ? self : this);
        return {
            fetch: self.fetch,
            Headers: self.Headers,
            Request: self.Request,
            Response: self.Response
        };
    }();
};

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Request =
// Constructor
/**
 * @class Request
 * @param {object} config
 * @param {string} config.endpoint
 * @param {object} [config.options]
 * @param {FormData} [config.body]
 */
function Request(_ref) {
    var _this = this;

    var endpoint = _ref.endpoint,
        options = _ref.options,
        body = _ref.body;

    _classCallCheck(this, Request);

    // Private methods
    /**
     * @private
     * @function Request.prepareFetchOptions
     * @description Creates blank FormData object if this.body is undefined and
     * this.options.method is equal to "POST".
     * @returns {FormData}
     */
    this.prepareFetchOptions = function () {
        if (!_this.body && _this.options.method === "POST") {
            _this.body = new FormData();
        }
        return _this.body;
    };
    // Public methods
    /**
     * @public
     * @function Request.send
     * @param	{object} options
     * @param {boolean} [options.async] Allows property `async` to be set to indicate the
     * response should be prepared before returning.
     * @returns {Promise}
     */
    this.send = function () {
        var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { async: false },
            async = _ref2.async;

        var _ref3 = window ? window.fetch ? window : fetchPonyfill({}).fetch : {
            fetch: function fetch() {
                console.warn("fetch is not supported");
            }
        },
            fetch = _ref3.fetch;

        var preparedOptions = _extends({}, _this.prepareFetchOptions(), _this.options);
        var initFetch = fetch(_this.endpoint, preparedOptions);
        return async ? initFetch.then(function (res) {
            return res.json();
        }) : initFetch;
    };
    this.endpoint = endpoint;
    this.options = options || Request.defaultOptions;
    this.body = body;
};
// Static properties
/**
 * @static
 * @member {object} Request.defaultOptions Options object to fallback to if
 * no options property is passed into the constructor config object.
 */


Request.defaultOptions = {
    method: "GET",
    headers: { Accept: "application/json" }
};

/**
 * @module dataManipulation
 */
/**
 * @function searchPropPath
 * @description Recursively searchs through a data object
 * @param {alphanumeric[]} [path] Array of keys in the order of which will be used to recursively search an object
 * @param {object} [collection] Data object
 * @return {any} Value at the end of the searched property path;
 */
var searchPropPath = function searchPropPath(path, collection) {
  var pathResult = collection;
  path.forEach(function (key) {
    pathResult = pathResult[key];
  });
  return pathResult ? pathResult : false;
};

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/**
 * @module parse
 */
/**
 * Base from https://gist.github.com/geoffdavis92/1da7d0745e3bba036f94
 * @function params
 * @description Creates object of key/value pairs from URL parameters.
 * @param {string} [url] URL to parse; defaults to window.location.search.
 * @return {object} Object of key/value pairs.
 */
var params = function params() {
    var url = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : window.location.search;
    return url.split("?")[1].split("&").map(function (q) {
        return q.split("=");
    }).reduce(function (acc, _ref, i, arr) {
        var _ref2 = _slicedToArray(_ref, 2),
            key = _ref2[0],
            val = _ref2[1];

        acc[key] = decodeURIComponent(val).replace(/\+/g, " ");
        return acc;
    }, {});
};
/**
 * @function parseExternalMarkdownLinks
 * @description Transforms Markdown links to use target="_blank", rel="noopener noreferrer";
 * usually used when implementing clientside Markdown, before sending the Markdown to the main
 * parsing function.
 * @param {string} string String to parse as Markdown link.
 * @returns {string} HTML link with URL and innerText, target and rel attributes properly set for
 * an external link.
 */
var parseExternalMarkdownLinks = function parseExternalMarkdownLinks(string) {
    var pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    if (string.search(pattern) > -1) {
        return string.replace(pattern, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    } else {
        return string;
    }
};

/**
 * @module scroll
 */
/**
 * @function isElementInViewport
 * @description Determines if a given element is partially or
 * fully visible in the viewport.
 * @param {object} config
 * @param {Element} config.element HTML Element node to target.
 * @param {number} [config.threshold] Ratio of the viewport height the element
 * must fill before being considered visible. E.g. 0.5 means the element
 * must take up 50% of the screen before returning true. Defaults to 0.25.
 * Only used for elements taller than the viewport.
 * @return {boolean} Boolean describing if input is fully/partially
 * in the viewport, relative to the threshold setting.
 */
function isElementInViewport(_ref) {
    var argElement = _ref.element,
        argThreshold = _ref.threshold;

    var defaultParams = {
        threshold: 0.25
    };
    var safeArgs = {
        threshold: argThreshold || defaultParams.threshold
    };
    var rect = argElement.getBoundingClientRect();
    var viewportHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    var threshold = safeArgs.threshold;

    if (threshold < 0 || threshold > 1) {
        throw new RangeError("Threshold argument must be a decimal between 0 and 1");
    }
    //If the element is too tall to fit within the viewport
    if (rect.height >= threshold * viewportHeight) {
        if (rect.top - viewportHeight <= threshold * viewportHeight * -1 && rect.bottom >= threshold * viewportHeight) {
            return true;
        } else {
            return false;
        }
    } else {
        //If the element is short enough to fit within the viewport
        if (rect.top >= 0 && rect.bottom - viewportHeight <= 0) {
            return true;
        } else {
            return false;
        }
    }
}
/**
 * From http://bit.ly/2cP65fD
 * @todo Classify and describe params.
 * @function scrollTo
 * @description Scrolls given element to determined point.
 * @param  {Element} element  [description]
 * @param  {number} to       [description]
 * @param  {number} duration [description]
 * @return {void}
 */
function scrollTo(element, to, duration) {
    if (duration <= 0) return;
    var difference = to - element.scrollTop;
    var perTick = difference / duration * 10;
    setTimeout(function () {
        element.scrollTop = element.scrollTop + perTick;
        if (element.scrollTop === to) return;
        scrollTo(element, to, duration - 10);
    }, 10);
}

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/**
 * @module select
 */
/**
 * @function select
 * @description Selects a DOM node based on a query.
 * @param {string} query query selector to use to query an node.
 * @returns {Element} First DOM node that matches the query.
 */
var select = function select(query) {
  return document.querySelector(query);
};
/**
 * @function selectAll
 * @description Selects a DOM nodelist based on a query.
 * @param {string} query query selector to use to query a nodelist.
 * @returns {Element[]} Array of DOM nodes that match the query.
 */
var selectAll = function selectAll(query) {
  return [].concat(_toConsumableArray(document.querySelectorAll(query)));
};
/**
 * @function selectById
 * @description Selects a DOM node based on an ID string.
 * @param {string} id ID of DOM node to select.
 * @returns {Element} DOM node with matched ID.
 */
var selectById = function selectById(id) {
  return document.getElementById(id);
};

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

/**
 * @module typography
 */
/**
 * @function capitalize
 * @description Capitalizes all words in a string.
 * @param {string} string Text to capitalize.
 * @returns {string} Title-cased text.
 */
var capitalize = function capitalize(string) {
  return string.split(" ").map(function (s) {
    return ucFirst(s);
  }).join(" ");
};
/**
 * @function slugify
 * @description Lowercases string, replaces spaces and special characters
 * with a set delimiter.
 * @param {string} textToSlug Text to slugify.
 * @param {string} [delimiter] Delimiter; defaults to "-".
 * @returns {string} Slugified text.
 */
var slugify = function slugify(textToSlug) {
  var delimiter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "-";
  return textToSlug.replace(/(\!|#|\$|%|\*|\.|\/|\\|\(|\)|\+|\||\,|\:|\'|\")/g, "").replace(/(.)(\s|\_|\-)+(.)/g, "$1" + delimiter + "$3").toLowerCase();
};
/**
 * @function trim
 * @description Trims whitespace on either end of a string.
 * @param {string} string Text to trim.
 * @returns {string} Trimmed text.
 */
var trim = function trim(string) {
  return string.replace(/^\s+|\s+$/g, "");
};
/**
 * @function ucFirst
 * @description Capitalizes first word in a string.
 * @param {string} string Text to capitalize.
 * @returns {string} Capitalized text.
 */
var ucFirst = function ucFirst(_ref) {
  var _ref2 = _toArray(_ref),
      firstLetter = _ref2[0],
      restLetters = _ref2.slice(1);

  return "" + firstLetter.toUpperCase() + restLetters.join("");
};

exports.Request = Request;
exports.capitalize = capitalize;
exports.isElementInViewport = isElementInViewport;
exports.parseExternalMarkdownLinks = parseExternalMarkdownLinks;
exports.parseURLParams = params;
exports.scrollTo = scrollTo;
exports.searchPropPath = searchPropPath;
exports.select = select;
exports.selectAll = selectAll;
exports.selectById = selectById;
exports.slugify = slugify;
exports.trim = trim;
exports.ucFirst = ucFirst;

return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW0uZGV2LmpzIiwic291cmNlcyI6WyIuLi9zcmMvdmVuZG9yL2ZldGNoUG9ueWZpbGwudHMiLCIuLi9zcmMvY2xhc3Nlcy9SZXF1ZXN0LnRzIiwiLi4vc3JjL2Z1bmN0aW9ucy9kYXRhTWFuaXB1bGF0aW9uLnRzIiwiLi4vc3JjL2Z1bmN0aW9ucy9wYXJzZS50cyIsIi4uL3NyYy9mdW5jdGlvbnMvc2Nyb2xsLnRzIiwiLi4vc3JjL2Z1bmN0aW9ucy9zZWxlY3QudHMiLCIuLi9zcmMvZnVuY3Rpb25zL3R5cG9ncmFwaHkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3BpZWQgZnJvbSBub2RlX21vZHVsZXMvZmV0Y2gtcG9ueWZpbGwvYnVpbGQvZmV0Y2gtYnJvd3Nlci5qcy5cbiAqXG4gKiBUeXBlcyBhZGRlZCB3aGVyZSBuZWNlc3NhcnkuXG4gKlxuICogTW92ZWQgb3V0IG9mIElJRkUgbW9kdWxlIHR5cGUsIHBsYWNlZCBgc2VsZmAgZGVjbGFyYXRpb24gdG8gdG9wXG4gKiBvZiBgZmV0Y2hQb255ZmlsbGAgZnVuY3Rpb24gc2NvcGUuXG4gKi9cbmNvbnN0IGZldGNoUG9ueWZpbGwgPSBmdW5jdGlvbiBmZXRjaFBvbnlmaWxsKG9wdGlvbnMpIHtcbiAgdmFyIHdpbmRvdyA9IHdpbmRvdyA/IHdpbmRvdyA6IGZhbHNlO1xuICB2YXIgc2VsZiA9IHR5cGVvZiBzZWxmID09PSBcInVuZGVmaW5lZFwiID8gKHdpbmRvdyA/IHdpbmRvdyA6IGdsb2JhbCkgOiBzZWxmO1xuICB2YXIgUHJvbWlzZSA9IChvcHRpb25zICYmIG9wdGlvbnMuUHJvbWlzZSkgfHwgc2VsZi5Qcm9taXNlO1xuICB2YXIgWE1MSHR0cFJlcXVlc3QgPVxuICAgIChvcHRpb25zICYmIG9wdGlvbnMuWE1MSHR0cFJlcXVlc3QpIHx8IHNlbGYuWE1MSHR0cFJlcXVlc3Q7XG4gIHZhciBnbG9iYWwgPSBzZWxmO1xuXG4gIHJldHVybiAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSBPYmplY3QuY3JlYXRlKGdsb2JhbCwge1xuICAgICAgZmV0Y2g6IHtcbiAgICAgICAgdmFsdWU6IHVuZGVmaW5lZCxcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIChmdW5jdGlvbihzZWxmKSB7XG4gICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgaWYgKHNlbGYuZmV0Y2gpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgc3VwcG9ydCA9IHtcbiAgICAgICAgc2VhcmNoUGFyYW1zOiBcIlVSTFNlYXJjaFBhcmFtc1wiIGluIHNlbGYsXG4gICAgICAgIGl0ZXJhYmxlOiBcIlN5bWJvbFwiIGluIHNlbGYgJiYgXCJpdGVyYXRvclwiIGluIFN5bWJvbCxcbiAgICAgICAgYmxvYjpcbiAgICAgICAgICBcIkZpbGVSZWFkZXJcIiBpbiBzZWxmICYmXG4gICAgICAgICAgXCJCbG9iXCIgaW4gc2VsZiAmJlxuICAgICAgICAgIChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIG5ldyBCbG9iKCk7XG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSkoKSxcbiAgICAgICAgZm9ybURhdGE6IFwiRm9ybURhdGFcIiBpbiBzZWxmLFxuICAgICAgICBhcnJheUJ1ZmZlcjogXCJBcnJheUJ1ZmZlclwiIGluIHNlbGZcbiAgICAgIH07XG5cbiAgICAgIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyKSB7XG4gICAgICAgIHZhciB2aWV3Q2xhc3NlcyA9IFtcbiAgICAgICAgICBcIltvYmplY3QgSW50OEFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBVaW50OEFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBVaW50OENsYW1wZWRBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgSW50MTZBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgVWludDE2QXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IEludDMyQXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IFVpbnQzMkFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBGbG9hdDMyQXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IEZsb2F0NjRBcnJheV1cIlxuICAgICAgICBdO1xuXG4gICAgICAgIHZhciBpc0RhdGFWaWV3ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgcmV0dXJuIG9iaiAmJiBEYXRhVmlldy5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihvYmopO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBpc0FycmF5QnVmZmVyVmlldyA9XG4gICAgICAgICAgQXJyYXlCdWZmZXIuaXNWaWV3IHx8XG4gICAgICAgICAgZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICBvYmogJiZcbiAgICAgICAgICAgICAgdmlld0NsYXNzZXMuaW5kZXhPZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSkgPiAtMVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBub3JtYWxpemVOYW1lKG5hbWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgbmFtZSA9IFN0cmluZyhuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoL1teYS16MC05XFwtIyQlJicqKy5cXF5fYHx+XS9pLnRlc3QobmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBjaGFyYWN0ZXIgaW4gaGVhZGVyIGZpZWxkIG5hbWVcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbm9ybWFsaXplVmFsdWUodmFsdWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIHZhbHVlID0gU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEJ1aWxkIGEgZGVzdHJ1Y3RpdmUgaXRlcmF0b3IgZm9yIHRoZSB2YWx1ZSBsaXN0XG4gICAgICBmdW5jdGlvbiBpdGVyYXRvckZvcihpdGVtcykge1xuICAgICAgICB2YXIgaXRlcmF0b3IgPSB7XG4gICAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBpdGVtcy5zaGlmdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHsgZG9uZTogdmFsdWUgPT09IHVuZGVmaW5lZCwgdmFsdWU6IHZhbHVlIH07XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gICAgICAgICAgaXRlcmF0b3JbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaXRlcmF0b3I7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIEhlYWRlcnMoaGVhZGVycykge1xuICAgICAgICB0aGlzLm1hcCA9IHt9O1xuXG4gICAgICAgIGlmIChoZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycykge1xuICAgICAgICAgIGhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgdmFsdWUpO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoaGVhZGVycykpIHtcbiAgICAgICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24oaGVhZGVyKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZChoZWFkZXJbMF0sIGhlYWRlclsxXSk7XG4gICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaGVhZGVycykge1xuICAgICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGhlYWRlcnMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgaGVhZGVyc1tuYW1lXSk7XG4gICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICAgICAgbmFtZSA9IG5vcm1hbGl6ZU5hbWUobmFtZSk7XG4gICAgICAgIHZhbHVlID0gbm9ybWFsaXplVmFsdWUodmFsdWUpO1xuICAgICAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLm1hcFtuYW1lXTtcbiAgICAgICAgdGhpcy5tYXBbbmFtZV0gPSBvbGRWYWx1ZSA/IG9sZFZhbHVlICsgXCIsXCIgKyB2YWx1ZSA6IHZhbHVlO1xuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGVbXCJkZWxldGVcIl0gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgbmFtZSA9IG5vcm1hbGl6ZU5hbWUobmFtZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmhhcyhuYW1lKSA/IHRoaXMubWFwW25hbWVdIDogbnVsbDtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwLmhhc093blByb3BlcnR5KG5vcm1hbGl6ZU5hbWUobmFtZSkpO1xuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV0gPSBub3JtYWxpemVWYWx1ZSh2YWx1ZSk7XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgICAgZm9yICh2YXIgbmFtZSBpbiB0aGlzLm1hcCkge1xuICAgICAgICAgIGlmICh0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB0aGlzLm1hcFtuYW1lXSwgbmFtZSwgdGhpcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xuICAgICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgICBpdGVtcy5wdXNoKG5hbWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLnZhbHVlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaXRlbXMucHVzaCh2YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpO1xuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUuZW50cmllcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgICAgaXRlbXMucHVzaChbbmFtZSwgdmFsdWVdKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcyk7XG4gICAgICB9O1xuXG4gICAgICBpZiAoc3VwcG9ydC5pdGVyYWJsZSkge1xuICAgICAgICBIZWFkZXJzLnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdID0gSGVhZGVycy5wcm90b3R5cGUuZW50cmllcztcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gY29uc3VtZWQoYm9keSkge1xuICAgICAgICBpZiAoYm9keS5ib2R5VXNlZCkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgVHlwZUVycm9yKFwiQWxyZWFkeSByZWFkXCIpKTtcbiAgICAgICAgfVxuICAgICAgICBib2R5LmJvZHlVc2VkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZmlsZVJlYWRlclJlYWR5KHJlYWRlcikge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZWplY3QocmVhZGVyLmVycm9yKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcmVhZEJsb2JBc0FycmF5QnVmZmVyKGJsb2IpIHtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHZhciBwcm9taXNlID0gZmlsZVJlYWRlclJlYWR5KHJlYWRlcik7XG4gICAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihibG9iKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlYWRCbG9iQXNUZXh0KGJsb2IpIHtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHZhciBwcm9taXNlID0gZmlsZVJlYWRlclJlYWR5KHJlYWRlcik7XG4gICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGJsb2IpO1xuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcmVhZEFycmF5QnVmZmVyQXNUZXh0KGJ1Zikge1xuICAgICAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGJ1Zik7XG4gICAgICAgIHZhciBjaGFycyA9IG5ldyBBcnJheSh2aWV3Lmxlbmd0aCk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2aWV3Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY2hhcnNbaV0gPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHZpZXdbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjaGFycy5qb2luKFwiXCIpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBidWZmZXJDbG9uZShidWYpIHtcbiAgICAgICAgaWYgKGJ1Zi5zbGljZSkge1xuICAgICAgICAgIHJldHVybiBidWYuc2xpY2UoMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWYuYnl0ZUxlbmd0aCk7XG4gICAgICAgICAgdmlldy5zZXQobmV3IFVpbnQ4QXJyYXkoYnVmKSk7XG4gICAgICAgICAgcmV0dXJuIHZpZXcuYnVmZmVyO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIEJvZHkoKSB7XG4gICAgICAgIHRoaXMuYm9keVVzZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLl9pbml0Qm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgICAgICAgICB0aGlzLl9ib2R5SW5pdCA9IGJvZHk7XG4gICAgICAgICAgaWYgKCFib2R5KSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IFwiXCI7XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYm9keSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5fYm9keVRleHQgPSBib2R5O1xuICAgICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5ibG9iICYmIEJsb2IucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlCbG9iID0gYm9keTtcbiAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgc3VwcG9ydC5mb3JtRGF0YSAmJlxuICAgICAgICAgICAgRm9ybURhdGEucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSlcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlGb3JtRGF0YSA9IGJvZHk7XG4gICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIHN1cHBvcnQuc2VhcmNoUGFyYW1zICYmXG4gICAgICAgICAgICBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSlcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keS50b1N0cmluZygpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlciAmJiBzdXBwb3J0LmJsb2IgJiYgaXNEYXRhVmlldyhib2R5KSkge1xuICAgICAgICAgICAgdGhpcy5fYm9keUFycmF5QnVmZmVyID0gYnVmZmVyQ2xvbmUoYm9keS5idWZmZXIpO1xuICAgICAgICAgICAgLy8gSUUgMTAtMTEgY2FuJ3QgaGFuZGxlIGEgRGF0YVZpZXcgYm9keS5cbiAgICAgICAgICAgIHRoaXMuX2JvZHlJbml0ID0gbmV3IEJsb2IoW3RoaXMuX2JvZHlBcnJheUJ1ZmZlcl0pO1xuICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBzdXBwb3J0LmFycmF5QnVmZmVyICYmXG4gICAgICAgICAgICAoQXJyYXlCdWZmZXIucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkgfHxcbiAgICAgICAgICAgICAgaXNBcnJheUJ1ZmZlclZpZXcoYm9keSkpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5QXJyYXlCdWZmZXIgPSBidWZmZXJDbG9uZShib2R5KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5zdXBwb3J0ZWQgQm9keUluaXQgdHlwZVwiKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIXRoaXMuaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIikpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYm9keSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KFwiY29udGVudC10eXBlXCIsIFwidGV4dC9wbGFpbjtjaGFyc2V0PVVURi04XCIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QmxvYiAmJiB0aGlzLl9ib2R5QmxvYi50eXBlKSB7XG4gICAgICAgICAgICAgIHRoaXMuaGVhZGVycy5zZXQoXCJjb250ZW50LXR5cGVcIiwgdGhpcy5fYm9keUJsb2IudHlwZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICBzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJlxuICAgICAgICAgICAgICBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KFxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCIsXG4gICAgICAgICAgICAgICAgXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7Y2hhcnNldD1VVEYtOFwiXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzdXBwb3J0LmJsb2IpIHtcbiAgICAgICAgICB0aGlzLmJsb2IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpO1xuICAgICAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAgIHJldHVybiByZWplY3RlZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUJsb2IpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keUFycmF5QnVmZmVyXSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyBibG9iXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keVRleHRdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHRoaXMuYXJyYXlCdWZmZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNvbnN1bWVkKHRoaXMpIHx8IFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmxvYigpLnRoZW4ocmVhZEJsb2JBc0FycmF5QnVmZmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50ZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcyk7XG4gICAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVhZEJsb2JBc1RleHQodGhpcy5fYm9keUJsb2IpO1xuICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxuICAgICAgICAgICAgICByZWFkQXJyYXlCdWZmZXJBc1RleHQodGhpcy5fYm9keUFycmF5QnVmZmVyKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlGb3JtRGF0YSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyB0ZXh0XCIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlUZXh0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHN1cHBvcnQuZm9ybURhdGEpIHtcbiAgICAgICAgICB0aGlzLmZvcm1EYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihkZWNvZGUpO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmpzb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihKU09OLnBhcnNlKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgLy8gSFRUUCBtZXRob2RzIHdob3NlIGNhcGl0YWxpemF0aW9uIHNob3VsZCBiZSBub3JtYWxpemVkXG4gICAgICB2YXIgbWV0aG9kcyA9IFtcIkRFTEVURVwiLCBcIkdFVFwiLCBcIkhFQURcIiwgXCJPUFRJT05TXCIsIFwiUE9TVFwiLCBcIlBVVFwiXTtcblxuICAgICAgZnVuY3Rpb24gbm9ybWFsaXplTWV0aG9kKG1ldGhvZCkge1xuICAgICAgICB2YXIgdXBjYXNlZCA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpO1xuICAgICAgICByZXR1cm4gbWV0aG9kcy5pbmRleE9mKHVwY2FzZWQpID4gLTEgPyB1cGNhc2VkIDogbWV0aG9kO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBSZXF1ZXN0KGlucHV0LCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICB2YXIgYm9keSA9IG9wdGlvbnMuYm9keTtcblxuICAgICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBSZXF1ZXN0KSB7XG4gICAgICAgICAgaWYgKGlucHV0LmJvZHlVc2VkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQWxyZWFkeSByZWFkXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVybCA9IGlucHV0LnVybDtcbiAgICAgICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5wdXQuY3JlZGVudGlhbHM7XG4gICAgICAgICAgaWYgKCFvcHRpb25zLmhlYWRlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKGlucHV0LmhlYWRlcnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLm1ldGhvZCA9IGlucHV0Lm1ldGhvZDtcbiAgICAgICAgICB0aGlzLm1vZGUgPSBpbnB1dC5tb2RlO1xuICAgICAgICAgIGlmICghYm9keSAmJiBpbnB1dC5fYm9keUluaXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgYm9keSA9IGlucHV0Ll9ib2R5SW5pdDtcbiAgICAgICAgICAgIGlucHV0LmJvZHlVc2VkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy51cmwgPSBTdHJpbmcoaW5wdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jcmVkZW50aWFscyA9IG9wdGlvbnMuY3JlZGVudGlhbHMgfHwgdGhpcy5jcmVkZW50aWFscyB8fCBcIm9taXRcIjtcbiAgICAgICAgaWYgKG9wdGlvbnMuaGVhZGVycyB8fCAhdGhpcy5oZWFkZXJzKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1ldGhvZCA9IG5vcm1hbGl6ZU1ldGhvZChvcHRpb25zLm1ldGhvZCB8fCB0aGlzLm1ldGhvZCB8fCBcIkdFVFwiKTtcbiAgICAgICAgdGhpcy5tb2RlID0gb3B0aW9ucy5tb2RlIHx8IHRoaXMubW9kZSB8fCBudWxsO1xuICAgICAgICB0aGlzLnJlZmVycmVyID0gbnVsbDtcblxuICAgICAgICBpZiAoKHRoaXMubWV0aG9kID09PSBcIkdFVFwiIHx8IHRoaXMubWV0aG9kID09PSBcIkhFQURcIikgJiYgYm9keSkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJCb2R5IG5vdCBhbGxvd2VkIGZvciBHRVQgb3IgSEVBRCByZXF1ZXN0c1wiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pbml0Qm9keShib2R5KTtcbiAgICAgIH1cblxuICAgICAgUmVxdWVzdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXF1ZXN0KHRoaXMsIHsgYm9keTogdGhpcy5fYm9keUluaXQgfSk7XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiBkZWNvZGUoYm9keSkge1xuICAgICAgICB2YXIgZm9ybSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICBib2R5XG4gICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgIC5zcGxpdChcIiZcIilcbiAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbihieXRlcykge1xuICAgICAgICAgICAgaWYgKGJ5dGVzKSB7XG4gICAgICAgICAgICAgIHZhciBzcGxpdCA9IGJ5dGVzLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgICAgdmFyIG5hbWUgPSBzcGxpdC5zaGlmdCgpLnJlcGxhY2UoL1xcKy9nLCBcIiBcIik7XG4gICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHNwbGl0LmpvaW4oXCI9XCIpLnJlcGxhY2UoL1xcKy9nLCBcIiBcIik7XG4gICAgICAgICAgICAgIGZvcm0uYXBwZW5kKGRlY29kZVVSSUNvbXBvbmVudChuYW1lKSwgZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmb3JtO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBwYXJzZUhlYWRlcnMocmF3SGVhZGVycykge1xuICAgICAgICB2YXIgaGVhZGVyczogYW55ID0gbmV3IEhlYWRlcnMoe30pO1xuICAgICAgICByYXdIZWFkZXJzLnNwbGl0KC9cXHI/XFxuLykuZm9yRWFjaChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgdmFyIHBhcnRzID0gbGluZS5zcGxpdChcIjpcIik7XG4gICAgICAgICAgdmFyIGtleSA9IHBhcnRzLnNoaWZ0KCkudHJpbSgpO1xuICAgICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHBhcnRzLmpvaW4oXCI6XCIpLnRyaW0oKTtcbiAgICAgICAgICAgIGhlYWRlcnMuYXBwZW5kKGtleSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBoZWFkZXJzO1xuICAgICAgfVxuXG4gICAgICBCb2R5LmNhbGwoUmVxdWVzdC5wcm90b3R5cGUpO1xuXG4gICAgICB2YXIgUmVzcG9uc2U6IGFueSA9IGZ1bmN0aW9uKGJvZHlJbml0LCBvcHRpb25zKTogdm9pZCB7XG4gICAgICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudHlwZSA9IFwiZGVmYXVsdFwiO1xuICAgICAgICB0aGlzLnN0YXR1cyA9IFwic3RhdHVzXCIgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RhdHVzIDogMjAwO1xuICAgICAgICB0aGlzLm9rID0gdGhpcy5zdGF0dXMgPj0gMjAwICYmIHRoaXMuc3RhdHVzIDwgMzAwO1xuICAgICAgICB0aGlzLnN0YXR1c1RleHQgPSBcInN0YXR1c1RleHRcIiBpbiBvcHRpb25zID8gb3B0aW9ucy5zdGF0dXNUZXh0IDogXCJPS1wiO1xuICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhvcHRpb25zLmhlYWRlcnMpO1xuICAgICAgICB0aGlzLnVybCA9IG9wdGlvbnMudXJsIHx8IFwiXCI7XG4gICAgICAgIHRoaXMuX2luaXRCb2R5KGJvZHlJbml0KTtcbiAgICAgIH07XG5cbiAgICAgIEJvZHkuY2FsbChSZXNwb25zZS5wcm90b3R5cGUpO1xuXG4gICAgICBSZXNwb25zZS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZSh0aGlzLl9ib2R5SW5pdCwge1xuICAgICAgICAgIHN0YXR1czogdGhpcy5zdGF0dXMsXG4gICAgICAgICAgc3RhdHVzVGV4dDogdGhpcy5zdGF0dXNUZXh0LFxuICAgICAgICAgIGhlYWRlcnM6IG5ldyBIZWFkZXJzKHRoaXMuaGVhZGVycyksXG4gICAgICAgICAgdXJsOiB0aGlzLnVybFxuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIFJlc3BvbnNlLmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZXNwb25zZSA9IG5ldyBSZXNwb25zZShudWxsLCB7IHN0YXR1czogMCwgc3RhdHVzVGV4dDogXCJcIiB9KTtcbiAgICAgICAgcmVzcG9uc2UudHlwZSA9IFwiZXJyb3JcIjtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfTtcblxuICAgICAgdmFyIHJlZGlyZWN0U3RhdHVzZXMgPSBbMzAxLCAzMDIsIDMwMywgMzA3LCAzMDhdO1xuXG4gICAgICBSZXNwb25zZS5yZWRpcmVjdCA9IGZ1bmN0aW9uKHVybCwgc3RhdHVzKSB7XG4gICAgICAgIGlmIChyZWRpcmVjdFN0YXR1c2VzLmluZGV4T2Yoc3RhdHVzKSA9PT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkludmFsaWQgc3RhdHVzIGNvZGVcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtcbiAgICAgICAgICBzdGF0dXM6IHN0YXR1cyxcbiAgICAgICAgICBoZWFkZXJzOiB7IGxvY2F0aW9uOiB1cmwgfVxuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIHNlbGYuSGVhZGVycyA9IEhlYWRlcnM7XG4gICAgICBzZWxmLlJlcXVlc3QgPSBSZXF1ZXN0O1xuICAgICAgc2VsZi5SZXNwb25zZSA9IFJlc3BvbnNlO1xuXG4gICAgICBzZWxmLmZldGNoID0gZnVuY3Rpb24oaW5wdXQsIGluaXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoaW5wdXQsIGluaXQpO1xuICAgICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIHN0YXR1czogYW55O1xuICAgICAgICAgICAgICBzdGF0dXNUZXh0OiBhbnk7XG4gICAgICAgICAgICAgIGhlYWRlcnM6IGFueTtcbiAgICAgICAgICAgICAgdXJsPzogYW55O1xuICAgICAgICAgICAgfSA9IHtcbiAgICAgICAgICAgICAgc3RhdHVzOiB4aHIuc3RhdHVzLFxuICAgICAgICAgICAgICBzdGF0dXNUZXh0OiB4aHIuc3RhdHVzVGV4dCxcbiAgICAgICAgICAgICAgaGVhZGVyczogcGFyc2VIZWFkZXJzKHhoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSB8fCBcIlwiKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG9wdGlvbnMudXJsID1cbiAgICAgICAgICAgICAgXCJyZXNwb25zZVVSTFwiIGluIHhoclxuICAgICAgICAgICAgICAgID8geGhyLnJlc3BvbnNlVVJMXG4gICAgICAgICAgICAgICAgOiBvcHRpb25zLmhlYWRlcnMuZ2V0KFwiWC1SZXF1ZXN0LVVSTFwiKTtcbiAgICAgICAgICAgIHZhciBib2R5ID0gXCJyZXNwb25zZVwiIGluIHhociA/IHhoci5yZXNwb25zZSA6IHhoci5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICByZXNvbHZlKG5ldyBSZXNwb25zZShib2R5LCBvcHRpb25zKSk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcihcIk5ldHdvcmsgcmVxdWVzdCBmYWlsZWRcIikpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB4aHIub250aW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcihcIk5ldHdvcmsgcmVxdWVzdCBmYWlsZWRcIikpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB4aHIub3BlbihyZXF1ZXN0Lm1ldGhvZCwgcmVxdWVzdC51cmwsIHRydWUpO1xuXG4gICAgICAgICAgaWYgKHJlcXVlc3QuY3JlZGVudGlhbHMgPT09IFwiaW5jbHVkZVwiKSB7XG4gICAgICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoXCJyZXNwb25zZVR5cGVcIiBpbiB4aHIgJiYgc3VwcG9ydC5ibG9iKSB7XG4gICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gXCJibG9iXCI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVxdWVzdC5oZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHhoci5zZW5kKFxuICAgICAgICAgICAgdHlwZW9mIHJlcXVlc3QuX2JvZHlJbml0ID09PSBcInVuZGVmaW5lZFwiID8gbnVsbCA6IHJlcXVlc3QuX2JvZHlJbml0XG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgc2VsZi5mZXRjaC5wb2x5ZmlsbCA9IHRydWU7XG4gICAgfSkodHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdGhpcyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmV0Y2g6IHNlbGYuZmV0Y2gsXG4gICAgICBIZWFkZXJzOiBzZWxmLkhlYWRlcnMsXG4gICAgICBSZXF1ZXN0OiBzZWxmLlJlcXVlc3QsXG4gICAgICBSZXNwb25zZTogc2VsZi5SZXNwb25zZVxuICAgIH07XG4gIH0pKCk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBmZXRjaFBvbnlmaWxsO1xuIiwiaW1wb3J0IGZldGNoUG9ueWZpbGwgZnJvbSBcIi4uL3ZlbmRvci9mZXRjaFBvbnlmaWxsXCI7XG5cbnR5cGUgUmVxdWVzdEluaXRpYWxpemF0aW9uT2JqZWN0ID0ge1xuICBlbmRwb2ludD86IHN0cmluZztcbiAgb3B0aW9ucz86IFJlcXVlc3RJbml0O1xuICBib2R5PzogRm9ybURhdGE7XG59O1xuXG5jbGFzcyBSZXF1ZXN0IHtcbiAgLy8gUHJvcGVydHkgdHlwZXNcbiAgZW5kcG9pbnQ6IHN0cmluZztcbiAgb3B0aW9uczogUmVxdWVzdEluaXQ7XG4gIGJvZHk6IEZvcm1EYXRhO1xuXG4gIC8vIFN0YXRpYyBwcm9wZXJ0aWVzXG4gIC8qKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXIge29iamVjdH0gUmVxdWVzdC5kZWZhdWx0T3B0aW9ucyBPcHRpb25zIG9iamVjdCB0byBmYWxsYmFjayB0byBpZlxuICAgKiBubyBvcHRpb25zIHByb3BlcnR5IGlzIHBhc3NlZCBpbnRvIHRoZSBjb25zdHJ1Y3RvciBjb25maWcgb2JqZWN0LlxuICAgKi9cbiAgc3RhdGljIGRlZmF1bHRPcHRpb25zOiBSZXF1ZXN0SW5pdCA9IHtcbiAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgaGVhZGVyczogeyBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiIH1cbiAgfTtcblxuICAvLyBDb25zdHJ1Y3RvclxuICAvKipcbiAgICogQGNsYXNzIFJlcXVlc3RcbiAgICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZ1xuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmVuZHBvaW50XG4gICAqIEBwYXJhbSB7b2JqZWN0fSBbY29uZmlnLm9wdGlvbnNdXG4gICAqIEBwYXJhbSB7Rm9ybURhdGF9IFtjb25maWcuYm9keV1cbiAgICovXG4gIGNvbnN0cnVjdG9yKHsgZW5kcG9pbnQsIG9wdGlvbnMsIGJvZHkgfTogUmVxdWVzdEluaXRpYWxpemF0aW9uT2JqZWN0KSB7XG4gICAgdGhpcy5lbmRwb2ludCA9IGVuZHBvaW50O1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwgUmVxdWVzdC5kZWZhdWx0T3B0aW9ucztcbiAgICB0aGlzLmJvZHkgPSBib2R5O1xuICB9XG4gIC8vIFByaXZhdGUgbWV0aG9kc1xuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogQGZ1bmN0aW9uIFJlcXVlc3QucHJlcGFyZUZldGNoT3B0aW9uc1xuICAgKiBAZGVzY3JpcHRpb24gQ3JlYXRlcyBibGFuayBGb3JtRGF0YSBvYmplY3QgaWYgdGhpcy5ib2R5IGlzIHVuZGVmaW5lZCBhbmRcbiAgICogdGhpcy5vcHRpb25zLm1ldGhvZCBpcyBlcXVhbCB0byBcIlBPU1RcIi5cbiAgICogQHJldHVybnMge0Zvcm1EYXRhfVxuICAgKi9cbiAgcHJpdmF0ZSBwcmVwYXJlRmV0Y2hPcHRpb25zID0gKCkgPT4ge1xuICAgIGlmICghdGhpcy5ib2R5ICYmIHRoaXMub3B0aW9ucy5tZXRob2QgPT09IFwiUE9TVFwiKSB7XG4gICAgICB0aGlzLmJvZHkgPSBuZXcgRm9ybURhdGEoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYm9keTtcbiAgfTtcbiAgLy8gUHVibGljIG1ldGhvZHNcbiAgLyoqXG4gICAqIEBwdWJsaWNcbiAgICogQGZ1bmN0aW9uIFJlcXVlc3Quc2VuZFxuICAgKiBAcGFyYW1cdHtvYmplY3R9IG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5hc3luY10gQWxsb3dzIHByb3BlcnR5IGBhc3luY2AgdG8gYmUgc2V0IHRvIGluZGljYXRlIHRoZVxuICAgKiByZXNwb25zZSBzaG91bGQgYmUgcHJlcGFyZWQgYmVmb3JlIHJldHVybmluZy5cbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBwdWJsaWMgc2VuZCA9ICh7IGFzeW5jIH06IHsgYXN5bmM6IGJvb2xlYW4gfSA9IHsgYXN5bmM6IGZhbHNlIH0pID0+IHtcbiAgICBjb25zdCB7IGZldGNoIH0gPSB3aW5kb3dcbiAgICAgID8gd2luZG93LmZldGNoID8gd2luZG93IDogZmV0Y2hQb255ZmlsbCh7fSkuZmV0Y2hcbiAgICAgIDoge1xuICAgICAgICAgIGZldGNoOiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJmZXRjaCBpcyBub3Qgc3VwcG9ydGVkXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICBjb25zdCBwcmVwYXJlZE9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB0aGlzLnByZXBhcmVGZXRjaE9wdGlvbnMoKSxcbiAgICAgIHRoaXMub3B0aW9uc1xuICAgICk7XG4gICAgY29uc3QgaW5pdEZldGNoID0gZmV0Y2godGhpcy5lbmRwb2ludCwgcHJlcGFyZWRPcHRpb25zKTtcbiAgICByZXR1cm4gYXN5bmMgPyBpbml0RmV0Y2gudGhlbihyZXMgPT4gcmVzLmpzb24oKSkgOiBpbml0RmV0Y2g7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IFJlcXVlc3Q7XG4iLCIvKipcbiAqIEBtb2R1bGUgZGF0YU1hbmlwdWxhdGlvblxuICovXG5cbnR5cGUgYWxwaGFudW1lcmljID0gc3RyaW5nIHwgbnVtYmVyO1xuXG4vKipcbiAqIEBmdW5jdGlvbiBzZWFyY2hQcm9wUGF0aFxuICogQGRlc2NyaXB0aW9uIFJlY3Vyc2l2ZWx5IHNlYXJjaHMgdGhyb3VnaCBhIGRhdGEgb2JqZWN0XG4gKiBAcGFyYW0ge2FscGhhbnVtZXJpY1tdfSBbcGF0aF0gQXJyYXkgb2Yga2V5cyBpbiB0aGUgb3JkZXIgb2Ygd2hpY2ggd2lsbCBiZSB1c2VkIHRvIHJlY3Vyc2l2ZWx5IHNlYXJjaCBhbiBvYmplY3RcbiAqIEBwYXJhbSB7b2JqZWN0fSBbY29sbGVjdGlvbl0gRGF0YSBvYmplY3RcbiAqIEByZXR1cm4ge2FueX0gVmFsdWUgYXQgdGhlIGVuZCBvZiB0aGUgc2VhcmNoZWQgcHJvcGVydHkgcGF0aDsgXG4gKi9cbmNvbnN0IHNlYXJjaFByb3BQYXRoID0gKHBhdGg6IGFscGhhbnVtZXJpY1tdLCBjb2xsZWN0aW9uOiBvYmplY3QpOiBhbnkgPT4ge1xuICBsZXQgcGF0aFJlc3VsdCA9IGNvbGxlY3Rpb247XG4gIHBhdGguZm9yRWFjaChrZXkgPT4ge1xuICAgIHBhdGhSZXN1bHQgPSBwYXRoUmVzdWx0W2tleV07XG4gIH0pO1xuICByZXR1cm4gcGF0aFJlc3VsdCA/IHBhdGhSZXN1bHQgOiBmYWxzZTtcbn07XG5cbmV4cG9ydCB7IHNlYXJjaFByb3BQYXRoIH0iLCIvKipcbiAqIEBtb2R1bGUgcGFyc2VcbiAqL1xuXG4vKipcbiAqIEJhc2UgZnJvbSBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9nZW9mZmRhdmlzOTIvMWRhN2QwNzQ1ZTNiYmEwMzZmOTRcbiAqIEBmdW5jdGlvbiBwYXJhbXNcbiAqIEBkZXNjcmlwdGlvbiBDcmVhdGVzIG9iamVjdCBvZiBrZXkvdmFsdWUgcGFpcnMgZnJvbSBVUkwgcGFyYW1ldGVycy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbdXJsXSBVUkwgdG8gcGFyc2U7IGRlZmF1bHRzIHRvIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2guXG4gKiBAcmV0dXJuIHtvYmplY3R9IE9iamVjdCBvZiBrZXkvdmFsdWUgcGFpcnMuXG4gKi9cbmNvbnN0IHBhcmFtcyA9ICh1cmw6IHN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpOiBvYmplY3QgPT5cbiAgdXJsXG4gICAgLnNwbGl0KFwiP1wiKVsxXVxuICAgIC5zcGxpdChcIiZcIilcbiAgICAubWFwKHEgPT4gcS5zcGxpdChcIj1cIikpXG4gICAgLnJlZHVjZSgoYWNjLCBba2V5LCB2YWxdLCBpLCBhcnIpID0+IHtcbiAgICAgIGFjY1trZXldID0gZGVjb2RlVVJJQ29tcG9uZW50KHZhbCkucmVwbGFjZSgvXFwrL2csIFwiIFwiKTtcbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwge30pO1xuXG4vKipcbiAqIEBmdW5jdGlvbiBwYXJzZUV4dGVybmFsTWFya2Rvd25MaW5rc1xuICogQGRlc2NyaXB0aW9uIFRyYW5zZm9ybXMgTWFya2Rvd24gbGlua3MgdG8gdXNlIHRhcmdldD1cIl9ibGFua1wiLCByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI7XG4gKiB1c3VhbGx5IHVzZWQgd2hlbiBpbXBsZW1lbnRpbmcgY2xpZW50c2lkZSBNYXJrZG93biwgYmVmb3JlIHNlbmRpbmcgdGhlIE1hcmtkb3duIHRvIHRoZSBtYWluXG4gKiBwYXJzaW5nIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBTdHJpbmcgdG8gcGFyc2UgYXMgTWFya2Rvd24gbGluay5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IEhUTUwgbGluayB3aXRoIFVSTCBhbmQgaW5uZXJUZXh0LCB0YXJnZXQgYW5kIHJlbCBhdHRyaWJ1dGVzIHByb3Blcmx5IHNldCBmb3JcbiAqIGFuIGV4dGVybmFsIGxpbmsuXG4gKi9cbmNvbnN0IHBhcnNlRXh0ZXJuYWxNYXJrZG93bkxpbmtzID0gKHN0cmluZzogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgY29uc3QgcGF0dGVybjogUmVnRXhwID0gL1xcWyhbXlxcXV0rKVxcXVxcKChbXildKylcXCkvZztcbiAgaWYgKHN0cmluZy5zZWFyY2gocGF0dGVybikgPiAtMSkge1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZShcbiAgICAgIHBhdHRlcm4sXG4gICAgICAnPGEgaHJlZj1cIiQyXCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPiQxPC9hPidcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHJpbmc7XG4gIH1cbn07XG5cbmV4cG9ydCB7IHBhcmFtcyBhcyBwYXJzZVVSTFBhcmFtcywgcGFyc2VFeHRlcm5hbE1hcmtkb3duTGlua3MgfTtcbiIsIi8qKlxuICogQG1vZHVsZSBzY3JvbGxcbiAqL1xuXG4vKipcbiAqIEBmdW5jdGlvbiBpc0VsZW1lbnRJblZpZXdwb3J0XG4gKiBAZGVzY3JpcHRpb24gRGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQgaXMgcGFydGlhbGx5IG9yXG4gKiBmdWxseSB2aXNpYmxlIGluIHRoZSB2aWV3cG9ydC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAqIEBwYXJhbSB7RWxlbWVudH0gY29uZmlnLmVsZW1lbnQgSFRNTCBFbGVtZW50IG5vZGUgdG8gdGFyZ2V0LlxuICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcudGhyZXNob2xkXSBSYXRpbyBvZiB0aGUgdmlld3BvcnQgaGVpZ2h0IHRoZSBlbGVtZW50XG4gKiBtdXN0IGZpbGwgYmVmb3JlIGJlaW5nIGNvbnNpZGVyZWQgdmlzaWJsZS4gRS5nLiAwLjUgbWVhbnMgdGhlIGVsZW1lbnRcbiAqIG11c3QgdGFrZSB1cCA1MCUgb2YgdGhlIHNjcmVlbiBiZWZvcmUgcmV0dXJuaW5nIHRydWUuIERlZmF1bHRzIHRvIDAuMjUuXG4gKiBPbmx5IHVzZWQgZm9yIGVsZW1lbnRzIHRhbGxlciB0aGFuIHRoZSB2aWV3cG9ydC5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IEJvb2xlYW4gZGVzY3JpYmluZyBpZiBpbnB1dCBpcyBmdWxseS9wYXJ0aWFsbHlcbiAqIGluIHRoZSB2aWV3cG9ydCwgcmVsYXRpdmUgdG8gdGhlIHRocmVzaG9sZCBzZXR0aW5nLlxuICovXG5mdW5jdGlvbiBpc0VsZW1lbnRJblZpZXdwb3J0KHtcbiAgZWxlbWVudDogYXJnRWxlbWVudCxcbiAgdGhyZXNob2xkOiBhcmdUaHJlc2hvbGRcbn06IHtcbiAgZWxlbWVudDogRWxlbWVudDtcbiAgdGhyZXNob2xkOiBudW1iZXI7XG59KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRlZmF1bHRQYXJhbXM6IHtcbiAgICB0aHJlc2hvbGQ6IG51bWJlcjtcbiAgfSA9IHtcbiAgICB0aHJlc2hvbGQ6IDAuMjVcbiAgfTtcblxuICBjb25zdCBzYWZlQXJncyA9IHtcbiAgICB0aHJlc2hvbGQ6IGFyZ1RocmVzaG9sZCB8fCBkZWZhdWx0UGFyYW1zLnRocmVzaG9sZFxuICB9O1xuXG4gIGNvbnN0IHJlY3Q6IENsaWVudFJlY3QgfCBET01SZWN0ID0gYXJnRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICBjb25zdCB2aWV3cG9ydEhlaWdodDogbnVtYmVyID0gTWF0aC5tYXgoXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCxcbiAgICB3aW5kb3cuaW5uZXJIZWlnaHQgfHwgMFxuICApO1xuICBjb25zdCB7IHRocmVzaG9sZCB9ID0gc2FmZUFyZ3M7XG5cbiAgaWYgKHRocmVzaG9sZCA8IDAgfHwgdGhyZXNob2xkID4gMSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFxuICAgICAgXCJUaHJlc2hvbGQgYXJndW1lbnQgbXVzdCBiZSBhIGRlY2ltYWwgYmV0d2VlbiAwIGFuZCAxXCJcbiAgICApO1xuICB9XG5cbiAgLy9JZiB0aGUgZWxlbWVudCBpcyB0b28gdGFsbCB0byBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydFxuICBpZiAocmVjdC5oZWlnaHQgPj0gdGhyZXNob2xkICogdmlld3BvcnRIZWlnaHQpIHtcbiAgICBpZiAoXG4gICAgICByZWN0LnRvcCAtIHZpZXdwb3J0SGVpZ2h0IDw9IHRocmVzaG9sZCAqIHZpZXdwb3J0SGVpZ2h0ICogLTEgJiZcbiAgICAgIHJlY3QuYm90dG9tID49IHRocmVzaG9sZCAqIHZpZXdwb3J0SGVpZ2h0XG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvL0lmIHRoZSBlbGVtZW50IGlzIHNob3J0IGVub3VnaCB0byBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydFxuICAgIGlmIChyZWN0LnRvcCA+PSAwICYmIHJlY3QuYm90dG9tIC0gdmlld3BvcnRIZWlnaHQgPD0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBGcm9tIGh0dHA6Ly9iaXQubHkvMmNQNjVmRFxuICogQHRvZG8gQ2xhc3NpZnkgYW5kIGRlc2NyaWJlIHBhcmFtcy5cbiAqIEBmdW5jdGlvbiBzY3JvbGxUb1xuICogQGRlc2NyaXB0aW9uIFNjcm9sbHMgZ2l2ZW4gZWxlbWVudCB0byBkZXRlcm1pbmVkIHBvaW50LlxuICogQHBhcmFtICB7RWxlbWVudH0gZWxlbWVudCAgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7bnVtYmVyfSB0byAgICAgICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGR1cmF0aW9uIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIHNjcm9sbFRvKGVsZW1lbnQ6IEVsZW1lbnQsIHRvOiBudW1iZXIsIGR1cmF0aW9uOiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKGR1cmF0aW9uIDw9IDApIHJldHVybjtcbiAgY29uc3QgZGlmZmVyZW5jZTogbnVtYmVyID0gdG8gLSBlbGVtZW50LnNjcm9sbFRvcDtcbiAgY29uc3QgcGVyVGljazogbnVtYmVyID0gZGlmZmVyZW5jZSAvIGR1cmF0aW9uICogMTA7XG5cbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICBlbGVtZW50LnNjcm9sbFRvcCA9IGVsZW1lbnQuc2Nyb2xsVG9wICsgcGVyVGljaztcbiAgICBpZiAoZWxlbWVudC5zY3JvbGxUb3AgPT09IHRvKSByZXR1cm47XG4gICAgc2Nyb2xsVG8oZWxlbWVudCwgdG8sIGR1cmF0aW9uIC0gMTApO1xuICB9LCAxMCk7XG59XG5cbmV4cG9ydCB7IGlzRWxlbWVudEluVmlld3BvcnQsIHNjcm9sbFRvIH07XG4iLCIvKipcbiAqIEBtb2R1bGUgc2VsZWN0XG4gKi9cblxuLyoqXG4gKiBAZnVuY3Rpb24gc2VsZWN0XG4gKiBAZGVzY3JpcHRpb24gU2VsZWN0cyBhIERPTSBub2RlIGJhc2VkIG9uIGEgcXVlcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30gcXVlcnkgcXVlcnkgc2VsZWN0b3IgdG8gdXNlIHRvIHF1ZXJ5IGFuIG5vZGUuXG4gKiBAcmV0dXJucyB7RWxlbWVudH0gRmlyc3QgRE9NIG5vZGUgdGhhdCBtYXRjaGVzIHRoZSBxdWVyeS5cbiAqL1xuY29uc3Qgc2VsZWN0OiBGdW5jdGlvbiA9IChxdWVyeTogc3RyaW5nKTogRWxlbWVudCA9PlxuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHF1ZXJ5KTtcblxuLyoqXG4gKiBAZnVuY3Rpb24gc2VsZWN0QWxsXG4gKiBAZGVzY3JpcHRpb24gU2VsZWN0cyBhIERPTSBub2RlbGlzdCBiYXNlZCBvbiBhIHF1ZXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IHF1ZXJ5IHNlbGVjdG9yIHRvIHVzZSB0byBxdWVyeSBhIG5vZGVsaXN0LlxuICogQHJldHVybnMge0VsZW1lbnRbXX0gQXJyYXkgb2YgRE9NIG5vZGVzIHRoYXQgbWF0Y2ggdGhlIHF1ZXJ5LlxuICovXG5jb25zdCBzZWxlY3RBbGw6IEZ1bmN0aW9uID0gKHF1ZXJ5OiBzdHJpbmcpOiBFbGVtZW50W10gPT4gW1xuICAuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KVxuXTtcblxuLyoqXG4gKiBAZnVuY3Rpb24gc2VsZWN0QnlJZFxuICogQGRlc2NyaXB0aW9uIFNlbGVjdHMgYSBET00gbm9kZSBiYXNlZCBvbiBhbiBJRCBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgSUQgb2YgRE9NIG5vZGUgdG8gc2VsZWN0LlxuICogQHJldHVybnMge0VsZW1lbnR9IERPTSBub2RlIHdpdGggbWF0Y2hlZCBJRC5cbiAqL1xuY29uc3Qgc2VsZWN0QnlJZDogRnVuY3Rpb24gPSAoaWQ6IHN0cmluZyk6IEVsZW1lbnQgPT5cbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuXG5leHBvcnQgeyBzZWxlY3QsIHNlbGVjdEFsbCwgc2VsZWN0QnlJZCB9O1xuIiwiLyoqXG4gKiBAbW9kdWxlIHR5cG9ncmFwaHlcbiAqL1xuXG4vKipcbiAqIEBmdW5jdGlvbiBjYXBpdGFsaXplXG4gKiBAZGVzY3JpcHRpb24gQ2FwaXRhbGl6ZXMgYWxsIHdvcmRzIGluIGEgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBUZXh0IHRvIGNhcGl0YWxpemUuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBUaXRsZS1jYXNlZCB0ZXh0LlxuICovXG5jb25zdCBjYXBpdGFsaXplID0gKHN0cmluZzogc3RyaW5nKTogc3RyaW5nID0+XG4gIHN0cmluZ1xuICAgIC5zcGxpdChcIiBcIilcbiAgICAubWFwKHMgPT4gdWNGaXJzdChzKSlcbiAgICAuam9pbihcIiBcIik7XG5cbi8qKlxuICogQGZ1bmN0aW9uIHNsdWdpZnlcbiAqIEBkZXNjcmlwdGlvbiBMb3dlcmNhc2VzIHN0cmluZywgcmVwbGFjZXMgc3BhY2VzIGFuZCBzcGVjaWFsIGNoYXJhY3RlcnNcbiAqIHdpdGggYSBzZXQgZGVsaW1pdGVyLlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRUb1NsdWcgVGV4dCB0byBzbHVnaWZ5LlxuICogQHBhcmFtIHtzdHJpbmd9IFtkZWxpbWl0ZXJdIERlbGltaXRlcjsgZGVmYXVsdHMgdG8gXCItXCIuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBTbHVnaWZpZWQgdGV4dC5cbiAqL1xuY29uc3Qgc2x1Z2lmeSA9ICh0ZXh0VG9TbHVnOiBzdHJpbmcsIGRlbGltaXRlcjogc3RyaW5nID0gXCItXCIpOiBzdHJpbmcgPT5cbiAgdGV4dFRvU2x1Z1xuICAgIC5yZXBsYWNlKC8oXFwhfCN8XFwkfCV8XFwqfFxcLnxcXC98XFxcXHxcXCh8XFwpfFxcK3xcXHx8XFwsfFxcOnxcXCd8XFxcIikvZywgXCJcIilcbiAgICAucmVwbGFjZSgvKC4pKFxcc3xcXF98XFwtKSsoLikvZywgYCQxJHtkZWxpbWl0ZXJ9JDNgKVxuICAgIC50b0xvd2VyQ2FzZSgpO1xuXG4vKipcbiAqIEBmdW5jdGlvbiB0cmltXG4gKiBAZGVzY3JpcHRpb24gVHJpbXMgd2hpdGVzcGFjZSBvbiBlaXRoZXIgZW5kIG9mIGEgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBUZXh0IHRvIHRyaW0uXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBUcmltbWVkIHRleHQuXG4gKi9cbmNvbnN0IHRyaW0gPSAoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcgPT4gc3RyaW5nLnJlcGxhY2UoL15cXHMrfFxccyskL2csIFwiXCIpO1xuXG4vKipcbiAqIEBmdW5jdGlvbiB1Y0ZpcnN0XG4gKiBAZGVzY3JpcHRpb24gQ2FwaXRhbGl6ZXMgZmlyc3Qgd29yZCBpbiBhIHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGV4dCB0byBjYXBpdGFsaXplLlxuICogQHJldHVybnMge3N0cmluZ30gQ2FwaXRhbGl6ZWQgdGV4dC5cbiAqL1xuY29uc3QgdWNGaXJzdCA9IChbZmlyc3RMZXR0ZXIsIC4uLnJlc3RMZXR0ZXJzXTogc3RyaW5nKTogc3RyaW5nID0+XG4gIGAke2ZpcnN0TGV0dGVyLnRvVXBwZXJDYXNlKCl9JHtyZXN0TGV0dGVycy5qb2luKFwiXCIpfWA7XG5cbmV4cG9ydCB7IGNhcGl0YWxpemUsIHNsdWdpZnksIHRyaW0sIHVjRmlyc3QgfTtcbiJdLCJuYW1lcyI6WyJmZXRjaFBvbnlmaWxsIiwib3B0aW9ucyIsIndpbmRvdyIsInNlbGYiLCJnbG9iYWwiLCJQcm9taXNlIiwiWE1MSHR0cFJlcXVlc3QiLCJPYmplY3QiLCJjcmVhdGUiLCJ1bmRlZmluZWQiLCJmZXRjaCIsInN1cHBvcnQiLCJTeW1ib2wiLCJCbG9iIiwiZSIsImFycmF5QnVmZmVyIiwidmlld0NsYXNzZXMiLCJpc0RhdGFWaWV3Iiwib2JqIiwiRGF0YVZpZXciLCJwcm90b3R5cGUiLCJpc1Byb3RvdHlwZU9mIiwiaXNBcnJheUJ1ZmZlclZpZXciLCJBcnJheUJ1ZmZlciIsImlzVmlldyIsImluZGV4T2YiLCJ0b1N0cmluZyIsImNhbGwiLCJuYW1lIiwiU3RyaW5nIiwidGVzdCIsIlR5cGVFcnJvciIsInRvTG93ZXJDYXNlIiwidmFsdWUiLCJpdGVtcyIsIml0ZXJhdG9yIiwic2hpZnQiLCJkb25lIiwiaXRlcmFibGUiLCJoZWFkZXJzIiwibWFwIiwiSGVhZGVycyIsImZvckVhY2giLCJhcHBlbmQiLCJBcnJheSIsImlzQXJyYXkiLCJoZWFkZXIiLCJnZXRPd25Qcm9wZXJ0eU5hbWVzIiwibm9ybWFsaXplTmFtZSIsIm5vcm1hbGl6ZVZhbHVlIiwib2xkVmFsdWUiLCJnZXQiLCJoYXMiLCJoYXNPd25Qcm9wZXJ0eSIsInNldCIsImNhbGxiYWNrIiwidGhpc0FyZyIsImtleXMiLCJwdXNoIiwiaXRlcmF0b3JGb3IiLCJ2YWx1ZXMiLCJlbnRyaWVzIiwiYm9keSIsImJvZHlVc2VkIiwicmVqZWN0IiwicmVhZGVyIiwicmVzb2x2ZSIsIm9ubG9hZCIsInJlc3VsdCIsIm9uZXJyb3IiLCJlcnJvciIsImJsb2IiLCJGaWxlUmVhZGVyIiwicHJvbWlzZSIsImZpbGVSZWFkZXJSZWFkeSIsInJlYWRBc0FycmF5QnVmZmVyIiwicmVhZEFzVGV4dCIsImJ1ZiIsInZpZXciLCJVaW50OEFycmF5IiwiY2hhcnMiLCJsZW5ndGgiLCJpIiwiZnJvbUNoYXJDb2RlIiwiam9pbiIsInNsaWNlIiwiYnl0ZUxlbmd0aCIsImJ1ZmZlciIsIl9pbml0Qm9keSIsIl9ib2R5SW5pdCIsIl9ib2R5VGV4dCIsIl9ib2R5QmxvYiIsImZvcm1EYXRhIiwiRm9ybURhdGEiLCJfYm9keUZvcm1EYXRhIiwic2VhcmNoUGFyYW1zIiwiVVJMU2VhcmNoUGFyYW1zIiwiX2JvZHlBcnJheUJ1ZmZlciIsImJ1ZmZlckNsb25lIiwiRXJyb3IiLCJ0eXBlIiwicmVqZWN0ZWQiLCJjb25zdW1lZCIsInRoZW4iLCJyZWFkQmxvYkFzQXJyYXlCdWZmZXIiLCJ0ZXh0IiwicmVhZEJsb2JBc1RleHQiLCJyZWFkQXJyYXlCdWZmZXJBc1RleHQiLCJkZWNvZGUiLCJqc29uIiwiSlNPTiIsInBhcnNlIiwibWV0aG9kcyIsIm1ldGhvZCIsInVwY2FzZWQiLCJ0b1VwcGVyQ2FzZSIsImlucHV0IiwiUmVxdWVzdCIsInVybCIsImNyZWRlbnRpYWxzIiwibW9kZSIsIm5vcm1hbGl6ZU1ldGhvZCIsInJlZmVycmVyIiwiY2xvbmUiLCJmb3JtIiwidHJpbSIsInNwbGl0IiwiYnl0ZXMiLCJyZXBsYWNlIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwicmF3SGVhZGVycyIsImxpbmUiLCJwYXJ0cyIsImtleSIsIlJlc3BvbnNlIiwiYm9keUluaXQiLCJzdGF0dXMiLCJvayIsInN0YXR1c1RleHQiLCJyZXNwb25zZSIsInJlZGlyZWN0U3RhdHVzZXMiLCJyZWRpcmVjdCIsIlJhbmdlRXJyb3IiLCJsb2NhdGlvbiIsImluaXQiLCJyZXF1ZXN0IiwieGhyIiwicGFyc2VIZWFkZXJzIiwiZ2V0QWxsUmVzcG9uc2VIZWFkZXJzIiwicmVzcG9uc2VVUkwiLCJyZXNwb25zZVRleHQiLCJvbnRpbWVvdXQiLCJvcGVuIiwid2l0aENyZWRlbnRpYWxzIiwicmVzcG9uc2VUeXBlIiwic2V0UmVxdWVzdEhlYWRlciIsInNlbmQiLCJwb2x5ZmlsbCIsImVuZHBvaW50IiwiYXN5bmMiLCJ3YXJuIiwicHJlcGFyZWRPcHRpb25zIiwicHJlcGFyZUZldGNoT3B0aW9ucyIsImluaXRGZXRjaCIsInJlcyIsImRlZmF1bHRPcHRpb25zIiwiQWNjZXB0Iiwic2VhcmNoUHJvcFBhdGgiLCJwYXRoIiwiY29sbGVjdGlvbiIsInBhdGhSZXN1bHQiLCJwYXJhbXMiLCJzZWFyY2giLCJxIiwicmVkdWNlIiwiYWNjIiwiYXJyIiwidmFsIiwicGFyc2VFeHRlcm5hbE1hcmtkb3duTGlua3MiLCJzdHJpbmciLCJwYXR0ZXJuIiwiYXJnRWxlbWVudCIsImVsZW1lbnQiLCJhcmdUaHJlc2hvbGQiLCJ0aHJlc2hvbGQiLCJkZWZhdWx0UGFyYW1zIiwic2FmZUFyZ3MiLCJyZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0Iiwidmlld3BvcnRIZWlnaHQiLCJNYXRoIiwibWF4IiwiZG9jdW1lbnQiLCJkb2N1bWVudEVsZW1lbnQiLCJjbGllbnRIZWlnaHQiLCJpbm5lckhlaWdodCIsImhlaWdodCIsInRvcCIsImJvdHRvbSIsInRvIiwiZHVyYXRpb24iLCJkaWZmZXJlbmNlIiwic2Nyb2xsVG9wIiwicGVyVGljayIsInNlbGVjdCIsInF1ZXJ5IiwicXVlcnlTZWxlY3RvciIsInNlbGVjdEFsbCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJzZWxlY3RCeUlkIiwiaWQiLCJnZXRFbGVtZW50QnlJZCIsImNhcGl0YWxpemUiLCJ1Y0ZpcnN0IiwicyIsInNsdWdpZnkiLCJ0ZXh0VG9TbHVnIiwiZGVsaW1pdGVyIiwiZmlyc3RMZXR0ZXIiLCJyZXN0TGV0dGVycyJdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7O0FBUUEsSUFBTUEsZ0JBQWdCLHNCQUFBLENBQXVCQyxPQUF2QjtRQUNoQkMsU0FBU0EsU0FBU0EsTUFBVCxHQUFrQixLQUEvQjtRQUNJQyxPQUFPLE9BQU9BLElBQVAsS0FBZ0IsV0FBaEIsR0FBK0JELFNBQVNBLE1BQVQsR0FBa0JFLE1BQWpELEdBQTJERCxJQUF0RTtRQUNJRSxVQUFXSixXQUFXQSxRQUFRSSxPQUFwQixJQUFnQ0YsS0FBS0UsT0FBbkQ7UUFDSUMsaUJBQ0RMLFdBQVdBLFFBQVFLLGNBQXBCLElBQXVDSCxLQUFLRyxjQUQ5QztRQUVJRixTQUFTRCxJQUFiO1dBRVE7WUFDRkEsT0FBT0ksT0FBT0MsTUFBUCxDQUFjSixNQUFkLEVBQXNCO21CQUN4Qjt1QkFDRUssU0FERjswQkFFSzs7U0FISCxDQUFYO1NBT0MsVUFBU04sSUFBVDtnQkFHS0EsS0FBS08sS0FBVCxFQUFnQjs7O2dCQUlaQyxVQUFVOzhCQUNFLHFCQUFxQlIsSUFEdkI7MEJBRUYsWUFBWUEsSUFBWixJQUFvQixjQUFjUyxNQUZoQztzQkFJVixnQkFBZ0JULElBQWhCLElBQ0EsVUFBVUEsSUFEVixJQUVDO3dCQUNLOzRCQUNFVSxJQUFKOytCQUNPLElBQVA7cUJBRkYsQ0FHRSxPQUFPQyxDQUFQLEVBQVU7K0JBQ0gsS0FBUDs7aUJBTEosRUFOVTswQkFjRixjQUFjWCxJQWRaOzZCQWVDLGlCQUFpQkE7YUFmaEM7Z0JBa0JJUSxRQUFRSSxXQUFaLEVBQXlCO29CQUNuQkMsY0FBYyxDQUNoQixvQkFEZ0IsRUFFaEIscUJBRmdCLEVBR2hCLDRC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
