"use strict";
function _classCallCheck(t, e) {
  if (!(t instanceof e))
    throw new TypeError("Cannot call a class as a function");
}
Object.defineProperty(exports, "__esModule", { value: !0 }),
  (function(t) {
    if (!t.fetch) {
      var e = {
        searchParams: "URLSearchParams" in t,
        iterable: "Symbol" in t && "iterator" in Symbol,
        blob:
          "FileReader" in t &&
          "Blob" in t &&
          (function() {
            try {
              return new Blob(), !0;
            } catch (t) {
              return !1;
            }
          })(),
        formData: "FormData" in t,
        arrayBuffer: "ArrayBuffer" in t
      };
      if (e.arrayBuffer)
        var r = [
            "[object Int8Array]",
            "[object Uint8Array]",
            "[object Uint8ClampedArray]",
            "[object Int16Array]",
            "[object Uint16Array]",
            "[object Int32Array]",
            "[object Uint32Array]",
            "[object Float32Array]",
            "[object Float64Array]"
          ],
          o = function(t) {
            return t && DataView.prototype.isPrototypeOf(t);
          },
          n =
            ArrayBuffer.isView ||
            function(t) {
              return t && r.indexOf(Object.prototype.toString.call(t)) > -1;
            };
      (f.prototype.append = function(t, e) {
        (t = a(t)), (e = u(e));
        var r = this.map[t];
        this.map[t] = r ? r + "," + e : e;
      }),
        (f.prototype.delete = function(t) {
          delete this.map[a(t)];
        }),
        (f.prototype.get = function(t) {
          return (t = a(t)), this.has(t) ? this.map[t] : null;
        }),
        (f.prototype.has = function(t) {
          return this.map.hasOwnProperty(a(t));
        }),
        (f.prototype.set = function(t, e) {
          this.map[a(t)] = u(e);
        }),
        (f.prototype.forEach = function(t, e) {
          for (var r in this.map)
            this.map.hasOwnProperty(r) && t.call(e, this.map[r], r, this);
        }),
        (f.prototype.keys = function() {
          var t = [];
          return (
            this.forEach(function(e, r) {
              t.push(r);
            }),
            l(t)
          );
        }),
        (f.prototype.values = function() {
          var t = [];
          return (
            this.forEach(function(e) {
              t.push(e);
            }),
            l(t)
          );
        }),
        (f.prototype.entries = function() {
          var t = [];
          return (
            this.forEach(function(e, r) {
              t.push([r, e]);
            }),
            l(t)
          );
        }),
        e.iterable && (f.prototype[Symbol.iterator] = f.prototype.entries);
      var i = ["DELETE", "GET", "HEAD", "OPTIONS", "POST", "PUT"];
      (b.prototype.clone = function() {
        return new b(this, { body: this._bodyInit });
      }),
        y.call(b.prototype),
        y.call(w.prototype),
        (w.prototype.clone = function() {
          return new w(this._bodyInit, {
            status: this.status,
            statusText: this.statusText,
            headers: new f(this.headers),
            url: this.url
          });
        }),
        (w.error = function() {
          var t = new w(null, { status: 0, statusText: "" });
          return (t.type = "error"), t;
        });
      var s = [301, 302, 303, 307, 308];
      (w.redirect = function(t, e) {
        if (-1 === s.indexOf(e)) throw new RangeError("Invalid status code");
        return new w(null, { status: e, headers: { location: t } });
      }),
        (t.Headers = f),
        (t.Request = b),
        (t.Response = w),
        (t.fetch = function(t, r) {
          return new Promise(function(o, n) {
            var i = new b(t, r),
              s = new XMLHttpRequest();
            (s.onload = function() {
              var t,
                e,
                r = {
                  status: s.status,
                  statusText: s.statusText,
                  headers: ((t = s.getAllResponseHeaders() || ""),
                  (e = new f()),
                  t.split(/\r?\n/).forEach(function(t) {
                    var r = t.split(":"),
                      o = r.shift().trim();
                    if (o) {
                      var n = r.join(":").trim();
                      e.append(o, n);
                    }
                  }),
                  e)
                };
              r.url =
                "responseURL" in s
                  ? s.responseURL
                  : r.headers.get("X-Request-URL");
              var n = "response" in s ? s.response : s.responseText;
              o(new w(n, r));
            }),
              (s.onerror = function() {
                n(new TypeError("Network request failed"));
              }),
              (s.ontimeout = function() {
                n(new TypeError("Network request failed"));
              }),
              s.open(i.method, i.url, !0),
              "include" === i.credentials && (s.withCredentials = !0),
              "responseType" in s && e.blob && (s.responseType = "blob"),
              i.headers.forEach(function(t, e) {
                s.setRequestHeader(e, t);
              }),
              s.send(void 0 === i._bodyInit ? null : i._bodyInit);
          });
        }),
        (t.fetch.polyfill = !0);
    }
    function a(t) {
      if (
        ("string" != typeof t && (t = String(t)),
        /[^a-z0-9\-#$%&'*+.\^_`|~]/i.test(t))
      )
        throw new TypeError("Invalid character in header field name");
      return t.toLowerCase();
    }
    function u(t) {
      return "string" != typeof t && (t = String(t)), t;
    }
    function l(t) {
      var r = {
        next: function() {
          var e = t.shift();
          return { done: void 0 === e, value: e };
        }
      };
      return (
        e.iterable &&
          (r[Symbol.iterator] = function() {
            return r;
          }),
        r
      );
    }
    function f(t) {
      (this.map = {}),
        t instanceof f
          ? t.forEach(function(t, e) {
              this.append(e, t);
            }, this)
          : Array.isArray(t)
            ? t.forEach(function(t) {
                this.append(t[0], t[1]);
              }, this)
            : t &&
              Object.getOwnPropertyNames(t).forEach(function(e) {
                this.append(e, t[e]);
              }, this);
    }
    function c(t) {
      if (t.bodyUsed) return Promise.reject(new TypeError("Already read"));
      t.bodyUsed = !0;
    }
    function h(t) {
      return new Promise(function(e, r) {
        (t.onload = function() {
          e(t.result);
        }),
          (t.onerror = function() {
            r(t.error);
          });
      });
    }
    function p(t) {
      var e = new FileReader(),
        r = h(e);
      return e.readAsArrayBuffer(t), r;
    }
    function d(t) {
      if (t.slice) return t.slice(0);
      var e = new Uint8Array(t.byteLength);
      return e.set(new Uint8Array(t)), e.buffer;
    }
    function y() {
      return (
        (this.bodyUsed = !1),
        (this._initBody = function(t) {
          if (((this._bodyInit = t), t))
            if ("string" == typeof t) this._bodyText = t;
            else if (e.blob && Blob.prototype.isPrototypeOf(t))
              this._bodyBlob = t;
            else if (e.formData && FormData.prototype.isPrototypeOf(t))
              this._bodyFormData = t;
            else if (
              e.searchParams &&
              URLSearchParams.prototype.isPrototypeOf(t)
            )
              this._bodyText = t.toString();
            else if (e.arrayBuffer && e.blob && o(t))
              (this._bodyArrayBuffer = d(t.buffer)),
                (this._bodyInit = new Blob([this._bodyArrayBuffer]));
            else {
              if (
                !e.arrayBuffer ||
                (!ArrayBuffer.prototype.isPrototypeOf(t) && !n(t))
              )
                throw new Error("unsupported BodyInit type");
              this._bodyArrayBuffer = d(t);
            }
          else this._bodyText = "";
          this.headers.get("content-type") ||
            ("string" == typeof t
              ? this.headers.set("content-type", "text/plain;charset=UTF-8")
              : this._bodyBlob && this._bodyBlob.type
                ? this.headers.set("content-type", this._bodyBlob.type)
                : e.searchParams &&
                  URLSearchParams.prototype.isPrototypeOf(t) &&
                  this.headers.set(
                    "content-type",
                    "application/x-www-form-urlencoded;charset=UTF-8"
                  ));
        }),
        e.blob &&
          ((this.blob = function() {
            var t = c(this);
            if (t) return t;
            if (this._bodyBlob) return Promise.resolve(this._bodyBlob);
            if (this._bodyArrayBuffer)
              return Promise.resolve(new Blob([this._bodyArrayBuffer]));
            if (this._bodyFormData)
              throw new Error("could not read FormData body as blob");
            return Promise.resolve(new Blob([this._bodyText]));
          }),
          (this.arrayBuffer = function() {
            return this._bodyArrayBuffer
              ? c(this) || Promise.resolve(this._bodyArrayBuffer)
              : this.blob().then(p);
          })),
        (this.text = function() {
          var t,
            e,
            r,
            o = c(this);
          if (o) return o;
          if (this._bodyBlob)
            return (
              (t = this._bodyBlob),
              (e = new FileReader()),
              (r = h(e)),
              e.readAsText(t),
              r
            );
          if (this._bodyArrayBuffer)
            return Promise.resolve(
              (function(t) {
                for (
                  var e = new Uint8Array(t), r = new Array(e.length), o = 0;
                  o < e.length;
                  o++
                )
                  r[o] = String.fromCharCode(e[o]);
                return r.join("");
              })(this._bodyArrayBuffer)
            );
          if (this._bodyFormData)
            throw new Error("could not read FormData body as text");
          return Promise.resolve(this._bodyText);
        }),
        e.formData &&
          (this.formData = function() {
            return this.text().then(m);
          }),
        (this.json = function() {
          return this.text().then(JSON.parse);
        }),
        this
      );
    }
    function b(t, e) {
      var r,
        o,
        n = (e = e || {}).body;
      if (t instanceof b) {
        if (t.bodyUsed) throw new TypeError("Already read");
        (this.url = t.url),
          (this.credentials = t.credentials),
          e.headers || (this.headers = new f(t.headers)),
          (this.method = t.method),
          (this.mode = t.mode),
          n || null == t._bodyInit || ((n = t._bodyInit), (t.bodyUsed = !0));
      } else this.url = String(t);
      if (
        ((this.credentials = e.credentials || this.credentials || "omit"),
        (!e.headers && this.headers) || (this.headers = new f(e.headers)),
        (this.method = ((r = e.method || this.method || "GET"),
        (o = r.toUpperCase()),
        i.indexOf(o) > -1 ? o : r)),
        (this.mode = e.mode || this.mode || null),
        (this.referrer = null),
        ("GET" === this.method || "HEAD" === this.method) && n)
      )
        throw new TypeError("Body not allowed for GET or HEAD requests");
      this._initBody(n);
    }
    function m(t) {
      var e = new FormData();
      return (
        t
          .trim()
          .split("&")
          .forEach(function(t) {
            if (t) {
              var r = t.split("="),
                o = r.shift().replace(/\+/g, " "),
                n = r.join("=").replace(/\+/g, " ");
              e.append(decodeURIComponent(o), decodeURIComponent(n));
            }
          }),
        e
      );
    }
    function w(t, e) {
      e || (e = {}),
        (this.type = "default"),
        (this.status = "status" in e ? e.status : 200),
        (this.ok = this.status >= 200 && this.status < 300),
        (this.statusText = "statusText" in e ? e.statusText : "OK"),
        (this.headers = new f(e.headers)),
        (this.url = e.url || ""),
        this._initBody(t);
    }
  })("undefined" != typeof self ? self : void 0);
var Request = function t(e) {
  var r = this,
    o = e.endpoint,
    n = e.options;
  _classCallCheck(this, t),
    (this.prepareFetchOptions = function() {
      return (
        r.body || "POST" !== r.options.method || (r.body = new FormData()),
        r.body
      );
    }),
    (this.send = function() {
      var t = (arguments.length > 0 && void 0 !== arguments[0]
          ? arguments[0]
          : { async: !1 }
        ).async,
        e = Object.assign({}, r.prepareFetchOptions(), r.options),
        o = fetch(r.endpoint, e);
      return t
        ? o.then(function(t) {
            return t.json();
          })
        : o;
    }),
    (this.endpoint = o),
    (this.options = n || t.defaultOptions),
    (this.body = n && n.body);
};
Request.defaultOptions = {
  method: "GET",
  headers: { Accept: "application/json" }
};
var _slicedToArray = (function() {
    return function(t, e) {
      if (Array.isArray(t)) return t;
      if (Symbol.iterator in Object(t))
        return (function(t, e) {
          var r = [],
            o = !0,
            n = !1,
            i = void 0;
          try {
            for (
              var s, a = t[Symbol.iterator]();
              !(o = (s = a.next()).done) &&
              (r.push(s.value), !e || r.length !== e);
              o = !0
            );
          } catch (t) {
            (n = !0), (i = t);
          } finally {
            try {
              !o && a.return && a.return();
            } finally {
              if (n) throw i;
            }
          }
          return r;
        })(t, e);
      throw new TypeError(
        "Invalid attempt to destructure non-iterable instance"
      );
    };
  })(),
  params = function() {
    return window.location.search
      .split("?")[1]
      .split("&")
      .map(function(t) {
        return t.split("=");
      })
      .reduce(function(t, e, r, o) {
        var n = _slicedToArray(e, 2),
          i = n[0],
          s = n[1];
        return (t[i] = decodeURIComponent(s).replace(/\+/g, " ")), t;
      }, {});
  },
  parseMarkdownLinks = function(t) {
    var e = /\[([^\]]+)\]\(([^)]+)\)/g;
    return t.search(e) > -1
      ? t.replace(
          e,
          '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
        )
      : t;
  };
