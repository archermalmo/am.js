(function (self) {
  if (self.fetch) {
    return;
  }

  var support = {
    searchParams: 'URLSearchParams' in self,
    iterable: 'Symbol' in self && 'iterator' in Symbol,
    blob: 'FileReader' in self && 'Blob' in self && function () {
      try {
        new Blob();
        return true;
      } catch (e) {
        return false;
      }
    }(),
    formData: 'FormData' in self,
    arrayBuffer: 'ArrayBuffer' in self
  };

  if (support.arrayBuffer) {
    var viewClasses = ['[object Int8Array]', '[object Uint8Array]', '[object Uint8ClampedArray]', '[object Int16Array]', '[object Uint16Array]', '[object Int32Array]', '[object Uint32Array]', '[object Float32Array]', '[object Float64Array]'];

    var isDataView = function isDataView(obj) {
      return obj && DataView.prototype.isPrototypeOf(obj);
    };

    var isArrayBufferView = ArrayBuffer.isView || function (obj) {
      return obj && viewClasses.indexOf(Object.prototype.toString.call(obj)) > -1;
    };
  }

  function normalizeName(name) {
    if (typeof name !== 'string') {
      name = String(name);
    }
    if (/[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(name)) {
      throw new TypeError('Invalid character in header field name');
    }
    return name.toLowerCase();
  }

  function normalizeValue(value) {
    if (typeof value !== 'string') {
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
    this.map[name] = oldValue ? oldValue + ',' + value : value;
  };

  Headers.prototype['delete'] = function (name) {
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
      return Promise.reject(new TypeError('Already read'));
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
    return chars.join('');
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
        this._bodyText = '';
      } else if (typeof body === 'string') {
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
        throw new Error('unsupported BodyInit type');
      }

      if (!this.headers.get('content-type')) {
        if (typeof body === 'string') {
          this.headers.set('content-type', 'text/plain;charset=UTF-8');
        } else if (this._bodyBlob && this._bodyBlob.type) {
          this.headers.set('content-type', this._bodyBlob.type);
        } else if (support.searchParams && URLSearchParams.prototype.isPrototypeOf(body)) {
          this.headers.set('content-type', 'application/x-www-form-urlencoded;charset=UTF-8');
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
          throw new Error('could not read FormData body as blob');
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
        throw new Error('could not read FormData body as text');
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
  var methods = ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'POST', 'PUT'];

  function normalizeMethod(method) {
    var upcased = method.toUpperCase();
    return methods.indexOf(upcased) > -1 ? upcased : method;
  }

  function Request(input, options) {
    options = options || {};
    var body = options.body;

    if (input instanceof Request) {
      if (input.bodyUsed) {
        throw new TypeError('Already read');
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

    this.credentials = options.credentials || this.credentials || 'omit';
    if (options.headers || !this.headers) {
      this.headers = new Headers(options.headers);
    }
    this.method = normalizeMethod(options.method || this.method || 'GET');
    this.mode = options.mode || this.mode || null;
    this.referrer = null;

    if ((this.method === 'GET' || this.method === 'HEAD') && body) {
      throw new TypeError('Body not allowed for GET or HEAD requests');
    }
    this._initBody(body);
  }

  Request.prototype.clone = function () {
    return new Request(this, { body: this._bodyInit });
  };

  function decode(body) {
    var form = new FormData();
    body.trim().split('&').forEach(function (bytes) {
      if (bytes) {
        var split = bytes.split('=');
        var name = split.shift().replace(/\+/g, ' ');
        var value = split.join('=').replace(/\+/g, ' ');
        form.append(decodeURIComponent(name), decodeURIComponent(value));
      }
    });
    return form;
  }

  function parseHeaders(rawHeaders) {
    var headers = new Headers();
    rawHeaders.split(/\r?\n/).forEach(function (line) {
      var parts = line.split(':');
      var key = parts.shift().trim();
      if (key) {
        var value = parts.join(':').trim();
        headers.append(key, value);
      }
    });
    return headers;
  }

  Body.call(Request.prototype);

  function Response(bodyInit, options) {
    if (!options) {
      options = {};
    }

    this.type = 'default';
    this.status = 'status' in options ? options.status : 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = 'statusText' in options ? options.statusText : 'OK';
    this.headers = new Headers(options.headers);
    this.url = options.url || '';
    this._initBody(bodyInit);
  }

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
    var response = new Response(null, { status: 0, statusText: '' });
    response.type = 'error';
    return response;
  };

  var redirectStatuses = [301, 302, 303, 307, 308];

  Response.redirect = function (url, status) {
    if (redirectStatuses.indexOf(status) === -1) {
      throw new RangeError('Invalid status code');
    }

    return new Response(null, { status: status, headers: { location: url } });
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
          headers: parseHeaders(xhr.getAllResponseHeaders() || '')
        };
        options.url = 'responseURL' in xhr ? xhr.responseURL : options.headers.get('X-Request-URL');
        var body = 'response' in xhr ? xhr.response : xhr.responseText;
        resolve(new Response(body, options));
      };

      xhr.onerror = function () {
        reject(new TypeError('Network request failed'));
      };

      xhr.ontimeout = function () {
        reject(new TypeError('Network request failed'));
      };

      xhr.open(request.method, request.url, true);

      if (request.credentials === 'include') {
        xhr.withCredentials = true;
      }

      if ('responseType' in xhr && support.blob) {
        xhr.responseType = 'blob';
      }

      request.headers.forEach(function (value, name) {
        xhr.setRequestHeader(name, value);
      });

      xhr.send(typeof request._bodyInit === 'undefined' ? null : request._bodyInit);
    });
  };
  self.fetch.polyfill = true;
})(typeof self !== 'undefined' ? self : undefined);

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Request =
// Constructor
function Request(_ref) {
    var _this = this;

    var endpoint = _ref.endpoint,
        options = _ref.options,
        body = _ref.body;

    _classCallCheck(this, Request);

    // Private methods
    /**
     * @name prepareFetchOptions
     * @description Creates blank FormData object if this.body is undefined and this.options.method is equal to "POST"
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
     * @name send
     * @param	{object} options Allows property `async` to be set to indicate the response should be prepared before returning
     * @returns {Promise}
     */
    this.send = function () {
        var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { async: false },
            async = _ref2.async;

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


Request.defaultOptions = {
    method: "GET",
    headers: { Accept: "application/json" }
};

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/**
 * Base from https://gist.github.com/geoffdavis92/1da7d0745e3bba036f94
 * @name params
 * @description Creates object of key/value pairs from URL parameters.
 * @param {string} url URL to parse; defaults to `window.location.search`
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
 * @name parseMarkdownLinks
 * @param {string} string String to parse as Markdown link
 * @returns {string}
 */
var parseMarkdownLinks = function parseMarkdownLinks(string) {
    var pattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    if (string.search(pattern) > -1) {
        return string.replace(pattern, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    } else {
        return string;
    }
};

var _extends$1 = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

/**
 * @name isElementInViewport
 * @description Determines if a given element is partially or
 * fully visible in the viewport.
 * @param {object} config Config object.
 * @property {Element} element HTML Element node to target.
 * @property {number} elementDivisorSize Size of division of
 * element's height to offset. E.g. 2 is half the height, 3
 * is one-third the height, etc.
 * @property {boolean} useBottomOffset Determines if offset
 * generated from elementDivisorSize should be applied to
 * the bottom of the element.
 * @return {boolean}
 */
function isElementInViewport(_ref) {
    var element = _ref.element,
        elementDivisorSize = _ref.elementDivisorSize,
        useBottomOffset = _ref.useBottomOffset;

    var defaultParams = { elementDivisorSize: 1, useBottomOffset: false };
    var safeArgs = _extends$1({}, defaultParams, {
        element: element,
        elementDivisorSize: Math.ceil(Math.abs(elementDivisorSize)),
        useBottomOffset: useBottomOffset
    });

    var _element$getBoundingC = element.getBoundingClientRect(),
        top = _element$getBoundingC.top,
        bottom = _element$getBoundingC.bottom,
        height = _element$getBoundingC.height;

    var triggerTop = (window.innerHeight || document.documentElement.clientHeight) - height / elementDivisorSize;
    var triggerBottom = useBottomOffset ? height / elementDivisorSize : 0;
    return bottom >= triggerBottom && top <= triggerTop;
}
/**
 * From http://bit.ly/2cP65fD
 * @name scrollTo
 * @description Scrolls given element to determined point.
 * @param  {Element} element  [description]
 * @param  {number} to       [description]
 * @param  {number} duration [description]
 * @return {void}          [description]
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

var select = function select(query) {
    return document.querySelector(query);
};
var selectAll = function selectAll(query) {
    var elementArray = [];
    var allMatches = document.querySelectorAll(query);
    for (var i = 0; i < allMatches.length; i++) {
        elementArray.push(allMatches[i]);
    }
    return elementArray;
};
var selectById = function selectById(id) {
    return document.getElementById(id);
};

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var trim = function trim(string) {
    return string.replace(/^\s+|\s$/g, "");
};
var ucFirst = function ucFirst(_ref) {
    var _ref2 = _toArray(_ref),
        firstLetter = _ref2[0],
        restLetters = _ref2.slice(1);

    return "" + firstLetter.toUpperCase() + restLetters.join("");
};
var capitalize = function capitalize(string) {
    return string.split(" ").map(function (s) {
        return ucFirst(s);
    }).join(" ");
};
var slugify = function slugify(textToSlug) {
    var delimiter = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "-";

    return textToSlug.replace(/(\!|#|\$|%|\*|\.|\/|\\|\(|\)|\+|\||\,|\:|\'|\")/g, "").replace(/(.)(\s|\_|\-)+(.)/g, "$1" + delimiter + "$3").toLowerCase();
};

export { Request, capitalize, isElementInViewport, parseMarkdownLinks, params as parseURLParams, scrollTo, select, selectAll, selectById, slugify, trim, ucFirst };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW0uZXNtLmRldi5qcyIsInNvdXJjZXMiOlsiLi4vbm9kZV9tb2R1bGVzL3doYXR3Zy1mZXRjaC9mZXRjaC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oc2VsZikge1xuICAndXNlIHN0cmljdCc7XG5cbiAgaWYgKHNlbGYuZmV0Y2gpIHtcbiAgICByZXR1cm5cbiAgfVxuXG4gIHZhciBzdXBwb3J0ID0ge1xuICAgIHNlYXJjaFBhcmFtczogJ1VSTFNlYXJjaFBhcmFtcycgaW4gc2VsZixcbiAgICBpdGVyYWJsZTogJ1N5bWJvbCcgaW4gc2VsZiAmJiAnaXRlcmF0b3InIGluIFN5bWJvbCxcbiAgICBibG9iOiAnRmlsZVJlYWRlcicgaW4gc2VsZiAmJiAnQmxvYicgaW4gc2VsZiAmJiAoZnVuY3Rpb24oKSB7XG4gICAgICB0cnkge1xuICAgICAgICBuZXcgQmxvYigpXG4gICAgICAgIHJldHVybiB0cnVlXG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgICB9XG4gICAgfSkoKSxcbiAgICBmb3JtRGF0YTogJ0Zvcm1EYXRhJyBpbiBzZWxmLFxuICAgIGFycmF5QnVmZmVyOiAnQXJyYXlCdWZmZXInIGluIHNlbGZcbiAgfVxuXG4gIGlmIChzdXBwb3J0LmFycmF5QnVmZmVyKSB7XG4gICAgdmFyIHZpZXdDbGFzc2VzID0gW1xuICAgICAgJ1tvYmplY3QgSW50OEFycmF5XScsXG4gICAgICAnW29iamVjdCBVaW50OEFycmF5XScsXG4gICAgICAnW29iamVjdCBVaW50OENsYW1wZWRBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgSW50MTZBcnJheV0nLFxuICAgICAgJ1tvYmplY3QgVWludDE2QXJyYXldJyxcbiAgICAgICdbb2JqZWN0IEludDMyQXJyYXldJyxcbiAgICAgICdbb2JqZWN0IFVpbnQzMkFycmF5XScsXG4gICAgICAnW29iamVjdCBGbG9hdDMyQXJyYXldJyxcbiAgICAgICdbb2JqZWN0IEZsb2F0NjRBcnJheV0nXG4gICAgXVxuXG4gICAgdmFyIGlzRGF0YVZpZXcgPSBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogJiYgRGF0YVZpZXcucHJvdG90eXBlLmlzUHJvdG90eXBlT2Yob2JqKVxuICAgIH1cblxuICAgIHZhciBpc0FycmF5QnVmZmVyVmlldyA9IEFycmF5QnVmZmVyLmlzVmlldyB8fCBmdW5jdGlvbihvYmopIHtcbiAgICAgIHJldHVybiBvYmogJiYgdmlld0NsYXNzZXMuaW5kZXhPZihPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwob2JqKSkgPiAtMVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZU5hbWUobmFtZSkge1xuICAgIGlmICh0eXBlb2YgbmFtZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIG5hbWUgPSBTdHJpbmcobmFtZSlcbiAgICB9XG4gICAgaWYgKC9bXmEtejAtOVxcLSMkJSYnKisuXFxeX2B8fl0vaS50ZXN0KG5hbWUpKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdJbnZhbGlkIGNoYXJhY3RlciBpbiBoZWFkZXIgZmllbGQgbmFtZScpXG4gICAgfVxuICAgIHJldHVybiBuYW1lLnRvTG93ZXJDYXNlKClcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZVZhbHVlKHZhbHVlKSB7XG4gICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHZhbHVlID0gU3RyaW5nKHZhbHVlKVxuICAgIH1cbiAgICByZXR1cm4gdmFsdWVcbiAgfVxuXG4gIC8vIEJ1aWxkIGEgZGVzdHJ1Y3RpdmUgaXRlcmF0b3IgZm9yIHRoZSB2YWx1ZSBsaXN0XG4gIGZ1bmN0aW9uIGl0ZXJhdG9yRm9yKGl0ZW1zKSB7XG4gICAgdmFyIGl0ZXJhdG9yID0ge1xuICAgICAgbmV4dDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IGl0ZW1zLnNoaWZ0KClcbiAgICAgICAgcmV0dXJuIHtkb25lOiB2YWx1ZSA9PT0gdW5kZWZpbmVkLCB2YWx1ZTogdmFsdWV9XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN1cHBvcnQuaXRlcmFibGUpIHtcbiAgICAgIGl0ZXJhdG9yW1N5bWJvbC5pdGVyYXRvcl0gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGl0ZXJhdG9yXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGl0ZXJhdG9yXG4gIH1cblxuICBmdW5jdGlvbiBIZWFkZXJzKGhlYWRlcnMpIHtcbiAgICB0aGlzLm1hcCA9IHt9XG5cbiAgICBpZiAoaGVhZGVycyBpbnN0YW5jZW9mIEhlYWRlcnMpIHtcbiAgICAgIGhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICB0aGlzLmFwcGVuZChuYW1lLCB2YWx1ZSlcbiAgICAgIH0sIHRoaXMpXG4gICAgfSBlbHNlIGlmIChBcnJheS5pc0FycmF5KGhlYWRlcnMpKSB7XG4gICAgICBoZWFkZXJzLmZvckVhY2goZnVuY3Rpb24oaGVhZGVyKSB7XG4gICAgICAgIHRoaXMuYXBwZW5kKGhlYWRlclswXSwgaGVhZGVyWzFdKVxuICAgICAgfSwgdGhpcylcbiAgICB9IGVsc2UgaWYgKGhlYWRlcnMpIHtcbiAgICAgIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGhlYWRlcnMpLmZvckVhY2goZnVuY3Rpb24obmFtZSkge1xuICAgICAgICB0aGlzLmFwcGVuZChuYW1lLCBoZWFkZXJzW25hbWVdKVxuICAgICAgfSwgdGhpcylcbiAgICB9XG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5hcHBlbmQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpXG4gICAgdmFsdWUgPSBub3JtYWxpemVWYWx1ZSh2YWx1ZSlcbiAgICB2YXIgb2xkVmFsdWUgPSB0aGlzLm1hcFtuYW1lXVxuICAgIHRoaXMubWFwW25hbWVdID0gb2xkVmFsdWUgPyBvbGRWYWx1ZSsnLCcrdmFsdWUgOiB2YWx1ZVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGVbJ2RlbGV0ZSddID0gZnVuY3Rpb24obmFtZSkge1xuICAgIGRlbGV0ZSB0aGlzLm1hcFtub3JtYWxpemVOYW1lKG5hbWUpXVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24obmFtZSkge1xuICAgIG5hbWUgPSBub3JtYWxpemVOYW1lKG5hbWUpXG4gICAgcmV0dXJuIHRoaXMuaGFzKG5hbWUpID8gdGhpcy5tYXBbbmFtZV0gOiBudWxsXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5oYXMgPSBmdW5jdGlvbihuYW1lKSB7XG4gICAgcmV0dXJuIHRoaXMubWFwLmhhc093blByb3BlcnR5KG5vcm1hbGl6ZU5hbWUobmFtZSkpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSkge1xuICAgIHRoaXMubWFwW25vcm1hbGl6ZU5hbWUobmFtZSldID0gbm9ybWFsaXplVmFsdWUodmFsdWUpXG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5mb3JFYWNoID0gZnVuY3Rpb24oY2FsbGJhY2ssIHRoaXNBcmcpIHtcbiAgICBmb3IgKHZhciBuYW1lIGluIHRoaXMubWFwKSB7XG4gICAgICBpZiAodGhpcy5tYXAuaGFzT3duUHJvcGVydHkobmFtZSkpIHtcbiAgICAgICAgY2FsbGJhY2suY2FsbCh0aGlzQXJnLCB0aGlzLm1hcFtuYW1lXSwgbmFtZSwgdGhpcylcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBIZWFkZXJzLnByb3RvdHlwZS5rZXlzID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGl0ZW1zID0gW11cbiAgICB0aGlzLmZvckVhY2goZnVuY3Rpb24odmFsdWUsIG5hbWUpIHsgaXRlbXMucHVzaChuYW1lKSB9KVxuICAgIHJldHVybiBpdGVyYXRvckZvcihpdGVtcylcbiAgfVxuXG4gIEhlYWRlcnMucHJvdG90eXBlLnZhbHVlcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpdGVtcyA9IFtdXG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlKSB7IGl0ZW1zLnB1c2godmFsdWUpIH0pXG4gICAgcmV0dXJuIGl0ZXJhdG9yRm9yKGl0ZW1zKVxuICB9XG5cbiAgSGVhZGVycy5wcm90b3R5cGUuZW50cmllcyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBpdGVtcyA9IFtdXG4gICAgdGhpcy5mb3JFYWNoKGZ1bmN0aW9uKHZhbHVlLCBuYW1lKSB7IGl0ZW1zLnB1c2goW25hbWUsIHZhbHVlXSkgfSlcbiAgICByZXR1cm4gaXRlcmF0b3JGb3IoaXRlbXMpXG4gIH1cblxuICBpZiAoc3VwcG9ydC5pdGVyYWJsZSkge1xuICAgIEhlYWRlcnMucHJvdG90eXBlW1N5bWJvbC5pdGVyYXRvcl0gPSBIZWFkZXJzLnByb3RvdHlwZS5lbnRyaWVzXG4gIH1cblxuICBmdW5jdGlvbiBjb25zdW1lZChib2R5KSB7XG4gICAgaWYgKGJvZHkuYm9keVVzZWQpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgVHlwZUVycm9yKCdBbHJlYWR5IHJlYWQnKSlcbiAgICB9XG4gICAgYm9keS5ib2R5VXNlZCA9IHRydWVcbiAgfVxuXG4gIGZ1bmN0aW9uIGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc29sdmUocmVhZGVyLnJlc3VsdClcbiAgICAgIH1cbiAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlamVjdChyZWFkZXIuZXJyb3IpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRCbG9iQXNBcnJheUJ1ZmZlcihibG9iKSB7XG4gICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKClcbiAgICB2YXIgcHJvbWlzZSA9IGZpbGVSZWFkZXJSZWFkeShyZWFkZXIpXG4gICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGJsb2IpXG4gICAgcmV0dXJuIHByb21pc2VcbiAgfVxuXG4gIGZ1bmN0aW9uIHJlYWRCbG9iQXNUZXh0KGJsb2IpIHtcbiAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKVxuICAgIHZhciBwcm9taXNlID0gZmlsZVJlYWRlclJlYWR5KHJlYWRlcilcbiAgICByZWFkZXIucmVhZEFzVGV4dChibG9iKVxuICAgIHJldHVybiBwcm9taXNlXG4gIH1cblxuICBmdW5jdGlvbiByZWFkQXJyYXlCdWZmZXJBc1RleHQoYnVmKSB7XG4gICAgdmFyIHZpZXcgPSBuZXcgVWludDhBcnJheShidWYpXG4gICAgdmFyIGNoYXJzID0gbmV3IEFycmF5KHZpZXcubGVuZ3RoKVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB2aWV3Lmxlbmd0aDsgaSsrKSB7XG4gICAgICBjaGFyc1tpXSA9IFN0cmluZy5mcm9tQ2hhckNvZGUodmlld1tpXSlcbiAgICB9XG4gICAgcmV0dXJuIGNoYXJzLmpvaW4oJycpXG4gIH1cblxuICBmdW5jdGlvbiBidWZmZXJDbG9uZShidWYpIHtcbiAgICBpZiAoYnVmLnNsaWNlKSB7XG4gICAgICByZXR1cm4gYnVmLnNsaWNlKDApXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYnVmLmJ5dGVMZW5ndGgpXG4gICAgICB2aWV3LnNldChuZXcgVWludDhBcnJheShidWYpKVxuICAgICAgcmV0dXJuIHZpZXcuYnVmZmVyXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gQm9keSgpIHtcbiAgICB0aGlzLmJvZHlVc2VkID0gZmFsc2VcblxuICAgIHRoaXMuX2luaXRCb2R5ID0gZnVuY3Rpb24oYm9keSkge1xuICAgICAgdGhpcy5fYm9keUluaXQgPSBib2R5XG4gICAgICBpZiAoIWJvZHkpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSAnJ1xuICAgICAgfSBlbHNlIGlmICh0eXBlb2YgYm9keSA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgdGhpcy5fYm9keVRleHQgPSBib2R5XG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYmxvYiAmJiBCbG9iLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlCbG9iID0gYm9keVxuICAgICAgfSBlbHNlIGlmIChzdXBwb3J0LmZvcm1EYXRhICYmIEZvcm1EYXRhLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlGb3JtRGF0YSA9IGJvZHlcbiAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiYgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgIHRoaXMuX2JvZHlUZXh0ID0gYm9keS50b1N0cmluZygpXG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIgJiYgc3VwcG9ydC5ibG9iICYmIGlzRGF0YVZpZXcoYm9keSkpIHtcbiAgICAgICAgdGhpcy5fYm9keUFycmF5QnVmZmVyID0gYnVmZmVyQ2xvbmUoYm9keS5idWZmZXIpXG4gICAgICAgIC8vIElFIDEwLTExIGNhbid0IGhhbmRsZSBhIERhdGFWaWV3IGJvZHkuXG4gICAgICAgIHRoaXMuX2JvZHlJbml0ID0gbmV3IEJsb2IoW3RoaXMuX2JvZHlBcnJheUJ1ZmZlcl0pXG4gICAgICB9IGVsc2UgaWYgKHN1cHBvcnQuYXJyYXlCdWZmZXIgJiYgKEFycmF5QnVmZmVyLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpIHx8IGlzQXJyYXlCdWZmZXJWaWV3KGJvZHkpKSkge1xuICAgICAgICB0aGlzLl9ib2R5QXJyYXlCdWZmZXIgPSBidWZmZXJDbG9uZShib2R5KVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCd1bnN1cHBvcnRlZCBCb2R5SW5pdCB0eXBlJylcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aGlzLmhlYWRlcnMuZ2V0KCdjb250ZW50LXR5cGUnKSkge1xuICAgICAgICBpZiAodHlwZW9mIGJvZHkgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgJ3RleHQvcGxhaW47Y2hhcnNldD1VVEYtOCcpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUJsb2IgJiYgdGhpcy5fYm9keUJsb2IudHlwZSkge1xuICAgICAgICAgIHRoaXMuaGVhZGVycy5zZXQoJ2NvbnRlbnQtdHlwZScsIHRoaXMuX2JvZHlCbG9iLnR5cGUpXG4gICAgICAgIH0gZWxzZSBpZiAoc3VwcG9ydC5zZWFyY2hQYXJhbXMgJiYgVVJMU2VhcmNoUGFyYW1zLnByb3RvdHlwZS5pc1Byb3RvdHlwZU9mKGJvZHkpKSB7XG4gICAgICAgICAgdGhpcy5oZWFkZXJzLnNldCgnY29udGVudC10eXBlJywgJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZDtjaGFyc2V0PVVURi04JylcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdXBwb3J0LmJsb2IpIHtcbiAgICAgIHRoaXMuYmxvYiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgICAgICBpZiAocmVqZWN0ZWQpIHtcbiAgICAgICAgICByZXR1cm4gcmVqZWN0ZWRcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLl9ib2R5QmxvYikge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keUJsb2IpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShuZXcgQmxvYihbdGhpcy5fYm9keUFycmF5QnVmZmVyXSkpXG4gICAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdjb3VsZCBub3QgcmVhZCBGb3JtRGF0YSBib2R5IGFzIGJsb2InKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV3IEJsb2IoW3RoaXMuX2JvZHlUZXh0XSkpXG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgdGhpcy5hcnJheUJ1ZmZlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAodGhpcy5fYm9keUFycmF5QnVmZmVyKSB7XG4gICAgICAgICAgcmV0dXJuIGNvbnN1bWVkKHRoaXMpIHx8IFByb21pc2UucmVzb2x2ZSh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRoaXMuYmxvYigpLnRoZW4ocmVhZEJsb2JBc0FycmF5QnVmZmVyKVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy50ZXh0ID0gZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcmVqZWN0ZWQgPSBjb25zdW1lZCh0aGlzKVxuICAgICAgaWYgKHJlamVjdGVkKSB7XG4gICAgICAgIHJldHVybiByZWplY3RlZFxuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5fYm9keUJsb2IpIHtcbiAgICAgICAgcmV0dXJuIHJlYWRCbG9iQXNUZXh0KHRoaXMuX2JvZHlCbG9iKVxuICAgICAgfSBlbHNlIGlmICh0aGlzLl9ib2R5QXJyYXlCdWZmZXIpIHtcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShyZWFkQXJyYXlCdWZmZXJBc1RleHQodGhpcy5fYm9keUFycmF5QnVmZmVyKSlcbiAgICAgIH0gZWxzZSBpZiAodGhpcy5fYm9keUZvcm1EYXRhKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcignY291bGQgbm90IHJlYWQgRm9ybURhdGEgYm9keSBhcyB0ZXh0JylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5fYm9keVRleHQpXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHN1cHBvcnQuZm9ybURhdGEpIHtcbiAgICAgIHRoaXMuZm9ybURhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oZGVjb2RlKVxuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuanNvbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIHRoaXMudGV4dCgpLnRoZW4oSlNPTi5wYXJzZSlcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG5cbiAgLy8gSFRUUCBtZXRob2RzIHdob3NlIGNhcGl0YWxpemF0aW9uIHNob3VsZCBiZSBub3JtYWxpemVkXG4gIHZhciBtZXRob2RzID0gWydERUxFVEUnLCAnR0VUJywgJ0hFQUQnLCAnT1BUSU9OUycsICdQT1NUJywgJ1BVVCddXG5cbiAgZnVuY3Rpb24gbm9ybWFsaXplTWV0aG9kKG1ldGhvZCkge1xuICAgIHZhciB1cGNhc2VkID0gbWV0aG9kLnRvVXBwZXJDYXNlKClcbiAgICByZXR1cm4gKG1ldGhvZHMuaW5kZXhPZih1cGNhc2VkKSA+IC0xKSA/IHVwY2FzZWQgOiBtZXRob2RcbiAgfVxuXG4gIGZ1bmN0aW9uIFJlcXVlc3QoaW5wdXQsIG9wdGlvbnMpIHtcbiAgICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICAgIHZhciBib2R5ID0gb3B0aW9ucy5ib2R5XG5cbiAgICBpZiAoaW5wdXQgaW5zdGFuY2VvZiBSZXF1ZXN0KSB7XG4gICAgICBpZiAoaW5wdXQuYm9keVVzZWQpIHtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQWxyZWFkeSByZWFkJylcbiAgICAgIH1cbiAgICAgIHRoaXMudXJsID0gaW5wdXQudXJsXG4gICAgICB0aGlzLmNyZWRlbnRpYWxzID0gaW5wdXQuY3JlZGVudGlhbHNcbiAgICAgIGlmICghb3B0aW9ucy5oZWFkZXJzKSB7XG4gICAgICAgIHRoaXMuaGVhZGVycyA9IG5ldyBIZWFkZXJzKGlucHV0LmhlYWRlcnMpXG4gICAgICB9XG4gICAgICB0aGlzLm1ldGhvZCA9IGlucHV0Lm1ldGhvZFxuICAgICAgdGhpcy5tb2RlID0gaW5wdXQubW9kZVxuICAgICAgaWYgKCFib2R5ICYmIGlucHV0Ll9ib2R5SW5pdCAhPSBudWxsKSB7XG4gICAgICAgIGJvZHkgPSBpbnB1dC5fYm9keUluaXRcbiAgICAgICAgaW5wdXQuYm9keVVzZWQgPSB0cnVlXG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMudXJsID0gU3RyaW5nKGlucHV0KVxuICAgIH1cblxuICAgIHRoaXMuY3JlZGVudGlhbHMgPSBvcHRpb25zLmNyZWRlbnRpYWxzIHx8IHRoaXMuY3JlZGVudGlhbHMgfHwgJ29taXQnXG4gICAgaWYgKG9wdGlvbnMuaGVhZGVycyB8fCAhdGhpcy5oZWFkZXJzKSB7XG4gICAgICB0aGlzLmhlYWRlcnMgPSBuZXcgSGVhZGVycyhvcHRpb25zLmhlYWRlcnMpXG4gICAgfVxuICAgIHRoaXMubWV0aG9kID0gbm9ybWFsaXplTWV0aG9kKG9wdGlvbnMubWV0aG9kIHx8IHRoaXMubWV0aG9kIHx8ICdHRVQnKVxuICAgIHRoaXMubW9kZSA9IG9wdGlvbnMubW9kZSB8fCB0aGlzLm1vZGUgfHwgbnVsbFxuICAgIHRoaXMucmVmZXJyZXIgPSBudWxsXG5cbiAgICBpZiAoKHRoaXMubWV0aG9kID09PSAnR0VUJyB8fCB0aGlzLm1ldGhvZCA9PT0gJ0hFQUQnKSAmJiBib2R5KSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdCb2R5IG5vdCBhbGxvd2VkIGZvciBHRVQgb3IgSEVBRCByZXF1ZXN0cycpXG4gICAgfVxuICAgIHRoaXMuX2luaXRCb2R5KGJvZHkpXG4gIH1cblxuICBSZXF1ZXN0LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBuZXcgUmVxdWVzdCh0aGlzLCB7IGJvZHk6IHRoaXMuX2JvZHlJbml0IH0pXG4gIH1cblxuICBmdW5jdGlvbiBkZWNvZGUoYm9keSkge1xuICAgIHZhciBmb3JtID0gbmV3IEZvcm1EYXRhKClcbiAgICBib2R5LnRyaW0oKS5zcGxpdCgnJicpLmZvckVhY2goZnVuY3Rpb24oYnl0ZXMpIHtcbiAgICAgIGlmIChieXRlcykge1xuICAgICAgICB2YXIgc3BsaXQgPSBieXRlcy5zcGxpdCgnPScpXG4gICAgICAgIHZhciBuYW1lID0gc3BsaXQuc2hpZnQoKS5yZXBsYWNlKC9cXCsvZywgJyAnKVxuICAgICAgICB2YXIgdmFsdWUgPSBzcGxpdC5qb2luKCc9JykucmVwbGFjZSgvXFwrL2csICcgJylcbiAgICAgICAgZm9ybS5hcHBlbmQoZGVjb2RlVVJJQ29tcG9uZW50KG5hbWUpLCBkZWNvZGVVUklDb21wb25lbnQodmFsdWUpKVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIGZvcm1cbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlSGVhZGVycyhyYXdIZWFkZXJzKSB7XG4gICAgdmFyIGhlYWRlcnMgPSBuZXcgSGVhZGVycygpXG4gICAgcmF3SGVhZGVycy5zcGxpdCgvXFxyP1xcbi8pLmZvckVhY2goZnVuY3Rpb24obGluZSkge1xuICAgICAgdmFyIHBhcnRzID0gbGluZS5zcGxpdCgnOicpXG4gICAgICB2YXIga2V5ID0gcGFydHMuc2hpZnQoKS50cmltKClcbiAgICAgIGlmIChrZXkpIHtcbiAgICAgICAgdmFyIHZhbHVlID0gcGFydHMuam9pbignOicpLnRyaW0oKVxuICAgICAgICBoZWFkZXJzLmFwcGVuZChrZXksIHZhbHVlKVxuICAgICAgfVxuICAgIH0pXG4gICAgcmV0dXJuIGhlYWRlcnNcbiAgfVxuXG4gIEJvZHkuY2FsbChSZXF1ZXN0LnByb3RvdHlwZSlcblxuICBmdW5jdGlvbiBSZXNwb25zZShib2R5SW5pdCwgb3B0aW9ucykge1xuICAgIGlmICghb3B0aW9ucykge1xuICAgICAgb3B0aW9ucyA9IHt9XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ2RlZmF1bHQnXG4gICAgdGhpcy5zdGF0dXMgPSAnc3RhdHVzJyBpbiBvcHRpb25zID8gb3B0aW9ucy5zdGF0dXMgOiAyMDBcbiAgICB0aGlzLm9rID0gdGhpcy5zdGF0dXMgPj0gMjAwICYmIHRoaXMuc3RhdHVzIDwgMzAwXG4gICAgdGhpcy5zdGF0dXNUZXh0ID0gJ3N0YXR1c1RleHQnIGluIG9wdGlvbnMgPyBvcHRpb25zLnN0YXR1c1RleHQgOiAnT0snXG4gICAgdGhpcy5oZWFkZXJzID0gbmV3IEhlYWRlcnMob3B0aW9ucy5oZWFkZXJzKVxuICAgIHRoaXMudXJsID0gb3B0aW9ucy51cmwgfHwgJydcbiAgICB0aGlzLl9pbml0Qm9keShib2R5SW5pdClcbiAgfVxuXG4gIEJvZHkuY2FsbChSZXNwb25zZS5wcm90b3R5cGUpXG5cbiAgUmVzcG9uc2UucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIG5ldyBSZXNwb25zZSh0aGlzLl9ib2R5SW5pdCwge1xuICAgICAgc3RhdHVzOiB0aGlzLnN0YXR1cyxcbiAgICAgIHN0YXR1c1RleHQ6IHRoaXMuc3RhdHVzVGV4dCxcbiAgICAgIGhlYWRlcnM6IG5ldyBIZWFkZXJzKHRoaXMuaGVhZGVycyksXG4gICAgICB1cmw6IHRoaXMudXJsXG4gICAgfSlcbiAgfVxuXG4gIFJlc3BvbnNlLmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIHJlc3BvbnNlID0gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IDAsIHN0YXR1c1RleHQ6ICcnfSlcbiAgICByZXNwb25zZS50eXBlID0gJ2Vycm9yJ1xuICAgIHJldHVybiByZXNwb25zZVxuICB9XG5cbiAgdmFyIHJlZGlyZWN0U3RhdHVzZXMgPSBbMzAxLCAzMDIsIDMwMywgMzA3LCAzMDhdXG5cbiAgUmVzcG9uc2UucmVkaXJlY3QgPSBmdW5jdGlvbih1cmwsIHN0YXR1cykge1xuICAgIGlmIChyZWRpcmVjdFN0YXR1c2VzLmluZGV4T2Yoc3RhdHVzKSA9PT0gLTEpIHtcbiAgICAgIHRocm93IG5ldyBSYW5nZUVycm9yKCdJbnZhbGlkIHN0YXR1cyBjb2RlJylcbiAgICB9XG5cbiAgICByZXR1cm4gbmV3IFJlc3BvbnNlKG51bGwsIHtzdGF0dXM6IHN0YXR1cywgaGVhZGVyczoge2xvY2F0aW9uOiB1cmx9fSlcbiAgfVxuXG4gIHNlbGYuSGVhZGVycyA9IEhlYWRlcnNcbiAgc2VsZi5SZXF1ZXN0ID0gUmVxdWVzdFxuICBzZWxmLlJlc3BvbnNlID0gUmVzcG9uc2VcblxuICBzZWxmLmZldGNoID0gZnVuY3Rpb24oaW5wdXQsIGluaXQpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICB2YXIgcmVxdWVzdCA9IG5ldyBSZXF1ZXN0KGlucHV0LCBpbml0KVxuICAgICAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpXG5cbiAgICAgIHhoci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7XG4gICAgICAgICAgc3RhdHVzOiB4aHIuc3RhdHVzLFxuICAgICAgICAgIHN0YXR1c1RleHQ6IHhoci5zdGF0dXNUZXh0LFxuICAgICAgICAgIGhlYWRlcnM6IHBhcnNlSGVhZGVycyh4aHIuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkgfHwgJycpXG4gICAgICAgIH1cbiAgICAgICAgb3B0aW9ucy51cmwgPSAncmVzcG9uc2VVUkwnIGluIHhociA/IHhoci5yZXNwb25zZVVSTCA6IG9wdGlvbnMuaGVhZGVycy5nZXQoJ1gtUmVxdWVzdC1VUkwnKVxuICAgICAgICB2YXIgYm9keSA9ICdyZXNwb25zZScgaW4geGhyID8geGhyLnJlc3BvbnNlIDogeGhyLnJlc3BvbnNlVGV4dFxuICAgICAgICByZXNvbHZlKG5ldyBSZXNwb25zZShib2R5LCBvcHRpb25zKSlcbiAgICAgIH1cblxuICAgICAgeGhyLm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVqZWN0KG5ldyBUeXBlRXJyb3IoJ05ldHdvcmsgcmVxdWVzdCBmYWlsZWQnKSlcbiAgICAgIH1cblxuICAgICAgeGhyLm9udGltZW91dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZWplY3QobmV3IFR5cGVFcnJvcignTmV0d29yayByZXF1ZXN0IGZhaWxlZCcpKVxuICAgICAgfVxuXG4gICAgICB4aHIub3BlbihyZXF1ZXN0Lm1ldGhvZCwgcmVxdWVzdC51cmwsIHRydWUpXG5cbiAgICAgIGlmIChyZXF1ZXN0LmNyZWRlbnRpYWxzID09PSAnaW5jbHVkZScpIHtcbiAgICAgICAgeGhyLndpdGhDcmVkZW50aWFscyA9IHRydWVcbiAgICAgIH1cblxuICAgICAgaWYgKCdyZXNwb25zZVR5cGUnIGluIHhociAmJiBzdXBwb3J0LmJsb2IpIHtcbiAgICAgICAgeGhyLnJlc3BvbnNlVHlwZSA9ICdibG9iJ1xuICAgICAgfVxuXG4gICAgICByZXF1ZXN0LmhlYWRlcnMuZm9yRWFjaChmdW5jdGlvbih2YWx1ZSwgbmFtZSkge1xuICAgICAgICB4aHIuc2V0UmVxdWVzdEhlYWRlcihuYW1lLCB2YWx1ZSlcbiAgICAgIH0pXG5cbiAgICAgIHhoci5zZW5kKHR5cGVvZiByZXF1ZXN0Ll9ib2R5SW5pdCA9PT0gJ3VuZGVmaW5lZCcgPyBudWxsIDogcmVxdWVzdC5fYm9keUluaXQpXG4gICAgfSlcbiAgfVxuICBzZWxmLmZldGNoLnBvbHlmaWxsID0gdHJ1ZVxufSkodHlwZW9mIHNlbGYgIT09ICd1bmRlZmluZWQnID8gc2VsZiA6IHRoaXMpO1xuIl0sIm5hbWVzIjpbInNlbGYiLCJmZXRjaCIsInN1cHBvcnQiLCJTeW1ib2wiLCJCbG9iIiwiZSIsImFycmF5QnVmZmVyIiwidmlld0NsYXNzZXMiLCJpc0RhdGFWaWV3Iiwib2JqIiwiRGF0YVZpZXciLCJwcm90b3R5cGUiLCJpc1Byb3RvdHlwZU9mIiwiaXNBcnJheUJ1ZmZlclZpZXciLCJBcnJheUJ1ZmZlciIsImlzVmlldyIsImluZGV4T2YiLCJPYmplY3QiLCJ0b1N0cmluZyIsImNhbGwiLCJub3JtYWxpemVOYW1lIiwibmFtZSIsIlN0cmluZyIsInRlc3QiLCJUeXBlRXJyb3IiLCJ0b0xvd2VyQ2FzZSIsIm5vcm1hbGl6ZVZhbHVlIiwidmFsdWUiLCJpdGVyYXRvckZvciIsIml0ZW1zIiwiaXRlcmF0b3IiLCJzaGlmdCIsImRvbmUiLCJ1bmRlZmluZWQiLCJpdGVyYWJsZSIsIkhlYWRlcnMiLCJoZWFkZXJzIiwibWFwIiwiZm9yRWFjaCIsImFwcGVuZCIsIkFycmF5IiwiaXNBcnJheSIsImhlYWRlciIsImdldE93blByb3BlcnR5TmFtZXMiLCJvbGRWYWx1ZSIsImdldCIsImhhcyIsImhhc093blByb3BlcnR5Iiwic2V0IiwiY2FsbGJhY2siLCJ0aGlzQXJnIiwia2V5cyIsInB1c2giLCJ2YWx1ZXMiLCJlbnRyaWVzIiwiY29uc3VtZWQiLCJib2R5IiwiYm9keVVzZWQiLCJQcm9taXNlIiwicmVqZWN0IiwiZmlsZVJlYWRlclJlYWR5IiwicmVhZGVyIiwicmVzb2x2ZSIsIm9ubG9hZCIsInJlc3VsdCIsIm9uZXJyb3IiLCJlcnJvciIsInJlYWRCbG9iQXNBcnJheUJ1ZmZlciIsImJsb2IiLCJGaWxlUmVhZGVyIiwicHJvbWlzZSIsInJlYWRBc0FycmF5QnVmZmVyIiwicmVhZEJsb2JBc1RleHQiLCJyZWFkQXNUZXh0IiwicmVhZEFycmF5QnVmZmVyQXNUZXh0IiwiYnVmIiwidmlldyIsIlVpbnQ4QXJyYXkiLCJjaGFycyIsImxlbmd0aCIsImkiLCJmcm9tQ2hhckNvZGUiLCJqb2luIiwiYnVmZmVyQ2xvbmUiLCJzbGljZSIsImJ5dGVMZW5ndGgiLCJidWZmZXIiLCJCb2R5IiwiX2luaXRCb2R5IiwiX2JvZHlJbml0IiwiX2JvZHlUZXh0IiwiX2JvZHlCbG9iIiwiZm9ybURhdGEiLCJGb3JtRGF0YSIsIl9ib2R5Rm9ybURhdGEiLCJzZWFyY2hQYXJhbXMiLCJVUkxTZWFyY2hQYXJhbXMiLCJfYm9keUFycmF5QnVmZmVyIiwiRXJyb3IiLCJ0eXBlIiwicmVqZWN0ZWQiLCJ0aGVuIiwidGV4dCIsImRlY29kZSIsImpzb24iLCJKU09OIiwicGFyc2UiLCJtZXRob2RzIiwibm9ybWFsaXplTWV0aG9kIiwibWV0aG9kIiwidXBjYXNlZCIsInRvVXBwZXJDYXNlIiwiUmVxdWVzdCIsImlucHV0Iiwib3B0aW9ucyIsInVybCIsImNyZWRlbnRpYWxzIiwibW9kZSIsInJlZmVycmVyIiwiY2xvbmUiLCJmb3JtIiwidHJpbSIsInNwbGl0IiwiYnl0ZXMiLCJyZXBsYWNlIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwicGFyc2VIZWFkZXJzIiwicmF3SGVhZGVycyIsImxpbmUiLCJwYXJ0cyIsImtleSIsIlJlc3BvbnNlIiwiYm9keUluaXQiLCJzdGF0dXMiLCJvayIsInN0YXR1c1RleHQiLCJyZXNwb25zZSIsInJlZGlyZWN0U3RhdHVzZXMiLCJyZWRpcmVjdCIsIlJhbmdlRXJyb3IiLCJsb2NhdGlvbiIsImluaXQiLCJyZXF1ZXN0IiwieGhyIiwiWE1MSHR0cFJlcXVlc3QiLCJnZXRBbGxSZXNwb25zZUhlYWRlcnMiLCJyZXNwb25zZVVSTCIsInJlc3BvbnNlVGV4dCIsIm9udGltZW91dCIsIm9wZW4iLCJ3aXRoQ3JlZGVudGlhbHMiLCJyZXNwb25zZVR5cGUiLCJzZXRSZXF1ZXN0SGVhZGVyIiwic2VuZCIsInBvbHlmaWxsIiwidGhpcyJdLCJtYXBwaW5ncyI6IkFBQUEsQ0FBQyxVQUFTQSxJQUFULEVBQWU7TUFHVkEsS0FBS0MsS0FBVCxFQUFnQjs7OztNQUlaQyxVQUFVO2tCQUNFLHFCQUFxQkYsSUFEdkI7Y0FFRixZQUFZQSxJQUFaLElBQW9CLGNBQWNHLE1BRmhDO1VBR04sZ0JBQWdCSCxJQUFoQixJQUF3QixVQUFVQSxJQUFsQyxJQUEyQyxZQUFXO1VBQ3REO1lBQ0VJLElBQUo7ZUFDTyxJQUFQO09BRkYsQ0FHRSxPQUFNQyxDQUFOLEVBQVM7ZUFDRixLQUFQOztLQUw0QyxFQUhwQztjQVdGLGNBQWNMLElBWFo7aUJBWUMsaUJBQWlCQTtHQVpoQzs7TUFlSUUsUUFBUUksV0FBWixFQUF5QjtRQUNuQkMsY0FBYyxDQUNoQixvQkFEZ0IsRUFF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
