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

return exports;

}({}));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW0uZGV2LmpzIiwic291cmNlcyI6WyIuLi9zcmMvdmVuZG9yL2ZldGNoUG9ueWZpbGwudHMiLCIuLi9zcmMvY2xhc3Nlcy9SZXF1ZXN0LnRzIiwiLi4vc3JjL2Z1bmN0aW9ucy9kYXRhTWFuaXB1bGF0aW9uLnRzIiwiLi4vc3JjL2Z1bmN0aW9ucy9wYXJzZS50cyIsIi4uL3NyYy9mdW5jdGlvbnMvc2Nyb2xsLnRzIiwiLi4vc3JjL2Z1bmN0aW9ucy9zZWxlY3QudHMiLCIuLi9zcmMvZnVuY3Rpb25zL3R5cG9ncmFwaHkudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBDb3BpZWQgZnJvbSBub2RlX21vZHVsZXMvZmV0Y2gtcG9ueWZpbGwvYnVpbGQvZmV0Y2gtYnJvd3Nlci5qcy5cbiAqXG4gKiBUeXBlcyBhZGRlZCB3aGVyZSBuZWNlc3NhcnkuXG4gKlxuICogTW92ZWQgb3V0IG9mIElJRkUgbW9kdWxlIHR5cGUsIHBsYWNlZCBgc2VsZmAgZGVjbGFyYXRpb24gdG8gdG9wXG4gKiBvZiBgZmV0Y2hQb255ZmlsbGAgZnVuY3Rpb24gc2NvcGUuXG4gKi9cbmNvbnN0IGZldGNoUG9ueWZpbGwgPSBmdW5jdGlvbiBmZXRjaFBvbnlmaWxsKG9wdGlvbnMpIHtcbiAgdmFyIHdpbmRvdyA9IHdpbmRvdyA/IHdpbmRvdyA6IGZhbHNlO1xuICB2YXIgc2VsZiA9IHR5cGVvZiBzZWxmID09PSBcInVuZGVmaW5lZFwiID8gKHdpbmRvdyA/IHdpbmRvdyA6IGdsb2JhbCkgOiBzZWxmO1xuICB2YXIgUHJvbWlzZSA9IChvcHRpb25zICYmIG9wdGlvbnMuUHJvbWlzZSkgfHwgc2VsZi5Qcm9taXNlO1xuICB2YXIgWE1MSHR0cFJlcXVlc3QgPVxuICAgIChvcHRpb25zICYmIG9wdGlvbnMuWE1MSHR0cFJlcXVlc3QpIHx8IHNlbGYuWE1MSHR0cFJlcXVlc3Q7XG4gIHZhciBnbG9iYWwgPSBzZWxmO1xuXG4gIHJldHVybiAoZnVuY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSBPYmplY3QuY3JlYXRlKGdsb2JhbCwge1xuICAgICAgZmV0Y2g6IHtcbiAgICAgICAgdmFsdWU6IHVuZGVmaW5lZCxcbiAgICAgICAgd3JpdGFibGU6IHRydWVcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIChmdW5jdGlvbihzZWxmKSB7XG4gICAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgICAgaWYgKHNlbGYuZmV0Y2gpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuXG4gICAgICB2YXIgc3VwcG9ydCA9IHtcbiAgICAgICAgc2VhcmNoUGFyYW1zOiBcIlVSTFNlYXJjaFBhcmFtc1wiIGluIHNlbGYsXG4gICAgICAgIGl0ZXJhYmxlOiBcIlN5bWJvbFwiIGluIHNlbGYgJiYgXCJpdGVyYXRvclwiIGluIFN5bWJvbCxcbiAgICAgICAgYmxvYjpcbiAgICAgICAgICBcIkZpbGVSZWFkZXJcIiBpbiBzZWxmICYmXG4gICAgICAgICAgXCJCbG9iXCIgaW4gc2VsZiAmJlxuICAgICAgICAgIChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIG5ldyBCbG9iKCk7XG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSkoKSxcbiAgICAgICAgZm9ybURhdGE6IFwiRm9ybURhdGFcIiBpbiBzZWxmLFxuICAgICAgICBhcnJheUJ1ZmZlcjogXCJBcnJheUJ1ZmZlclwiIGluIHNlbGZcbiAgICAgIH07XG5cbiAgICAgIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyKSB7XG4gICAgICAgIHZhciB2aWV3Q2xhc3NlcyA9IFtcbiAgICAgICAgICBcIltvYmplY3QgSW50OEFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBVaW50OEFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBVaW50OENsYW1wZWRBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgSW50MTZBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgVWludDE2QXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IEludDMyQXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IFVpbnQzMkFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBGbG9hdDMyQXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IEZsb2F0NjRBcnJheV1cIlxuICAgICAgICBdO1xuXG4gICAgICAgIHZhciBpc0RhdGFWaWV3ID0gZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgcmV0dXJuIG9iaiAmJiBEYXRhVmlldy5wcm90b3R5cGUuaXNQcm90b3R5cGVPZihvYmopO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBpc0FycmF5QnVmZmVyVmlldyA9XG4gICAgICAgICAgQXJyYXlCdWZmZXIuaXNWaWV3IHx8XG4gICAgICAgICAgZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICByZXR1cm4gKFxuICAgICAgICAgICAgICBvYmogJiZcbiAgICAgICAgICAgICAgdmlld0NsYXNzZXMuaW5kZXhPZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSkgPiAtMVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBub3JtYWxpemVOYW1lKG5hbWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgbmFtZSA9IFN0cmluZyhuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoL1teYS16MC05XFwtIyQlJicqKy5cXF5fYHx+XS9pLnRlc3QobmFtZSkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBjaGFyYWN0ZXIgaW4gaGVhZGVyIGZpZWxkIG5hbWVcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5hbWUudG9Mb3dlckNhc2UoKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbm9ybWFsaXplVmFsdWUodmFsdWUpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIHZhbHVlID0gU3RyaW5nKHZhbHVlKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICB9XG5cbiAgICAgIC8vIEJ1aWxkIGEgZGVzdHJ1Y3RpdmUgaXRlcmF0b3IgZm9yIHRoZSB2YWx1ZSBsaXN0XG4gICAgICBmdW5jdGlvbiBpdGVyYXRvckZvcihpdGVtcykge1xuICAgICAgICB2YXIgaXRlcmF0b3IgPSB7XG4gICAgICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBpdGVtcy5zaGlmdCgpO1xuICAgICAgICAgICAgcmV0dXJuIHsgZG9uZTogdmFsdWUgPT09IHVuZGVmaW5lZCwgdmFsdWU6IHZhbHVlIH07XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzdXBwb3J0Lml0ZXJhYmxlKSB7XG4gICAgICAgICAgaXRlcmF0b3JbU3ltYm9sLml0ZXJhdG9yXSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIGl0ZXJhdG9yO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gaXRlcmF0b3I7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIEhlYWRlcnMoaGVhZGVycykge1xuICAgICAgICB0aGlzLm1hcCA9IHt9O1xuXG4gICAgICAgIGlmIChoZWFkZXJzIGluc3RhbmNlb2YgSGVhZGVycykge1xuICAgICAgICAgIGhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgdmFsdWUpO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkoaGVhZGVycykpIHtcbiAgICAgICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24oaGVhZGVyKSB7XG4gICAgICAgICAgICB0aGlzLmFwcGVuZChoZWFkZXJbMF0sIGhlYWRlclsxXSk7XG4gICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoaGVhZGVycykge1xuICAgICAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGhlYWRlcnMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICAgICAgdGhpcy5hcHBlbmQobmFtZSwgaGVhZGVyc1tuYW1lXSk7XG4gICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUuYXBwZW5kID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICAgICAgbmFtZSA9IG5vcm1hbGl6ZU5hbWUobmFtZSk7XG4gICAgICAgIHZhbHVlID0gbm9ybWFsaXplVmFsdWUodmFsdWUpO1xuICAgICAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLm1hcFtuYW1lXTtcbiAgICAgICAgdGhpcy5tYXBbbmFtZV0gPSBvbGRWYWx1ZSA/IG9sZFZhbHVlICsgXCIsXCIgKyB2YWx1ZSA6IHZhbHVlO1xuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGVbXCJkZWxldGVcIl0gPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgbmFtZSA9IG5vcm1hbGl6ZU5hbWUobmFtZSk7XG4gICAgICAgIHJldHVybiB0aGlzLmhhcyhuYW1lKSA/IHRoaXMubWFwW25hbWVdIDogbnVsbDtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLmhhcyA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMubWFwLmhhc093blByb3BlcnR5KG5vcm1hbGl6ZU5hbWUobmFtZSkpO1xuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24obmFtZSwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV0gPSBub3JtYWxpemVWYWx1ZSh2YWx1ZSk7XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICAgICAgZm9yICh2YXIgbmFtZSBpbiB0aGlzLm1hcCkge1xuICAgICAgICAgIGlmICh0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShuYW1lKSkge1xuICAgICAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB0aGlzLm1hcFtuYW1lXSwgbmFtZSwgdGhpcyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpdGVtcyA9IFtdO1xuICAgICAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgICBpdGVtcy5wdXNoKG5hbWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLnZhbHVlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgICAgaXRlbXMucHVzaCh2YWx1ZSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpO1xuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUuZW50cmllcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgICAgaXRlbXMucHVzaChbbmFtZSwgdmFsdWVdKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcyk7XG4gICAgICB9O1xuXG4gICAgICBpZiAoc3VwcG9ydC5pdGVyYWJsZSkge1xuICAgICAgICBIZWFkZXJzLnByb3RvdHlwZVtTeW1ib2wuaXRlcmF0b3JdID0gSGVhZGVycy5wcm90b3R5cGUuZW50cmllcztcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gY29uc3VtZWQoYm9keSkge1xuICAgICAgICBpZiAoYm9keS5ib2R5VXNlZCkge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgVHlwZUVycm9yKFwiQWxyZWFkeSByZWFkXCIpKTtcbiAgICAgICAgfVxuICAgICAgICBib2R5LmJvZHlVc2VkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gZmlsZVJlYWRlclJlYWR5KHJlYWRlcikge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVzb2x2ZShyZWFkZXIucmVzdWx0KTtcbiAgICAgICAgICB9O1xuICAgICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZWplY3QocmVhZGVyLmVycm9yKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9KTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcmVhZEJsb2JBc0FycmF5QnVmZmVyKGJsb2IpIHtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHZhciBwcm9taXNlID0gZmlsZVJlYWRlclJlYWR5KHJlYWRlcik7XG4gICAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihibG9iKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlYWRCbG9iQXNUZXh0KGJsb2IpIHtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHZhciBwcm9taXNlID0gZmlsZVJlYWRlclJlYWR5KHJlYWRlcik7XG4gICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGJsb2IpO1xuICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcmVhZEFycmF5QnVmZmVyQXNUZXh0KGJ1Zikge1xuICAgICAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KGJ1Zik7XG4gICAgICAgIHZhciBjaGFycyA9IG5ldyBBcnJheSh2aWV3Lmxlbmd0aCk7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2aWV3Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY2hhcnNbaV0gPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHZpZXdbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjaGFycy5qb2luKFwiXCIpO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBidWZmZXJDbG9uZShidWYpIHtcbiAgICAgICAgaWYgKGJ1Zi5zbGljZSkge1xuICAgICAgICAgIHJldHVybiBidWYuc2xpY2UoMCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWYuYnl0ZUxlbmd0aCk7XG4gICAgICAgICAgdmlldy5zZXQobmV3IFVpbnQ4QXJyYXkoYnVmKSk7XG4gICAgICAgICAgcmV0dXJuIHZpZXcuYnVmZmVyO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIEJvZHkoKSB7XG4gICAgICAgIHRoaXMuYm9keVVzZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLl9pbml0Qm9keSA9IGZ1bmN0aW9uKGJvZHkpIHtcbiAgICAgICAgICB0aGlzLl9ib2R5SW5pdCA9IGJvZHk7XG4gICAgICAgICAgaWYgKCFib2R5KSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IFwiXCI7XG4gICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYm9keSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhpcy5fYm9keVRleHQgPSBib2R5O1xuICAgICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5ibG9iICYmIEJsb2IucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlCbG9iID0gYm9keTtcbiAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgc3VwcG9ydC5mb3JtRGF0YSAmJlxuICAgICAgICAgICAgRm9ybURhdGEucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSlcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlGb3JtRGF0YSA9IGJvZHk7XG4gICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIHN1cHBvcnQuc2VhcmNoUGFyYW1zICYmXG4gICAgICAgICAgICBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSlcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keS50b1N0cmluZygpO1xuICAgICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlciAmJiBzdXBwb3J0LmJsb2IgJiYgaXNEYXRhVmlldyhib2R5KSkge1xuICAgICAgICAgICAgdGhpcy5fYm9keUFycmF5QnVmZmVyID0gYnVmZmVyQ2xvbmUoYm9keS5idWZmZXIpO1xuICAgICAgICAgICAgLy8gSUUgMTAtMTEgY2FuJ3QgaGFuZGxlIGEgRGF0YVZpZXcgYm9keS5cbiAgICAgICAgICAgIHRoaXMuX2JvZHlJbml0ID0gbmV3IEJsb2IoW3RoaXMuX2JvZHlBcnJheUJ1ZmZlcl0pO1xuICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBzdXBwb3J0LmFycmF5QnVmZmVyICYmXG4gICAgICAgICAgICAoQXJyYXlCdWZmZXIucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSkgfHxcbiAgICAgICAgICAgICAgaXNBcnJheUJ1ZmZlclZpZXcoYm9keSkpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5QXJyYXlCdWZmZXIgPSBidWZmZXJDbG9uZShib2R5KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwidW5zdXBwb3J0ZWQgQm9keUluaXQgdHlwZVwiKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoIXRoaXMuaGVhZGVycy5nZXQoXCJjb250ZW50LXR5cGVcIikpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgYm9keSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KFwiY29udGVudC10eXBlXCIsIFwidGV4dC9wbGFpbjtjaGFyc2V0PVVURi04XCIpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QmxvYiAmJiB0aGlzLl9ib2R5QmxvYi50eXBlKSB7XG4gICAgICAgICAgICAgIHRoaXMuaGVhZGVycy5zZXQoXCJjb250ZW50LXR5cGVcIiwgdGhpcy5fYm9keUJsb2IudHlwZSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgICBzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJlxuICAgICAgICAgICAgICBVUkxTZWFyY2hQYXJhbXMucHJvdG90eXBlLmlzUHJvdG90eXBlT2YoYm9keSlcbiAgICAgICAgICAgICkge1xuICAgICAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KFxuICAgICAgICAgICAgICAgIFwiY29udGVudC10eXBlXCIsXG4gICAgICAgICAgICAgICAgXCJhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQ7Y2hhcnNldD1VVEYtOFwiXG4gICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzdXBwb3J0LmJsb2IpIHtcbiAgICAgICAgICB0aGlzLmJsb2IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpO1xuICAgICAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgICAgIHJldHVybiByZWplY3RlZDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUJsb2IpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keUFycmF5QnVmZmVyXSkpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyBibG9iXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keVRleHRdKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHRoaXMuYXJyYXlCdWZmZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNvbnN1bWVkKHRoaXMpIHx8IFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYmxvYigpLnRoZW4ocmVhZEJsb2JBc0FycmF5QnVmZmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy50ZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIHJlamVjdGVkID0gY29uc3VtZWQodGhpcyk7XG4gICAgICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQ7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHRoaXMuX2JvZHlCbG9iKSB7XG4gICAgICAgICAgICByZXR1cm4gcmVhZEJsb2JBc1RleHQodGhpcy5fYm9keUJsb2IpO1xuICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKFxuICAgICAgICAgICAgICByZWFkQXJyYXlCdWZmZXJBc1RleHQodGhpcy5fYm9keUFycmF5QnVmZmVyKVxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlGb3JtRGF0YSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyB0ZXh0XCIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlUZXh0KTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKHN1cHBvcnQuZm9ybURhdGEpIHtcbiAgICAgICAgICB0aGlzLmZvcm1EYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihkZWNvZGUpO1xuICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmpzb24gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICByZXR1cm4gdGhpcy50ZXh0KCkudGhlbihKU09OLnBhcnNlKTtcbiAgICAgICAgfTtcblxuICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgIH1cblxuICAgICAgLy8gSFRUUCBtZXRob2RzIHdob3NlIGNhcGl0YWxpemF0aW9uIHNob3VsZCBiZSBub3JtYWxpemVkXG4gICAgICB2YXIgbWV0aG9kcyA9IFtcIkRFTEVURVwiLCBcIkdFVFwiLCBcIkhFQURcIiwgXCJPUFRJT05TXCIsIFwiUE9TVFwiLCBcIlBVVFwiXTtcblxuICAgICAgZnVuY3Rpb24gbm9ybWFsaXplTWV0aG9kKG1ldGhvZCkge1xuICAgICAgICB2YXIgdXBjYXNlZCA9IG1ldGhvZC50b1VwcGVyQ2FzZSgpO1xuICAgICAgICByZXR1cm4gbWV0aG9kcy5pbmRleE9mKHVwY2FzZWQpID4gLTEgPyB1cGNhc2VkIDogbWV0aG9kO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBSZXF1ZXN0KGlucHV0LCBvcHRpb25zKSB7XG4gICAgICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuICAgICAgICB2YXIgYm9keSA9IG9wdGlvbnMuYm9keTtcblxuICAgICAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBSZXF1ZXN0KSB7XG4gICAgICAgICAgaWYgKGlucHV0LmJvZHlVc2VkKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQWxyZWFkeSByZWFkXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLnVybCA9IGlucHV0LnVybDtcbiAgICAgICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5wdXQuY3JlZGVudGlhbHM7XG4gICAgICAgICAgaWYgKCFvcHRpb25zLmhlYWRlcnMpIHtcbiAgICAgICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKGlucHV0LmhlYWRlcnMpO1xuICAgICAgICAgIH1cbiAgICAgICAgICB0aGlzLm1ldGhvZCA9IGlucHV0Lm1ldGhvZDtcbiAgICAgICAgICB0aGlzLm1vZGUgPSBpbnB1dC5tb2RlO1xuICAgICAgICAgIGlmICghYm9keSAmJiBpbnB1dC5fYm9keUluaXQgIT0gbnVsbCkge1xuICAgICAgICAgICAgYm9keSA9IGlucHV0Ll9ib2R5SW5pdDtcbiAgICAgICAgICAgIGlucHV0LmJvZHlVc2VkID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy51cmwgPSBTdHJpbmcoaW5wdXQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5jcmVkZW50aWFscyA9IG9wdGlvbnMuY3JlZGVudGlhbHMgfHwgdGhpcy5jcmVkZW50aWFscyB8fCBcIm9taXRcIjtcbiAgICAgICAgaWYgKG9wdGlvbnMuaGVhZGVycyB8fCAhdGhpcy5oZWFkZXJzKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLm1ldGhvZCA9IG5vcm1hbGl6ZU1ldGhvZChvcHRpb25zLm1ldGhvZCB8fCB0aGlzLm1ldGhvZCB8fCBcIkdFVFwiKTtcbiAgICAgICAgdGhpcy5tb2RlID0gb3B0aW9ucy5tb2RlIHx8IHRoaXMubW9kZSB8fCBudWxsO1xuICAgICAgICB0aGlzLnJlZmVycmVyID0gbnVsbDtcblxuICAgICAgICBpZiAoKHRoaXMubWV0aG9kID09PSBcIkdFVFwiIHx8IHRoaXMubWV0aG9kID09PSBcIkhFQURcIikgJiYgYm9keSkge1xuICAgICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJCb2R5IG5vdCBhbGxvd2VkIGZvciBHRVQgb3IgSEVBRCByZXF1ZXN0c1wiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLl9pbml0Qm9keShib2R5KTtcbiAgICAgIH1cblxuICAgICAgUmVxdWVzdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXF1ZXN0KHRoaXMsIHsgYm9keTogdGhpcy5fYm9keUluaXQgfSk7XG4gICAgICB9O1xuXG4gICAgICBmdW5jdGlvbiBkZWNvZGUoYm9keSkge1xuICAgICAgICB2YXIgZm9ybSA9IG5ldyBGb3JtRGF0YSgpO1xuICAgICAgICBib2R5XG4gICAgICAgICAgLnRyaW0oKVxuICAgICAgICAgIC5zcGxpdChcIiZcIilcbiAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbihieXRlcykge1xuICAgICAgICAgICAgaWYgKGJ5dGVzKSB7XG4gICAgICAgICAgICAgIHZhciBzcGxpdCA9IGJ5dGVzLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgICAgdmFyIG5hbWUgPSBzcGxpdC5zaGlmdCgpLnJlcGxhY2UoL1xcKy9nLCBcIiBcIik7XG4gICAgICAgICAgICAgIHZhciB2YWx1ZSA9IHNwbGl0LmpvaW4oXCI9XCIpLnJlcGxhY2UoL1xcKy9nLCBcIiBcIik7XG4gICAgICAgICAgICAgIGZvcm0uYXBwZW5kKGRlY29kZVVSSUNvbXBvbmVudChuYW1lKSwgZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBmb3JtO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBwYXJzZUhlYWRlcnMocmF3SGVhZGVycykge1xuICAgICAgICB2YXIgaGVhZGVyczogYW55ID0gbmV3IEhlYWRlcnMoe30pO1xuICAgICAgICByYXdIZWFkZXJzLnNwbGl0KC9cXHI/XFxuLykuZm9yRWFjaChmdW5jdGlvbihsaW5lKSB7XG4gICAgICAgICAgdmFyIHBhcnRzID0gbGluZS5zcGxpdChcIjpcIik7XG4gICAgICAgICAgdmFyIGtleSA9IHBhcnRzLnNoaWZ0KCkudHJpbSgpO1xuICAgICAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IHBhcnRzLmpvaW4oXCI6XCIpLnRyaW0oKTtcbiAgICAgICAgICAgIGhlYWRlcnMuYXBwZW5kKGtleSwgdmFsdWUpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBoZWFkZXJzO1xuICAgICAgfVxuXG4gICAgICBCb2R5LmNhbGwoUmVxdWVzdC5wcm90b3R5cGUpO1xuXG4gICAgICB2YXIgUmVzcG9uc2U6IGFueSA9IGZ1bmN0aW9uKGJvZHlJbml0LCBvcHRpb25zKTogdm9pZCB7XG4gICAgICAgIGlmICghb3B0aW9ucykge1xuICAgICAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudHlwZSA9IFwiZGVmYXVsdFwiO1xuICAgICAgICB0aGlzLnN0YXR1cyA9IFwic3RhdHVzXCIgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RhdHVzIDogMjAwO1xuICAgICAgICB0aGlzLm9rID0gdGhpcy5zdGF0dXMgPj0gMjAwICYmIHRoaXMuc3RhdHVzIDwgMzAwO1xuICAgICAgICB0aGlzLnN0YXR1c1RleHQgPSBcInN0YXR1c1RleHRcIiBpbiBvcHRpb25zID8gb3B0aW9ucy5zdGF0dXNUZXh0IDogXCJPS1wiO1xuICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhvcHRpb25zLmhlYWRlcnMpO1xuICAgICAgICB0aGlzLnVybCA9IG9wdGlvbnMudXJsIHx8IFwiXCI7XG4gICAgICAgIHRoaXMuX2luaXRCb2R5KGJvZHlJbml0KTtcbiAgICAgIH07XG5cbiAgICAgIEJvZHkuY2FsbChSZXNwb25zZS5wcm90b3R5cGUpO1xuXG4gICAgICBSZXNwb25zZS5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZSh0aGlzLl9ib2R5SW5pdCwge1xuICAgICAgICAgIHN0YXR1czogdGhpcy5zdGF0dXMsXG4gICAgICAgICAgc3RhdHVzVGV4dDogdGhpcy5zdGF0dXNUZXh0LFxuICAgICAgICAgIGhlYWRlcnM6IG5ldyBIZWFkZXJzKHRoaXMuaGVhZGVycyksXG4gICAgICAgICAgdXJsOiB0aGlzLnVybFxuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIFJlc3BvbnNlLmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByZXNwb25zZSA9IG5ldyBSZXNwb25zZShudWxsLCB7IHN0YXR1czogMCwgc3RhdHVzVGV4dDogXCJcIiB9KTtcbiAgICAgICAgcmVzcG9uc2UudHlwZSA9IFwiZXJyb3JcIjtcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgICAgfTtcblxuICAgICAgdmFyIHJlZGlyZWN0U3RhdHVzZXMgPSBbMzAxLCAzMDIsIDMwMywgMzA3LCAzMDhdO1xuXG4gICAgICBSZXNwb25zZS5yZWRpcmVjdCA9IGZ1bmN0aW9uKHVybCwgc3RhdHVzKSB7XG4gICAgICAgIGlmIChyZWRpcmVjdFN0YXR1c2VzLmluZGV4T2Yoc3RhdHVzKSA9PT0gLTEpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcIkludmFsaWQgc3RhdHVzIGNvZGVcIik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtcbiAgICAgICAgICBzdGF0dXM6IHN0YXR1cyxcbiAgICAgICAgICBoZWFkZXJzOiB7IGxvY2F0aW9uOiB1cmwgfVxuICAgICAgICB9KTtcbiAgICAgIH07XG5cbiAgICAgIHNlbGYuSGVhZGVycyA9IEhlYWRlcnM7XG4gICAgICBzZWxmLlJlcXVlc3QgPSBSZXF1ZXN0O1xuICAgICAgc2VsZi5SZXNwb25zZSA9IFJlc3BvbnNlO1xuXG4gICAgICBzZWxmLmZldGNoID0gZnVuY3Rpb24oaW5wdXQsIGluaXQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFJlcXVlc3QoaW5wdXQsIGluaXQpO1xuICAgICAgICAgIHZhciB4aHIgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zOiB7XG4gICAgICAgICAgICAgIHN0YXR1czogYW55O1xuICAgICAgICAgICAgICBzdGF0dXNUZXh0OiBhbnk7XG4gICAgICAgICAgICAgIGhlYWRlcnM6IGFueTtcbiAgICAgICAgICAgICAgdXJsPzogYW55O1xuICAgICAgICAgICAgfSA9IHtcbiAgICAgICAgICAgICAgc3RhdHVzOiB4aHIuc3RhdHVzLFxuICAgICAgICAgICAgICBzdGF0dXNUZXh0OiB4aHIuc3RhdHVzVGV4dCxcbiAgICAgICAgICAgICAgaGVhZGVyczogcGFyc2VIZWFkZXJzKHhoci5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSB8fCBcIlwiKVxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIG9wdGlvbnMudXJsID1cbiAgICAgICAgICAgICAgXCJyZXNwb25zZVVSTFwiIGluIHhoclxuICAgICAgICAgICAgICAgID8geGhyLnJlc3BvbnNlVVJMXG4gICAgICAgICAgICAgICAgOiBvcHRpb25zLmhlYWRlcnMuZ2V0KFwiWC1SZXF1ZXN0LVVSTFwiKTtcbiAgICAgICAgICAgIHZhciBib2R5ID0gXCJyZXNwb25zZVwiIGluIHhociA/IHhoci5yZXNwb25zZSA6IHhoci5yZXNwb25zZVRleHQ7XG4gICAgICAgICAgICByZXNvbHZlKG5ldyBSZXNwb25zZShib2R5LCBvcHRpb25zKSk7XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIHhoci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcihcIk5ldHdvcmsgcmVxdWVzdCBmYWlsZWRcIikpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB4aHIub250aW1lb3V0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcihcIk5ldHdvcmsgcmVxdWVzdCBmYWlsZWRcIikpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB4aHIub3BlbihyZXF1ZXN0Lm1ldGhvZCwgcmVxdWVzdC51cmwsIHRydWUpO1xuXG4gICAgICAgICAgaWYgKHJlcXVlc3QuY3JlZGVudGlhbHMgPT09IFwiaW5jbHVkZVwiKSB7XG4gICAgICAgICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoXCJyZXNwb25zZVR5cGVcIiBpbiB4aHIgJiYgc3VwcG9ydC5ibG9iKSB7XG4gICAgICAgICAgICB4aHIucmVzcG9uc2VUeXBlID0gXCJibG9iXCI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgcmVxdWVzdC5oZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHhoci5zZW5kKFxuICAgICAgICAgICAgdHlwZW9mIHJlcXVlc3QuX2JvZHlJbml0ID09PSBcInVuZGVmaW5lZFwiID8gbnVsbCA6IHJlcXVlc3QuX2JvZHlJbml0XG4gICAgICAgICAgKTtcbiAgICAgICAgfSk7XG4gICAgICB9O1xuICAgICAgc2VsZi5mZXRjaC5wb2x5ZmlsbCA9IHRydWU7XG4gICAgfSkodHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdGhpcyk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgZmV0Y2g6IHNlbGYuZmV0Y2gsXG4gICAgICBIZWFkZXJzOiBzZWxmLkhlYWRlcnMsXG4gICAgICBSZXF1ZXN0OiBzZWxmLlJlcXVlc3QsXG4gICAgICBSZXNwb25zZTogc2VsZi5SZXNwb25zZVxuICAgIH07XG4gIH0pKCk7XG59O1xuXG5leHBvcnQgZGVmYXVsdCBmZXRjaFBvbnlmaWxsO1xuIiwiaW1wb3J0IGZldGNoUG9ueWZpbGwgZnJvbSBcIi4uL3ZlbmRvci9mZXRjaFBvbnlmaWxsXCI7XG5cbnR5cGUgUmVxdWVzdEluaXRpYWxpemF0aW9uT2JqZWN0ID0ge1xuICBlbmRwb2ludD86IHN0cmluZztcbiAgb3B0aW9ucz86IFJlcXVlc3RJbml0O1xuICBib2R5PzogRm9ybURhdGE7XG59O1xuXG5jbGFzcyBSZXF1ZXN0IHtcbiAgLy8gUHJvcGVydHkgdHlwZXNcbiAgZW5kcG9pbnQ6IHN0cmluZztcbiAgb3B0aW9uczogUmVxdWVzdEluaXQ7XG4gIGJvZHk6IEZvcm1EYXRhO1xuXG4gIC8vIFN0YXRpYyBwcm9wZXJ0aWVzXG4gIC8qKlxuICAgKiBAc3RhdGljXG4gICAqIEBtZW1iZXIge29iamVjdH0gUmVxdWVzdC5kZWZhdWx0T3B0aW9ucyBPcHRpb25zIG9iamVjdCB0byBmYWxsYmFjayB0byBpZlxuICAgKiBubyBvcHRpb25zIHByb3BlcnR5IGlzIHBhc3NlZCBpbnRvIHRoZSBjb25zdHJ1Y3RvciBjb25maWcgb2JqZWN0LlxuICAgKi9cbiAgc3RhdGljIGRlZmF1bHRPcHRpb25zOiBSZXF1ZXN0SW5pdCA9IHtcbiAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgaGVhZGVyczogeyBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiIH1cbiAgfTtcblxuICAvLyBDb25zdHJ1Y3RvclxuICAvKipcbiAgICogQGNsYXNzIFJlcXVlc3RcbiAgICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZ1xuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmVuZHBvaW50XG4gICAqIEBwYXJhbSB7b2JqZWN0fSBbY29uZmlnLm9wdGlvbnNdXG4gICAqIEBwYXJhbSB7Rm9ybURhdGF9IFtjb25maWcuYm9keV1cbiAgICovXG4gIGNvbnN0cnVjdG9yKHsgZW5kcG9pbnQsIG9wdGlvbnMsIGJvZHkgfTogUmVxdWVzdEluaXRpYWxpemF0aW9uT2JqZWN0KSB7XG4gICAgdGhpcy5lbmRwb2ludCA9IGVuZHBvaW50O1xuICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnMgfHwgUmVxdWVzdC5kZWZhdWx0T3B0aW9ucztcbiAgICB0aGlzLmJvZHkgPSBib2R5O1xuICB9XG4gIC8vIFByaXZhdGUgbWV0aG9kc1xuICAvKipcbiAgICogQHByaXZhdGVcbiAgICogQGZ1bmN0aW9uIFJlcXVlc3QucHJlcGFyZUZldGNoT3B0aW9uc1xuICAgKiBAZGVzY3JpcHRpb24gQ3JlYXRlcyBibGFuayBGb3JtRGF0YSBvYmplY3QgaWYgdGhpcy5ib2R5IGlzIHVuZGVmaW5lZCBhbmRcbiAgICogdGhpcy5vcHRpb25zLm1ldGhvZCBpcyBlcXVhbCB0byBcIlBPU1RcIi5cbiAgICogQHJldHVybnMge0Zvcm1EYXRhfVxuICAgKi9cbiAgcHJpdmF0ZSBwcmVwYXJlRmV0Y2hPcHRpb25zID0gKCkgPT4ge1xuICAgIGlmICghdGhpcy5ib2R5ICYmIHRoaXMub3B0aW9ucy5tZXRob2QgPT09IFwiUE9TVFwiKSB7XG4gICAgICB0aGlzLmJvZHkgPSBuZXcgRm9ybURhdGEoKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuYm9keTtcbiAgfTtcbiAgLy8gUHVibGljIG1ldGhvZHNcbiAgLyoqXG4gICAqIEBwdWJsaWNcbiAgICogQGZ1bmN0aW9uIFJlcXVlc3Quc2VuZFxuICAgKiBAcGFyYW1cdHtvYmplY3R9IG9wdGlvbnNcbiAgICogQHBhcmFtIHtib29sZWFufSBbb3B0aW9ucy5hc3luY10gQWxsb3dzIHByb3BlcnR5IGBhc3luY2AgdG8gYmUgc2V0IHRvIGluZGljYXRlIHRoZVxuICAgKiByZXNwb25zZSBzaG91bGQgYmUgcHJlcGFyZWQgYmVmb3JlIHJldHVybmluZy5cbiAgICogQHJldHVybnMge1Byb21pc2V9XG4gICAqL1xuICBwdWJsaWMgc2VuZCA9ICh7IGFzeW5jIH06IHsgYXN5bmM6IGJvb2xlYW4gfSA9IHsgYXN5bmM6IGZhbHNlIH0pID0+IHtcbiAgICBjb25zdCB7IGZldGNoIH0gPSB3aW5kb3dcbiAgICAgID8gd2luZG93LmZldGNoID8gd2luZG93IDogZmV0Y2hQb255ZmlsbCh7fSkuZmV0Y2hcbiAgICAgIDoge1xuICAgICAgICAgIGZldGNoOiAoKSA9PiB7XG4gICAgICAgICAgICBjb25zb2xlLndhcm4oXCJmZXRjaCBpcyBub3Qgc3VwcG9ydGVkXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICBjb25zdCBwcmVwYXJlZE9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFxuICAgICAge30sXG4gICAgICB0aGlzLnByZXBhcmVGZXRjaE9wdGlvbnMoKSxcbiAgICAgIHRoaXMub3B0aW9uc1xuICAgICk7XG4gICAgY29uc3QgaW5pdEZldGNoID0gZmV0Y2godGhpcy5lbmRwb2ludCwgcHJlcGFyZWRPcHRpb25zKTtcbiAgICByZXR1cm4gYXN5bmMgPyBpbml0RmV0Y2gudGhlbihyZXMgPT4gcmVzLmpzb24oKSkgOiBpbml0RmV0Y2g7XG4gIH07XG59XG5cbmV4cG9ydCBkZWZhdWx0IFJlcXVlc3Q7XG4iLCIvKipcbiAqIEBtb2R1bGUgZGF0YU1hbmlwdWxhdGlvblxuICovXG5cbnR5cGUgYWxwaGFudW1lcmljID0gc3RyaW5nIHwgbnVtYmVyO1xudHlwZSBhcnJheUxpa2UgPSBzdHJpbmcgfCBhbHBoYW51bWVyaWNbXTtcblxuLyoqXG4gKiBAZnVuY3Rpb24gc2VhcmNoUHJvcFBhdGhcbiAqIEBkZXNjcmlwdGlvbiBSZWN1cnNpdmVseSBzZWFyY2hzIHRocm91Z2ggYSBkYXRhIG9iamVjdDsgdGhyb3dzIGFuIGVycm9yIGlmIHRoZSByZXN1bHRpbmcgdmFsdWUgb2YgYSBzZWFyY2hlZCBwYXRoIGlzIHVuZGVmaW5lZC5cbiAqIEBwYXJhbSB7YWxwaGFudW1lcmljW119IHBhdGggQXJyYXkgb2Yga2V5cyBpbiB0aGUgb3JkZXIgb2Ygd2hpY2ggd2lsbCBiZSB1c2VkIHRvIHJlY3Vyc2l2ZWx5IHNlYXJjaCBhbiBvYmplY3RcbiAqIEBwYXJhbSB7b2JqZWN0fSBjb2xsZWN0aW9uIERhdGEgb2JqZWN0XG4gKiBAcGFyYW0ge3N0cmluZ30gW2RlbGltaXRlcl0gRGVsaW1pdGVyIGJ5IHdoaWNoIHRvIHNwbGl0IHRoZSBwYXRoOyBkZWZhdWx0cyB0byAnLidcbiAqIEByZXR1cm4ge2FueX0gVmFsdWUgYXQgdGhlIGVuZCBvZiB0aGUgc2VhcmNoZWQgcHJvcGVydHkgcGF0aDtcbiAqL1xuY29uc3Qgc2VhcmNoUHJvcFBhdGggPSAoXG4gIHBhdGg6IGFycmF5TGlrZSxcbiAgY29sbGVjdGlvbjogb2JqZWN0LFxuICBkZWxpbWl0ZXI6IHN0cmluZyA9IFwiLlwiXG4pOiBhbnkgPT4ge1xuICBjb25zdCBzYWZlUGF0aCA9IHR5cGVvZiBwYXRoID09PSBcInN0cmluZ1wiID8gcGF0aC5zcGxpdChkZWxpbWl0ZXIpIDogcGF0aDtcbiAgbGV0IHBhdGhSZXN1bHQgPSBjb2xsZWN0aW9uO1xuICBzYWZlUGF0aC5mb3JFYWNoKGtleSA9PiB7XG4gICAgcGF0aFJlc3VsdCA9IHBhdGhSZXN1bHRba2V5XTtcbiAgfSk7XG4gIGlmIChwYXRoUmVzdWx0KSByZXR1cm4gcGF0aFJlc3VsdDtcbiAgdGhyb3cgbmV3IEVycm9yKFxuICAgIGBwYXRoUmVzdWx0IHlpZWxkcyB1bmRlZmluZWQgdmFsdWUgd2hlbiBzZWFyY2hpbmcgJHtzYWZlUGF0aC5qb2luKFxuICAgICAgZGVsaW1pdGVyXG4gICAgKX0gb24gY29sbGVjdGlvbiBhcmd1bWVudC5gXG4gICk7XG59O1xuXG5leHBvcnQgeyBzZWFyY2hQcm9wUGF0aCB9O1xuIiwiLyoqXG4gKiBAbW9kdWxlIHBhcnNlXG4gKi9cblxuLyoqXG4gKiBCYXNlIGZyb20gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vZ2VvZmZkYXZpczkyLzFkYTdkMDc0NWUzYmJhMDM2Zjk0XG4gKiBAZnVuY3Rpb24gcGFyYW1zXG4gKiBAZGVzY3JpcHRpb24gQ3JlYXRlcyBvYmplY3Qgb2Yga2V5L3ZhbHVlIHBhaXJzIGZyb20gVVJMIHBhcmFtZXRlcnMuXG4gKiBAcGFyYW0ge3N0cmluZ30gW3VybF0gVVJMIHRvIHBhcnNlOyBkZWZhdWx0cyB0byB3aW5kb3cubG9jYXRpb24uc2VhcmNoLlxuICogQHJldHVybiB7b2JqZWN0fSBPYmplY3Qgb2Yga2V5L3ZhbHVlIHBhaXJzLlxuICovXG5jb25zdCBwYXJhbXMgPSAodXJsOiBzdHJpbmcgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoKTogb2JqZWN0ID0+XG4gIHVybFxuICAgIC5zcGxpdChcIj9cIilbMV1cbiAgICAuc3BsaXQoXCImXCIpXG4gICAgLm1hcChxID0+IHEuc3BsaXQoXCI9XCIpKVxuICAgIC5yZWR1Y2UoKGFjYywgW2tleSwgdmFsXSwgaSwgYXJyKSA9PiB7XG4gICAgICBhY2Nba2V5XSA9IGRlY29kZVVSSUNvbXBvbmVudCh2YWwpLnJlcGxhY2UoL1xcKy9nLCBcIiBcIik7XG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0sIHt9KTtcblxuLyoqXG4gKiBAZnVuY3Rpb24gcGFyc2VFeHRlcm5hbE1hcmtkb3duTGlua3NcbiAqIEBkZXNjcmlwdGlvbiBUcmFuc2Zvcm1zIE1hcmtkb3duIGxpbmtzIHRvIHVzZSB0YXJnZXQ9XCJfYmxhbmtcIiwgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiO1xuICogdXN1YWxseSB1c2VkIHdoZW4gaW1wbGVtZW50aW5nIGNsaWVudHNpZGUgTWFya2Rvd24sIGJlZm9yZSBzZW5kaW5nIHRoZSBNYXJrZG93biB0byB0aGUgbWFpblxuICogcGFyc2luZyBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgU3RyaW5nIHRvIHBhcnNlIGFzIE1hcmtkb3duIGxpbmsuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBIVE1MIGxpbmsgd2l0aCBVUkwgYW5kIGlubmVyVGV4dCwgdGFyZ2V0IGFuZCByZWwgYXR0cmlidXRlcyBwcm9wZXJseSBzZXQgZm9yXG4gKiBhbiBleHRlcm5hbCBsaW5rLlxuICovXG5jb25zdCBwYXJzZUV4dGVybmFsTWFya2Rvd25MaW5rcyA9IChzdHJpbmc6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gIGNvbnN0IHBhdHRlcm46IFJlZ0V4cCA9IC9cXFsoW15cXF1dKylcXF1cXCgoW14pXSspXFwpL2c7XG4gIGlmIChzdHJpbmcuc2VhcmNoKHBhdHRlcm4pID4gLTEpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoXG4gICAgICBwYXR0ZXJuLFxuICAgICAgJzxhIGhyZWY9XCIkMlwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj4kMTwvYT4nXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyaW5nO1xuICB9XG59O1xuXG5leHBvcnQgeyBwYXJhbXMgYXMgcGFyc2VVUkxQYXJhbXMsIHBhcnNlRXh0ZXJuYWxNYXJrZG93bkxpbmtzIH07XG4iLCIvKipcbiAqIEBtb2R1bGUgc2Nyb2xsXG4gKi9cblxuLyoqXG4gKiBAZnVuY3Rpb24gaXNFbGVtZW50SW5WaWV3cG9ydFxuICogQGRlc2NyaXB0aW9uIERldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50IGlzIHBhcnRpYWxseSBvclxuICogZnVsbHkgdmlzaWJsZSBpbiB0aGUgdmlld3BvcnQuXG4gKiBAcGFyYW0ge29iamVjdH0gY29uZmlnXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGNvbmZpZy5lbGVtZW50IEhUTUwgRWxlbWVudCBub2RlIHRvIHRhcmdldC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnRocmVzaG9sZF0gUmF0aW8gb2YgdGhlIHZpZXdwb3J0IGhlaWdodCB0aGUgZWxlbWVudFxuICogbXVzdCBmaWxsIGJlZm9yZSBiZWluZyBjb25zaWRlcmVkIHZpc2libGUuIEUuZy4gMC41IG1lYW5zIHRoZSBlbGVtZW50XG4gKiBtdXN0IHRha2UgdXAgNTAlIG9mIHRoZSBzY3JlZW4gYmVmb3JlIHJldHVybmluZyB0cnVlLiBEZWZhdWx0cyB0byAwLjI1LlxuICogT25seSB1c2VkIGZvciBlbGVtZW50cyB0YWxsZXIgdGhhbiB0aGUgdmlld3BvcnQuXG4gKiBAcmV0dXJuIHtib29sZWFufSBCb29sZWFuIGRlc2NyaWJpbmcgaWYgaW5wdXQgaXMgZnVsbHkvcGFydGlhbGx5XG4gKiBpbiB0aGUgdmlld3BvcnQsIHJlbGF0aXZlIHRvIHRoZSB0aHJlc2hvbGQgc2V0dGluZy5cbiAqL1xuZnVuY3Rpb24gaXNFbGVtZW50SW5WaWV3cG9ydCh7XG4gIGVsZW1lbnQ6IGFyZ0VsZW1lbnQsXG4gIHRocmVzaG9sZDogYXJnVGhyZXNob2xkXG59OiB7XG4gIGVsZW1lbnQ6IEVsZW1lbnQ7XG4gIHRocmVzaG9sZDogbnVtYmVyO1xufSk6IGJvb2xlYW4ge1xuICBjb25zdCBkZWZhdWx0UGFyYW1zOiB7XG4gICAgdGhyZXNob2xkOiBudW1iZXI7XG4gIH0gPSB7XG4gICAgdGhyZXNob2xkOiAwLjI1XG4gIH07XG5cbiAgY29uc3Qgc2FmZUFyZ3MgPSB7XG4gICAgdGhyZXNob2xkOiBhcmdUaHJlc2hvbGQgfHwgZGVmYXVsdFBhcmFtcy50aHJlc2hvbGRcbiAgfTtcblxuICBjb25zdCByZWN0OiBDbGllbnRSZWN0IHwgRE9NUmVjdCA9IGFyZ0VsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgY29uc3Qgdmlld3BvcnRIZWlnaHQ6IG51bWJlciA9IE1hdGgubWF4KFxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQsXG4gICAgd2luZG93LmlubmVySGVpZ2h0IHx8IDBcbiAgKTtcbiAgY29uc3QgeyB0aHJlc2hvbGQgfSA9IHNhZmVBcmdzO1xuXG4gIGlmICh0aHJlc2hvbGQgPCAwIHx8IHRocmVzaG9sZCA+IDEpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcbiAgICAgIFwiVGhyZXNob2xkIGFyZ3VtZW50IG11c3QgYmUgYSBkZWNpbWFsIGJldHdlZW4gMCBhbmQgMVwiXG4gICAgKTtcbiAgfVxuXG4gIC8vSWYgdGhlIGVsZW1lbnQgaXMgdG9vIHRhbGwgdG8gZml0IHdpdGhpbiB0aGUgdmlld3BvcnRcbiAgaWYgKHJlY3QuaGVpZ2h0ID49IHRocmVzaG9sZCAqIHZpZXdwb3J0SGVpZ2h0KSB7XG4gICAgaWYgKFxuICAgICAgcmVjdC50b3AgLSB2aWV3cG9ydEhlaWdodCA8PSB0aHJlc2hvbGQgKiB2aWV3cG9ydEhlaWdodCAqIC0xICYmXG4gICAgICByZWN0LmJvdHRvbSA+PSB0aHJlc2hvbGQgKiB2aWV3cG9ydEhlaWdodFxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy9JZiB0aGUgZWxlbWVudCBpcyBzaG9ydCBlbm91Z2ggdG8gZml0IHdpdGhpbiB0aGUgdmlld3BvcnRcbiAgICBpZiAocmVjdC50b3AgPj0gMCAmJiByZWN0LmJvdHRvbSAtIHZpZXdwb3J0SGVpZ2h0IDw9IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRnJvbSBodHRwOi8vYml0Lmx5LzJjUDY1ZkRcbiAqIEB0b2RvIENsYXNzaWZ5IGFuZCBkZXNjcmliZSBwYXJhbXMuXG4gKiBAZnVuY3Rpb24gc2Nyb2xsVG9cbiAqIEBkZXNjcmlwdGlvbiBTY3JvbGxzIGdpdmVuIGVsZW1lbnQgdG8gZGV0ZXJtaW5lZCBwb2ludC5cbiAqIEBwYXJhbSAge0VsZW1lbnR9IGVsZW1lbnQgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge251bWJlcn0gdG8gICAgICAgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7bnVtYmVyfSBkdXJhdGlvbiBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBzY3JvbGxUbyhlbGVtZW50OiBFbGVtZW50LCB0bzogbnVtYmVyLCBkdXJhdGlvbjogbnVtYmVyKTogdm9pZCB7XG4gIGlmIChkdXJhdGlvbiA8PSAwKSByZXR1cm47XG4gIGNvbnN0IGRpZmZlcmVuY2U6IG51bWJlciA9IHRvIC0gZWxlbWVudC5zY3JvbGxUb3A7XG4gIGNvbnN0IHBlclRpY2s6IG51bWJlciA9IGRpZmZlcmVuY2UgLyBkdXJhdGlvbiAqIDEwO1xuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgZWxlbWVudC5zY3JvbGxUb3AgPSBlbGVtZW50LnNjcm9sbFRvcCArIHBlclRpY2s7XG4gICAgaWYgKGVsZW1lbnQuc2Nyb2xsVG9wID09PSB0bykgcmV0dXJuO1xuICAgIHNjcm9sbFRvKGVsZW1lbnQsIHRvLCBkdXJhdGlvbiAtIDEwKTtcbiAgfSwgMTApO1xufVxuXG5leHBvcnQgeyBpc0VsZW1lbnRJblZpZXdwb3J0LCBzY3JvbGxUbyB9O1xuIiwiLyoqXG4gKiBAbW9kdWxlIHNlbGVjdFxuICovXG5cbi8qKlxuICogQGZ1bmN0aW9uIHNlbGVjdFxuICogQGRlc2NyaXB0aW9uIFNlbGVjdHMgYSBET00gbm9kZSBiYXNlZCBvbiBhIHF1ZXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IHF1ZXJ5IHNlbGVjdG9yIHRvIHVzZSB0byBxdWVyeSBhbiBub2RlLlxuICogQHJldHVybnMge0VsZW1lbnR9IEZpcnN0IERPTSBub2RlIHRoYXQgbWF0Y2hlcyB0aGUgcXVlcnkuXG4gKi9cbmNvbnN0IHNlbGVjdDogRnVuY3Rpb24gPSAocXVlcnk6IHN0cmluZyk6IEVsZW1lbnQgPT5cbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihxdWVyeSk7XG5cbi8qKlxuICogQGZ1bmN0aW9uIHNlbGVjdEFsbFxuICogQGRlc2NyaXB0aW9uIFNlbGVjdHMgYSBET00gbm9kZWxpc3QgYmFzZWQgb24gYSBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBxdWVyeSBxdWVyeSBzZWxlY3RvciB0byB1c2UgdG8gcXVlcnkgYSBub2RlbGlzdC5cbiAqIEByZXR1cm5zIHtFbGVtZW50W119IEFycmF5IG9mIERPTSBub2RlcyB0aGF0IG1hdGNoIHRoZSBxdWVyeS5cbiAqL1xuY29uc3Qgc2VsZWN0QWxsOiBGdW5jdGlvbiA9IChxdWVyeTogc3RyaW5nKTogRWxlbWVudFtdID0+IFtcbiAgLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxdWVyeSlcbl07XG5cbi8qKlxuICogQGZ1bmN0aW9uIHNlbGVjdEJ5SWRcbiAqIEBkZXNjcmlwdGlvbiBTZWxlY3RzIGEgRE9NIG5vZGUgYmFzZWQgb24gYW4gSUQgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IGlkIElEIG9mIERPTSBub2RlIHRvIHNlbGVjdC5cbiAqIEByZXR1cm5zIHtFbGVtZW50fSBET00gbm9kZSB3aXRoIG1hdGNoZWQgSUQuXG4gKi9cbmNvbnN0IHNlbGVjdEJ5SWQ6IEZ1bmN0aW9uID0gKGlkOiBzdHJpbmcpOiBFbGVtZW50ID0+XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcblxuZXhwb3J0IHsgc2VsZWN0LCBzZWxlY3RBbGwsIHNlbGVjdEJ5SWQgfTtcbiIsIi8qKlxuICogQG1vZHVsZSB0eXBvZ3JhcGh5XG4gKi9cblxuLyoqXG4gKiBAZnVuY3Rpb24gY2FwaXRhbGl6ZVxuICogQGRlc2NyaXB0aW9uIENhcGl0YWxpemVzIGFsbCB3b3JkcyBpbiBhIHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGV4dCB0byBjYXBpdGFsaXplLlxuICogQHJldHVybnMge3N0cmluZ30gVGl0bGUtY2FzZWQgdGV4dC5cbiAqL1xuY29uc3QgY2FwaXRhbGl6ZSA9IChzdHJpbmc6IHN0cmluZyk6IHN0cmluZyA9PlxuICBzdHJpbmdcbiAgICAuc3BsaXQoXCIgXCIpXG4gICAgLm1hcChzID0+IHVjRmlyc3QocykpXG4gICAgLmpvaW4oXCIgXCIpO1xuXG4vKipcbiAqIEBmdW5jdGlvbiBzbHVnaWZ5XG4gKiBAZGVzY3JpcHRpb24gTG93ZXJjYXNlcyBzdHJpbmcsIHJlcGxhY2VzIHNwYWNlcyBhbmQgc3BlY2lhbCBjaGFyYWN0ZXJzXG4gKiB3aXRoIGEgc2V0IGRlbGltaXRlci5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0VG9TbHVnIFRleHQgdG8gc2x1Z2lmeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbZGVsaW1pdGVyXSBEZWxpbWl0ZXI7IGRlZmF1bHRzIHRvIFwiLVwiLlxuICogQHJldHVybnMge3N0cmluZ30gU2x1Z2lmaWVkIHRleHQuXG4gKi9cbmNvbnN0IHNsdWdpZnkgPSAodGV4dFRvU2x1Zzogc3RyaW5nLCBkZWxpbWl0ZXI6IHN0cmluZyA9IFwiLVwiKTogc3RyaW5nID0+XG4gIHRleHRUb1NsdWdcbiAgICAucmVwbGFjZSgvKFxcIXwjfFxcJHwlfFxcKnxcXC58XFwvfFxcXFx8XFwofFxcKXxcXCt8XFx8fFxcLHxcXDp8XFwnfFxcXCIpL2csIFwiXCIpXG4gICAgLnJlcGxhY2UoLyguKShcXHN8XFxffFxcLSkrKC4pL2csIGAkMSR7ZGVsaW1pdGVyfSQzYClcbiAgICAudG9Mb3dlckNhc2UoKTtcblxuLyoqXG4gKiBAZnVuY3Rpb24gdHJpbVxuICogQGRlc2NyaXB0aW9uIFRyaW1zIHdoaXRlc3BhY2Ugb24gZWl0aGVyIGVuZCBvZiBhIHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGV4dCB0byB0cmltLlxuICogQHJldHVybnMge3N0cmluZ30gVHJpbW1lZCB0ZXh0LlxuICovXG5jb25zdCB0cmltID0gKHN0cmluZzogc3RyaW5nKTogc3RyaW5nID0+IHN0cmluZy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCBcIlwiKTtcblxuLyoqXG4gKiBAZnVuY3Rpb24gdWNGaXJzdFxuICogQGRlc2NyaXB0aW9uIENhcGl0YWxpemVzIGZpcnN0IHdvcmQgaW4gYSBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRleHQgdG8gY2FwaXRhbGl6ZS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IENhcGl0YWxpemVkIHRleHQuXG4gKi9cbmNvbnN0IHVjRmlyc3QgPSAoW2ZpcnN0TGV0dGVyLCAuLi5yZXN0TGV0dGVyc106IHN0cmluZyk6IHN0cmluZyA9PlxuICBgJHtmaXJzdExldHRlci50b1VwcGVyQ2FzZSgpfSR7cmVzdExldHRlcnMuam9pbihcIlwiKX1gO1xuXG5leHBvcnQgeyBjYXBpdGFsaXplLCBzbHVnaWZ5LCB0cmltLCB1Y0ZpcnN0IH07XG4iXSwibmFtZXMiOlsiZmV0Y2hQb255ZmlsbCIsIm9wdGlvbnMiLCJ3aW5kb3ciLCJzZWxmIiwiZ2xvYmFsIiwiUHJvbWlzZSIsIlhNTEh0dHBSZXF1ZXN0IiwiT2JqZWN0IiwiY3JlYXRlIiwidW5kZWZpbmVkIiwiZmV0Y2giLCJzdXBwb3J0IiwiU3ltYm9sIiwiQmxvYiIsImUiLCJhcnJheUJ1ZmZlciIsInZpZXdDbGFzc2VzIiwiaXNEYXRhVmlldyIsIm9iaiIsIkRhdGFWaWV3IiwicHJvdG90eXBlIiwiaXNQcm90b3R5cGVPZiIsImlzQXJyYXlCdWZmZXJWaWV3IiwiQXJyYXlCdWZmZXIiLCJpc1ZpZXciLCJpbmRleE9mIiwidG9TdHJpbmciLCJjYWxsIiwibmFtZSIsIlN0cmluZyIsInRlc3QiLCJUeXBlRXJyb3IiLCJ0b0xvd2VyQ2FzZSIsInZhbHVlIiwiaXRlbXMiLCJpdGVyYXRvciIsInNoaWZ0IiwiZG9uZSIsIml0ZXJhYmxlIiwiaGVhZGVycyIsIm1hcCIsIkhlYWRlcnMiLCJmb3JFYWNoIiwiYXBwZW5kIiwiQXJyYXkiLCJpc0FycmF5IiwiaGVhZGVyIiwiZ2V0T3duUHJvcGVydHlOYW1lcyIsIm5vcm1hbGl6ZU5hbWUiLCJub3JtYWxpemVWYWx1ZSIsIm9sZFZhbHVlIiwiZ2V0IiwiaGFzIiwiaGFzT3duUHJvcGVydHkiLCJzZXQiLCJjYWxsYmFjayIsInRoaXNBcmciLCJrZXlzIiwicHVzaCIsIml0ZXJhdG9yRm9yIiwidmFsdWVzIiwiZW50cmllcyIsImJvZHkiLCJib2R5VXNlZCIsInJlamVjdCIsInJlYWRlciIsInJlc29sdmUiLCJvbmxvYWQiLCJyZXN1bHQiLCJvbmVycm9yIiwiZXJyb3IiLCJibG9iIiwiRmlsZVJlYWRlciIsInByb21pc2UiLCJmaWxlUmVhZGVyUmVhZHkiLCJyZWFkQXNBcnJheUJ1ZmZlciIsInJlYWRBc1RleHQiLCJidWYiLCJ2aWV3IiwiVWludDhBcnJheSIsImNoYXJzIiwibGVuZ3RoIiwiaSIsImZyb21DaGFyQ29kZSIsImpvaW4iLCJzbGljZSIsImJ5dGVMZW5ndGgiLCJidWZmZXIiLCJfaW5pdEJvZHkiLCJfYm9keUluaXQiLCJfYm9keVRleHQiLCJfYm9keUJsb2IiLCJmb3JtRGF0YSIsIkZvcm1EYXRhIiwiX2JvZHlGb3JtRGF0YSIsInNlYXJjaFBhcmFtcyIsIlVSTFNlYXJjaFBhcmFtcyIsIl9ib2R5QXJyYXlCdWZmZXIiLCJidWZmZXJDbG9uZSIsIkVycm9yIiwidHlwZSIsInJlamVjdGVkIiwiY29uc3VtZWQiLCJ0aGVuIiwicmVhZEJsb2JBc0FycmF5QnVmZmVyIiwidGV4dCIsInJlYWRCbG9iQXNUZXh0IiwicmVhZEFycmF5QnVmZmVyQXNUZXh0IiwiZGVjb2RlIiwianNvbiIsIkpTT04iLCJwYXJzZSIsIm1ldGhvZHMiLCJtZXRob2QiLCJ1cGNhc2VkIiwidG9VcHBlckNhc2UiLCJpbnB1dCIsIlJlcXVlc3QiLCJ1cmwiLCJjcmVkZW50aWFscyIsIm1vZGUiLCJub3JtYWxpemVNZXRob2QiLCJyZWZlcnJlciIsImNsb25lIiwiZm9ybSIsInRyaW0iLCJzcGxpdCIsImJ5dGVzIiwicmVwbGFjZSIsImRlY29kZVVSSUNvbXBvbmVudCIsInJhd0hlYWRlcnMiLCJsaW5lIiwicGFydHMiLCJrZXkiLCJSZXNwb25zZSIsImJvZHlJbml0Iiwic3RhdHVzIiwib2siLCJzdGF0dXNUZXh0IiwicmVzcG9uc2UiLCJyZWRpcmVjdFN0YXR1c2VzIiwicmVkaXJlY3QiLCJSYW5nZUVycm9yIiwibG9jYXRpb24iLCJpbml0IiwicmVxdWVzdCIsInhociIsInBhcnNlSGVhZGVycyIsImdldEFsbFJlc3BvbnNlSGVhZGVycyIsInJlc3BvbnNlVVJMIiwicmVzcG9uc2VUZXh0Iiwib250aW1lb3V0Iiwib3BlbiIsIndpdGhDcmVkZW50aWFscyIsInJlc3BvbnNlVHlwZSIsInNldFJlcXVlc3RIZWFkZXIiLCJzZW5kIiwicG9seWZpbGwiLCJlbmRwb2ludCIsImFzeW5jIiwid2FybiIsInByZXBhcmVkT3B0aW9ucyIsInByZXBhcmVGZXRjaE9wdGlvbnMiLCJpbml0RmV0Y2giLCJyZXMiLCJkZWZhdWx0T3B0aW9ucyIsIkFjY2VwdCIsInNlYXJjaFByb3BQYXRoIiwicGF0aCIsImNvbGxlY3Rpb24iLCJkZWxpbWl0ZXIiLCJzYWZlUGF0aCIsInBhdGhSZXN1bHQiLCJwYXJhbXMiLCJzZWFyY2giLCJxIiwicmVkdWNlIiwiYWNjIiwiYXJyIiwidmFsIiwicGFyc2VFeHRlcm5hbE1hcmtkb3duTGlua3MiLCJzdHJpbmciLCJwYXR0ZXJuIiwiYXJnRWxlbWVudCIsImVsZW1lbnQiLCJhcmdUaHJlc2hvbGQiLCJ0aHJlc2hvbGQiLCJkZWZhdWx0UGFyYW1zIiwic2FmZUFyZ3MiLCJyZWN0IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0Iiwidmlld3BvcnRIZWlnaHQiLCJNYXRoIiwibWF4IiwiZG9jdW1lbnQiLCJkb2N1bWVudEVsZW1lbnQiLCJjbGllbnRIZWlnaHQiLCJpbm5lckhlaWdodCIsImhlaWdodCIsInRvcCIsImJvdHRvbSIsInRvIiwiZHVyYXRpb24iLCJkaWZmZXJlbmNlIiwic2Nyb2xsVG9wIiwicGVyVGljayIsInNlbGVjdCIsInF1ZXJ5IiwicXVlcnlTZWxlY3RvciIsInNlbGVjdEFsbCIsInF1ZXJ5U2VsZWN0b3JBbGwiLCJzZWxlY3RCeUlkIiwiaWQiLCJnZXRFbGVtZW50QnlJZCIsImNhcGl0YWxpemUiLCJ1Y0ZpcnN0IiwicyIsInNsdWdpZnkiLCJ0ZXh0VG9TbHVnIiwiZmlyc3RMZXR0ZXIiLCJyZXN0TGV0dGVycyJdLCJtYXBwaW5ncyI6Ijs7O0FBQUE7Ozs7Ozs7O0FBUUEsSUFBTUEsZ0JBQWdCLHNCQUFBLENBQXVCQyxPQUF2QjtRQUNoQkMsU0FBU0EsU0FBU0EsTUFBVCxHQUFrQixLQUEvQjtRQUNJQyxPQUFPLE9BQU9BLElBQVAsS0FBZ0IsV0FBaEIsR0FBK0JELFNBQVNBLE1BQVQsR0FBa0JFLE1BQWpELEdBQTJERCxJQUF0RTtRQUNJRSxVQUFXSixXQUFXQSxRQUFRSSxPQUFwQixJQUFnQ0YsS0FBS0UsT0FBbkQ7UUFDSUMsaUJBQ0RMLFdB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
