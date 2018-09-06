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

export { Request, capitalize, isElementInViewport, parseExternalMarkdownLinks, params as parseURLParams, scrollTo, searchPropPath, select, selectAll, selectById, slugify, trim, ucFirst };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW0uZXNtLmRldi5qcyIsInNvdXJjZXMiOlsiLi4vc3JjL3ZlbmRvci9mZXRjaFBvbnlmaWxsLnRzIiwiLi4vc3JjL2NsYXNzZXMvUmVxdWVzdC50cyIsIi4uL3NyYy9mdW5jdGlvbnMvZGF0YU1hbmlwdWxhdGlvbi50cyIsIi4uL3NyYy9mdW5jdGlvbnMvcGFyc2UudHMiLCIuLi9zcmMvZnVuY3Rpb25zL3Njcm9sbC50cyIsIi4uL3NyYy9mdW5jdGlvbnMvc2VsZWN0LnRzIiwiLi4vc3JjL2Z1bmN0aW9ucy90eXBvZ3JhcGh5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQ29waWVkIGZyb20gbm9kZV9tb2R1bGVzL2ZldGNoLXBvbnlmaWxsL2J1aWxkL2ZldGNoLWJyb3dzZXIuanMuXG4gKlxuICogVHlwZXMgYWRkZWQgd2hlcmUgbmVjZXNzYXJ5LlxuICpcbiAqIE1vdmVkIG91dCBvZiBJSUZFIG1vZHVsZSB0eXBlLCBwbGFjZWQgYHNlbGZgIGRlY2xhcmF0aW9uIHRvIHRvcFxuICogb2YgYGZldGNoUG9ueWZpbGxgIGZ1bmN0aW9uIHNjb3BlLlxuICovXG5jb25zdCBmZXRjaFBvbnlmaWxsID0gZnVuY3Rpb24gZmV0Y2hQb255ZmlsbChvcHRpb25zKSB7XG4gIHZhciB3aW5kb3cgPSB3aW5kb3cgPyB3aW5kb3cgOiBmYWxzZTtcbiAgdmFyIHNlbGYgPSB0eXBlb2Ygc2VsZiA9PT0gXCJ1bmRlZmluZWRcIiA/ICh3aW5kb3cgPyB3aW5kb3cgOiBnbG9iYWwpIDogc2VsZjtcbiAgdmFyIFByb21pc2UgPSAob3B0aW9ucyAmJiBvcHRpb25zLlByb21pc2UpIHx8IHNlbGYuUHJvbWlzZTtcbiAgdmFyIFhNTEh0dHBSZXF1ZXN0ID1cbiAgICAob3B0aW9ucyAmJiBvcHRpb25zLlhNTEh0dHBSZXF1ZXN0KSB8fCBzZWxmLlhNTEh0dHBSZXF1ZXN0O1xuICB2YXIgZ2xvYmFsID0gc2VsZjtcblxuICByZXR1cm4gKGZ1bmN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gT2JqZWN0LmNyZWF0ZShnbG9iYWwsIHtcbiAgICAgIGZldGNoOiB7XG4gICAgICAgIHZhbHVlOiB1bmRlZmluZWQsXG4gICAgICAgIHdyaXRhYmxlOiB0cnVlXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAoZnVuY3Rpb24oc2VsZikge1xuICAgICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAgIGlmIChzZWxmLmZldGNoKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdmFyIHN1cHBvcnQgPSB7XG4gICAgICAgIHNlYXJjaFBhcmFtczogXCJVUkxTZWFyY2hQYXJhbXNcIiBpbiBzZWxmLFxuICAgICAgICBpdGVyYWJsZTogXCJTeW1ib2xcIiBpbiBzZWxmICYmIFwiaXRlcmF0b3JcIiBpbiBTeW1ib2wsXG4gICAgICAgIGJsb2I6XG4gICAgICAgICAgXCJGaWxlUmVhZGVyXCIgaW4gc2VsZiAmJlxuICAgICAgICAgIFwiQmxvYlwiIGluIHNlbGYgJiZcbiAgICAgICAgICAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICBuZXcgQmxvYigpO1xuICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pKCksXG4gICAgICAgIGZvcm1EYXRhOiBcIkZvcm1EYXRhXCIgaW4gc2VsZixcbiAgICAgICAgYXJyYXlCdWZmZXI6IFwiQXJyYXlCdWZmZXJcIiBpbiBzZWxmXG4gICAgICB9O1xuXG4gICAgICBpZiAoc3VwcG9ydC5hcnJheUJ1ZmZlcikge1xuICAgICAgICB2YXIgdmlld0NsYXNzZXMgPSBbXG4gICAgICAgICAgXCJbb2JqZWN0IEludDhBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgVWludDhBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgVWludDhDbGFtcGVkQXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IEludDE2QXJyYXldXCIsXG4gICAgICAgICAgXCJbb2JqZWN0IFVpbnQxNkFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBJbnQzMkFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBVaW50MzJBcnJheV1cIixcbiAgICAgICAgICBcIltvYmplY3QgRmxvYXQzMkFycmF5XVwiLFxuICAgICAgICAgIFwiW29iamVjdCBGbG9hdDY0QXJyYXldXCJcbiAgICAgICAgXTtcblxuICAgICAgICB2YXIgaXNEYXRhVmlldyA9IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgIHJldHVybiBvYmogJiYgRGF0YVZpZXcucHJvdG90eXBlLmlzUHJvdG90eXBlT2Yob2JqKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgaXNBcnJheUJ1ZmZlclZpZXcgPVxuICAgICAgICAgIEFycmF5QnVmZmVyLmlzVmlldyB8fFxuICAgICAgICAgIGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgICAgb2JqICYmXG4gICAgICAgICAgICAgIHZpZXdDbGFzc2VzLmluZGV4T2YoT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKG9iaikpID4gLTFcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gbm9ybWFsaXplTmFtZShuYW1lKSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIG5hbWUgPSBTdHJpbmcobmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKC9bXmEtejAtOVxcLSMkJSYnKisuXFxeX2B8fl0vaS50ZXN0KG5hbWUpKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkludmFsaWQgY2hhcmFjdGVyIGluIGhlYWRlciBmaWVsZCBuYW1lXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuYW1lLnRvTG93ZXJDYXNlKCk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZVZhbHVlKHZhbHVlKSB7XG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICB2YWx1ZSA9IFN0cmluZyh2YWx1ZSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuXG4gICAgICAvLyBCdWlsZCBhIGRlc3RydWN0aXZlIGl0ZXJhdG9yIGZvciB0aGUgdmFsdWUgbGlzdFxuICAgICAgZnVuY3Rpb24gaXRlcmF0b3JGb3IoaXRlbXMpIHtcbiAgICAgICAgdmFyIGl0ZXJhdG9yID0ge1xuICAgICAgICAgIG5leHQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHZhbHVlID0gaXRlbXMuc2hpZnQoKTtcbiAgICAgICAgICAgIHJldHVybiB7IGRvbmU6IHZhbHVlID09PSB1bmRlZmluZWQsIHZhbHVlOiB2YWx1ZSB9O1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoc3VwcG9ydC5pdGVyYWJsZSkge1xuICAgICAgICAgIGl0ZXJhdG9yW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiBpdGVyYXRvcjtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBIZWFkZXJzKGhlYWRlcnMpIHtcbiAgICAgICAgdGhpcy5tYXAgPSB7fTtcblxuICAgICAgICBpZiAoaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMpIHtcbiAgICAgICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICB9LCB0aGlzKTtcbiAgICAgICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGhlYWRlcnMpKSB7XG4gICAgICAgICAgaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKGhlYWRlcikge1xuICAgICAgICAgICAgdGhpcy5hcHBlbmQoaGVhZGVyWzBdLCBoZWFkZXJbMV0pO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9IGVsc2UgaWYgKGhlYWRlcnMpIHtcbiAgICAgICAgICBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhoZWFkZXJzKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgICAgIHRoaXMuYXBwZW5kKG5hbWUsIGhlYWRlcnNbbmFtZV0pO1xuICAgICAgICAgIH0sIHRoaXMpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLmFwcGVuZCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpO1xuICAgICAgICB2YWx1ZSA9IG5vcm1hbGl6ZVZhbHVlKHZhbHVlKTtcbiAgICAgICAgdmFyIG9sZFZhbHVlID0gdGhpcy5tYXBbbmFtZV07XG4gICAgICAgIHRoaXMubWFwW25hbWVdID0gb2xkVmFsdWUgPyBvbGRWYWx1ZSArIFwiLFwiICsgdmFsdWUgOiB2YWx1ZTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlW1wiZGVsZXRlXCJdID0gZnVuY3Rpb24obmFtZSkge1xuICAgICAgICBkZWxldGUgdGhpcy5tYXBbbm9ybWFsaXplTmFtZShuYW1lKV07XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpO1xuICAgICAgICByZXR1cm4gdGhpcy5oYXMobmFtZSkgPyB0aGlzLm1hcFtuYW1lXSA6IG51bGw7XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIHJldHVybiB0aGlzLm1hcC5oYXNPd25Qcm9wZXJ0eShub3JtYWxpemVOYW1lKG5hbWUpKTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKG5hbWUsIHZhbHVlKSB7XG4gICAgICAgIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldID0gbm9ybWFsaXplVmFsdWUodmFsdWUpO1xuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUuZm9yRWFjaCA9IGZ1bmN0aW9uKGNhbGxiYWNrLCB0aGlzQXJnKSB7XG4gICAgICAgIGZvciAodmFyIG5hbWUgaW4gdGhpcy5tYXApIHtcbiAgICAgICAgICBpZiAodGhpcy5tYXAuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgICAgIGNhbGxiYWNrLmNhbGwodGhpc0FyZywgdGhpcy5tYXBbbmFtZV0sIG5hbWUsIHRoaXMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgSGVhZGVycy5wcm90b3R5cGUua2V5cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXRlbXMgPSBbXTtcbiAgICAgICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgICAgaXRlbXMucHVzaChuYW1lKTtcbiAgICAgICAgfSk7XG4gICAgICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcyk7XG4gICAgICB9O1xuXG4gICAgICBIZWFkZXJzLnByb3RvdHlwZS52YWx1ZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICAgIGl0ZW1zLnB1c2godmFsdWUpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKTtcbiAgICAgIH07XG5cbiAgICAgIEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGl0ZW1zID0gW107XG4gICAgICAgIHRoaXMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICAgIGl0ZW1zLnB1c2goW25hbWUsIHZhbHVlXSk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpO1xuICAgICAgfTtcblxuICAgICAgaWYgKHN1cHBvcnQuaXRlcmFibGUpIHtcbiAgICAgICAgSGVhZGVycy5wcm90b3R5cGVbU3ltYm9sLml0ZXJhdG9yXSA9IEhlYWRlcnMucHJvdG90eXBlLmVudHJpZXM7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGNvbnN1bWVkKGJvZHkpIHtcbiAgICAgICAgaWYgKGJvZHkuYm9keVVzZWQpIHtcbiAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QobmV3IFR5cGVFcnJvcihcIkFscmVhZHkgcmVhZFwiKSk7XG4gICAgICAgIH1cbiAgICAgICAgYm9keS5ib2R5VXNlZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdCk7XG4gICAgICAgICAgfTtcbiAgICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVqZWN0KHJlYWRlci5lcnJvcik7XG4gICAgICAgICAgfTtcbiAgICAgICAgfSk7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlYWRCbG9iQXNBcnJheUJ1ZmZlcihibG9iKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgcHJvbWlzZSA9IGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpO1xuICAgICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoYmxvYik7XG4gICAgICAgIHJldHVybiBwcm9taXNlO1xuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiByZWFkQmxvYkFzVGV4dChibG9iKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICB2YXIgcHJvbWlzZSA9IGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpO1xuICAgICAgICByZWFkZXIucmVhZEFzVGV4dChibG9iKTtcbiAgICAgICAgcmV0dXJuIHByb21pc2U7XG4gICAgICB9XG5cbiAgICAgIGZ1bmN0aW9uIHJlYWRBcnJheUJ1ZmZlckFzVGV4dChidWYpIHtcbiAgICAgICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWYpO1xuICAgICAgICB2YXIgY2hhcnMgPSBuZXcgQXJyYXkodmlldy5sZW5ndGgpO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdmlldy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgIGNoYXJzW2ldID0gU3RyaW5nLmZyb21DaGFyQ29kZSh2aWV3W2ldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY2hhcnMuam9pbihcIlwiKTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gYnVmZmVyQ2xvbmUoYnVmKSB7XG4gICAgICAgIGlmIChidWYuc2xpY2UpIHtcbiAgICAgICAgICByZXR1cm4gYnVmLnNsaWNlKDApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmLmJ5dGVMZW5ndGgpO1xuICAgICAgICAgIHZpZXcuc2V0KG5ldyBVaW50OEFycmF5KGJ1ZikpO1xuICAgICAgICAgIHJldHVybiB2aWV3LmJ1ZmZlcjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBmdW5jdGlvbiBCb2R5KCkge1xuICAgICAgICB0aGlzLmJvZHlVc2VkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5faW5pdEJvZHkgPSBmdW5jdGlvbihib2R5KSB7XG4gICAgICAgICAgdGhpcy5fYm9keUluaXQgPSBib2R5O1xuICAgICAgICAgIGlmICghYm9keSkge1xuICAgICAgICAgICAgdGhpcy5fYm9keVRleHQgPSBcIlwiO1xuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGJvZHkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYmxvYiAmJiBCbG9iLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5QmxvYiA9IGJvZHk7XG4gICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgIHN1cHBvcnQuZm9ybURhdGEgJiZcbiAgICAgICAgICAgIEZvcm1EYXRhLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5Rm9ybURhdGEgPSBib2R5O1xuICAgICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgICBzdXBwb3J0LnNlYXJjaFBhcmFtcyAmJlxuICAgICAgICAgICAgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICB0aGlzLl9ib2R5VGV4dCA9IGJvZHkudG9TdHJpbmcoKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIgJiYgc3VwcG9ydC5ibG9iICYmIGlzRGF0YVZpZXcoYm9keSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2JvZHlBcnJheUJ1ZmZlciA9IGJ1ZmZlckNsb25lKGJvZHkuYnVmZmVyKTtcbiAgICAgICAgICAgIC8vIElFIDEwLTExIGNhbid0IGhhbmRsZSBhIERhdGFWaWV3IGJvZHkuXG4gICAgICAgICAgICB0aGlzLl9ib2R5SW5pdCA9IG5ldyBCbG9iKFt0aGlzLl9ib2R5QXJyYXlCdWZmZXJdKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKFxuICAgICAgICAgICAgc3VwcG9ydC5hcnJheUJ1ZmZlciAmJlxuICAgICAgICAgICAgKEFycmF5QnVmZmVyLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpIHx8XG4gICAgICAgICAgICAgIGlzQXJyYXlCdWZmZXJWaWV3KGJvZHkpKVxuICAgICAgICAgICkge1xuICAgICAgICAgICAgdGhpcy5fYm9keUFycmF5QnVmZmVyID0gYnVmZmVyQ2xvbmUoYm9keSk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcInVuc3VwcG9ydGVkIEJvZHlJbml0IHR5cGVcIik7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKCF0aGlzLmhlYWRlcnMuZ2V0KFwiY29udGVudC10eXBlXCIpKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGJvZHkgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgdGhpcy5oZWFkZXJzLnNldChcImNvbnRlbnQtdHlwZVwiLCBcInRleHQvcGxhaW47Y2hhcnNldD1VVEYtOFwiKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUJsb2IgJiYgdGhpcy5fYm9keUJsb2IudHlwZSkge1xuICAgICAgICAgICAgICB0aGlzLmhlYWRlcnMuc2V0KFwiY29udGVudC10eXBlXCIsIHRoaXMuX2JvZHlCbG9iLnR5cGUpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChcbiAgICAgICAgICAgICAgc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiZcbiAgICAgICAgICAgICAgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdGhpcy5oZWFkZXJzLnNldChcbiAgICAgICAgICAgICAgICBcImNvbnRlbnQtdHlwZVwiLFxuICAgICAgICAgICAgICAgIFwiYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkO2NoYXJzZXQ9VVRGLThcIlxuICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBpZiAoc3VwcG9ydC5ibG9iKSB7XG4gICAgICAgICAgdGhpcy5ibG9iID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKTtcbiAgICAgICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgICAgICByZXR1cm4gcmVqZWN0ZWQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMuX2JvZHlCbG9iKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlBcnJheUJ1ZmZlcl0pKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgYmxvYlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlUZXh0XSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICB0aGlzLmFycmF5QnVmZmVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgICAgIHJldHVybiBjb25zdW1lZCh0aGlzKSB8fCBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUFycmF5QnVmZmVyKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiB0aGlzLmJsb2IoKS50aGVuKHJlYWRCbG9iQXNBcnJheUJ1ZmZlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudGV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciByZWplY3RlZCA9IGNvbnN1bWVkKHRoaXMpO1xuICAgICAgICAgIGlmIChyZWplY3RlZCkge1xuICAgICAgICAgICAgcmV0dXJuIHJlamVjdGVkO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgICAgcmV0dXJuIHJlYWRCbG9iQXNUZXh0KHRoaXMuX2JvZHlCbG9iKTtcbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuX2JvZHlBcnJheUJ1ZmZlcikge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShcbiAgICAgICAgICAgICAgcmVhZEFycmF5QnVmZmVyQXNUZXh0KHRoaXMuX2JvZHlBcnJheUJ1ZmZlcilcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5Rm9ybURhdGEpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcImNvdWxkIG5vdCByZWFkIEZvcm1EYXRhIGJvZHkgYXMgdGV4dFwiKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5VGV4dCk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChzdXBwb3J0LmZvcm1EYXRhKSB7XG4gICAgICAgICAgdGhpcy5mb3JtRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oZGVjb2RlKTtcbiAgICAgICAgICB9O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5qc29uID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oSlNPTi5wYXJzZSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICB9XG5cbiAgICAgIC8vIEhUVFAgbWV0aG9kcyB3aG9zZSBjYXBpdGFsaXphdGlvbiBzaG91bGQgYmUgbm9ybWFsaXplZFxuICAgICAgdmFyIG1ldGhvZHMgPSBbXCJERUxFVEVcIiwgXCJHRVRcIiwgXCJIRUFEXCIsIFwiT1BUSU9OU1wiLCBcIlBPU1RcIiwgXCJQVVRcIl07XG5cbiAgICAgIGZ1bmN0aW9uIG5vcm1hbGl6ZU1ldGhvZChtZXRob2QpIHtcbiAgICAgICAgdmFyIHVwY2FzZWQgPSBtZXRob2QudG9VcHBlckNhc2UoKTtcbiAgICAgICAgcmV0dXJuIG1ldGhvZHMuaW5kZXhPZih1cGNhc2VkKSA+IC0xID8gdXBjYXNlZCA6IG1ldGhvZDtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gUmVxdWVzdChpbnB1dCwgb3B0aW9ucykge1xuICAgICAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcbiAgICAgICAgdmFyIGJvZHkgPSBvcHRpb25zLmJvZHk7XG5cbiAgICAgICAgaWYgKGlucHV0IGluc3RhbmNlb2YgUmVxdWVzdCkge1xuICAgICAgICAgIGlmIChpbnB1dC5ib2R5VXNlZCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcIkFscmVhZHkgcmVhZFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy51cmwgPSBpbnB1dC51cmw7XG4gICAgICAgICAgdGhpcy5jcmVkZW50aWFscyA9IGlucHV0LmNyZWRlbnRpYWxzO1xuICAgICAgICAgIGlmICghb3B0aW9ucy5oZWFkZXJzKSB7XG4gICAgICAgICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhpbnB1dC5oZWFkZXJzKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgdGhpcy5tZXRob2QgPSBpbnB1dC5tZXRob2Q7XG4gICAgICAgICAgdGhpcy5tb2RlID0gaW5wdXQubW9kZTtcbiAgICAgICAgICBpZiAoIWJvZHkgJiYgaW5wdXQuX2JvZHlJbml0ICE9IG51bGwpIHtcbiAgICAgICAgICAgIGJvZHkgPSBpbnB1dC5fYm9keUluaXQ7XG4gICAgICAgICAgICBpbnB1dC5ib2R5VXNlZCA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudXJsID0gU3RyaW5nKGlucHV0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuY3JlZGVudGlhbHMgPSBvcHRpb25zLmNyZWRlbnRpYWxzIHx8IHRoaXMuY3JlZGVudGlhbHMgfHwgXCJvbWl0XCI7XG4gICAgICAgIGlmIChvcHRpb25zLmhlYWRlcnMgfHwgIXRoaXMuaGVhZGVycykge1xuICAgICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKG9wdGlvbnMuaGVhZGVycyk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5tZXRob2QgPSBub3JtYWxpemVNZXRob2Qob3B0aW9ucy5tZXRob2QgfHwgdGhpcy5tZXRob2QgfHwgXCJHRVRcIik7XG4gICAgICAgIHRoaXMubW9kZSA9IG9wdGlvbnMubW9kZSB8fCB0aGlzLm1vZGUgfHwgbnVsbDtcbiAgICAgICAgdGhpcy5yZWZlcnJlciA9IG51bGw7XG5cbiAgICAgICAgaWYgKCh0aGlzLm1ldGhvZCA9PT0gXCJHRVRcIiB8fCB0aGlzLm1ldGhvZCA9PT0gXCJIRUFEXCIpICYmIGJvZHkpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiQm9keSBub3QgYWxsb3dlZCBmb3IgR0VUIG9yIEhFQUQgcmVxdWVzdHNcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5faW5pdEJvZHkoYm9keSk7XG4gICAgICB9XG5cbiAgICAgIFJlcXVlc3QucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVxdWVzdCh0aGlzLCB7IGJvZHk6IHRoaXMuX2JvZHlJbml0IH0pO1xuICAgICAgfTtcblxuICAgICAgZnVuY3Rpb24gZGVjb2RlKGJvZHkpIHtcbiAgICAgICAgdmFyIGZvcm0gPSBuZXcgRm9ybURhdGEoKTtcbiAgICAgICAgYm9keVxuICAgICAgICAgIC50cmltKClcbiAgICAgICAgICAuc3BsaXQoXCImXCIpXG4gICAgICAgICAgLmZvckVhY2goZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICAgICAgICAgIGlmIChieXRlcykge1xuICAgICAgICAgICAgICB2YXIgc3BsaXQgPSBieXRlcy5zcGxpdChcIj1cIik7XG4gICAgICAgICAgICAgIHZhciBuYW1lID0gc3BsaXQuc2hpZnQoKS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpO1xuICAgICAgICAgICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKFwiPVwiKS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpO1xuICAgICAgICAgICAgICBmb3JtLmFwcGVuZChkZWNvZGVVUklDb21wb25lbnQobmFtZSksIGRlY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gZm9ybTtcbiAgICAgIH1cblxuICAgICAgZnVuY3Rpb24gcGFyc2VIZWFkZXJzKHJhd0hlYWRlcnMpIHtcbiAgICAgICAgdmFyIGhlYWRlcnM6IGFueSA9IG5ldyBIZWFkZXJzKHt9KTtcbiAgICAgICAgcmF3SGVhZGVycy5zcGxpdCgvXFxyP1xcbi8pLmZvckVhY2goZnVuY3Rpb24obGluZSkge1xuICAgICAgICAgIHZhciBwYXJ0cyA9IGxpbmUuc3BsaXQoXCI6XCIpO1xuICAgICAgICAgIHZhciBrZXkgPSBwYXJ0cy5zaGlmdCgpLnRyaW0oKTtcbiAgICAgICAgICBpZiAoa2V5KSB7XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBwYXJ0cy5qb2luKFwiOlwiKS50cmltKCk7XG4gICAgICAgICAgICBoZWFkZXJzLmFwcGVuZChrZXksIHZhbHVlKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gaGVhZGVycztcbiAgICAgIH1cblxuICAgICAgQm9keS5jYWxsKFJlcXVlc3QucHJvdG90eXBlKTtcblxuICAgICAgdmFyIFJlc3BvbnNlOiBhbnkgPSBmdW5jdGlvbihib2R5SW5pdCwgb3B0aW9ucyk6IHZvaWQge1xuICAgICAgICBpZiAoIW9wdGlvbnMpIHtcbiAgICAgICAgICBvcHRpb25zID0ge307XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnR5cGUgPSBcImRlZmF1bHRcIjtcbiAgICAgICAgdGhpcy5zdGF0dXMgPSBcInN0YXR1c1wiIGluIG9wdGlvbnMgPyBvcHRpb25zLnN0YXR1cyA6IDIwMDtcbiAgICAgICAgdGhpcy5vayA9IHRoaXMuc3RhdHVzID49IDIwMCAmJiB0aGlzLnN0YXR1cyA8IDMwMDtcbiAgICAgICAgdGhpcy5zdGF0dXNUZXh0ID0gXCJzdGF0dXNUZXh0XCIgaW4gb3B0aW9ucyA/IG9wdGlvbnMuc3RhdHVzVGV4dCA6IFwiT0tcIjtcbiAgICAgICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKTtcbiAgICAgICAgdGhpcy51cmwgPSBvcHRpb25zLnVybCB8fCBcIlwiO1xuICAgICAgICB0aGlzLl9pbml0Qm9keShib2R5SW5pdCk7XG4gICAgICB9O1xuXG4gICAgICBCb2R5LmNhbGwoUmVzcG9uc2UucHJvdG90eXBlKTtcblxuICAgICAgUmVzcG9uc2UucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgUmVzcG9uc2UodGhpcy5fYm9keUluaXQsIHtcbiAgICAgICAgICBzdGF0dXM6IHRoaXMuc3RhdHVzLFxuICAgICAgICAgIHN0YXR1c1RleHQ6IHRoaXMuc3RhdHVzVGV4dCxcbiAgICAgICAgICBoZWFkZXJzOiBuZXcgSGVhZGVycyh0aGlzLmhlYWRlcnMpLFxuICAgICAgICAgIHVybDogdGhpcy51cmxcbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBSZXNwb25zZS5lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVzcG9uc2UgPSBuZXcgUmVzcG9uc2UobnVsbCwgeyBzdGF0dXM6IDAsIHN0YXR1c1RleHQ6IFwiXCIgfSk7XG4gICAgICAgIHJlc3BvbnNlLnR5cGUgPSBcImVycm9yXCI7XG4gICAgICAgIHJldHVybiByZXNwb25zZTtcbiAgICAgIH07XG5cbiAgICAgIHZhciByZWRpcmVjdFN0YXR1c2VzID0gWzMwMSwgMzAyLCAzMDMsIDMwNywgMzA4XTtcblxuICAgICAgUmVzcG9uc2UucmVkaXJlY3QgPSBmdW5jdGlvbih1cmwsIHN0YXR1cykge1xuICAgICAgICBpZiAocmVkaXJlY3RTdGF0dXNlcy5pbmRleE9mKHN0YXR1cykgPT09IC0xKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXCJJbnZhbGlkIHN0YXR1cyBjb2RlXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5ldyBSZXNwb25zZShudWxsLCB7XG4gICAgICAgICAgc3RhdHVzOiBzdGF0dXMsXG4gICAgICAgICAgaGVhZGVyczogeyBsb2NhdGlvbjogdXJsIH1cbiAgICAgICAgfSk7XG4gICAgICB9O1xuXG4gICAgICBzZWxmLkhlYWRlcnMgPSBIZWFkZXJzO1xuICAgICAgc2VsZi5SZXF1ZXN0ID0gUmVxdWVzdDtcbiAgICAgIHNlbGYuUmVzcG9uc2UgPSBSZXNwb25zZTtcblxuICAgICAgc2VsZi5mZXRjaCA9IGZ1bmN0aW9uKGlucHV0LCBpbml0KSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICB2YXIgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGlucHV0LCBpbml0KTtcbiAgICAgICAgICB2YXIgeGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9uczoge1xuICAgICAgICAgICAgICBzdGF0dXM6IGFueTtcbiAgICAgICAgICAgICAgc3RhdHVzVGV4dDogYW55O1xuICAgICAgICAgICAgICBoZWFkZXJzOiBhbnk7XG4gICAgICAgICAgICAgIHVybD86IGFueTtcbiAgICAgICAgICAgIH0gPSB7XG4gICAgICAgICAgICAgIHN0YXR1czogeGhyLnN0YXR1cyxcbiAgICAgICAgICAgICAgc3RhdHVzVGV4dDogeGhyLnN0YXR1c1RleHQsXG4gICAgICAgICAgICAgIGhlYWRlcnM6IHBhcnNlSGVhZGVycyh4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkgfHwgXCJcIilcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBvcHRpb25zLnVybCA9XG4gICAgICAgICAgICAgIFwicmVzcG9uc2VVUkxcIiBpbiB4aHJcbiAgICAgICAgICAgICAgICA/IHhoci5yZXNwb25zZVVSTFxuICAgICAgICAgICAgICAgIDogb3B0aW9ucy5oZWFkZXJzLmdldChcIlgtUmVxdWVzdC1VUkxcIik7XG4gICAgICAgICAgICB2YXIgYm9keSA9IFwicmVzcG9uc2VcIiBpbiB4aHIgPyB4aHIucmVzcG9uc2UgOiB4aHIucmVzcG9uc2VUZXh0O1xuICAgICAgICAgICAgcmVzb2x2ZShuZXcgUmVzcG9uc2UoYm9keSwgb3B0aW9ucykpO1xuICAgICAgICAgIH07XG5cbiAgICAgICAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoXCJOZXR3b3JrIHJlcXVlc3QgZmFpbGVkXCIpKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgeGhyLm9udGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoXCJOZXR3b3JrIHJlcXVlc3QgZmFpbGVkXCIpKTtcbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgeGhyLm9wZW4ocmVxdWVzdC5tZXRob2QsIHJlcXVlc3QudXJsLCB0cnVlKTtcblxuICAgICAgICAgIGlmIChyZXF1ZXN0LmNyZWRlbnRpYWxzID09PSBcImluY2x1ZGVcIikge1xuICAgICAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWU7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKFwicmVzcG9uc2VUeXBlXCIgaW4geGhyICYmIHN1cHBvcnQuYmxvYikge1xuICAgICAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9IFwiYmxvYlwiO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJlcXVlc3QuaGVhZGVycy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7XG4gICAgICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihuYW1lLCB2YWx1ZSk7XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICB4aHIuc2VuZChcbiAgICAgICAgICAgIHR5cGVvZiByZXF1ZXN0Ll9ib2R5SW5pdCA9PT0gXCJ1bmRlZmluZWRcIiA/IG51bGwgOiByZXF1ZXN0Ll9ib2R5SW5pdFxuICAgICAgICAgICk7XG4gICAgICAgIH0pO1xuICAgICAgfTtcbiAgICAgIHNlbGYuZmV0Y2gucG9seWZpbGwgPSB0cnVlO1xuICAgIH0pKHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHRoaXMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGZldGNoOiBzZWxmLmZldGNoLFxuICAgICAgSGVhZGVyczogc2VsZi5IZWFkZXJzLFxuICAgICAgUmVxdWVzdDogc2VsZi5SZXF1ZXN0LFxuICAgICAgUmVzcG9uc2U6IHNlbGYuUmVzcG9uc2VcbiAgICB9O1xuICB9KSgpO1xufTtcblxuZXhwb3J0IGRlZmF1bHQgZmV0Y2hQb255ZmlsbDtcbiIsImltcG9ydCBmZXRjaFBvbnlmaWxsIGZyb20gXCIuLi92ZW5kb3IvZmV0Y2hQb255ZmlsbFwiO1xuXG50eXBlIFJlcXVlc3RJbml0aWFsaXphdGlvbk9iamVjdCA9IHtcbiAgZW5kcG9pbnQ/OiBzdHJpbmc7XG4gIG9wdGlvbnM/OiBSZXF1ZXN0SW5pdDtcbiAgYm9keT86IEZvcm1EYXRhO1xufTtcblxuY2xhc3MgUmVxdWVzdCB7XG4gIC8vIFByb3BlcnR5IHR5cGVzXG4gIGVuZHBvaW50OiBzdHJpbmc7XG4gIG9wdGlvbnM6IFJlcXVlc3RJbml0O1xuICBib2R5OiBGb3JtRGF0YTtcblxuICAvLyBTdGF0aWMgcHJvcGVydGllc1xuICAvKipcbiAgICogQHN0YXRpY1xuICAgKiBAbWVtYmVyIHtvYmplY3R9IFJlcXVlc3QuZGVmYXVsdE9wdGlvbnMgT3B0aW9ucyBvYmplY3QgdG8gZmFsbGJhY2sgdG8gaWZcbiAgICogbm8gb3B0aW9ucyBwcm9wZXJ0eSBpcyBwYXNzZWQgaW50byB0aGUgY29uc3RydWN0b3IgY29uZmlnIG9iamVjdC5cbiAgICovXG4gIHN0YXRpYyBkZWZhdWx0T3B0aW9uczogUmVxdWVzdEluaXQgPSB7XG4gICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgIGhlYWRlcnM6IHsgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIiB9XG4gIH07XG5cbiAgLy8gQ29uc3RydWN0b3JcbiAgLyoqXG4gICAqIEBjbGFzcyBSZXF1ZXN0XG4gICAqIEBwYXJhbSB7b2JqZWN0fSBjb25maWdcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5lbmRwb2ludFxuICAgKiBAcGFyYW0ge29iamVjdH0gW2NvbmZpZy5vcHRpb25zXVxuICAgKiBAcGFyYW0ge0Zvcm1EYXRhfSBbY29uZmlnLmJvZHldXG4gICAqL1xuICBjb25zdHJ1Y3Rvcih7IGVuZHBvaW50LCBvcHRpb25zLCBib2R5IH06IFJlcXVlc3RJbml0aWFsaXphdGlvbk9iamVjdCkge1xuICAgIHRoaXMuZW5kcG9pbnQgPSBlbmRwb2ludDtcbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zIHx8IFJlcXVlc3QuZGVmYXVsdE9wdGlvbnM7XG4gICAgdGhpcy5ib2R5ID0gYm9keTtcbiAgfVxuICAvLyBQcml2YXRlIG1ldGhvZHNcbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqIEBmdW5jdGlvbiBSZXF1ZXN0LnByZXBhcmVGZXRjaE9wdGlvbnNcbiAgICogQGRlc2NyaXB0aW9uIENyZWF0ZXMgYmxhbmsgRm9ybURhdGEgb2JqZWN0IGlmIHRoaXMuYm9keSBpcyB1bmRlZmluZWQgYW5kXG4gICAqIHRoaXMub3B0aW9ucy5tZXRob2QgaXMgZXF1YWwgdG8gXCJQT1NUXCIuXG4gICAqIEByZXR1cm5zIHtGb3JtRGF0YX1cbiAgICovXG4gIHByaXZhdGUgcHJlcGFyZUZldGNoT3B0aW9ucyA9ICgpID0+IHtcbiAgICBpZiAoIXRoaXMuYm9keSAmJiB0aGlzLm9wdGlvbnMubWV0aG9kID09PSBcIlBPU1RcIikge1xuICAgICAgdGhpcy5ib2R5ID0gbmV3IEZvcm1EYXRhKCk7XG4gICAgfVxuICAgIHJldHVybiB0aGlzLmJvZHk7XG4gIH07XG4gIC8vIFB1YmxpYyBtZXRob2RzXG4gIC8qKlxuICAgKiBAcHVibGljXG4gICAqIEBmdW5jdGlvbiBSZXF1ZXN0LnNlbmRcbiAgICogQHBhcmFtXHR7b2JqZWN0fSBvcHRpb25zXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW29wdGlvbnMuYXN5bmNdIEFsbG93cyBwcm9wZXJ0eSBgYXN5bmNgIHRvIGJlIHNldCB0byBpbmRpY2F0ZSB0aGVcbiAgICogcmVzcG9uc2Ugc2hvdWxkIGJlIHByZXBhcmVkIGJlZm9yZSByZXR1cm5pbmcuXG4gICAqIEByZXR1cm5zIHtQcm9taXNlfVxuICAgKi9cbiAgcHVibGljIHNlbmQgPSAoeyBhc3luYyB9OiB7IGFzeW5jOiBib29sZWFuIH0gPSB7IGFzeW5jOiBmYWxzZSB9KSA9PiB7XG4gICAgY29uc3QgeyBmZXRjaCB9ID0gd2luZG93XG4gICAgICA/IHdpbmRvdy5mZXRjaCA/IHdpbmRvdyA6IGZldGNoUG9ueWZpbGwoe30pLmZldGNoXG4gICAgICA6IHtcbiAgICAgICAgICBmZXRjaDogKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS53YXJuKFwiZmV0Y2ggaXMgbm90IHN1cHBvcnRlZFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgY29uc3QgcHJlcGFyZWRPcHRpb25zID0gT2JqZWN0LmFzc2lnbihcbiAgICAgIHt9LFxuICAgICAgdGhpcy5wcmVwYXJlRmV0Y2hPcHRpb25zKCksXG4gICAgICB0aGlzLm9wdGlvbnNcbiAgICApO1xuICAgIGNvbnN0IGluaXRGZXRjaCA9IGZldGNoKHRoaXMuZW5kcG9pbnQsIHByZXBhcmVkT3B0aW9ucyk7XG4gICAgcmV0dXJuIGFzeW5jID8gaW5pdEZldGNoLnRoZW4ocmVzID0+IHJlcy5qc29uKCkpIDogaW5pdEZldGNoO1xuICB9O1xufVxuXG5leHBvcnQgZGVmYXVsdCBSZXF1ZXN0O1xuIiwiLyoqXG4gKiBAbW9kdWxlIGRhdGFNYW5pcHVsYXRpb25cbiAqL1xuXG50eXBlIGFscGhhbnVtZXJpYyA9IHN0cmluZyB8IG51bWJlcjtcbnR5cGUgYXJyYXlMaWtlID0gc3RyaW5nIHwgYWxwaGFudW1lcmljW107XG5cbi8qKlxuICogQGZ1bmN0aW9uIHNlYXJjaFByb3BQYXRoXG4gKiBAZGVzY3JpcHRpb24gUmVjdXJzaXZlbHkgc2VhcmNocyB0aHJvdWdoIGEgZGF0YSBvYmplY3Q7IHRocm93cyBhbiBlcnJvciBpZiB0aGUgcmVzdWx0aW5nIHZhbHVlIG9mIGEgc2VhcmNoZWQgcGF0aCBpcyB1bmRlZmluZWQuXG4gKiBAcGFyYW0ge2FscGhhbnVtZXJpY1tdfSBwYXRoIEFycmF5IG9mIGtleXMgaW4gdGhlIG9yZGVyIG9mIHdoaWNoIHdpbGwgYmUgdXNlZCB0byByZWN1cnNpdmVseSBzZWFyY2ggYW4gb2JqZWN0XG4gKiBAcGFyYW0ge29iamVjdH0gY29sbGVjdGlvbiBEYXRhIG9iamVjdFxuICogQHBhcmFtIHtzdHJpbmd9IFtkZWxpbWl0ZXJdIERlbGltaXRlciBieSB3aGljaCB0byBzcGxpdCB0aGUgcGF0aDsgZGVmYXVsdHMgdG8gJy4nXG4gKiBAcmV0dXJuIHthbnl9IFZhbHVlIGF0IHRoZSBlbmQgb2YgdGhlIHNlYXJjaGVkIHByb3BlcnR5IHBhdGg7XG4gKi9cbmNvbnN0IHNlYXJjaFByb3BQYXRoID0gKFxuICBwYXRoOiBhcnJheUxpa2UsXG4gIGNvbGxlY3Rpb246IG9iamVjdCxcbiAgZGVsaW1pdGVyOiBzdHJpbmcgPSBcIi5cIlxuKTogYW55ID0+IHtcbiAgY29uc3Qgc2FmZVBhdGggPSB0eXBlb2YgcGF0aCA9PT0gXCJzdHJpbmdcIiA/IHBhdGguc3BsaXQoZGVsaW1pdGVyKSA6IHBhdGg7XG4gIGxldCBwYXRoUmVzdWx0ID0gY29sbGVjdGlvbjtcbiAgc2FmZVBhdGguZm9yRWFjaChrZXkgPT4ge1xuICAgIHBhdGhSZXN1bHQgPSBwYXRoUmVzdWx0W2tleV07XG4gIH0pO1xuICBpZiAocGF0aFJlc3VsdCkgcmV0dXJuIHBhdGhSZXN1bHQ7XG4gIHRocm93IG5ldyBFcnJvcihcbiAgICBgcGF0aFJlc3VsdCB5aWVsZHMgdW5kZWZpbmVkIHZhbHVlIHdoZW4gc2VhcmNoaW5nICR7c2FmZVBhdGguam9pbihcbiAgICAgIGRlbGltaXRlclxuICAgICl9IG9uIGNvbGxlY3Rpb24gYXJndW1lbnQuYFxuICApO1xufTtcblxuZXhwb3J0IHsgc2VhcmNoUHJvcFBhdGggfTtcbiIsIi8qKlxuICogQG1vZHVsZSBwYXJzZVxuICovXG5cbi8qKlxuICogQmFzZSBmcm9tIGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL2dlb2ZmZGF2aXM5Mi8xZGE3ZDA3NDVlM2JiYTAzNmY5NFxuICogQGZ1bmN0aW9uIHBhcmFtc1xuICogQGRlc2NyaXB0aW9uIENyZWF0ZXMgb2JqZWN0IG9mIGtleS92YWx1ZSBwYWlycyBmcm9tIFVSTCBwYXJhbWV0ZXJzLlxuICogQHBhcmFtIHtzdHJpbmd9IFt1cmxdIFVSTCB0byBwYXJzZTsgZGVmYXVsdHMgdG8gd2luZG93LmxvY2F0aW9uLnNlYXJjaC5cbiAqIEByZXR1cm4ge29iamVjdH0gT2JqZWN0IG9mIGtleS92YWx1ZSBwYWlycy5cbiAqL1xuY29uc3QgcGFyYW1zID0gKHVybDogc3RyaW5nID0gd2luZG93LmxvY2F0aW9uLnNlYXJjaCk6IG9iamVjdCA9PlxuICB1cmxcbiAgICAuc3BsaXQoXCI/XCIpWzFdXG4gICAgLnNwbGl0KFwiJlwiKVxuICAgIC5tYXAocSA9PiBxLnNwbGl0KFwiPVwiKSlcbiAgICAucmVkdWNlKChhY2MsIFtrZXksIHZhbF0sIGksIGFycikgPT4ge1xuICAgICAgYWNjW2tleV0gPSBkZWNvZGVVUklDb21wb25lbnQodmFsKS5yZXBsYWNlKC9cXCsvZywgXCIgXCIpO1xuICAgICAgcmV0dXJuIGFjYztcbiAgICB9LCB7fSk7XG5cbi8qKlxuICogQGZ1bmN0aW9uIHBhcnNlRXh0ZXJuYWxNYXJrZG93bkxpbmtzXG4gKiBAZGVzY3JpcHRpb24gVHJhbnNmb3JtcyBNYXJrZG93biBsaW5rcyB0byB1c2UgdGFyZ2V0PVwiX2JsYW5rXCIsIHJlbD1cIm5vb3BlbmVyIG5vcmVmZXJyZXJcIjtcbiAqIHVzdWFsbHkgdXNlZCB3aGVuIGltcGxlbWVudGluZyBjbGllbnRzaWRlIE1hcmtkb3duLCBiZWZvcmUgc2VuZGluZyB0aGUgTWFya2Rvd24gdG8gdGhlIG1haW5cbiAqIHBhcnNpbmcgZnVuY3Rpb24uXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFN0cmluZyB0byBwYXJzZSBhcyBNYXJrZG93biBsaW5rLlxuICogQHJldHVybnMge3N0cmluZ30gSFRNTCBsaW5rIHdpdGggVVJMIGFuZCBpbm5lclRleHQsIHRhcmdldCBhbmQgcmVsIGF0dHJpYnV0ZXMgcHJvcGVybHkgc2V0IGZvclxuICogYW4gZXh0ZXJuYWwgbGluay5cbiAqL1xuY29uc3QgcGFyc2VFeHRlcm5hbE1hcmtkb3duTGlua3MgPSAoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICBjb25zdCBwYXR0ZXJuOiBSZWdFeHAgPSAvXFxbKFteXFxdXSspXFxdXFwoKFteKV0rKVxcKS9nO1xuICBpZiAoc3RyaW5nLnNlYXJjaChwYXR0ZXJuKSA+IC0xKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKFxuICAgICAgcGF0dGVybixcbiAgICAgICc8YSBocmVmPVwiJDJcIiB0YXJnZXQ9XCJfYmxhbmtcIiByZWw9XCJub29wZW5lciBub3JlZmVycmVyXCI+JDE8L2E+J1xuICAgICk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHN0cmluZztcbiAgfVxufTtcblxuZXhwb3J0IHsgcGFyYW1zIGFzIHBhcnNlVVJMUGFyYW1zLCBwYXJzZUV4dGVybmFsTWFya2Rvd25MaW5rcyB9O1xuIiwiLyoqXG4gKiBAbW9kdWxlIHNjcm9sbFxuICovXG5cbi8qKlxuICogQGZ1bmN0aW9uIGlzRWxlbWVudEluVmlld3BvcnRcbiAqIEBkZXNjcmlwdGlvbiBEZXRlcm1pbmVzIGlmIGEgZ2l2ZW4gZWxlbWVudCBpcyBwYXJ0aWFsbHkgb3JcbiAqIGZ1bGx5IHZpc2libGUgaW4gdGhlIHZpZXdwb3J0LlxuICogQHBhcmFtIHtvYmplY3R9IGNvbmZpZ1xuICogQHBhcmFtIHtFbGVtZW50fSBjb25maWcuZWxlbWVudCBIVE1MIEVsZW1lbnQgbm9kZSB0byB0YXJnZXQuXG4gKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy50aHJlc2hvbGRdIFJhdGlvIG9mIHRoZSB2aWV3cG9ydCBoZWlnaHQgdGhlIGVsZW1lbnRcbiAqIG11c3QgZmlsbCBiZWZvcmUgYmVpbmcgY29uc2lkZXJlZCB2aXNpYmxlLiBFLmcuIDAuNSBtZWFucyB0aGUgZWxlbWVudFxuICogbXVzdCB0YWtlIHVwIDUwJSBvZiB0aGUgc2NyZWVuIGJlZm9yZSByZXR1cm5pbmcgdHJ1ZS4gRGVmYXVsdHMgdG8gMC4yNS5cbiAqIE9ubHkgdXNlZCBmb3IgZWxlbWVudHMgdGFsbGVyIHRoYW4gdGhlIHZpZXdwb3J0LlxuICogQHJldHVybiB7Ym9vbGVhbn0gQm9vbGVhbiBkZXNjcmliaW5nIGlmIGlucHV0IGlzIGZ1bGx5L3BhcnRpYWxseVxuICogaW4gdGhlIHZpZXdwb3J0LCByZWxhdGl2ZSB0byB0aGUgdGhyZXNob2xkIHNldHRpbmcuXG4gKi9cbmZ1bmN0aW9uIGlzRWxlbWVudEluVmlld3BvcnQoe1xuICBlbGVtZW50OiBhcmdFbGVtZW50LFxuICB0aHJlc2hvbGQ6IGFyZ1RocmVzaG9sZFxufToge1xuICBlbGVtZW50OiBFbGVtZW50O1xuICB0aHJlc2hvbGQ6IG51bWJlcjtcbn0pOiBib29sZWFuIHtcbiAgY29uc3QgZGVmYXVsdFBhcmFtczoge1xuICAgIHRocmVzaG9sZDogbnVtYmVyO1xuICB9ID0ge1xuICAgIHRocmVzaG9sZDogMC4yNVxuICB9O1xuXG4gIGNvbnN0IHNhZmVBcmdzID0ge1xuICAgIHRocmVzaG9sZDogYXJnVGhyZXNob2xkIHx8IGRlZmF1bHRQYXJhbXMudGhyZXNob2xkXG4gIH07XG5cbiAgY29uc3QgcmVjdDogQ2xpZW50UmVjdCB8IERPTVJlY3QgPSBhcmdFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuXG4gIGNvbnN0IHZpZXdwb3J0SGVpZ2h0OiBudW1iZXIgPSBNYXRoLm1heChcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50SGVpZ2h0LFxuICAgIHdpbmRvdy5pbm5lckhlaWdodCB8fCAwXG4gICk7XG4gIGNvbnN0IHsgdGhyZXNob2xkIH0gPSBzYWZlQXJncztcblxuICBpZiAodGhyZXNob2xkIDwgMCB8fCB0aHJlc2hvbGQgPiAxKSB7XG4gICAgdGhyb3cgbmV3IFJhbmdlRXJyb3IoXG4gICAgICBcIlRocmVzaG9sZCBhcmd1bWVudCBtdXN0IGJlIGEgZGVjaW1hbCBiZXR3ZWVuIDAgYW5kIDFcIlxuICAgICk7XG4gIH1cblxuICAvL0lmIHRoZSBlbGVtZW50IGlzIHRvbyB0YWxsIHRvIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0XG4gIGlmIChyZWN0LmhlaWdodCA+PSB0aHJlc2hvbGQgKiB2aWV3cG9ydEhlaWdodCkge1xuICAgIGlmIChcbiAgICAgIHJlY3QudG9wIC0gdmlld3BvcnRIZWlnaHQgPD0gdGhyZXNob2xkICogdmlld3BvcnRIZWlnaHQgKiAtMSAmJlxuICAgICAgcmVjdC5ib3R0b20gPj0gdGhyZXNob2xkICogdmlld3BvcnRIZWlnaHRcbiAgICApIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIC8vSWYgdGhlIGVsZW1lbnQgaXMgc2hvcnQgZW5vdWdoIHRvIGZpdCB3aXRoaW4gdGhlIHZpZXdwb3J0XG4gICAgaWYgKHJlY3QudG9wID49IDAgJiYgcmVjdC5ib3R0b20gLSB2aWV3cG9ydEhlaWdodCA8PSAwKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIEZyb20gaHR0cDovL2JpdC5seS8yY1A2NWZEXG4gKiBAdG9kbyBDbGFzc2lmeSBhbmQgZGVzY3JpYmUgcGFyYW1zLlxuICogQGZ1bmN0aW9uIHNjcm9sbFRvXG4gKiBAZGVzY3JpcHRpb24gU2Nyb2xscyBnaXZlbiBlbGVtZW50IHRvIGRldGVybWluZWQgcG9pbnQuXG4gKiBAcGFyYW0gIHtFbGVtZW50fSBlbGVtZW50ICBbZGVzY3JpcHRpb25dXG4gKiBAcGFyYW0gIHtudW1iZXJ9IHRvICAgICAgIFtkZXNjcmlwdGlvbl1cbiAqIEBwYXJhbSAge251bWJlcn0gZHVyYXRpb24gW2Rlc2NyaXB0aW9uXVxuICogQHJldHVybiB7dm9pZH1cbiAqL1xuZnVuY3Rpb24gc2Nyb2xsVG8oZWxlbWVudDogRWxlbWVudCwgdG86IG51bWJlciwgZHVyYXRpb246IG51bWJlcik6IHZvaWQge1xuICBpZiAoZHVyYXRpb24gPD0gMCkgcmV0dXJuO1xuICBjb25zdCBkaWZmZXJlbmNlOiBudW1iZXIgPSB0byAtIGVsZW1lbnQuc2Nyb2xsVG9wO1xuICBjb25zdCBwZXJUaWNrOiBudW1iZXIgPSBkaWZmZXJlbmNlIC8gZHVyYXRpb24gKiAxMDtcblxuICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIGVsZW1lbnQuc2Nyb2xsVG9wID0gZWxlbWVudC5zY3JvbGxUb3AgKyBwZXJUaWNrO1xuICAgIGlmIChlbGVtZW50LnNjcm9sbFRvcCA9PT0gdG8pIHJldHVybjtcbiAgICBzY3JvbGxUbyhlbGVtZW50LCB0bywgZHVyYXRpb24gLSAxMCk7XG4gIH0sIDEwKTtcbn1cblxuZXhwb3J0IHsgaXNFbGVtZW50SW5WaWV3cG9ydCwgc2Nyb2xsVG8gfTtcbiIsIi8qKlxuICogQG1vZHVsZSBzZWxlY3RcbiAqL1xuXG4vKipcbiAqIEBmdW5jdGlvbiBzZWxlY3RcbiAqIEBkZXNjcmlwdGlvbiBTZWxlY3RzIGEgRE9NIG5vZGUgYmFzZWQgb24gYSBxdWVyeS5cbiAqIEBwYXJhbSB7c3RyaW5nfSBxdWVyeSBxdWVyeSBzZWxlY3RvciB0byB1c2UgdG8gcXVlcnkgYW4gbm9kZS5cbiAqIEByZXR1cm5zIHtFbGVtZW50fSBGaXJzdCBET00gbm9kZSB0aGF0IG1hdGNoZXMgdGhlIHF1ZXJ5LlxuICovXG5jb25zdCBzZWxlY3Q6IEZ1bmN0aW9uID0gKHF1ZXJ5OiBzdHJpbmcpOiBFbGVtZW50ID0+XG4gIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IocXVlcnkpO1xuXG4vKipcbiAqIEBmdW5jdGlvbiBzZWxlY3RBbGxcbiAqIEBkZXNjcmlwdGlvbiBTZWxlY3RzIGEgRE9NIG5vZGVsaXN0IGJhc2VkIG9uIGEgcXVlcnkuXG4gKiBAcGFyYW0ge3N0cmluZ30gcXVlcnkgcXVlcnkgc2VsZWN0b3IgdG8gdXNlIHRvIHF1ZXJ5IGEgbm9kZWxpc3QuXG4gKiBAcmV0dXJucyB7RWxlbWVudFtdfSBBcnJheSBvZiBET00gbm9kZXMgdGhhdCBtYXRjaCB0aGUgcXVlcnkuXG4gKi9cbmNvbnN0IHNlbGVjdEFsbDogRnVuY3Rpb24gPSAocXVlcnk6IHN0cmluZyk6IEVsZW1lbnRbXSA9PiBbXG4gIC4uLmRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwocXVlcnkpXG5dO1xuXG4vKipcbiAqIEBmdW5jdGlvbiBzZWxlY3RCeUlkXG4gKiBAZGVzY3JpcHRpb24gU2VsZWN0cyBhIERPTSBub2RlIGJhc2VkIG9uIGFuIElEIHN0cmluZy5cbiAqIEBwYXJhbSB7c3RyaW5nfSBpZCBJRCBvZiBET00gbm9kZSB0byBzZWxlY3QuXG4gKiBAcmV0dXJucyB7RWxlbWVudH0gRE9NIG5vZGUgd2l0aCBtYXRjaGVkIElELlxuICovXG5jb25zdCBzZWxlY3RCeUlkOiBGdW5jdGlvbiA9IChpZDogc3RyaW5nKTogRWxlbWVudCA9PlxuICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpZCk7XG5cbmV4cG9ydCB7IHNlbGVjdCwgc2VsZWN0QWxsLCBzZWxlY3RCeUlkIH07XG4iLCIvKipcbiAqIEBtb2R1bGUgdHlwb2dyYXBoeVxuICovXG5cbi8qKlxuICogQGZ1bmN0aW9uIGNhcGl0YWxpemVcbiAqIEBkZXNjcmlwdGlvbiBDYXBpdGFsaXplcyBhbGwgd29yZHMgaW4gYSBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRleHQgdG8gY2FwaXRhbGl6ZS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFRpdGxlLWNhc2VkIHRleHQuXG4gKi9cbmNvbnN0IGNhcGl0YWxpemUgPSAoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcgPT5cbiAgc3RyaW5nXG4gICAgLnNwbGl0KFwiIFwiKVxuICAgIC5tYXAocyA9PiB1Y0ZpcnN0KHMpKVxuICAgIC5qb2luKFwiIFwiKTtcblxuLyoqXG4gKiBAZnVuY3Rpb24gc2x1Z2lmeVxuICogQGRlc2NyaXB0aW9uIExvd2VyY2FzZXMgc3RyaW5nLCByZXBsYWNlcyBzcGFjZXMgYW5kIHNwZWNpYWwgY2hhcmFjdGVyc1xuICogd2l0aCBhIHNldCBkZWxpbWl0ZXIuXG4gKiBAcGFyYW0ge3N0cmluZ30gdGV4dFRvU2x1ZyBUZXh0IHRvIHNsdWdpZnkuXG4gKiBAcGFyYW0ge3N0cmluZ30gW2RlbGltaXRlcl0gRGVsaW1pdGVyOyBkZWZhdWx0cyB0byBcIi1cIi5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFNsdWdpZmllZCB0ZXh0LlxuICovXG5jb25zdCBzbHVnaWZ5ID0gKHRleHRUb1NsdWc6IHN0cmluZywgZGVsaW1pdGVyOiBzdHJpbmcgPSBcIi1cIik6IHN0cmluZyA9PlxuICB0ZXh0VG9TbHVnXG4gICAgLnJlcGxhY2UoLyhcXCF8I3xcXCR8JXxcXCp8XFwufFxcL3xcXFxcfFxcKHxcXCl8XFwrfFxcfHxcXCx8XFw6fFxcJ3xcXFwiKS9nLCBcIlwiKVxuICAgIC5yZXBsYWNlKC8oLikoXFxzfFxcX3xcXC0pKyguKS9nLCBgJDEke2RlbGltaXRlcn0kM2ApXG4gICAgLnRvTG93ZXJDYXNlKCk7XG5cbi8qKlxuICogQGZ1bmN0aW9uIHRyaW1cbiAqIEBkZXNjcmlwdGlvbiBUcmltcyB3aGl0ZXNwYWNlIG9uIGVpdGhlciBlbmQgb2YgYSBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30gc3RyaW5nIFRleHQgdG8gdHJpbS5cbiAqIEByZXR1cm5zIHtzdHJpbmd9IFRyaW1tZWQgdGV4dC5cbiAqL1xuY29uc3QgdHJpbSA9IChzdHJpbmc6IHN0cmluZyk6IHN0cmluZyA9PiBzdHJpbmcucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgXCJcIik7XG5cbi8qKlxuICogQGZ1bmN0aW9uIHVjRmlyc3RcbiAqIEBkZXNjcmlwdGlvbiBDYXBpdGFsaXplcyBmaXJzdCB3b3JkIGluIGEgc3RyaW5nLlxuICogQHBhcmFtIHtzdHJpbmd9IHN0cmluZyBUZXh0IHRvIGNhcGl0YWxpemUuXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBDYXBpdGFsaXplZCB0ZXh0LlxuICovXG5jb25zdCB1Y0ZpcnN0ID0gKFtmaXJzdExldHRlciwgLi4ucmVzdExldHRlcnNdOiBzdHJpbmcpOiBzdHJpbmcgPT5cbiAgYCR7Zmlyc3RMZXR0ZXIudG9VcHBlckNhc2UoKX0ke3Jlc3RMZXR0ZXJzLmpvaW4oXCJcIil9YDtcblxuZXhwb3J0IHsgY2FwaXRhbGl6ZSwgc2x1Z2lmeSwgdHJpbSwgdWNGaXJzdCB9O1xuIl0sIm5hbWVzIjpbImZldGNoUG9ueWZpbGwiLCJvcHRpb25zIiwid2luZG93Iiwic2VsZiIsImdsb2JhbCIsIlByb21pc2UiLCJYTUxIdHRwUmVxdWVzdCIsIk9iamVjdCIsImNyZWF0ZSIsInVuZGVmaW5lZCIsImZldGNoIiwic3VwcG9ydCIsIlN5bWJvbCIsIkJsb2IiLCJlIiwiYXJyYXlCdWZmZXIiLCJ2aWV3Q2xhc3NlcyIsImlzRGF0YVZpZXciLCJvYmoiLCJEYXRhVmlldyIsInByb3RvdHlwZSIsImlzUHJvdG90eXBlT2YiLCJpc0FycmF5QnVmZmVyVmlldyIsIkFycmF5QnVmZmVyIiwiaXNWaWV3IiwiaW5kZXhPZiIsInRvU3RyaW5nIiwiY2FsbCIsIm5hbWUiLCJTdHJpbmciLCJ0ZXN0IiwiVHlwZUVycm9yIiwidG9Mb3dlckNhc2UiLCJ2YWx1ZSIsIml0ZW1zIiwiaXRlcmF0b3IiLCJzaGlmdCIsImRvbmUiLCJpdGVyYWJsZSIsImhlYWRlcnMiLCJtYXAiLCJIZWFkZXJzIiwiZm9yRWFjaCIsImFwcGVuZCIsIkFycmF5IiwiaXNBcnJheSIsImhlYWRlciIsImdldE93blByb3BlcnR5TmFtZXMiLCJub3JtYWxpemVOYW1lIiwibm9ybWFsaXplVmFsdWUiLCJvbGRWYWx1ZSIsImdldCIsImhhcyIsImhhc093blByb3BlcnR5Iiwic2V0IiwiY2FsbGJhY2siLCJ0aGlzQXJnIiwia2V5cyIsInB1c2giLCJpdGVyYXRvckZvciIsInZhbHVlcyIsImVudHJpZXMiLCJib2R5IiwiYm9keVVzZWQiLCJyZWplY3QiLCJyZWFkZXIiLCJyZXNvbHZlIiwib25sb2FkIiwicmVzdWx0Iiwib25lcnJvciIsImVycm9yIiwiYmxvYiIsIkZpbGVSZWFkZXIiLCJwcm9taXNlIiwiZmlsZVJlYWRlclJlYWR5IiwicmVhZEFzQXJyYXlCdWZmZXIiLCJyZWFkQXNUZXh0IiwiYnVmIiwidmlldyIsIlVpbnQ4QXJyYXkiLCJjaGFycyIsImxlbmd0aCIsImkiLCJmcm9tQ2hhckNvZGUiLCJqb2luIiwic2xpY2UiLCJieXRlTGVuZ3RoIiwiYnVmZmVyIiwiX2luaXRCb2R5IiwiX2JvZHlJbml0IiwiX2JvZHlUZXh0IiwiX2JvZHlCbG9iIiwiZm9ybURhdGEiLCJGb3JtRGF0YSIsIl9ib2R5Rm9ybURhdGEiLCJzZWFyY2hQYXJhbXMiLCJVUkxTZWFyY2hQYXJhbXMiLCJfYm9keUFycmF5QnVmZmVyIiwiYnVmZmVyQ2xvbmUiLCJFcnJvciIsInR5cGUiLCJyZWplY3RlZCIsImNvbnN1bWVkIiwidGhlbiIsInJlYWRCbG9iQXNBcnJheUJ1ZmZlciIsInRleHQiLCJyZWFkQmxvYkFzVGV4dCIsInJlYWRBcnJheUJ1ZmZlckFzVGV4dCIsImRlY29kZSIsImpzb24iLCJKU09OIiwicGFyc2UiLCJtZXRob2RzIiwibWV0aG9kIiwidXBjYXNlZCIsInRvVXBwZXJDYXNlIiwiaW5wdXQiLCJSZXF1ZXN0IiwidXJsIiwiY3JlZGVudGlhbHMiLCJtb2RlIiwibm9ybWFsaXplTWV0aG9kIiwicmVmZXJyZXIiLCJjbG9uZSIsImZvcm0iLCJ0cmltIiwic3BsaXQiLCJieXRlcyIsInJlcGxhY2UiLCJkZWNvZGVVUklDb21wb25lbnQiLCJyYXdIZWFkZXJzIiwibGluZSIsInBhcnRzIiwia2V5IiwiUmVzcG9uc2UiLCJib2R5SW5pdCIsInN0YXR1cyIsIm9rIiwic3RhdHVzVGV4dCIsInJlc3BvbnNlIiwicmVkaXJlY3RTdGF0dXNlcyIsInJlZGlyZWN0IiwiUmFuZ2VFcnJvciIsImxvY2F0aW9uIiwiaW5pdCIsInJlcXVlc3QiLCJ4aHIiLCJwYXJzZUhlYWRlcnMiLCJnZXRBbGxSZXNwb25zZUhlYWRlcnMiLCJyZXNwb25zZVVSTCIsInJlc3BvbnNlVGV4dCIsIm9udGltZW91dCIsIm9wZW4iLCJ3aXRoQ3JlZGVudGlhbHMiLCJyZXNwb25zZVR5cGUiLCJzZXRSZXF1ZXN0SGVhZGVyIiwic2VuZCIsInBvbHlmaWxsIiwiZW5kcG9pbnQiLCJhc3luYyIsIndhcm4iLCJwcmVwYXJlZE9wdGlvbnMiLCJwcmVwYXJlRmV0Y2hPcHRpb25zIiwiaW5pdEZldGNoIiwicmVzIiwiZGVmYXVsdE9wdGlvbnMiLCJBY2NlcHQiLCJzZWFyY2hQcm9wUGF0aCIsInBhdGgiLCJjb2xsZWN0aW9uIiwiZGVsaW1pdGVyIiwic2FmZVBhdGgiLCJwYXRoUmVzdWx0IiwicGFyYW1zIiwic2VhcmNoIiwicSIsInJlZHVjZSIsImFjYyIsImFyciIsInZhbCIsInBhcnNlRXh0ZXJuYWxNYXJrZG93bkxpbmtzIiwic3RyaW5nIiwicGF0dGVybiIsImFyZ0VsZW1lbnQiLCJlbGVtZW50IiwiYXJnVGhyZXNob2xkIiwidGhyZXNob2xkIiwiZGVmYXVsdFBhcmFtcyIsInNhZmVBcmdzIiwicmVjdCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInZpZXdwb3J0SGVpZ2h0IiwiTWF0aCIsIm1heCIsImRvY3VtZW50IiwiZG9jdW1lbnRFbGVtZW50IiwiY2xpZW50SGVpZ2h0IiwiaW5uZXJIZWlnaHQiLCJoZWlnaHQiLCJ0b3AiLCJib3R0b20iLCJ0byIsImR1cmF0aW9uIiwiZGlmZmVyZW5jZSIsInNjcm9sbFRvcCIsInBlclRpY2siLCJzZWxlY3QiLCJxdWVyeSIsInF1ZXJ5U2VsZWN0b3IiLCJzZWxlY3RBbGwiLCJxdWVyeVNlbGVjdG9yQWxsIiwic2VsZWN0QnlJZCIsImlkIiwiZ2V0RWxlbWVudEJ5SWQiLCJjYXBpdGFsaXplIiwidWNGaXJzdCIsInMiLCJzbHVnaWZ5IiwidGV4dFRvU2x1ZyIsImZpcnN0TGV0dGVyIiwicmVzdExldHRlcnMiXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7OztBQVFBLElBQU1BLGdCQUFnQixzQkFBQSxDQUF1QkMsT0FBdkI7UUFDaEJDLFNBQVNBLFNBQVNBLE1BQVQsR0FBa0IsS0FBL0I7UUFDSUMsT0FBTyxPQUFPQSxJQUFQLEtBQWdCLFdBQWhCLEdBQStCRCxTQUFTQSxNQUFULEdBQWtCRSxNQUFqRCxHQUEyREQsSUFBdEU7UUFDSUUsVUFBV0osV0FBV0EsUUFBUUksT0FBcEIsSUFBZ0NGLEtBQUtFLE9BQW5EO1FBQ0lDLGlCQUNETCxX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
