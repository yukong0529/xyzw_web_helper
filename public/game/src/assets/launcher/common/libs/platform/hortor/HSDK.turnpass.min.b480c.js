!function(t) {
    "function" == typeof define && define.amd ? define(t) : t()
}(function() {
    "use strict";
    function t(t, n, e, r) {
        return new (e || (e = Promise))(function(i, o) {
            function a(t) {
                try {
                    u(r.next(t))
                } catch (t) {
                    o(t)
                }
            }
            function c(t) {
                try {
                    u(r.throw(t))
                } catch (t) {
                    o(t)
                }
            }
            function u(t) {
                var n;
                t.done ? i(t.value) : (n = t.value,
                n instanceof e ? n : new e(function(t) {
                    t(n)
                }
                )).then(a, c)
            }
            u((r = r.apply(t, n || [])).next())
        }
        )
    }
    function n(t, n) {
        var e, r, i, o, a = {
            label: 0,
            sent: function() {
                if (1 & i[0])
                    throw i[1];
                return i[1]
            },
            trys: [],
            ops: []
        };
        return o = {
            next: c(0),
            throw: c(1),
            return: c(2)
        },
        "function" == typeof Symbol && (o[Symbol.iterator] = function() {
            return this
        }
        ),
        o;
        function c(c) {
            return function(u) {
                return function(c) {
                    if (e)
                        throw new TypeError("Generator is already executing.");
                    for (; o && (o = 0,
                    c[0] && (a = 0)),
                    a; )
                        try {
                            if (e = 1,
                            r && (i = 2 & c[0] ? r.return : c[0] ? r.throw || ((i = r.return) && i.call(r),
                            0) : r.next) && !(i = i.call(r, c[1])).done)
                                return i;
                            switch (r = 0,
                            i && (c = [2 & c[0], i.value]),
                            c[0]) {
                            case 0:
                            case 1:
                                i = c;
                                break;
                            case 4:
                                return a.label++,
                                {
                                    value: c[1],
                                    done: !1
                                };
                            case 5:
                                a.label++,
                                r = c[1],
                                c = [0];
                                continue;
                            case 7:
                                c = a.ops.pop(),
                                a.trys.pop();
                                continue;
                            default:
                                if (!((i = (i = a.trys).length > 0 && i[i.length - 1]) || 6 !== c[0] && 2 !== c[0])) {
                                    a = 0;
                                    continue
                                }
                                if (3 === c[0] && (!i || c[1] > i[0] && c[1] < i[3])) {
                                    a.label = c[1];
                                    break
                                }
                                if (6 === c[0] && a.label < i[1]) {
                                    a.label = i[1],
                                    i = c;
                                    break
                                }
                                if (i && a.label < i[2]) {
                                    a.label = i[2],
                                    a.ops.push(c);
                                    break
                                }
                                i[2] && a.ops.pop(),
                                a.trys.pop();
                                continue
                            }
                            c = n.call(t, a)
                        } catch (t) {
                            c = [6, t],
                            r = 0
                        } finally {
                            e = i = 0
                        }
                    if (5 & c[0])
                        throw c[1];
                    return {
                        value: c[0] ? c[1] : void 0,
                        done: !0
                    }
                }([c, u])
            }
        }
    }
    var e, r, i;
    !function(t) {
        t.Development = "Dev",
        t.Test = "Test",
        t.Production = "Prod"
    }(e || (e = {})),
    function(t) {
        t[t.Click = 1] = "Click",
        t[t.Move = 2] = "Move"
    }(r || (r = {})),
    function(t) {
        t[t.ClickOne = 1.1] = "ClickOne",
        t[t.ClickMore = 1.2] = "ClickMore"
    }(i || (i = {}));
    var o = function() {
        function t() {
            this.init = {
                gameId: "",
                uniqueId: "",
                env: e.Production
            },
            this.apiData = {
                validateId: "",
                token: "",
                globalOffset: 0
            }
        }
        return Object.defineProperty(t, "ins", {
            get: function() {
                return t._ins || (t._ins = new t),
                t._ins
            },
            enumerable: !1,
            configurable: !0
        }),
        t.syncInit = function(n) {
            t.ins.init = Object.assign(t.ins.init, n),
            t.hasInit = !0
        }
        ,
        t.syncApi = function(n) {
            t.ins.apiData = Object.assign(t.ins.apiData, n)
        }
        ,
        t.imgHost = "https://wxmini-resource.hortorgames.com/background-image/",
        t.baseImgUrl = {
            logo: t.imgHost + "logo-1672303337.png",
            refresh: t.imgHost + "refresh-1672303763.png"
        },
        t.wx = window.wx,
        t.hasInit = !1,
        t
    }()
      , a = function(t) {
        HSDK && HSDK.gameTrack ? HSDK.gameTrack({
            eventName: "sdk_c_verify",
            customData: Object.assign(t, {
                roleId: o.ins.init.uniqueId
            })
        }) : cc.warn("\u8bf7\u63a5\u5165SDK")
    }
      , c = function(t, n) {
        return Math.round(Math.random() * (n - t)) + t
    }
      , u = function() {
        return Math.floor(.001 * (new Date).getTime())
    };
    function s(t, n) {
        return Math.random() * (n - t) + t
    }
    var l = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
      , f = function() {
        var t = new Uint8Array(1);
        return function(n) {
            return t[0] = n,
            t[0]
        }
    }()
      , d = function(t, n) {
        var e = []
          , r = JSON.stringify(t);
        for (var i in r)
            if (Object.hasOwnProperty.call(r, i)) {
                var o = r[i];
                e.push(o.charCodeAt(0))
            }
        for (var a = n.length, c = parseInt(n.slice(5, 6)), u = new Uint8Array(e.length), s = 0; s < e.length; ++s) {
            var l = 255 - (f(e[s]) - f(c) - n[s % a].charCodeAt(0));
            u[s] = l
        }
        return g(u)
    }
      , h = function(t, n) {
        for (var e = v(t), r = n.length, i = parseInt(n.slice(5, 6)), o = new Uint8Array(e.length), a = 0; a < e.length; ++a) {
            var c = 255 - (e[a] - n[a % r].charCodeAt(0) - f(i));
            o[a] = c
        }
        var u = (new p).decode(o);
        return JSON.parse(u)
    }
      , g = function(t) {
        var n, e = "";
        for (n = 0; n < t.length; n += 3) {
            var r = 255 & t[n]
              , i = 255 & t[n + 1]
              , o = 255 & t[n + 2];
            e += l.charAt(r >> 2),
            e += l.charAt((3 & r) << 4 | i >> 4),
            e += n + 1 < t.length ? l.charAt((15 & i) << 2 | o >> 6) : "=",
            e += n + 2 < t.length ? l.charAt(63 & o) : "="
        }
        return e
    }
      , v = function(t) {
        for (var n = t.indexOf("="), e = -1 !== n ? n : t.length, r = 3 * (t = t.replace(/=/g, "")).length / 4, i = new Uint8Array(r), o = 0, a = 0; a < e; a += 4) {
            var c = l.indexOf(t.charAt(a))
              , u = l.indexOf(t.charAt(a + 1))
              , s = l.indexOf(t.charAt(a + 2))
              , f = l.indexOf(t.charAt(a + 3))
              , d = c << 2 | u >> 4;
            if (i[o++] = d,
            -1 !== s) {
                var h = (15 & u) << 4 | s >> 2;
                i[o++] = h
            }
            if (-1 !== f) {
                var g = (3 & s) << 6 | f;
                i[o++] = g
            }
        }
        return i
    };
    function p() {}
    p.prototype.decode = function(t) {
        for (var n = "", e = 0; e < t.length; ) {
            var r = t[e]
              , i = 0
              , o = 0;
            if (r <= 127 ? (i = 0,
            o = 255 & r) : r <= 223 ? (i = 1,
            o = 31 & r) : r <= 239 ? (i = 2,
            o = 15 & r) : r <= 244 && (i = 3,
            o = 7 & r),
            t.length - e - i > 0)
                for (var a = 0; a < i; )
                    o = o << 6 | 63 & (r = t[e + a + 1]),
                    a += 1;
            else
                o = 65533,
                i = t.length - e;
            n += String.fromCodePoint(o),
            e += i + 1
        }
        return n
    }
    ;
    var m, y = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof window ? window : "undefined" != typeof global ? global : "undefined" != typeof self ? self : {}, b = (function(t) {
        !function(n) {
            function e(t, n) {
                var e = (65535 & t) + (65535 & n);
                return (t >> 16) + (n >> 16) + (e >> 16) << 16 | 65535 & e
            }
            function r(t, n, r, i, o, a) {
                return e(function(t) {
                    return t << o | t >>> 32 - o
                }(e(e(n, t), e(i, a))), r)
            }
            function i(t, n, e, i, o, a, c) {
                return r(n & e | ~n & i, t, n, o, a, c)
            }
            function o(t, n, e, i, o, a, c) {
                return r(n & i | e & ~i, t, n, o, a, c)
            }
            function a(t, n, e, i, o, a, c) {
                return r(n ^ e ^ i, t, n, o, a, c)
            }
            function c(t, n, e, i, o, a, c) {
                return r(e ^ (n | ~i), t, n, o, a, c)
            }
            function u(t, n) {
                var r, u, s, l, f;
                t[n >> 5] |= 128 << n % 32,
                t[14 + (n + 64 >>> 9 << 4)] = n;
                var d = 1732584193
                  , h = -271733879
                  , g = -1732584194
                  , v = 271733878;
                for (r = 0; r < t.length; r += 16)
                    h = c(h = c(h = c(h = c(h = a(h = a(h = a(h = a(h = o(h = o(h = o(h = o(h = i(h = i(h = i(h = i(s = h, g = i(l = g, v = i(f = v, d = i(u = d, h, g, v, t[r], 7, -680876936), h, g, t[r + 1], 12, -389564586), d, h, t[r + 2], 17, 606105819), v, d, t[r + 3], 22, -1044525330), g = i(g, v = i(v, d = i(d, h, g, v, t[r + 4], 7, -176418897), h, g, t[r + 5], 12, 1200080426), d, h, t[r + 6], 17, -1473231341), v, d, t[r + 7], 22, -45705983), g = i(g, v = i(v, d = i(d, h, g, v, t[r + 8], 7, 1770035416), h, g, t[r + 9], 12, -1958414417), d, h, t[r + 10], 17, -42063), v, d, t[r + 11], 22, -1990404162), g = i(g, v = i(v, d = i(d, h, g, v, t[r + 12], 7, 1804603682), h, g, t[r + 13], 12, -40341101), d, h, t[r + 14], 17, -1502002290), v, d, t[r + 15], 22, 1236535329), g = o(g, v = o(v, d = o(d, h, g, v, t[r + 1], 5, -165796510), h, g, t[r + 6], 9, -1069501632), d, h, t[r + 11], 14, 643717713), v, d, t[r], 20, -373897302), g = o(g, v = o(v, d = o(d, h, g, v, t[r + 5], 5, -701558691), h, g, t[r + 10], 9, 38016083), d, h, t[r + 15], 14, -660478335), v, d, t[r + 4], 20, -405537848), g = o(g, v = o(v, d = o(d, h, g, v, t[r + 9], 5, 568446438), h, g, t[r + 14], 9, -1019803690), d, h, t[r + 3], 14, -187363961), v, d, t[r + 8], 20, 1163531501), g = o(g, v = o(v, d = o(d, h, g, v, t[r + 13], 5, -1444681467), h, g, t[r + 2], 9, -51403784), d, h, t[r + 7], 14, 1735328473), v, d, t[r + 12], 20, -1926607734), g = a(g, v = a(v, d = a(d, h, g, v, t[r + 5], 4, -378558), h, g, t[r + 8], 11, -2022574463), d, h, t[r + 11], 16, 1839030562), v, d, t[r + 14], 23, -35309556), g = a(g, v = a(v, d = a(d, h, g, v, t[r + 1], 4, -1530992060), h, g, t[r + 4], 11, 1272893353), d, h, t[r + 7], 16, -155497632), v, d, t[r + 10], 23, -1094730640), g = a(g, v = a(v, d = a(d, h, g, v, t[r + 13], 4, 681279174), h, g, t[r], 11, -358537222), d, h, t[r + 3], 16, -722521979), v, d, t[r + 6], 23, 76029189), g = a(g, v = a(v, d = a(d, h, g, v, t[r + 9], 4, -640364487), h, g, t[r + 12], 11, -421815835), d, h, t[r + 15], 16, 530742520), v, d, t[r + 2], 23, -995338651), g = c(g, v = c(v, d = c(d, h, g, v, t[r], 6, -198630844), h, g, t[r + 7], 10, 1126891415), d, h, t[r + 14], 15, -1416354905), v, d, t[r + 5], 21, -57434055), g = c(g, v = c(v, d = c(d, h, g, v, t[r + 12], 6, 1700485571), h, g, t[r + 3], 10, -1894986606), d, h, t[r + 10], 15, -1051523), v, d, t[r + 1], 21, -2054922799), g = c(g, v = c(v, d = c(d, h, g, v, t[r + 8], 6, 1873313359), h, g, t[r + 15], 10, -30611744), d, h, t[r + 6], 15, -1560198380), v, d, t[r + 13], 21, 1309151649), g = c(g, v = c(v, d = c(d, h, g, v, t[r + 4], 6, -145523070), h, g, t[r + 11], 10, -1120210379), d, h, t[r + 2], 15, 718787259), v, d, t[r + 9], 21, -343485551),
                    d = e(d, u),
                    h = e(h, s),
                    g = e(g, l),
                    v = e(v, f);
                return [d, h, g, v]
            }
            function s(t) {
                var n, e = "", r = 32 * t.length;
                for (n = 0; n < r; n += 8)
                    e += String.fromCharCode(t[n >> 5] >>> n % 32 & 255);
                return e
            }
            function l(t) {
                var n, e = [];
                for (e[(t.length >> 2) - 1] = void 0,
                n = 0; n < e.length; n += 1)
                    e[n] = 0;
                var r = 8 * t.length;
                for (n = 0; n < r; n += 8)
                    e[n >> 5] |= (255 & t.charCodeAt(n / 8)) << n % 32;
                return e
            }
            function f(t) {
                var n, e, r = "0123456789abcdef", i = "";
                for (e = 0; e < t.length; e += 1)
                    n = t.charCodeAt(e),
                    i += r.charAt(n >>> 4 & 15) + r.charAt(15 & n);
                return i
            }
            function d(t) {
                return unescape(encodeURIComponent(t))
            }
            function h(t) {
                return function(t) {
                    return s(u(l(t), 8 * t.length))
                }(d(t))
            }
            function g(t, n) {
                return function(t, n) {
                    var e, r, i = l(t), o = [], a = [];
                    for (o[15] = a[15] = void 0,
                    16 < i.length && (i = u(i, 8 * t.length)),
                    e = 0; e < 16; e += 1)
                        o[e] = 909522486 ^ i[e],
                        a[e] = 1549556828 ^ i[e];
                    return r = u(o.concat(l(n)), 512 + 8 * n.length),
                    s(u(a.concat(r), 640))
                }(d(t), d(n))
            }
            function v(t, n, e) {
                return n ? e ? g(n, t) : function(t, n) {
                    return f(g(t, n))
                }(n, t) : e ? h(t) : function(t) {
                    return f(h(t))
                }(t)
            }
            t.exports ? t.exports = v : n.md5 = v
        }(y)
    }(m = {
        exports: {}
    }),
    m.exports), w = function(t) {
        return "https://platform".concat("Prod" == o.ins.init.env ? "" : "-test", ".hortorgames.com/common/api/v2/validate_img/") + t
    }, I = function() {
        var t = o.ins.init
          , n = t.gameId
          , e = t.uniqueId;
        return "gameId=".concat(n, "&uniqueId=").concat(e)
    };
    function C(t) {
        return new Promise(function(n, e) {
            var r = o.wx;
            if (r)
                r.request({
                    method: "POST",
                    url: t.url,
                    data: t.params,
                    success: function(t) {
                        t.data && t.data.data ? n(t.data.data) : e("\u9a8c\u8bc1\u5931\u8d25, \u8bf7\u91cd\u65b0\u5c1d\u8bd5")
                    },
                    fail: e
                });
            else {
                var i = new XMLHttpRequest;
                i.open("POST", t.url),
                i.setRequestHeader("Content-Type", "application/json"),
                i.onload = function() {
                    if (200 === i.status) {
                        var t = JSON.parse(i.responseText);
                        t && t.meta && 0 === t.meta.errCode ? n(t.data) : e(t.meta.errMsg)
                    } else
                        e(i.statusText)
                }
                ,
                i.onerror = function() {
                    e(i.statusText)
                }
                ,
                i.send(JSON.stringify(t.params))
            }
        }
        )
    }
    function x() {
        return t(this, void 0, void 0, function() {
            var t, e, r, i, a, c;
            return n(this, function(n) {
                switch (n.label) {
                case 0:
                    return t = o.ins.init,
                    e = t.gameId,
                    r = t.uniqueId,
                    i = u(),
                    s = o.wx,
                    a = s ? s.getSystemInfoSync().brand : "",
                    c = {
                        gameId: e,
                        uniqueId: r,
                        timestamp: i,
                        brand: a,
                        sign: b("".concat(I(), "&time=").concat(i, "&brand=").concat(a, "&salt=NHpGRkw3185m26Ul"))
                    },
                    [4, C({
                        url: w("token"),
                        params: c
                    })];
                case 1:
                    return [2, n.sent().token]
                }
                var s
            })
        })
    }
    function O() {
        return t(this, void 0, void 0, function() {
            var t, e, r, i, a, c, s, l, f, g;
            return n(this, function(n) {
                switch (n.label) {
                case 0:
                    return t = o.ins.init,
                    e = t.gameId,
                    r = t.uniqueId,
                    i = o.ins.apiData,
                    a = i.token,
                    c = i.globalOffset,
                    s = u(),
                    l = {
                        gameId: e,
                        uniqueId: r,
                        timestamp: s,
                        offset: c,
                        sign: b("".concat(I(), "&time=").concat(s, "&offset=").concat(c, "&salt=mnNZgVNSw3SSUXs8"))
                    },
                    f = {
                        gameId: e,
                        uniqueId: r,
                        data: d(l, a)
                    },
                    [4, C({
                        url: w("get_validate_img"),
                        params: f
                    })];
                case 1:
                    return g = n.sent(),
                    [2, h(g, a)]
                }
            })
        })
    }
    function A(e) {
        return t(this, void 0, void 0, function() {
            var t, r, i, a, l, f, h, g, v, p;
            return n(this, function(n) {
                switch (n.label) {
                case 0:
                    return t = o.ins.init,
                    r = t.gameId,
                    i = t.uniqueId,
                    a = o.ins.apiData,
                    l = a.token,
                    f = a.validateId,
                    h = u(),
                    g = function(t) {
                        var n = []
                          , e = !(h % 2);
                        return t.map(function(t, r, i) {
                            var o, a, u = {
                                x: t.x,
                                y: t.y,
                                time: t.time
                            }, l = e ? -c(2, 4) : c(2, 4), f = i[r + 1];
                            o = f ? f.x - t.x : s(0, 1),
                            a = f ? f.x - t.x : s(0, 1);
                            var d = {
                                x: t.x + o,
                                y: t.y + a,
                                time: t.time + l
                            };
                            e ? (n.push(d),
                            n.push(u)) : (n.push(u),
                            n.push(d))
                        }),
                        n
                    }(e),
                    v = {
                        gameId: r,
                        uniqueId: i,
                        validateId: f,
                        recordInfos: g,
                        timestamp: h,
                        sign: b("".concat(I(), "&validateId=").concat(f, "&time=").concat(h, "&salt=mqPnJ6JnNl65HzWm"))
                    },
                    p = {
                        gameId: r,
                        uniqueId: i,
                        data: d(v, l)
                    },
                    [4, C({
                        url: w("check_validate_img"),
                        params: p
                    })];
                case 1:
                    return [2, n.sent()]
                }
            })
        })
    }
    var T = function(t, n) {
        void 0 === n && (n = {});
        var e = new cc.Node(t);
        return n && function(t, n) {
            var e = t.addComponent(cc.Widget);
            null != n.top && (e.top = n.top,
            e.isAlignTop = !0),
            null != n.bottom && (e.bottom = n.bottom,
            e.isAlignBottom = !0),
            null != n.right && (e.right = n.right,
            e.isAlignRight = !0),
            null != n.left && (e.left = n.left,
            e.isAlignLeft = !0),
            n.isHorizontal && (e.isAlignHorizontalCenter = !0),
            n.isVertical && (e.isAlignVerticalCenter = !0)
        }(e, n),
        e
    }
      , S = function(t, n, e, r, i) {
        i && (t.color = (new cc.Color).fromHEX("#" + i));
        var o = t.addComponent(cc.Label);
        return o.string = n,
        o.fontSize = e,
        o.lineHeight = r || e,
        o
    }
      , k = function(t, n, e, r, i) {
        void 0 === r && (r = 0),
        void 0 === i && (i = 0);
        var o = t.addComponent(cc.Layout);
        o.type = n,
        o.resizeMode = e,
        o.spacingX = r,
        o.spacingY = i
    }
      , P = function(t) {
        return t.addComponent(cc.Graphics)
    }
      , N = function(t, n, e, r) {
        t.roundRect(-n / 2, -e / 2, n, e, r)
    }
      , _ = function(t, n) {
        t.fillColor = (new cc.Color).fromHEX("#" + n),
        t.fill()
    }
      , H = function(t, n) {
        t.parent = n
    }
      , D = function(t, n, e) {
        return new Promise(function(r, i) {
            M(n).then(function(n) {
                var i = t.addComponent(cc.Sprite);
                e ? function(t, n, e) {
                    t.spriteFrame = n,
                    t.sizeMode = cc.Sprite.SizeMode.CUSTOM,
                    t.type = cc.Sprite.Type.SLICED,
                    n.insetBottom = n.insetTop = n.insetLeft = n.insetRight = e
                }(i, n, e) : i.spriteFrame = n,
                r(i)
            }).catch(i)
        }
        )
    }
      , M = function(t) {
        return new Promise(function(n, e) {
            cc.assetManager.loadRemote(t, function(t, r) {
                if (null == t) {
                    var i = new cc.SpriteFrame;
                    i.setTexture(r),
                    n(i)
                } else
                    e({
                        errMsg: "load spf failed"
                    })
            })
        }
        )
    }
      , q = function(t, n, e) {
        t.setContentSize(n, e)
    }
      , E = !1
      , U = null
      , z = null
      , F = null
      , R = null
      , L = []
      , j = []
      , J = {
        suc: null,
        err: null
    }
      , V = null;
    function B() {
        return t(this, void 0, void 0, function() {
            var t, e, r, c, u, s, l, f, d, h, g;
            return n(this, function(n) {
                switch (n.label) {
                case 0:
                    return Y(!0, "\u52a0\u8f7d\u4e2d..."),
                    [4, x()];
                case 1:
                    return t = n.sent(),
                    o.syncApi({
                        token: t
                    }),
                    [4, O()];
                case 2:
                    if (e = n.sent(),
                    o.syncApi({
                        validateId: e.validateId
                    }),
                    r = T("tip-layout", {
                        top: 20,
                        left: 20
                    }),
                    H(r, F),
                    k(r, cc.Layout.Type.HORIZONTAL, cc.Layout.ResizeMode.CONTAINER),
                    q(r, 572, 80),
                    r.setAnchorPoint(0, .5),
                    c = T("tip-label"),
                    S(c, e.detail, 28, 0, "000000"),
                    H(c, r),
                    e.subTp == i.ClickMore)
                        for (u = T("tip-imgs-layout"),
                        H(u, r),
                        u.getPosition().equals,
                        u.setPosition(u.getPosition().add(cc.v2(0, 12))),
                        k(u, cc.Layout.Type.HORIZONTAL, cc.Layout.ResizeMode.CONTAINER, 10),
                        s = function(t) {
                            var n = e.detailImgs[t]
                              , r = T("img" + t);
                            H(r, u),
                            D(r, n).then(function() {
                                q(r, 50, 50)
                            })
                        }
                        ,
                        l = 0; l < e.detailImgs.length; ++l)
                            s(l);
                    return f = new cc.Size(572,280),
                    d = T("body", {
                        top: 90,
                        isHorizontal: !0
                    }),
                    H(d, F),
                    q(d, f.width, f.height),
                    h = R = T("sprite"),
                    H(h, d),
                    [4, D(h, e.backImg)];
                case 3:
                    return n.sent(),
                    q(h, 572, 280),
                    g = T("click-layer"),
                    H(g, d),
                    q(g, 286, 140),
                    h.on(cc.Node.EventType.TOUCH_END, function(t) {
                        var n = t.getLocation()
                          , e = h.convertToNodeSpaceAR(n)
                          , r = h.getContentSize()
                          , i = h.getAnchorPoint()
                          , c = cc.v2(e.x + i.x * r.width, r.height - e.y - (1 - i.y) * r.height)
                          , u = T("child")
                          , s = P(u);
                        H(u, g),
                        q(u, 60, 60),
                        function(t, n, e) {
                            t.setPosition(cc.v2(n, e))
                        }(u, e.x, e.y),
                        s.lineWidth = 10,
                        s.circle(0, 0, 20),
                        s.strokeColor = cc.Color.WHITE,
                        s.stroke(),
                        _(s, "2165fc");
                        var l = T("child-lb")
                          , f = S(l, (L.length + 1).toString(), 30, 26);
                        H(l, u);
                        var d = {
                            x: (c.x + o.ins.apiData.globalOffset) / 2,
                            y: (c.y + o.ins.apiData.globalOffset) / 2,
                            time: Date.now()
                        };
                        L.push(d),
                        j.push(f),
                        u.once(cc.Node.EventType.TOUCH_END, function(t) {
                            var n = t.target.getSiblingIndex();
                            L.splice(n, 1),
                            j.splice(n, 1),
                            j.forEach(function(t, n) {
                                return t.string = "".concat(n + 1)
                            }),
                            a({
                                event_step: "verify_redo",
                                verify_state: ++n
                            }),
                            u.destroy()
                        }),
                        a({
                            event_step: "verify_tap",
                            verify_state: L.length
                        })
                    }),
                    Y(!1),
                    [2]
                }
            })
        })
    }
    function X() {
        return t(this, void 0, void 0, function() {
            return n(this, function(t) {
                switch (t.label) {
                case 0:
                    return t.trys.push([0, 3, 5, 6]),
                    Y(!0, "\u9a8c\u8bc1\u4e2d"),
                    [4, A(L)];
                case 1:
                    return t.sent(),
                    W(1),
                    [4, new Promise(function(t) {
                        return setTimeout(t, 700)
                    }
                    )];
                case 2:
                    return t.sent(),
                    Z(),
                    J.suc(),
                    a({
                        event_step: "verify_suc"
                    }),
                    [3, 6];
                case 3:
                    return t.sent(),
                    a({
                        event_step: "verify_err"
                    }),
                    [4, new Promise(function(t) {
                        cc.tween(F).call(function() {
                            return W(0)
                        }).sequence(cc.tween().to(.1, {
                            position: cc.v3(10, 0)
                        }), cc.tween().to(.1, {
                            position: cc.v3(-10, 0)
                        })).repeat(3).to(.1, {
                            position: cc.v3(0, 0)
                        }).delay(.3).call(function() {
                            K().then(t)
                        }).start(),
                        V && V({
                            errCode: 0,
                            errMsg: "validate fail"
                        })
                    }
                    )];
                case 4:
                    return t.sent(),
                    [3, 6];
                case 5:
                    return Y(!1),
                    [7];
                case 6:
                    return [2]
                }
            })
        })
    }
    function K() {
        return Y(!0),
        new Promise(function(t) {
            cc.tween(F).to(.2, {
                opacity: 0,
                scale: .9
            }, {
                easing: cc.easing.quadOut
            }).call(function() {
                new Promise(function(t) {
                    try {
                        var n = F.getChildByName("body");
                        n && n.removeFromParent();
                        var e = F.getChildByName("tip-layout");
                        e && e.removeFromParent(),
                        L.length = 0,
                        j.length = 0,
                        B().then(t)
                    } catch (n) {
                        Z(),
                        t(),
                        J.err(n)
                    }
                }
                ).then(t)
            }).set({
                scale: 1,
                opacity: 255
            }).start()
        }
        )
    }
    function W(t) {
        var n = T("result", {
            left: 0,
            right: 0,
            bottom: 0
        });
        H(n, R);
        var e = T("result-label", {
            isHorizontal: !0,
            isVertical: !0
        });
        H(e, n),
        q(n, 572, 40);
        var r = P(n);
        N(r, 572, 40, 10),
        _(r, t ? "3CD25A" : "FF0000"),
        S(e, t ? "\u9a8c\u8bc1\u6210\u529f" : "\u9a8c\u8bc1\u5931\u8d25\uff0c\u8bf7\u91cd\u8bd5", 24, 20)
    }
    function G(t) {
        E = t
    }
    function Z() {
        U && U.removeAllChildren(),
        L.length = 0,
        j.length = 0,
        G(!1),
        Y(!1)
    }
    var Y = function(t, n) {
        void 0 === n && (n = "");
        var e = o.wx;
        t ? (e && e.showLoading({
            title: n,
            mask: !0
        }),
        z.enabled = !0) : (e && e.hideLoading(),
        z.enabled = !1)
    };
    console.warn("build time:", "4/8/2024, 7:57:13 PM"),
    console.warn("build vers:", "1.0.0"),
    window.VERIFY = Object.assign({
        bootstrap: function(t) {
            if (!o.hasInit) {
                o.syncInit(t);
                for (var n = [o.baseImgUrl.logo, o.baseImgUrl.refresh], e = 0; e < n.length; ++e)
                    M(n[e])
            }
        },
        turnpass: function(e) {
            var r = this;
            return new Promise(function(i, u) {
                return t(r, void 0, void 0, function() {
                    var t;
                    return n(this, function(n) {
                        switch (n.label) {
                        case 0:
                            return n.trys.push([0, 2, , 3]),
                            E ? [2, u({
                                errMsg: "\u8bf7\u4e0d\u8981\u91cd\u590d\u9a8c\u8bc1"
                            })] : (a({
                                event_step: "verify_start"
                            }),
                            o.syncApi({
                                globalOffset: c(0, 5)
                            }),
                            G(!0),
                            U = e.node,
                            V = e.listener,
                            function() {
                                var t = T("verify-panel")
                                  , n = P(t);
                                N(n, 600, 480, 25),
                                _(n, "FFFFFF"),
                                q(t, 600, 480),
                                H(t, U);
                                var e = T("mask", {
                                    top: 0,
                                    left: 0,
                                    bottom: 0,
                                    right: 0
                                });
                                z = e.addComponent(cc.BlockInputEvents),
                                H(e, t),
                                F = T("container", {
                                    top: 0,
                                    right: 0,
                                    bottom: 0,
                                    left: 0
                                }),
                                H(F, t);
                                var r = T("logo", {
                                    bottom: 30,
                                    left: 30
                                })
                                  , i = o.baseImgUrl.logo;
                                D(r, i).then(function() {
                                    H(r, t)
                                });
                                var a = T("refresh-btn", {
                                    top: 20,
                                    right: 20
                                })
                                  , c = o.baseImgUrl.refresh;
                                D(a, c).then(function() {
                                    H(a, t),
                                    e.zIndex = 999
                                });
                                var u = T("confirm-btn", {
                                    right: 20,
                                    bottom: 30
                                })
                                  , s = P(u);
                                N(s, 100, 50, 15),
                                _(s, "409EFF"),
                                q(u, 100, 50),
                                H(u, t);
                                var l, f, d = T("confirm-label", {
                                    isHorizontal: !0,
                                    isVertical: !0
                                });
                                S(d, "\u786e\u8ba4", 26, 21),
                                H(d, u),
                                a.on(cc.Node.EventType.TOUCH_END, K),
                                u.on(cc.Node.EventType.TOUCH_END, X),
                                l = t,
                                void 0 === f && (f = .5),
                                new Promise(function(t) {
                                    cc.tween(l).set({
                                        opacity: 0,
                                        scale: .5
                                    }).to(f, {
                                        opacity: 255,
                                        scale: 1
                                    }, {
                                        easing: "backOut"
                                    }).call(function() {
                                        t()
                                    }).start()
                                }
                                )
                            }(),
                            [4, B()]);
                        case 1:
                            return n.sent(),
                            J.suc = i,
                            J.err = u,
                            [3, 3];
                        case 2:
                            return t = n.sent(),
                            a({
                                event_step: "verify_logic_err",
                                errmsg: JSON.stringify(t)
                            }),
                            Z(),
                            u(t),
                            [3, 3];
                        case 3:
                            return [2]
                        }
                    })
                })
            }
            )
        }
    })
});
