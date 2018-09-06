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
 * @param {alphanumeric[]} [path] Array of keys in the order of which will be used to recursively search an object
 * @param {object} [collection] Data object
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW0uY2pzLmRldi5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3ZlbmRvci9mZXRjaFBvbnlmaWxsLnRzIiwiLi4vc3JjL2NsYXNzZXMvUmVxdWVzdC50cyIsIi4uL3NyYy9mdW5jdGlvbnMvZGF0YU1hbmlwdWxhdGlvbi50cyIsIi4uL3NyYy9mdW5jdGlvbnMvcGFyc2UudHMiLCIuLi9zcmMvZnVuY3Rpb25zL3Njcm9sbC50cyIsIi4uL3NyYy9mdW5jdGlvbnMvc2VsZWN0LnRzIiwiLi4vc3JjL2Z1bmN0aW9ucy90eXBvZ3JhcGh5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29waWVkIGZyb20gbm9kZV9tb2R1bGVzL2ZldGNoLXBvbnlmaWxsL2J1aWxkL2ZldGNoLWJyb3dzZXIuanMuXG4gKlxuICogVHlwZXMgYWRkZWQgd2hlcmUgbmVjZXNzYXJ5LlxuICpcbiAqIE1vdmVkIG91dCBvZiBJSUZFIG1vZHVsZSB0eXBlLCBwbGFjZWQgYHNlbGZgIGRlY2xhcmF0aW9uIHRvIHRvcFxuICogb2YgYGZldGNoUG9ueWZpbGxgIGZ1bmN0aW9uIHNjb3BlLlxuICovXG5jb25zdCBmZXRjaFBvbnlmaWxsID0gZnVuY3Rpb24gZmV0Y2hQb255ZmlsbChvcHRpb25zKSB7XG4gIHZhciB3aW5kb3cgPSB3aW5kb3cgPyB3aW5kb3cgOiBmYWxzZTtcbiAgdmFyIHNlbGYgPSB0eXBlb2Ygc2VsZiA9PT0gXCJ1bmRlZmluZWRcIiA/ICh3aW5kb3cgPyB3aW5kb3cgOiBnbG9iYWwpIDogc2VsZjtcbiAgdmFyIFByb21pc2UgPSAob3B0aW9ucyAmJiBvcHRpb25zLlByb21pc2UpIHx8IHNlbGYuUHJvbWlzZTtcbiAgdmFyIFhNTEh0dHBSZXF1ZXN0ID1cbiAgICAob3B0aW9ucyAmJiBvcHRpb25zLlhNTEh0dHBSZXF1ZXN0KSB8fCBzZWxmLlhNTEh0dHBSZXF1ZXN0O1xuICB2YXIgZ2xvYmFsID0gc2VsZjtcblxuICByZXR1cm4gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gT2JqZWN0LmNyZWF0ZShnbG9iYWwsIHtcbiAgICAgIGZldGNoOiB7XG4gICAgICAgIHZhbHVlOiB1bmRlZmluZWQsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAoZnVuY3Rpb24oc2VsZikge1xuICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgIGlmIChzZWxmLmZldGNoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIHN1cHBvcnQgPSB7XG4gICAgICAgIHNlYXJjaFBhcmFtczogXCJVUkxTZWFyY2hQYXJhbXNcIiBpbiBzZWxmLFxuICAgICAgICBpdGVyYWJsZTogXCJTeW1ib2xcIiBpbiBzZWxmICYmIFwiaXRlcmF0b3JcIiBpbiBTeW1ib2wsXG4gICAgICAgIGJsb2I6XG4gICAgICAgICAgXCJGaWxlUmVhZGVyXCIgaW4gc2VsZiAmJlxuICAgICAgICAgIFwiQmxvYlwiIGluIHNlbGYgJiZcbiAgICAgICAgICAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBuZXcgQmxvYigpO1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pKCksXG4gICAgICAgIGZvcm1EYXRhOiBcIkZvcm1EYXRhXCIgaW4gc2VsZixcbiAgICAgICAgYXJyYXlCdWZmZXI6IFwiQXJyYXlCdWZmZXJcIiBpbiBzZWxmXG4gICAgICB9O1xuXG4gICAgICBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlcikge1xuICAgICAgICB2YXIgdmlld0NsYXNzZXMgPSBbXG4gICAgICAgICAgXCJbb2JqZWN0IEludDhBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgVWludDhBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgVWludDhDbGFtcGVkQXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IEludDE2QXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IFVpbnQxNkFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBJbnQzMkFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBVaW50MzJBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgRmxvYXQzMkFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBGbG9hdDY0QXJyYXldXCJcbiAgICAgICAgXTtcblxuICAgICAgICB2YXIgaXNEYXRhVmlldyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgIHJldHVybiBvYmogJiYgRGF0YVZpZXcucHJvdG90eXBlLmlzUHJvdG90eXBlT2Yob2JqKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaXNBcnJheUJ1ZmZlclZpZXcgPVxuICAgICAgICAgIEFycmF5QnVmZmVyLmlzVmlldyB8fFxuICAgICAgICAgIGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgb2JqICYmXG4gICAgICAgICAgICAgIHZpZXdDbGFzc2VzLmluZGV4T2YoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikpID4gLTFcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbm9ybWFsaXplTmFtZShuYW1lKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIG5hbWUgPSBTdHJpbmcobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKC9bXmEtejAtOVxcLSMkJSYnKisuXFxeX2B8fl0vaS50ZXN0KG5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgY2hhcmFjdGVyIGluIGhlYWRlciBmaWVsZCBuYW1lXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZVZhbHVlKHZhbHVlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuXG4gICAgICAvLyBCdWlsZCBhIGRlc3RydWN0aXZlIGl0ZXJhdG9yIGZvciB0aGUgdmFsdWUgbGlzdFxuICAgICAgZnVuY3Rpb24gaXRlcmF0b3JGb3IoaXRlbXMpIHtcbiAgICAgICAgdmFyIGl0ZXJhdG9yID0ge1xuICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gaXRlbXMuc2hpZnQoKTtcbiAgICAgICAgICAgIHJldHVybiB7IGRvbmU6IHZhbHVlID09PSB1bmRlZmluZWQsIHZhbHVlOiB2YWx1ZSB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoc3VwcG9ydC5pdGVyYWJsZSkge1xuICAgICAgICAgIGl0ZXJhdG9yW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVyYXRvcjtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBIZWFkZXJzKGhlYWRlcnMpIHtcbiAgICAgICAgdGhpcy5tYXAgPSB7fTtcblxuICAgICAgICBpZiAoaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMpIHtcbiAgICAgICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGhlYWRlcnMpKSB7XG4gICAgICAgICAgaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKGhlYWRlcikge1xuICAgICAgICAgICAgdGhpcy5hcHBlbmQoaGVhZGVyWzBdLCBoZWFkZXJbMV0pO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9IGVsc2UgaWYgKGhlYWRlcnMpIHtcbiAgICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhoZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIGhlYWRlcnNbbmFtZV0pO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpO1xuICAgICAgICB2YWx1ZSA9IG5vcm1hbGl6ZVZhbHVlKHZhbHVlKTtcbiAgICAgICAgdmFyIG9sZFZhbHVlID0gdGhpcy5tYXBbbmFtZV07XG4gICAgICAgIHRoaXMubWFwW25hbWVdID0gb2xkVmFsdWUgPyBvbGRWYWx1ZSArIFwiLFwiICsgdmFsdWUgOiB2YWx1ZTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24obmFtZSkge1xuICAgICAgICBkZWxldGUgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV07XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5oYXMobmFtZSkgPyB0aGlzLm1hcFtuYW1lXSA6IG51bGw7XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShub3JtYWxpemVOYW1lKG5hbWUpKTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldID0gbm9ybWFsaXplVmFsdWUodmFsdWUpO1xuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcy5tYXApIHtcbiAgICAgICAgICBpZiAodGhpcy5tYXAuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdGhpcy5tYXBbbmFtZV0sIG5hbWUsIHRoaXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgICAgaXRlbXMucHVzaChuYW1lKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcyk7XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGl0ZW1zLnB1c2godmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICAgIGl0ZW1zLnB1c2goW25hbWUsIHZhbHVlXSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpO1xuICAgICAgfTtcblxuICAgICAgaWYgKHN1cHBvcnQuaXRlcmFibGUpIHtcbiAgICAgICAgSGVhZGVycy5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXM7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGNvbnN1bWVkKGJvZHkpIHtcbiAgICAgICAgaWYgKGJvZHkuYm9keVVzZWQpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFR5cGVFcnJvcihcIkFscmVhZHkgcmVhZFwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgYm9keS5ib2R5VXNlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVqZWN0KHJlYWRlci5lcnJvcik7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlYWRCbG9iQXNBcnJheUJ1ZmZlcihibG9iKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgcHJvbWlzZSA9IGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpO1xuICAgICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoYmxvYik7XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiByZWFkQmxvYkFzVGV4dChibG9iKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgcHJvbWlzZSA9IGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpO1xuICAgICAgICByZWFkZXIucmVhZEFzVGV4dChibG9iKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlYWRBcnJheUJ1ZmZlckFzVGV4dChidWYpIHtcbiAgICAgICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWYpO1xuICAgICAgICB2YXIgY2hhcnMgPSBuZXcgQXJyYXkodmlldy5sZW5ndGgpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmlldy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNoYXJzW2ldID0gU3RyaW5nLmZyb21DaGFyQ29kZSh2aWV3W2ldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hhcnMuam9pbihcIlwiKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gYnVmZmVyQ2xvbmUoYnVmKSB7XG4gICAgICAgIGlmIChidWYuc2xpY2UpIHtcbiAgICAgICAgICByZXR1cm4gYnVmLnNsaWNlKDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmLmJ5dGVMZW5ndGgpO1xuICAgICAgICAgIHZpZXcuc2V0KG5ldyBVaW50OEFycmF5KGJ1ZikpO1xuICAgICAgICAgIHJldHVybiB2aWV3LmJ1ZmZlcjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBCb2R5KCkge1xuICAgICAgICB0aGlzLmJvZHlVc2VkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5faW5pdEJvZHkgPSBmdW5jdGlvbihib2R5KSB7XG4gICAgICAgICAgdGhpcy5fYm9keUluaXQgPSBib2R5O1xuICAgICAgICAgIGlmICghYm9keSkge1xuICAgICAgICAgICAgdGhpcy5fYm9keVRleHQgPSBcIlwiO1xuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGJvZHkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYmxvYiAmJiBCbG9iLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5QmxvYiA9IGJvZHk7XG4gICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIHN1cHBvcnQuZm9ybURhdGEgJiZcbiAgICAgICAgICAgIEZvcm1EYXRhLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5Rm9ybURhdGEgPSBib2R5O1xuICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJlxuICAgICAgICAgICAgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHkudG9TdHJpbmcoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIgJiYgc3VwcG9ydC5ibG9iICYmIGlzRGF0YVZpZXcoYm9keSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlBcnJheUJ1ZmZlciA9IGJ1ZmZlckNsb25lKGJvZHkuYnVmZmVyKTtcbiAgICAgICAgICAgIC8vIElFIDEwLTExIGNhbid0IGhhbmRsZSBhIERhdGFWaWV3IGJvZHkuXG4gICAgICAgICAgICB0aGlzLl9ib2R5SW5pdCA9IG5ldyBCbG9iKFt0aGlzLl9ib2R5QXJyYXlCdWZmZXJdKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgc3VwcG9ydC5hcnJheUJ1ZmZlciAmJlxuICAgICAgICAgICAgKEFycmF5QnVmZmVyLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpIHx8XG4gICAgICAgICAgICAgIGlzQXJyYXlCdWZmZXJWaWV3KGJvZHkpKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5fYm9keUFycmF5QnVmZmVyID0gYnVmZmVyQ2xvbmUoYm9keSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVuc3VwcG9ydGVkIEJvZHlJbml0IHR5cGVcIik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCF0aGlzLmhlYWRlcnMuZ2V0KFwiY29udGVudC10eXBlXCIpKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGJvZHkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgdGhpcy5oZWFkZXJzLnNldChcImNvbnRlbnQtdHlwZVwiLCBcInRleHQvcGxhaW47Y2hhcnNldD1VVEYtOFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUJsb2IgJiYgdGhpcy5fYm9keUJsb2IudHlwZSkge1xuICAgICAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KFwiY29udGVudC10eXBlXCIsIHRoaXMuX2JvZHlCbG9iLnR5cGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiZcbiAgICAgICAgICAgICAgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5oZWFkZXJzLnNldChcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiLFxuICAgICAgICAgICAgICAgIFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkO2NoYXJzZXQ9VVRGLThcIlxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoc3VwcG9ydC5ibG9iKSB7XG4gICAgICAgICAgdGhpcy5ibG9iID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKTtcbiAgICAgICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlCbG9iKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlBcnJheUJ1ZmZlcl0pKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgYmxvYlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlUZXh0XSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICB0aGlzLmFycmF5QnVmZmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjb25zdW1lZCh0aGlzKSB8fCBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUFycmF5QnVmZmVyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmJsb2IoKS50aGVuKHJlYWRCbG9iQXNBcnJheUJ1ZmZlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpO1xuICAgICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgICAgcmV0dXJuIHJlYWRCbG9iQXNUZXh0KHRoaXMuX2JvZHlCbG9iKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShcbiAgICAgICAgICAgICAgcmVhZEFycmF5QnVmZmVyQXNUZXh0KHRoaXMuX2JvZHlBcnJheUJ1ZmZlcilcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgdGV4dFwiKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5VGV4dCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzdXBwb3J0LmZvcm1EYXRhKSB7XG4gICAgICAgICAgdGhpcy5mb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oZGVjb2RlKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5qc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oSlNPTi5wYXJzZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIC8vIEhUVFAgbWV0aG9kcyB3aG9zZSBjYXBpdGFsaXphdGlvbiBzaG91bGQgYmUgbm9ybWFsaXplZFxuICAgICAgdmFyIG1ldGhvZHMgPSBbXCJERUxFVEVcIiwgXCJHRVRcIiwgXCJIRUFEXCIsIFwiT1BUSU9OU1wiLCBcIlBPU1RcIiwgXCJQVVRcIl07XG5cbiAgICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZU1ldGhvZChtZXRob2QpIHtcbiAgICAgICAgdmFyIHVwY2FzZWQgPSBtZXRob2QudG9VcHBlckNhc2UoKTtcbiAgICAgICAgcmV0dXJuIG1ldGhvZHMuaW5kZXhPZih1cGNhc2VkKSA+IC0xID8gdXBjYXNlZCA6IG1ldGhvZDtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gUmVxdWVzdChpbnB1dCwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgdmFyIGJvZHkgPSBvcHRpb25zLmJvZHk7XG5cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgUmVxdWVzdCkge1xuICAgICAgICAgIGlmIChpbnB1dC5ib2R5VXNlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkFscmVhZHkgcmVhZFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cmwgPSBpbnB1dC51cmw7XG4gICAgICAgICAgdGhpcy5jcmVkZW50aWFscyA9IGlucHV0LmNyZWRlbnRpYWxzO1xuICAgICAgICAgIGlmICghb3B0aW9ucy5oZWFkZXJzKSB7XG4gICAgICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhpbnB1dC5oZWFkZXJzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5tZXRob2QgPSBpbnB1dC5tZXRob2Q7XG4gICAgICAgICAgdGhpcy5tb2RlID0gaW5wdXQubW9kZTtcbiAgICAgICAgICBpZiAoIWJvZHkgJiYgaW5wdXQuX2JvZHlJbml0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGJvZHkgPSBpbnB1dC5fYm9keUluaXQ7XG4gICAgICAgICAgICBpbnB1dC5ib2R5VXNlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudXJsID0gU3RyaW5nKGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSBvcHRpb25zLmNyZWRlbnRpYWxzIHx8IHRoaXMuY3JlZGVudGlhbHMgfHwgXCJvbWl0XCI7XG4gICAgICAgIGlmIChvcHRpb25zLmhlYWRlcnMgfHwgIXRoaXMuaGVhZGVycykge1xuICAgICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tZXRob2QgPSBub3JtYWxpemVNZXRob2Qob3B0aW9ucy5tZXRob2QgfHwgdGhpcy5tZXRob2QgfHwgXCJHRVRcIik7XG4gICAgICAgIHRoaXMubW9kZSA9IG9wdGlvbnMubW9kZSB8fCB0aGlzLm1vZGUgfHwgbnVsbDtcbiAgICAgICAgdGhpcy5yZWZlcnJlciA9IG51bGw7XG5cbiAgICAgICAgaWYgKCh0aGlzLm1ldGhvZCA9PT0gXCJHRVRcIiB8fCB0aGlzLm1ldGhvZCA9PT0gXCJIRUFEXCIpICYmIGJvZHkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQm9keSBub3QgYWxsb3dlZCBmb3IgR0VUIG9yIEhFQUQgcmVxdWVzdHNcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faW5pdEJvZHkoYm9keSk7XG4gICAgICB9XG5cbiAgICAgIFJlcXVlc3QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVxdWVzdCh0aGlzLCB7IGJvZHk6IHRoaXMuX2JvZHlJbml0IH0pO1xuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gZGVjb2RlKGJvZHkpIHtcbiAgICAgICAgdmFyIGZvcm0gPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgYm9keVxuICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAuc3BsaXQoXCImXCIpXG4gICAgICAgICAgLmZvckVhY2goZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICAgICAgICAgIGlmIChieXRlcykge1xuICAgICAgICAgICAgICB2YXIgc3BsaXQgPSBieXRlcy5zcGxpdChcIj1cIik7XG4gICAgICAgICAgICAgIHZhciBuYW1lID0gc3BsaXQuc2hpZnQoKS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpO1xuICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKFwiPVwiKS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpO1xuICAgICAgICAgICAgICBmb3JtLmFwcGVuZChkZWNvZGVVUklDb21wb25lbnQobmFtZSksIGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZm9ybTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcGFyc2VIZWFkZXJzKHJhd0hlYWRlcnMpIHtcbiAgICAgICAgdmFyIGhlYWRlcnM6IGFueSA9IG5ldyBIZWFkZXJzKHt9KTtcbiAgICAgICAgcmF3SGVhZGVycy5zcGxpdCgvXFxyP1xcbi8pLmZvckVhY2goZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgIHZhciBwYXJ0cyA9IGxpbmUuc3BsaXQoXCI6XCIpO1xuICAgICAgICAgIHZhciBrZXkgPSBwYXJ0cy5zaGlmdCgpLnRyaW0oKTtcbiAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBwYXJ0cy5qb2luKFwiOlwiKS50cmltKCk7XG4gICAgICAgICAgICBoZWFkZXJzLmFwcGVuZChrZXksIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaGVhZGVycztcbiAgICAgIH1cblxuICAgICAgQm9keS5jYWxsKFJlcXVlc3QucHJvdG90eXBlKTtcblxuICAgICAgdmFyIFJlc3BvbnNlOiBhbnkgPSBmdW5jdGlvbihib2R5SW5pdCwgb3B0aW9ucyk6IHZvaWQge1xuICAgICAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnR5cGUgPSBcImRlZmF1bHRcIjtcbiAgICAgICAgdGhpcy5zdGF0dXMgPSBcInN0YXR1c1wiIGluIG9wdGlvbnMgPyBvcHRpb25zLnN0YXR1cyA6IDIwMDtcbiAgICAgICAgdGhpcy5vayA9IHRoaXMuc3RhdHVzID49IDIwMCAmJiB0aGlzLnN0YXR1cyA8IDMwMDtcbiAgICAgICAgdGhpcy5zdGF0dXNUZXh0ID0gXCJzdGF0dXNUZXh0XCIgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RhdHVzVGV4dCA6IFwiT0tcIjtcbiAgICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKTtcbiAgICAgICAgdGhpcy51cmwgPSBvcHRpb25zLnVybCB8fCBcIlwiO1xuICAgICAgICB0aGlzLl9pbml0Qm9keShib2R5SW5pdCk7XG4gICAgICB9O1xuXG4gICAgICBCb2R5LmNhbGwoUmVzcG9uc2UucHJvdG90eXBlKTtcblxuICAgICAgUmVzcG9uc2UucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UodGhpcy5fYm9keUluaXQsIHtcbiAgICAgICAgICBzdGF0dXM6IHRoaXMuc3RhdHVzLFxuICAgICAgICAgIHN0YXR1c1RleHQ6IHRoaXMuc3RhdHVzVGV4dCxcbiAgICAgICAgICBoZWFkZXJzOiBuZXcgSGVhZGVycyh0aGlzLmhlYWRlcnMpLFxuICAgICAgICAgIHVybDogdGhpcy51cmxcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBSZXNwb25zZS5lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UobnVsbCwgeyBzdGF0dXM6IDAsIHN0YXR1c1RleHQ6IFwiXCIgfSk7XG4gICAgICAgIHJlc3BvbnNlLnR5cGUgPSBcImVycm9yXCI7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH07XG5cbiAgICAgIHZhciByZWRpcmVjdFN0YXR1c2VzID0gWzMwMSwgMzAyLCAzMDMsIDMwNywgMzA4XTtcblxuICAgICAgUmVzcG9uc2UucmVkaXJlY3QgPSBmdW5jdGlvbih1cmwsIHN0YXR1cykge1xuICAgICAgICBpZiAocmVkaXJlY3RTdGF0dXNlcy5pbmRleE9mKHN0YXR1cykgPT09IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbnZhbGlkIHN0YXR1cyBjb2RlXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7XG4gICAgICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgICAgICAgaGVhZGVyczogeyBsb2NhdGlvbjogdXJsIH1cbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBzZWxmLkhlYWRlcnMgPSBIZWFkZXJzO1xuICAgICAgc2VsZi5SZXF1ZXN0ID0gUmVxdWVzdDtcbiAgICAgIHNlbGYuUmVzcG9uc2UgPSBSZXNwb25zZTtcblxuICAgICAgc2VsZi5mZXRjaCA9IGZ1bmN0aW9uKGlucHV0LCBpbml0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICB2YXIgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGlucHV0LCBpbml0KTtcbiAgICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9uczoge1xuICAgICAgICAgICAgICBzdGF0dXM6IGFueTtcbiAgICAgICAgICAgICAgc3RhdHVzVGV4dDogYW55O1xuICAgICAgICAgICAgICBoZWFkZXJzOiBhbnk7XG4gICAgICAgICAgICAgIHVybD86IGFueTtcbiAgICAgICAgICAgIH0gPSB7XG4gICAgICAgICAgICAgIHN0YXR1czogeGhyLnN0YXR1cyxcbiAgICAgICAgICAgICAgc3RhdHVzVGV4dDogeGhyLnN0YXR1c1RleHQsXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHBhcnNlSGVhZGVycyh4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkgfHwgXCJcIilcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBvcHRpb25zLnVybCA9XG4gICAgICAgICAgICAgIFwicmVzcG9uc2VVUkxcIiBpbiB4aHJcbiAgICAgICAgICAgICAgICA/IHhoci5yZXNwb25zZVVSTFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5oZWFkZXJzLmdldChcIlgtUmVxdWVzdC1VUkxcIik7XG4gICAgICAgICAgICB2YXIgYm9keSA9IFwicmVzcG9uc2VcIiBpbiB4aHIgPyB4aHIucmVzcG9uc2UgOiB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgcmVzb2x2ZShuZXcgUmVzcG9uc2UoYm9keSwgb3B0aW9ucykpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoXCJOZXR3b3JrIHJlcXVlc3QgZmFpbGVkXCIpKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgeGhyLm9udGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoXCJOZXR3b3JrIHJlcXVlc3QgZmFpbGVkXCIpKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgeGhyLm9wZW4ocmVxdWVzdC5tZXRob2QsIHJlcXVlc3QudXJsLCB0cnVlKTtcblxuICAgICAgICAgIGlmIChyZXF1ZXN0LmNyZWRlbnRpYWxzID09PSBcImluY2x1ZGVcIikge1xuICAgICAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKFwicmVzcG9uc2VUeXBlXCIgaW4geGhyICYmIHN1cHBvcnQuYmxvYikge1xuICAgICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IFwiYmxvYlwiO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlcXVlc3QuaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICB4aHIuc2VuZChcbiAgICAgICAgICAgIHR5cGVvZiByZXF1ZXN0Ll9ib2R5SW5pdCA9PT0gXCJ1bmRlZmluZWRcIiA/IG51bGwgOiByZXF1ZXN0Ll9ib2R5SW5pdFxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIHNlbGYuZmV0Y2gucG9seWZpbGwgPSB0cnVlO1xuICAgIH0pKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHRoaXMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZldGNoOiBzZWxmLmZldGNoLFxuICAgICAgSGVhZGVyczogc2VsZi5IZWFkZXJzLFxuICAgICAgUmVxdWVzdDogc2VsZi5SZXF1ZXN0LFxuICAgICAgUmVzcG9uc2U6IHNlbGYuUmVzcG9uc2VcbiAgICB9O1xuICB9KSgpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZmV0Y2hQb255ZmlsbDtcbiIsImltcG9ydCBmZXRjaFBvbnlmaWxsIGZyb20gXCIuLi92ZW5kb3IvZmV0Y2hQb255ZmlsbFwiO1xuXG50eXBlIFJlcXVlc3RJbml0aWFsaXphdGlvbk9iamVjdCA9IHtcbiAgZW5kcG9pbnQ/OiBzdHJpbmc7XG4gIG9wdGlvbnM/OiBSZXF1ZXN0SW5pdDtcbiAgYm9keT86IEZvcm1EYXRhO1xufTtcblxuY2xhc3MgUmVxdWVzdCB7XG4gIC8vIFByb3BlcnR5IHR5cGVzXG4gIGVuZHBvaW50OiBzdHJpbmc7XG4gIG9wdGlvbnM6IFJlcXVlc3RJbml0O1xuICBib2R5OiBGb3JtRGF0YTtcblxuICAvLyBTdGF0aWMgcHJvcGVydGllc1xuICAvKipcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyIHtvYmplY3R9IFJlcXVlc3QuZGVmYXVsdE9wdGlvbnMgT3B0aW9ucyBvYmplY3QgdG8gZmFsbGJhY2sgdG8gaWZcbiAgICogbm8gb3B0aW9ucyBwcm9wZXJ0eSBpcyBwYXNzZWQgaW50byB0aGUgY29uc3RydWN0b3IgY29uZmlnIG9iamVjdC5cbiAgICovXG4gIHN0YXRpYyBkZWZhdWx0T3B0aW9uczogUmVxdWVzdEluaXQgPSB7XG4gICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgIGhlYWRlcnM6IHsgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XG4gIH07XG5cbiAgLy8gQ29uc3RydWN0b3JcbiAgLyoqXG4gICAqIEBjbGFzcyBSZXF1ZXN0XG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5lbmRwb2ludFxuICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbmZpZy5vcHRpb25zXVxuICAgKiBAcGFyYW0ge0Zvcm1EYXRhfSBbY29uZmlnLmJvZHldXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih7IGVuZHBvaW50LCBvcHRpb25zLCBib2R5IH06IFJlcXVlc3RJbml0aWFsaXphdGlvbk9iamVjdCkge1xuICAgIHRoaXMuZW5kcG9pbnQgPSBlbmRwb2ludDtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IFJlcXVlc3QuZGVmYXVsdE9wdGlvbnM7XG4gICAgdGhpcy5ib2R5ID0gYm9keTtcbiAgfVxuICAvLyBQcml2YXRlIG1ldGhvZHNcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqIEBmdW5jdGlvbiBSZXF1ZXN0LnByZXBhcmVGZXRjaE9wdGlvbnNcbiAgICogQGRlc2NyaXB0aW9uIENyZWF0ZXMgYmxhbmsgRm9ybURhdGEgb2JqZWN0IGlmIHRoaXMuYm9keSBpcyB1bmRlZmluZWQgYW5kXG4gICAqIHRoaXMub3B0aW9ucy5tZXRob2QgaXMgZXF1YWwgdG8gXCJQT1NUXCIuXG4gICAqIEByZXR1cm5zIHtGb3JtRGF0YX1cbiAgICovXG4gIHByaXZhdGUgcHJlcGFyZUZldGNoT3B0aW9ucyA9ICgpID0+IHtcbiAgICBpZiAoIXRoaXMuYm9keSAmJiB0aGlzLm9wdGlvbnMubWV0aG9kID09PSBcIlBPU1RcIikge1xuICAgICAgdGhpcy5ib2R5ID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmJvZHk7XG4gIH07XG4gIC8vIFB1YmxpYyBtZXRob2RzXG4gIC8qKlxuICAgKiBAcHVibGljXG4gICAqIEBmdW5jdGlvbiBSZXF1ZXN0LnNlbmRcbiAgICogQHBhcmFtXHR7b2JqZWN0fSBvcHRpb25zXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuYXN5bmNdIEFsbG93cyBwcm9wZXJ0eSBgYXN5bmNgIHRvIGJlIHNldCB0byBpbmRpY2F0ZSB0aGVcbiAgICogcmVzcG9uc2Ugc2hvdWxkIGJlIHByZXBhcmVkIGJlZm9yZSByZXR1cm5pbmcuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgcHVibGljIHNlbmQgPSAoeyBhc3luYyB9OiB7IGFzeW5jOiBib29sZWFuIH0gPSB7IGFzeW5jOiBmYWxzZSB9KSA9PiB7XG4gICAgY29uc3QgeyBmZXRjaCB9ID0gd2luZG93XG4gICAgICA/IHdpbmRvdy5mZXRjaCA/IHdpbmRvdyA6IGZldGNoUG9ueWZpbGwoe30pLmZldGNoXG4gICAgICA6IHtcbiAgICAgICAgICBmZXRjaDogKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiZmV0Y2ggaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgY29uc3QgcHJlcGFyZWRPcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgdGhpcy5wcmVwYXJlRmV0Y2hPcHRpb25zKCksXG4gICAgICB0aGlzLm9wdGlvbnNcbiAgICApO1xuICAgIGNvbnN0IGluaXRGZXRjaCA9IGZldGNoKHRoaXMuZW5kcG9pbnQsIHByZXBhcmVkT3B0aW9ucyk7XG4gICAgcmV0dXJuIGFzeW5jID8gaW5pdEZldGNoLnRoZW4ocmVzID0+IHJlcy5qc29uKCkpIDogaW5pdEZldGNoO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBSZXF1ZXN0O1xuIiwiLyoqXG4gKiBAbW9kdWxlIGRhdGFNYW5pcHVsYXRpb25cbiAqL1xuXG50eXBlIGFscGhhbnVtZXJpYyA9IHN0cmluZyB8IG51bWJlcjtcbnR5cGUgYXJyYXlMaWtlID0gc3RyaW5nIHwgYWxwaGFudW1lcmljW107XG5cbi8qKlxuICogQGZ1bmN0aW9uIHNlYXJjaFByb3BQYXRoXG4gKiBAZGVzY3JpcHRpb24gUmVjdXJzaXZlbHkgc2VhcmNocyB0aHJvdWdoIGEgZGF0YSBvYmplY3Q7IHRocm93cyBhbiBlcnJvciBpZiB0aGUgcmVzdWx0aW5nIHZhbHVlIG9mIGEgc2VhcmNoZWQgcGF0aCBpcyB1bmRlZmluZWQuXG4gKiBAcGFyYW0ge2FscGhhbnVtZXJpY1tdfSBbcGF0aF0gQXJyYXkgb2Yga2V5cyBpbiB0aGUgb3JkZXIgb2Ygd2hpY2ggd2lsbCBiZSB1c2VkIHRvIHJlY3Vyc2l2ZWx5IHNlYXJjaCBhbiBvYmplY3RcbiAqIEBwYXJhbSB7b2JqZWN0fSBbY29sbGVjdGlvbl0gRGF0YSBvYmplY3RcbiAqIEBwYXJhbSB7c3RyaW5nfSBbZGVsaW1pdGVyXSBEZWxpbWl0ZXIgYnkgd2hpY2ggdG8gc3BsaXQgdGhlIHBhdGg7IGRlZmF1bHRzIHRvICcuJ1xuICogQHJldHVybiB7YW55fSBWYWx1ZSBhdCB0aGUgZW5kIG9mIHRoZSBzZWFyY2hlZCBwcm9wZXJ0eSBwYXRoO1xuICovXG5jb25zdCBzZWFyY2hQcm9wUGF0aCA9IChcblx0cGF0aDogYXJyYXlMaWtlLFxuXHRjb2xsZWN0aW9uOiBvYmplY3QsXG5cdGRlbGltaXRlcjogc3RyaW5nID0gXCIuXCJcbik6IGFueSA9PiB7XG5cdGNvbnN0IHNhZmVQYXRoID0gdHlwZW9mIHBhdGggPT09IFwic3RyaW5nXCIgPyBwYXRoLnNwbGl0KGRlbGltaXRlcikgOiBwYXRoO1xuXHRsZXQgcGF0aFJlc3VsdCA9IGNvbGxlY3Rpb247XG5cdHNhZmVQYXRoLmZvckVhY2goa2V5ID0+IHtcblx0XHRwYXRoUmVzdWx0ID0gcGF0aFJlc3VsdFtrZXldO1xuXHR9KTtcblx0aWYgKHBhdGhSZXN1bHQpIHJldHVybiBwYXRoUmVzdWx0O1xuXHR0aHJvdyBuZXcgRXJyb3IoXG5cdFx0YHBhdGhSZXN1bHQgeWllbGRzIHVuZGVmaW5lZCB2YWx1ZSB3aGVuIHNlYXJjaGluZyAke3NhZmVQYXRoLmpvaW4oXG5cdFx0XHRkZWxpbWl0ZXJcblx0XHQpfSBvbiBjb2xsZWN0aW9uIGFyZ3VtZW50LmBcblx0KTtcbn07XG5cbmV4cG9ydCB7IHNlYXJjaFByb3BQYXRoIH07XG4iLCIvKipcbiAqIEBtb2R1bGUgcGFyc2VcbiAqL1xuXG4vKipcbiAqIEJhc2UgZnJvbSBodHRwczovL2dpc3QuZ2l0aHViLmNvbS9nZW9mZmRhdmlzOTIvMWRhN2QwNzQ1ZTNiYmEwMzZmOTRcbiAqIEBmdW5jdGlvbiBwYXJhbXNcbiAqIEBkZXNjcmlwdGlvbiBDcmVhdGVzIG9iamVjdCBvZiBrZXkvdmFsdWUgcGFpcnMgZnJvbSBVUkwgcGFyYW1ldGVycy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbdXJsXSBVUkwgdG8gcGFyc2U7IGRlZmF1bHRzIHRvIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2guXG4gKiBAcmV0dXJuIHtvYmplY3R9IE9iamVjdCBvZiBrZXkvdmFsdWUgcGFpcnMuXG4gKi9cbmNvbnN0IHBhcmFtcyA9ICh1cmw6IHN0cmluZyA9IHdpbmRvdy5sb2NhdGlvbi5zZWFyY2gpOiBvYmplY3QgPT5cbiAgdXJsXG4gICAgLnNwbGl0KFwiP1wiKVsxXVxuICAgIC5zcGxpdChcIiZcIilcbiAgICAubWFwKHEgPT4gcS5zcGxpdChcIj1cIikpXG4gICAgLnJlZHVjZSgoYWNjLCBba2V5LCB2YWxdLCBpLCBhcnIpID0+IHtcbiAgICAgIGFjY1trZXldID0gZGVjb2RlVVJJQ29tcG9uZW50KHZhbCkucmVwbGFjZSgvXFwrL2csIFwiIFwiKTtcbiAgICAgIHJldHVybiBhY2M7XG4gICAgfSwge30pO1xuXG4vKipcbiAqIEBmdW5jdGlvbiBwYXJzZUV4dGVybmFsTWFya2Rvd25MaW5rc1xuICogQGRlc2NyaXB0aW9uIFRyYW5zZm9ybXMgTWFya2Rvd24gbGlua3MgdG8gdXNlIHRhcmdldD1cIl9ibGFua1wiLCByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI7XG4gKiB1c3VhbGx5IHVzZWQgd2hlbiBpbXBsZW1lbnRpbmcgY2xpZW50c2lkZSBNYXJrZG93biwgYmVmb3JlIHNlbmRpbmcgdGhlIE1hcmtkb3duIHRvIHRoZSBtYWluXG4gKiBwYXJzaW5nIGZ1bmN0aW9uLlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBTdHJpbmcgdG8gcGFyc2UgYXMgTWFya2Rvd24gbGluay5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IEhUTUwgbGluayB3aXRoIFVSTCBhbmQgaW5uZXJUZXh0LCB0YXJnZXQgYW5kIHJlbCBhdHRyaWJ1dGVzIHByb3Blcmx5IHNldCBmb3JcbiAqIGFuIGV4dGVybmFsIGxpbmsuXG4gKi9cbmNvbnN0IHBhcnNlRXh0ZXJuYWxNYXJrZG93bkxpbmtzID0gKHN0cmluZzogc3RyaW5nKTogc3RyaW5nID0+IHtcbiAgY29uc3QgcGF0dGVybjogUmVnRXhwID0gL1xcWyhbXlxcXV0rKVxcXVxcKChbXildKylcXCkvZztcbiAgaWYgKHN0cmluZy5zZWFyY2gocGF0dGVybikgPiAtMSkge1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZShcbiAgICAgIHBhdHRlcm4sXG4gICAgICAnPGEgaHJlZj1cIiQyXCIgdGFyZ2V0PVwiX2JsYW5rXCIgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiPiQxPC9hPidcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzdHJpbmc7XG4gIH1cbn07XG5cbmV4cG9ydCB7IHBhcmFtcyBhcyBwYXJzZVVSTFBhcmFtcywgcGFyc2VFeHRlcm5hbE1hcmtkb3duTGlua3MgfTtcbiIsIi8qKlxuICogQG1vZHVsZSBzY3JvbGxcbiAqL1xuXG4vKipcbiAqIEBmdW5jdGlvbiBpc0VsZW1lbnRJblZpZXdwb3J0XG4gKiBAZGVzY3JpcHRpb24gRGV0ZXJtaW5lcyBpZiBhIGdpdmVuIGVsZW1lbnQgaXMgcGFydGlhbGx5IG9yXG4gKiBmdWxseSB2aXNpYmxlIGluIHRoZSB2aWV3cG9ydC5cbiAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAqIEBwYXJhbSB7RWxlbWVudH0gY29uZmlnLmVsZW1lbnQgSFRNTCBFbGVtZW50IG5vZGUgdG8gdGFyZ2V0LlxuICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcudGhyZXNob2xkXSBSYXRpbyBvZiB0aGUgdmlld3BvcnQgaGVpZ2h0IHRoZSBlbGVtZW50XG4gKiBtdXN0IGZpbGwgYmVmb3JlIGJlaW5nIGNvbnNpZGVyZWQgdmlzaWJsZS4gRS5nLiAwLjUgbWVhbnMgdGhlIGVsZW1lbnRcbiAqIG11c3QgdGFrZSB1cCA1MCUgb2YgdGhlIHNjcmVlbiBiZWZvcmUgcmV0dXJuaW5nIHRydWUuIERlZmF1bHRzIHRvIDAuMjUuXG4gKiBPbmx5IHVzZWQgZm9yIGVsZW1lbnRzIHRhbGxlciB0aGFuIHRoZSB2aWV3cG9ydC5cbiAqIEByZXR1cm4ge2Jvb2xlYW59IEJvb2xlYW4gZGVzY3JpYmluZyBpZiBpbnB1dCBpcyBmdWxseS9wYXJ0aWFsbHlcbiAqIGluIHRoZSB2aWV3cG9ydCwgcmVsYXRpdmUgdG8gdGhlIHRocmVzaG9sZCBzZXR0aW5nLlxuICovXG5mdW5jdGlvbiBpc0VsZW1lbnRJblZpZXdwb3J0KHtcbiAgZWxlbWVudDogYXJnRWxlbWVudCxcbiAgdGhyZXNob2xkOiBhcmdUaHJlc2hvbGRcbn06IHtcbiAgZWxlbWVudDogRWxlbWVudDtcbiAgdGhyZXNob2xkOiBudW1iZXI7XG59KTogYm9vbGVhbiB7XG4gIGNvbnN0IGRlZmF1bHRQYXJhbXM6IHtcbiAgICB0aHJlc2hvbGQ6IG51bWJlcjtcbiAgfSA9IHtcbiAgICB0aHJlc2hvbGQ6IDAuMjVcbiAgfTtcblxuICBjb25zdCBzYWZlQXJncyA9IHtcbiAgICB0aHJlc2hvbGQ6IGFyZ1RocmVzaG9sZCB8fCBkZWZhdWx0UGFyYW1zLnRocmVzaG9sZFxuICB9O1xuXG4gIGNvbnN0IHJlY3Q6IENsaWVudFJlY3QgfCBET01SZWN0ID0gYXJnRWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICBjb25zdCB2aWV3cG9ydEhlaWdodDogbnVtYmVyID0gTWF0aC5tYXgoXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNsaWVudEhlaWdodCxcbiAgICB3aW5kb3cuaW5uZXJIZWlnaHQgfHwgMFxuICApO1xuICBjb25zdCB7IHRocmVzaG9sZCB9ID0gc2FmZUFyZ3M7XG5cbiAgaWYgKHRocmVzaG9sZCA8IDAgfHwgdGhyZXNob2xkID4gMSkge1xuICAgIHRocm93IG5ldyBSYW5nZUVycm9yKFxuICAgICAgXCJUaHJlc2hvbGQgYXJndW1lbnQgbXVzdCBiZSBhIGRlY2ltYWwgYmV0d2VlbiAwIGFuZCAxXCJcbiAgICApO1xuICB9XG5cbiAgLy9JZiB0aGUgZWxlbWVudCBpcyB0b28gdGFsbCB0byBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydFxuICBpZiAocmVjdC5oZWlnaHQgPj0gdGhyZXNob2xkICogdmlld3BvcnRIZWlnaHQpIHtcbiAgICBpZiAoXG4gICAgICByZWN0LnRvcCAtIHZpZXdwb3J0SGVpZ2h0IDw9IHRocmVzaG9sZCAqIHZpZXdwb3J0SGVpZ2h0ICogLTEgJiZcbiAgICAgIHJlY3QuYm90dG9tID49IHRocmVzaG9sZCAqIHZpZXdwb3J0SGVpZ2h0XG4gICAgKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvL0lmIHRoZSBlbGVtZW50IGlzIHNob3J0IGVub3VnaCB0byBmaXQgd2l0aGluIHRoZSB2aWV3cG9ydFxuICAgIGlmIChyZWN0LnRvcCA+PSAwICYmIHJlY3QuYm90dG9tIC0gdmlld3BvcnRIZWlnaHQgPD0gMCkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBGcm9tIGh0dHA6Ly9iaXQubHkvMmNQNjVmRFxuICogQHRvZG8gQ2xhc3NpZnkgYW5kIGRlc2NyaWJlIHBhcmFtcy5cbiAqIEBmdW5jdGlvbiBzY3JvbGxUb1xuICogQGRlc2NyaXB0aW9uIFNjcm9sbHMgZ2l2ZW4gZWxlbWVudCB0byBkZXRlcm1pbmVkIHBvaW50LlxuICogQHBhcmFtICB7RWxlbWVudH0gZWxlbWVudCAgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7bnVtYmVyfSB0byAgICAgICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtudW1iZXJ9IGR1cmF0aW9uIFtkZXNjcmlwdGlvbl1cbiAqIEByZXR1cm4ge3ZvaWR9XG4gKi9cbmZ1bmN0aW9uIHNjcm9sbFRvKGVsZW1lbnQ6IEVsZW1lbnQsIHRvOiBudW1iZXIsIGR1cmF0aW9uOiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKGR1cmF0aW9uIDw9IDApIHJldHVybjtcbiAgY29uc3QgZGlmZmVyZW5jZTogbnVtYmVyID0gdG8gLSBlbGVtZW50LnNjcm9sbFRvcDtcbiAgY29uc3QgcGVyVGljazogbnVtYmVyID0gZGlmZmVyZW5jZSAvIGR1cmF0aW9uICogMTA7XG5cbiAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICBlbGVtZW50LnNjcm9sbFRvcCA9IGVsZW1lbnQuc2Nyb2xsVG9wICsgcGVyVGljaztcbiAgICBpZiAoZWxlbWVudC5zY3JvbGxUb3AgPT09IHRvKSByZXR1cm47XG4gICAgc2Nyb2xsVG8oZWxlbWVudCwgdG8sIGR1cmF0aW9uIC0gMTApO1xuICB9LCAxMCk7XG59XG5cbmV4cG9ydCB7IGlzRWxlbWVudEluVmlld3BvcnQsIHNjcm9sbFRvIH07XG4iLCIvKipcbiAqIEBtb2R1bGUgc2VsZWN0XG4gKi9cblxuLyoqXG4gKiBAZnVuY3Rpb24gc2VsZWN0XG4gKiBAZGVzY3JpcHRpb24gU2VsZWN0cyBhIERPTSBub2RlIGJhc2VkIG9uIGEgcXVlcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30gcXVlcnkgcXVlcnkgc2VsZWN0b3IgdG8gdXNlIHRvIHF1ZXJ5IGFuIG5vZGUuXG4gKiBAcmV0dXJucyB7RWxlbWVudH0gRmlyc3QgRE9NIG5vZGUgdGhhdCBtYXRjaGVzIHRoZSBxdWVyeS5cbiAqL1xuY29uc3Qgc2VsZWN0OiBGdW5jdGlvbiA9IChxdWVyeTogc3RyaW5nKTogRWxlbWVudCA9PlxuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHF1ZXJ5KTtcblxuLyoqXG4gKiBAZnVuY3Rpb24gc2VsZWN0QWxsXG4gKiBAZGVzY3JpcHRpb24gU2VsZWN0cyBhIERPTSBub2RlbGlzdCBiYXNlZCBvbiBhIHF1ZXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IHF1ZXJ5IHNlbGVjdG9yIHRvIHVzZSB0byBxdWVyeSBhIG5vZGVsaXN0LlxuICogQHJldHVybnMge0VsZW1lbnRbXX0gQXJyYXkgb2YgRE9NIG5vZGVzIHRoYXQgbWF0Y2ggdGhlIHF1ZXJ5LlxuICovXG5jb25zdCBzZWxlY3RBbGw6IEZ1bmN0aW9uID0gKHF1ZXJ5OiBzdHJpbmcpOiBFbGVtZW50W10gPT4gW1xuICAuLi5kb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKHF1ZXJ5KVxuXTtcblxuLyoqXG4gKiBAZnVuY3Rpb24gc2VsZWN0QnlJZFxuICogQGRlc2NyaXB0aW9uIFNlbGVjdHMgYSBET00gbm9kZSBiYXNlZCBvbiBhbiBJRCBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30gaWQgSUQgb2YgRE9NIG5vZGUgdG8gc2VsZWN0LlxuICogQHJldHVybnMge0VsZW1lbnR9IERPTSBub2RlIHdpdGggbWF0Y2hlZCBJRC5cbiAqL1xuY29uc3Qgc2VsZWN0QnlJZDogRnVuY3Rpb24gPSAoaWQ6IHN0cmluZyk6IEVsZW1lbnQgPT5cbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoaWQpO1xuXG5leHBvcnQgeyBzZWxlY3QsIHNlbGVjdEFsbCwgc2VsZWN0QnlJZCB9O1xuIiwiLyoqXG4gKiBAbW9kdWxlIHR5cG9ncmFwaHlcbiAqL1xuXG4vKipcbiAqIEBmdW5jdGlvbiBjYXBpdGFsaXplXG4gKiBAZGVzY3JpcHRpb24gQ2FwaXRhbGl6ZXMgYWxsIHdvcmRzIGluIGEgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBUZXh0IHRvIGNhcGl0YWxpemUuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBUaXRsZS1jYXNlZCB0ZXh0LlxuICovXG5jb25zdCBjYXBpdGFsaXplID0gKHN0cmluZzogc3RyaW5nKTogc3RyaW5nID0+XG4gIHN0cmluZ1xuICAgIC5zcGxpdChcIiBcIilcbiAgICAubWFwKHMgPT4gdWNGaXJzdChzKSlcbiAgICAuam9pbihcIiBcIik7XG5cbi8qKlxuICogQGZ1bmN0aW9uIHNsdWdpZnlcbiAqIEBkZXNjcmlwdGlvbiBMb3dlcmNhc2VzIHN0cmluZywgcmVwbGFjZXMgc3BhY2VzIGFuZCBzcGVjaWFsIGNoYXJhY3RlcnNcbiAqIHdpdGggYSBzZXQgZGVsaW1pdGVyLlxuICogQHBhcmFtIHtzdHJpbmd9IHRleHRUb1NsdWcgVGV4dCB0byBzbHVnaWZ5LlxuICogQHBhcmFtIHtzdHJpbmd9IFtkZWxpbWl0ZXJdIERlbGltaXRlcjsgZGVmYXVsdHMgdG8gXCItXCIuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBTbHVnaWZpZWQgdGV4dC5cbiAqL1xuY29uc3Qgc2x1Z2lmeSA9ICh0ZXh0VG9TbHVnOiBzdHJpbmcsIGRlbGltaXRlcjogc3RyaW5nID0gXCItXCIpOiBzdHJpbmcgPT5cbiAgdGV4dFRvU2x1Z1xuICAgIC5yZXBsYWNlKC8oXFwhfCN8XFwkfCV8XFwqfFxcLnxcXC98XFxcXHxcXCh8XFwpfFxcK3xcXHx8XFwsfFxcOnxcXCd8XFxcIikvZywgXCJcIilcbiAgICAucmVwbGFjZSgvKC4pKFxcc3xcXF98XFwtKSsoLikvZywgYCQxJHtkZWxpbWl0ZXJ9JDNgKVxuICAgIC50b0xvd2VyQ2FzZSgpO1xuXG4vKipcbiAqIEBmdW5jdGlvbiB0cmltXG4gKiBAZGVzY3JpcHRpb24gVHJpbXMgd2hpdGVzcGFjZSBvbiBlaXRoZXIgZW5kIG9mIGEgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBUZXh0IHRvIHRyaW0uXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBUcmltbWVkIHRleHQuXG4gKi9cbmNvbnN0IHRyaW0gPSAoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcgPT4gc3RyaW5nLnJlcGxhY2UoL15cXHMrfFxccyskL2csIFwiXCIpO1xuXG4vKipcbiAqIEBmdW5jdGlvbiB1Y0ZpcnN0XG4gKiBAZGVzY3JpcHRpb24gQ2FwaXRhbGl6ZXMgZmlyc3Qgd29yZCBpbiBhIHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGV4dCB0byBjYXBpdGFsaXplLlxuICogQHJldHVybnMge3N0cmluZ30gQ2FwaXRhbGl6ZWQgdGV4dC5cbiAqL1xuY29uc3QgdWNGaXJzdCA9IChbZmlyc3RMZXR0ZXIsIC4uLnJlc3RMZXR0ZXJzXTogc3RyaW5nKTogc3RyaW5nID0+XG4gIGAke2ZpcnN0TGV0dGVyLnRvVXBwZXJDYXNlKCl9JHtyZXN0TGV0dGVycy5qb2luKFwiXCIpfWA7XG5cbmV4cG9ydCB7IGNhcGl0YWxpemUsIHNsdWdpZnksIHRyaW0sIHVjRmlyc3QgfTtcbiJdLCJuYW1lcyI6WyJmZXRjaFBvbnlmaWxsIiwib3B0aW9ucyIsIndpbmRvdyIsInNlbGYiLCJnbG9iYWwiLCJQcm9taXNlIiwiWE1MSHR0cFJlcXVlc3QiLCJPYmplY3QiLCJjcmVhdGUiLCJ1bmRlZmluZWQiLCJmZXRjaCIsInN1cHBvcnQiLCJTeW1ib2wiLCJCbG9iIiwiZSIsImFycmF5QnVmZmVyIiwidmlld0NsYXNzZXMiLCJpc0RhdGFWaWV3Iiwib2JqIiwiRGF0YVZpZXciLCJwcm90b3R5cGUiLCJpc1Byb3RvdHlwZU9mIiwiaXNBcnJheUJ1ZmZlclZpZXciLCJBcnJheUJ1ZmZlciIsImlzVmlldyIsImluZGV4T2YiLCJ0b1N0cmluZyIsImNhbGwiLCJuYW1lIiwiU3RyaW5nIiwidGVzdCIsIlR5cGVFcnJvciIsInRvTG93ZXJDYXNlIiwidmFsdWUiLCJpdGVtcyIsIml0ZXJhdG9yIiwic2hpZnQiLCJkb25lIiwiaXRlcmFibGUiLCJoZWFkZXJzIiwibWFwIiwiSGVhZGVycyIsImZvckVhY2giLCJhcHBlbmQiLCJBcnJheSIsImlzQXJyYXkiLCJoZWFkZXIiLCJnZXRPd25Qcm9wZXJ0eU5hbWVzIiwibm9ybWFsaXplTmFtZSIsIm5vcm1hbGl6ZVZhbHVlIiwib2xkVmFsdWUiLCJnZXQiLCJoYXMiLCJoYXNPd25Qcm9wZXJ0eSIsInNldCIsImNhbGxiYWNrIiwidGhpc0FyZyIsImtleXMiLCJwdXNoIiwiaXRlcmF0b3JGb3IiLCJ2YWx1ZXMiLCJlbnRyaWVzIiwiYm9keSIsImJvZHlVc2VkIiwicmVqZWN0IiwicmVhZGVyIiwicmVzb2x2ZSIsIm9ubG9hZCIsInJlc3VsdCIsIm9uZXJyb3IiLCJlcnJvciIsImJsb2IiLCJGaWxlUmVhZGVyIiwicHJvbWlzZSIsImZpbGVSZWFkZXJSZWFkeSIsInJlYWRBc0FycmF5QnVmZmVyIiwicmVhZEFzVGV4dCIsImJ1ZiIsInZpZXciLCJVaW50OEFycmF5IiwiY2hhcnMiLCJsZW5ndGgiLCJpIiwiZnJvbUNoYXJDb2RlIiwiam9pbiIsInNsaWNlIiwiYnl0ZUxlbmd0aCIsImJ1ZmZlciIsIl9pbml0Qm9keSIsIl9ib2R5SW5pdCIsIl9ib2R5VGV4dCIsIl9ib2R5QmxvYiIsImZvcm1EYXRhIiwiRm9ybURhdGEiLCJfYm9keUZvcm1EYXRhIiwic2VhcmNoUGFyYW1zIiwiVVJMU2VhcmNoUGFyYW1zIiwiX2JvZHlBcnJheUJ1ZmZlciIsImJ1ZmZlckNsb25lIiwiRXJyb3IiLCJ0eXBlIiwicmVqZWN0ZWQiLCJjb25zdW1lZCIsInRoZW4iLCJyZWFkQmxvYkFzQXJyYXlCdWZmZXIiLCJ0ZXh0IiwicmVhZEJsb2JBc1RleHQiLCJyZWFkQXJyYXlCdWZmZXJBc1RleHQiLCJkZWNvZGUiLCJqc29uIiwiSlNPTiIsInBhcnNlIiwibWV0aG9kcyIsIm1ldGhvZCIsInVwY2FzZWQiLCJ0b1VwcGVyQ2FzZSIsImlucHV0IiwiUmVxdWVzdCIsInVybCIsImNyZWRlbnRpYWxzIiwibW9kZSIsIm5vcm1hbGl6ZU1ldGhvZCIsInJlZmVycmVyIiwiY2xvbmUiLCJmb3JtIiwidHJpbSIsInNwbGl0IiwiYnl0ZXMiLCJyZXBsYWNlIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwicmF3SGVhZGVycyIsImxpbmUiLCJwYXJ0cyIsImtleSIsIlJlc3BvbnNlIiwiYm9keUluaXQiLCJzdGF0dXMiLCJvayIsInN0YXR1c1RleHQiLCJyZXNwb25zZSIsInJlZGlyZWN0U3RhdHVzZXMiLCJyZWRpcmVjdCIsIlJhbmdlRXJyb3IiLCJsb2NhdGlvbiIsImluaXQiLCJyZXF1ZXN0IiwieGhyIiwicGFyc2VIZWFkZXJzIiwiZ2V0QWxsUmVzcG9uc2VIZWFkZXJzIiwicmVzcG9uc2VVUkwiLCJyZXNwb25zZVRleHQiLCJvbnRpbWVvdXQiLCJvcGVuIiwid2l0aENyZWRlbnRpYWxzIiwicmVzcG9uc2VUeXBlIiwic2V0UmVxdWVzdEhlYWRlciIsInNlbmQiLCJwb2x5ZmlsbCIsImVuZHBvaW50IiwiYXN5bmMiLCJ3YXJuIiwicHJlcGFyZWRPcHRpb25zIiwicHJlcGFyZUZldGNoT3B0aW9ucyIsImluaXRGZXRjaCIsInJlcyIsImRlZmF1bHRPcHRpb25zIiwiQWNjZXB0Iiwic2VhcmNoUHJvcFBhdGgiLCJwYXRoIiwiY29sbGVjdGlvbiIsImRlbGltaXRlciIsInNhZmVQYXRoIiwicGF0aFJlc3VsdCIsInBhcmFtcyIsInNlYXJjaCIsInEiLCJyZWR1Y2UiLCJhY2MiLCJhcnIiLCJ2YWwiLCJwYXJzZUV4dGVybmFsTWFya2Rvd25MaW5rcyIsInN0cmluZyIsInBhdHRlcm4iLCJhcmdFbGVtZW50IiwiZWxlbWVudCIsImFyZ1RocmVzaG9sZCIsInRocmVzaG9sZCIsImRlZmF1bHRQYXJhbXMiLCJzYWZlQXJncyIsInJlY3QiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJ2aWV3cG9ydEhlaWdodCIsIk1hdGgiLCJtYXgiLCJkb2N1bWVudCIsImRvY3VtZW50RWxlbWVudCIsImNsaWVudEhlaWdodCIsImlubmVySGVpZ2h0IiwiaGVpZ2h0IiwidG9wIiwiYm90dG9tIiwidG8iLCJkdXJhdGlvbiIsImRpZmZlcmVuY2UiLCJzY3JvbGxUb3AiLCJwZXJUaWNrIiwic2VsZWN0IiwicXVlcnkiLCJxdWVyeVNlbGVjdG9yIiwic2VsZWN0QWxsIiwicXVlcnlTZWxlY3RvckFsbCIsInNlbGVjdEJ5SWQiLCJpZCIsImdldEVsZW1lbnRCeUlkIiwiY2FwaXRhbGl6ZSIsInVjRmlyc3QiLCJzIiwic2x1Z2lmeSIsInRleHRUb1NsdWciLCJmaXJzdExldHRlciIsInJlc3RMZXR0ZXJzIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7Ozs7O0FBUUEsSUFBTUEsZ0JBQWdCLHNCQUFBLENBQXVCQyxPQUF2QjtRQUNoQkMsU0FBU0EsU0FBU0EsTUFBVCxHQUFrQixLQUEvQjtRQUNJQyxPQUFPLE9BQU9BLElBQVAsS0FBZ0IsV0FBaEIsR0FBK0JELFNBQVNBLE1BQVQsR0FBa0JFLE1BQWpELEdBQTJERCxJQUF0RTtRQUNJRSxVQUFXSixXQUFXQSxRQUFRSSxPQUFwQixJQUFnQ0YsS0FBS0UsT0FBbkQ7UUFDSUMsaUJBQ0RMLFdBQVdBLFFBQVFLLGNBQXBCLElBQXVDSCxLQUFLRyxjQUQ5QztRQUVJRixTQUFTRCxJQUFiO1dBRVE7WUFDRkEsT0FBT0ksT0FBT0MsTUFBUCxDQUFjSixNQUFkLEVBQXNCO21CQUN4Qjt1QkFDRUssU0FERjswQkFFSzs7U0FISCxDQUFYO1NBT0MsVUFBU04sSUFBVDtnQkFHS0EsS0FBS08sS0FBVCxFQUFnQjs7O2dCQUlaQyxVQUFVOzhCQUNFLHFCQUFxQlIsSUFEdkI7MEJBRUYsWUFBWUEsSUFBWixJQUFvQixjQUFjUyxNQUZoQztzQkFJVixnQkFBZ0JULElBQWhCLElBQ0EsVUFBVUEsSUFEVixJQUVDO3dCQUNLOzRCQUNFVSxJQUFKOytCQUNPLElBQVA7cUJBRkYsQ0FHRSxPQUFPQyxDQUFQLEVBQVU7K0JBQ0gsS0FBUDs7aUJBTEosRUFOVTswQkFjRixjQUFjWCxJQWRaOzZCQWVDLGlCQUFpQkE7YUFmaEM7Z0JBa0JJUSxRQUFRSSxXQUFaLEVBQXlCO29CQUNuQkMsY0FBYyxDQUNoQixvQkFEZ0IsRUFFaEIscUJBRmdCLEVBR2hCLDRCQUhnQixFQUloQixxQkFKZ0IsRUFLaEIsc0JBTGdCLEVBTWhCLHFCQU5nQixFQU9oQixzQkFQZ0IsRUFRaEIsdUJBUmdCLEVBU2hCLHVCQVRnQixDQUFsQjtvQkFZSUMsYUFBYSxTQUFiQSxVQUFhLENBQVNDLEdBQVQ7MkJBQ1JBLE9BQU9DLFNBQVNDLFNBQVQsQ0FBbUJDLGFBQW5CLENBQWlDSCxHQUFqQyxDQUFkO2lCQURGO29CQUlJSSxvQkFDRkMsWUFBWUMsTUFBWixJQUNBLFVBQVNOLEdBQVQ7MkJBRUlBLE9BQ0FGLFlBQVlTLE9BQVosQ0FBb0JsQixPQUFPYSxTQUFQLENBQWlCTSxRQUFqQixDQUEwQkMsSUFBMUIsQ0FBK0JULEdBQS9CLENBQXBCLElBQTJELENBQUMsQ0FGOUQ7aUJBSEo7O2tDQVVGLENBQXVCVSxJQUF2QjtvQkFDTSxPQUFPQSxJQUFQLEtBQWdCLFFBQXBCLEVBQThCOzJCQUNyQkMsT0FBT0QsSUFBUCxDQUFQOztvQkFFRSw2QkFBNkJFLElBQTdCLENBQWtDRixJQUFsQyxDQUFKLEVBQTZDOzBCQUNyQyxJQUFJRyxTQUFKLENBQWMsd0NBQWQsQ0FBTjs7dUJBRUtILEtBQUtJLFdBQUwsRUFBUDs7bUNBR0YsQ0FBd0JDLEtBQXhCO29CQUNNLE9BQU9BLEtBQVAsS0FBaUIsUUFBckIsRUFBK0I7NEJBQ3JCSixPQUFPSSxLQUFQLENBQVI7O3VCQUVLQSxLQUFQOzs7Z0NBSUYsQ0FBcUJDLEtBQXJCO29CQUNNQyxXQUFXOzBCQUNQOzRCQUNBRixRQUFRQyxNQUFNRSxLQUFOLEVBQVo7K0JBQ08sRUFBRUMsTUFBTUosVUFBVXhCLFNBQWxCLEVBQTZCd0IsT0FBT0EsS0FBcEMsRUFBUDs7aUJBSEo7b0JBT0l0QixRQUFRMkIsUUFBWixFQUFzQjs2QkFDWDFCLE9BQU91QixRQUFoQixJQUE0QjsrQkFDbkJBLFFBQVA7cUJBREY7O3VCQUtLQSxRQUFQOzs0QkFHRixDQUFpQkksT0FBakI7cUJBQ09DLEdBQUwsR0FBVyxFQUFYO29CQUVJRCxtQkFBbUJFLE9BQXZCLEVBQWdDOzRCQUN0QkMsT0FBUixDQUFnQixVQUFTVCxLQUFULEVBQWdCTCxJQUFoQjs2QkFDVGUsTUFBTCxDQUFZZixJQUFaLEVBQWtCSyxLQUFsQjtxQkFERixFQUVHLElBRkg7aUJBREYsTUFJTyxJQUFJVyxNQUFNQyxPQUFOLENBQWNOLE9BQWQsQ0FBSixFQUE0Qjs0QkFDekJHLE9BQVIsQ0FBZ0IsVUFBU0ksTUFBVDs2QkFDVEgsTUFBTCxDQUFZRyxPQUFPLENBQVAsQ0FBWixFQUF1QkEsT0FBTyxDQUFQLENBQXZCO3FCQURGLEVBRUcsSUFGSDtpQkFESyxNQUlBLElBQUlQLE9BQUosRUFBYTsyQkFDWFEsbUJBQVAsQ0FBMkJSLE9BQTNCLEVBQW9DRyxPQUFwQyxDQUE0QyxVQUFTZCxJQUFUOzZCQUNyQ2UsTUFBTCxDQUFZZixJQUFaLEVBQWtCVyxRQUFRWCxJQUFSLENBQWxCO3FCQURGLEVBRUcsSUFGSDs7O29CQU1JUixTQUFSLENBQWtCdUIsTUFBbEIsR0FBMkIsVUFBU2YsSUFBVCxFQUFlSyxLQUFmO3VCQUNsQmUsY0FBY3BCLElBQWQsQ0FBUDt3QkFDUXFCLGVBQWVoQixLQUFmLENBQVI7b0JBQ0lpQixXQUFXLEtBQUtWLEdBQUwsQ0FBU1osSUFBVCxDQUFmO3FCQUNLWSxHQUFMLENBQVNaLElBQVQsSUFBaUJzQixXQUFXQSxXQUFXLEdBQVgsR0FBaUJqQixLQUE1QixHQUFvQ0EsS0FBckQ7YUFKRjtvQkFPUWIsU0FBUixDQUFrQixRQUFsQixJQUE4QixVQUFTUSxJQUFUO3VCQUNyQixLQUFLWSxHQUFMLENBQVNRLGNBQWNwQixJQUFkLENBQVQsQ0FBUDthQURGO29CQUlRUixTQUFSLENBQWtCK0IsR0FBbEIsR0FBd0IsVUFBU3ZCLElBQVQ7dUJBQ2ZvQixjQUFjcEIsSUFBZCxDQUFQO3VCQUNPLEtBQUt3QixHQUFMLENBQVN4QixJQUFULElBQWlCLEtBQUtZLEdBQUwsQ0FBU1osSUFBVCxDQUFqQixHQUFrQyxJQUF6QzthQUZGO29CQUtRUixTQUFSLENBQWtCZ0MsR0FBbEIsR0FBd0IsVUFBU3hCLElBQVQ7dUJBQ2YsS0FBS1ksR0FBTCxDQUFTYSxjQUFULENBQXdCTCxjQUFjcEIsSUFBZCxDQUF4QixDQUFQO2FBREY7b0JBSVFSLFNBQVIsQ0FBa0JrQyxHQUFsQixHQUF3QixVQUFTMUIsSUFBVCxFQUFlSyxLQUFmO3FCQUNqQk8sR0FBTCxDQUFTUSxjQUFjcEIsSUFBZCxDQUFULElBQWdDcUIsZUFBZWhCLEtBQWYsQ0FBaEM7YUFERjtvQkFJUWIsU0FBUixDQUFrQnNCLE9BQWxCLEdBQTRCLFVBQVNhLFFBQVQsRUFBbUJDLE9BQW5CO3FCQUNyQixJQUFJNUIsSUFBVCxJQUFpQixLQUFLWSxHQUF0QixFQUEyQjt3QkFDckIsS0FBS0EsR0FBTCxDQUFTYSxjQUFULENBQXdCekIsSUFBeEIsQ0FBSixFQUFtQztpQ0FDeEJELElBQVQsQ0FBYzZCLE9BQWQsRUFBdUIsS0FBS2hCLEdBQUwsQ0FBU1osSUFBVCxDQUF2QixFQUF1Q0EsSUFBdkMsRUFBNkMsSUFBN0M7OzthQUhOO29CQVFRUixTQUFSLENBQWtCcUMsSUFBbEIsR0FBeUI7b0JBQ25CdkIsUUFBUSxFQUFaO3FCQUNLUSxPQUFMLENBQWEsVUFBU1QsS0FBVCxFQUFnQkwsSUFBaEI7MEJBQ0w4QixJQUFOLENBQVc5QixJQUFYO2lCQURGO3VCQUdPK0IsWUFBWXpCLEtBQVosQ0FBUDthQUxGO29CQVFRZCxTQUFSLENBQWtCd0MsTUFBbEIsR0FBMkI7b0JBQ3JCMUIsUUFBUSxFQUFaO3FCQUNLUSxPQUFMLENBQWEsVUFBU1QsS0FBVDswQkFDTHlCLElBQU4sQ0FBV3pCLEtBQVg7aUJBREY7dUJBR08wQixZQUFZekIsS0FBWixDQUFQO2FBTEY7b0JBUVFkLFNBQVIsQ0FBa0J5QyxPQUFsQixHQUE0QjtvQkFDdEIzQixRQUFRLEVBQVo7cUJBQ0tRLE9BQUwsQ0FBYSxVQUFTVCxLQUFULEVBQWdCTCxJQUFoQjswQkFDTDhCLElBQU4sQ0FBVyxDQUFDOUIsSUFBRCxFQUFPSyxLQUFQLENBQVg7aUJBREY7dUJBR08wQixZQUFZekIsS0FBWixDQUFQO2FBTEY7Z0JBUUl2QixRQUFRMkIsUUFBWixFQUFzQjt3QkFDWmxCLFNBQVIsQ0FBa0JSLE9BQU91QixRQUF6QixJQUFxQ00sUUFBUXJCLFNBQVIsQ0FBa0J5QyxPQUF2RDs7NkJBR0YsQ0FBa0JDLElBQWxCO29CQUNNQSxLQUFLQyxRQUFULEVBQW1COzJCQUNWMUQsUUFBUTJELE1BQVIsQ0FBZSxJQUFJakMsU0FBSixDQUFjLGNBQWQsQ0FBZixDQUFQOztxQkFFR2dDLFFBQUwsR0FBZ0IsSUFBaEI7O29DQUdGLENBQXlCRSxNQUF6Qjt1QkFDUyxJQUFJNUQsT0FBSixDQUFZLFVBQVM2RCxPQUFULEVBQWtCRixNQUFsQjsyQkFDVkcsTUFBUCxHQUFnQjtnQ0FDTkYsT0FBT0csTUFBZjtxQkFERjsyQkFHT0MsT0FBUCxHQUFpQjsrQkFDUkosT0FBT0ssS0FBZDtxQkFERjtpQkFKSyxDQUFQOzswQ0FVRixDQUErQkMsSUFBL0I7b0JBQ01OLFNBQVMsSUFBSU8sVUFBSixFQUFiO29CQUNJQyxVQUFVQyxnQkFBZ0JULE1BQWhCLENBQWQ7dUJBQ09VLGlCQUFQLENBQXlCSixJQUF6Qjt1QkFDT0UsT0FBUDs7bUNBR0YsQ0FBd0JGLElBQXhCO29CQUNNTixTQUFTLElBQUlPLFVBQUosRUFBYjtvQkFDSUMsVUFBVUMsZ0JBQWdCVCxNQUFoQixDQUFkO3VCQUNPVyxVQUFQLENBQWtCTCxJQUFsQjt1QkFDT0UsT0FBUDs7MENBR0YsQ0FBK0JJLEdBQS9CO29CQUNNQyxPQUFPLElBQUlDLFVBQUosQ0FBZUYsR0FBZixDQUFYO29CQUNJRyxRQUFRLElBQUlwQyxLQUFKLENBQVVrQyxLQUFLRyxNQUFmLENBQVo7cUJBRUssSUFBSUMsSUFBSSxDQUFiLEVBQWdCQSxJQUFJSixLQUFLRyxNQUF6QixFQUFpQ0MsR0FBakMsRUFBc0M7MEJBQzlCQSxDQUFOLElBQVdyRCxPQUFPc0QsWUFBUCxDQUFvQkwsS0FBS0ksQ0FBTCxDQUFwQixDQUFYOzt1QkFFS0YsTUFBTUksSUFBTixDQUFXLEVBQVgsQ0FBUDs7Z0NBR0YsQ0FBcUJQLEdBQXJCO29CQUNNQSxJQUFJUSxLQUFSLEVBQWU7MkJBQ05SLElBQUlRLEtBQUosQ0FBVSxDQUFWLENBQVA7aUJBREYsTUFFTzt3QkFDRFAsT0FBTyxJQUFJQyxVQUFKLENBQWVGLElBQUlTLFVBQW5CLENBQVg7eUJBQ0toQyxHQUFMLENBQVMsSUFBSXlCLFVBQUosQ0FBZUYsR0FBZixDQUFUOzJCQUNPQyxLQUFLUyxNQUFaOzs7eUJBSUo7cUJBQ094QixRQUFMLEdBQWdCLEtBQWhCO3FCQUVLeUIsU0FBTCxHQUFpQixVQUFTMUIsSUFBVDt5QkFDVjJCLFNBQUwsR0FBaUIzQixJQUFqQjt3QkFDSSxDQUFDQSxJQUFMLEVBQVc7NkJBQ0o0QixTQUFMLEdBQWlCLEVBQWpCO3FCQURGLE1BRU8sSUFBSSxPQUFPNUIsSUFBUCxLQUFnQixRQUFwQixFQUE4Qjs2QkFDOUI0QixTQUFMLEdBQWlCNUIsSUFBakI7cUJBREssTUFFQSxJQUFJbkQsUUFBUTRELElBQVIsSUFBZ0IxRCxLQUFLTyxTQUFMLENBQWVDLGFBQWYsQ0FBNkJ5QyxJQUE3QixDQUFwQixFQUF3RDs2QkFDeEQ2QixTQUFMLEdBQWlCN0IsSUFBakI7cUJBREssTUFFQSxJQUNMbkQsUUFBUWlGLFFBQVIsSUFDQUMsU0FBU3pFLFNBQVQsQ0FBbUJDLGFBQW5CLENBQWlDeUMsSUFBakMsQ0FGSyxFQUdMOzZCQUNLZ0MsYUFBTCxHQUFxQmhDLElBQXJCO3FCQUpLLE1BS0EsSUFDTG5ELFFBQVFvRixZQUFSLElBQ0FDLGdCQUFnQjVFLFNBQWhCLENBQTBCQyxhQUExQixDQUF3Q3lDLElBQXhDLENBRkssRUFHTDs2QkFDSzRCLFNBQUwsR0FBaUI1QixLQUFLcEMsUUFBTCxFQUFqQjtxQkFKSyxNQUtBLElBQUlmLFFBQVFJLFdBQVIsSUFBdUJKLFFBQVE0RCxJQUEvQixJQUF1Q3RELFdBQVc2QyxJQUFYLENBQTNDLEVBQTZEOzZCQUM3RG1DLGdCQUFMLEdBQXdCQyxZQUFZcEMsS0FBS3lCLE1BQWpCLENBQXhCOzs2QkFFS0UsU0FBTCxHQUFpQixJQUFJNUUsSUFBSixDQUFTLENBQUMsS0FBS29GLGdCQUFOLENBQVQsQ0FBakI7cUJBSEssTUFJQSxJQUNMdEYsUUFBUUksV0FBUixLQUNDUSxZQUFZSCxTQUFaLENBQXNCQyxhQUF0QixDQUFvQ3lDLElBQXBDLEtBQ0N4QyxrQkFBa0J3QyxJQUFsQixDQUZGLENBREssRUFJTDs2QkFDS21DLGdCQUFMLEdBQXdCQyxZQUFZcEMsSUFBWixDQUF4QjtxQkFMSyxNQU1BOzhCQUNDLElBQUlxQyxLQUFKLENBQVUsMkJBQVYsQ0FBTjs7d0JBR0UsQ0FBQyxLQUFLNUQsT0FBTCxDQUFhWSxHQUFiLENBQWlCLGNBQWpCLENBQUwsRUFBdUM7NEJBQ2pDLE9BQU9XLElBQVAsS0FBZ0IsUUFBcEIsRUFBOEI7aUNBQ3ZCdkIsT0FBTCxDQUFhZSxHQUFiLENBQWlCLGNBQWpCLEVBQWlDLDBCQUFqQzt5QkFERixNQUVPLElBQUksS0FBS3FDLFNBQUwsSUFBa0IsS0FBS0EsU0FBTCxDQUFlUyxJQUFyQyxFQUEyQztpQ0FDM0M3RCxPQUFMLENBQWFlLEdBQWIsQ0FBaUIsY0FBakIsRUFBaUMsS0FBS3FDLFNBQUwsQ0FBZVMsSUFBaEQ7eUJBREssTUFFQSxJQUNMekYsUUFBUW9GLFlBQVIsSUFDQUMsZ0JBQWdCNUUsU0FBaEIsQ0FBMEJDLGFBQTFCLENBQXdDeUMsSUFBeEMsQ0FGSyxFQUdMO2lDQUNLdkIsT0FBTCxDQUFhZSxHQUFiLENBQ0UsY0FERixFQUVFLGlEQUZGOzs7aUJBekNOO29CQWlESTNDLFFBQVE0RCxJQUFaLEVBQWtCO3lCQUNYQSxJQUFMLEdBQVk7NEJBQ044QixXQUFXQyxTQUFTLElBQVQsQ0FBZjs0QkFDSUQsUUFBSixFQUFjO21DQUNMQSxRQUFQOzs0QkFHRSxLQUFLVixTQUFULEVBQW9CO21DQUNYdEYsUUFBUTZELE9BQVIsQ0FBZ0IsS0FBS3lCLFNBQXJCLENBQVA7eUJBREYsTUFFTyxJQUFJLEtBQUtNLGdCQUFULEVBQTJCO21DQUN6QjVGLFFBQVE2RCxPQUFSLENBQWdCLElBQUlyRCxJQUFKLENBQVMsQ0FBQyxLQUFLb0YsZ0JBQU4sQ0FBVCxDQUFoQixDQUFQO3lCQURLLE1BRUEsSUFBSSxLQUFLSCxhQUFULEVBQXdCO2tDQUN2QixJQUFJSyxLQUFKLENBQVUsc0NBQVYsQ0FBTjt5QkFESyxNQUVBO21DQUNFOUYsUUFBUTZELE9BQVIsQ0FBZ0IsSUFBSXJELElBQUosQ0FBUyxDQUFDLEtBQUs2RSxTQUFOLENBQVQsQ0FBaEIsQ0FBUDs7cUJBYko7eUJBaUJLM0UsV0FBTCxHQUFtQjs0QkFDYixLQUFLa0YsZ0JBQVQsRUFBMkI7bUNBQ2xCSyxTQUFTLElBQVQsS0FBa0JqRyxRQUFRNkQsT0FBUixDQUFnQixLQUFLK0IsZ0JBQXJCLENBQXpCO3lCQURGLE1BRU87bUNBQ0UsS0FBSzFCLElBQUwsR0FBWWdDLElBQVosQ0FBaUJDLHFCQUFqQixDQUFQOztxQkFKSjs7cUJBU0dDLElBQUwsR0FBWTt3QkFDTkosV0FBV0MsU0FBUyxJQUFULENBQWY7d0JBQ0lELFFBQUosRUFBYzsrQkFDTEEsUUFBUDs7d0JBR0UsS0FBS1YsU0FBVCxFQUFvQjsrQkFDWGUsZUFBZSxLQUFLZixTQUFwQixDQUFQO3FCQURGLE1BRU8sSUFBSSxLQUFLTSxnQkFBVCxFQUEyQjsrQkFDekI1RixRQUFRNkQsT0FBUixDQUNMeUMsc0JBQXNCLEtBQUtWLGdCQUEzQixDQURLLENBQVA7cUJBREssTUFJQSxJQUFJLEtBQUtILGFBQVQsRUFBd0I7OEJBQ3ZCLElBQUlLLEtBQUosQ0FBVSxzQ0FBVixDQUFOO3FCQURLLE1BRUE7K0JBQ0U5RixRQUFRNkQsT0FBUixDQUFnQixLQUFLd0IsU0FBckIsQ0FBUDs7aUJBZko7b0JBbUJJL0UsUUFBUWlGLFFBQVosRUFBc0I7eUJBQ2ZBLFFBQUwsR0FBZ0I7K0JBQ1AsS0FBS2EsSUFBTCxHQUFZRixJQUFaLENBQWlCSyxNQUFqQixDQUFQO3FCQURGOztxQkFLR0MsSUFBTCxHQUFZOzJCQUNILEtBQUtKLElBQUwsR0FBWUYsSUFBWixDQUFpQk8sS0FBS0MsS0FBdEIsQ0FBUDtpQkFERjt1QkFJTyxJQUFQOzs7Z0JBSUVDLFVBQVUsQ0FBQyxRQUFELEVBQVcsS0FBWCxFQUFrQixNQUFsQixFQUEwQixTQUExQixFQUFxQyxNQUFyQyxFQUE2QyxLQUE3QyxDQUFkO29DQUVBLENBQXlCQyxNQUF6QjtvQkFDTUMsVUFBVUQsT0FBT0UsV0FBUCxFQUFkO3VCQUNPSCxRQUFRdkYsT0FBUixDQUFnQnlGLE9BQWhCLElBQTJCLENBQUMsQ0FBNUIsR0FBZ0NBLE9BQWhDLEdBQTBDRCxNQUFqRDs7NEJBR0YsQ0FBaUJHLEtBQWpCLEVBQXdCbkgsT0FBeEI7MEJBQ1lBLFdBQVcsRUFBckI7b0JBQ0k2RCxPQUFPN0QsUUFBUTZELElBQW5CO29CQUVJc0QsaUJBQWlCQyxPQUFyQixFQUE4Qjt3QkFDeEJELE1BQU1yRCxRQUFWLEVBQW9COzhCQUNaLElBQUloQyxTQUFKLENBQWMsY0FBZCxDQUFOOzt5QkFFR3VGLEdBQUwsR0FBV0YsTUFBTUUsR0FBakI7eUJBQ0tDLFdBQUwsR0FBbUJILE1BQU1HLFdBQXpCO3dCQUNJLENBQUN0SCxRQUFRc0MsT0FBYixFQUFzQjs2QkFDZkEsT0FBTCxHQUFlLElBQUlFLE9BQUosQ0FBWTJFLE1BQU03RSxPQUFsQixDQUFmOzt5QkFFRzBFLE1BQUwsR0FBY0csTUFBTUgsTUFBcEI7eUJBQ0tPLElBQUwsR0FBWUosTUFBTUksSUFBbEI7d0JBQ0ksQ0FBQzFELElBQUQsSUFBU3NELE1BQU0zQixTQUFOLElBQW1CLElBQWhDLEVBQXNDOytCQUM3QjJCLE1BQU0zQixTQUFiOzhCQUNNMUIsUUFBTixHQUFpQixJQUFqQjs7aUJBYkosTUFlTzt5QkFDQXVELEdBQUwsR0FBV3pGLE9BQU91RixLQUFQLENBQVg7O3FCQUdHRyxXQUFMLEdBQW1CdEgsUUFBUXNILFdBQVIsSUFBdUIsS0FBS0EsV0FBNUIsSUFBMkMsTUFBOUQ7b0JBQ0l0SCxRQUFRc0MsT0FBUixJQUFtQixDQUFDLEtBQUtBLE9BQTdCLEVBQXNDO3lCQUMvQkEsT0FBTCxHQUFlLElBQUlFLE9BQUosQ0FBWXhDLFFBQVFzQyxPQUFwQixDQUFmOztxQkFFRzBFLE1BQUwsR0FBY1EsZ0JBQWdCeEgsUUFBUWdILE1BQVIsSUFBa0IsS0FBS0EsTUFBdkIsSUFBaUMsS0FBakQsQ0FBZDtxQkFDS08sSUFBTCxHQUFZdkgsUUFBUXVILElBQVIsSUFBZ0IsS0FBS0EsSUFBckIsSUFBNkIsSUFBekM7cUJBQ0tFLFFBQUwsR0FBZ0IsSUFBaEI7b0JBRUksQ0FBQyxLQUFLVCxNQUFMLEtBQWdCLEtBQWhCLElBQXlCLEtBQUtBLE1BQUwsS0FBZ0IsTUFBMUMsS0FBcURuRCxJQUF6RCxFQUErRDswQkFDdkQsSUFBSS9CLFNBQUosQ0FBYywyQ0FBZCxDQUFOOztxQkFFR3lELFNBQUwsQ0FBZTFCLElBQWY7O29CQUdNMUMsU0FBUixDQUFrQnVHLEtBQWxCLEdBQTBCO3VCQUNqQixJQUFJTixPQUFKLENBQVksSUFBWixFQUFrQixFQUFFdkQsTUFBTSxLQUFLMkIsU0FBYixFQUFsQixDQUFQO2FBREY7MkJBSUEsQ0FBZ0IzQixJQUFoQjtvQkFDTThELE9BQU8sSUFBSS9CLFFBQUosRUFBWDtxQkFFR2dDLElBREgsR0FFR0MsS0FGSCxDQUVTLEdBRlQsRUFHR3BGLE9BSEgsQ0FHVyxVQUFTcUYsS0FBVDt3QkFDSEEsS0FBSixFQUFXOzRCQUNMRCxRQUFRQyxNQUFNRCxLQUFOLENBQVksR0FBWixDQUFaOzRCQUNJbEcsT0FBT2tHLE1BQU0xRixLQUFOLEdBQWM0RixPQUFkLENBQXNCLEtBQXRCLEVBQTZCLEdBQTdCLENBQVg7NEJBQ0kvRixRQUFRNkYsTUFBTTFDLElBQU4sQ0FBVyxHQUFYLEVBQWdCNEMsT0FBaEIsQ0FBd0IsS0FBeEIsRUFBK0IsR0FBL0IsQ0FBWjs2QkFDS3JGLE1BQUwsQ0FBWXNGLG1CQUFtQnJHLElBQW5CLENBQVosRUFBc0NxRyxtQkFBbUJoRyxLQUFuQixDQUF0Qzs7aUJBUk47dUJBV08yRixJQUFQOztpQ0FHRixDQUFzQk0sVUFBdEI7b0JBQ00zRixVQUFlLElBQUlFLE9BQUosQ0FBWSxFQUFaLENBQW5COzJCQUNXcUYsS0FBWCxDQUFpQixPQUFqQixFQUEwQnBGLE9BQTFCLENBQWtDLFVBQVN5RixJQUFUO3dCQUM1QkMsUUFBUUQsS0FBS0wsS0FBTCxDQUFXLEdBQVgsQ0FBWjt3QkFDSU8sTUFBTUQsTUFBTWhHLEtBQU4sR0FBY3lGLElBQWQsRUFBVjt3QkFDSVEsR0FBSixFQUFTOzRCQUNIcEcsUUFBUW1HLE1BQU1oRCxJQUFOLENBQVcsR0FBWCxFQUFnQnlDLElBQWhCLEVBQVo7Z0NBQ1FsRixNQUFSLENBQWUwRixHQUFmLEVBQW9CcEcsS0FBcEI7O2lCQUxKO3VCQVFPTSxPQUFQOztpQkFHR1osSUFBTCxDQUFVMEYsUUFBUWpHLFNBQWxCO2dCQUVJa0gsV0FBZ0IsU0FBaEJBLFFBQWdCLENBQVNDLFFBQVQsRUFBbUJ0SSxPQUFuQjtvQkFDZCxDQUFDQSxPQUFMLEVBQWM7OEJBQ0YsRUFBVjs7cUJBR0dtRyxJQUFMLEdBQVksU0FBWjtxQkFDS29DLE1BQUwsR0FBYyxZQUFZdkksT0FBWixHQUFzQkEsUUFBUXVJLE1BQTlCLEdBQXVDLEdBQXJEO3FCQUNLQyxFQUFMLEdBQVUsS0FBS0QsTUFBTCxJQUFlLEdBQWYsSUFBc0IsS0FBS0EsTUFBTCxHQUFjLEdBQTlDO3FCQUNLRSxVQUFMLEdBQWtCLGdCQUFnQnpJLE9BQWhCLEdBQTBCQSxRQUFReUksVUFBbEMsR0FBK0MsSUFBakU7cUJBQ0tuRyxPQUFMLEdBQWUsSUFBSUUsT0FBSixDQUFZeEMsUUFBUXNDLE9BQXBCLENBQWY7cUJBQ0srRSxHQUFMLEdBQVdySCxRQUFRcUgsR0FBUixJQUFlLEVBQTFCO3FCQUNLOUIsU0FBTCxDQUFlK0MsUUFBZjthQVhGO2lCQWNLNUcsSUFBTCxDQUFVMkcsU0FBU2xILFNBQW5CO3FCQUVTQSxTQUFULENBQW1CdUcsS0FBbkIsR0FBMkI7dUJBQ2xCLElBQUlXLFFBQUosQ0FBYSxLQUFLN0MsU0FBbEIsRUFBNkI7NEJBQzFCLEtBQUsrQyxNQURxQjtnQ0FFdEIsS0FBS0UsVUFGaUI7NkJBR3pCLElBQUlqRyxPQUFKLENBQVksS0FBS0YsT0FBakIsQ0FIeUI7eUJBSTdCLEtBQUsrRTtpQkFKTCxDQUFQO2FBREY7cUJBU1NoRCxLQUFULEdBQWlCO29CQUNYcUUsV0FBVyxJQUFJTCxRQUFKLENBQWEsSUFBYixFQUFtQixFQUFFRSxRQUFRLENBQVYsRUFBYUUsWUFBWSxFQUF6QixFQUFuQixDQUFmO3lCQUNTdEMsSUFBVCxHQUFnQixPQUFoQjt1QkFDT3VDLFFBQVA7YUFIRjtnQkFNSUMsbUJBQW1CLENBQUMsR0FBRCxFQUFNLEdBQU4sRUFBVyxHQUFYLEVBQWdCLEdBQWhCLEVBQXFCLEdBQXJCLENBQXZCO3FCQUVTQyxRQUFULEdBQW9CLFVBQVN2QixHQUFULEVBQWNrQixNQUFkO29CQUNkSSxpQkFBaUJuSCxPQUFqQixDQUF5QitHLE1BQXpCLE1BQXFDLENBQUMsQ0FBMUMsRUFBNkM7MEJBQ3JDLElBQUlNLFVBQUosQ0FBZSxxQkFBZixDQUFOOzt1QkFHSyxJQUFJUixRQUFKLENBQWEsSUFBYixFQUFtQjs0QkFDaEJFLE1BRGdCOzZCQUVmLEVBQUVPLFVBQVV6QixHQUFaO2lCQUZKLENBQVA7YUFMRjtpQkFXSzdFLE9BQUwsR0FBZUEsT0FBZjtpQkFDSzRFLE9BQUwsR0FBZUEsT0FBZjtpQkFDS2lCLFFBQUwsR0FBZ0JBLFFBQWhCO2lCQUVLNUgsS0FBTCxHQUFhLFVBQVMwRyxLQUFULEVBQWdCNEIsSUFBaEI7dUJBQ0osSUFBSTNJLE9BQUosQ0FBWSxVQUFTNkQsT0FBVCxFQUFrQkYsTUFBbEI7d0JBQ2JpRixVQUFVLElBQUk1QixPQUFKLENBQVlELEtBQVosRUFBbUI0QixJQUFuQixDQUFkO3dCQUNJRSxNQUFNLElBQUk1SSxjQUFKLEVBQVY7d0JBRUk2RCxNQUFKLEdBQWE7NEJBQ1BsRSxVQUtBO29DQUNNaUosSUFBSVYsTUFEVjt3Q0FFVVUsSUFBSVIsVUFGZDtxQ0FHT1MsYUFBYUQsSUFBSUUscUJBQUosTUFBK0IsRUFBNUM7eUJBUlg7Z0NBVVE5QixHQUFSLEdBQ0UsaUJBQWlCNEIsR0FBakIsR0FDSUEsSUFBSUcsV0FEUixHQUVJcEosUUFBUXNDLE9BQVIsQ0FBZ0JZLEdBQWhCLENBQW9CLGVBQXBCLENBSE47NEJBSUlXLE9BQU8sY0FBY29GLEdBQWQsR0FBb0JBLElBQUlQLFFBQXhCLEdBQW1DTyxJQUFJSSxZQUFsRDtnQ0FDUSxJQUFJaEIsUUFBSixDQUFheEUsSUFBYixFQUFtQjdELE9BQW5CLENBQVI7cUJBaEJGO3dCQW1CSW9FLE9BQUosR0FBYzsrQkFDTCxJQUFJdEMsU0FBSixDQUFjLHdCQUFkLENBQVA7cUJBREY7d0JBSUl3SCxTQUFKLEdBQWdCOytCQUNQLElBQUl4SCxTQUFKLENBQWMsd0JBQWQsQ0FBUDtxQkFERjt3QkFJSXlILElBQUosQ0FBU1AsUUFBUWhDLE1BQWpCLEVBQXlCZ0MsUUFBUTNCLEdBQWpDLEVBQXNDLElBQXRDO3dCQUVJMkIsUUFBUTFCLFdBQVIsS0FBd0IsU0FBNUIsRUFBdUM7NEJBQ2pDa0MsZUFBSixHQUFzQixJQUF0Qjs7d0JBR0Usa0JBQWtCUCxHQUFsQixJQUF5QnZJLFFBQVE0RCxJQUFyQyxFQUEyQzs0QkFDckNtRixZQUFKLEdBQW1CLE1BQW5COzs0QkFHTW5ILE9BQVIsQ0FBZ0JHLE9BQWhCLENBQXdCLFVBQVNULEtBQVQsRUFBZ0JMLElBQWhCOzRCQUNsQitILGdCQUFKLENBQXFCL0gsSUFBckIsRUFBMkJLLEtBQTNCO3FCQURGO3dCQUlJMkgsSUFBSixDQUNFLE9BQU9YLFFBQVF4RCxTQUFmLEtBQTZCLFdBQTdCLEdBQTJDLElBQTNDLEdBQWtEd0QsUUFBUXhELFNBRDVEO2lCQTdDSyxDQUFQO2FBREY7aUJBbURLL0UsS0FBTCxDQUFXbUosUUFBWCxHQUFzQixJQUF0QjtTQTNmRixFQTRmRyxPQUFPMUosSUFBUCxLQUFnQixXQUFoQixHQUE4QkEsSUFBOUIsR0FBcUMsSUE1ZnhDO2VBOGZPO21CQUNFQSxLQUFLTyxLQURQO3FCQUVJUCxLQUFLc0MsT0FGVDtxQkFHSXRDLEtBQUtrSCxPQUhUO3NCQUlLbEgsS0FBS21JO1NBSmpCO0tBdGdCSyxFQUFQO0NBUkY7Ozs7OztBQ1JBOzs7Ozs7Ozs7QUFpQ0U7OztRQUFjd0IsZ0JBQUFBO1FBQVU3SixlQUFBQTtRQUFTNkQsWUFBQUE7Ozs7Ozs7Ozs7Ozs0QkFhekIsR0FBc0I7WUFDeEIsQ0FBQyxNQUFLQSxJQUFOLElBQWMsTUFBSzdELE9BQUwsQ0FBYWdILE1BQWIsS0FBd0IsTUFBMUMsRUFBa0Q7a0JBQzNDbkQsSUFBTCxHQUFZLElBQUkrQixRQUFKLEVBQVo7O2VBRUssTUFBSy9CLElBQVo7S0FKTTs7Ozs7Ozs7OzthQWVELEdBQU87d0ZBQWlDLEVBQUVpRyxPQUFPLEtBQVQ7WUFBOUJBLGNBQUFBOztvQkFDRzdKLFNBQ2RBLE9BQU9RLEtBQVAsR0FBZVIsTUFBZixHQUF3QkYsY0FBYyxFQUFkLEVBQWtCVSxLQUQ1QixHQUVkO21CQUNTO3dCQUNHc0osSUFBUixDQUFhLHdCQUFiOzs7WUFKQXRKLGNBQUFBOztZQU9GdUosa0JBQWtCLFNBQ3RCLEVBRHNCLEVBRXRCLE1BQUtDLG1CQUFMLEVBRnNCLEVBR3RCLE1BQUtqSyxPQUhpQixDQUF4QjtZQUtNa0ssWUFBWXpKLE1BQU0sTUFBS29KLFFBQVgsRUFBcUJHLGVBQXJCLENBQWxCO2VBQ09GLFFBQVFJLFVBQVU1RCxJQUFWLENBQWU7bUJBQU82RCxJQUFJdkQsSUFBSixFQUFQO1NBQWYsQ0FBUixHQUE0Q3NELFNBQW5EO0tBZEs7U0EzQkFMLFFBQUwsR0FBZ0JBLFFBQWhCO1NBQ0s3SixPQUFMLEdBQWVBLFdBQVdvSCxRQUFRZ0QsY0FBbEM7U0FDS3ZHLElBQUwsR0FBWUEsSUFBWjs7Ozs7Ozs7OztBQWhCS3VELHNCQUFBLEdBQThCO1lBQzNCLEtBRDJCO2FBRTFCLEVBQUVpRCxRQUFRLGtCQUFWO0NBRko7O0FDcEJUOzs7Ozs7Ozs7OztBQWVBLElBQU1DLGlCQUFpQixTQUFqQkEsY0FBaUIsQ0FDdEJDLElBRHNCLEVBRXRCQyxVQUZzQjtRQUd0QkMsZ0ZBQW9COztRQUVkQyxXQUFXLE9BQU9ILElBQVAsS0FBZ0IsUUFBaEIsR0FBMkJBLEtBQUsxQyxLQUFMLENBQVc0QyxTQUFYLENBQTNCLEdBQW1ERixJQUFwRTtRQUNJSSxhQUFhSCxVQUFqQjthQUNTL0gsT0FBVCxDQUFpQjtxQkFDSGtJLFdBQVd2QyxHQUFYLENBQWI7S0FERDtRQUdJdUMsVUFBSixFQUFnQixPQUFPQSxVQUFQO1VBQ1YsSUFBSXpFLEtBQUosdURBQytDd0UsU0FBU3ZGLElBQVQsQ0FDbkRzRixTQURtRCxDQUQvQyw4QkFBTjtDQVhEOzs7Ozs7Ozs7Ozs7OztBQ0pBLElBQU1HLFNBQVMsU0FBVEEsTUFBUztRQUFDdkQsR0FBRCx1RUFBZXBILE9BQU82SSxRQUFQLENBQWdCK0IsTUFBL0I7V0FDYnhELElBQ0dRLEtBREgsQ0FDUyxHQURULEVBQ2MsQ0FEZCxFQUVHQSxLQUZILENBRVMsR0FGVCxFQUdHdEYsR0FISCxDQUdPO2VBQUt1SSxFQUFFakQsS0FBRixDQUFRLEdBQVIsQ0FBTDtLQUhQLEVBSUdrRCxNQUpILENBSVUsVUFBQ0MsR0FBRCxRQUFrQi9GLENBQWxCLEVBQXFCZ0csR0FBckI7O1lBQU83QztZQUFLOEM7O1lBQ2Q5QyxHQUFKLElBQVdKLG1CQUFtQmtELEdBQW5CLEVBQXdCbkQsT0FBeEIsQ0FBZ0MsS0FBaEMsRUFBdUMsR0FBdkMsQ0FBWDtlQUNPaUQsR0FBUDtLQU5KLEVBT0ssRUFQTCxDQURhO0NBQWY7Ozs7Ozs7Ozs7QUFtQkEsSUFBTUcsNkJBQTZCLFNBQTdCQSwwQkFBNkIsQ0FBQ0MsTUFBRDtRQUMzQkMsVUFBa0IsMEJBQXhCO1FBQ0lELE9BQU9QLE1BQVAsQ0FBY1EsT0FBZCxJQUF5QixDQUFDLENBQTlCLEVBQWlDO2VBQ3hCRCxPQUFPckQsT0FBUCxDQUNMc0QsT0FESyxFQUVMLCtEQUZLLENBQVA7S0FERixNQUtPO2VBQ0VELE1BQVA7O0NBUko7O0FDOUJBOzs7Ozs7Ozs7Ozs7Ozs7O0FBaUJBLDRCQUFBO1FBQ1dFLGtCQUFUQztRQUNXQyxvQkFBWEM7O1FBS01DLGdCQUVGO21CQUNTO0tBSGI7UUFNTUMsV0FBVzttQkFDSkgsZ0JBQWdCRSxjQUFjRDtLQUQzQztRQUlNRyxPQUE2Qk4sV0FBV08scUJBQVgsRUFBbkM7UUFFTUMsaUJBQXlCQyxLQUFLQyxHQUFMLENBQzdCQyxTQUFTQyxlQUFULENBQXlCQyxZQURJLEVBRTdCbE0sT0FBT21NLFdBQVAsSUFBc0IsQ0FGTyxDQUEvQjtRQUlRWCxZQUFjRSxTQUFkRjs7UUFFSkEsWUFBWSxDQUFaLElBQWlCQSxZQUFZLENBQWpDLEVBQW9DO2NBQzVCLElBQUk1QyxVQUFKLENBQ0osc0RBREksQ0FBTjs7O1FBTUUrQyxLQUFLUyxNQUFMLElBQWVaLFlBQVlLLGNBQS9CLEVBQStDO1lBRTNDRixLQUFLVSxHQUFMLEdBQVdSLGNBQVgsSUFBNkJMLFlBQVlLLGNBQVosR0FBNkIsQ0FBQyxDQUEzRCxJQUNBRixLQUFLVyxNQUFMLElBQWVkLFlBQVlLLGNBRjdCLEVBR0U7bUJBQ08sSUFBUDtTQUpGLE1BS087bUJBQ0UsS0FBUDs7S0FQSixNQVNPOztZQUVERixLQUFLVSxHQUFMLElBQVksQ0FBWixJQUFpQlYsS0FBS1csTUFBTCxHQUFjVCxjQUFkLElBQWdDLENBQXJELEVBQXdEO21CQUMvQyxJQUFQO1NBREYsTUFFTzttQkFDRSxLQUFQOzs7Ozs7Ozs7Ozs7OztBQWVOLGlCQUFBLENBQWtCUCxPQUFsQixFQUFvQ2lCLEVBQXBDLEVBQWdEQyxRQUFoRDtRQUNNQSxZQUFZLENBQWhCLEVBQW1CO1FBQ2JDLGFBQXFCRixLQUFLakIsUUFBUW9CLFNBQXhDO1FBQ01DLFVBQWtCRixhQUFhRCxRQUFiLEdBQXdCLEVBQWhEO2VBRVc7Z0JBQ0RFLFNBQVIsR0FBb0JwQixRQUFRb0IsU0FBUixHQUFvQkMsT0FBeEM7WUFDSXJCLFFBQVFvQixTQUFSLEtBQXNCSCxFQUExQixFQUE4QjtpQkFDckJqQixPQUFULEVBQWtCaUIsRUFBbEIsRUFBc0JDLFdBQVcsRUFBakM7S0FIRixFQUlHLEVBSkg7Ozs7Ozs7Ozs7Ozs7O0FDekVGLElBQU1JLFNBQW1CLFNBQW5CQSxNQUFtQixDQUFDQyxLQUFEO1NBQ3ZCYixTQUFTYyxhQUFULENBQXVCRCxLQUF2QixDQUR1QjtDQUF6Qjs7Ozs7OztBQVNBLElBQU1FLFlBQXNCLFNBQXRCQSxTQUFzQixDQUFDRixLQUFEO3NDQUN2QmIsU0FBU2dCLGdCQUFULENBQTBCSCxLQUExQixDQUR1QjtDQUE1Qjs7Ozs7OztBQVVBLElBQU1JLGFBQXVCLFNBQXZCQSxVQUF1QixDQUFDQyxFQUFEO1NBQzNCbEIsU0FBU21CLGNBQVQsQ0FBd0JELEVBQXhCLENBRDJCO0NBQTdCOzs7Ozs7Ozs7Ozs7O0FDbkJBLElBQU1FLGFBQWEsU0FBYkEsVUFBYSxDQUFDakMsTUFBRDtTQUNqQkEsT0FDR3ZELEtBREgsQ0FDUyxHQURULEVBRUd0RixHQUZILENBRU87V0FBSytLLFFBQVFDLENBQVIsQ0FBTDtHQUZQLEVBR0dwSSxJQUhILENBR1EsR0FIUixDQURpQjtDQUFuQjs7Ozs7Ozs7O0FBY0EsSUFBTXFJLFVBQVUsU0FBVkEsT0FBVSxDQUFDQyxVQUFEO01BQXFCaEQsU0FBckIsdUVBQXlDLEdBQXpDO1NBQ2RnRCxXQUNHMUYsT0FESCxDQUNXLGtEQURYLEVBQytELEVBRC9ELEVBRUdBLE9BRkgsQ0FFVyxvQkFGWCxTQUVzQzBDLFNBRnRDLFNBR0cxSSxXQUhILEVBRGM7Q0FBaEI7Ozs7Ozs7QUFZQSxJQUFNNkYsT0FBTyxTQUFQQSxJQUFPLENBQUN3RCxNQUFEO1NBQTRCQSxPQUFPckQsT0FBUCxDQUFlLFlBQWYsRUFBNkIsRUFBN0IsQ0FBNUI7Q0FBYjs7Ozs7OztBQVFBLElBQU11RixVQUFVLFNBQVZBLE9BQVU7O01BQUVJLFdBQUY7TUFBa0JDLFdBQWxCOztjQUNYRCxZQUFZeEcsV0FBWixFQURXLEdBQ2lCeUcsWUFBWXhJLElBQVosQ0FBaUIsRUFBakIsQ0FEakI7Q0FBaEI7Ozs7Ozs7Ozs7Ozs7Ozs7In0=