function scrollTo(t, e, r) {
  if (!(r <= 0)) {
    var o = (e - t.scrollTop) / r * 10;
    setTimeout(function() {
      (t.scrollTop = t.scrollTop + o),
        t.scrollTop !== e && scrollTo(t, e, r - 10);
    }, 10);
  }
}
function isElementInViewport(t) {
  var e = t.element,
    r = t.elementDivisorSize,
    o = t.useBottomOffset,
    n = (Object.assign(
      {},
      { elementDivisorSize: 1, useBottomOffset: !1 },
      {
        element: e,
        elementDivisorSize: Math.ceil(Math.abs(r)),
        useBottomOffset: o
      }
    ),
    e.getBoundingClientRect()),
    i = n.top,
    s = n.bottom,
    a = n.height,
    u = (window.innerHeight || document.documentElement.clientHeight) - a / r;
  return s >= (o ? a / r : 0) && i <= u;
}
var select = function(t) {
    return document.querySelector(t);
  },
  selectAll = function(t) {
    for (var e = [], r = document.querySelectorAll(t), o = 0; o < r.length; o++)
      e.push(r[o]);
    return e;
  },
  selectById = function(t) {
    return document.getElementById(t);
  };
function _toArray(t) {
  return Array.isArray(t) ? t : Array.from(t);
}
var trim = function(t) {
    return t.replace(/^\s+|\s$/g, "");
  },
  ucFirst = function(t) {
    var e = _toArray(t),
      r = e[0],
      o = e.slice(1);
    return "" + r.toUpperCase() + o.join("");
  },
  capitalize = function(t) {
    return t
      .split(" ")
      .map(function(t) {
        return ucFirst(t);
      })
      .join(" ");
  },
  slugify = function(t) {
    var e =
      arguments.length > 1 && void 0 !== arguments[1] ? arguments[1] : "-";
    return t
      .replace(/(\!|#|\$|%|\*|\.|\/|\\|\(|\)|\+|\||\,|\:|\'|\")/g, "")
      .replace(/(.)(\s|\_|\-)+(.)/g, "$1" + e + "$3")
      .toLowerCase();
  };
(exports.Request = Request),
  (exports.capitalize = capitalize),
  (exports.isElementInViewport = isElementInViewport),
  (exports.parseMarkdownLinks = parseMarkdownLinks),
  (exports.parseURLParams = params),
  (exports.scrollTo = scrollTo),
  (exports.select = select),
  (exports.selectAll = selectAll),
  (exports.selectById = selectById),
  (exports.slugify = slugify),
  (exports.trim = trim),
  (exports.ucFirst = ucFirst);
