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

export { Request, capitalize, isElementInViewport, parseExternalMarkdownLinks, params as parseURLParams, scrollTo, searchPropPath, select, selectAll, selectById, slugify, trim, ucFirst };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW0uZXNtLmRldi5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3ZlbmRvci9mZXRjaFBvbnlmaWxsLnRzIiwiLi4vc3JjL2NsYXNzZXMvUmVxdWVzdC50cyIsIi4uL3NyYy9mdW5jdGlvbnMvZGF0YU1hbmlwdWxhdGlvbi50cyIsIi4uL3NyYy9mdW5jdGlvbnMvcGFyc2UudHMiLCIuLi9zcmMvZnVuY3Rpb25zL3Njcm9sbC50cyIsIi4uL3NyYy9mdW5jdGlvbnMvc2VsZWN0LnRzIiwiLi4vc3JjL2Z1bmN0aW9ucy90eXBvZ3JhcGh5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29waWVkIGZyb20gbm9kZV9tb2R1bGVzL2ZldGNoLXBvbnlmaWxsL2J1aWxkL2ZldGNoLWJyb3dzZXIuanMuXG4gKlxuICogVHlwZXMgYWRkZWQgd2hlcmUgbmVjZXNzYXJ5LlxuICpcbiAqIE1vdmVkIG91dCBvZiBJSUZFIG1vZHVsZSB0eXBlLCBwbGFjZWQgYHNlbGZgIGRlY2xhcmF0aW9uIHRvIHRvcFxuICogb2YgYGZldGNoUG9ueWZpbGxgIGZ1bmN0aW9uIHNjb3BlLlxuICovXG5jb25zdCBmZXRjaFBvbnlmaWxsID0gZnVuY3Rpb24gZmV0Y2hQb255ZmlsbChvcHRpb25zKSB7XG4gIHZhciB3aW5kb3cgPSB3aW5kb3cgPyB3aW5kb3cgOiBmYWxzZTtcbiAgdmFyIHNlbGYgPSB0eXBlb2Ygc2VsZiA9PT0gXCJ1bmRlZmluZWRcIiA/ICh3aW5kb3cgPyB3aW5kb3cgOiBnbG9iYWwpIDogc2VsZjtcbiAgdmFyIFByb21pc2UgPSAob3B0aW9ucyAmJiBvcHRpb25zLlByb21pc2UpIHx8IHNlbGYuUHJvbWlzZTtcbiAgdmFyIFhNTEh0dHBSZXF1ZXN0ID1cbiAgICAob3B0aW9ucyAmJiBvcHRpb25zLlhNTEh0dHBSZXF1ZXN0KSB8fCBzZWxmLlhNTEh0dHBSZXF1ZXN0O1xuICB2YXIgZ2xvYmFsID0gc2VsZjtcblxuICByZXR1cm4gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gT2JqZWN0LmNyZWF0ZShnbG9iYWwsIHtcbiAgICAgIGZldGNoOiB7XG4gICAgICAgIHZhbHVlOiB1bmRlZmluZWQsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAoZnVuY3Rpb24oc2VsZikge1xuICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgIGlmIChzZWxmLmZldGNoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIHN1cHBvcnQgPSB7XG4gICAgICAgIHNlYXJjaFBhcmFtczogXCJVUkxTZWFyY2hQYXJhbXNcIiBpbiBzZWxmLFxuICAgICAgICBpdGVyYWJsZTogXCJTeW1ib2xcIiBpbiBzZWxmICYmIFwiaXRlcmF0b3JcIiBpbiBTeW1ib2wsXG4gICAgICAgIGJsb2I6XG4gICAgICAgICAgXCJGaWxlUmVhZGVyXCIgaW4gc2VsZiAmJlxuICAgICAgICAgIFwiQmxvYlwiIGluIHNlbGYgJiZcbiAgICAgICAgICAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBuZXcgQmxvYigpO1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pKCksXG4gICAgICAgIGZvcm1EYXRhOiBcIkZvcm1EYXRhXCIgaW4gc2VsZixcbiAgICAgICAgYXJyYXlCdWZmZXI6IFwiQXJyYXlCdWZmZXJcIiBpbiBzZWxmXG4gICAgICB9O1xuXG4gICAgICBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlcikge1xuICAgICAgICB2YXIgdmlld0NsYXNzZXMgPSBbXG4gICAgICAgICAgXCJbb2JqZWN0IEludDhBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgVWludDhBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgVWludDhDbGFtcGVkQXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IEludDE2QXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IFVpbnQxNkFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBJbnQzMkFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBVaW50MzJBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgRmxvYXQzMkFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBGbG9hdDY0QXJyYXldXCJcbiAgICAgICAgXTtcblxuICAgICAgICB2YXIgaXNEYXRhVmlldyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgIHJldHVybiBvYmogJiYgRGF0YVZpZXcucHJvdG90eXBlLmlzUHJvdG90eXBlT2Yob2JqKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaXNBcnJheUJ1ZmZlclZpZXcgPVxuICAgICAgICAgIEFycmF5QnVmZmVyLmlzVmlldyB8fFxuICAgICAgICAgIGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgb2JqICYmXG4gICAgICAgICAgICAgIHZpZXdDbGFzc2VzLmluZGV4T2YoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikpID4gLTFcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbm9ybWFsaXplTmFtZShuYW1lKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIG5hbWUgPSBTdHJpbmcobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKC9bXmEtejAtOVxcLSMkJSYnKisuXFxeX2B8fl0vaS50ZXN0KG5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgY2hhcmFjdGVyIGluIGhlYWRlciBmaWVsZCBuYW1lXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZVZhbHVlKHZhbHVlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuXG4gICAgICAvLyBCdWlsZCBhIGRlc3RydWN0aXZlIGl0ZXJhdG9yIGZvciB0aGUgdmFsdWUgbGlzdFxuICAgICAgZnVuY3Rpb24gaXRlcmF0b3JGb3IoaXRlbXMpIHtcbiAgICAgICAgdmFyIGl0ZXJhdG9yID0ge1xuICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gaXRlbXMuc2hpZnQoKTtcbiAgICAgICAgICAgIHJldHVybiB7IGRvbmU6IHZhbHVlID09PSB1bmRlZmluZWQsIHZhbHVlOiB2YWx1ZSB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoc3VwcG9ydC5pdGVyYWJsZSkge1xuICAgICAgICAgIGl0ZXJhdG9yW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVyYXRvcjtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBIZWFkZXJzKGhlYWRlcnMpIHtcbiAgICAgICAgdGhpcy5tYXAgPSB7fTtcblxuICAgICAgICBpZiAoaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMpIHtcbiAgICAgICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGhlYWRlcnMpKSB7XG4gICAgICAgICAgaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKGhlYWRlcikge1xuICAgICAgICAgICAgdGhpcy5hcHBlbmQoaGVhZGVyWzBdLCBoZWFkZXJbMV0pO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9IGVsc2UgaWYgKGhlYWRlcnMpIHtcbiAgICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhoZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIGhlYWRlcnNbbmFtZV0pO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpO1xuICAgICAgICB2YWx1ZSA9IG5vcm1hbGl6ZVZhbHVlKHZhbHVlKTtcbiAgICAgICAgdmFyIG9sZFZhbHVlID0gdGhpcy5tYXBbbmFtZV07XG4gICAgICAgIHRoaXMubWFwW25hbWVdID0gb2xkVmFsdWUgPyBvbGRWYWx1ZSArIFwiLFwiICsgdmFsdWUgOiB2YWx1ZTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24obmFtZSkge1xuICAgICAgICBkZWxldGUgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV07XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5oYXMobmFtZSkgPyB0aGlzLm1hcFtuYW1lXSA6IG51bGw7XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShub3JtYWxpemVOYW1lKG5hbWUpKTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldID0gbm9ybWFsaXplVmFsdWUodmFsdWUpO1xuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcy5tYXApIHtcbiAgICAgICAgICBpZiAodGhpcy5tYXAuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdGhpcy5tYXBbbmFtZV0sIG5hbWUsIHRoaXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgICAgaXRlbXMucHVzaChuYW1lKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcyk7XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGl0ZW1zLnB1c2godmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICAgIGl0ZW1zLnB1c2goW25hbWUsIHZhbHVlXSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpO1xuICAgICAgfTtcblxuICAgICAgaWYgKHN1cHBvcnQuaXRlcmFibGUpIHtcbiAgICAgICAgSGVhZGVycy5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXM7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGNvbnN1bWVkKGJvZHkpIHtcbiAgICAgICAgaWYgKGJvZHkuYm9keVVzZWQpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFR5cGVFcnJvcihcIkFscmVhZHkgcmVhZFwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgYm9keS5ib2R5VXNlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVqZWN0KHJlYWRlci5lcnJvcik7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlYWRCbG9iQXNBcnJheUJ1ZmZlcihibG9iKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgcHJvbWlzZSA9IGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpO1xuICAgICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoYmxvYik7XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiByZWFkQmxvYkFzVGV4dChibG9iKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgcHJvbWlzZSA9IGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpO1xuICAgICAgICByZWFkZXIucmVhZEFzVGV4dChibG9iKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlYWRBcnJheUJ1ZmZlckFzVGV4dChidWYpIHtcbiAgICAgICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWYpO1xuICAgICAgICB2YXIgY2hhcnMgPSBuZXcgQXJyYXkodmlldy5sZW5ndGgpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmlldy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNoYXJzW2ldID0gU3RyaW5nLmZyb21DaGFyQ29kZSh2aWV3W2ldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hhcnMuam9pbihcIlwiKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gYnVmZmVyQ2xvbmUoYnVmKSB7XG4gICAgICAgIGlmIChidWYuc2xpY2UpIHtcbiAgICAgICAgICByZXR1cm4gYnVmLnNsaWNlKDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmLmJ5dGVMZW5ndGgpO1xuICAgICAgICAgIHZpZXcuc2V0KG5ldyBVaW50OEFycmF5KGJ1ZikpO1xuICAgICAgICAgIHJldHVybiB2aWV3LmJ1ZmZlcjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBCb2R5KCkge1xuICAgICAgICB0aGlzLmJvZHlVc2VkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5faW5pdEJvZHkgPSBmdW5jdGlvbihib2R5KSB7XG4gICAgICAgICAgdGhpcy5fYm9keUluaXQgPSBib2R5O1xuICAgICAgICAgIGlmICghYm9keSkge1xuICAgICAgICAgICAgdGhpcy5fYm9keVRleHQgPSBcIlwiO1xuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGJvZHkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYmxvYiAmJiBCbG9iLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5QmxvYiA9IGJvZHk7XG4gICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIHN1cHBvcnQuZm9ybURhdGEgJiZcbiAgICAgICAgICAgIEZvcm1EYXRhLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5Rm9ybURhdGEgPSBib2R5O1xuICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJlxuICAgICAgICAgICAgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHkudG9TdHJpbmcoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIgJiYgc3VwcG9ydC5ibG9iICYmIGlzRGF0YVZpZXcoYm9keSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlBcnJheUJ1ZmZlciA9IGJ1ZmZlckNsb25lKGJvZHkuYnVmZmVyKTtcbiAgICAgICAgICAgIC8vIElFIDEwLTExIGNhbid0IGhhbmRsZSBhIERhdGFWaWV3IGJvZHkuXG4gICAgICAgICAgICB0aGlzLl9ib2R5SW5pdCA9IG5ldyBCbG9iKFt0aGlzLl9ib2R5QXJyYXlCdWZmZXJdKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgc3VwcG9ydC5hcnJheUJ1ZmZlciAmJlxuICAgICAgICAgICAgKEFycmF5QnVmZmVyLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpIHx8XG4gICAgICAgICAgICAgIGlzQXJyYXlCdWZmZXJWaWV3KGJvZHkpKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5fYm9keUFycmF5QnVmZmVyID0gYnVmZmVyQ2xvbmUoYm9keSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVuc3VwcG9ydGVkIEJvZHlJbml0IHR5cGVcIik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCF0aGlzLmhlYWRlcnMuZ2V0KFwiY29udGVudC10eXBlXCIpKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGJvZHkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgdGhpcy5oZWFkZXJzLnNldChcImNvbnRlbnQtdHlwZVwiLCBcInRleHQvcGxhaW47Y2hhcnNldD1VVEYtOFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUJsb2IgJiYgdGhpcy5fYm9keUJsb2IudHlwZSkge1xuICAgICAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KFwiY29udGVudC10eXBlXCIsIHRoaXMuX2JvZHlCbG9iLnR5cGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiZcbiAgICAgICAgICAgICAgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5oZWFkZXJzLnNldChcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiLFxuICAgICAgICAgICAgICAgIFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkO2NoYXJzZXQ9VVRGLThcIlxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoc3VwcG9ydC5ibG9iKSB7XG4gICAgICAgICAgdGhpcy5ibG9iID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKTtcbiAgICAgICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlCbG9iKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlBcnJheUJ1ZmZlcl0pKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgYmxvYlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlUZXh0XSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICB0aGlzLmFycmF5QnVmZmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjb25zdW1lZCh0aGlzKSB8fCBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUFycmF5QnVmZmVyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmJsb2IoKS50aGVuKHJlYWRCbG9iQXNBcnJheUJ1ZmZlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpO1xuICAgICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgICAgcmV0dXJuIHJlYWRCbG9iQXNUZXh0KHRoaXMuX2JvZHlCbG9iKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShcbiAgICAgICAgICAgICAgcmVhZEFycmF5QnVmZmVyQXNUZXh0KHRoaXMuX2JvZHlBcnJheUJ1ZmZlcilcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgdGV4dFwiKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5VGV4dCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzdXBwb3J0LmZvcm1EYXRhKSB7XG4gICAgICAgICAgdGhpcy5mb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oZGVjb2RlKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5qc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oSlNPTi5wYXJzZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIC8vIEhUVFAgbWV0aG9kcyB3aG9zZSBjYXBpdGFsaXphdGlvbiBzaG91bGQgYmUgbm9ybWFsaXplZFxuICAgICAgdmFyIG1ldGhvZHMgPSBbXCJERUxFVEVcIiwgXCJHRVRcIiwgXCJIRUFEXCIsIFwiT1BUSU9OU1wiLCBcIlBPU1RcIiwgXCJQVVRcIl07XG5cbiAgICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZU1ldGhvZChtZXRob2QpIHtcbiAgICAgICAgdmFyIHVwY2FzZWQgPSBtZXRob2QudG9VcHBlckNhc2UoKTtcbiAgICAgICAgcmV0dXJuIG1ldGhvZHMuaW5kZXhPZih1cGNhc2VkKSA+IC0xID8gdXBjYXNlZCA6IG1ldGhvZDtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gUmVxdWVzdChpbnB1dCwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgdmFyIGJvZHkgPSBvcHRpb25zLmJvZHk7XG5cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgUmVxdWVzdCkge1xuICAgICAgICAgIGlmIChpbnB1dC5ib2R5VXNlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkFscmVhZHkgcmVhZFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cmwgPSBpbnB1dC51cmw7XG4gICAgICAgICAgdGhpcy5jcmVkZW50aWFscyA9IGlucHV0LmNyZWRlbnRpYWxzO1xuICAgICAgICAgIGlmICghb3B0aW9ucy5oZWFkZXJzKSB7XG4gICAgICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhpbnB1dC5oZWFkZXJzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5tZXRob2QgPSBpbnB1dC5tZXRob2Q7XG4gICAgICAgICAgdGhpcy5tb2RlID0gaW5wdXQubW9kZTtcbiAgICAgICAgICBpZiAoIWJvZHkgJiYgaW5wdXQuX2JvZHlJbml0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGJvZHkgPSBpbnB1dC5fYm9keUluaXQ7XG4gICAgICAgICAgICBpbnB1dC5ib2R5VXNlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudXJsID0gU3RyaW5nKGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSBvcHRpb25zLmNyZWRlbnRpYWxzIHx8IHRoaXMuY3JlZGVudGlhbHMgfHwgXCJvbWl0XCI7XG4gICAgICAgIGlmIChvcHRpb25zLmhlYWRlcnMgfHwgIXRoaXMuaGVhZGVycykge1xuICAgICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tZXRob2QgPSBub3JtYWxpemVNZXRob2Qob3B0aW9ucy5tZXRob2QgfHwgdGhpcy5tZXRob2QgfHwgXCJHRVRcIik7XG4gICAgICAgIHRoaXMubW9kZSA9IG9wdGlvbnMubW9kZSB8fCB0aGlzLm1vZGUgfHwgbnVsbDtcbiAgICAgICAgdGhpcy5yZWZlcnJlciA9IG51bGw7XG5cbiAgICAgICAgaWYgKCh0aGlzLm1ldGhvZCA9PT0gXCJHRVRcIiB8fCB0aGlzLm1ldGhvZCA9PT0gXCJIRUFEXCIpICYmIGJvZHkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQm9keSBub3QgYWxsb3dlZCBmb3IgR0VUIG9yIEhFQUQgcmVxdWVzdHNcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faW5pdEJvZHkoYm9keSk7XG4gICAgICB9XG5cbiAgICAgIFJlcXVlc3QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVxdWVzdCh0aGlzLCB7IGJvZHk6IHRoaXMuX2JvZHlJbml0IH0pO1xuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gZGVjb2RlKGJvZHkpIHtcbiAgICAgICAgdmFyIGZvcm0gPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgYm9keVxuICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAuc3BsaXQoXCImXCIpXG4gICAgICAgICAgLmZvckVhY2goZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICAgICAgICAgIGlmIChieXRlcykge1xuICAgICAgICAgICAgICB2YXIgc3BsaXQgPSBieXRlcy5zcGxpdChcIj1cIik7XG4gICAgICAgICAgICAgIHZhciBuYW1lID0gc3BsaXQuc2hpZnQoKS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpO1xuICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKFwiPVwiKS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpO1xuICAgICAgICAgICAgICBmb3JtLmFwcGVuZChkZWNvZGVVUklDb21wb25lbnQobmFtZSksIGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZm9ybTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcGFyc2VIZWFkZXJzKHJhd0hlYWRlcnMpIHtcbiAgICAgICAgdmFyIGhlYWRlcnM6IGFueSA9IG5ldyBIZWFkZXJzKHt9KTtcbiAgICAgICAgcmF3SGVhZGVycy5zcGxpdCgvXFxyP1xcbi8pLmZvckVhY2goZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgIHZhciBwYXJ0cyA9IGxpbmUuc3BsaXQoXCI6XCIpO1xuICAgICAgICAgIHZhciBrZXkgPSBwYXJ0cy5zaGlmdCgpLnRyaW0oKTtcbiAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBwYXJ0cy5qb2luKFwiOlwiKS50cmltKCk7XG4gICAgICAgICAgICBoZWFkZXJzLmFwcGVuZChrZXksIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaGVhZGVycztcbiAgICAgIH1cblxuICAgICAgQm9keS5jYWxsKFJlcXVlc3QucHJvdG90eXBlKTtcblxuICAgICAgdmFyIFJlc3BvbnNlOiBhbnkgPSBmdW5jdGlvbihib2R5SW5pdCwgb3B0aW9ucyk6IHZvaWQge1xuICAgICAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnR5cGUgPSBcImRlZmF1bHRcIjtcbiAgICAgICAgdGhpcy5zdGF0dXMgPSBcInN0YXR1c1wiIGluIG9wdGlvbnMgPyBvcHRpb25zLnN0YXR1cyA6IDIwMDtcbiAgICAgICAgdGhpcy5vayA9IHRoaXMuc3RhdHVzID49IDIwMCAmJiB0aGlzLnN0YXR1cyA8IDMwMDtcbiAgICAgICAgdGhpcy5zdGF0dXNUZXh0ID0gXCJzdGF0dXNUZXh0XCIgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RhdHVzVGV4dCA6IFwiT0tcIjtcbiAgICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKTtcbiAgICAgICAgdGhpcy51cmwgPSBvcHRpb25zLnVybCB8fCBcIlwiO1xuICAgICAgICB0aGlzLl9pbml0Qm9keShib2R5SW5pdCk7XG4gICAgICB9O1xuXG4gICAgICBCb2R5LmNhbGwoUmVzcG9uc2UucHJvdG90eXBlKTtcblxuICAgICAgUmVzcG9uc2UucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UodGhpcy5fYm9keUluaXQsIHtcbiAgICAgICAgICBzdGF0dXM6IHRoaXMuc3RhdHVzLFxuICAgICAgICAgIHN0YXR1c1RleHQ6IHRoaXMuc3RhdHVzVGV4dCxcbiAgICAgICAgICBoZWFkZXJzOiBuZXcgSGVhZGVycyh0aGlzLmhlYWRlcnMpLFxuICAgICAgICAgIHVybDogdGhpcy51cmxcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBSZXNwb25zZS5lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UobnVsbCwgeyBzdGF0dXM6IDAsIHN0YXR1c1RleHQ6IFwiXCIgfSk7XG4gICAgICAgIHJlc3BvbnNlLnR5cGUgPSBcImVycm9yXCI7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH07XG5cbiAgICAgIHZhciByZWRpcmVjdFN0YXR1c2VzID0gWzMwMSwgMzAyLCAzMDMsIDMwNywgMzA4XTtcblxuICAgICAgUmVzcG9uc2UucmVkaXJlY3QgPSBmdW5jdGlvbih1cmwsIHN0YXR1cykge1xuICAgICAgICBpZiAocmVkaXJlY3RTdGF0dXNlcy5pbmRleE9mKHN0YXR1cykgPT09IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbnZhbGlkIHN0YXR1cyBjb2RlXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7XG4gICAgICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgICAgICAgaGVhZGVyczogeyBsb2NhdGlvbjogdXJsIH1cbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBzZWxmLkhlYWRlcnMgPSBIZWFkZXJzO1xuICAgICAgc2VsZi5SZXF1ZXN0ID0gUmVxdWVzdDtcbiAgICAgIHNlbGYuUmVzcG9uc2UgPSBSZXNwb25zZTtcblxuICAgICAgc2VsZi5mZXRjaCA9IGZ1bmN0aW9uKGlucHV0LCBpbml0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICB2YXIgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGlucHV0LCBpbml0KTtcbiAgICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9uczoge1xuICAgICAgICAgICAgICBzdGF0dXM6IGFueTtcbiAgICAgICAgICAgICAgc3RhdHVzVGV4dDogYW55O1xuICAgICAgICAgICAgICBoZWFkZXJzOiBhbnk7XG4gICAgICAgICAgICAgIHVybD86IGFueTtcbiAgICAgICAgICAgIH0gPSB7XG4gICAgICAgICAgICAgIHN0YXR1czogeGhyLnN0YXR1cyxcbiAgICAgICAgICAgICAgc3RhdHVzVGV4dDogeGhyLnN0YXR1c1RleHQsXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHBhcnNlSGVhZGVycyh4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkgfHwgXCJcIilcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBvcHRpb25zLnVybCA9XG4gICAgICAgICAgICAgIFwicmVzcG9uc2VVUkxcIiBpbiB4aHJcbiAgICAgICAgICAgICAgICA/IHhoci5yZXNwb25zZVVSTFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5oZWFkZXJzLmdldChcIlgtUmVxdWVzdC1VUkxcIik7XG4gICAgICAgICAgICB2YXIgYm9keSA9IFwicmVzcG9uc2VcIiBpbiB4aHIgPyB4aHIucmVzcG9uc2UgOiB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgcmVzb2x2ZShuZXcgUmVzcG9uc2UoYm9keSwgb3B0aW9ucykpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoXCJOZXR3b3JrIHJlcXVlc3QgZmFpbGVkXCIpKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgeGhyLm9udGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoXCJOZXR3b3JrIHJlcXVlc3QgZmFpbGVkXCIpKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgeGhyLm9wZW4ocmVxdWVzdC5tZXRob2QsIHJlcXVlc3QudXJsLCB0cnVlKTtcblxuICAgICAgICAgIGlmIChyZXF1ZXN0LmNyZWRlbnRpYWxzID09PSBcImluY2x1ZGVcIikge1xuICAgICAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKFwicmVzcG9uc2VUeXBlXCIgaW4geGhyICYmIHN1cHBvcnQuYmxvYikge1xuICAgICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IFwiYmxvYlwiO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlcXVlc3QuaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICB4aHIuc2VuZChcbiAgICAgICAgICAgIHR5cGVvZiByZXF1ZXN0Ll9ib2R5SW5pdCA9PT0gXCJ1bmRlZmluZWRcIiA/IG51bGwgOiByZXF1ZXN0Ll9ib2R5SW5pdFxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIHNlbGYuZmV0Y2gucG9seWZpbGwgPSB0cnVlO1xuICAgIH0pKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHRoaXMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZldGNoOiBzZWxmLmZldGNoLFxuICAgICAgSGVhZGVyczogc2VsZi5IZWFkZXJzLFxuICAgICAgUmVxdWVzdDogc2VsZi5SZXF1ZXN0LFxuICAgICAgUmVzcG9uc2U6IHNlbGYuUmVzcG9uc2VcbiAgICB9O1xuICB9KSgpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZmV0Y2hQb255ZmlsbDtcbiIsImltcG9ydCBmZXRjaFBvbnlmaWxsIGZyb20gXCIuLi92ZW5kb3IvZmV0Y2hQb255ZmlsbFwiO1xuXG50eXBlIFJlcXVlc3RJbml0aWFsaXphdGlvbk9iamVjdCA9IHtcbiAgZW5kcG9pbnQ/OiBzdHJpbmc7XG4gIG9wdGlvbnM/OiBSZXF1ZXN0SW5pdDtcbiAgYm9keT86IEZvcm1EYXRhO1xufTtcblxuY2xhc3MgUmVxdWVzdCB7XG4gIC8vIFByb3BlcnR5IHR5cGVzXG4gIGVuZHBvaW50OiBzdHJpbmc7XG4gIG9wdGlvbnM6IFJlcXVlc3RJbml0O1xuICBib2R5OiBGb3JtRGF0YTtcblxuICAvLyBTdGF0aWMgcHJvcGVydGllc1xuICAvKipcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyIHtvYmplY3R9IFJlcXVlc3QuZGVmYXVsdE9wdGlvbnMgT3B0aW9ucyBvYmplY3QgdG8gZmFsbGJhY2sgdG8gaWZcbiAgICogbm8gb3B0aW9ucyBwcm9wZXJ0eSBpcyBwYXNzZWQgaW50byB0aGUgY29uc3RydWN0b3IgY29uZmlnIG9iamVjdC5cbiAgICovXG4gIHN0YXRpYyBkZWZhdWx0T3B0aW9uczogUmVxdWVzdEluaXQgPSB7XG4gICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgIGhlYWRlcnM6IHsgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XG4gIH07XG5cbiAgLy8gQ29uc3RydWN0b3JcbiAgLyoqXG4gICAqIEBjbGFzcyBSZXF1ZXN0XG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5lbmRwb2ludFxuICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbmZpZy5vcHRpb25zXVxuICAgKiBAcGFyYW0ge0Zvcm1EYXRhfSBbY29uZmlnLmJvZHldXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih7IGVuZHBvaW50LCBvcHRpb25zLCBib2R5IH06IFJlcXVlc3RJbml0aWFsaXphdGlvbk9iamVjdCkge1xuICAgIHRoaXMuZW5kcG9pbnQgPSBlbmRwb2ludDtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IFJlcXVlc3QuZGVmYXVsdE9wdGlvbnM7XG4gICAgdGhpcy5ib2R5ID0gYm9keTtcbiAgfVxuICAvLyBQcml2YXRlIG1ldGhvZHNcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqIEBmdW5jdGlvbiBSZXF1ZXN0LnByZXBhcmVGZXRjaE9wdGlvbnNcbiAgICogQGRlc2NyaXB0aW9uIENyZWF0ZXMgYmxhbmsgRm9ybURhdGEgb2JqZWN0IGlmIHRoaXMuYm9keSBpcyB1bmRlZmluZWQgYW5kXG4gICAqIHRoaXMub3B0aW9ucy5tZXRob2QgaXMgZXF1YWwgdG8gXCJQT1NUXCIuXG4gICAqIEByZXR1cm5zIHtGb3JtRGF0YX1cbiAgICovXG4gIHByaXZhdGUgcHJlcGFyZUZldGNoT3B0aW9ucyA9ICgpID0+IHtcbiAgICBpZiAoIXRoaXMuYm9keSAmJiB0aGlzLm9wdGlvbnMubWV0aG9kID09PSBcIlBPU1RcIikge1xuICAgICAgdGhpcy5ib2R5ID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmJvZHk7XG4gIH07XG4gIC8vIFB1YmxpYyBtZXRob2RzXG4gIC8qKlxuICAgKiBAcHVibGljXG4gICAqIEBmdW5jdGlvbiBSZXF1ZXN0LnNlbmRcbiAgICogQHBhcmFtXHR7b2JqZWN0fSBvcHRpb25zXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuYXN5bmNdIEFsbG93cyBwcm9wZXJ0eSBgYXN5bmNgIHRvIGJlIHNldCB0byBpbmRpY2F0ZSB0aGVcbiAgICogcmVzcG9uc2Ugc2hvdWxkIGJlIHByZXBhcmVkIGJlZm9yZSByZXR1cm5pbmcuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgcHVibGljIHNlbmQgPSAoeyBhc3luYyB9OiB7IGFzeW5jOiBib29sZWFuIH0gPSB7IGFzeW5jOiBmYWxzZSB9KSA9PiB7XG4gICAgY29uc3QgeyBmZXRjaCB9ID0gd2luZG93XG4gICAgICA/IHdpbmRvdy5mZXRjaCA/IHdpbmRvdyA6IGZldGNoUG9ueWZpbGwoe30pLmZldGNoXG4gICAgICA6IHtcbiAgICAgICAgICBmZXRjaDogKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiZmV0Y2ggaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgY29uc3QgcHJlcGFyZWRPcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgdGhpcy5wcmVwYXJlRmV0Y2hPcHRpb25zKCksXG4gICAgICB0aGlzLm9wdGlvbnNcbiAgICApO1xuICAgIGNvbnN0IGluaXRGZXRjaCA9IGZldGNoKHRoaXMuZW5kcG9pbnQsIHByZXBhcmVkT3B0aW9ucyk7XG4gICAgcmV0dXJuIGFzeW5jID8gaW5pdEZldGNoLnRoZW4ocmVzID0+IHJlcy5qc29uKCkpIDogaW5pdEZldGNoO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBSZXF1ZXN0O1xuIiwiLyoqXG4gKiBAbW9kdWxlIGRhdGFNYW5pcHVsYXRpb25cbiAqL1xuXG50eXBlIGFscGhhbnVtZXJpYyA9IHN0cmluZyB8IG51bWJlcjtcblxuLyoqXG4gKiBAZnVuY3Rpb24gc2VhcmNoUHJvcFBhdGhcbiAqIEBkZXNjcmlwdGlvbiBSZWN1cnNpdmVseSBzZWFyY2hzIHRocm91Z2ggYSBkYXRhIG9iamVjdFxuICogQHBhcmFtIHthbHBoYW51bWVyaWNbXX0gW3BhdGhdIEFycmF5IG9mIGtleXMgaW4gdGhlIG9yZGVyIG9mIHdoaWNoIHdpbGwgYmUgdXNlZCB0byByZWN1cnNpdmVseSBzZWFyY2ggYW4gb2JqZWN0XG4gKiBAcGFyYW0ge29iamVjdH0gW2NvbGxlY3Rpb25dIERhdGEgb2JqZWN0XG4gKiBAcmV0dXJuIHthbnl9IFZhbHVlIGF0IHRoZSBlbmQgb2YgdGhlIHNlYXJjaGVkIHByb3BlcnR5IHBhdGg7IFxuICovXG5jb25zdCBzZWFyY2hQcm9wUGF0aCA9IChwYXRoOiBhbHBoYW51bWVyaWNbXSwgY29sbGVjdGlvbjogb2JqZWN0KTogYW55ID0+IHtcbiAgbGV0IHBhdGhSZXN1bHQgPSBjb2xsZWN0aW9uO1xuICBwYXRoLmZvckVhY2goa2V5ID0+IHtcbiAgICBwYXRoUmVzdWx0ID0gcGF0aFJlc3VsdFtrZXldO1xuICB9KTtcbiAgcmV0dXJuIHBhdGhSZXN1bHQgPyBwYXRoUmVzdWx0IDogZmFsc2U7XG59O1xuXG5leHBvcnQgeyBzZWFyY2hQcm9wUGF0aCB9IiwiLyoqXG4gKiBAbW9kdWxlIHBhcnNlXG4gKi9cblxuLyoqXG4gKiBCYXNlIGZyb20gaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vZ2VvZmZkYXZpczkyLzFkYTdkMDc0NWUzYmJhMDM2Zjk0XG4gKiBAZnVuY3Rpb24gcGFyYW1zXG4gKiBAZGVzY3JpcHRpb24gQ3JlYXRlcyBvYmplY3Qgb2Yga2V5L3ZhbHVlIHBhaXJzIGZyb20gVVJMIHBhcmFtZXRlcnMuXG4gKiBAcGFyYW0ge3N0cmluZ30gW3VybF0gVVJMIHRvIHBhcnNlOyBkZWZhdWx0cyB0byB3aW5kb3cubG9jYXRpb24uc2VhcmNoLlxuICogQHJldHVybiB7b2JqZWN0fSBPYmplY3Qgb2Yga2V5L3ZhbHVlIHBhaXJzLlxuICovXG5jb25zdCBwYXJhbXMgPSAodXJsOiBzdHJpbmcgPSB3aW5kb3cubG9jYXRpb24uc2VhcmNoKTogb2JqZWN0ID0+XG4gIHVybFxuICAgIC5zcGxpdChcIj9cIilbMV1cbiAgICAuc3BsaXQoXCImXCIpXG4gICAgLm1hcChxID0+IHEuc3BsaXQoXCI9XCIpKVxuICAgIC5yZWR1Y2UoKGFjYywgW2tleSwgdmFsXSwgaSwgYXJyKSA9PiB7XG4gICAgICBhY2Nba2V5XSA9IGRlY29kZVVSSUNvbXBvbmVudCh2YWwpLnJlcGxhY2UoL1xcKy9nLCBcIiBcIik7XG4gICAgICByZXR1cm4gYWNjO1xuICAgIH0sIHt9KTtcblxuLyoqXG4gKiBAZnVuY3Rpb24gcGFyc2VFeHRlcm5hbE1hcmtkb3duTGlua3NcbiAqIEBkZXNjcmlwdGlvbiBUcmFuc2Zvcm1zIE1hcmtkb3duIGxpbmtzIHRvIHVzZSB0YXJnZXQ9XCJfYmxhbmtcIiwgcmVsPVwibm9vcGVuZXIgbm9yZWZlcnJlclwiO1xuICogdXN1YWxseSB1c2VkIHdoZW4gaW1wbGVtZW50aW5nIGNsaWVudHNpZGUgTWFya2Rvd24sIGJlZm9yZSBzZW5kaW5nIHRoZSBNYXJrZG93biB0byB0aGUgbWFpblxuICogcGFyc2luZyBmdW5jdGlvbi5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgU3RyaW5nIHRvIHBhcnNlIGFzIE1hcmtkb3duIGxpbmsuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBIVE1MIGxpbmsgd2l0aCBVUkwgYW5kIGlubmVyVGV4dCwgdGFyZ2V0IGFuZCByZWwgYXR0cmlidXRlcyBwcm9wZXJseSBzZXQgZm9yXG4gKiBhbiBleHRlcm5hbCBsaW5rLlxuICovXG5jb25zdCBwYXJzZUV4dGVybmFsTWFya2Rvd25MaW5rcyA9IChzdHJpbmc6IHN0cmluZyk6IHN0cmluZyA9PiB7XG4gIGNvbnN0IHBhdHRlcm46IFJlZ0V4cCA9IC9cXFsoW15cXF1dKylcXF1cXCgoW14pXSspXFwpL2c7XG4gIGlmIChzdHJpbmcuc2VhcmNoKHBhdHRlcm4pID4gLTEpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoXG4gICAgICBwYXR0ZXJuLFxuICAgICAgJzxhIGhyZWY9XCIkMlwiIHRhcmdldD1cIl9ibGFua1wiIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIj4kMTwvYT4nXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc3RyaW5nO1xuICB9XG59O1xuXG5leHBvcnQgeyBwYXJhbXMgYXMgcGFyc2VVUkxQYXJhbXMsIHBhcnNlRXh0ZXJuYWxNYXJrZG93bkxpbmtzIH07XG4iLCIvKipcbiAqIEBtb2R1bGUgc2Nyb2xsXG4gKi9cblxuLyoqXG4gKiBAZnVuY3Rpb24gaXNFbGVtZW50SW5WaWV3cG9ydFxuICogQGRlc2NyaXB0aW9uIERldGVybWluZXMgaWYgYSBnaXZlbiBlbGVtZW50IGlzIHBhcnRpYWxseSBvclxuICogZnVsbHkgdmlzaWJsZSBpbiB0aGUgdmlld3BvcnQuXG4gKiBAcGFyYW0ge29iamVjdH0gY29uZmlnXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGNvbmZpZy5lbGVtZW50IEhUTUwgRWxlbWVudCBub2RlIHRvIHRhcmdldC5cbiAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnRocmVzaG9sZF0gUmF0aW8gb2YgdGhlIHZpZXdwb3J0IGhlaWdodCB0aGUgZWxlbWVudFxuICogbXVzdCBmaWxsIGJlZm9yZSBiZWluZyBjb25zaWRlcmVkIHZpc2libGUuIEUuZy4gMC41IG1lYW5zIHRoZSBlbGVtZW50XG4gKiBtdXN0IHRha2UgdXAgNTAlIG9mIHRoZSBzY3JlZW4gYmVmb3JlIHJldHVybmluZyB0cnVlLiBEZWZhdWx0cyB0byAwLjI1LlxuICogT25seSB1c2VkIGZvciBlbGVtZW50cyB0YWxsZXIgdGhhbiB0aGUgdmlld3BvcnQuXG4gKiBAcmV0dXJuIHtib29sZWFufSBCb29sZWFuIGRlc2NyaWJpbmcgaWYgaW5wdXQgaXMgZnVsbHkvcGFydGlhbGx5XG4gKiBpbiB0aGUgdmlld3BvcnQsIHJlbGF0aXZlIHRvIHRoZSB0aHJlc2hvbGQgc2V0dGluZy5cbiAqL1xuZnVuY3Rpb24gaXNFbGVtZW50SW5WaWV3cG9ydCh7XG4gIGVsZW1lbnQ6IGFyZ0VsZW1lbnQsXG4gIHRocmVzaG9sZDogYXJnVGhyZXNob2xkXG59OiB7XG4gIGVsZW1lbnQ6IEVsZW1lbnQ7XG4gIHRocmVzaG9sZDogbnVtYmVyO1xufSk6IGJvb2xlYW4ge1xuICBjb25zdCBkZWZhdWx0UGFyYW1zOiB7XG4gICAgdGhyZXNob2xkOiBudW1iZXI7XG4gIH0gPSB7XG4gICAgdGhyZXNob2xkOiAwLjI1XG4gIH07XG5cbiAgY29uc3Qgc2FmZUFyZ3MgPSB7XG4gICAgdGhyZXNob2xkOiBhcmdUaHJlc2hvbGQgfHwgZGVmYXVsdFBhcmFtcy50aHJlc2hvbGRcbiAgfTtcblxuICBjb25zdCByZWN0OiBDbGllbnRSZWN0IHwgRE9NUmVjdCA9IGFyZ0VsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cbiAgY29uc3Qgdmlld3BvcnRIZWlnaHQ6IG51bWJlciA9IE1hdGgubWF4KFxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQsXG4gICAgd2luZG93LmlubmVySGVpZ2h0IHx8IDBcbiAgKTtcbiAgY29uc3QgeyB0aHJlc2hvbGQgfSA9IHNhZmVBcmdzO1xuXG4gIGlmICh0aHJlc2hvbGQgPCAwIHx8IHRocmVzaG9sZCA+IDEpIHtcbiAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcihcbiAgICAgIFwiVGhyZXNob2xkIGFyZ3VtZW50IG11c3QgYmUgYSBkZWNpbWFsIGJldHdlZW4gMCBhbmQgMVwiXG4gICAgKTtcbiAgfVxuXG4gIC8vSWYgdGhlIGVsZW1lbnQgaXMgdG9vIHRhbGwgdG8gZml0IHdpdGhpbiB0aGUgdmlld3BvcnRcbiAgaWYgKHJlY3QuaGVpZ2h0ID49IHRocmVzaG9sZCAqIHZpZXdwb3J0SGVpZ2h0KSB7XG4gICAgaWYgKFxuICAgICAgcmVjdC50b3AgLSB2aWV3cG9ydEhlaWdodCA8PSB0aHJlc2hvbGQgKiB2aWV3cG9ydEhlaWdodCAqIC0xICYmXG4gICAgICByZWN0LmJvdHRvbSA+PSB0aHJlc2hvbGQgKiB2aWV3cG9ydEhlaWdodFxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy9JZiB0aGUgZWxlbWVudCBpcyBzaG9ydCBlbm91Z2ggdG8gZml0IHdpdGhpbiB0aGUgdmlld3BvcnRcbiAgICBpZiAocmVjdC50b3AgPj0gMCAmJiByZWN0LmJvdHRvbSAtIHZpZXdwb3J0SGVpZ2h0IDw9IDApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG59XG5cbi8qKlxuICogRnJvbSBodHRwOi8vYml0Lmx5LzJjUDY1ZkRcbiAqIEB0b2RvIENsYXNzaWZ5IGFuZCBkZXNjcmliZSBwYXJhbXMuXG4gKiBAZnVuY3Rpb24gc2Nyb2xsVG9cbiAqIEBkZXNjcmlwdGlvbiBTY3JvbGxzIGdpdmVuIGVsZW1lbnQgdG8gZGV0ZXJtaW5lZCBwb2ludC5cbiAqIEBwYXJhbSAge0VsZW1lbnR9IGVsZW1lbnQgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge251bWJlcn0gdG8gICAgICAgW2Rlc2NyaXB0aW9uXVxuICogQHBhcmFtICB7bnVtYmVyfSBkdXJhdGlvbiBbZGVzY3JpcHRpb25dXG4gKiBAcmV0dXJuIHt2b2lkfVxuICovXG5mdW5jdGlvbiBzY3JvbGxUbyhlbGVtZW50OiBFbGVtZW50LCB0bzogbnVtYmVyLCBkdXJhdGlvbjogbnVtYmVyKTogdm9pZCB7XG4gIGlmIChkdXJhdGlvbiA8PSAwKSByZXR1cm47XG4gIGNvbnN0IGRpZmZlcmVuY2U6IG51bWJlciA9IHRvIC0gZWxlbWVudC5zY3JvbGxUb3A7XG4gIGNvbnN0IHBlclRpY2s6IG51bWJlciA9IGRpZmZlcmVuY2UgLyBkdXJhdGlvbiAqIDEwO1xuXG4gIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgZWxlbWVudC5zY3JvbGxUb3AgPSBlbGVtZW50LnNjcm9sbFRvcCArIHBlclRpY2s7XG4gICAgaWYgKGVsZW1lbnQuc2Nyb2xsVG9wID09PSB0bykgcmV0dXJuO1xuICAgIHNjcm9sbFRvKGVsZW1lbnQsIHRvLCBkdXJhdGlvbiAtIDEwKTtcbiAgfSwgMTApO1xufVxuXG5leHBvcnQgeyBpc0VsZW1lbnRJblZpZXdwb3J0LCBzY3JvbGxUbyB9O1xuIiwiLyoqXG4gKiBAbW9kdWxlIHNlbGVjdFxuICovXG5cbi8qKlxuICogQGZ1bmN0aW9uIHNlbGVjdFxuICogQGRlc2NyaXB0aW9uIFNlbGVjdHMgYSBET00gbm9kZSBiYXNlZCBvbiBhIHF1ZXJ5LlxuICogQHBhcmFtIHtzdHJpbmd9IHF1ZXJ5IHF1ZXJ5IHNlbGVjdG9yIHRvIHVzZSB0byBxdWVyeSBhbiBub2RlLlxuICogQHJldHVybnMge0VsZW1lbnR9IEZpcnN0IERPTSBub2RlIHRoYXQgbWF0Y2hlcyB0aGUgcXVlcnkuXG4gKi9cbmNvbnN0IHNlbGVjdDogRnVuY3Rpb24gPSAocXVlcnk6IHN0cmluZyk6IEVsZW1lbnQgPT5cbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcihxdWVyeSk7XG5cbi8qKlxuICogQGZ1bmN0aW9uIHNlbGVjdEFsbFxuICogQGRlc2NyaXB0aW9uIFNlbGVjdHMgYSBET00gbm9kZWxpc3QgYmFzZWQgb24gYSBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBxdWVyeSBxdWVyeSBzZWxlY3RvciB0byB1c2UgdG8gcXVlcnkgYSBub2RlbGlzdC5cbiAqIEByZXR1cm5zIHtFbGVtZW50W119IEFycmF5IG9mIERPTSBub2RlcyB0aGF0IG1hdGNoIHRoZSBxdWVyeS5cbiAqL1xuY29uc3Qgc2VsZWN0QWxsOiBGdW5jdGlvbiA9IChxdWVyeTogc3RyaW5nKTogRWxlbWVudFtdID0+IFtcbiAgLi4uZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChxdWVyeSlcbl07XG5cbi8qKlxuICogQGZ1bmN0aW9uIHNlbGVjdEJ5SWRcbiAqIEBkZXNjcmlwdGlvbiBTZWxlY3RzIGEgRE9NIG5vZGUgYmFzZWQgb24gYW4gSUQgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IGlkIElEIG9mIERPTSBub2RlIHRvIHNlbGVjdC5cbiAqIEByZXR1cm5zIHtFbGVtZW50fSBET00gbm9kZSB3aXRoIG1hdGNoZWQgSUQuXG4gKi9cbmNvbnN0IHNlbGVjdEJ5SWQ6IEZ1bmN0aW9uID0gKGlkOiBzdHJpbmcpOiBFbGVtZW50ID0+XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKGlkKTtcblxuZXhwb3J0IHsgc2VsZWN0LCBzZWxlY3RBbGwsIHNlbGVjdEJ5SWQgfTtcbiIsIi8qKlxuICogQG1vZHVsZSB0eXBvZ3JhcGh5XG4gKi9cblxuLyoqXG4gKiBAZnVuY3Rpb24gY2FwaXRhbGl6ZVxuICogQGRlc2NyaXB0aW9uIENhcGl0YWxpemVzIGFsbCB3b3JkcyBpbiBhIHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGV4dCB0byBjYXBpdGFsaXplLlxuICogQHJldHVybnMge3N0cmluZ30gVGl0bGUtY2FzZWQgdGV4dC5cbiAqL1xuY29uc3QgY2FwaXRhbGl6ZSA9IChzdHJpbmc6IHN0cmluZyk6IHN0cmluZyA9PlxuICBzdHJpbmdcbiAgICAuc3BsaXQoXCIgXCIpXG4gICAgLm1hcChzID0+IHVjRmlyc3QocykpXG4gICAgLmpvaW4oXCIgXCIpO1xuXG4vKipcbiAqIEBmdW5jdGlvbiBzbHVnaWZ5XG4gKiBAZGVzY3JpcHRpb24gTG93ZXJjYXNlcyBzdHJpbmcsIHJlcGxhY2VzIHNwYWNlcyBhbmQgc3BlY2lhbCBjaGFyYWN0ZXJzXG4gKiB3aXRoIGEgc2V0IGRlbGltaXRlci5cbiAqIEBwYXJhbSB7c3RyaW5nfSB0ZXh0VG9TbHVnIFRleHQgdG8gc2x1Z2lmeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBbZGVsaW1pdGVyXSBEZWxpbWl0ZXI7IGRlZmF1bHRzIHRvIFwiLVwiLlxuICogQHJldHVybnMge3N0cmluZ30gU2x1Z2lmaWVkIHRleHQuXG4gKi9cbmNvbnN0IHNsdWdpZnkgPSAodGV4dFRvU2x1Zzogc3RyaW5nLCBkZWxpbWl0ZXI6IHN0cmluZyA9IFwiLVwiKTogc3RyaW5nID0+XG4gIHRleHRUb1NsdWdcbiAgICAucmVwbGFjZSgvKFxcIXwjfFxcJHwlfFxcKnxcXC58XFwvfFxcXFx8XFwofFxcKXxcXCt8XFx8fFxcLHxcXDp8XFwnfFxcXCIpL2csIFwiXCIpXG4gICAgLnJlcGxhY2UoLyguKShcXHN8XFxffFxcLSkrKC4pL2csIGAkMSR7ZGVsaW1pdGVyfSQzYClcbiAgICAudG9Mb3dlckNhc2UoKTtcblxuLyoqXG4gKiBAZnVuY3Rpb24gdHJpbVxuICogQGRlc2NyaXB0aW9uIFRyaW1zIHdoaXRlc3BhY2Ugb24gZWl0aGVyIGVuZCBvZiBhIHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHJpbmcgVGV4dCB0byB0cmltLlxuICogQHJldHVybnMge3N0cmluZ30gVHJpbW1lZCB0ZXh0LlxuICovXG5jb25zdCB0cmltID0gKHN0cmluZzogc3RyaW5nKTogc3RyaW5nID0+IHN0cmluZy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCBcIlwiKTtcblxuLyoqXG4gKiBAZnVuY3Rpb24gdWNGaXJzdFxuICogQGRlc2NyaXB0aW9uIENhcGl0YWxpemVzIGZpcnN0IHdvcmQgaW4gYSBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRleHQgdG8gY2FwaXRhbGl6ZS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IENhcGl0YWxpemVkIHRleHQuXG4gKi9cbmNvbnN0IHVjRmlyc3QgPSAoW2ZpcnN0TGV0dGVyLCAuLi5yZXN0TGV0dGVyc106IHN0cmluZyk6IHN0cmluZyA9PlxuICBgJHtmaXJzdExldHRlci50b1VwcGVyQ2FzZSgpfSR7cmVzdExldHRlcnMuam9pbihcIlwiKX1gO1xuXG5leHBvcnQgeyBjYXBpdGFsaXplLCBzbHVnaWZ5LCB0cmltLCB1Y0ZpcnN0IH07XG4iXSwibmFtZXMiOlsiZmV0Y2hQb255ZmlsbCIsIm9wdGlvbnMiLCJ3aW5kb3ciLCJzZWxmIiwiZ2xvYmFsIiwiUHJvbWlzZSIsIlhNTEh0dHBSZXF1ZXN0IiwiT2JqZWN0IiwiY3JlYXRlIiwidW5kZWZpbmVkIiwiZmV0Y2giLCJzdXBwb3J0IiwiU3ltYm9sIiwiQmxvYiIsImUiLCJhcnJheUJ1ZmZlciIsInZpZXdDbGFzc2VzIiwiaXNEYXRhVmlldyIsIm9iaiIsIkRhdGFWaWV3IiwicHJvdG90eXBlIiwiaXNQcm90b3R5cGVPZiIsImlzQXJyYXlCdWZmZXJWaWV3IiwiQXJyYXlCdWZmZXIiLCJpc1ZpZXciLCJpbmRleE9mIiwidG9TdHJpbmciLCJjYWxsIiwibmFtZSIsIlN0cmluZyIsInRlc3QiLCJUeXBlRXJyb3IiLCJ0b0xvd2VyQ2FzZSIsInZhbHVlIiwiaXRlbXMiLCJpdGVyYXRvciIsInNoaWZ0IiwiZG9uZSIsIml0ZXJhYmxlIiwiaGVhZGVycyIsIm1hcCIsIkhlYWRlcnMiLCJmb3JFYWNoIiwiYXBwZW5kIiwiQXJyYXkiLCJpc0FycmF5IiwiaGVhZGVyIiwiZ2V0T3duUHJvcGVydHlOYW1lcyIsIm5vcm1hbGl6ZU5hbWUiLCJub3JtYWxpemVWYWx1ZSIsIm9sZFZhbHVlIiwiZ2V0IiwiaGFzIiwiaGFzT3duUHJvcGVydHkiLCJzZXQiLCJjYWxsYmFjayIsInRoaXNBcmciLCJrZXlzIiwicHVzaCIsIml0ZXJhdG9yRm9yIiwidmFsdWVzIiwiZW50cmllcyIsImJvZHkiLCJib2R5VXNlZCIsInJlamVjdCIsInJlYWRlciIsInJlc29sdmUiLCJvbmxvYWQiLCJyZXN1bHQiLCJvbmVycm9yIiwiZXJyb3IiLCJibG9iIiwiRmlsZVJlYWRlciIsInByb21pc2UiLCJmaWxlUmVhZGVyUmVhZHkiLCJyZWFkQXNBcnJheUJ1ZmZlciIsInJlYWRBc1RleHQiLCJidWYiLCJ2aWV3IiwiVWludDhBcnJheSIsImNoYXJzIiwibGVuZ3RoIiwiaSIsImZyb21DaGFyQ29kZSIsImpvaW4iLCJzbGljZSIsImJ5dGVMZW5ndGgiLCJidWZmZXIiLCJfaW5pdEJvZHkiLCJfYm9keUluaXQiLCJfYm9keVRleHQiLCJfYm9keUJsb2IiLCJmb3JtRGF0YSIsIkZvcm1EYXRhIiwiX2JvZHlGb3JtRGF0YSIsInNlYXJjaFBhcmFtcyIsIlVSTFNlYXJjaFBhcmFtcyIsIl9ib2R5QXJyYXlCdWZmZXIiLCJidWZmZXJDbG9uZSIsIkVycm9yIiwidHlwZSIsInJlamVjdGVkIiwiY29uc3VtZWQiLCJ0aGVuIiwicmVhZEJsb2JBc0FycmF5QnVmZmVyIiwidGV4dCIsInJlYWRCbG9iQXNUZXh0IiwicmVhZEFycmF5QnVmZmVyQXNUZXh0IiwiZGVjb2RlIiwianNvbiIsIkpTT04iLCJwYXJzZSIsIm1ldGhvZHMiLCJtZXRob2QiLCJ1cGNhc2VkIiwidG9VcHBlckNhc2UiLCJpbnB1dCIsIlJlcXVlc3QiLCJ1cmwiLCJjcmVkZW50aWFscyIsIm1vZGUiLCJub3JtYWxpemVNZXRob2QiLCJyZWZlcnJlciIsImNsb25lIiwiZm9ybSIsInRyaW0iLCJzcGxpdCIsImJ5dGVzIiwicmVwbGFjZSIsImRlY29kZVVSSUNvbXBvbmVudCIsInJhd0hlYWRlcnMiLCJsaW5lIiwicGFydHMiLCJrZXkiLCJSZXNwb25zZSIsImJvZHlJbml0Iiwic3RhdHVzIiwib2siLCJzdGF0dXNUZXh0IiwicmVzcG9uc2UiLCJyZWRpcmVjdFN0YXR1c2VzIiwicmVkaXJlY3QiLCJSYW5nZUVycm9yIiwibG9jYXRpb24iLCJpbml0IiwicmVxdWVzdCIsInhociIsInBhcnNlSGVhZGVycyIsImdldEFsbFJlc3BvbnNlSGVhZGVycyIsInJlc3BvbnNlVVJMIiwicmVzcG9uc2VUZXh0Iiwib250aW1lb3V0Iiwib3BlbiIsIndpdGhDcmVkZW50aWFscyIsInJlc3BvbnNlVHlwZSIsInNldFJlcXVlc3RIZWFkZXIiLCJzZW5kIiwicG9seWZpbGwiLCJlbmRwb2ludCIsImFzeW5jIiwid2FybiIsInByZXBhcmVkT3B0aW9ucyIsInByZXBhcmVGZXRjaE9wdGlvbnMiLCJpbml0RmV0Y2giLCJyZXMiLCJkZWZhdWx0T3B0aW9ucyIsIkFjY2VwdCIsInNlYXJjaFByb3BQYXRoIiwicGF0aCIsImNvbGxlY3Rpb24iLCJwYXRoUmVzdWx0IiwicGFyYW1zIiwic2VhcmNoIiwicSIsInJlZHVjZSIsImFjYyIsImFyciIsInZhbCIsInBhcnNlRXh0ZXJuYWxNYXJrZG93bkxpbmtzIiwic3RyaW5nIiwicGF0dGVybiIsImFyZ0VsZW1lbnQiLCJlbGVtZW50IiwiYXJnVGhyZXNob2xkIiwidGhyZXNob2xkIiwiZGVmYXVsdFBhcmFtcyIsInNhZmVBcmdzIiwicmVjdCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInZpZXdwb3J0SGVpZ2h0IiwiTWF0aCIsIm1heCIsImRvY3VtZW50IiwiZG9jdW1lbnRFbGVtZW50IiwiY2xpZW50SGVpZ2h0IiwiaW5uZXJIZWlnaHQiLCJoZWlnaHQiLCJ0b3AiLCJib3R0b20iLCJ0byIsImR1cmF0aW9uIiwiZGlmZmVyZW5jZSIsInNjcm9sbFRvcCIsInBlclRpY2siLCJzZWxlY3QiLCJxdWVyeSIsInF1ZXJ5U2VsZWN0b3IiLCJzZWxlY3RBbGwiLCJxdWVyeVNlbGVjdG9yQWxsIiwic2VsZWN0QnlJZCIsImlkIiwiZ2V0RWxlbWVudEJ5SWQiLCJjYXBpdGFsaXplIiwidWNGaXJzdCIsInMiLCJzbHVnaWZ5IiwidGV4dFRvU2x1ZyIsImRlbGltaXRlciIsImZpcnN0TGV0dGVyIiwicmVzdExldHRlcnMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OztBQVFBLElBQU1BLGdCQUFnQixzQkFBQSxDQUF1QkMsT0FBdkI7UUFDaEJDLFNBQVNBLFNBQVNBLE1BQVQsR0FBa0IsS0FBL0I7UUFDSUMsT0FBTyxPQUFPQSxJQUFQLEtBQWdCLFdBQWhCLEdBQStCRCxTQUFTQSxNQUFULEdBQWtCRSxNQUFqRCxHQUEyREQsSUFBdEU7UUFDSUUsVUFBV0osV0FBV0EsUUFBUUksT0FBcEIsSUFBZ0NGLEtBQUtFLE9BQW5EO1FBQ0lDLGlCQUNETCxXQUFXQSxRQUFRSyxjQUFwQixJQUF1Q0gsS0FBS0csY0FEOUM7UUFFSUYsU0FBU0QsSUFBYjtXQUVRO1lBQ0ZBLE9BQU9JLE9BQU9DLE1BQVAsQ0FBY0osTUFBZCxFQUFzQjttQkFDeEI7dUJBQ0VLLFNBREY7MEJBRUs7O1NBSEgsQ0FBWDtTQU9DLFVBQVNOLElBQVQ7Z0JBR0tBLEtBQUtPLEtBQVQsRUFBZ0I7OztnQkFJWkMsVUFBVTs4QkFDRSxxQkFBcUJSLElBRHZCOzBCQUVGLFlBQVlBLElBQVosSUFBb0IsY0FBY1MsTUFGaEM7c0JBSVYsZ0JBQWdCVCxJQUFoQixJQUNBLFVBQVVBLElBRFYsSUFFQzt3QkFDSzs0QkFDRVUsSUFBSjsrQkFDTyxJQUFQO3FCQUZGLENBR0UsT0FBT0MsQ0FBUCxFQUFVOytCQUNILEtBQVA7O2lCQUxKLEVBTlU7MEJBY0YsY0FBY1gsSUFkWjs2QkFlQyxpQkFBaUJBO2FBZmhDO2dCQWtCSVEsUUFBUUksV0FBWixFQUF5QjtvQkFDbkJDLGNBQWMsQ0FDaEIsb0JBRGdCLEVBRWhCLHFCQUZnQixFQUdoQiw0QkFIZ0IsRUFJaEIscUJBSmdCLEVBS2hCLHNCQUxnQixFQU1oQixxQkFOZ0IsRUFPaEIsc0JBUGdCLEVBUWhCLHVCQVJnQixFQVNoQix1QkFUZ0IsQ0FBbEI7b0JBWUlDLGFBQWEsU0FBYkEsVUFBYSxDQUFTQyxHQUFUOzJCQUNSQSxPQUFPQyxTQUFTQyxTQUFULENBQW1CQyxhQUFuQixDQUFpQ0gsR0FBakMsQ0FBZDtpQkFERjtvQkFJSUksb0JBQ0ZDLFlBQVlDLE1BQVosSUFDQSxVQUFTTixHQUFUOzJCQUVJQSxPQUNBRixZQUFZUyxPQUFaLENBQW9CbEIsT0FBT2EsU0FBUCxDQUFpQk0sUUFBakIsQ0FBMEJDLElBQTFCLENBQStCVCxHQUEvQixDQUFwQixJQUEyRCxDQUFDLENBRjlEO2lCQUhKOztrQ0FVRixDQUF1QlUsSUFBdkI7b0JBQ00sT0FBT0EsSUFBUCxLQUFnQixRQUFwQixFQUE4QjsyQkFDckJDLE9BQU9ELElBQVAsQ0FBUDs7b0JBRUUsNkJBQTZCRSxJQUE3QixDQUFrQ0YsSUFBbEMsQ0FBSixFQUE2QzswQkFDckMsSUFBSUcsU0FBSixDQUFjLHdDQUFkLENBQU47O3VCQUVLSCxLQUFLSSxXQUFMLEVBQVA7O21DQUdGLENBQXdCQyxLQUF4QjtvQkFDTSxPQUFPQSxLQUFQLEtBQWlCLFFBQXJCLEVBQStCOzRCQUNyQkosT0FBT0ksS0FBUCxDQUFSOzt1QkFFS0EsS0FBUDs7O2dDQUlGLENBQXFCQyxLQUFyQjtvQkFDTUMsV0FBVzswQkFDUDs0QkFDQUYsUUFBUUMsTUFBTUUsS0FBTixFQUFaOytCQUNPLEVBQUVDLE1BQU1KLFVBQVV4QixTQUFsQixFQUE2QndCLE9BQU9BLEtBQXBDLEVBQVA7O2lCQUhKO29CQU9JdEIsUUFBUTJCLFFBQVosRUFBc0I7NkJBQ1gxQixPQUFPdUIsUUFBaEIsSUFBNEI7K0JBQ25CQSxRQUFQO3FCQURGOzt1QkFLS0EsUUFBUDs7NEJBR0YsQ0FBaUJJLE9BQWpCO3FCQUNPQyxHQUFMLEdBQVcsRUFBWDtvQkFFSUQsbUJBQW1CRSxPQUF2QixFQUFnQzs0QkFDdEJDLE9BQVIsQ0FBZ0IsVUFBU1QsS0FBVCxFQUFnQkwsSUFBaEI7NkJBQ1RlLE1BQUwsQ0FBWWYsSUFBWixFQUFrQkssS0FBbEI7cUJBREYsRUFFRyxJQUZIO2lCQURGLE1BSU8sSUFBSVcsTUFBTUMsT0FBTixDQUFjTixPQUFkLENBQUosRUFBNEI7NEJBQ3pCRyxPQUFSLENBQWdCLFVBQVNJLE1BQVQ7NkJBQ1RILE1BQUwsQ0FBWUcsT0FBTyxDQUFQLENBQVosRUFBdUJBLE9BQU8sQ0FBUCxDQUF2QjtxQkFERixFQUVHLElBRkg7aUJBREssTUFJQSxJQUFJUCxPQUFKLEVBQWE7MkJBQ1hRLG1CQUFQLENBQTJCUixPQUEzQixFQUFvQ0csT0FBcEMsQ0FBNEMsVUFBU2QsSUFBVDs2QkFDckNlLE1BQUwsQ0FBWWYsSUFBWixFQUFrQlcsUUFBUVgsSUFBUixDQUFsQjtxQkFERixFQUVHLElBRkg7OztvQkFNSVIsU0FBUixDQUFrQnVCLE1BQWxCLEdBQTJCLFVBQVNmLElBQVQsRUFBZUssS0FBZjt1QkFDbEJlLGNBQWNwQixJQUFkLENBQVA7d0JBQ1FxQixlQUFlaEIsS0FBZixDQUFSO29CQUNJaUIsV0FBVyxLQUFLVixHQUFMLENBQVNaLElBQVQsQ0FBZjtxQkFDS1ksR0FBTCxDQUFTWixJQUFULElBQWlCc0IsV0FBV0EsV0FBVyxHQUFYLEdBQWlCakIsS0FBNUIsR0FBb0NBLEtBQXJEO2FBSkY7b0JBT1FiLFNBQVIsQ0FBa0IsUUFBbEIsSUFBOEIsVUFBU1EsSUFBVDt1QkFDckIsS0FBS1ksR0FBTCxDQUFTUSxjQUFjcEIsSUFBZCxDQUFULENBQVA7YUFERjtvQkFJUVIsU0FBUixDQUFrQitCLEdBQWxCLEdBQXdCLFVBQVN2QixJQUFUO3VCQUNmb0IsY0FBY3BCLElBQWQsQ0FBUDt1QkFDTyxLQUFLd0IsR0FBTCxDQUFTeEIsSUFBVCxJQUFpQixLQUFLWSxHQUFMLENBQVNaLElBQVQsQ0FBakIsR0FBa0MsSUFBekM7YUFGRjtvQkFLUVIsU0FBUixDQUFrQmdDLEdBQWxCLEdBQXdCLFVBQVN4QixJQUFUO3VCQUNmLEtBQUtZLEdBQUwsQ0FBU2EsY0FBVCxDQUF3QkwsY0FBY3BCLElBQWQsQ0FBeEIsQ0FBUDthQURGO29CQUlRUixTQUFSLENBQWtCa0MsR0FBbEIsR0FBd0IsVUFBUzFCLElBQVQsRUFBZUssS0FBZjtxQkFDakJPLEdBQUwsQ0FBU1EsY0FBY3BCLElBQWQsQ0FBVCxJQUFnQ3FCLGVBQWVoQixLQUFmLENBQWhDO2FBREY7b0JBSVFiLFNBQVIsQ0FBa0JzQixPQUFsQixHQUE0QixVQUFTYSxRQUFULEVBQW1CQyxPQUFuQjtxQkFDckIsSUFBSTVCLElBQVQsSUFBaUIsS0FBS1ksR0FBdEIsRUFBMkI7d0JBQ3JCLEtBQUtBLEdBQUwsQ0FBU2EsY0FBVCxDQUF3QnpCLElBQXhCLENBQUosRUFBbUM7aUNBQ3hCRCxJQUFULENBQWM2QixPQUFkLEVBQXVCLEtBQUtoQixHQUFMLENBQVNaLElBQVQsQ0FBdkIsRUFBdUNBLElBQXZDLEVBQTZDLElBQTdDOzs7YUFITjtvQkFRUVIsU0FBUixDQUFrQnFDLElBQWxCLEdBQXlCO29CQUNuQnZCLFFBQVEsRUFBWjtxQkFDS1EsT0FBTCxDQUFhLFVBQVNULEtBQVQsRUFBZ0JMLElBQWhCOzBCQUNMOEIsSUFBTixDQUFXOUIsSUFBWDtpQkFERjt1QkFHTytCLFlBQVl6QixLQUFaLENBQVA7YUFMRjtvQkFRUWQsU0FBUixDQUFrQndDLE1BQWxCLEdBQTJCO29CQUNyQjFCLFFBQVEsRUFBWjtxQkFDS1EsT0FBTCxDQUFhLFVBQVNULEtBQVQ7MEJBQ0x5QixJQUFOLENBQVd6QixLQUFYO2lCQURGO3VCQUdPMEIsWUFBWXpCLEtBQVosQ0FBUDthQUxGO29CQVFRZCxTQUFSLENBQWtCeUMsT0FBbEIsR0FBNEI7b0JBQ3RCM0IsUUFBUSxFQUFaO3FCQUNLUSxPQUFMLENBQWEsVUFBU1QsS0FBVCxFQUFnQkwsSUFBaEI7MEJBQ0w4QixJQUFOLENBQVcsQ0FBQzlCLElBQUQsRUFBT0ssS0FBUCxDQUFYO2lCQURGO3VCQUdPMEIsWUFBWXpCLEtBQVosQ0FBUDthQUxGO2dCQVFJdkIsUUFBUTJCLFFBQVosRUFBc0I7d0JBQ1psQixTQUFSLENBQWtCUixPQUFPdUIsUUFBekIsSUFBcUNNLFFBQVFyQixTQUFSLENBQWtCeUMsT0FBdkQ7OzZCQUdGLENBQWtCQyxJQUFsQjtvQkFDTUEsS0FBS0MsUUFBVCxFQUFtQjsyQkFDVjFELFFBQVEyRCxNQUFSLENBQWUsSUFBSWpDLFNBQUosQ0FBYyxjQUFkLENBQWYsQ0FBUDs7cUJBRUdnQyxRQUFMLEdBQWdCLElBQWhCOztvQ0FHRixDQUF5QkUsTUFBekI7dUJBQ1MsSUFBSTVELE9BQUosQ0FBWSxVQUFTNkQsT0FBVCxFQUFrQkYsTUFBbEI7MkJBQ1ZHLE1BQVAsR0FBZ0I7Z0NBQ05GLE9BQU9HLE1BQWY7cUJBREY7MkJBR09DLE9BQVAsR0FBaUI7K0JBQ1JKLE9BQU9LLEtBQWQ7cUJBREY7aUJBSkssQ0FBUDs7MENBVUYsQ0FBK0JDLElBQS9CO29CQUNNTixTQUFTLElBQUlPLFVBQUosRUFBYjtvQkFDSUMsVUFBVUMsZ0JBQWdCVCxNQUFoQixDQUFkO3VCQUNPVSxpQkFBUCxDQUF5QkosSUFBekI7dUJBQ09FLE9BQVA7O21DQUdGLENBQXdCRixJQUF4QjtvQkFDTU4sU0FBUyxJQUFJTyxVQUFKLEVBQWI7b0JBQ0lDLFVBQVVDLGdCQUFnQlQsTUFBaEIsQ0FBZDt1QkFDT1csVUFBUCxDQUFrQkwsSUFBbEI7dUJBQ09FLE9BQVA7OzBDQUdGLENBQStCSSxHQUEvQjtvQkFDTUMsT0FBTyxJQUFJQyxVQUFKLENBQWVGLEdBQWYsQ0FBWDtvQkFDSUcsUUFBUSxJQUFJcEMsS0FBSixDQUFVa0MsS0FBS0csTUFBZixDQUFaO3FCQUVLLElBQUlDLElBQUksQ0FBYixFQUFnQkEsSUFBSUosS0FBS0csTUFBekIsRUFBaUNDLEdBQWpDLEVBQXNDOzBCQUM5QkEsQ0FBTixJQUFXckQsT0FBT3NELFlBQVAsQ0FBb0JMLEtBQUtJLENBQUwsQ0FBcEIsQ0FBWDs7dUJBRUtGLE1BQU1JLElBQU4sQ0FBVyxFQUFYLENBQVA7O2dDQUdGLENBQXFCUCxHQUFyQjtvQkFDTUEsSUFBSVEsS0FBUixFQUFlOzJCQUNOUixJQUFJUSxLQUFKLENBQVUsQ0FBVixDQUFQO2lCQURGLE1BRU87d0JBQ0RQLE9BQU8sSUFBSUMsVUFBSixDQUFlRixJQUFJUyxVQUFuQixDQUFYO3lCQUNLaEMsR0FBTCxDQUFTLElBQUl5QixVQUFKLENBQWVGLEdBQWYsQ0FBVDsyQkFDT0MsS0FBS1MsTUFBWjs7O3lCQUlKO3FCQUNPeEIsUUFBTCxHQUFnQixLQUFoQjtxQkFFS3lCLFNBQUwsR0FBaUIsVUFBUzFCLElBQVQ7eUJBQ1YyQixTQUFMLEdBQWlCM0IsSUFBakI7d0JBQ0ksQ0FBQ0EsSUFBTCxFQUFXOzZCQUNKNEIsU0FBTCxHQUFpQixFQUFqQjtxQkFERixNQUVPLElBQUksT0FBTzVCLElBQVAsS0FBZ0IsUUFBcEIsRUFBOEI7NkJBQzlCNEIsU0FBTCxHQUFpQjVCLElBQWpCO3FCQURLLE1BRUEsSUFBSW5ELFFBQVE0RCxJQUFSLElBQWdCMUQsS0FBS08sU0FBTCxDQUFlQyxhQUFmLENBQTZCeUMsSUFBN0IsQ0FBcEIsRUFBd0Q7NkJBQ3hENkIsU0FBTCxHQUFpQjdCLElBQWpCO3FCQURLLE1BRUEsSUFDTG5ELFFBQVFpRixRQUFSLElBQ0FDLFNBQVN6RSxTQUFULENBQW1CQyxhQUFuQixDQUFpQ3lDLElBQWpDLENBRkssRUFHTDs2QkFDS2dDLGFBQUwsR0FBcUJoQyxJQUFyQjtxQkFKSyxNQUtBLElBQ0xuRCxRQUFRb0YsWUFBUixJQUNBQyxnQkFBZ0I1RSxTQUFoQixDQUEwQkMsYUFBMUIsQ0FBd0N5QyxJQUF4QyxDQUZLLEVBR0w7NkJBQ0s0QixTQUFMLEdBQWlCNUIsS0FBS3BDLFFBQUwsRUFBakI7cUJBSkssTUFLQSxJQUFJZixRQUFRSSxXQUFSLElBQXVCSixRQUFRNEQsSUFBL0IsSUFBdUN0RCxXQUFXNkMsSUFBWCxDQUEzQyxFQUE2RDs2QkFDN0RtQyxnQkFBTCxHQUF3QkMsWUFBWXBDLEtBQUt5QixNQUFqQixDQUF4Qjs7NkJBRUtFLFNBQUwsR0FBaUIsSUFBSTVFLElBQUosQ0FBUyxDQUFDLEtBQUtvRixnQkFBTixDQUFULENBQWpCO3FCQUhLLE1BSUEsSUFDTHRGLFFBQVFJLFdBQVIsS0FDQ1EsWUFBWUgsU0FBWixDQUFzQkMsYUFBdEIsQ0FBb0N5QyxJQUFwQyxLQUNDeEMsa0JBQWtCd0MsSUFBbEIsQ0FGRixDQURLLEVBSUw7NkJBQ0ttQyxnQkFBTCxHQUF3QkMsWUFBWXBDLElBQVosQ0FBeEI7cUJBTEssTUFNQTs4QkFDQyxJQUFJcUMsS0FBSixDQUFVLDJCQUFWLENBQU47O3dCQUdFLENBQUMsS0FBSzVELE9BQUwsQ0FBYVksR0FBYixDQUFpQixjQUFqQixDQUFMLEVBQXVDOzRCQUNqQyxPQUFPVyxJQUFQLEtBQWdCLFFBQXBCLEVBQThCO2lDQUN2QnZCLE9BQUwsQ0FBYWUsR0FBYixDQUFpQixjQUFqQixFQUFpQywwQkFBakM7eUJBREYsTUFFTyxJQUFJLEtBQUtxQyxTQUFMLElBQWtCLEtBQUtBLFNBQUwsQ0FBZVMsSUFBckMsRUFBMkM7aUNBQzNDN0QsT0FBTCxDQUFhZSxHQUFiLENBQWlCLGNBQWpCLEVBQWlDLEtBQUtxQyxTQUFMLENBQWVTLElBQWhEO3lCQURLLE1BRUEsSUFDTHpGLFFBQVFvRixZQUFSLElBQ0FDLGdCQUFnQjVFLFNBQWhCLENBQTBCQyxhQUExQixDQUF3Q3lDLElBQXhDLENBRkssRUFHTDtpQ0FDS3ZCLE9BQUwsQ0FBYWUsR0FBYixDQUNFLGNBREYsRUFFRSxpREFGRjs7O2lCQXpDTjtvQkFpREkzQyxRQUFRNEQsSUFBWixFQUFrQjt5QkFDWEEsSUFBTCxHQUFZOzRCQUNOOEIsV0FBV0MsU0FBUyxJQUFULENBQWY7NEJBQ0lELFFBQUosRUFBYzttQ0FDTEEsUUFBUDs7NEJBR0UsS0FBS1YsU0FBVCxFQUFvQjttQ0FDWHRGLFFBQVE2RCxPQUFSLENBQWdCLEtBQUt5QixTQUFyQixDQUFQO3lCQURGLE1BRU8sSUFBSSxLQUFLTSxnQkFBVCxFQUEyQjttQ0FDekI1RixRQUFRNkQsT0FBUixDQUFnQixJQUFJckQsSUFBSixDQUFTLENBQUMsS0FBS29GLGdCQUFOLENBQVQsQ0FBaEIsQ0FBUDt5QkFESyxNQUVBLElBQUksS0FBS0gsYUFBVCxFQUF3QjtrQ0FDdkIsSUFBSUssS0FBSixDQUFVLHNDQUFWLENBQU47eUJBREssTUFFQTttQ0FDRTlGLFFBQVE2RCxPQUFSLENBQWdCLElBQUlyRCxJQUFKLENBQVMsQ0FBQyxLQUFLNkUsU0FBTixDQUFULENBQWhCLENBQVA7O3FCQWJKO3lCQWlCSzNFLFdBQUwsR0FBbUI7NEJBQ2IsS0FBS2tGLGdCQUFULEVBQTJCO21DQUNsQkssU0FBUyxJQUFULEtBQWtCakcsUUFBUTZELE9BQVIsQ0FBZ0IsS0FBSytCLGdCQUFyQixDQUF6Qjt5QkFERixNQUVPO21DQUNFLEtBQUsxQixJQUFMLEdBQVlnQyxJQUFaLENBQWlCQyxxQkFBakIsQ0FBUDs7cUJBSko7O3FCQVNHQyxJQUFMLEdBQVk7d0JBQ05KLFdBQVdDLFNBQVMsSUFBVCxDQUFmO3dCQUNJRCxRQUFKLEVBQWM7K0JBQ0xBLFFBQVA7O3dCQUdFLEtBQUtWLFNBQVQsRUFBb0I7K0JBQ1hlLGVBQWUsS0FBS2YsU0FBcEIsQ0FBUDtxQkFERixNQUVPLElBQUksS0FBS00sZ0JBQVQsRUFBMkI7K0JBQ3pCNUYsUUFBUTZELE9BQVIsQ0FDTHlDLHNCQUFzQixLQUFLVixnQkFBM0IsQ0FESyxDQUFQO3FCQURLLE1BSUEsSUFBSSxLQUFLSCxhQUFULEVBQXdCOzhCQUN2QixJQUFJSyxLQUFKLENBQVUsc0NBQVYsQ0FBTjtxQkFESyxNQUVBOytCQUNFOUYsUUFBUTZELE9BQVIsQ0FBZ0IsS0FBS3dCLFNBQXJCLENBQVA7O2lCQWZKO29CQW1CSS9FLFFBQVFpRixRQUFaLEVBQXNCO3lCQUNmQSxRQUFMLEdBQWdCOytCQUNQLEtBQUthLElBQUwsR0FBWUYsSUFBWixDQUFpQkssTUFBakIsQ0FBUDtxQkFERjs7cUJBS0dDLElBQUwsR0FBWTsyQkFDSCxLQUFLSixJQUFMLEdBQVlGLElBQVosQ0FBaUJPLEtBQUtDLEtBQXRCLENBQVA7aUJBREY7dUJBSU8sSUFBUDs7O2dCQUlFQyxVQUFVLENBQUMsUUFBRCxFQUFXLEtBQVgsRUFBa0IsTUFBbEIsRUFBMEIsU0FBMUIsRUFBcUMsTUFBckMsRUFBNkMsS0FBN0MsQ0FBZDtvQ0FFQSxDQUF5QkMsTUFBekI7b0JBQ01DLFVBQVVELE9BQU9FLFdBQVAsRUFBZDt1QkFDT0gsUUFBUXZGLE9BQVIsQ0FBZ0J5RixPQUFoQixJQUEyQixDQUFDLENBQTVCLEdBQWdDQSxPQUFoQyxHQUEwQ0QsTUFBakQ7OzRCQUdGLENBQWlCRyxLQUFqQixFQUF3Qm5ILE9BQXhCOzBCQUNZQSxXQUFXLEVBQXJCO29CQUNJNkQsT0FBTzdELFFBQVE2RCxJQUFuQjtvQkFFSXNELGlCQUFpQkMsT0FBckIsRUFBOEI7d0JBQ3hCRCxNQUFNckQsUUFBVixFQUFvQjs4QkFDWixJQUFJaEMsU0FBSixDQUFjLGNBQWQsQ0FBTjs7eUJBRUd1RixHQUFMLEdBQVdGLE1BQU1FLEdBQWpCO3lCQUNLQyxXQUFMLEdBQW1CSCxNQUFNRyxXQUF6Qjt3QkFDSSxDQUFDdEgsUUFBUXNDLE9BQWIsRUFBc0I7NkJBQ2ZBLE9BQUwsR0FBZSxJQUFJRSxPQUFKLENBQVkyRSxNQUFNN0UsT0FBbEIsQ0FBZjs7eUJBRUcwRSxNQUFMLEdBQWNHLE1BQU1ILE1BQXBCO3lCQUNLTyxJQUFMLEdBQVlKLE1BQU1JLElBQWxCO3dCQUNJLENBQUMxRCxJQUFELElBQVNzRCxNQUFNM0IsU0FBTixJQUFtQixJQUFoQyxFQUFzQzsrQkFDN0IyQixNQUFNM0IsU0FBYjs4QkFDTTFCLFFBQU4sR0FBaUIsSUFBakI7O2lCQWJKLE1BZU87eUJBQ0F1RCxHQUFMLEdBQVd6RixPQUFPdUYsS0FBUCxDQUFYOztxQkFHR0csV0FBTCxHQUFtQnRILFFBQVFzSCxXQUFSLElBQXVCLEtBQUtBLFdBQTVCLElBQTJDLE1BQTlEO29CQUNJdEgsUUFBUXNDLE9BQVIsSUFBbUIsQ0FBQyxLQUFLQSxPQUE3QixFQUFzQzt5QkFDL0JBLE9BQUwsR0FBZSxJQUFJRSxPQUFKLENBQVl4QyxRQUFRc0MsT0FBcEIsQ0FBZjs7cUJBRUcwRSxNQUFMLEdBQWNRLGdCQUFnQnhILFFBQVFnSCxNQUFSLElBQWtCLEtBQUtBLE1BQXZCLElBQWlDLEtBQWpELENBQWQ7cUJBQ0tPLElBQUwsR0FBWXZILFFBQVF1SCxJQUFSLElBQWdCLEtBQUtBLElBQXJCLElBQTZCLElBQXpDO3FCQUNLRSxRQUFMLEdBQWdCLElBQWhCO29CQUVJLENBQUMsS0FBS1QsTUFBTCxLQUFnQixLQUFoQixJQUF5QixLQUFLQSxNQUFMLEtBQWdCLE1BQTFDLEtBQXFEbkQsSUFBekQsRUFBK0Q7MEJBQ3ZELElBQUkvQixTQUFKLENBQWMsMkNBQWQsQ0FBTjs7cUJBRUd5RCxTQUFMLENBQWUxQixJQUFmOztvQkFHTTFDLFNBQVIsQ0FBa0J1RyxLQUFsQixHQUEwQjt1QkFDakIsSUFBSU4sT0FBSixDQUFZLElBQVosRUFBa0IsRUFBRXZELE1BQU0sS0FBSzJCLFNBQWIsRUFBbEIsQ0FBUDthQURGOzJCQUlBLENBQWdCM0IsSUFBaEI7b0JBQ004RCxPQUFPLElBQUkvQixRQUFKLEVBQVg7cUJBRUdnQyxJQURILEdBRUdDLEtBRkgsQ0FFUyxHQUZULEVBR0dwRixPQUhILENBR1csVUFBU3FGLEtBQVQ7d0JBQ0hBLEtBQUosRUFBVzs0QkFDTEQsUUFBUUMsTUFBTUQsS0FBTixDQUFZLEdBQVosQ0FBWjs0QkFDSWxHLE9BQU9rRyxNQUFNMUYsS0FBTixHQUFjNEYsT0FBZCxDQUFzQixLQUF0QixFQUE2QixHQUE3QixDQUFYOzRCQUNJL0YsUUFBUTZGLE1BQU0xQyxJQUFOLENBQVcsR0FBWCxFQUFnQjRDLE9BQWhCLENBQXdCLEtBQXhCLEVBQStCLEdBQS9CLENBQVo7NkJBQ0tyRixNQUFMLENBQVlzRixtQkFBbUJyRyxJQUFuQixDQUFaLEVBQXNDcUcsbUJBQW1CaEcsS0FBbkIsQ0FBdEM7O2lCQVJOO3VCQVdPMkYsSUFBUDs7aUNBR0YsQ0FBc0JNLFVBQXRCO29CQUNNM0YsVUFBZSxJQUFJRSxPQUFKLENBQVksRUFBWixDQUFuQjsyQkFDV3FGLEtBQVgsQ0FBaUIsT0FBakIsRUFBMEJwRixPQUExQixDQUFrQyxVQUFTeUYsSUFBVDt3QkFDNUJDLFFBQVFELEtBQUtMLEtBQUwsQ0FBVyxHQUFYLENBQVo7d0JBQ0lPLE1BQU1ELE1BQU1oRyxLQUFOLEdBQWN5RixJQUFkLEVBQVY7d0JBQ0lRLEdBQUosRUFBUzs0QkFDSHBHLFFBQVFtRyxNQUFNaEQsSUFBTixDQUFXLEdBQVgsRUFBZ0J5QyxJQUFoQixFQUFaO2dDQUNRbEYsTUFBUixDQUFlMEYsR0FBZixFQUFvQnBHLEtBQXBCOztpQkFMSjt1QkFRT00sT0FBUDs7aUJBR0daLElBQUwsQ0FBVTBGLFFBQVFqRyxTQUFsQjtnQkFFSWtILFdBQWdCLFNBQWhCQSxRQUFnQixDQUFTQyxRQUFULEVBQW1CdEksT0FBbkI7b0JBQ2QsQ0FBQ0EsT0FBTCxFQUFjOzhCQUNGLEVBQVY7O3FCQUdHbUcsSUFBTCxHQUFZLFNBQVo7cUJBQ0tvQyxNQUFMLEdBQWMsWUFBWXZJLE9BQVosR0FBc0JBLFFBQVF1SSxNQUE5QixHQUF1QyxHQUFyRDtxQkFDS0MsRUFBTCxHQUFVLEtBQUtELE1BQUwsSUFBZSxHQUFmLElBQXNCLEtBQUtBLE1BQUwsR0FBYyxHQUE5QztxQkFDS0UsVUFBTCxHQUFrQixnQkFBZ0J6SSxPQUFoQixHQUEwQkEsUUFBUXlJLFVBQWxDLEdBQStDLElBQWpFO3FCQUNLbkcsT0FBTCxHQUFlLElBQUlFLE9BQUosQ0FBWXhDLFFBQVFzQyxPQUFwQixDQUFmO3FCQUNLK0UsR0FBTCxHQUFXckgsUUFBUXFILEdBQVIsSUFBZSxFQUExQjtxQkFDSzlCLFNBQUwsQ0FBZStDLFFBQWY7YUFYRjtpQkFjSzVHLElBQUwsQ0FBVTJHLFNBQVNsSCxTQUFuQjtxQkFFU0EsU0FBVCxDQUFtQnVHLEtBQW5CLEdBQTJCO3VCQUNsQixJQUFJVyxRQUFKLENBQWEsS0FBSzdDLFNBQWxCLEVBQTZCOzRCQUMxQixLQUFLK0MsTUFEcUI7Z0NBRXRCLEtBQUtFLFVBRmlCOzZCQUd6QixJQUFJakcsT0FBSixDQUFZLEtBQUtGLE9BQWpCLENBSHlCO3lCQUk3QixLQUFLK0U7aUJBSkwsQ0FBUDthQURGO3FCQVNTaEQsS0FBVCxHQUFpQjtvQkFDWHFFLFdBQVcsSUFBSUwsUUFBSixDQUFhLElBQWIsRUFBbUIsRUFBRUUsUUFBUSxDQUFWLEVBQWFFLFlBQVksRUFBekIsRUFBbkIsQ0FBZjt5QkFDU3RDLElBQVQsR0FBZ0IsT0FBaEI7dUJBQ091QyxRQUFQO2FBSEY7Z0JBTUlDLG1CQUFtQixDQUFDLEdBQUQsRUFBTSxHQUFOLEVBQVcsR0FBWCxFQUFnQixHQUFoQixFQUFxQixHQUFyQixDQUF2QjtxQkFFU0MsUUFBVCxHQUFvQixVQUFTdkIsR0FBVCxFQUFja0IsTUFBZDtvQkFDZEksaUJBQWlCbkgsT0FBakIsQ0FBeUIrRyxNQUF6QixNQUFxQyxDQUFDLENBQTFDLEVBQTZDOzBCQUNyQyxJQUFJTSxVQUFKLENBQWUscUJBQWYsQ0FBTjs7dUJBR0ssSUFBSVIsUUFBSixDQUFhLElBQWIsRUFBbUI7NEJBQ2hCRSxNQURnQjs2QkFFZixFQUFFTyxVQUFVekIsR0FBWjtpQkFGSixDQUFQO2FBTEY7aUJBV0s3RSxPQUFMLEdBQWVBLE9BQWY7aUJBQ0s0RSxPQUFMLEdBQWVBLE9BQWY7aUJBQ0tpQixRQUFMLEdBQWdCQSxRQUFoQjtpQkFFSzVILEtBQUwsR0FBYSxVQUFTMEcsS0FBVCxFQUFnQjRCLElBQWhCO3VCQUNKLElBQUkzSSxPQUFKLENBQVksVUFBUzZELE9BQVQsRUFBa0JGLE1BQWxCO3dCQUNiaUYsVUFBVSxJQUFJNUIsT0FBSixDQUFZRCxLQUFaLEVBQW1CNEIsSUFBbkIsQ0FBZDt3QkFDSUUsTUFBTSxJQUFJNUksY0FBSixFQUFWO3dCQUVJNkQsTUFBSixHQUFhOzRCQUNQbEUsVUFLQTtvQ0FDTWlKLElBQUlWLE1BRFY7d0NBRVVVLElBQUlSLFVBRmQ7cUNBR09TLGFBQWFELElBQUlFLHFCQUFKLE1BQStCLEVBQTVDO3lCQVJYO2dDQVVROUIsR0FBUixHQUNFLGlCQUFpQjRCLEdBQWpCLEdBQ0lBLElBQUlHLFdBRFIsR0FFSXBKLFFBQVFzQyxPQUFSLENBQWdCWSxHQUFoQixDQUFvQixlQUFwQixDQUhOOzRCQUlJVyxPQUFPLGNBQWNvRixHQUFkLEdBQW9CQSxJQUFJUCxRQUF4QixHQUFtQ08sSUFBSUksWUFBbEQ7Z0NBQ1EsSUFBSWhCLFFBQUosQ0FBYXhFLElBQWIsRUFBbUI3RCxPQUFuQixDQUFSO3FCQWhCRjt3QkFtQklvRSxPQUFKLEdBQWM7K0JBQ0wsSUFBSXRDLFNBQUosQ0FBYyx3QkFBZCxDQUFQO3FCQURGO3dCQUlJd0gsU0FBSixHQUFnQjsrQkFDUCxJQUFJeEgsU0FBSixDQUFjLHdCQUFkLENBQVA7cUJBREY7d0JBSUl5SCxJQUFKLENBQVNQLFFBQVFoQyxNQUFqQixFQUF5QmdDLFFBQVEzQixHQUFqQyxFQUFzQyxJQUF0Qzt3QkFFSTJCLFFBQVExQixXQUFSLEtBQXdCLFNBQTVCLEVBQXVDOzRCQUNqQ2tDLGVBQUosR0FBc0IsSUFBdEI7O3dCQUdFLGtCQUFrQlAsR0FBbEIsSUFBeUJ2SSxRQUFRNEQsSUFBckMsRUFBMkM7NEJBQ3JDbUYsWUFBSixHQUFtQixNQUFuQjs7NEJBR01uSCxPQUFSLENBQWdCRyxPQUFoQixDQUF3QixVQUFTVCxLQUFULEVBQWdCTCxJQUFoQjs0QkFDbEIrSCxnQkFBSixDQUFxQi9ILElBQXJCLEVBQTJCSyxLQUEzQjtxQkFERjt3QkFJSTJILElBQUosQ0FDRSxPQUFPWCxRQUFReEQsU0FBZixLQUE2QixXQUE3QixHQUEyQyxJQUEzQyxHQUFrRHdELFFBQVF4RCxTQUQ1RDtpQkE3Q0ssQ0FBUDthQURGO2lCQW1ESy9FLEtBQUwsQ0FBV21KLFFBQVgsR0FBc0IsSUFBdEI7U0EzZkYsRUE0ZkcsT0FBTzFKLElBQVAsS0FBZ0IsV0FBaEIsR0FBOEJBLElBQTlCLEdBQXFDLElBNWZ4QztlQThmTzttQkFDRUEsS0FBS08sS0FEUDtxQkFFSVAsS0FBS3NDLE9BRlQ7cUJBR0l0QyxLQUFLa0gsT0FIVDtzQkFJS2xILEtBQUttSTtTQUpqQjtLQXRnQkssRUFBUDtDQVJGOzs7Ozs7QUNSQTs7Ozs7Ozs7O0FBaUNFOzs7UUFBY3dCLGdCQUFBQTtRQUFVN0osZUFBQUE7UUFBUzZELFlBQUFBOzs7Ozs7Ozs7Ozs7NEJBYXpCLEdBQXNCO1lBQ3hCLENBQUMsTUFBS0EsSUFBTixJQUFjLE1BQUs3RCxPQUFMLENBQWFnSCxNQUFiLEtBQXdCLE1BQTFDLEVBQWtEO2tCQUMzQ25ELElBQUwsR0FBWSxJQUFJK0IsUUFBSixFQUFaOztlQUVLLE1BQUsvQixJQUFaO0tBSk07Ozs7Ozs7Ozs7YUFlRCxHQUFPO3dGQUFpQyxFQUFFaUcsT0FBTyxLQUFUO1lBQTlCQSxjQUFBQTs7b0JBQ0c3SixTQUNkQSxPQUFPUSxLQUFQLEdBQWVSLE1BQWYsR0FBd0JGLGNBQWMsRUFBZCxFQUFrQlUsS0FENUIsR0FFZDttQkFDUzt3QkFDR3NKLElBQVIsQ0FBYSx3QkFBYjs7O1lBSkF0SixjQUFBQTs7WUFPRnVKLGtCQUFrQixTQUN0QixFQURzQixFQUV0QixNQUFLQyxtQkFBTCxFQUZzQixFQUd0QixNQUFLakssT0FIaUIsQ0FBeEI7WUFLTWtLLFlBQVl6SixNQUFNLE1BQUtvSixRQUFYLEVBQXFCRyxlQUFyQixDQUFsQjtlQUNPRixRQUFRSSxVQUFVNUQsSUFBVixDQUFlO21CQUFPNkQsSUFBSXZELElBQUosRUFBUDtTQUFmLENBQVIsR0FBNENzRCxTQUFuRDtLQWRLO1NBM0JBTCxRQUFMLEdBQWdCQSxRQUFoQjtTQUNLN0osT0FBTCxHQUFlQSxXQUFXb0gsUUFBUWdELGNBQWxDO1NBQ0t2RyxJQUFMLEdBQVlBLElBQVo7Ozs7Ozs7Ozs7QUFoQkt1RCxzQkFBQSxHQUE4QjtZQUMzQixLQUQyQjthQUUxQixFQUFFaUQsUUFBUSxrQkFBVjtDQUZKOztBQ3BCVDs7Ozs7Ozs7OztBQWFBLElBQU1DLGlCQUFpQixTQUFqQkEsY0FBaUIsQ0FBQ0MsSUFBRCxFQUF1QkMsVUFBdkI7TUFDakJDLGFBQWFELFVBQWpCO09BQ0svSCxPQUFMLENBQWE7aUJBQ0VnSSxXQUFXckMsR0FBWCxDQUFiO0dBREY7U0FHT3FDLGFBQWFBLFVBQWIsR0FBMEIsS0FBakM7Q0FMRjs7Ozs7Ozs7Ozs7Ozs7QUNGQSxJQUFNQyxTQUFTLFNBQVRBLE1BQVM7UUFBQ3JELEdBQUQsdUVBQWVwSCxPQUFPNkksUUFBUCxDQUFnQjZCLE1BQS9CO1dBQ2J0RCxJQUNHUSxLQURILENBQ1MsR0FEVCxFQUNjLENBRGQsRUFFR0EsS0FGSCxDQUVTLEdBRlQsRUFHR3RGLEdBSEgsQ0FHTztlQUFLcUksRUFBRS9DLEtBQUYsQ0FBUSxHQUFSLENBQUw7S0FIUCxFQUlHZ0QsTUFKSCxDQUlVLFVBQUNDLEdBQUQsUUFBa0I3RixDQUFsQixFQUFxQjhGLEdBQXJCOztZQUFPM0M7WUFBSzRDOztZQUNkNUMsR0FBSixJQUFXSixtQkFBbUJnRCxHQUFuQixFQUF3QmpELE9BQXhCLENBQWdDLEtBQWhDLEVBQXVDLEdBQXZDLENBQVg7ZUFDTytDLEdBQVA7S0FOSixFQU9LLEVBUEwsQ0FEYTtDQUFmOzs7Ozs7Ozs7O0FBbUJBLElBQU1HLDZCQUE2QixTQUE3QkEsMEJBQTZCLENBQUNDLE1BQUQ7UUFDM0JDLFVBQWtCLDBCQUF4QjtRQUNJRCxPQUFPUCxNQUFQLENBQWNRLE9BQWQsSUFBeUIsQ0FBQyxDQUE5QixFQUFpQztlQUN4QkQsT0FBT25ELE9BQVAsQ0FDTG9ELE9BREssRUFFTCwrREFGSyxDQUFQO0tBREYsTUFLTztlQUNFRCxNQUFQOztDQVJKOztBQzlCQTs7Ozs7Ozs7Ozs7Ozs7OztBQWlCQSw0QkFBQTtRQUNXRSxrQkFBVEM7UUFDV0Msb0JBQVhDOztRQUtNQyxnQkFFRjttQkFDUztLQUhiO1FBTU1DLFdBQVc7bUJBQ0pILGdCQUFnQkUsY0FBY0Q7S0FEM0M7UUFJTUcsT0FBNkJOLFdBQVdPLHFCQUFYLEVBQW5DO1FBRU1DLGlCQUF5QkMsS0FBS0MsR0FBTCxDQUM3QkMsU0FBU0MsZUFBVCxDQUF5QkMsWUFESSxFQUU3QmhNLE9BQU9pTSxXQUFQLElBQXNCLENBRk8sQ0FBL0I7UUFJUVgsWUFBY0UsU0FBZEY7O1FBRUpBLFlBQVksQ0FBWixJQUFpQkEsWUFBWSxDQUFqQyxFQUFvQztjQUM1QixJQUFJMUMsVUFBSixDQUNKLHNEQURJLENBQU47OztRQU1FNkMsS0FBS1MsTUFBTCxJQUFlWixZQUFZSyxjQUEvQixFQUErQztZQUUzQ0YsS0FBS1UsR0FBTCxHQUFXUixjQUFYLElBQTZCTCxZQUFZSyxjQUFaLEdBQTZCLENBQUMsQ0FBM0QsSUFDQUYsS0FBS1csTUFBTCxJQUFlZCxZQUFZSyxjQUY3QixFQUdFO21CQUNPLElBQVA7U0FKRixNQUtPO21CQUNFLEtBQVA7O0tBUEosTUFTTzs7WUFFREYsS0FBS1UsR0FBTCxJQUFZLENBQVosSUFBaUJWLEtBQUtXLE1BQUwsR0FBY1QsY0FBZCxJQUFnQyxDQUFyRCxFQUF3RDttQkFDL0MsSUFBUDtTQURGLE1BRU87bUJBQ0UsS0FBUDs7Ozs7Ozs7Ozs7Ozs7QUFlTixpQkFBQSxDQUFrQlAsT0FBbEIsRUFBb0NpQixFQUFwQyxFQUFnREMsUUFBaEQ7UUFDTUEsWUFBWSxDQUFoQixFQUFtQjtRQUNiQyxhQUFxQkYsS0FBS2pCLFFBQVFvQixTQUF4QztRQUNNQyxVQUFrQkYsYUFBYUQsUUFBYixHQUF3QixFQUFoRDtlQUVXO2dCQUNERSxTQUFSLEdBQW9CcEIsUUFBUW9CLFNBQVIsR0FBb0JDLE9BQXhDO1lBQ0lyQixRQUFRb0IsU0FBUixLQUFzQkgsRUFBMUIsRUFBOEI7aUJBQ3JCakIsT0FBVCxFQUFrQmlCLEVBQWxCLEVBQXNCQyxXQUFXLEVBQWpDO0tBSEYsRUFJRyxFQUpIOzs7Ozs7Ozs7Ozs7OztBQ3pFRixJQUFNSSxTQUFtQixTQUFuQkEsTUFBbUIsQ0FBQ0MsS0FBRDtTQUN2QmIsU0FBU2MsYUFBVCxDQUF1QkQsS0FBdkIsQ0FEdUI7Q0FBekI7Ozs7Ozs7QUFTQSxJQUFNRSxZQUFzQixTQUF0QkEsU0FBc0IsQ0FBQ0YsS0FBRDtzQ0FDdkJiLFNBQVNnQixnQkFBVCxDQUEwQkgsS0FBMUIsQ0FEdUI7Q0FBNUI7Ozs7Ozs7QUFVQSxJQUFNSSxhQUF1QixTQUF2QkEsVUFBdUIsQ0FBQ0MsRUFBRDtTQUMzQmxCLFNBQVNtQixjQUFULENBQXdCRCxFQUF4QixDQUQyQjtDQUE3Qjs7Ozs7Ozs7Ozs7OztBQ25CQSxJQUFNRSxhQUFhLFNBQWJBLFVBQWEsQ0FBQ2pDLE1BQUQ7U0FDakJBLE9BQ0dyRCxLQURILENBQ1MsR0FEVCxFQUVHdEYsR0FGSCxDQUVPO1dBQUs2SyxRQUFRQyxDQUFSLENBQUw7R0FGUCxFQUdHbEksSUFISCxDQUdRLEdBSFIsQ0FEaUI7Q0FBbkI7Ozs7Ozs7OztBQWNBLElBQU1tSSxVQUFVLFNBQVZBLE9BQVUsQ0FBQ0MsVUFBRDtNQUFxQkMsU0FBckIsdUVBQXlDLEdBQXpDO1NBQ2RELFdBQ0d4RixPQURILENBQ1csa0RBRFgsRUFDK0QsRUFEL0QsRUFFR0EsT0FGSCxDQUVXLG9CQUZYLFNBRXNDeUYsU0FGdEMsU0FHR3pMLFdBSEgsRUFEYztDQUFoQjs7Ozs7OztBQVlBLElBQU02RixPQUFPLFNBQVBBLElBQU8sQ0FBQ3NELE1BQUQ7U0FBNEJBLE9BQU9uRCxPQUFQLENBQWUsWUFBZixFQUE2QixFQUE3QixDQUE1QjtDQUFiOzs7Ozs7O0FBUUEsSUFBTXFGLFVBQVUsU0FBVkEsT0FBVTs7TUFBRUssV0FBRjtNQUFrQkMsV0FBbEI7O2NBQ1hELFlBQVl2RyxXQUFaLEVBRFcsR0FDaUJ3RyxZQUFZdkksSUFBWixDQUFpQixFQUFqQixDQURqQjtDQUFoQjs7OzsifQ==
