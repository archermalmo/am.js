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

return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW0uZGV2LmpzIiwic291cmNlcyI6WyIuLi9zcmMvdmVuZG9yL2ZldGNoUG9ueWZpbGwudHMiLCIuLi9zcmMvY2xhc3Nlcy9SZXF1ZXN0LnRzIiwiLi4vc3JjL2Z1bmN0aW9ucy9kYXRhTWFuaXB1bGF0aW9uLnRzIiwiLi4vc3JjL2Z1bmN0aW9ucy9wYXJzZS50cyIsIi4uL3NyYy9mdW5jdGlvbnMvc2Nyb2xsLnRzIiwiLi4vc3JjL2Z1bmN0aW9ucy9zZWxlY3QudHMiLCIuLi9zcmMvZnVuY3Rpb25zL3R5cG9ncmFwaHkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3BpZWQgZnJvbSBub2RlX21vZHVsZXMvZmV0Y2gtcG9ueWZpbGwvYnVpbGQvZmV0Y2gtYnJvd3Nlci5qcy5cbiAqXG4gKiBUeXBlcyBhZGRlZCB3aGVyZSBuZWNlc3NhcnkuXG4gKlxuICogTW92ZWQgb3V0IG9mIElJRkUgbW9kdWxlIHR5cGUsIHBsYWNlZCBgc2VsZmAgZGVjbGFyYXRpb24gdG8gdG9wXG4gKiBvZiBgZmV0Y2hQb255ZmlsbGAgZnVuY3Rpb24gc2NvcGUuXG4gKi9cbmNvbnN0IGZldGNoUG9ueWZpbGwgPSBmdW5jdGlvbiBmZXRjaFBvbnlmaWxsKG9wdGlvbnMpIHtcbiAgdmFyIHdpbmRvdyA9IHdpbmRvdyA/IHdpbmRvdyA6IGZhbHNlO1xuICB2YXIgc2VsZiA9IHR5cGVvZiBzZWxmID09PSBcInVuZGVmaW5lZFwiID8gKHdpbmRvdyA/IHdpbmRvdyA6IGdsb2JhbCkgOiBzZWxmO1xuICB2YXIgUHJvbWlzZSA9IChvcHRpb25zICYmIG9wdGlvbnMuUHJvbWlzZSkgfHwgc2VsZi5Qcm9taXNlO1xuICB2YXIgWE1MSHR0cFJlcXVlc3QgPVxuICAgIChvcHRpb25zICYmIG9wdGlvbnMuWE1MSHR0cFJlcXVlc3QpIHx8IHNlbGYuWE1MSHR0cFJlcXVlc3Q7XG4gIHZhciBnbG9iYWwgPSBzZWxmO1xuXG4gIHJldHVybiAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSBPYmplY3QuY3JlYXRlKGdsb2JhbCwge1xuICAgICAgZmV0Y2g6IHtcbiAgICAgICAgdmFsdWU6IHVuZGVmaW5lZCxcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIChmdW5jdGlvbihzZWxmKSB7XG4gICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgaWYgKHNlbGYuZmV0Y2gpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgc3VwcG9ydCA9IHtcbiAgICAgICAgc2VhcmNoUGFyYW1zOiBcIlVSTFNlYXJjaFBhcmFtc1wiIGluIHNlbGYsXG4gICAgICAgIGl0ZXJhYmxlOiBcIlN5bWJvbFwiIGluIHNlbGYgJiYgXCJpdGVyYXRvclwiIGluIFN5bWJvbCxcbiAgICAgICAgYmxvYjpcbiAgICAgICAgICBcIkZpbGVSZWFkZXJcIiBpbiBzZWxmICYmXG4gICAgICAgICAgXCJCbG9iXCIgaW4gc2VsZiAmJlxuICAgICAgICAgIChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIG5ldyBCbG9iKCk7XG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSkoKSxcbiAgICAgICAgZm9ybURhdGE6IFwiRm9ybURhdGFcIiBpbiBzZWxmLFxuICAgICAgICBhcnJheUJ1ZmZlcjogXCJBcnJheUJ1ZmZlclwiIGluIHNlbGZcbiAgICAgIH07XG5cbiAgICAgIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyKSB7XG4gICAgICAgIHZhciB2aWV3Q2xhc3NlcyA9IFtcbiAgICAgICAgICBcIltvYmplY3QgSW50OEFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBVaW50OEFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBVaW50OENsYW1wZWRBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgSW50MTZBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgVWludDE2QXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IEludDMyQXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IFVpbnQzMkFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBGbG9hdDMyQXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IEZsb2F0NjRBcnJheV1cIlxuICAgICAgICBdO1xuXG4gICAgICAgIHZhciBpc0RhdGFWaWV3ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgcmV0dXJuIG9iaiAmJiBEYXRhVmlldy5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihvYmopO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBpc0FycmF5QnVmZmVyVmlldyA9XG4gICAgICAgICAgQXJyYXlCdWZmZXIuaXNWaWV3IHx8XG4gICAgICAgICAgZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICBvYmogJiZcbiAgICAgICAgICAgICAgdmlld0NsYXNzZXMuaW5kZXhPZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSkgPiAtMVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBub3JtYWxpemVOYW1lKG5hbWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgbmFtZSA9IFN0cmluZyhuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoL1teYS16MC05XFwtIyQlJicqKy5cXF5fYHx+XS9pLnRlc3QobmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBjaGFyYWN0ZXIgaW4gaGVhZGVyIGZpZWxkIG5hbWVcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbm9ybWFsaXplVmFsdWUodmFsdWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIHZhbHVlID0gU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEJ1aWxkIGEgZGVzdHJ1Y3RpdmUgaXRlcmF0b3IgZm9yIHRoZSB2YWx1ZSBsaXN0XG4gICAgICBmdW5jdGlvbiBpdGVyYXRvckZvcihpdGVtcykge1xuICAgICAgICB2YXIgaXRlcmF0b3IgPSB7XG4gICAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBpdGVtcy5zaGlmdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHsgZG9uZTogdmFsdWUgPT09IHVuZGVmaW5lZCwgdmFsdWU6IHZhbHVlIH07XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gICAgICAgICAgaXRlcmF0b3JbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaXRlcmF0b3I7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIEhlYWRlcnMoaGVhZGVycykge1xuICAgICAgICB0aGlzLm1hcCA9IHt9O1xuXG4gICAgICAgIGlmIChoZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycykge1xuICAgICAgICAgIGhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgdmFsdWUpO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoaGVhZGVycykpIHtcbiAgICAgICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24oaGVhZGVyKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZChoZWFkZXJbMF0sIGhlYWRlclsxXSk7XG4gICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaGVhZGVycykge1xuICAgICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGhlYWRlcnMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgaGVhZGVyc1tuYW1lXSk7XG4gICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICAgICAgbmFtZSA9IG5vcm1hbGl6ZU5hbWUobmFtZSk7XG4gICAgICAgIHZhbHVlID0gbm9ybWFsaXplVmFsdWUodmFsdWUpO1xuICAgICAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLm1hcFtuYW1lXTtcbiAgICAgICAgdGhpcy5tYXBbbmFtZV0gPSBvbGRWYWx1ZSA/IG9sZFZhbHVlICsgXCIsXCIgKyB2YWx1ZSA6IHZhbHVlO1xuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGVbXCJkZWxldGVcIl0gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgbmFtZSA9IG5vcm1hbGl6ZU5hbWUobmFtZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmhhcyhuYW1lKSA/IHRoaXMubWFwW25hbWVdIDogbnVsbDtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwLmhhc093blByb3BlcnR5KG5vcm1hbGl6ZU5hbWUobmFtZSkpO1xuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV0gPSBub3JtYWxpemVWYWx1ZSh2YWx1ZSk7XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgICAgZm9yICh2YXIgbmFtZSBpbiB0aGlzLm1hcCkge1xuICAgICAgICAgIGlmICh0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB0aGlzLm1hcFtuYW1lXSwgbmFtZSwgdGhpcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xuICAgICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgICBpdGVtcy5wdXNoKG5hbWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLnZhbHVlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaXRlbXMucHVzaCh2YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpO1xuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUuZW50cmllcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgICAgaXRlbXMucHVzaChbbmFtZSwgdmFsdWVdKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcyk7XG4gICAgICB9O1xuXG4gICAgICBpZiAoc3VwcG9ydC5pdGVyYWJsZSkge1xuICAgICAgICBIZWFkZXJzLnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdID0gSGVhZGVycy5wcm90b3R5cGUuZW50cmllcztcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gY29uc3VtZWQoYm9keSkge1xuICAgICAgICBpZiAoYm9keS5ib2R5VXNlZCkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgVHlwZUVycm9yKFwiQWxyZWFkeSByZWFkXCIpKTtcbiAgICAgICAgfVxuICAgICAgICBib2R5LmJvZHlVc2VkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZmlsZVJlYWRlclJlYWR5KHJlYWRlcikge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZWplY3QocmVhZGVyLmVycm9yKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcmVhZEJsb2JBc0FycmF5QnVmZmVyKGJsb2IpIHtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHZhciBwcm9taXNlID0gZmlsZVJlYWRlclJlYWR5KHJlYWRlcik7XG4gICAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihibG9iKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlYWRCbG9iQXNUZXh0KGJsb2IpIHtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHZhciBwcm9taXNlID0gZmlsZVJlYWRlclJlYWR5KHJlYWRlcik7XG4gICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGJsb2IpO1xuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcmVhZEFycmF5QnVmZmVyQXNUZXh0KGJ1Zikge1xuICAgICAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGJ1Zik7XG4gICAgICAgIHZhciBjaGFycyA9IG5ldyBBcnJheSh2aWV3Lmxlbmd0aCk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2aWV3Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY2hhcnNbaV0gPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHZpZXdbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjaGFycy5qb2luKFwiXCIpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBidWZmZXJDbG9uZShidWYpIHtcbiAgICAgICAgaWYgKGJ1Zi5zbGljZSkge1xuICAgICAgICAgIHJldHVybiBidWYuc2xpY2UoMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWYuYnl0ZUxlbmd0aCk7XG4gICAgICAgICAgdmlldy5zZXQobmV3IFVpbnQ4QXJyYXkoYnVmKSk7XG4gICAgICAgICAgcmV0dXJuIHZpZXcuYnVmZmVyO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIEJvZHkoKSB7XG4gICAgICAgIHRoaXMuYm9keVVzZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLl9pbml0Qm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgICAgICAgICB0aGlzLl9ib2R5SW5pdCA9IGJvZHk7XG4gICAgICAgICAgaWYgKCFib2R5KSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IFwiXCI7XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYm9keSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5fYm9keVRleHQgPSBib2R5O1xuICAgICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5ibG9iICYmIEJsb2IucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlCbG9iID0gYm9keTtcbiAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgc3VwcG9ydC5mb3JtRGF0YSAmJlxuICAgICAgICAgICAgRm9ybURhdGEucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSlcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlGb3JtRGF0YSA9IGJvZHk7XG4gICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIHN1cHBvcnQuc2VhcmNoUGFyYW1zICYmXG4gICAgICAgICAgICBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSlcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keS50b1N0cmluZygpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlciAmJiBzdXBwb3J0LmJsb2IgJiYgaXNEYXRhVmlldyhib2R5KSkge1xuICAgICAgICAgICAgdGhpcy5fYm9keUFycmF5QnVmZmVyID0gYnVmZmVyQ2xvbmUoYm9keS5idWZmZXIpO1xuICAgICAgICAgICAgLy8gSUUgMTAtMTEgY2FuJ3QgaGFuZGxlIGEgRGF0YVZpZXcgYm9keS5cbiAgICAgICAgICAgIHRoaXMuX2JvZHlJbml0ID0gbmV3IEJsb2IoW3RoaXMuX2JvZHlBcnJheUJ1ZmZlcl0pO1xuICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBzdXBwb3J0LmFycmF5QnVmZmVyICYmXG4gICAgICAgICAgICAoQXJyYXlCdWZmZXIucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkgfHxcbiAgICAgICAgICAgICAgaXNBcnJheUJ1ZmZlclZpZXcoYm9keSkpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5QXJyYXlCdWZmZXIgPSBidWZmZXJDbG9uZShib2R5KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5zdXBwb3J0ZWQgQm9keUluaXQgdHlwZVwiKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIXRoaXMuaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIikpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYm9keSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KFwiY29udGVudC10eXBlXCIsIFwidGV4dC9wbGFpbjtjaGFyc2V0PVVURi04XCIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QmxvYiAmJiB0aGlzLl9ib2R5QmxvYi50eXBlKSB7XG4gICAgICAgICAgICAgIHRoaXMuaGVhZGVycy5zZXQoXCJjb250ZW50LXR5cGVcIiwgdGhpcy5fYm9keUJsb2IudHlwZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICBzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJlxuICAgICAgICAgICAgICBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KFxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCIsXG4gICAgICAgICAgICAgICAgXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7Y2hhcnNldD1VVEYtOFwiXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzdXBwb3J0LmJsb2IpIHtcbiAgICAgICAgICB0aGlzLmJsb2IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpO1xuICAgICAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAgIHJldHVybiByZWplY3RlZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUJsb2IpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keUFycmF5QnVmZmVyXSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyBibG9iXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keVRleHRdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHRoaXMuYXJyYXlCdWZmZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNvbnN1bWVkKHRoaXMpIHx8IFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmxvYigpLnRoZW4ocmVhZEJsb2JBc0FycmF5QnVmZmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50ZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcyk7XG4gICAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVhZEJsb2JBc1RleHQodGhpcy5fYm9keUJsb2IpO1xuICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxuICAgICAgICAgICAgICByZWFkQXJyYXlCdWZmZXJBc1RleHQodGhpcy5fYm9keUFycmF5QnVmZmVyKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlGb3JtRGF0YSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyB0ZXh0XCIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlUZXh0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHN1cHBvcnQuZm9ybURhdGEpIHtcbiAgICAgICAgICB0aGlzLmZvcm1EYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihkZWNvZGUpO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmpzb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihKU09OLnBhcnNlKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgLy8gSFRUUCBtZXRob2RzIHdob3NlIGNhcGl0YWxpemF0aW9uIHNob3VsZCBiZSBub3JtYWxpemVkXG4gICAgICB2YXIgbWV0aG9kcyA9IFtcIkRFTEVURVwiLCBcIkdFVFwiLCBcIkhFQURcIiwgXCJPUFRJT05TXCIsIFwiUE9TVFwiLCBcIlBVVFwiXTtcblxuICAgICAgZnVuY3Rpb24gbm9ybWFsaXplTWV0aG9kKG1ldGhvZCkge1xuICAgICAgICB2YXIgdXBjYXNlZCA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpO1xuICAgICAgICByZXR1cm4gbWV0aG9kcy5pbmRleE9mKHVwY2FzZWQpID4gLTEgPyB1cGNhc2VkIDogbWV0aG9kO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBSZXF1ZXN0KGlucHV0LCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICB2YXIgYm9keSA9IG9wdGlvbnMuYm9keTtcblxuICAgICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBSZXF1ZXN0KSB7XG4gICAgICAgICAgaWYgKGlucHV0LmJvZHlVc2VkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQWxyZWFkeSByZWFkXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVybCA9IGlucHV0LnVybDtcbiAgICAgICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5wdXQuY3JlZGVudGlhbHM7XG4gICAgICAgICAgaWYgKCFvcHRpb25zLmhlYWRlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKGlucHV0LmhlYWRlcnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLm1ldGhvZCA9IGlucHV0Lm1ldGhvZDtcbiAgICAgICAgICB0aGlzLm1vZGUgPSBpbnB1dC5tb2RlO1xuICAgICAgICAgIGlmICghYm9keSAmJiBpbnB1dC5fYm9keUluaXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgYm9keSA9IGlucHV0Ll9ib2R5SW5pdDtcbiAgICAgICAgICAgIGlucHV0LmJvZHlVc2VkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy51cmwgPSBTdHJpbmcoaW5wdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jcmVkZW50aWFscyA9IG9wdGlvbnMuY3JlZGVudGlhbHMgfHwgdGhpcy5jcmVkZW50aWFscyB8fCBcIm9taXRcIjtcbiAgICAgICAgaWYgKG9wdGlvbnMuaGVhZGVycyB8fCAhdGhpcy5oZWFkZXJzKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1ldGhvZCA9IG5vcm1hbGl6ZU1ldGhvZChvcHRpb25zLm1ldGhvZCB8fCB0aGlzLm1ldGhvZCB8fCBcIkdFVFwiKTtcbiAgICAgICAgdGhpcy5tb2RlID0gb3B0aW9ucy5tb2RlIHx8IHRoaXMubW9kZSB8fCBudWxsO1xuICAgICAgICB0aGlzLnJlZmVycmVyID0gbnVsbDtcblxuICAgICAgICBpZiAoKHRoaXMubWV0aG9kID09PSBcIkdFVFwiIHx8IHRoaXMubWV0aG9kID09PSBcIkhFQURcIikgJiYgYm9keSkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJCb2R5IG5vdCBhbGxvd2VkIGZvciBHRVQgb3IgSEVBRCByZXF1ZXN0c1wiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pbml0Qm9keShib2R5KTtcbiAgICAgIH1cblxuICAgICAgUmVxdWVzdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXF1ZXN0KHRoaXMsIHsgYm9keTogdGhpcy5fYm9keUluaXQgfSk7XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiBkZWNvZGUoYm9keSkge1xuICAgICAgICB2YXIgZm9ybSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICBib2R5XG4gICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgIC5zcGxpdChcIiZcIilcbiAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbihieXRlcykge1xuICAgICAgICAgICAgaWYgKGJ5dGVzKSB7XG4gICAgICAgICAgICAgIHZhciBzcGxpdCA9IGJ5dGVzLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgICAgdmFyIG5hbWUgPSBzcGxpdC5zaGlmdCgpLnJlcGxhY2UoL1xcKy9nLCBcIiBcIik7XG4gICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHNwbGl0LmpvaW4oXCI9XCIpLnJlcGxhY2UoL1xcKy9nLCBcIiBcIik7XG4gICAgICAgICAgICAgIGZvcm0uYXBwZW5kKGRlY29kZVVSSUNvbXBvbmVudChuYW1lKSwgZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmb3JtO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBwYXJzZUhlYWRlcnMocmF3SGVhZGVycykge1xuICAgICAgICB2YXIgaGVhZGVyczogYW55ID0gbmV3IEhlYWRlcnMoe30pO1xuICAgICAgICByYXdIZWFkZXJzLnNwbGl0KC9cXHI/XFxuLykuZm9yRWFjaChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgdmFyIHBhcnRzID0gbGluZS5zcGxpdChcIjpcIik7XG4gICAgICAgICAgdmFyIGtleSA9IHBhcnRzLnNoaWZ0KCkudHJpbSgpO1xuICAgICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHBhcnRzLmpvaW4oXCI6XCIpLnRyaW0oKTtcbiAgICAgICAgICAgIGhlYWRlcnMuYXBwZW5kKGtleSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBoZWFkZXJzO1xuICAgICAgfVxuXG4gICAgICBCb2R5LmNhbGwoUmVxdWVzdC5wcm90b3R5cGUpO1xuXG4gICAgICB2YXIgUmVzcG9uc2U6IGFueSA9IGZ1bmN0aW9uKGJvZHlJbml0LCBvcHRpb25zKTogdm9pZCB7XG4gICAgICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudHlwZSA9IFwiZGVmYXVsdFwiO1xuICAgICAgICB0aGlzLnN0YXR1cyA9IFwic3RhdHVzXCIgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RhdHVzIDogMjAwO1xuICAgICAgICB0aGlzLm9rID0gdGhpcy5zdGF0dXMgPj0gMjAwICYmIHRoaXMuc3RhdHVzIDwgMzAwO1xuICAgICAgICB0aGlzLnN0YXR1c1RleHQgPSBcInN0YXR1c1RleHRcIiBpbiBvcHRpb25zID8gb3B0aW9ucy5zdGF0dXNUZXh0IDogXCJPS1wiO1xuICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhvcHRpb25zLmhlYWRlcnMpO1xuICAgICAgICB0aGlzLnVybCA9IG9wdGlvbnMudXJsIHx8IFwiXCI7XG4gICAgICAgIHRoaXMuX2luaXRCb2R5KGJvZHlJbml0KTtcbiAgICAgIH07XG5cbiAgICAgIEJvZHkuY2FsbChSZXNwb25zZS5wcm90b3R5cGUpO1xuXG4gICAgICBSZXNwb25zZS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZSh0aGlzLl9ib2R5SW5pdCwge1xuICAgICAgICAgIHN0YXR1czogdGhpcy5zdGF0dXMsXG4gICAgICAgICAgc3RhdHVzVGV4dDogdGhpcy5zdGF0dXNUZXh0LFxuICAgICAgICAgIGhlYWRlcnM6IG5ldyBIZWFkZXJzKHRoaXMuaGVhZGVycyksXG4gICAgICAgICAgdXJsOiB0aGlzLnVybFxuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIFJlc3BvbnNlLmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZXNwb25zZSA9IG5ldyBSZXNwb25zZShudWxsLCB7IHN0YXR1czogMCwgc3RhdHVzVGV4dDogXCJcIiB9KTtcbiAgICAgICAgcmVzcG9uc2UudHlwZSA9IFwiZXJyb3JcIjtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfTtcblxuICAgICAgdmFyIHJlZGlyZWN0U3RhdHVzZXMgPSBbMzAxLCAzMDIsIDMwMywgMzA3LCAzMDhdO1xuXG4gICAgICBSZXNwb25zZS5yZWRpcmVjdCA9IGZ1bmN0aW9uKHVybCwgc3RhdHVzKSB7XG4gICAgICAgIGlmIChyZWRpcmVjdFN0YXR1c2VzLmluZGV4T2Yoc3RhdHVzKSA9PT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkludmFsaWQgc3RhdHVzIGNvZGVcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtcbiAgICAgICAgICBzdGF0dXM6IHN0YXR1cyxcbiAgICAgICAgICBoZWFkZXJzOiB7IGxvY2F0aW9uOiB1cmwgfVxuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIHNlbGYuSGVhZGVycyA9IEhlYWRlcnM7XG4gICAgICBzZWxmLlJlcXVlc3QgPSBSZXF1ZXN0O1xuICAgICAgc2VsZi5SZXNwb25zZSA9IFJlc3BvbnNlO1xuXG4gICAgICBzZWxmLmZldGNoID0gZnVuY3Rpb24oaW5wdXQsIGluaXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoaW5wdXQsIGluaXQpO1xuICAgICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIHN0YXR1czogYW55O1xuICAgICAgICAgICAgICBzdGF0dXNUZXh0OiBhbnk7XG4gICAgICAgICAgICAgIGhlYWRlcnM6IGFueTtcbiAgICAgICAgICAgICAgdXJsPzogYW55O1xuICAgICAgICAgICAgfSA9IHtcbiAgICAgICAgICAgICAgc3RhdHVzOiB4aHIuc3RhdHVzLFxuICAgICAgICAgICAgICBzdGF0dXNUZXh0OiB4aHIuc3RhdHVzVGV4dCxcbiAgICAgICAgICAgICAgaGVhZGVyczogcGFyc2VIZWFkZXJzKHhoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSB8fCBcIlwiKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG9wdGlvbnMudXJsID1cbiAgICAgICAgICAgICAgXCJyZXNwb25zZVVSTFwiIGluIHhoclxuICAgICAgICAgICAgICAgID8geGhyLnJlc3BvbnNlVVJMXG4gICAgICAgICAgICAgICAgOiBvcHRpb25zLmhlYWRlcnMuZ2V0KFwiWC1SZXF1ZXN0LVVSTFwiKTtcbiAgICAgICAgICAgIHZhciBib2R5ID0gXCJyZXNwb25zZVwiIGluIHhociA/IHhoci5yZXNwb25zZSA6IHhoci5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICByZXNvbHZlKG5ldyBSZXNwb25zZShib2R5LCBvcHRpb25zKSk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcihcIk5ldHdvcmsgcmVxdWVzdCBmYWlsZWRcIikpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB4aHIub250aW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcihcIk5ldHdvcmsgcmVxdWVzdCBmYWlsZWRcIikpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB4aHIub3BlbihyZXF1ZXN0Lm1ldGhvZCwgcmVxdWVzdC51cmwsIHRydWUpO1xuXG4gICAgICAgICAgaWYgKHJlcXVlc3QuY3JlZGVudGlhbHMgPT09IFwiaW5jbHVkZVwiKSB7XG4gICAgICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoXCJyZXNwb25zZVR5cGVcIiBpbiB4aHIgJiYgc3VwcG9ydC5ibG9iKSB7XG4gICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gXCJibG9iXCI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVxdWVzdC5oZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHhoci5zZW5kKFxuICAgICAgICAgICAgdHlwZW9mIHJlcXVlc3QuX2JvZHlJbml0ID09PSBcInVuZGVmaW5lZFwiID8gbnVsbCA6IHJlcXVlc3QuX2JvZHlJbml0XG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgc2VsZi5mZXRjaC5wb2x5ZmlsbCA9IHRydWU7XG4gICAgfSkodHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdGhpcyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmV0Y2g6IHNlbGYuZmV0Y2gsXG4gICAgICBIZWFkZXJzOiBzZWxmLkhlYWRlcnMsXG4gICAgICBSZXF1ZXN0OiBzZWxmLlJlcXVlc3QsXG4gICAgICBSZXNwb25zZTogc2VsZi5SZXNwb25zZVxuICAgIH07XG4gIH0pKCk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBmZXRjaFBvbnlmaWxsO1xuIiwiaW1wb3J0IGZldGNoUG9ueWZpbGwgZnJvbSBcIi4uL3ZlbmRvci9mZXRjaFBvbnlmaWxsXCI7XG5cbnR5cGUgUmVxdWVzdEluaXRpYWxpemF0aW9uT2JqZWN0ID0ge1xuICBlbmRwb2ludD86IHN0cmluZztcbiAgb3B0aW9ucz86IFJlcXVlc3RJbml0O1xuICBib2R5PzogRm9ybURhdGE7XG59O1xuXG5jbGFzcyBSZXF1ZXN0IHtcbiAgLy8gUHJvcGVydHkgdHlwZXNcbiAgZW5kcG9pbnQ6IHN0cmluZztcbiAgb3B0aW9uczogUmVxdWVzdEluaXQ7XG4gIGJvZHk6IEZvcm1EYXRhO1xuXG4gIC8vIFN0YXRpYyBwcm9wZXJ0aWVzXG4gIC8qKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXIge29iamVjdH0gUmVxdWVzdC5kZWZhdWx0T3B0aW9ucyBPcHRpb25zIG9iamVjdCB0byBmYWxsYmFjayB0byBpZlxuICAgKiBubyBvcHRpb25zIHByb3BlcnR5IGlzIHBhc3NlZCBpbnRvIHRoZSBjb25zdHJ1Y3RvciBjb25maWcgb2JqZWN0LlxuICAgKi9cbiAgc3RhdGljIGRlZmF1bHRPcHRpb25zOiBSZXF1ZXN0SW5pdCA9IHtcbiAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgaGVhZGVyczogeyBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiIH1cbiAgfTtcblxuICAvLyBDb25zdHJ1Y3RvclxuICAvKipcbiAgICogQGNsYXNzIFJlcXVlc3RcbiAgICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZ1xuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmVuZHBvaW50XG4gICAqIEBwYXJhbSB7b2JqZWN0fSBbY29uZmlnLm9wdGlvbnNdXG4gICAqIEBwYXJhbSB7Rm9ybURhdGF9IFtjb25maWcuYm9keV1cbiAgICovXG4gIGNvbnN0cnVjdG9yKHsgZW5kcG9pbnQsIG9wdGlvbnMsIGJvZHkgfTogUmVxdWVzdEluaXRpYWxpemF0aW9uT2JqZWN0KSB7XG4gICAgdGhpcy5lbmRwb2ludCA9IGVuZHBvaW50O1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwgUmVxdWVzdC5kZWZhdWx0T3B0aW9ucztcbiAgICB0aGlzLmJvZHkgPSBib2R5O1xuICB9XG4gIC8vIFByaXZhdGUgbWV0aG9kc1xuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogQGZ1bmN0aW9uIFJlcXVlc3QucHJlcGFyZUZldGNoT3B0aW9uc1xuICAgKiBAZGVzY3JpcHRpb24gQ3JlYXRlcyBibGFuayBGb3JtRGF0YSBvYmplY3QgaWYgdGhpcy5ib2R5IGlzIHVuZGVmaW5lZCBhbmRcbiAgICogdGhpcy5vcHRpb25zLm1ldGhvZCBpcyBlcXVhbCB0byBcIlBPU1RcIi5cbiAgICogQHJldHVybnMge0Zvcm1EYXRhfVxuICAgKi9cbiAgcHJpdmF0ZSBwcmVwYXJlRmV0Y2hPcHRpb25zID0gKCkgPT4ge1xuICAgIGlmICghdGhpcy5ib2R5ICYmIHRoaXMub3B0aW9ucy5tZXRob2QgPT09IFwiUE9TVFwiKSB7XG4gICAgICB0aGlzLmJvZHkgPSBuZXcgRm9ybURhdGEoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYm9keTtcbiAgfTtcbiAgLy8gUHVibGljIG1ldGhvZHNcbiAgLyoqXG4gICAqIEBwdWJsaWNcbiAgICogQGZ1bmN0aW9uIFJlcXVlc3Quc2VuZFxuICAgKiBAcGFyYW1cdHtvYmplY3R9IG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5hc3luY10gQWxsb3dzIHByb3BlcnR5IGBhc3luY2AgdG8gYmUgc2V0IHRvIGluZGljYXRlIHRoZVxuICAgKiByZXNwb25zZSBzaG91bGQgYmUgcHJlcGFyZWQgYmVmb3JlIHJldHVybmluZy5cbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBwdWJsaWMgc2VuZCA9ICh7IGFzeW5jIH06IHsgYXN5bmM6IGJvb2xlYW4gfSA9IHsgYXN5bmM6IGZhbHNlIH0pID0+IHtcbiAgICBjb25zdCB7IGZldGNoIH0gPSB3aW5kb3dcbiAgICAgID8gd2luZG93LmZldGNoID8gd2luZG93IDogZmV0Y2hQb255ZmlsbCh7fSkuZmV0Y2hcbiAgICAgIDoge1xuICAgICAgICAgIGZldGNoOiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJmZXRjaCBpcyBub3Qgc3VwcG9ydGVkXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICBjb25zdCBwcmVwYXJlZE9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB0aGlzLnByZXBhcmVGZXRjaE9wdGlvbnMoKSxcbiAgICAgIHRoaXMub3B0aW9uc1xuICAgICk7XG4gICAgY29uc3QgaW5pdEZldGNoID0gZmV0Y2godGhpcy5lbmRwb2ludCwgcHJlcGFyZWRPcHRpb25zKTtcbiAgICByZXR1cm4gYXN5bmMgPyBpbml0RmV0Y2gudGhlbihyZXMgPT4gcmVzLmpzb24oKSkgOiBpbml0RmV0Y2g7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IFJlcXVlc3Q7XG4iLCIvKipcbiAqIEBtb2R1bGUgZGF0YU1hbmlwdWxhdGlvblxuICovXG5cbnR5cGUgYWxwaGFudW1lcmljID0gc3RyaW5nIHwgbnVtYmVyO1xudHlwZSBhcnJheUxpa2UgPSBzdHJpbmcgfCBhbHBoYW51bWVyaWNbXTtcblxuLyoqXG4gKiBAZnVuY3Rpb24gc2VhcmNoUHJvcFBhdGhcbiAqIEBkZXNjcmlwdGlvbiBSZWN1cnNpdmVseSBzZWFyY2hzIHRocm91Z2ggYSBkYXRhIG9iamVjdDsgdGhyb3dzIGFuIGVycm9yIGlmIHRoZSByZXN1bHRpbmcgdmFsdWUgb2YgYSBzZWFyY2hlZCBwYXRoIGlzIHVuZGVmaW5lZC5cbiAqIEBwYXJhbSB7YWxwaGFudW1lcmljW119IFtwYXRoXSBBcnJheSBvZiBrZXlzIGluIHRoZSBvcmRlciBvZiB3aGljaCB3aWxsIGJlIHVzZWQgdG8gcmVjdXJzaXZlbHkgc2VhcmNoIGFuIG9iamVjdFxuICogQHBhcmFtIHtvYmplY3R9IFtjb2xsZWN0aW9uXSBEYXRhIG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IFtkZWxpbWl0ZXJdIERlbGltaXRlciBieSB3aGljaCB0byBzcGxpdCB0aGUgcGF0aDsgZGVmYXVsdHMgdG8gJy4nXG4gKiBAcmV0dXJuIHthbnl9IFZhbHVlIGF0IHRoZSBlbmQgb2YgdGhlIHNlYXJjaGVkIHByb3BlcnR5IHBhdGg7XG4gKi9cbmNvbnN0IHNlYXJjaFByb3BQYXRoID0gKFxuXHRwYXRoOiBhcnJheUxpa2UsXG5cdGNvbGxlY3Rpb246IG9iamVjdCxcblx0ZGVsaW1pdGVyOiBzdHJpbmcgPSBcIi5cIlxuKTogYW55ID0+IHtcblx0Y29uc3Qgc2FmZVBhdGggPSB0eXBlb2YgcGF0aCA9PT0gXCJzdHJpbmdcIiA/IHBhdGguc3BsaXQoZGVsaW1pdGVyKSA6IHBhdGg7XG5cdGxldCBwYXRoUmVzdWx0ID0gY29sbGVjdGlvbjtcblx0c2FmZVBhdGguZm9yRWFjaChrZXkgPT4ge1xuXHRcdHBhdGhSZXN1bHQgPSBwYXRoUmVzdWx0W2tleV07XG5cdH0pO1xuXHRpZiAocGF0aFJlc3VsdCkgcmV0dXJuIHBhdGhSZXN1bHQ7XG5cdHRocm93IG5ldyBFcnJvcihcblx0XHRgcGF0aFJlc3VsdCB5aWVsZHMgdW5kZWZpbmVkIHZhbHVlIHdoZW4gc2VhcmNoaW5nICR7c2FmZVBhdGguam9pbihcblx0XHRcdGRlbGltaXRlclxuXHRcdCl9IG9uIGNvbGxlY3Rpb24gYXJndW1lbnQuYFxuXHQpO1xufTtcblxuZXhwb3J0IHsgc2VhcmNoUHJvcFBhdGggfTtcbiIsIi8qKlxuICogQG1vZHVsZSBwYXJzZVxuICovXG5cbi8qKlxuICogQmFzZSBmcm9tIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2dlb2ZmZGF2aXM5Mi8xZGE3ZDA3NDVlM2JiYTAzNmY5NFxuICogQGZ1bmN0aW9uIHBhcmFtc1xuICogQGRlc2NyaXB0aW9uIENyZWF0ZXMgb2JqZWN0IG9mIGtleS92YWx1ZSBwYWlycyBmcm9tIFVSTCBwYXJhbWV0ZXJzLlxuICogQHBhcmFtIHtzdHJpbmd9IFt1cmxdIFVSTCB0byBwYXJzZTsgZGVmYXVsdHMgdG8gd2luZG93LmxvY2F0aW9uLnNlYXJjaC5cbiAqIEByZXR1cm4ge29iamVjdH0gT2JqZWN0IG9mIGtleS92YWx1ZSBwYWlycy5cbiAqL1xuY29uc3QgcGFyYW1zID0gKHVybDogc3RyaW5nID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaCk6IG9iamVjdCA9PlxuICB1cmxcbiAgICAuc3BsaXQoXCI/XCIpWzFdXG4gICAgLnNwbGl0KFwiJlwiKVxuICAgIC5tYXAocSA9PiBxLnNwbGl0KFwiPVwiKSlcbiAgICAucmVkdWNlKChhY2MsIFtrZXksIHZhbF0sIGksIGFycikgPT4ge1xuICAgICAgYWNjW2tleV0gPSBkZWNvZGVVUklDb21wb25lbnQodmFsKS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpO1xuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB7fSk7XG5cbi8qKlxuICogQGZ1bmN0aW9uIHBhcnNlRXh0ZXJuYWxNYXJrZG93bkxpbmtzXG4gKiBAZGVzY3JpcHRpb24gVHJhbnNmb3JtcyBNYXJrZG93biBsaW5rcyB0byB1c2UgdGFyZ2V0PVwiX2JsYW5rXCIsIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIjtcbiAqIHVzdWFsbHkgdXNlZCB3aGVuIGltcGxlbWVudGluZyBjbGllbnRzaWRlIE1hcmtkb3duLCBiZWZvcmUgc2VuZGluZyB0aGUgTWFya2Rvd24gdG8gdGhlIG1haW5cbiAqIHBhcnNpbmcgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFN0cmluZyB0byBwYXJzZSBhcyBNYXJrZG93biBsaW5rLlxuICogQHJldHVybnMge3N0cmluZ30gSFRNTCBsaW5rIHdpdGggVVJMIGFuZCBpbm5lclRleHQsIHRhcmdldCBhbmQgcmVsIGF0dHJpYnV0ZXMgcHJvcGVybHkgc2V0IGZvclxuICogYW4gZXh0ZXJuYWwgbGluay5cbiAqL1xuY29uc3QgcGFyc2VFeHRlcm5hbE1hcmtkb3duTGlua3MgPSAoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICBjb25zdCBwYXR0ZXJuOiBSZWdFeHAgPSAvXFxbKFteXFxdXSspXFxdXFwoKFteKV0rKVxcKS9nO1xuICBpZiAoc3RyaW5nLnNlYXJjaChwYXR0ZXJuKSA+IC0xKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKFxuICAgICAgcGF0dGVybixcbiAgICAgICc8YSBocmVmPVwiJDJcIiB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+JDE8L2E+J1xuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxufTtcblxuZXhwb3J0IHsgcGFyYW1zIGFzIHBhcnNlVVJMUGFyYW1zLCBwYXJzZUV4dGVybmFsTWFya2Rvd25MaW5rcyB9O1xuIiwiLyoqXG4gKiBAbW9kdWxlIHNjcm9sbFxuICovXG5cbi8qKlxuICogQGZ1bmN0aW9uIGlzRWxlbWVudEluVmlld3BvcnRcbiAqIEBkZXNjcmlwdGlvbiBEZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudCBpcyBwYXJ0aWFsbHkgb3JcbiAqIGZ1bGx5IHZpc2libGUgaW4gdGhlIHZpZXdwb3J0LlxuICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZ1xuICogQHBhcmFtIHtFbGVtZW50fSBjb25maWcuZWxlbWVudCBIVE1MIEVsZW1lbnQgbm9kZSB0byB0YXJnZXQuXG4gKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy50aHJlc2hvbGRdIFJhdGlvIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQgdGhlIGVsZW1lbnRcbiAqIG11c3QgZmlsbCBiZWZvcmUgYmVpbmcgY29uc2lkZXJlZCB2aXNpYmxlLiBFLmcuIDAuNSBtZWFucyB0aGUgZWxlbWVudFxuICogbXVzdCB0YWtlIHVwIDUwJSBvZiB0aGUgc2NyZWVuIGJlZm9yZSByZXR1cm5pbmcgdHJ1ZS4gRGVmYXVsdHMgdG8gMC4yNS5cbiAqIE9ubHkgdXNlZCBmb3IgZWxlbWVudHMgdGFsbGVyIHRoYW4gdGhlIHZpZXdwb3J0LlxuICogQHJldHVybiB7Ym9vbGVhbn0gQm9vbGVhbiBkZXNjcmliaW5nIGlmIGlucHV0IGlzIGZ1bGx5L3BhcnRpYWxseVxuICogaW4gdGhlIHZpZXdwb3J0LCByZWxhdGl2ZSB0byB0aGUgdGhyZXNob2xkIHNldHRpbmcuXG4gKi9cbmZ1bmN0aW9uIGlzRWxlbWVudEluVmlld3BvcnQoe1xuICBlbGVtZW50OiBhcmdFbGVtZW50LFxuICB0aHJlc2hvbGQ6IGFyZ1RocmVzaG9sZFxufToge1xuICBlbGVtZW50OiBFbGVtZW50O1xuICB0aHJlc2hvbGQ6IG51bWJlcjtcbn0pOiBib29sZWFuIHtcbiAgY29uc3QgZGVmYXVsdFBhcmFtczoge1xuICAgIHRocmVzaG9sZDogbnVtYmVyO1xuICB9ID0ge1xuICAgIHRocmVzaG9sZDogMC4yNVxuICB9O1xuXG4gIGNvbnN0IHNhZmVBcmdzID0ge1xuICAgIHRocmVzaG9sZDogYXJnVGhyZXNob2xkIHx8IGRlZmF1bHRQYXJhbXMudGhyZXNob2xkXG4gIH07XG5cbiAgY29uc3QgcmVjdDogQ2xpZW50UmVjdCB8IERPTVJlY3QgPSBhcmdFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gIGNvbnN0IHZpZXdwb3J0SGVpZ2h0OiBudW1iZXIgPSBNYXRoLm1heChcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0LFxuICAgIHdpbmRvdy5pbm5lckhlaWdodCB8fCAwXG4gICk7XG4gIGNvbnN0IHsgdGhyZXNob2xkIH0gPSBzYWZlQXJncztcblxuICBpZiAodGhyZXNob2xkIDwgMCB8fCB0aHJlc2hvbGQgPiAxKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXG4gICAgICBcIlRocmVzaG9sZCBhcmd1bWVudCBtdXN0IGJlIGEgZGVjaW1hbCBiZXR3ZWVuIDAgYW5kIDFcIlxuICAgICk7XG4gIH1cblxuICAvL0lmIHRoZSBlbGVtZW50IGlzIHRvbyB0YWxsIHRvIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0XG4gIGlmIChyZWN0LmhlaWdodCA+PSB0aHJlc2hvbGQgKiB2aWV3cG9ydEhlaWdodCkge1xuICAgIGlmIChcbiAgICAgIHJlY3QudG9wIC0gdmlld3BvcnRIZWlnaHQgPD0gdGhyZXNob2xkICogdmlld3BvcnRIZWlnaHQgKiAtMSAmJlxuICAgICAgcmVjdC5ib3R0b20gPj0gdGhyZXNob2xkICogdmlld3BvcnRIZWlnaHRcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vSWYgdGhlIGVsZW1lbnQgaXMgc2hvcnQgZW5vdWdoIHRvIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0XG4gICAgaWYgKHJlY3QudG9wID49IDAgJiYgcmVjdC5ib3R0b20gLSB2aWV3cG9ydEhlaWdodCA8PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEZyb20gaHR0cDovL2JpdC5seS8yY1A2NWZEXG4gKiBAdG9kbyBDbGFzc2lmeSBhbmQgZGVzY3JpYmUgcGFyYW1zLlxuICogQGZ1bmN0aW9uIHNjcm9sbFRvXG4gKiBAZGVzY3JpcHRpb24gU2Nyb2xscyBnaXZlbiBlbGVtZW50IHRvIGRldGVybWluZWQgcG9pbnQuXG4gKiBAcGFyYW0gIHtFbGVtZW50fSBlbGVtZW50ICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHRvICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge251bWJlcn0gZHVyYXRpb24gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gc2Nyb2xsVG8oZWxlbWVudDogRWxlbWVudCwgdG86IG51bWJlciwgZHVyYXRpb246IG51bWJlcik6IHZvaWQge1xuICBpZiAoZHVyYXRpb24gPD0gMCkgcmV0dXJuO1xuICBjb25zdCBkaWZmZXJlbmNlOiBudW1iZXIgPSB0byAtIGVsZW1lbnQuc2Nyb2xsVG9wO1xuICBjb25zdCBwZXJUaWNrOiBudW1iZXIgPSBkaWZmZXJlbmNlIC8gZHVyYXRpb24gKiAxMDtcblxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIGVsZW1lbnQuc2Nyb2xsVG9wID0gZWxlbWVudC5zY3JvbGxUb3AgKyBwZXJUaWNrO1xuICAgIGlmIChlbGVtZW50LnNjcm9sbFRvcCA9PT0gdG8pIHJldHVybjtcbiAgICBzY3JvbGxUbyhlbGVtZW50LCB0bywgZHVyYXRpb24gLSAxMCk7XG4gIH0sIDEwKTtcbn1cblxuZXhwb3J0IHsgaXNFbGVtZW50SW5WaWV3cG9ydCwgc2Nyb2xsVG8gfTtcbiIsIi8qKlxuICogQG1vZHVsZSBzZWxlY3RcbiAqL1xuXG4vKipcbiAqIEBmdW5jdGlvbiBzZWxlY3RcbiAqIEBkZXNjcmlwdGlvbiBTZWxlY3RzIGEgRE9NIG5vZGUgYmFzZWQgb24gYSBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBxdWVyeSBxdWVyeSBzZWxlY3RvciB0byB1c2UgdG8gcXVlcnkgYW4gbm9kZS5cbiAqIEByZXR1cm5zIHtFbGVtZW50fSBGaXJzdCBET00gbm9kZSB0aGF0IG1hdGNoZXMgdGhlIHF1ZXJ5LlxuICovXG5jb25zdCBzZWxlY3Q6IEZ1bmN0aW9uID0gKHF1ZXJ5OiBzdHJpbmcpOiBFbGVtZW50ID0+XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocXVlcnkpO1xuXG4vKipcbiAqIEBmdW5jdGlvbiBzZWxlY3RBbGxcbiAqIEBkZXNjcmlwdGlvbiBTZWxlY3RzIGEgRE9NIG5vZGVsaXN0IGJhc2VkIG9uIGEgcXVlcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30gcXVlcnkgcXVlcnkgc2VsZWN0b3IgdG8gdXNlIHRvIHF1ZXJ5IGEgbm9kZWxpc3QuXG4gKiBAcmV0dXJucyB7RWxlbWVudFtdfSBBcnJheSBvZiBET00gbm9kZXMgdGhhdCBtYXRjaCB0aGUgcXVlcnkuXG4gKi9cbmNvbnN0IHNlbGVjdEFsbDogRnVuY3Rpb24gPSAocXVlcnk6IHN0cmluZyk6IEVsZW1lbnRbXSA9PiBbXG4gIC4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpXG5dO1xuXG4vKipcbiAqIEBmdW5jdGlvbiBzZWxlY3RCeUlkXG4gKiBAZGVzY3JpcHRpb24gU2VsZWN0cyBhIERPTSBub2RlIGJhc2VkIG9uIGFuIElEIHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCBJRCBvZiBET00gbm9kZSB0byBzZWxlY3QuXG4gKiBAcmV0dXJucyB7RWxlbWVudH0gRE9NIG5vZGUgd2l0aCBtYXRjaGVkIElELlxuICovXG5jb25zdCBzZWxlY3RCeUlkOiBGdW5jdGlvbiA9IChpZDogc3RyaW5nKTogRWxlbWVudCA9PlxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG5cbmV4cG9ydCB7IHNlbGVjdCwgc2VsZWN0QWxsLCBzZWxlY3RCeUlkIH07XG4iLCIvKipcbiAqIEBtb2R1bGUgdHlwb2dyYXBoeVxuICovXG5cbi8qKlxuICogQGZ1bmN0aW9uIGNhcGl0YWxpemVcbiAqIEBkZXNjcmlwdGlvbiBDYXBpdGFsaXplcyBhbGwgd29yZHMgaW4gYSBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRleHQgdG8gY2FwaXRhbGl6ZS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFRpdGxlLWNhc2VkIHRleHQuXG4gKi9cbmNvbnN0IGNhcGl0YWxpemUgPSAoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcgPT5cbiAgc3RyaW5nXG4gICAgLnNwbGl0KFwiIFwiKVxuICAgIC5tYXAocyA9PiB1Y0ZpcnN0KHMpKVxuICAgIC5qb2luKFwiIFwiKTtcblxuLyoqXG4gKiBAZnVuY3Rpb24gc2x1Z2lmeVxuICogQGRlc2NyaXB0aW9uIExvd2VyY2FzZXMgc3RyaW5nLCByZXBsYWNlcyBzcGFjZXMgYW5kIHNwZWNpYWwgY2hhcmFjdGVyc1xuICogd2l0aCBhIHNldCBkZWxpbWl0ZXIuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFRvU2x1ZyBUZXh0IHRvIHNsdWdpZnkuXG4gKiBAcGFyYW0ge3N0cmluZ30gW2RlbGltaXRlcl0gRGVsaW1pdGVyOyBkZWZhdWx0cyB0byBcIi1cIi5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFNsdWdpZmllZCB0ZXh0LlxuICovXG5jb25zdCBzbHVnaWZ5ID0gKHRleHRUb1NsdWc6IHN0cmluZywgZGVsaW1pdGVyOiBzdHJpbmcgPSBcIi1cIik6IHN0cmluZyA9PlxuICB0ZXh0VG9TbHVnXG4gICAgLnJlcGxhY2UoLyhcXCF8I3xcXCR8JXxcXCp8XFwufFxcL3xcXFxcfFxcKHxcXCl8XFwrfFxcfHxcXCx8XFw6fFxcJ3xcXFwiKS9nLCBcIlwiKVxuICAgIC5yZXBsYWNlKC8oLikoXFxzfFxcX3xcXC0pKyguKS9nLCBgJDEke2RlbGltaXRlcn0kM2ApXG4gICAgLnRvTG93ZXJDYXNlKCk7XG5cbi8qKlxuICogQGZ1bmN0aW9uIHRyaW1cbiAqIEBkZXNjcmlwdGlvbiBUcmltcyB3aGl0ZXNwYWNlIG9uIGVpdGhlciBlbmQgb2YgYSBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRleHQgdG8gdHJpbS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFRyaW1tZWQgdGV4dC5cbiAqL1xuY29uc3QgdHJpbSA9IChzdHJpbmc6IHN0cmluZyk6IHN0cmluZyA9PiBzdHJpbmcucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgXCJcIik7XG5cbi8qKlxuICogQGZ1bmN0aW9uIHVjRmlyc3RcbiAqIEBkZXNjcmlwdGlvbiBDYXBpdGFsaXplcyBmaXJzdCB3b3JkIGluIGEgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBUZXh0IHRvIGNhcGl0YWxpemUuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBDYXBpdGFsaXplZCB0ZXh0LlxuICovXG5jb25zdCB1Y0ZpcnN0ID0gKFtmaXJzdExldHRlciwgLi4ucmVzdExldHRlcnNdOiBzdHJpbmcpOiBzdHJpbmcgPT5cbiAgYCR7Zmlyc3RMZXR0ZXIudG9VcHBlckNhc2UoKX0ke3Jlc3RMZXR0ZXJzLmpvaW4oXCJcIil9YDtcblxuZXhwb3J0IHsgY2FwaXRhbGl6ZSwgc2x1Z2lmeSwgdHJpbSwgdWNGaXJzdCB9O1xuIl0sIm5hbWVzIjpbImZldGNoUG9ueWZpbGwiLCJvcHRpb25zIiwid2luZG93Iiwic2VsZiIsImdsb2JhbCIsIlByb21pc2UiLCJYTUxIdHRwUmVxdWVzdCIsIk9iamVjdCIsImNyZWF0ZSIsInVuZGVmaW5lZCIsImZldGNoIiwic3VwcG9ydCIsIlN5bWJvbCIsIkJsb2IiLCJlIiwiYXJyYXlCdWZmZXIiLCJ2aWV3Q2xhc3NlcyIsImlzRGF0YVZpZXciLCJvYmoiLCJEYXRhVmlldyIsInByb3RvdHlwZSIsImlzUHJvdG90eXBlT2YiLCJpc0FycmF5QnVmZmVyVmlldyIsIkFycmF5QnVmZmVyIiwiaXNWaWV3IiwiaW5kZXhPZiIsInRvU3RyaW5nIiwiY2FsbCIsIm5hbWUiLCJTdHJpbmciLCJ0ZXN0IiwiVHlwZUVycm9yIiwidG9Mb3dlckNhc2UiLCJ2YWx1ZSIsIml0ZW1zIiwiaXRlcmF0b3IiLCJzaGlmdCIsImRvbmUiLCJpdGVyYWJsZSIsImhlYWRlcnMiLCJtYXAiLCJIZWFkZXJzIiwiZm9yRWFjaCIsImFwcGVuZCIsIkFycmF5IiwiaXNBcnJheSIsImhlYWRlciIsImdldE93blByb3BlcnR5TmFtZXMiLCJub3JtYWxpemVOYW1lIiwibm9ybWFsaXplVmFsdWUiLCJvbGRWYWx1ZSIsImdldCIsImhhcyIsImhhc093blByb3BlcnR5Iiwic2V0IiwiY2FsbGJhY2siLCJ0aGlzQXJnIiwia2V5cyIsInB1c2giLCJpdGVyYXRvckZvciIsInZhbHVlcyIsImVudHJpZXMiLCJib2R5IiwiYm9keVVzZWQiLCJyZWplY3QiLCJyZWFkZXIiLCJyZXNvbHZlIiwib25sb2FkIiwicmVzdWx0Iiwib25lcnJvciIsImVycm9yIiwiYmxvYiIsIkZpbGVSZWFkZXIiLCJwcm9taXNlIiwiZmlsZVJlYWRlclJlYWR5IiwicmVhZEFzQXJyYXlCdWZmZXIiLCJyZWFkQXNUZXh0IiwiYnVmIiwidmlldyIsIlVpbnQ4QXJyYXkiLCJjaGFycyIsImxlbmd0aCIsImkiLCJmcm9tQ2hhckNvZGUiLCJqb2luIiwic2xpY2UiLCJieXRlTGVuZ3RoIiwiYnVmZmVyIiwiX2luaXRCb2R5IiwiX2JvZHlJbml0IiwiX2JvZHlUZXh0IiwiX2JvZHlCbG9iIiwiZm9ybURhdGEiLCJGb3JtRGF0YSIsIl9ib2R5Rm9ybURhdGEiLCJzZWFyY2hQYXJhbXMiLCJVUkxTZWFyY2hQYXJhbXMiLCJfYm9keUFycmF5QnVmZmVyIiwiYnVmZmVyQ2xvbmUiLCJFcnJvciIsInR5cGUiLCJyZWplY3RlZCIsImNvbnN1bWVkIiwidGhlbiIsInJlYWRCbG9iQXNBcnJheUJ1ZmZlciIsInRleHQiLCJyZWFkQmxvYkFzVGV4dCIsInJlYWRBcnJheUJ1ZmZlckFzVGV4dCIsImRlY29kZSIsImpzb24iLCJKU09OIiwicGFyc2UiLCJtZXRob2RzIiwibWV0aG9kIiwidXBjYXNlZCIsInRvVXBwZXJDYXNlIiwiaW5wdXQiLCJSZXF1ZXN0IiwidXJsIiwiY3JlZGVudGlhbHMiLCJtb2RlIiwibm9ybWFsaXplTWV0aG9kIiwicmVmZXJyZXIiLCJjbG9uZSIsImZvcm0iLCJ0cmltIiwic3BsaXQiLCJieXRlcyIsInJlcGxhY2UiLCJkZWNvZGVVUklDb21wb25lbnQiLCJyYXdIZWFkZXJzIiwibGluZSIsInBhcnRzIiwia2V5IiwiUmVzcG9uc2UiLCJib2R5SW5pdCIsInN0YXR1cyIsIm9rIiwic3RhdHVzVGV4dCIsInJlc3BvbnNlIiwicmVkaXJlY3RTdGF0dXNlcyIsInJlZGlyZWN0IiwiUmFuZ2VFcnJvciIsImxvY2F0aW9uIiwiaW5pdCIsInJlcXVlc3QiLCJ4aHIiLCJwYXJzZUhlYWRlcnMiLCJnZXRBbGxSZXNwb25zZUhlYWRlcnMiLCJyZXNwb25zZVVSTCIsInJlc3BvbnNlVGV4dCIsIm9udGltZW91dCIsIm9wZW4iLCJ3aXRoQ3JlZGVudGlhbHMiLCJyZXNwb25zZVR5cGUiLCJzZXRSZXF1ZXN0SGVhZGVyIiwic2VuZCIsInBvbHlmaWxsIiwiZW5kcG9pbnQiLCJhc3luYyIsIndhcm4iLCJwcmVwYXJlZE9wdGlvbnMiLCJwcmVwYXJlRmV0Y2hPcHRpb25zIiwiaW5pdEZldGNoIiwicmVzIiwiZGVmYXVsdE9wdGlvbnMiLCJBY2NlcHQiLCJzZWFyY2hQcm9wUGF0aCIsInBhdGgiLCJjb2xsZWN0aW9uIiwiZGVsaW1pdGVyIiwic2FmZVBhdGgiLCJwYXRoUmVzdWx0IiwicGFyYW1zIiwic2VhcmNoIiwicSIsInJlZHVjZSIsImFjYyIsImFyciIsInZhbCIsInBhcnNlRXh0ZXJuYWxNYXJrZG93bkxpbmtzIiwic3RyaW5nIiwicGF0dGVybiIsImFyZ0VsZW1lbnQiLCJlbGVtZW50IiwiYXJnVGhyZXNob2xkIiwidGhyZXNob2xkIiwiZGVmYXVsdFBhcmFtcyIsInNhZmVBcmdzIiwicmVjdCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInZpZXdwb3J0SGVpZ2h0IiwiTWF0aCIsIm1heCIsImRvY3VtZW50IiwiZG9jdW1lbnRFbGVtZW50IiwiY2xpZW50SGVpZ2h0IiwiaW5uZXJIZWlnaHQiLCJoZWlnaHQiLCJ0b3AiLCJib3R0b20iLCJ0byIsImR1cmF0aW9uIiwiZGlmZmVyZW5jZSIsInNjcm9sbFRvcCIsInBlclRpY2siLCJzZWxlY3QiLCJxdWVyeSIsInF1ZXJ5U2VsZWN0b3IiLCJzZWxlY3RBbGwiLCJxdWVyeVNlbGVjdG9yQWxsIiwic2VsZWN0QnlJZCIsImlkIiwiZ2V0RWxlbWVudEJ5SWQiLCJjYXBpdGFsaXplIiwidWNGaXJzdCIsInMiLCJzbHVnaWZ5IiwidGV4dFRvU2x1ZyIsImZpcnN0TGV0dGVyIiwicmVzdExldHRlcnMiXSwibWFwcGluZ3MiOiI7OztBQUFBOzs7Ozs7OztBQVFBLElBQU1BLGdCQUFnQixzQkFBQSxDQUF1QkMsT0FBdkI7UUFDaEJDLFNBQVNBLFNBQVNBLE1BQVQsR0FBa0IsS0FBL0I7UUFDSUMsT0FBTyxPQUFPQSxJQUFQLEtBQWdCLFdBQWhCLEdBQStCRCxTQUFTQSxNQUFULEdBQWtCRSxNQUFqRCxHQUEyREQsSUFBdEU7UUFDSUUsVUFBV0osV0FBV0EsUUFBUUksT0FBcEIsSUFBZ0NGLEtBQUtFLE9BQW5EO1FBQ0lDLGlCQUNE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
