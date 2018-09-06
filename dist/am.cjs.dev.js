'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

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
 * @description Recursively searchs through a data object; throws an error if the resulting value of a searched path is undefined.
 * @param {alphanumeric[]} path Array of keys in the order of which will be used to recursively search an object
 * @param {object} collection Data object
 * @param {string} [delimiter] Delimiter by which to split the path; defaults to '.'
 * @return {any} Value at the end of the searched property path;
 */
var searchPropPath = function searchPropPath(path, collection) {
    var delimiter = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : ".";

    var safePath = typeof path === "string" ? path.split(delimiter) : path;
    var pathResult = collection;
    safePath.forEach(function (key) {
        pathResult = pathResult[key];
    });
    if (pathResult) return pathResult;
    throw new Error("pathResult yields undefined value when searching " + safePath.join(delimiter) + " on collection argument.");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW0uY2pzLmRldi5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3ZlbmRvci9mZXRjaFBvbnlmaWxsLnRzIiwiLi4vc3JjL2NsYXNzZXMvUmVxdWVzdC50cyIsIi4uL3NyYy9mdW5jdGlvbnMvZGF0YU1hbmlwdWxhdGlvbi50cyIsIi4uL3NyYy9mdW5jdGlvbnMvcGFyc2UudHMiLCIuLi9zcmMvZnVuY3Rpb25zL3Njcm9sbC50cyIsIi4uL3NyYy9mdW5jdGlvbnMvc2VsZWN0LnRzIiwiLi4vc3JjL2Z1bmN0aW9ucy90eXBvZ3JhcGh5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29waWVkIGZyb20gbm9kZV9tb2R1bGVzL2ZldGNoLXBvbnlmaWxsL2J1aWxkL2ZldGNoLWJyb3dzZXIuanMuXG4gKlxuICogVHlwZXMgYWRkZWQgd2hlcmUgbmVjZXNzYXJ5LlxuICpcbiAqIE1vdmVkIG91dCBvZiBJSUZFIG1vZHVsZSB0eXBlLCBwbGFjZWQgYHNlbGZgIGRlY2xhcmF0aW9uIHRvIHRvcFxuICogb2YgYGZldGNoUG9ueWZpbGxgIGZ1bmN0aW9uIHNjb3BlLlxuICovXG5jb25zdCBmZXRjaFBvbnlmaWxsID0gZnVuY3Rpb24gZmV0Y2hQb255ZmlsbChvcHRpb25zKSB7XG4gIHZhciB3aW5kb3cgPSB3aW5kb3cgPyB3aW5kb3cgOiBmYWxzZTtcbiAgdmFyIHNlbGYgPSB0eXBlb2Ygc2VsZiA9PT0gXCJ1bmRlZmluZWRcIiA/ICh3aW5kb3cgPyB3aW5kb3cgOiBnbG9iYWwpIDogc2VsZjtcbiAgdmFyIFByb21pc2UgPSAob3B0aW9ucyAmJiBvcHRpb25zLlByb21pc2UpIHx8IHNlbGYuUHJvbWlzZTtcbiAgdmFyIFhNTEh0dHBSZXF1ZXN0ID1cbiAgICAob3B0aW9ucyAmJiBvcHRpb25zLlhNTEh0dHBSZXF1ZXN0KSB8fCBzZWxmLlhNTEh0dHBSZXF1ZXN0O1xuICB2YXIgZ2xvYmFsID0gc2VsZjtcblxuICByZXR1cm4gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gT2JqZWN0LmNyZWF0ZShnbG9iYWwsIHtcbiAgICAgIGZldGNoOiB7XG4gICAgICAgIHZhbHVlOiB1bmRlZmluZWQsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAoZnVuY3Rpb24oc2VsZikge1xuICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgIGlmIChzZWxmLmZldGNoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIHN1cHBvcnQgPSB7XG4gICAgICAgIHNlYXJjaFBhcmFtczogXCJVUkxTZWFyY2hQYXJhbXNcIiBpbiBzZWxmLFxuICAgICAgICBpdGVyYWJsZTogXCJTeW1ib2xcIiBpbiBzZWxmICYmIFwiaXRlcmF0b3JcIiBpbiBTeW1ib2wsXG4gICAgICAgIGJsb2I6XG4gICAgICAgICAgXCJGaWxlUmVhZGVyXCIgaW4gc2VsZiAmJlxuICAgICAgICAgIFwiQmxvYlwiIGluIHNlbGYgJiZcbiAgICAgICAgICAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBuZXcgQmxvYigpO1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pKCksXG4gICAgICAgIGZvcm1EYXRhOiBcIkZvcm1EYXRhXCIgaW4gc2VsZixcbiAgICAgICAgYXJyYXlCdWZmZXI6IFwiQXJyYXlCdWZmZXJcIiBpbiBzZWxmXG4gICAgICB9O1xuXG4gICAgICBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlcikge1xuICAgICAgICB2YXIgdmlld0NsYXNzZXMgPSBbXG4gICAgICAgICAgXCJbb2JqZWN0IEludDhBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgVWludDhBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgVWludDhDbGFtcGVkQXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IEludDE2QXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IFVpbnQxNkFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBJbnQzMkFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBVaW50MzJBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgRmxvYXQzMkFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBGbG9hdDY0QXJyYXldXCJcbiAgICAgICAgXTtcblxuICAgICAgICB2YXIgaXNEYXRhVmlldyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgIHJldHVybiBvYmogJiYgRGF0YVZpZXcucHJvdG90eXBlLmlzUHJvdG90eXBlT2Yob2JqKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaXNBcnJheUJ1ZmZlclZpZXcgPVxuICAgICAgICAgIEFycmF5QnVmZmVyLmlzVmlldyB8fFxuICAgICAgICAgIGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgb2JqICYmXG4gICAgICAgICAgICAgIHZpZXdDbGFzc2VzLmluZGV4T2YoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikpID4gLTFcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbm9ybWFsaXplTmFtZShuYW1lKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIG5hbWUgPSBTdHJpbmcobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKC9bXmEtejAtOVxcLSMkJSYnKisuXFxeX2B8fl0vaS50ZXN0KG5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgY2hhcmFjdGVyIGluIGhlYWRlciBmaWVsZCBuYW1lXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZVZhbHVlKHZhbHVlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuXG4gICAgICAvLyBCdWlsZCBhIGRlc3RydWN0aXZlIGl0ZXJhdG9yIGZvciB0aGUgdmFsdWUgbGlzdFxuICAgICAgZnVuY3Rpb24gaXRlcmF0b3JGb3IoaXRlbXMpIHtcbiAgICAgICAgdmFyIGl0ZXJhdG9yID0ge1xuICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gaXRlbXMuc2hpZnQoKTtcbiAgICAgICAgICAgIHJldHVybiB7IGRvbmU6IHZhbHVlID09PSB1bmRlZmluZWQsIHZhbHVlOiB2YWx1ZSB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoc3VwcG9ydC5pdGVyYWJsZSkge1xuICAgICAgICAgIGl0ZXJhdG9yW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVyYXRvcjtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBIZWFkZXJzKGhlYWRlcnMpIHtcbiAgICAgICAgdGhpcy5tYXAgPSB7fTtcblxuICAgICAgICBpZiAoaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMpIHtcbiAgICAgICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGhlYWRlcnMpKSB7XG4gICAgICAgICAgaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKGhlYWRlcikge1xuICAgICAgICAgICAgdGhpcy5hcHBlbmQoaGVhZGVyWzBdLCBoZWFkZXJbMV0pO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9IGVsc2UgaWYgKGhlYWRlcnMpIHtcbiAgICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhoZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIGhlYWRlcnNbbmFtZV0pO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpO1xuICAgICAgICB2YWx1ZSA9IG5vcm1hbGl6ZVZhbHVlKHZhbHVlKTtcbiAgICAgICAgdmFyIG9sZFZhbHVlID0gdGhpcy5tYXBbbmFtZV07XG4gICAgICAgIHRoaXMubWFwW25hbWVdID0gb2xkVmFsdWUgPyBvbGRWYWx1ZSArIFwiLFwiICsgdmFsdWUgOiB2YWx1ZTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24obmFtZSkge1xuICAgICAgICBkZWxldGUgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV07XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5oYXMobmFtZSkgPyB0aGlzLm1hcFtuYW1lXSA6IG51bGw7XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShub3JtYWxpemVOYW1lKG5hbWUpKTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldID0gbm9ybWFsaXplVmFsdWUodmFsdWUpO1xuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcy5tYXApIHtcbiAgICAgICAgICBpZiAodGhpcy5tYXAuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdGhpcy5tYXBbbmFtZV0sIG5hbWUsIHRoaXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgICAgaXRlbXMucHVzaChuYW1lKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcyk7XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGl0ZW1zLnB1c2godmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICAgIGl0ZW1zLnB1c2goW25hbWUsIHZhbHVlXSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpO1xuICAgICAgfTtcblxuICAgICAgaWYgKHN1cHBvcnQuaXRlcmFibGUpIHtcbiAgICAgICAgSGVhZGVycy5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXM7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGNvbnN1bWVkKGJvZHkpIHtcbiAgICAgICAgaWYgKGJvZHkuYm9keVVzZWQpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFR5cGVFcnJvcihcIkFscmVhZHkgcmVhZFwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgYm9keS5ib2R5VXNlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVqZWN0KHJlYWRlci5lcnJvcik7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlYWRCbG9iQXNBcnJheUJ1ZmZlcihibG9iKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgcHJvbWlzZSA9IGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpO1xuICAgICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoYmxvYik7XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiByZWFkQmxvYkFzVGV4dChibG9iKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgcHJvbWlzZSA9IGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpO1xuICAgICAgICByZWFkZXIucmVhZEFzVGV4dChibG9iKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlYWRBcnJheUJ1ZmZlckFzVGV4dChidWYpIHtcbiAgICAgICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWYpO1xuICAgICAgICB2YXIgY2hhcnMgPSBuZXcgQXJyYXkodmlldy5sZW5ndGgpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmlldy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNoYXJzW2ldID0gU3RyaW5nLmZyb21DaGFyQ29kZSh2aWV3W2ldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hhcnMuam9pbihcIlwiKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gYnVmZmVyQ2xvbmUoYnVmKSB7XG4gICAgICAgIGlmIChidWYuc2xpY2UpIHtcbiAgICAgICAgICByZXR1cm4gYnVmLnNsaWNlKDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmLmJ5dGVMZW5ndGgpO1xuICAgICAgICAgIHZpZXcuc2V0KG5ldyBVaW50OEFycmF5KGJ1ZikpO1xuICAgICAgICAgIHJldHVybiB2aWV3LmJ1ZmZlcjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBCb2R5KCkge1xuICAgICAgICB0aGlzLmJvZHlVc2VkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5faW5pdEJvZHkgPSBmdW5jdGlvbihib2R5KSB7XG4gICAgICAgICAgdGhpcy5fYm9keUluaXQgPSBib2R5O1xuICAgICAgICAgIGlmICghYm9keSkge1xuICAgICAgICAgICAgdGhpcy5fYm9keVRleHQgPSBcIlwiO1xuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGJvZHkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYmxvYiAmJiBCbG9iLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5QmxvYiA9IGJvZHk7XG4gICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIHN1cHBvcnQuZm9ybURhdGEgJiZcbiAgICAgICAgICAgIEZvcm1EYXRhLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5Rm9ybURhdGEgPSBib2R5O1xuICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJlxuICAgICAgICAgICAgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHkudG9TdHJpbmcoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIgJiYgc3VwcG9ydC5ibG9iICYmIGlzRGF0YVZpZXcoYm9keSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlBcnJheUJ1ZmZlciA9IGJ1ZmZlckNsb25lKGJvZHkuYnVmZmVyKTtcbiAgICAgICAgICAgIC8vIElFIDEwLTExIGNhbid0IGhhbmRsZSBhIERhdGFWaWV3IGJvZHkuXG4gICAgICAgICAgICB0aGlzLl9ib2R5SW5pdCA9IG5ldyBCbG9iKFt0aGlzLl9ib2R5QXJyYXlCdWZmZXJdKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgc3VwcG9ydC5hcnJheUJ1ZmZlciAmJlxuICAgICAgICAgICAgKEFycmF5QnVmZmVyLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpIHx8XG4gICAgICAgICAgICAgIGlzQXJyYXlCdWZmZXJWaWV3KGJvZHkpKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5fYm9keUFycmF5QnVmZmVyID0gYnVmZmVyQ2xvbmUoYm9keSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVuc3VwcG9ydGVkIEJvZHlJbml0IHR5cGVcIik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCF0aGlzLmhlYWRlcnMuZ2V0KFwiY29udGVudC10eXBlXCIpKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGJvZHkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgdGhpcy5oZWFkZXJzLnNldChcImNvbnRlbnQtdHlwZVwiLCBcInRleHQvcGxhaW47Y2hhcnNldD1VVEYtOFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUJsb2IgJiYgdGhpcy5fYm9keUJsb2IudHlwZSkge1xuICAgICAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KFwiY29udGVudC10eXBlXCIsIHRoaXMuX2JvZHlCbG9iLnR5cGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiZcbiAgICAgICAgICAgICAgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5oZWFkZXJzLnNldChcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiLFxuICAgICAgICAgICAgICAgIFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkO2NoYXJzZXQ9VVRGLThcIlxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoc3VwcG9ydC5ibG9iKSB7XG4gICAgICAgICAgdGhpcy5ibG9iID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKTtcbiAgICAgICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlCbG9iKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlBcnJheUJ1ZmZlcl0pKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgYmxvYlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlUZXh0XSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICB0aGlzLmFycmF5QnVmZmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjb25zdW1lZCh0aGlzKSB8fCBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUFycmF5QnVmZmVyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmJsb2IoKS50aGVuKHJlYWRCbG9iQXNBcnJheUJ1ZmZlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpO1xuICAgICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgICAgcmV0dXJuIHJlYWRCbG9iQXNUZXh0KHRoaXMuX2JvZHlCbG9iKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShcbiAgICAgICAgICAgICAgcmVhZEFycmF5QnVmZmVyQXNUZXh0KHRoaXMuX2JvZHlBcnJheUJ1ZmZlcilcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgdGV4dFwiKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5VGV4dCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzdXBwb3J0LmZvcm1EYXRhKSB7XG4gICAgICAgICAgdGhpcy5mb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oZGVjb2RlKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5qc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oSlNPTi5wYXJzZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIC8vIEhUVFAgbWV0aG9kcyB3aG9zZSBjYXBpdGFsaXphdGlvbiBzaG91bGQgYmUgbm9ybWFsaXplZFxuICAgICAgdmFyIG1ldGhvZHMgPSBbXCJERUxFVEVcIiwgXCJHRVRcIiwgXCJIRUFEXCIsIFwiT1BUSU9OU1wiLCBcIlBPU1RcIiwgXCJQVVRcIl07XG5cbiAgICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZU1ldGhvZChtZXRob2QpIHtcbiAgICAgICAgdmFyIHVwY2FzZWQgPSBtZXRob2QudG9VcHBlckNhc2UoKTtcbiAgICAgICAgcmV0dXJuIG1ldGhvZHMuaW5kZXhPZih1cGNhc2VkKSA+IC0xID8gdXBjYXNlZCA6IG1ldGhvZDtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gUmVxdWVzdChpbnB1dCwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgdmFyIGJvZHkgPSBvcHRpb25zLmJvZHk7XG5cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgUmVxdWVzdCkge1xuICAgICAgICAgIGlmIChpbnB1dC5ib2R5VXNlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkFscmVhZHkgcmVhZFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cmwgPSBpbnB1dC51cmw7XG4gICAgICAgICAgdGhpcy5jcmVkZW50aWFscyA9IGlucHV0LmNyZWRlbnRpYWxzO1xuICAgICAgICAgIGlmICghb3B0aW9ucy5oZWFkZXJzKSB7XG4gICAgICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhpbnB1dC5oZWFkZXJzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5tZXRob2QgPSBpbnB1dC5tZXRob2Q7XG4gICAgICAgICAgdGhpcy5tb2RlID0gaW5wdXQubW9kZTtcbiAgICAgICAgICBpZiAoIWJvZHkgJiYgaW5wdXQuX2JvZHlJbml0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGJvZHkgPSBpbnB1dC5fYm9keUluaXQ7XG4gICAgICAgICAgICBpbnB1dC5ib2R5VXNlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudXJsID0gU3RyaW5nKGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSBvcHRpb25zLmNyZWRlbnRpYWxzIHx8IHRoaXMuY3JlZGVudGlhbHMgfHwgXCJvbWl0XCI7XG4gICAgICAgIGlmIChvcHRpb25zLmhlYWRlcnMgfHwgIXRoaXMuaGVhZGVycykge1xuICAgICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tZXRob2QgPSBub3JtYWxpemVNZXRob2Qob3B0aW9ucy5tZXRob2QgfHwgdGhpcy5tZXRob2QgfHwgXCJHRVRcIik7XG4gICAgICAgIHRoaXMubW9kZSA9IG9wdGlvbnMubW9kZSB8fCB0aGlzLm1vZGUgfHwgbnVsbDtcbiAgICAgICAgdGhpcy5yZWZlcnJlciA9IG51bGw7XG5cbiAgICAgICAgaWYgKCh0aGlzLm1ldGhvZCA9PT0gXCJHRVRcIiB8fCB0aGlzLm1ldGhvZCA9PT0gXCJIRUFEXCIpICYmIGJvZHkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQm9keSBub3QgYWxsb3dlZCBmb3IgR0VUIG9yIEhFQUQgcmVxdWVzdHNcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faW5pdEJvZHkoYm9keSk7XG4gICAgICB9XG5cbiAgICAgIFJlcXVlc3QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVxdWVzdCh0aGlzLCB7IGJvZHk6IHRoaXMuX2JvZHlJbml0IH0pO1xuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gZGVjb2RlKGJvZHkpIHtcbiAgICAgICAgdmFyIGZvcm0gPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgYm9keVxuICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAuc3BsaXQoXCImXCIpXG4gICAgICAgICAgLmZvckVhY2goZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICAgICAgICAgIGlmIChieXRlcykge1xuICAgICAgICAgICAgICB2YXIgc3BsaXQgPSBieXRlcy5zcGxpdChcIj1cIik7XG4gICAgICAgICAgICAgIHZhciBuYW1lID0gc3BsaXQuc2hpZnQoKS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpO1xuICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKFwiPVwiKS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpO1xuICAgICAgICAgICAgICBmb3JtLmFwcGVuZChkZWNvZGVVUklDb21wb25lbnQobmFtZSksIGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZm9ybTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcGFyc2VIZWFkZXJzKHJhd0hlYWRlcnMpIHtcbiAgICAgICAgdmFyIGhlYWRlcnM6IGFueSA9IG5ldyBIZWFkZXJzKHt9KTtcbiAgICAgICAgcmF3SGVhZGVycy5zcGxpdCgvXFxyP1xcbi8pLmZvckVhY2goZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgIHZhciBwYXJ0cyA9IGxpbmUuc3BsaXQoXCI6XCIpO1xuICAgICAgICAgIHZhciBrZXkgPSBwYXJ0cy5zaGlmdCgpLnRyaW0oKTtcbiAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBwYXJ0cy5qb2luKFwiOlwiKS50cmltKCk7XG4gICAgICAgICAgICBoZWFkZXJzLmFwcGVuZChrZXksIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaGVhZGVycztcbiAgICAgIH1cblxuICAgICAgQm9keS5jYWxsKFJlcXVlc3QucHJvdG90eXBlKTtcblxuICAgICAgdmFyIFJlc3BvbnNlOiBhbnkgPSBmdW5jdGlvbihib2R5SW5pdCwgb3B0aW9ucyk6IHZvaWQge1xuICAgICAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnR5cGUgPSBcImRlZmF1bHRcIjtcbiAgICAgICAgdGhpcy5zdGF0dXMgPSBcInN0YXR1c1wiIGluIG9wdGlvbnMgPyBvcHRpb25zLnN0YXR1cyA6IDIwMDtcbiAgICAgICAgdGhpcy5vayA9IHRoaXMuc3RhdHVzID49IDIwMCAmJiB0aGlzLnN0YXR1cyA8IDMwMDtcbiAgICAgICAgdGhpcy5zdGF0dXNUZXh0ID0gXCJzdGF0dXNUZXh0XCIgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RhdHVzVGV4dCA6IFwiT0tcIjtcbiAgICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKTtcbiAgICAgICAgdGhpcy51cmwgPSBvcHRpb25zLnVybCB8fCBcIlwiO1xuICAgICAgICB0aGlzLl9pbml0Qm9keShib2R5SW5pdCk7XG4gICAgICB9O1xuXG4gICAgICBCb2R5LmNhbGwoUmVzcG9uc2UucHJvdG90eXBlKTtcblxuICAgICAgUmVzcG9uc2UucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UodGhpcy5fYm9keUluaXQsIHtcbiAgICAgICAgICBzdGF0dXM6IHRoaXMuc3RhdHVzLFxuICAgICAgICAgIHN0YXR1c1RleHQ6IHRoaXMuc3RhdHVzVGV4dCxcbiAgICAgICAgICBoZWFkZXJzOiBuZXcgSGVhZGVycyh0aGlzLmhlYWRlcnMpLFxuICAgICAgICAgIHVybDogdGhpcy51cmxcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBSZXNwb25zZS5lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UobnVsbCwgeyBzdGF0dXM6IDAsIHN0YXR1c1RleHQ6IFwiXCIgfSk7XG4gICAgICAgIHJlc3BvbnNlLnR5cGUgPSBcImVycm9yXCI7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH07XG5cbiAgICAgIHZhciByZWRpcmVjdFN0YXR1c2VzID0gWzMwMSwgMzAyLCAzMDMsIDMwNywgMzA4XTtcblxuICAgICAgUmVzcG9uc2UucmVkaXJlY3QgPSBmdW5jdGlvbih1cmwsIHN0YXR1cykge1xuICAgICAgICBpZiAocmVkaXJlY3RTdGF0dXNlcy5pbmRleE9mKHN0YXR1cykgPT09IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbnZhbGlkIHN0YXR1cyBjb2RlXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7XG4gICAgICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgICAgICAgaGVhZGVyczogeyBsb2NhdGlvbjogdXJsIH1cbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBzZWxmLkhlYWRlcnMgPSBIZWFkZXJzO1xuICAgICAgc2VsZi5SZXF1ZXN0ID0gUmVxdWVzdDtcbiAgICAgIHNlbGYuUmVzcG9uc2UgPSBSZXNwb25zZTtcblxuICAgICAgc2VsZi5mZXRjaCA9IGZ1bmN0aW9uKGlucHV0LCBpbml0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICB2YXIgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGlucHV0LCBpbml0KTtcbiAgICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9uczoge1xuICAgICAgICAgICAgICBzdGF0dXM6IGFueTtcbiAgICAgICAgICAgICAgc3RhdHVzVGV4dDogYW55O1xuICAgICAgICAgICAgICBoZWFkZXJzOiBhbnk7XG4gICAgICAgICAgICAgIHVybD86IGFueTtcbiAgICAgICAgICAgIH0gPSB7XG4gICAgICAgICAgICAgIHN0YXR1czogeGhyLnN0YXR1cyxcbiAgICAgICAgICAgICAgc3RhdHVzVGV4dDogeGhyLnN0YXR1c1RleHQsXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHBhcnNlSGVhZGVycyh4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkgfHwgXCJcIilcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBvcHRpb25zLnVybCA9XG4gICAgICAgICAgICAgIFwicmVzcG9uc2VVUkxcIiBpbiB4aHJcbiAgICAgICAgICAgICAgICA/IHhoci5yZXNwb25zZVVSTFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5oZWFkZXJzLmdldChcIlgtUmVxdWVzdC1VUkxcIik7XG4gICAgICAgICAgICB2YXIgYm9keSA9IFwicmVzcG9uc2VcIiBpbiB4aHIgPyB4aHIucmVzcG9uc2UgOiB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgcmVzb2x2ZShuZXcgUmVzcG9uc2UoYm9keSwgb3B0aW9ucykpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoXCJOZXR3b3JrIHJlcXVlc3QgZmFpbGVkXCIpKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgeGhyLm9udGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoXCJOZXR3b3JrIHJlcXVlc3QgZmFpbGVkXCIpKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgeGhyLm9wZW4ocmVxdWVzdC5tZXRob2QsIHJlcXVlc3QudXJsLCB0cnVlKTtcblxuICAgICAgICAgIGlmIChyZXF1ZXN0LmNyZWRlbnRpYWxzID09PSBcImluY2x1ZGVcIikge1xuICAgICAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKFwicmVzcG9uc2VUeXBlXCIgaW4geGhyICYmIHN1cHBvcnQuYmxvYikge1xuICAgICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IFwiYmxvYlwiO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlcXVlc3QuaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICB4aHIuc2VuZChcbiAgICAgICAgICAgIHR5cGVvZiByZXF1ZXN0Ll9ib2R5SW5pdCA9PT0gXCJ1bmRlZmluZWRcIiA/IG51bGwgOiByZXF1ZXN0Ll9ib2R5SW5pdFxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIHNlbGYuZmV0Y2gucG9seWZpbGwgPSB0cnVlO1xuICAgIH0pKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHRoaXMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZldGNoOiBzZWxmLmZldGNoLFxuICAgICAgSGVhZGVyczogc2VsZi5IZWFkZXJzLFxuICAgICAgUmVxdWVzdDogc2VsZi5SZXF1ZXN0LFxuICAgICAgUmVzcG9uc2U6IHNlbGYuUmVzcG9uc2VcbiAgICB9O1xuICB9KSgpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZmV0Y2hQb255ZmlsbDtcbiIsImltcG9ydCBmZXRjaFBvbnlmaWxsIGZyb20gXCIuLi92ZW5kb3IvZmV0Y2hQb255ZmlsbFwiO1xuXG50eXBlIFJlcXVlc3RJbml0aWFsaXphdGlvbk9iamVjdCA9IHtcbiAgZW5kcG9pbnQ/OiBzdHJpbmc7XG4gIG9wdGlvbnM/OiBSZXF1ZXN0SW5pdDtcbiAgYm9keT86IEZvcm1EYXRhO1xufTtcblxuY2xhc3MgUmVxdWVzdCB7XG4gIC8vIFByb3BlcnR5IHR5cGVzXG4gIGVuZHBvaW50OiBzdHJpbmc7XG4gIG9wdGlvbnM6IFJlcXVlc3RJbml0O1xuICBib2R5OiBGb3JtRGF0YTtcblxuICAvLyBTdGF0aWMgcHJvcGVydGllc1xuICAvKipcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyIHtvYmplY3R9IFJlcXVlc3QuZGVmYXVsdE9wdGlvbnMgT3B0aW9ucyBvYmplY3QgdG8gZmFsbGJhY2sgdG8gaWZcbiAgICogbm8gb3B0aW9ucyBwcm9wZXJ0eSBpcyBwYXNzZWQgaW50byB0aGUgY29uc3RydWN0b3IgY29uZmlnIG9iamVjdC5cbiAgICovXG4gIHN0YXRpYyBkZWZhdWx0T3B0aW9uczogUmVxdWVzdEluaXQgPSB7XG4gICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgIGhlYWRlcnM6IHsgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XG4gIH07XG5cbiAgLy8gQ29uc3RydWN0b3JcbiAgLyoqXG4gICAqIEBjbGFzcyBSZXF1ZXN0XG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5lbmRwb2ludFxuICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbmZpZy5vcHRpb25zXVxuICAgKiBAcGFyYW0ge0Zvcm1EYXRhfSBbY29uZmlnLmJvZHldXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih7IGVuZHBvaW50LCBvcHRpb25zLCBib2R5IH06IFJlcXVlc3RJbml0aWFsaXphdGlvbk9iamVjdCkge1xuICAgIHRoaXMuZW5kcG9pbnQgPSBlbmRwb2ludDtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IFJlcXVlc3QuZGVmYXVsdE9wdGlvbnM7XG4gICAgdGhpcy5ib2R5ID0gYm9keTtcbiAgfVxuICAvLyBQcml2YXRlIG1ldGhvZHNcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqIEBmdW5jdGlvbiBSZXF1ZXN0LnByZXBhcmVGZXRjaE9wdGlvbnNcbiAgICogQGRlc2NyaXB0aW9uIENyZWF0ZXMgYmxhbmsgRm9ybURhdGEgb2JqZWN0IGlmIHRoaXMuYm9keSBpcyB1bmRlZmluZWQgYW5kXG4gICAqIHRoaXMub3B0aW9ucy5tZXRob2QgaXMgZXF1YWwgdG8gXCJQT1NUXCIuXG4gICAqIEByZXR1cm5zIHtGb3JtRGF0YX1cbiAgICovXG4gIHByaXZhdGUgcHJlcGFyZUZldGNoT3B0aW9ucyA9ICgpID0+IHtcbiAgICBpZiAoIXRoaXMuYm9keSAmJiB0aGlzLm9wdGlvbnMubWV0aG9kID09PSBcIlBPU1RcIikge1xuICAgICAgdGhpcy5ib2R5ID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmJvZHk7XG4gIH07XG4gIC8vIFB1YmxpYyBtZXRob2RzXG4gIC8qKlxuICAgKiBAcHVibGljXG4gICAqIEBmdW5jdGlvbiBSZXF1ZXN0LnNlbmRcbiAgICogQHBhcmFtXHR7b2JqZWN0fSBvcHRpb25zXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuYXN5bmNdIEFsbG93cyBwcm9wZXJ0eSBgYXN5bmNgIHRvIGJlIHNldCB0byBpbmRpY2F0ZSB0aGVcbiAgICogcmVzcG9uc2Ugc2hvdWxkIGJlIHByZXBhcmVkIGJlZm9yZSByZXR1cm5pbmcuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgcHVibGljIHNlbmQgPSAoeyBhc3luYyB9OiB7IGFzeW5jOiBib29sZWFuIH0gPSB7IGFzeW5jOiBmYWxzZSB9KSA9PiB7XG4gICAgY29uc3QgeyBmZXRjaCB9ID0gd2luZG93XG4gICAgICA/IHdpbmRvdy5mZXRjaCA/IHdpbmRvdyA6IGZldGNoUG9ueWZpbGwoe30pLmZldGNoXG4gICAgICA6IHtcbiAgICAgICAgICBmZXRjaDogKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiZmV0Y2ggaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgY29uc3QgcHJlcGFyZWRPcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgdGhpcy5wcmVwYXJlRmV0Y2hPcHRpb25zKCksXG4gICAgICB0aGlzLm9wdGlvbnNcbiAgICApO1xuICAgIGNvbnN0IGluaXRGZXRjaCA9IGZldGNoKHRoaXMuZW5kcG9pbnQsIHByZXBhcmVkT3B0aW9ucyk7XG4gICAgcmV0dXJuIGFzeW5jID8gaW5pdEZldGNoLnRoZW4ocmVzID0+IHJlcy5qc29uKCkpIDogaW5pdEZldGNoO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBSZXF1ZXN0O1xuIiwiLyoqXG4gKiBAbW9kdWxlIGRhdGFNYW5pcHVsYXRpb25cbiAqL1xuXG50eXBlIGFscGhhbnVtZXJpYyA9IHN0cmluZyB8IG51bWJlcjtcbnR5cGUgYXJyYXlMaWtlID0gc3RyaW5nIHwgYWxwaGFudW1lcmljW107XG5cbi8qKlxuICogQGZ1bmN0aW9uIHNlYXJjaFByb3BQYXRoXG4gKiBAZGVzY3JpcHRpb24gUmVjdXJzaXZlbHkgc2VhcmNocyB0aHJvdWdoIGEgZGF0YSBvYmplY3Q7IHRocm93cyBhbiBlcnJvciBpZiB0aGUgcmVzdWx0aW5nIHZhbHVlIG9mIGEgc2VhcmNoZWQgcGF0aCBpcyB1bmRlZmluZWQuXG4gKiBAcGFyYW0ge2FscGhhbnVtZXJpY1tdfSBwYXRoIEFycmF5IG9mIGtleXMgaW4gdGhlIG9yZGVyIG9mIHdoaWNoIHdpbGwgYmUgdXNlZCB0byByZWN1cnNpdmVseSBzZWFyY2ggYW4gb2JqZWN0XG4gKiBAcGFyYW0ge29iamVjdH0gY29sbGVjdGlvbiBEYXRhIG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IFtkZWxpbWl0ZXJdIERlbGltaXRlciBieSB3aGljaCB0byBzcGxpdCB0aGUgcGF0aDsgZGVmYXVsdHMgdG8gJy4nXG4gKiBAcmV0dXJuIHthbnl9IFZhbHVlIGF0IHRoZSBlbmQgb2YgdGhlIHNlYXJjaGVkIHByb3BlcnR5IHBhdGg7XG4gKi9cbmNvbnN0IHNlYXJjaFByb3BQYXRoID0gKFxuICBwYXRoOiBhcnJheUxpa2UsXG4gIGNvbGxlY3Rpb246IG9iamVjdCxcbiAgZGVsaW1pdGVyOiBzdHJpbmcgPSBcIi5cIlxuKTogYW55ID0+IHtcbiAgY29uc3Qgc2FmZVBhdGggPSB0eXBlb2YgcGF0aCA9PT0gXCJzdHJpbmdcIiA/IHBhdGguc3BsaXQoZGVsaW1pdGVyKSA6IHBhdGg7XG4gIGxldCBwYXRoUmVzdWx0ID0gY29sbGVjdGlvbjtcbiAgc2FmZVBhdGguZm9yRWFjaChrZXkgPT4ge1xuICAgIHBhdGhSZXN1bHQgPSBwYXRoUmVzdWx0W2tleV07XG4gIH0pO1xuICBpZiAocGF0aFJlc3VsdCkgcmV0dXJuIHBhdGhSZXN1bHQ7XG4gIHRocm93IG5ldyBFcnJvcihcbiAgICBgcGF0aFJlc3VsdCB5aWVsZHMgdW5kZWZpbmVkIHZhbHVlIHdoZW4gc2VhcmNoaW5nICR7c2FmZVBhdGguam9pbihcbiAgICAgIGRlbGltaXRlclxuICAgICl9IG9uIGNvbGxlY3Rpb24gYXJndW1lbnQuYFxuICApO1xufTtcblxuZXhwb3J0IHsgc2VhcmNoUHJvcFBhdGggfTtcbiIsIi8qKlxuICogQG1vZHVsZSBwYXJzZVxuICovXG5cbi8qKlxuICogQmFzZSBmcm9tIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2dlb2ZmZGF2aXM5Mi8xZGE3ZDA3NDVlM2JiYTAzNmY5NFxuICogQGZ1bmN0aW9uIHBhcmFtc1xuICogQGRlc2NyaXB0aW9uIENyZWF0ZXMgb2JqZWN0IG9mIGtleS92YWx1ZSBwYWlycyBmcm9tIFVSTCBwYXJhbWV0ZXJzLlxuICogQHBhcmFtIHtzdHJpbmd9IFt1cmxdIFVSTCB0byBwYXJzZTsgZGVmYXVsdHMgdG8gd2luZG93LmxvY2F0aW9uLnNlYXJjaC5cbiAqIEByZXR1cm4ge29iamVjdH0gT2JqZWN0IG9mIGtleS92YWx1ZSBwYWlycy5cbiAqL1xuY29uc3QgcGFyYW1zID0gKHVybDogc3RyaW5nID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaCk6IG9iamVjdCA9PlxuICB1cmxcbiAgICAuc3BsaXQoXCI/XCIpWzFdXG4gICAgLnNwbGl0KFwiJlwiKVxuICAgIC5tYXAocSA9PiBxLnNwbGl0KFwiPVwiKSlcbiAgICAucmVkdWNlKChhY2MsIFtrZXksIHZhbF0sIGksIGFycikgPT4ge1xuICAgICAgYWNjW2tleV0gPSBkZWNvZGVVUklDb21wb25lbnQodmFsKS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpO1xuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB7fSk7XG5cbi8qKlxuICogQGZ1bmN0aW9uIHBhcnNlRXh0ZXJuYWxNYXJrZG93bkxpbmtzXG4gKiBAZGVzY3JpcHRpb24gVHJhbnNmb3JtcyBNYXJrZG93biBsaW5rcyB0byB1c2UgdGFyZ2V0PVwiX2JsYW5rXCIsIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIjtcbiAqIHVzdWFsbHkgdXNlZCB3aGVuIGltcGxlbWVudGluZyBjbGllbnRzaWRlIE1hcmtkb3duLCBiZWZvcmUgc2VuZGluZyB0aGUgTWFya2Rvd24gdG8gdGhlIG1haW5cbiAqIHBhcnNpbmcgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFN0cmluZyB0byBwYXJzZSBhcyBNYXJrZG93biBsaW5rLlxuICogQHJldHVybnMge3N0cmluZ30gSFRNTCBsaW5rIHdpdGggVVJMIGFuZCBpbm5lclRleHQsIHRhcmdldCBhbmQgcmVsIGF0dHJpYnV0ZXMgcHJvcGVybHkgc2V0IGZvclxuICogYW4gZXh0ZXJuYWwgbGluay5cbiAqL1xuY29uc3QgcGFyc2VFeHRlcm5hbE1hcmtkb3duTGlua3MgPSAoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICBjb25zdCBwYXR0ZXJuOiBSZWdFeHAgPSAvXFxbKFteXFxdXSspXFxdXFwoKFteKV0rKVxcKS9nO1xuICBpZiAoc3RyaW5nLnNlYXJjaChwYXR0ZXJuKSA+IC0xKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKFxuICAgICAgcGF0dGVybixcbiAgICAgICc8YSBocmVmPVwiJDJcIiB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+JDE8L2E+J1xuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxufTtcblxuZXhwb3J0IHsgcGFyYW1zIGFzIHBhcnNlVVJMUGFyYW1zLCBwYXJzZUV4dGVybmFsTWFya2Rvd25MaW5rcyB9O1xuIiwiLyoqXG4gKiBAbW9kdWxlIHNjcm9sbFxuICovXG5cbi8qKlxuICogQGZ1bmN0aW9uIGlzRWxlbWVudEluVmlld3BvcnRcbiAqIEBkZXNjcmlwdGlvbiBEZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudCBpcyBwYXJ0aWFsbHkgb3JcbiAqIGZ1bGx5IHZpc2libGUgaW4gdGhlIHZpZXdwb3J0LlxuICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZ1xuICogQHBhcmFtIHtFbGVtZW50fSBjb25maWcuZWxlbWVudCBIVE1MIEVsZW1lbnQgbm9kZSB0byB0YXJnZXQuXG4gKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy50aHJlc2hvbGRdIFJhdGlvIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQgdGhlIGVsZW1lbnRcbiAqIG11c3QgZmlsbCBiZWZvcmUgYmVpbmcgY29uc2lkZXJlZCB2aXNpYmxlLiBFLmcuIDAuNSBtZWFucyB0aGUgZWxlbWVudFxuICogbXVzdCB0YWtlIHVwIDUwJSBvZiB0aGUgc2NyZWVuIGJlZm9yZSByZXR1cm5pbmcgdHJ1ZS4gRGVmYXVsdHMgdG8gMC4yNS5cbiAqIE9ubHkgdXNlZCBmb3IgZWxlbWVudHMgdGFsbGVyIHRoYW4gdGhlIHZpZXdwb3J0LlxuICogQHJldHVybiB7Ym9vbGVhbn0gQm9vbGVhbiBkZXNjcmliaW5nIGlmIGlucHV0IGlzIGZ1bGx5L3BhcnRpYWxseVxuICogaW4gdGhlIHZpZXdwb3J0LCByZWxhdGl2ZSB0byB0aGUgdGhyZXNob2xkIHNldHRpbmcuXG4gKi9cbmZ1bmN0aW9uIGlzRWxlbWVudEluVmlld3BvcnQoe1xuICBlbGVtZW50OiBhcmdFbGVtZW50LFxuICB0aHJlc2hvbGQ6IGFyZ1RocmVzaG9sZFxufToge1xuICBlbGVtZW50OiBFbGVtZW50O1xuICB0aHJlc2hvbGQ6IG51bWJlcjtcbn0pOiBib29sZWFuIHtcbiAgY29uc3QgZGVmYXVsdFBhcmFtczoge1xuICAgIHRocmVzaG9sZDogbnVtYmVyO1xuICB9ID0ge1xuICAgIHRocmVzaG9sZDogMC4yNVxuICB9O1xuXG4gIGNvbnN0IHNhZmVBcmdzID0ge1xuICAgIHRocmVzaG9sZDogYXJnVGhyZXNob2xkIHx8IGRlZmF1bHRQYXJhbXMudGhyZXNob2xkXG4gIH07XG5cbiAgY29uc3QgcmVjdDogQ2xpZW50UmVjdCB8IERPTVJlY3QgPSBhcmdFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gIGNvbnN0IHZpZXdwb3J0SGVpZ2h0OiBudW1iZXIgPSBNYXRoLm1heChcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0LFxuICAgIHdpbmRvdy5pbm5lckhlaWdodCB8fCAwXG4gICk7XG4gIGNvbnN0IHsgdGhyZXNob2xkIH0gPSBzYWZlQXJncztcblxuICBpZiAodGhyZXNob2xkIDwgMCB8fCB0aHJlc2hvbGQgPiAxKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXG4gICAgICBcIlRocmVzaG9sZCBhcmd1bWVudCBtdXN0IGJlIGEgZGVjaW1hbCBiZXR3ZWVuIDAgYW5kIDFcIlxuICAgICk7XG4gIH1cblxuICAvL0lmIHRoZSBlbGVtZW50IGlzIHRvbyB0YWxsIHRvIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0XG4gIGlmIChyZWN0LmhlaWdodCA+PSB0aHJlc2hvbGQgKiB2aWV3cG9ydEhlaWdodCkge1xuICAgIGlmIChcbiAgICAgIHJlY3QudG9wIC0gdmlld3BvcnRIZWlnaHQgPD0gdGhyZXNob2xkICogdmlld3BvcnRIZWlnaHQgKiAtMSAmJlxuICAgICAgcmVjdC5ib3R0b20gPj0gdGhyZXNob2xkICogdmlld3BvcnRIZWlnaHRcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vSWYgdGhlIGVsZW1lbnQgaXMgc2hvcnQgZW5vdWdoIHRvIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0XG4gICAgaWYgKHJlY3QudG9wID49IDAgJiYgcmVjdC5ib3R0b20gLSB2aWV3cG9ydEhlaWdodCA8PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEZyb20gaHR0cDovL2JpdC5seS8yY1A2NWZEXG4gKiBAdG9kbyBDbGFzc2lmeSBhbmQgZGVzY3JpYmUgcGFyYW1zLlxuICogQGZ1bmN0aW9uIHNjcm9sbFRvXG4gKiBAZGVzY3JpcHRpb24gU2Nyb2xscyBnaXZlbiBlbGVtZW50IHRvIGRldGVybWluZWQgcG9pbnQuXG4gKiBAcGFyYW0gIHtFbGVtZW50fSBlbGVtZW50ICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHRvICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge251bWJlcn0gZHVyYXRpb24gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gc2Nyb2xsVG8oZWxlbWVudDogRWxlbWVudCwgdG86IG51bWJlciwgZHVyYXRpb246IG51bWJlcik6IHZvaWQge1xuICBpZiAoZHVyYXRpb24gPD0gMCkgcmV0dXJuO1xuICBjb25zdCBkaWZmZXJlbmNlOiBudW1iZXIgPSB0byAtIGVsZW1lbnQuc2Nyb2xsVG9wO1xuICBjb25zdCBwZXJUaWNrOiBudW1iZXIgPSBkaWZmZXJlbmNlIC8gZHVyYXRpb24gKiAxMDtcblxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIGVsZW1lbnQuc2Nyb2xsVG9wID0gZWxlbWVudC5zY3JvbGxUb3AgKyBwZXJUaWNrO1xuICAgIGlmIChlbGVtZW50LnNjcm9sbFRvcCA9PT0gdG8pIHJldHVybjtcbiAgICBzY3JvbGxUbyhlbGVtZW50LCB0bywgZHVyYXRpb24gLSAxMCk7XG4gIH0sIDEwKTtcbn1cblxuZXhwb3J0IHsgaXNFbGVtZW50SW5WaWV3cG9ydCwgc2Nyb2xsVG8gfTtcbiIsIi8qKlxuICogQG1vZHVsZSBzZWxlY3RcbiAqL1xuXG4vKipcbiAqIEBmdW5jdGlvbiBzZWxlY3RcbiAqIEBkZXNjcmlwdGlvbiBTZWxlY3RzIGEgRE9NIG5vZGUgYmFzZWQgb24gYSBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBxdWVyeSBxdWVyeSBzZWxlY3RvciB0byB1c2UgdG8gcXVlcnkgYW4gbm9kZS5cbiAqIEByZXR1cm5zIHtFbGVtZW50fSBGaXJzdCBET00gbm9kZSB0aGF0IG1hdGNoZXMgdGhlIHF1ZXJ5LlxuICovXG5jb25zdCBzZWxlY3Q6IEZ1bmN0aW9uID0gKHF1ZXJ5OiBzdHJpbmcpOiBFbGVtZW50ID0+XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocXVlcnkpO1xuXG4vKipcbiAqIEBmdW5jdGlvbiBzZWxlY3RBbGxcbiAqIEBkZXNjcmlwdGlvbiBTZWxlY3RzIGEgRE9NIG5vZGVsaXN0IGJhc2VkIG9uIGEgcXVlcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30gcXVlcnkgcXVlcnkgc2VsZWN0b3IgdG8gdXNlIHRvIHF1ZXJ5IGEgbm9kZWxpc3QuXG4gKiBAcmV0dXJucyB7RWxlbWVudFtdfSBBcnJheSBvZiBET00gbm9kZXMgdGhhdCBtYXRjaCB0aGUgcXVlcnkuXG4gKi9cbmNvbnN0IHNlbGVjdEFsbDogRnVuY3Rpb24gPSAocXVlcnk6IHN0cmluZyk6IEVsZW1lbnRbXSA9PiBbXG4gIC4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpXG5dO1xuXG4vKipcbiAqIEBmdW5jdGlvbiBzZWxlY3RCeUlkXG4gKiBAZGVzY3JpcHRpb24gU2VsZWN0cyBhIERPTSBub2RlIGJhc2VkIG9uIGFuIElEIHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCBJRCBvZiBET00gbm9kZSB0byBzZWxlY3QuXG4gKiBAcmV0dXJucyB7RWxlbWVudH0gRE9NIG5vZGUgd2l0aCBtYXRjaGVkIElELlxuICovXG5jb25zdCBzZWxlY3RCeUlkOiBGdW5jdGlvbiA9IChpZDogc3RyaW5nKTogRWxlbWVudCA9PlxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG5cbmV4cG9ydCB7IHNlbGVjdCwgc2VsZWN0QWxsLCBzZWxlY3RCeUlkIH07XG4iLCIvKipcbiAqIEBtb2R1bGUgdHlwb2dyYXBoeVxuICovXG5cbi8qKlxuICogQGZ1bmN0aW9uIGNhcGl0YWxpemVcbiAqIEBkZXNjcmlwdGlvbiBDYXBpdGFsaXplcyBhbGwgd29yZHMgaW4gYSBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRleHQgdG8gY2FwaXRhbGl6ZS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFRpdGxlLWNhc2VkIHRleHQuXG4gKi9cbmNvbnN0IGNhcGl0YWxpemUgPSAoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcgPT5cbiAgc3RyaW5nXG4gICAgLnNwbGl0KFwiIFwiKVxuICAgIC5tYXAocyA9PiB1Y0ZpcnN0KHMpKVxuICAgIC5qb2luKFwiIFwiKTtcblxuLyoqXG4gKiBAZnVuY3Rpb24gc2x1Z2lmeVxuICogQGRlc2NyaXB0aW9uIExvd2VyY2FzZXMgc3RyaW5nLCByZXBsYWNlcyBzcGFjZXMgYW5kIHNwZWNpYWwgY2hhcmFjdGVyc1xuICogd2l0aCBhIHNldCBkZWxpbWl0ZXIuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFRvU2x1ZyBUZXh0IHRvIHNsdWdpZnkuXG4gKiBAcGFyYW0ge3N0cmluZ30gW2RlbGltaXRlcl0gRGVsaW1pdGVyOyBkZWZhdWx0cyB0byBcIi1cIi5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFNsdWdpZmllZCB0ZXh0LlxuICovXG5jb25zdCBzbHVnaWZ5ID0gKHRleHRUb1NsdWc6IHN0cmluZywgZGVsaW1pdGVyOiBzdHJpbmcgPSBcIi1cIik6IHN0cmluZyA9PlxuICB0ZXh0VG9TbHVnXG4gICAgLnJlcGxhY2UoLyhcXCF8I3xcXCR8JXxcXCp8XFwufFxcL3xcXFxcfFxcKHxcXCl8XFwrfFxcfHxcXCx8XFw6fFxcJ3xcXFwiKS9nLCBcIlwiKVxuICAgIC5yZXBsYWNlKC8oLikoXFxzfFxcX3xcXC0pKyguKS9nLCBgJDEke2RlbGltaXRlcn0kM2ApXG4gICAgLnRvTG93ZXJDYXNlKCk7XG5cbi8qKlxuICogQGZ1bmN0aW9uIHRyaW1cbiAqIEBkZXNjcmlwdGlvbiBUcmltcyB3aGl0ZXNwYWNlIG9uIGVpdGhlciBlbmQgb2YgYSBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRleHQgdG8gdHJpbS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFRyaW1tZWQgdGV4dC5cbiAqL1xuY29uc3QgdHJpbSA9IChzdHJpbmc6IHN0cmluZyk6IHN0cmluZyA9PiBzdHJpbmcucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgXCJcIik7XG5cbi8qKlxuICogQGZ1bmN0aW9uIHVjRmlyc3RcbiAqIEBkZXNjcmlwdGlvbiBDYXBpdGFsaXplcyBmaXJzdCB3b3JkIGluIGEgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBUZXh0IHRvIGNhcGl0YWxpemUuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBDYXBpdGFsaXplZCB0ZXh0LlxuICovXG5jb25zdCB1Y0ZpcnN0ID0gKFtmaXJzdExldHRlciwgLi4ucmVzdExldHRlcnNdOiBzdHJpbmcpOiBzdHJpbmcgPT5cbiAgYCR7Zmlyc3RMZXR0ZXIudG9VcHBlckNhc2UoKX0ke3Jlc3RMZXR0ZXJzLmpvaW4oXCJcIil9YDtcblxuZXhwb3J0IHsgY2FwaXRhbGl6ZSwgc2x1Z2lmeSwgdHJpbSwgdWNGaXJzdCB9O1xuIl0sIm5hbWVzIjpbImZldGNoUG9ueWZpbGwiLCJvcHRpb25zIiwid2luZG93Iiwic2VsZiIsImdsb2JhbCIsIlByb21pc2UiLCJYTUxIdHRwUmVxdWVzdCIsIk9iamVjdCIsImNyZWF0ZSIsInVuZGVmaW5lZCIsImZldGNoIiwic3VwcG9ydCIsIlN5bWJvbCIsIkJsb2IiLCJlIiwiYXJyYXlCdWZmZXIiLCJ2aWV3Q2xhc3NlcyIsImlzRGF0YVZpZXciLCJvYmoiLCJEYXRhVmlldyIsInByb3RvdHlwZSIsImlzUHJvdG90eXBlT2YiLCJpc0FycmF5QnVmZmVyVmlldyIsIkFycmF5QnVmZmVyIiwiaXNWaWV3IiwiaW5kZXhPZiIsInRvU3RyaW5nIiwiY2FsbCIsIm5hbWUiLCJTdHJpbmciLCJ0ZXN0IiwiVHlwZUVycm9yIiwidG9Mb3dlckNhc2UiLCJ2YWx1ZSIsIml0ZW1zIiwiaXRlcmF0b3IiLCJzaGlmdCIsImRvbmUiLCJpdGVyYWJsZSIsImhlYWRlcnMiLCJtYXAiLCJIZWFkZXJzIiwiZm9yRWFjaCIsImFwcGVuZCIsIkFycmF5IiwiaXNBcnJheSIsImhlYWRlciIsImdldE93blByb3BlcnR5TmFtZXMiLCJub3JtYWxpemVOYW1lIiwibm9ybWFsaXplVmFsdWUiLCJvbGRWYWx1ZSIsImdldCIsImhhcyIsImhhc093blByb3BlcnR5Iiwic2V0IiwiY2FsbGJhY2siLCJ0aGlzQXJnIiwia2V5cyIsInB1c2giLCJpdGVyYXRvckZvciIsInZhbHVlcyIsImVudHJpZXMiLCJib2R5IiwiYm9keVVzZWQiLCJyZWplY3QiLCJyZWFkZXIiLCJyZXNvbHZlIiwib25sb2FkIiwicmVzdWx0Iiwib25lcnJvciIsImVycm9yIiwiYmxvYiIsIkZpbGVSZWFkZXIiLCJwcm9taXNlIiwiZmlsZVJlYWRlclJlYWR5IiwicmVhZEFzQXJyYXlCdWZmZXIiLCJyZWFkQXNUZXh0IiwiYnVmIiwidmlldyIsIlVpbnQ4QXJyYXkiLCJjaGFycyIsImxlbmd0aCIsImkiLCJmcm9tQ2hhckNvZGUiLCJqb2luIiwic2xpY2UiLCJieXRlTGVuZ3RoIiwiYnVmZmVyIiwiX2luaXRCb2R5IiwiX2JvZHlJbml0IiwiX2JvZHlUZXh0IiwiX2JvZHlCbG9iIiwiZm9ybURhdGEiLCJGb3JtRGF0YSIsIl9ib2R5Rm9ybURhdGEiLCJzZWFyY2hQYXJhbXMiLCJVUkxTZWFyY2hQYXJhbXMiLCJfYm9keUFycmF5QnVmZmVyIiwiYnVmZmVyQ2xvbmUiLCJFcnJvciIsInR5cGUiLCJyZWplY3RlZCIsImNvbnN1bWVkIiwidGhlbiIsInJlYWRCbG9iQXNBcnJheUJ1ZmZlciIsInRleHQiLCJyZWFkQmxvYkFzVGV4dCIsInJlYWRBcnJheUJ1ZmZlckFzVGV4dCIsImRlY29kZSIsImpzb24iLCJKU09OIiwicGFyc2UiLCJtZXRob2RzIiwibWV0aG9kIiwidXBjYXNlZCIsInRvVXBwZXJDYXNlIiwiaW5wdXQiLCJSZXF1ZXN0IiwidXJsIiwiY3JlZGVudGlhbHMiLCJtb2RlIiwibm9ybWFsaXplTWV0aG9kIiwicmVmZXJyZXIiLCJjbG9uZSIsImZvcm0iLCJ0cmltIiwic3BsaXQiLCJieXRlcyIsInJlcGxhY2UiLCJkZWNvZGVVUklDb21wb25lbnQiLCJyYXdIZWFkZXJzIiwibGluZSIsInBhcnRzIiwia2V5IiwiUmVzcG9uc2UiLCJib2R5SW5pdCIsInN0YXR1cyIsIm9rIiwic3RhdHVzVGV4dCIsInJlc3BvbnNlIiwicmVkaXJlY3RTdGF0dXNlcyIsInJlZGlyZWN0IiwiUmFuZ2VFcnJvciIsImxvY2F0aW9uIiwiaW5pdCIsInJlcXVlc3QiLCJ4aHIiLCJwYXJzZUhlYWRlcnMiLCJnZXRBbGxSZXNwb25zZUhlYWRlcnMiLCJyZXNwb25zZVVSTCIsInJlc3BvbnNlVGV4dCIsIm9udGltZW91dCIsIm9wZW4iLCJ3aXRoQ3JlZGVudGlhbHMiLCJyZXNwb25zZVR5cGUiLCJzZXRSZXF1ZXN0SGVhZGVyIiwic2VuZCIsInBvbHlmaWxsIiwiZW5kcG9pbnQiLCJhc3luYyIsIndhcm4iLCJwcmVwYXJlZE9wdGlvbnMiLCJwcmVwYXJlRmV0Y2hPcHRpb25zIiwiaW5pdEZldGNoIiwicmVzIiwiZGVmYXVsdE9wdGlvbnMiLCJBY2NlcHQiLCJzZWFyY2hQcm9wUGF0aCIsInBhdGgiLCJjb2xsZWN0aW9uIiwiZGVsaW1pdGVyIiwic2FmZVBhdGgiLCJwYXRoUmVzdWx0IiwicGFyYW1zIiwic2VhcmNoIiwicSIsInJlZHVjZSIsImFjYyIsImFyciIsInZhbCIsInBhcnNlRXh0ZXJuYWxNYXJrZG93bkxpbmtzIiwic3RyaW5nIiwicGF0dGVybiIsImFyZ0VsZW1lbnQiLCJlbGVtZW50IiwiYXJnVGhyZXNob2xkIiwidGhyZXNob2xkIiwiZGVmYXVsdFBhcmFtcyIsInNhZmVBcmdzIiwicmVjdCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInZpZXdwb3J0SGVpZ2h0IiwiTWF0aCIsIm1heCIsImRvY3VtZW50IiwiZG9jdW1lbnRFbGVtZW50IiwiY2xpZW50SGVpZ2h0IiwiaW5uZXJIZWlnaHQiLCJoZWlnaHQiLCJ0b3AiLCJib3R0b20iLCJ0byIsImR1cmF0aW9uIiwiZGlmZmVyZW5jZSIsInNjcm9sbFRvcCIsInBlclRpY2siLCJzZWxlY3QiLCJxdWVyeSIsInF1ZXJ5U2VsZWN0b3IiLCJzZWxlY3RBbGwiLCJxdWVyeVNlbGVjdG9yQWxsIiwic2VsZWN0QnlJZCIsImlkIiwiZ2V0RWxlbWVudEJ5SWQiLCJjYXBpdGFsaXplIiwidWNGaXJzdCIsInMiLCJzbHVnaWZ5IiwidGV4dFRvU2x1ZyIsImZpcnN0TGV0dGVyIiwicmVzdExldHRlcnMiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7Ozs7Ozs7QUFRQSxJQUFNQSxnQkFBZ0Isc0JBQUEsQ0FBdUJDLE9BQXZCO1FBQ2hCQyxTQUFTQSxTQUFTQSxNQUFULEdBQWtCLEtBQS9CO1FBQ0lDLE9BQU8sT0FBT0EsSUFBUCxLQUFnQixXQUFoQixHQUErQkQsU0FBU0EsTUFBVCxHQUFrQkUsTUFBakQsR0FBMkRELElBQXRFO1FBQ0lFLFVBQVdKLFdBQVdBLFFBQVFJLE9BQXBCLElBQWdDRixLQUFLRSxPQUFuRDtRQUNJQyxpQkFD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
