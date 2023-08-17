"use strict";
Object.defineProperty(exports, "__esModule", { value: !0 });
var e = require("util"),
  n = require("stream"),
  a = require("path"),
  t = require("http"),
  i = require("https"),
  o = require("url"),
  s = require("fs"),
  r = require("assert"),
  c = require("tty"),
  p = require("zlib"),
  l = require("events"),
  u = require("os"),
  d =
    "undefined" != typeof globalThis
      ? globalThis
      : "undefined" != typeof window
      ? window
      : "undefined" != typeof global
      ? global
      : "undefined" != typeof self
      ? self
      : {},
  m = {},
  f = n.Stream,
  h = x;
function x() {
  (this.source = null),
    (this.dataSize = 0),
    (this.maxDataSize = 1048576),
    (this.pauseStream = !0),
    (this._maxDataSizeExceeded = !1),
    (this._released = !1),
    (this._bufferedEvents = []);
}
e.inherits(x, f),
  (x.create = function (e, n) {
    var a = new this();
    for (var t in (n = n || {})) a[t] = n[t];
    a.source = e;
    var i = e.emit;
    return (
      (e.emit = function () {
        return a._handleEmit(arguments), i.apply(e, arguments);
      }),
      e.on("error", function () {}),
      a.pauseStream && e.pause(),
      a
    );
  }),
  Object.defineProperty(x.prototype, "readable", {
    configurable: !0,
    enumerable: !0,
    get: function () {
      return this.source.readable;
    },
  }),
  (x.prototype.setEncoding = function () {
    return this.source.setEncoding.apply(this.source, arguments);
  }),
  (x.prototype.resume = function () {
    this._released || this.release(), this.source.resume();
  }),
  (x.prototype.pause = function () {
    this.source.pause();
  }),
  (x.prototype.release = function () {
    (this._released = !0),
      this._bufferedEvents.forEach(
        function (e) {
          this.emit.apply(this, e);
        }.bind(this)
      ),
      (this._bufferedEvents = []);
  }),
  (x.prototype.pipe = function () {
    var e = f.prototype.pipe.apply(this, arguments);
    return this.resume(), e;
  }),
  (x.prototype._handleEmit = function (e) {
    this._released
      ? this.emit.apply(this, e)
      : ("data" === e[0] &&
          ((this.dataSize += e[1].length), this._checkIfMaxDataSizeExceeded()),
        this._bufferedEvents.push(e));
  }),
  (x.prototype._checkIfMaxDataSizeExceeded = function () {
    if (!(this._maxDataSizeExceeded || this.dataSize <= this.maxDataSize)) {
      this._maxDataSizeExceeded = !0;
      var e =
        "DelayedStream#maxDataSize of " + this.maxDataSize + " bytes exceeded.";
      this.emit("error", new Error(e));
    }
  });
var v = e,
  b = n.Stream,
  g = h,
  y = w;
function w() {
  (this.writable = !1),
    (this.readable = !0),
    (this.dataSize = 0),
    (this.maxDataSize = 2097152),
    (this.pauseStreams = !0),
    (this._released = !1),
    (this._streams = []),
    (this._currentStream = null),
    (this._insideLoop = !1),
    (this._pendingNext = !1);
}
v.inherits(w, b),
  (w.create = function (e) {
    var n = new this();
    for (var a in (e = e || {})) n[a] = e[a];
    return n;
  }),
  (w.isStreamLike = function (e) {
    return (
      "function" != typeof e &&
      "string" != typeof e &&
      "boolean" != typeof e &&
      "number" != typeof e &&
      !Buffer.isBuffer(e)
    );
  }),
  (w.prototype.append = function (e) {
    if (w.isStreamLike(e)) {
      if (!(e instanceof g)) {
        var n = g.create(e, {
          maxDataSize: 1 / 0,
          pauseStream: this.pauseStreams,
        });
        e.on("data", this._checkDataSize.bind(this)), (e = n);
      }
      this._handleErrors(e), this.pauseStreams && e.pause();
    }
    return this._streams.push(e), this;
  }),
  (w.prototype.pipe = function (e, n) {
    return b.prototype.pipe.call(this, e, n), this.resume(), e;
  }),
  (w.prototype._getNext = function () {
    if (((this._currentStream = null), this._insideLoop))
      this._pendingNext = !0;
    else {
      this._insideLoop = !0;
      try {
        do {
          (this._pendingNext = !1), this._realGetNext();
        } while (this._pendingNext);
      } finally {
        this._insideLoop = !1;
      }
    }
  }),
  (w.prototype._realGetNext = function () {
    var e = this._streams.shift();
    void 0 !== e
      ? "function" == typeof e
        ? e(
            function (e) {
              w.isStreamLike(e) &&
                (e.on("data", this._checkDataSize.bind(this)),
                this._handleErrors(e)),
                this._pipeNext(e);
            }.bind(this)
          )
        : this._pipeNext(e)
      : this.end();
  }),
  (w.prototype._pipeNext = function (e) {
    if (((this._currentStream = e), w.isStreamLike(e)))
      return (
        e.on("end", this._getNext.bind(this)), void e.pipe(this, { end: !1 })
      );
    var n = e;
    this.write(n), this._getNext();
  }),
  (w.prototype._handleErrors = function (e) {
    var n = this;
    e.on("error", function (e) {
      n._emitError(e);
    });
  }),
  (w.prototype.write = function (e) {
    this.emit("data", e);
  }),
  (w.prototype.pause = function () {
    this.pauseStreams &&
      (this.pauseStreams &&
        this._currentStream &&
        "function" == typeof this._currentStream.pause &&
        this._currentStream.pause(),
      this.emit("pause"));
  }),
  (w.prototype.resume = function () {
    this._released ||
      ((this._released = !0), (this.writable = !0), this._getNext()),
      this.pauseStreams &&
        this._currentStream &&
        "function" == typeof this._currentStream.resume &&
        this._currentStream.resume(),
      this.emit("resume");
  }),
  (w.prototype.end = function () {
    this._reset(), this.emit("end");
  }),
  (w.prototype.destroy = function () {
    this._reset(), this.emit("close");
  }),
  (w.prototype._reset = function () {
    (this.writable = !1), (this._streams = []), (this._currentStream = null);
  }),
  (w.prototype._checkDataSize = function () {
    if ((this._updateDataSize(), !(this.dataSize <= this.maxDataSize))) {
      var e =
        "DelayedStream#maxDataSize of " + this.maxDataSize + " bytes exceeded.";
      this._emitError(new Error(e));
    }
  }),
  (w.prototype._updateDataSize = function () {
    this.dataSize = 0;
    var e = this;
    this._streams.forEach(function (n) {
      n.dataSize && (e.dataSize += n.dataSize);
    }),
      this._currentStream &&
        this._currentStream.dataSize &&
        (this.dataSize += this._currentStream.dataSize);
  }),
  (w.prototype._emitError = function (e) {
    this._reset(), this.emit("error", e);
  });
var _ = {},
  k = {},
  j = {
    "application/1d-interleaved-parityfec": { source: "iana" },
    "application/3gpdash-qoe-report+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/3gpp-ims+xml": { source: "iana", compressible: !0 },
    "application/3gpphal+json": { source: "iana", compressible: !0 },
    "application/3gpphalforms+json": { source: "iana", compressible: !0 },
    "application/a2l": { source: "iana" },
    "application/ace+cbor": { source: "iana" },
    "application/activemessage": { source: "iana" },
    "application/activity+json": { source: "iana", compressible: !0 },
    "application/alto-costmap+json": { source: "iana", compressible: !0 },
    "application/alto-costmapfilter+json": { source: "iana", compressible: !0 },
    "application/alto-directory+json": { source: "iana", compressible: !0 },
    "application/alto-endpointcost+json": { source: "iana", compressible: !0 },
    "application/alto-endpointcostparams+json": {
      source: "iana",
      compressible: !0,
    },
    "application/alto-endpointprop+json": { source: "iana", compressible: !0 },
    "application/alto-endpointpropparams+json": {
      source: "iana",
      compressible: !0,
    },
    "application/alto-error+json": { source: "iana", compressible: !0 },
    "application/alto-networkmap+json": { source: "iana", compressible: !0 },
    "application/alto-networkmapfilter+json": {
      source: "iana",
      compressible: !0,
    },
    "application/alto-updatestreamcontrol+json": {
      source: "iana",
      compressible: !0,
    },
    "application/alto-updatestreamparams+json": {
      source: "iana",
      compressible: !0,
    },
    "application/aml": { source: "iana" },
    "application/andrew-inset": { source: "iana", extensions: ["ez"] },
    "application/applefile": { source: "iana" },
    "application/applixware": { source: "apache", extensions: ["aw"] },
    "application/at+jwt": { source: "iana" },
    "application/atf": { source: "iana" },
    "application/atfx": { source: "iana" },
    "application/atom+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["atom"],
    },
    "application/atomcat+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["atomcat"],
    },
    "application/atomdeleted+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["atomdeleted"],
    },
    "application/atomicmail": { source: "iana" },
    "application/atomsvc+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["atomsvc"],
    },
    "application/atsc-dwd+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["dwd"],
    },
    "application/atsc-dynamic-event-message": { source: "iana" },
    "application/atsc-held+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["held"],
    },
    "application/atsc-rdt+json": { source: "iana", compressible: !0 },
    "application/atsc-rsat+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["rsat"],
    },
    "application/atxml": { source: "iana" },
    "application/auth-policy+xml": { source: "iana", compressible: !0 },
    "application/bacnet-xdd+zip": { source: "iana", compressible: !1 },
    "application/batch-smtp": { source: "iana" },
    "application/bdoc": { compressible: !1, extensions: ["bdoc"] },
    "application/beep+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/calendar+json": { source: "iana", compressible: !0 },
    "application/calendar+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xcs"],
    },
    "application/call-completion": { source: "iana" },
    "application/cals-1840": { source: "iana" },
    "application/captive+json": { source: "iana", compressible: !0 },
    "application/cbor": { source: "iana" },
    "application/cbor-seq": { source: "iana" },
    "application/cccex": { source: "iana" },
    "application/ccmp+xml": { source: "iana", compressible: !0 },
    "application/ccxml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["ccxml"],
    },
    "application/cdfx+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["cdfx"],
    },
    "application/cdmi-capability": { source: "iana", extensions: ["cdmia"] },
    "application/cdmi-container": { source: "iana", extensions: ["cdmic"] },
    "application/cdmi-domain": { source: "iana", extensions: ["cdmid"] },
    "application/cdmi-object": { source: "iana", extensions: ["cdmio"] },
    "application/cdmi-queue": { source: "iana", extensions: ["cdmiq"] },
    "application/cdni": { source: "iana" },
    "application/cea": { source: "iana" },
    "application/cea-2018+xml": { source: "iana", compressible: !0 },
    "application/cellml+xml": { source: "iana", compressible: !0 },
    "application/cfw": { source: "iana" },
    "application/city+json": { source: "iana", compressible: !0 },
    "application/clr": { source: "iana" },
    "application/clue+xml": { source: "iana", compressible: !0 },
    "application/clue_info+xml": { source: "iana", compressible: !0 },
    "application/cms": { source: "iana" },
    "application/cnrp+xml": { source: "iana", compressible: !0 },
    "application/coap-group+json": { source: "iana", compressible: !0 },
    "application/coap-payload": { source: "iana" },
    "application/commonground": { source: "iana" },
    "application/conference-info+xml": { source: "iana", compressible: !0 },
    "application/cose": { source: "iana" },
    "application/cose-key": { source: "iana" },
    "application/cose-key-set": { source: "iana" },
    "application/cpl+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["cpl"],
    },
    "application/csrattrs": { source: "iana" },
    "application/csta+xml": { source: "iana", compressible: !0 },
    "application/cstadata+xml": { source: "iana", compressible: !0 },
    "application/csvm+json": { source: "iana", compressible: !0 },
    "application/cu-seeme": { source: "apache", extensions: ["cu"] },
    "application/cwt": { source: "iana" },
    "application/cybercash": { source: "iana" },
    "application/dart": { compressible: !0 },
    "application/dash+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["mpd"],
    },
    "application/dash-patch+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["mpp"],
    },
    "application/dashdelta": { source: "iana" },
    "application/davmount+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["davmount"],
    },
    "application/dca-rft": { source: "iana" },
    "application/dcd": { source: "iana" },
    "application/dec-dx": { source: "iana" },
    "application/dialog-info+xml": { source: "iana", compressible: !0 },
    "application/dicom": { source: "iana" },
    "application/dicom+json": { source: "iana", compressible: !0 },
    "application/dicom+xml": { source: "iana", compressible: !0 },
    "application/dii": { source: "iana" },
    "application/dit": { source: "iana" },
    "application/dns": { source: "iana" },
    "application/dns+json": { source: "iana", compressible: !0 },
    "application/dns-message": { source: "iana" },
    "application/docbook+xml": {
      source: "apache",
      compressible: !0,
      extensions: ["dbk"],
    },
    "application/dots+cbor": { source: "iana" },
    "application/dskpp+xml": { source: "iana", compressible: !0 },
    "application/dssc+der": { source: "iana", extensions: ["dssc"] },
    "application/dssc+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xdssc"],
    },
    "application/dvcs": { source: "iana" },
    "application/ecmascript": {
      source: "iana",
      compressible: !0,
      extensions: ["es", "ecma"],
    },
    "application/edi-consent": { source: "iana" },
    "application/edi-x12": { source: "iana", compressible: !1 },
    "application/edifact": { source: "iana", compressible: !1 },
    "application/efi": { source: "iana" },
    "application/elm+json": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/elm+xml": { source: "iana", compressible: !0 },
    "application/emergencycalldata.cap+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/emergencycalldata.comment+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/emergencycalldata.control+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/emergencycalldata.deviceinfo+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/emergencycalldata.ecall.msd": { source: "iana" },
    "application/emergencycalldata.providerinfo+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/emergencycalldata.serviceinfo+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/emergencycalldata.subscriberinfo+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/emergencycalldata.veds+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/emma+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["emma"],
    },
    "application/emotionml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["emotionml"],
    },
    "application/encaprtp": { source: "iana" },
    "application/epp+xml": { source: "iana", compressible: !0 },
    "application/epub+zip": {
      source: "iana",
      compressible: !1,
      extensions: ["epub"],
    },
    "application/eshop": { source: "iana" },
    "application/exi": { source: "iana", extensions: ["exi"] },
    "application/expect-ct-report+json": { source: "iana", compressible: !0 },
    "application/express": { source: "iana", extensions: ["exp"] },
    "application/fastinfoset": { source: "iana" },
    "application/fastsoap": { source: "iana" },
    "application/fdt+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["fdt"],
    },
    "application/fhir+json": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/fhir+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/fido.trusted-apps+json": { compressible: !0 },
    "application/fits": { source: "iana" },
    "application/flexfec": { source: "iana" },
    "application/font-sfnt": { source: "iana" },
    "application/font-tdpfr": { source: "iana", extensions: ["pfr"] },
    "application/font-woff": { source: "iana", compressible: !1 },
    "application/framework-attributes+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/geo+json": {
      source: "iana",
      compressible: !0,
      extensions: ["geojson"],
    },
    "application/geo+json-seq": { source: "iana" },
    "application/geopackage+sqlite3": { source: "iana" },
    "application/geoxacml+xml": { source: "iana", compressible: !0 },
    "application/gltf-buffer": { source: "iana" },
    "application/gml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["gml"],
    },
    "application/gpx+xml": {
      source: "apache",
      compressible: !0,
      extensions: ["gpx"],
    },
    "application/gxf": { source: "apache", extensions: ["gxf"] },
    "application/gzip": {
      source: "iana",
      compressible: !1,
      extensions: ["gz"],
    },
    "application/h224": { source: "iana" },
    "application/held+xml": { source: "iana", compressible: !0 },
    "application/hjson": { extensions: ["hjson"] },
    "application/http": { source: "iana" },
    "application/hyperstudio": { source: "iana", extensions: ["stk"] },
    "application/ibe-key-request+xml": { source: "iana", compressible: !0 },
    "application/ibe-pkg-reply+xml": { source: "iana", compressible: !0 },
    "application/ibe-pp-data": { source: "iana" },
    "application/iges": { source: "iana" },
    "application/im-iscomposing+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/index": { source: "iana" },
    "application/index.cmd": { source: "iana" },
    "application/index.obj": { source: "iana" },
    "application/index.response": { source: "iana" },
    "application/index.vnd": { source: "iana" },
    "application/inkml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["ink", "inkml"],
    },
    "application/iotp": { source: "iana" },
    "application/ipfix": { source: "iana", extensions: ["ipfix"] },
    "application/ipp": { source: "iana" },
    "application/isup": { source: "iana" },
    "application/its+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["its"],
    },
    "application/java-archive": {
      source: "apache",
      compressible: !1,
      extensions: ["jar", "war", "ear"],
    },
    "application/java-serialized-object": {
      source: "apache",
      compressible: !1,
      extensions: ["ser"],
    },
    "application/java-vm": {
      source: "apache",
      compressible: !1,
      extensions: ["class"],
    },
    "application/javascript": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
      extensions: ["js", "mjs"],
    },
    "application/jf2feed+json": { source: "iana", compressible: !0 },
    "application/jose": { source: "iana" },
    "application/jose+json": { source: "iana", compressible: !0 },
    "application/jrd+json": { source: "iana", compressible: !0 },
    "application/jscalendar+json": { source: "iana", compressible: !0 },
    "application/json": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
      extensions: ["json", "map"],
    },
    "application/json-patch+json": { source: "iana", compressible: !0 },
    "application/json-seq": { source: "iana" },
    "application/json5": { extensions: ["json5"] },
    "application/jsonml+json": {
      source: "apache",
      compressible: !0,
      extensions: ["jsonml"],
    },
    "application/jwk+json": { source: "iana", compressible: !0 },
    "application/jwk-set+json": { source: "iana", compressible: !0 },
    "application/jwt": { source: "iana" },
    "application/kpml-request+xml": { source: "iana", compressible: !0 },
    "application/kpml-response+xml": { source: "iana", compressible: !0 },
    "application/ld+json": {
      source: "iana",
      compressible: !0,
      extensions: ["jsonld"],
    },
    "application/lgr+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["lgr"],
    },
    "application/link-format": { source: "iana" },
    "application/load-control+xml": { source: "iana", compressible: !0 },
    "application/lost+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["lostxml"],
    },
    "application/lostsync+xml": { source: "iana", compressible: !0 },
    "application/lpf+zip": { source: "iana", compressible: !1 },
    "application/lxf": { source: "iana" },
    "application/mac-binhex40": { source: "iana", extensions: ["hqx"] },
    "application/mac-compactpro": { source: "apache", extensions: ["cpt"] },
    "application/macwriteii": { source: "iana" },
    "application/mads+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["mads"],
    },
    "application/manifest+json": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
      extensions: ["webmanifest"],
    },
    "application/marc": { source: "iana", extensions: ["mrc"] },
    "application/marcxml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["mrcx"],
    },
    "application/mathematica": {
      source: "iana",
      extensions: ["ma", "nb", "mb"],
    },
    "application/mathml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["mathml"],
    },
    "application/mathml-content+xml": { source: "iana", compressible: !0 },
    "application/mathml-presentation+xml": { source: "iana", compressible: !0 },
    "application/mbms-associated-procedure-description+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/mbms-deregister+xml": { source: "iana", compressible: !0 },
    "application/mbms-envelope+xml": { source: "iana", compressible: !0 },
    "application/mbms-msk+xml": { source: "iana", compressible: !0 },
    "application/mbms-msk-response+xml": { source: "iana", compressible: !0 },
    "application/mbms-protection-description+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/mbms-reception-report+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/mbms-register+xml": { source: "iana", compressible: !0 },
    "application/mbms-register-response+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/mbms-schedule+xml": { source: "iana", compressible: !0 },
    "application/mbms-user-service-description+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/mbox": { source: "iana", extensions: ["mbox"] },
    "application/media-policy-dataset+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["mpf"],
    },
    "application/media_control+xml": { source: "iana", compressible: !0 },
    "application/mediaservercontrol+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["mscml"],
    },
    "application/merge-patch+json": { source: "iana", compressible: !0 },
    "application/metalink+xml": {
      source: "apache",
      compressible: !0,
      extensions: ["metalink"],
    },
    "application/metalink4+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["meta4"],
    },
    "application/mets+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["mets"],
    },
    "application/mf4": { source: "iana" },
    "application/mikey": { source: "iana" },
    "application/mipc": { source: "iana" },
    "application/missing-blocks+cbor-seq": { source: "iana" },
    "application/mmt-aei+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["maei"],
    },
    "application/mmt-usd+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["musd"],
    },
    "application/mods+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["mods"],
    },
    "application/moss-keys": { source: "iana" },
    "application/moss-signature": { source: "iana" },
    "application/mosskey-data": { source: "iana" },
    "application/mosskey-request": { source: "iana" },
    "application/mp21": { source: "iana", extensions: ["m21", "mp21"] },
    "application/mp4": { source: "iana", extensions: ["mp4s", "m4p"] },
    "application/mpeg4-generic": { source: "iana" },
    "application/mpeg4-iod": { source: "iana" },
    "application/mpeg4-iod-xmt": { source: "iana" },
    "application/mrb-consumer+xml": { source: "iana", compressible: !0 },
    "application/mrb-publish+xml": { source: "iana", compressible: !0 },
    "application/msc-ivr+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/msc-mixer+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/msword": {
      source: "iana",
      compressible: !1,
      extensions: ["doc", "dot"],
    },
    "application/mud+json": { source: "iana", compressible: !0 },
    "application/multipart-core": { source: "iana" },
    "application/mxf": { source: "iana", extensions: ["mxf"] },
    "application/n-quads": { source: "iana", extensions: ["nq"] },
    "application/n-triples": { source: "iana", extensions: ["nt"] },
    "application/nasdata": { source: "iana" },
    "application/news-checkgroups": { source: "iana", charset: "US-ASCII" },
    "application/news-groupinfo": { source: "iana", charset: "US-ASCII" },
    "application/news-transmission": { source: "iana" },
    "application/nlsml+xml": { source: "iana", compressible: !0 },
    "application/node": { source: "iana", extensions: ["cjs"] },
    "application/nss": { source: "iana" },
    "application/oauth-authz-req+jwt": { source: "iana" },
    "application/oblivious-dns-message": { source: "iana" },
    "application/ocsp-request": { source: "iana" },
    "application/ocsp-response": { source: "iana" },
    "application/octet-stream": {
      source: "iana",
      compressible: !1,
      extensions: [
        "bin",
        "dms",
        "lrf",
        "mar",
        "so",
        "dist",
        "distz",
        "pkg",
        "bpk",
        "dump",
        "elc",
        "deploy",
        "exe",
        "dll",
        "deb",
        "dmg",
        "iso",
        "img",
        "msi",
        "msp",
        "msm",
        "buffer",
      ],
    },
    "application/oda": { source: "iana", extensions: ["oda"] },
    "application/odm+xml": { source: "iana", compressible: !0 },
    "application/odx": { source: "iana" },
    "application/oebps-package+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["opf"],
    },
    "application/ogg": {
      source: "iana",
      compressible: !1,
      extensions: ["ogx"],
    },
    "application/omdoc+xml": {
      source: "apache",
      compressible: !0,
      extensions: ["omdoc"],
    },
    "application/onenote": {
      source: "apache",
      extensions: ["onetoc", "onetoc2", "onetmp", "onepkg"],
    },
    "application/opc-nodeset+xml": { source: "iana", compressible: !0 },
    "application/oscore": { source: "iana" },
    "application/oxps": { source: "iana", extensions: ["oxps"] },
    "application/p21": { source: "iana" },
    "application/p21+zip": { source: "iana", compressible: !1 },
    "application/p2p-overlay+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["relo"],
    },
    "application/parityfec": { source: "iana" },
    "application/passport": { source: "iana" },
    "application/patch-ops-error+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xer"],
    },
    "application/pdf": {
      source: "iana",
      compressible: !1,
      extensions: ["pdf"],
    },
    "application/pdx": { source: "iana" },
    "application/pem-certificate-chain": { source: "iana" },
    "application/pgp-encrypted": {
      source: "iana",
      compressible: !1,
      extensions: ["pgp"],
    },
    "application/pgp-keys": { source: "iana", extensions: ["asc"] },
    "application/pgp-signature": { source: "iana", extensions: ["asc", "sig"] },
    "application/pics-rules": { source: "apache", extensions: ["prf"] },
    "application/pidf+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/pidf-diff+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/pkcs10": { source: "iana", extensions: ["p10"] },
    "application/pkcs12": { source: "iana" },
    "application/pkcs7-mime": { source: "iana", extensions: ["p7m", "p7c"] },
    "application/pkcs7-signature": { source: "iana", extensions: ["p7s"] },
    "application/pkcs8": { source: "iana", extensions: ["p8"] },
    "application/pkcs8-encrypted": { source: "iana" },
    "application/pkix-attr-cert": { source: "iana", extensions: ["ac"] },
    "application/pkix-cert": { source: "iana", extensions: ["cer"] },
    "application/pkix-crl": { source: "iana", extensions: ["crl"] },
    "application/pkix-pkipath": { source: "iana", extensions: ["pkipath"] },
    "application/pkixcmp": { source: "iana", extensions: ["pki"] },
    "application/pls+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["pls"],
    },
    "application/poc-settings+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/postscript": {
      source: "iana",
      compressible: !0,
      extensions: ["ai", "eps", "ps"],
    },
    "application/ppsp-tracker+json": { source: "iana", compressible: !0 },
    "application/problem+json": { source: "iana", compressible: !0 },
    "application/problem+xml": { source: "iana", compressible: !0 },
    "application/provenance+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["provx"],
    },
    "application/prs.alvestrand.titrax-sheet": { source: "iana" },
    "application/prs.cww": { source: "iana", extensions: ["cww"] },
    "application/prs.cyn": { source: "iana", charset: "7-BIT" },
    "application/prs.hpub+zip": { source: "iana", compressible: !1 },
    "application/prs.nprend": { source: "iana" },
    "application/prs.plucker": { source: "iana" },
    "application/prs.rdf-xml-crypt": { source: "iana" },
    "application/prs.xsf+xml": { source: "iana", compressible: !0 },
    "application/pskc+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["pskcxml"],
    },
    "application/pvd+json": { source: "iana", compressible: !0 },
    "application/qsig": { source: "iana" },
    "application/raml+yaml": { compressible: !0, extensions: ["raml"] },
    "application/raptorfec": { source: "iana" },
    "application/rdap+json": { source: "iana", compressible: !0 },
    "application/rdf+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["rdf", "owl"],
    },
    "application/reginfo+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["rif"],
    },
    "application/relax-ng-compact-syntax": {
      source: "iana",
      extensions: ["rnc"],
    },
    "application/remote-printing": { source: "iana" },
    "application/reputon+json": { source: "iana", compressible: !0 },
    "application/resource-lists+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["rl"],
    },
    "application/resource-lists-diff+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["rld"],
    },
    "application/rfc+xml": { source: "iana", compressible: !0 },
    "application/riscos": { source: "iana" },
    "application/rlmi+xml": { source: "iana", compressible: !0 },
    "application/rls-services+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["rs"],
    },
    "application/route-apd+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["rapd"],
    },
    "application/route-s-tsid+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["sls"],
    },
    "application/route-usd+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["rusd"],
    },
    "application/rpki-ghostbusters": { source: "iana", extensions: ["gbr"] },
    "application/rpki-manifest": { source: "iana", extensions: ["mft"] },
    "application/rpki-publication": { source: "iana" },
    "application/rpki-roa": { source: "iana", extensions: ["roa"] },
    "application/rpki-updown": { source: "iana" },
    "application/rsd+xml": {
      source: "apache",
      compressible: !0,
      extensions: ["rsd"],
    },
    "application/rss+xml": {
      source: "apache",
      compressible: !0,
      extensions: ["rss"],
    },
    "application/rtf": {
      source: "iana",
      compressible: !0,
      extensions: ["rtf"],
    },
    "application/rtploopback": { source: "iana" },
    "application/rtx": { source: "iana" },
    "application/samlassertion+xml": { source: "iana", compressible: !0 },
    "application/samlmetadata+xml": { source: "iana", compressible: !0 },
    "application/sarif+json": { source: "iana", compressible: !0 },
    "application/sarif-external-properties+json": {
      source: "iana",
      compressible: !0,
    },
    "application/sbe": { source: "iana" },
    "application/sbml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["sbml"],
    },
    "application/scaip+xml": { source: "iana", compressible: !0 },
    "application/scim+json": { source: "iana", compressible: !0 },
    "application/scvp-cv-request": { source: "iana", extensions: ["scq"] },
    "application/scvp-cv-response": { source: "iana", extensions: ["scs"] },
    "application/scvp-vp-request": { source: "iana", extensions: ["spq"] },
    "application/scvp-vp-response": { source: "iana", extensions: ["spp"] },
    "application/sdp": { source: "iana", extensions: ["sdp"] },
    "application/secevent+jwt": { source: "iana" },
    "application/senml+cbor": { source: "iana" },
    "application/senml+json": { source: "iana", compressible: !0 },
    "application/senml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["senmlx"],
    },
    "application/senml-etch+cbor": { source: "iana" },
    "application/senml-etch+json": { source: "iana", compressible: !0 },
    "application/senml-exi": { source: "iana" },
    "application/sensml+cbor": { source: "iana" },
    "application/sensml+json": { source: "iana", compressible: !0 },
    "application/sensml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["sensmlx"],
    },
    "application/sensml-exi": { source: "iana" },
    "application/sep+xml": { source: "iana", compressible: !0 },
    "application/sep-exi": { source: "iana" },
    "application/session-info": { source: "iana" },
    "application/set-payment": { source: "iana" },
    "application/set-payment-initiation": {
      source: "iana",
      extensions: ["setpay"],
    },
    "application/set-registration": { source: "iana" },
    "application/set-registration-initiation": {
      source: "iana",
      extensions: ["setreg"],
    },
    "application/sgml": { source: "iana" },
    "application/sgml-open-catalog": { source: "iana" },
    "application/shf+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["shf"],
    },
    "application/sieve": { source: "iana", extensions: ["siv", "sieve"] },
    "application/simple-filter+xml": { source: "iana", compressible: !0 },
    "application/simple-message-summary": { source: "iana" },
    "application/simplesymbolcontainer": { source: "iana" },
    "application/sipc": { source: "iana" },
    "application/slate": { source: "iana" },
    "application/smil": { source: "iana" },
    "application/smil+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["smi", "smil"],
    },
    "application/smpte336m": { source: "iana" },
    "application/soap+fastinfoset": { source: "iana" },
    "application/soap+xml": { source: "iana", compressible: !0 },
    "application/sparql-query": { source: "iana", extensions: ["rq"] },
    "application/sparql-results+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["srx"],
    },
    "application/spdx+json": { source: "iana", compressible: !0 },
    "application/spirits-event+xml": { source: "iana", compressible: !0 },
    "application/sql": { source: "iana" },
    "application/srgs": { source: "iana", extensions: ["gram"] },
    "application/srgs+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["grxml"],
    },
    "application/sru+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["sru"],
    },
    "application/ssdl+xml": {
      source: "apache",
      compressible: !0,
      extensions: ["ssdl"],
    },
    "application/ssml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["ssml"],
    },
    "application/stix+json": { source: "iana", compressible: !0 },
    "application/swid+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["swidtag"],
    },
    "application/tamp-apex-update": { source: "iana" },
    "application/tamp-apex-update-confirm": { source: "iana" },
    "application/tamp-community-update": { source: "iana" },
    "application/tamp-community-update-confirm": { source: "iana" },
    "application/tamp-error": { source: "iana" },
    "application/tamp-sequence-adjust": { source: "iana" },
    "application/tamp-sequence-adjust-confirm": { source: "iana" },
    "application/tamp-status-query": { source: "iana" },
    "application/tamp-status-response": { source: "iana" },
    "application/tamp-update": { source: "iana" },
    "application/tamp-update-confirm": { source: "iana" },
    "application/tar": { compressible: !0 },
    "application/taxii+json": { source: "iana", compressible: !0 },
    "application/td+json": { source: "iana", compressible: !0 },
    "application/tei+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["tei", "teicorpus"],
    },
    "application/tetra_isi": { source: "iana" },
    "application/thraud+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["tfi"],
    },
    "application/timestamp-query": { source: "iana" },
    "application/timestamp-reply": { source: "iana" },
    "application/timestamped-data": { source: "iana", extensions: ["tsd"] },
    "application/tlsrpt+gzip": { source: "iana" },
    "application/tlsrpt+json": { source: "iana", compressible: !0 },
    "application/tnauthlist": { source: "iana" },
    "application/token-introspection+jwt": { source: "iana" },
    "application/toml": { compressible: !0, extensions: ["toml"] },
    "application/trickle-ice-sdpfrag": { source: "iana" },
    "application/trig": { source: "iana", extensions: ["trig"] },
    "application/ttml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["ttml"],
    },
    "application/tve-trigger": { source: "iana" },
    "application/tzif": { source: "iana" },
    "application/tzif-leap": { source: "iana" },
    "application/ubjson": { compressible: !1, extensions: ["ubj"] },
    "application/ulpfec": { source: "iana" },
    "application/urc-grpsheet+xml": { source: "iana", compressible: !0 },
    "application/urc-ressheet+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["rsheet"],
    },
    "application/urc-targetdesc+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["td"],
    },
    "application/urc-uisocketdesc+xml": { source: "iana", compressible: !0 },
    "application/vcard+json": { source: "iana", compressible: !0 },
    "application/vcard+xml": { source: "iana", compressible: !0 },
    "application/vemmi": { source: "iana" },
    "application/vividence.scriptfile": { source: "apache" },
    "application/vnd.1000minds.decision-model+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["1km"],
    },
    "application/vnd.3gpp-prose+xml": { source: "iana", compressible: !0 },
    "application/vnd.3gpp-prose-pc3ch+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp-v2x-local-service-information": { source: "iana" },
    "application/vnd.3gpp.5gnas": { source: "iana" },
    "application/vnd.3gpp.access-transfer-events+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.bsf+xml": { source: "iana", compressible: !0 },
    "application/vnd.3gpp.gmop+xml": { source: "iana", compressible: !0 },
    "application/vnd.3gpp.gtpc": { source: "iana" },
    "application/vnd.3gpp.interworking-data": { source: "iana" },
    "application/vnd.3gpp.lpp": { source: "iana" },
    "application/vnd.3gpp.mc-signalling-ear": { source: "iana" },
    "application/vnd.3gpp.mcdata-affiliation-command+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcdata-info+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcdata-payload": { source: "iana" },
    "application/vnd.3gpp.mcdata-service-config+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcdata-signalling": { source: "iana" },
    "application/vnd.3gpp.mcdata-ue-config+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcdata-user-profile+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcptt-affiliation-command+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcptt-floor-request+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcptt-info+xml": { source: "iana", compressible: !0 },
    "application/vnd.3gpp.mcptt-location-info+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcptt-service-config+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcptt-signed+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcptt-ue-config+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcptt-ue-init-config+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcptt-user-profile+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcvideo-affiliation-command+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcvideo-affiliation-info+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcvideo-info+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcvideo-location-info+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcvideo-service-config+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcvideo-transmission-request+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcvideo-ue-config+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mcvideo-user-profile+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.mid-call+xml": { source: "iana", compressible: !0 },
    "application/vnd.3gpp.ngap": { source: "iana" },
    "application/vnd.3gpp.pfcp": { source: "iana" },
    "application/vnd.3gpp.pic-bw-large": {
      source: "iana",
      extensions: ["plb"],
    },
    "application/vnd.3gpp.pic-bw-small": {
      source: "iana",
      extensions: ["psb"],
    },
    "application/vnd.3gpp.pic-bw-var": { source: "iana", extensions: ["pvb"] },
    "application/vnd.3gpp.s1ap": { source: "iana" },
    "application/vnd.3gpp.sms": { source: "iana" },
    "application/vnd.3gpp.sms+xml": { source: "iana", compressible: !0 },
    "application/vnd.3gpp.srvcc-ext+xml": { source: "iana", compressible: !0 },
    "application/vnd.3gpp.srvcc-info+xml": { source: "iana", compressible: !0 },
    "application/vnd.3gpp.state-and-event-info+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.3gpp.ussd+xml": { source: "iana", compressible: !0 },
    "application/vnd.3gpp2.bcmcsinfo+xml": { source: "iana", compressible: !0 },
    "application/vnd.3gpp2.sms": { source: "iana" },
    "application/vnd.3gpp2.tcap": { source: "iana", extensions: ["tcap"] },
    "application/vnd.3lightssoftware.imagescal": { source: "iana" },
    "application/vnd.3m.post-it-notes": { source: "iana", extensions: ["pwn"] },
    "application/vnd.accpac.simply.aso": {
      source: "iana",
      extensions: ["aso"],
    },
    "application/vnd.accpac.simply.imp": {
      source: "iana",
      extensions: ["imp"],
    },
    "application/vnd.acucobol": { source: "iana", extensions: ["acu"] },
    "application/vnd.acucorp": { source: "iana", extensions: ["atc", "acutc"] },
    "application/vnd.adobe.air-application-installer-package+zip": {
      source: "apache",
      compressible: !1,
      extensions: ["air"],
    },
    "application/vnd.adobe.flash.movie": { source: "iana" },
    "application/vnd.adobe.formscentral.fcdt": {
      source: "iana",
      extensions: ["fcdt"],
    },
    "application/vnd.adobe.fxp": {
      source: "iana",
      extensions: ["fxp", "fxpl"],
    },
    "application/vnd.adobe.partial-upload": { source: "iana" },
    "application/vnd.adobe.xdp+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xdp"],
    },
    "application/vnd.adobe.xfdf": { source: "iana", extensions: ["xfdf"] },
    "application/vnd.aether.imp": { source: "iana" },
    "application/vnd.afpc.afplinedata": { source: "iana" },
    "application/vnd.afpc.afplinedata-pagedef": { source: "iana" },
    "application/vnd.afpc.cmoca-cmresource": { source: "iana" },
    "application/vnd.afpc.foca-charset": { source: "iana" },
    "application/vnd.afpc.foca-codedfont": { source: "iana" },
    "application/vnd.afpc.foca-codepage": { source: "iana" },
    "application/vnd.afpc.modca": { source: "iana" },
    "application/vnd.afpc.modca-cmtable": { source: "iana" },
    "application/vnd.afpc.modca-formdef": { source: "iana" },
    "application/vnd.afpc.modca-mediummap": { source: "iana" },
    "application/vnd.afpc.modca-objectcontainer": { source: "iana" },
    "application/vnd.afpc.modca-overlay": { source: "iana" },
    "application/vnd.afpc.modca-pagesegment": { source: "iana" },
    "application/vnd.age": { source: "iana", extensions: ["age"] },
    "application/vnd.ah-barcode": { source: "iana" },
    "application/vnd.ahead.space": { source: "iana", extensions: ["ahead"] },
    "application/vnd.airzip.filesecure.azf": {
      source: "iana",
      extensions: ["azf"],
    },
    "application/vnd.airzip.filesecure.azs": {
      source: "iana",
      extensions: ["azs"],
    },
    "application/vnd.amadeus+json": { source: "iana", compressible: !0 },
    "application/vnd.amazon.ebook": { source: "apache", extensions: ["azw"] },
    "application/vnd.amazon.mobi8-ebook": { source: "iana" },
    "application/vnd.americandynamics.acc": {
      source: "iana",
      extensions: ["acc"],
    },
    "application/vnd.amiga.ami": { source: "iana", extensions: ["ami"] },
    "application/vnd.amundsen.maze+xml": { source: "iana", compressible: !0 },
    "application/vnd.android.ota": { source: "iana" },
    "application/vnd.android.package-archive": {
      source: "apache",
      compressible: !1,
      extensions: ["apk"],
    },
    "application/vnd.anki": { source: "iana" },
    "application/vnd.anser-web-certificate-issue-initiation": {
      source: "iana",
      extensions: ["cii"],
    },
    "application/vnd.anser-web-funds-transfer-initiation": {
      source: "apache",
      extensions: ["fti"],
    },
    "application/vnd.antix.game-component": {
      source: "iana",
      extensions: ["atx"],
    },
    "application/vnd.apache.arrow.file": { source: "iana" },
    "application/vnd.apache.arrow.stream": { source: "iana" },
    "application/vnd.apache.thrift.binary": { source: "iana" },
    "application/vnd.apache.thrift.compact": { source: "iana" },
    "application/vnd.apache.thrift.json": { source: "iana" },
    "application/vnd.api+json": { source: "iana", compressible: !0 },
    "application/vnd.aplextor.warrp+json": { source: "iana", compressible: !0 },
    "application/vnd.apothekende.reservation+json": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.apple.installer+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["mpkg"],
    },
    "application/vnd.apple.keynote": { source: "iana", extensions: ["key"] },
    "application/vnd.apple.mpegurl": { source: "iana", extensions: ["m3u8"] },
    "application/vnd.apple.numbers": {
      source: "iana",
      extensions: ["numbers"],
    },
    "application/vnd.apple.pages": { source: "iana", extensions: ["pages"] },
    "application/vnd.apple.pkpass": {
      compressible: !1,
      extensions: ["pkpass"],
    },
    "application/vnd.arastra.swi": { source: "iana" },
    "application/vnd.aristanetworks.swi": {
      source: "iana",
      extensions: ["swi"],
    },
    "application/vnd.artisan+json": { source: "iana", compressible: !0 },
    "application/vnd.artsquare": { source: "iana" },
    "application/vnd.astraea-software.iota": {
      source: "iana",
      extensions: ["iota"],
    },
    "application/vnd.audiograph": { source: "iana", extensions: ["aep"] },
    "application/vnd.autopackage": { source: "iana" },
    "application/vnd.avalon+json": { source: "iana", compressible: !0 },
    "application/vnd.avistar+xml": { source: "iana", compressible: !0 },
    "application/vnd.balsamiq.bmml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["bmml"],
    },
    "application/vnd.balsamiq.bmpr": { source: "iana" },
    "application/vnd.banana-accounting": { source: "iana" },
    "application/vnd.bbf.usp.error": { source: "iana" },
    "application/vnd.bbf.usp.msg": { source: "iana" },
    "application/vnd.bbf.usp.msg+json": { source: "iana", compressible: !0 },
    "application/vnd.bekitzur-stech+json": { source: "iana", compressible: !0 },
    "application/vnd.bint.med-content": { source: "iana" },
    "application/vnd.biopax.rdf+xml": { source: "iana", compressible: !0 },
    "application/vnd.blink-idb-value-wrapper": { source: "iana" },
    "application/vnd.blueice.multipass": {
      source: "iana",
      extensions: ["mpm"],
    },
    "application/vnd.bluetooth.ep.oob": { source: "iana" },
    "application/vnd.bluetooth.le.oob": { source: "iana" },
    "application/vnd.bmi": { source: "iana", extensions: ["bmi"] },
    "application/vnd.bpf": { source: "iana" },
    "application/vnd.bpf3": { source: "iana" },
    "application/vnd.businessobjects": { source: "iana", extensions: ["rep"] },
    "application/vnd.byu.uapi+json": { source: "iana", compressible: !0 },
    "application/vnd.cab-jscript": { source: "iana" },
    "application/vnd.canon-cpdl": { source: "iana" },
    "application/vnd.canon-lips": { source: "iana" },
    "application/vnd.capasystems-pg+json": { source: "iana", compressible: !0 },
    "application/vnd.cendio.thinlinc.clientconf": { source: "iana" },
    "application/vnd.century-systems.tcp_stream": { source: "iana" },
    "application/vnd.chemdraw+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["cdxml"],
    },
    "application/vnd.chess-pgn": { source: "iana" },
    "application/vnd.chipnuts.karaoke-mmd": {
      source: "iana",
      extensions: ["mmd"],
    },
    "application/vnd.ciedi": { source: "iana" },
    "application/vnd.cinderella": { source: "iana", extensions: ["cdy"] },
    "application/vnd.cirpack.isdn-ext": { source: "iana" },
    "application/vnd.citationstyles.style+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["csl"],
    },
    "application/vnd.claymore": { source: "iana", extensions: ["cla"] },
    "application/vnd.cloanto.rp9": { source: "iana", extensions: ["rp9"] },
    "application/vnd.clonk.c4group": {
      source: "iana",
      extensions: ["c4g", "c4d", "c4f", "c4p", "c4u"],
    },
    "application/vnd.cluetrust.cartomobile-config": {
      source: "iana",
      extensions: ["c11amc"],
    },
    "application/vnd.cluetrust.cartomobile-config-pkg": {
      source: "iana",
      extensions: ["c11amz"],
    },
    "application/vnd.coffeescript": { source: "iana" },
    "application/vnd.collabio.xodocuments.document": { source: "iana" },
    "application/vnd.collabio.xodocuments.document-template": {
      source: "iana",
    },
    "application/vnd.collabio.xodocuments.presentation": { source: "iana" },
    "application/vnd.collabio.xodocuments.presentation-template": {
      source: "iana",
    },
    "application/vnd.collabio.xodocuments.spreadsheet": { source: "iana" },
    "application/vnd.collabio.xodocuments.spreadsheet-template": {
      source: "iana",
    },
    "application/vnd.collection+json": { source: "iana", compressible: !0 },
    "application/vnd.collection.doc+json": { source: "iana", compressible: !0 },
    "application/vnd.collection.next+json": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.comicbook+zip": { source: "iana", compressible: !1 },
    "application/vnd.comicbook-rar": { source: "iana" },
    "application/vnd.commerce-battelle": { source: "iana" },
    "application/vnd.commonspace": { source: "iana", extensions: ["csp"] },
    "application/vnd.contact.cmsg": { source: "iana", extensions: ["cdbcmsg"] },
    "application/vnd.coreos.ignition+json": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.cosmocaller": { source: "iana", extensions: ["cmc"] },
    "application/vnd.crick.clicker": { source: "iana", extensions: ["clkx"] },
    "application/vnd.crick.clicker.keyboard": {
      source: "iana",
      extensions: ["clkk"],
    },
    "application/vnd.crick.clicker.palette": {
      source: "iana",
      extensions: ["clkp"],
    },
    "application/vnd.crick.clicker.template": {
      source: "iana",
      extensions: ["clkt"],
    },
    "application/vnd.crick.clicker.wordbank": {
      source: "iana",
      extensions: ["clkw"],
    },
    "application/vnd.criticaltools.wbs+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["wbs"],
    },
    "application/vnd.cryptii.pipe+json": { source: "iana", compressible: !0 },
    "application/vnd.crypto-shade-file": { source: "iana" },
    "application/vnd.cryptomator.encrypted": { source: "iana" },
    "application/vnd.cryptomator.vault": { source: "iana" },
    "application/vnd.ctc-posml": { source: "iana", extensions: ["pml"] },
    "application/vnd.ctct.ws+xml": { source: "iana", compressible: !0 },
    "application/vnd.cups-pdf": { source: "iana" },
    "application/vnd.cups-postscript": { source: "iana" },
    "application/vnd.cups-ppd": { source: "iana", extensions: ["ppd"] },
    "application/vnd.cups-raster": { source: "iana" },
    "application/vnd.cups-raw": { source: "iana" },
    "application/vnd.curl": { source: "iana" },
    "application/vnd.curl.car": { source: "apache", extensions: ["car"] },
    "application/vnd.curl.pcurl": { source: "apache", extensions: ["pcurl"] },
    "application/vnd.cyan.dean.root+xml": { source: "iana", compressible: !0 },
    "application/vnd.cybank": { source: "iana" },
    "application/vnd.cyclonedx+json": { source: "iana", compressible: !0 },
    "application/vnd.cyclonedx+xml": { source: "iana", compressible: !0 },
    "application/vnd.d2l.coursepackage1p0+zip": {
      source: "iana",
      compressible: !1,
    },
    "application/vnd.d3m-dataset": { source: "iana" },
    "application/vnd.d3m-problem": { source: "iana" },
    "application/vnd.dart": {
      source: "iana",
      compressible: !0,
      extensions: ["dart"],
    },
    "application/vnd.data-vision.rdz": { source: "iana", extensions: ["rdz"] },
    "application/vnd.datapackage+json": { source: "iana", compressible: !0 },
    "application/vnd.dataresource+json": { source: "iana", compressible: !0 },
    "application/vnd.dbf": { source: "iana", extensions: ["dbf"] },
    "application/vnd.debian.binary-package": { source: "iana" },
    "application/vnd.dece.data": {
      source: "iana",
      extensions: ["uvf", "uvvf", "uvd", "uvvd"],
    },
    "application/vnd.dece.ttml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["uvt", "uvvt"],
    },
    "application/vnd.dece.unspecified": {
      source: "iana",
      extensions: ["uvx", "uvvx"],
    },
    "application/vnd.dece.zip": { source: "iana", extensions: ["uvz", "uvvz"] },
    "application/vnd.denovo.fcselayout-link": {
      source: "iana",
      extensions: ["fe_launch"],
    },
    "application/vnd.desmume.movie": { source: "iana" },
    "application/vnd.dir-bi.plate-dl-nosuffix": { source: "iana" },
    "application/vnd.dm.delegation+xml": { source: "iana", compressible: !0 },
    "application/vnd.dna": { source: "iana", extensions: ["dna"] },
    "application/vnd.document+json": { source: "iana", compressible: !0 },
    "application/vnd.dolby.mlp": { source: "apache", extensions: ["mlp"] },
    "application/vnd.dolby.mobile.1": { source: "iana" },
    "application/vnd.dolby.mobile.2": { source: "iana" },
    "application/vnd.doremir.scorecloud-binary-document": { source: "iana" },
    "application/vnd.dpgraph": { source: "iana", extensions: ["dpg"] },
    "application/vnd.dreamfactory": { source: "iana", extensions: ["dfac"] },
    "application/vnd.drive+json": { source: "iana", compressible: !0 },
    "application/vnd.ds-keypoint": { source: "apache", extensions: ["kpxx"] },
    "application/vnd.dtg.local": { source: "iana" },
    "application/vnd.dtg.local.flash": { source: "iana" },
    "application/vnd.dtg.local.html": { source: "iana" },
    "application/vnd.dvb.ait": { source: "iana", extensions: ["ait"] },
    "application/vnd.dvb.dvbisl+xml": { source: "iana", compressible: !0 },
    "application/vnd.dvb.dvbj": { source: "iana" },
    "application/vnd.dvb.esgcontainer": { source: "iana" },
    "application/vnd.dvb.ipdcdftnotifaccess": { source: "iana" },
    "application/vnd.dvb.ipdcesgaccess": { source: "iana" },
    "application/vnd.dvb.ipdcesgaccess2": { source: "iana" },
    "application/vnd.dvb.ipdcesgpdd": { source: "iana" },
    "application/vnd.dvb.ipdcroaming": { source: "iana" },
    "application/vnd.dvb.iptv.alfec-base": { source: "iana" },
    "application/vnd.dvb.iptv.alfec-enhancement": { source: "iana" },
    "application/vnd.dvb.notif-aggregate-root+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.dvb.notif-container+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.dvb.notif-generic+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.dvb.notif-ia-msglist+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.dvb.notif-ia-registration-request+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.dvb.notif-ia-registration-response+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.dvb.notif-init+xml": { source: "iana", compressible: !0 },
    "application/vnd.dvb.pfr": { source: "iana" },
    "application/vnd.dvb.service": { source: "iana", extensions: ["svc"] },
    "application/vnd.dxr": { source: "iana" },
    "application/vnd.dynageo": { source: "iana", extensions: ["geo"] },
    "application/vnd.dzr": { source: "iana" },
    "application/vnd.easykaraoke.cdgdownload": { source: "iana" },
    "application/vnd.ecdis-update": { source: "iana" },
    "application/vnd.ecip.rlp": { source: "iana" },
    "application/vnd.eclipse.ditto+json": { source: "iana", compressible: !0 },
    "application/vnd.ecowin.chart": { source: "iana", extensions: ["mag"] },
    "application/vnd.ecowin.filerequest": { source: "iana" },
    "application/vnd.ecowin.fileupdate": { source: "iana" },
    "application/vnd.ecowin.series": { source: "iana" },
    "application/vnd.ecowin.seriesrequest": { source: "iana" },
    "application/vnd.ecowin.seriesupdate": { source: "iana" },
    "application/vnd.efi.img": { source: "iana" },
    "application/vnd.efi.iso": { source: "iana" },
    "application/vnd.emclient.accessrequest+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.enliven": { source: "iana", extensions: ["nml"] },
    "application/vnd.enphase.envoy": { source: "iana" },
    "application/vnd.eprints.data+xml": { source: "iana", compressible: !0 },
    "application/vnd.epson.esf": { source: "iana", extensions: ["esf"] },
    "application/vnd.epson.msf": { source: "iana", extensions: ["msf"] },
    "application/vnd.epson.quickanime": { source: "iana", extensions: ["qam"] },
    "application/vnd.epson.salt": { source: "iana", extensions: ["slt"] },
    "application/vnd.epson.ssf": { source: "iana", extensions: ["ssf"] },
    "application/vnd.ericsson.quickcall": { source: "iana" },
    "application/vnd.espass-espass+zip": { source: "iana", compressible: !1 },
    "application/vnd.eszigno3+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["es3", "et3"],
    },
    "application/vnd.etsi.aoc+xml": { source: "iana", compressible: !0 },
    "application/vnd.etsi.asic-e+zip": { source: "iana", compressible: !1 },
    "application/vnd.etsi.asic-s+zip": { source: "iana", compressible: !1 },
    "application/vnd.etsi.cug+xml": { source: "iana", compressible: !0 },
    "application/vnd.etsi.iptvcommand+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.etsi.iptvdiscovery+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.etsi.iptvprofile+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.etsi.iptvsad-bc+xml": { source: "iana", compressible: !0 },
    "application/vnd.etsi.iptvsad-cod+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.etsi.iptvsad-npvr+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.etsi.iptvservice+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.etsi.iptvsync+xml": { source: "iana", compressible: !0 },
    "application/vnd.etsi.iptvueprofile+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.etsi.mcid+xml": { source: "iana", compressible: !0 },
    "application/vnd.etsi.mheg5": { source: "iana" },
    "application/vnd.etsi.overload-control-policy-dataset+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.etsi.pstn+xml": { source: "iana", compressible: !0 },
    "application/vnd.etsi.sci+xml": { source: "iana", compressible: !0 },
    "application/vnd.etsi.simservs+xml": { source: "iana", compressible: !0 },
    "application/vnd.etsi.timestamp-token": { source: "iana" },
    "application/vnd.etsi.tsl+xml": { source: "iana", compressible: !0 },
    "application/vnd.etsi.tsl.der": { source: "iana" },
    "application/vnd.eu.kasparian.car+json": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.eudora.data": { source: "iana" },
    "application/vnd.evolv.ecig.profile": { source: "iana" },
    "application/vnd.evolv.ecig.settings": { source: "iana" },
    "application/vnd.evolv.ecig.theme": { source: "iana" },
    "application/vnd.exstream-empower+zip": {
      source: "iana",
      compressible: !1,
    },
    "application/vnd.exstream-package": { source: "iana" },
    "application/vnd.ezpix-album": { source: "iana", extensions: ["ez2"] },
    "application/vnd.ezpix-package": { source: "iana", extensions: ["ez3"] },
    "application/vnd.f-secure.mobile": { source: "iana" },
    "application/vnd.familysearch.gedcom+zip": {
      source: "iana",
      compressible: !1,
    },
    "application/vnd.fastcopy-disk-image": { source: "iana" },
    "application/vnd.fdf": { source: "iana", extensions: ["fdf"] },
    "application/vnd.fdsn.mseed": { source: "iana", extensions: ["mseed"] },
    "application/vnd.fdsn.seed": {
      source: "iana",
      extensions: ["seed", "dataless"],
    },
    "application/vnd.ffsns": { source: "iana" },
    "application/vnd.ficlab.flb+zip": { source: "iana", compressible: !1 },
    "application/vnd.filmit.zfc": { source: "iana" },
    "application/vnd.fints": { source: "iana" },
    "application/vnd.firemonkeys.cloudcell": { source: "iana" },
    "application/vnd.flographit": { source: "iana", extensions: ["gph"] },
    "application/vnd.fluxtime.clip": { source: "iana", extensions: ["ftc"] },
    "application/vnd.font-fontforge-sfd": { source: "iana" },
    "application/vnd.framemaker": {
      source: "iana",
      extensions: ["fm", "frame", "maker", "book"],
    },
    "application/vnd.frogans.fnc": { source: "iana", extensions: ["fnc"] },
    "application/vnd.frogans.ltf": { source: "iana", extensions: ["ltf"] },
    "application/vnd.fsc.weblaunch": { source: "iana", extensions: ["fsc"] },
    "application/vnd.fujifilm.fb.docuworks": { source: "iana" },
    "application/vnd.fujifilm.fb.docuworks.binder": { source: "iana" },
    "application/vnd.fujifilm.fb.docuworks.container": { source: "iana" },
    "application/vnd.fujifilm.fb.jfi+xml": { source: "iana", compressible: !0 },
    "application/vnd.fujitsu.oasys": { source: "iana", extensions: ["oas"] },
    "application/vnd.fujitsu.oasys2": { source: "iana", extensions: ["oa2"] },
    "application/vnd.fujitsu.oasys3": { source: "iana", extensions: ["oa3"] },
    "application/vnd.fujitsu.oasysgp": { source: "iana", extensions: ["fg5"] },
    "application/vnd.fujitsu.oasysprs": { source: "iana", extensions: ["bh2"] },
    "application/vnd.fujixerox.art-ex": { source: "iana" },
    "application/vnd.fujixerox.art4": { source: "iana" },
    "application/vnd.fujixerox.ddd": { source: "iana", extensions: ["ddd"] },
    "application/vnd.fujixerox.docuworks": {
      source: "iana",
      extensions: ["xdw"],
    },
    "application/vnd.fujixerox.docuworks.binder": {
      source: "iana",
      extensions: ["xbd"],
    },
    "application/vnd.fujixerox.docuworks.container": { source: "iana" },
    "application/vnd.fujixerox.hbpl": { source: "iana" },
    "application/vnd.fut-misnet": { source: "iana" },
    "application/vnd.futoin+cbor": { source: "iana" },
    "application/vnd.futoin+json": { source: "iana", compressible: !0 },
    "application/vnd.fuzzysheet": { source: "iana", extensions: ["fzs"] },
    "application/vnd.genomatix.tuxedo": { source: "iana", extensions: ["txd"] },
    "application/vnd.gentics.grd+json": { source: "iana", compressible: !0 },
    "application/vnd.geo+json": { source: "iana", compressible: !0 },
    "application/vnd.geocube+xml": { source: "iana", compressible: !0 },
    "application/vnd.geogebra.file": { source: "iana", extensions: ["ggb"] },
    "application/vnd.geogebra.slides": { source: "iana" },
    "application/vnd.geogebra.tool": { source: "iana", extensions: ["ggt"] },
    "application/vnd.geometry-explorer": {
      source: "iana",
      extensions: ["gex", "gre"],
    },
    "application/vnd.geonext": { source: "iana", extensions: ["gxt"] },
    "application/vnd.geoplan": { source: "iana", extensions: ["g2w"] },
    "application/vnd.geospace": { source: "iana", extensions: ["g3w"] },
    "application/vnd.gerber": { source: "iana" },
    "application/vnd.globalplatform.card-content-mgt": { source: "iana" },
    "application/vnd.globalplatform.card-content-mgt-response": {
      source: "iana",
    },
    "application/vnd.gmx": { source: "iana", extensions: ["gmx"] },
    "application/vnd.google-apps.document": {
      compressible: !1,
      extensions: ["gdoc"],
    },
    "application/vnd.google-apps.presentation": {
      compressible: !1,
      extensions: ["gslides"],
    },
    "application/vnd.google-apps.spreadsheet": {
      compressible: !1,
      extensions: ["gsheet"],
    },
    "application/vnd.google-earth.kml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["kml"],
    },
    "application/vnd.google-earth.kmz": {
      source: "iana",
      compressible: !1,
      extensions: ["kmz"],
    },
    "application/vnd.gov.sk.e-form+xml": { source: "iana", compressible: !0 },
    "application/vnd.gov.sk.e-form+zip": { source: "iana", compressible: !1 },
    "application/vnd.gov.sk.xmldatacontainer+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.grafeq": { source: "iana", extensions: ["gqf", "gqs"] },
    "application/vnd.gridmp": { source: "iana" },
    "application/vnd.groove-account": { source: "iana", extensions: ["gac"] },
    "application/vnd.groove-help": { source: "iana", extensions: ["ghf"] },
    "application/vnd.groove-identity-message": {
      source: "iana",
      extensions: ["gim"],
    },
    "application/vnd.groove-injector": { source: "iana", extensions: ["grv"] },
    "application/vnd.groove-tool-message": {
      source: "iana",
      extensions: ["gtm"],
    },
    "application/vnd.groove-tool-template": {
      source: "iana",
      extensions: ["tpl"],
    },
    "application/vnd.groove-vcard": { source: "iana", extensions: ["vcg"] },
    "application/vnd.hal+json": { source: "iana", compressible: !0 },
    "application/vnd.hal+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["hal"],
    },
    "application/vnd.handheld-entertainment+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["zmm"],
    },
    "application/vnd.hbci": { source: "iana", extensions: ["hbci"] },
    "application/vnd.hc+json": { source: "iana", compressible: !0 },
    "application/vnd.hcl-bireports": { source: "iana" },
    "application/vnd.hdt": { source: "iana" },
    "application/vnd.heroku+json": { source: "iana", compressible: !0 },
    "application/vnd.hhe.lesson-player": {
      source: "iana",
      extensions: ["les"],
    },
    "application/vnd.hl7cda+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/vnd.hl7v2+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/vnd.hp-hpgl": { source: "iana", extensions: ["hpgl"] },
    "application/vnd.hp-hpid": { source: "iana", extensions: ["hpid"] },
    "application/vnd.hp-hps": { source: "iana", extensions: ["hps"] },
    "application/vnd.hp-jlyt": { source: "iana", extensions: ["jlt"] },
    "application/vnd.hp-pcl": { source: "iana", extensions: ["pcl"] },
    "application/vnd.hp-pclxl": { source: "iana", extensions: ["pclxl"] },
    "application/vnd.httphone": { source: "iana" },
    "application/vnd.hydrostatix.sof-data": {
      source: "iana",
      extensions: ["sfd-hdstx"],
    },
    "application/vnd.hyper+json": { source: "iana", compressible: !0 },
    "application/vnd.hyper-item+json": { source: "iana", compressible: !0 },
    "application/vnd.hyperdrive+json": { source: "iana", compressible: !0 },
    "application/vnd.hzn-3d-crossword": { source: "iana" },
    "application/vnd.ibm.afplinedata": { source: "iana" },
    "application/vnd.ibm.electronic-media": { source: "iana" },
    "application/vnd.ibm.minipay": { source: "iana", extensions: ["mpy"] },
    "application/vnd.ibm.modcap": {
      source: "iana",
      extensions: ["afp", "listafp", "list3820"],
    },
    "application/vnd.ibm.rights-management": {
      source: "iana",
      extensions: ["irm"],
    },
    "application/vnd.ibm.secure-container": {
      source: "iana",
      extensions: ["sc"],
    },
    "application/vnd.iccprofile": {
      source: "iana",
      extensions: ["icc", "icm"],
    },
    "application/vnd.ieee.1905": { source: "iana" },
    "application/vnd.igloader": { source: "iana", extensions: ["igl"] },
    "application/vnd.imagemeter.folder+zip": {
      source: "iana",
      compressible: !1,
    },
    "application/vnd.imagemeter.image+zip": {
      source: "iana",
      compressible: !1,
    },
    "application/vnd.immervision-ivp": { source: "iana", extensions: ["ivp"] },
    "application/vnd.immervision-ivu": { source: "iana", extensions: ["ivu"] },
    "application/vnd.ims.imsccv1p1": { source: "iana" },
    "application/vnd.ims.imsccv1p2": { source: "iana" },
    "application/vnd.ims.imsccv1p3": { source: "iana" },
    "application/vnd.ims.lis.v2.result+json": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.ims.lti.v2.toolconsumerprofile+json": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.ims.lti.v2.toolproxy+json": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.ims.lti.v2.toolproxy.id+json": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.ims.lti.v2.toolsettings+json": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.ims.lti.v2.toolsettings.simple+json": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.informedcontrol.rms+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.informix-visionary": { source: "iana" },
    "application/vnd.infotech.project": { source: "iana" },
    "application/vnd.infotech.project+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.innopath.wamp.notification": { source: "iana" },
    "application/vnd.insors.igm": { source: "iana", extensions: ["igm"] },
    "application/vnd.intercon.formnet": {
      source: "iana",
      extensions: ["xpw", "xpx"],
    },
    "application/vnd.intergeo": { source: "iana", extensions: ["i2g"] },
    "application/vnd.intertrust.digibox": { source: "iana" },
    "application/vnd.intertrust.nncp": { source: "iana" },
    "application/vnd.intu.qbo": { source: "iana", extensions: ["qbo"] },
    "application/vnd.intu.qfx": { source: "iana", extensions: ["qfx"] },
    "application/vnd.iptc.g2.catalogitem+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.iptc.g2.conceptitem+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.iptc.g2.knowledgeitem+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.iptc.g2.newsitem+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.iptc.g2.newsmessage+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.iptc.g2.packageitem+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.iptc.g2.planningitem+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.ipunplugged.rcprofile": {
      source: "iana",
      extensions: ["rcprofile"],
    },
    "application/vnd.irepository.package+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["irp"],
    },
    "application/vnd.is-xpr": { source: "iana", extensions: ["xpr"] },
    "application/vnd.isac.fcs": { source: "iana", extensions: ["fcs"] },
    "application/vnd.iso11783-10+zip": { source: "iana", compressible: !1 },
    "application/vnd.jam": { source: "iana", extensions: ["jam"] },
    "application/vnd.japannet-directory-service": { source: "iana" },
    "application/vnd.japannet-jpnstore-wakeup": { source: "iana" },
    "application/vnd.japannet-payment-wakeup": { source: "iana" },
    "application/vnd.japannet-registration": { source: "iana" },
    "application/vnd.japannet-registration-wakeup": { source: "iana" },
    "application/vnd.japannet-setstore-wakeup": { source: "iana" },
    "application/vnd.japannet-verification": { source: "iana" },
    "application/vnd.japannet-verification-wakeup": { source: "iana" },
    "application/vnd.jcp.javame.midlet-rms": {
      source: "iana",
      extensions: ["rms"],
    },
    "application/vnd.jisp": { source: "iana", extensions: ["jisp"] },
    "application/vnd.joost.joda-archive": {
      source: "iana",
      extensions: ["joda"],
    },
    "application/vnd.jsk.isdn-ngn": { source: "iana" },
    "application/vnd.kahootz": { source: "iana", extensions: ["ktz", "ktr"] },
    "application/vnd.kde.karbon": { source: "iana", extensions: ["karbon"] },
    "application/vnd.kde.kchart": { source: "iana", extensions: ["chrt"] },
    "application/vnd.kde.kformula": { source: "iana", extensions: ["kfo"] },
    "application/vnd.kde.kivio": { source: "iana", extensions: ["flw"] },
    "application/vnd.kde.kontour": { source: "iana", extensions: ["kon"] },
    "application/vnd.kde.kpresenter": {
      source: "iana",
      extensions: ["kpr", "kpt"],
    },
    "application/vnd.kde.kspread": { source: "iana", extensions: ["ksp"] },
    "application/vnd.kde.kword": { source: "iana", extensions: ["kwd", "kwt"] },
    "application/vnd.kenameaapp": { source: "iana", extensions: ["htke"] },
    "application/vnd.kidspiration": { source: "iana", extensions: ["kia"] },
    "application/vnd.kinar": { source: "iana", extensions: ["kne", "knp"] },
    "application/vnd.koan": {
      source: "iana",
      extensions: ["skp", "skd", "skt", "skm"],
    },
    "application/vnd.kodak-descriptor": { source: "iana", extensions: ["sse"] },
    "application/vnd.las": { source: "iana" },
    "application/vnd.las.las+json": { source: "iana", compressible: !0 },
    "application/vnd.las.las+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["lasxml"],
    },
    "application/vnd.laszip": { source: "iana" },
    "application/vnd.leap+json": { source: "iana", compressible: !0 },
    "application/vnd.liberty-request+xml": { source: "iana", compressible: !0 },
    "application/vnd.llamagraphics.life-balance.desktop": {
      source: "iana",
      extensions: ["lbd"],
    },
    "application/vnd.llamagraphics.life-balance.exchange+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["lbe"],
    },
    "application/vnd.logipipe.circuit+zip": {
      source: "iana",
      compressible: !1,
    },
    "application/vnd.loom": { source: "iana" },
    "application/vnd.lotus-1-2-3": { source: "iana", extensions: ["123"] },
    "application/vnd.lotus-approach": { source: "iana", extensions: ["apr"] },
    "application/vnd.lotus-freelance": { source: "iana", extensions: ["pre"] },
    "application/vnd.lotus-notes": { source: "iana", extensions: ["nsf"] },
    "application/vnd.lotus-organizer": { source: "iana", extensions: ["org"] },
    "application/vnd.lotus-screencam": { source: "iana", extensions: ["scm"] },
    "application/vnd.lotus-wordpro": { source: "iana", extensions: ["lwp"] },
    "application/vnd.macports.portpkg": {
      source: "iana",
      extensions: ["portpkg"],
    },
    "application/vnd.mapbox-vector-tile": {
      source: "iana",
      extensions: ["mvt"],
    },
    "application/vnd.marlin.drm.actiontoken+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.marlin.drm.conftoken+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.marlin.drm.license+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.marlin.drm.mdcf": { source: "iana" },
    "application/vnd.mason+json": { source: "iana", compressible: !0 },
    "application/vnd.maxar.archive.3tz+zip": {
      source: "iana",
      compressible: !1,
    },
    "application/vnd.maxmind.maxmind-db": { source: "iana" },
    "application/vnd.mcd": { source: "iana", extensions: ["mcd"] },
    "application/vnd.medcalcdata": { source: "iana", extensions: ["mc1"] },
    "application/vnd.mediastation.cdkey": {
      source: "iana",
      extensions: ["cdkey"],
    },
    "application/vnd.meridian-slingshot": { source: "iana" },
    "application/vnd.mfer": { source: "iana", extensions: ["mwf"] },
    "application/vnd.mfmp": { source: "iana", extensions: ["mfm"] },
    "application/vnd.micro+json": { source: "iana", compressible: !0 },
    "application/vnd.micrografx.flo": { source: "iana", extensions: ["flo"] },
    "application/vnd.micrografx.igx": { source: "iana", extensions: ["igx"] },
    "application/vnd.microsoft.portable-executable": { source: "iana" },
    "application/vnd.microsoft.windows.thumbnail-cache": { source: "iana" },
    "application/vnd.miele+json": { source: "iana", compressible: !0 },
    "application/vnd.mif": { source: "iana", extensions: ["mif"] },
    "application/vnd.minisoft-hp3000-save": { source: "iana" },
    "application/vnd.mitsubishi.misty-guard.trustweb": { source: "iana" },
    "application/vnd.mobius.daf": { source: "iana", extensions: ["daf"] },
    "application/vnd.mobius.dis": { source: "iana", extensions: ["dis"] },
    "application/vnd.mobius.mbk": { source: "iana", extensions: ["mbk"] },
    "application/vnd.mobius.mqy": { source: "iana", extensions: ["mqy"] },
    "application/vnd.mobius.msl": { source: "iana", extensions: ["msl"] },
    "application/vnd.mobius.plc": { source: "iana", extensions: ["plc"] },
    "application/vnd.mobius.txf": { source: "iana", extensions: ["txf"] },
    "application/vnd.mophun.application": {
      source: "iana",
      extensions: ["mpn"],
    },
    "application/vnd.mophun.certificate": {
      source: "iana",
      extensions: ["mpc"],
    },
    "application/vnd.motorola.flexsuite": { source: "iana" },
    "application/vnd.motorola.flexsuite.adsi": { source: "iana" },
    "application/vnd.motorola.flexsuite.fis": { source: "iana" },
    "application/vnd.motorola.flexsuite.gotap": { source: "iana" },
    "application/vnd.motorola.flexsuite.kmr": { source: "iana" },
    "application/vnd.motorola.flexsuite.ttc": { source: "iana" },
    "application/vnd.motorola.flexsuite.wem": { source: "iana" },
    "application/vnd.motorola.iprm": { source: "iana" },
    "application/vnd.mozilla.xul+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xul"],
    },
    "application/vnd.ms-3mfdocument": { source: "iana" },
    "application/vnd.ms-artgalry": { source: "iana", extensions: ["cil"] },
    "application/vnd.ms-asf": { source: "iana" },
    "application/vnd.ms-cab-compressed": {
      source: "iana",
      extensions: ["cab"],
    },
    "application/vnd.ms-color.iccprofile": { source: "apache" },
    "application/vnd.ms-excel": {
      source: "iana",
      compressible: !1,
      extensions: ["xls", "xlm", "xla", "xlc", "xlt", "xlw"],
    },
    "application/vnd.ms-excel.addin.macroenabled.12": {
      source: "iana",
      extensions: ["xlam"],
    },
    "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
      source: "iana",
      extensions: ["xlsb"],
    },
    "application/vnd.ms-excel.sheet.macroenabled.12": {
      source: "iana",
      extensions: ["xlsm"],
    },
    "application/vnd.ms-excel.template.macroenabled.12": {
      source: "iana",
      extensions: ["xltm"],
    },
    "application/vnd.ms-fontobject": {
      source: "iana",
      compressible: !0,
      extensions: ["eot"],
    },
    "application/vnd.ms-htmlhelp": { source: "iana", extensions: ["chm"] },
    "application/vnd.ms-ims": { source: "iana", extensions: ["ims"] },
    "application/vnd.ms-lrm": { source: "iana", extensions: ["lrm"] },
    "application/vnd.ms-office.activex+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.ms-officetheme": { source: "iana", extensions: ["thmx"] },
    "application/vnd.ms-opentype": { source: "apache", compressible: !0 },
    "application/vnd.ms-outlook": { compressible: !1, extensions: ["msg"] },
    "application/vnd.ms-package.obfuscated-opentype": { source: "apache" },
    "application/vnd.ms-pki.seccat": { source: "apache", extensions: ["cat"] },
    "application/vnd.ms-pki.stl": { source: "apache", extensions: ["stl"] },
    "application/vnd.ms-playready.initiator+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.ms-powerpoint": {
      source: "iana",
      compressible: !1,
      extensions: ["ppt", "pps", "pot"],
    },
    "application/vnd.ms-powerpoint.addin.macroenabled.12": {
      source: "iana",
      extensions: ["ppam"],
    },
    "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
      source: "iana",
      extensions: ["pptm"],
    },
    "application/vnd.ms-powerpoint.slide.macroenabled.12": {
      source: "iana",
      extensions: ["sldm"],
    },
    "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
      source: "iana",
      extensions: ["ppsm"],
    },
    "application/vnd.ms-powerpoint.template.macroenabled.12": {
      source: "iana",
      extensions: ["potm"],
    },
    "application/vnd.ms-printdevicecapabilities+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.ms-printing.printticket+xml": {
      source: "apache",
      compressible: !0,
    },
    "application/vnd.ms-printschematicket+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.ms-project": {
      source: "iana",
      extensions: ["mpp", "mpt"],
    },
    "application/vnd.ms-tnef": { source: "iana" },
    "application/vnd.ms-windows.devicepairing": { source: "iana" },
    "application/vnd.ms-windows.nwprinting.oob": { source: "iana" },
    "application/vnd.ms-windows.printerpairing": { source: "iana" },
    "application/vnd.ms-windows.wsd.oob": { source: "iana" },
    "application/vnd.ms-wmdrm.lic-chlg-req": { source: "iana" },
    "application/vnd.ms-wmdrm.lic-resp": { source: "iana" },
    "application/vnd.ms-wmdrm.meter-chlg-req": { source: "iana" },
    "application/vnd.ms-wmdrm.meter-resp": { source: "iana" },
    "application/vnd.ms-word.document.macroenabled.12": {
      source: "iana",
      extensions: ["docm"],
    },
    "application/vnd.ms-word.template.macroenabled.12": {
      source: "iana",
      extensions: ["dotm"],
    },
    "application/vnd.ms-works": {
      source: "iana",
      extensions: ["wps", "wks", "wcm", "wdb"],
    },
    "application/vnd.ms-wpl": { source: "iana", extensions: ["wpl"] },
    "application/vnd.ms-xpsdocument": {
      source: "iana",
      compressible: !1,
      extensions: ["xps"],
    },
    "application/vnd.msa-disk-image": { source: "iana" },
    "application/vnd.mseq": { source: "iana", extensions: ["mseq"] },
    "application/vnd.msign": { source: "iana" },
    "application/vnd.multiad.creator": { source: "iana" },
    "application/vnd.multiad.creator.cif": { source: "iana" },
    "application/vnd.music-niff": { source: "iana" },
    "application/vnd.musician": { source: "iana", extensions: ["mus"] },
    "application/vnd.muvee.style": { source: "iana", extensions: ["msty"] },
    "application/vnd.mynfc": { source: "iana", extensions: ["taglet"] },
    "application/vnd.nacamar.ybrid+json": { source: "iana", compressible: !0 },
    "application/vnd.ncd.control": { source: "iana" },
    "application/vnd.ncd.reference": { source: "iana" },
    "application/vnd.nearst.inv+json": { source: "iana", compressible: !0 },
    "application/vnd.nebumind.line": { source: "iana" },
    "application/vnd.nervana": { source: "iana" },
    "application/vnd.netfpx": { source: "iana" },
    "application/vnd.neurolanguage.nlu": {
      source: "iana",
      extensions: ["nlu"],
    },
    "application/vnd.nimn": { source: "iana" },
    "application/vnd.nintendo.nitro.rom": { source: "iana" },
    "application/vnd.nintendo.snes.rom": { source: "iana" },
    "application/vnd.nitf": { source: "iana", extensions: ["ntf", "nitf"] },
    "application/vnd.noblenet-directory": {
      source: "iana",
      extensions: ["nnd"],
    },
    "application/vnd.noblenet-sealer": { source: "iana", extensions: ["nns"] },
    "application/vnd.noblenet-web": { source: "iana", extensions: ["nnw"] },
    "application/vnd.nokia.catalogs": { source: "iana" },
    "application/vnd.nokia.conml+wbxml": { source: "iana" },
    "application/vnd.nokia.conml+xml": { source: "iana", compressible: !0 },
    "application/vnd.nokia.iptv.config+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.nokia.isds-radio-presets": { source: "iana" },
    "application/vnd.nokia.landmark+wbxml": { source: "iana" },
    "application/vnd.nokia.landmark+xml": { source: "iana", compressible: !0 },
    "application/vnd.nokia.landmarkcollection+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.nokia.n-gage.ac+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["ac"],
    },
    "application/vnd.nokia.n-gage.data": {
      source: "iana",
      extensions: ["ngdat"],
    },
    "application/vnd.nokia.n-gage.symbian.install": {
      source: "iana",
      extensions: ["n-gage"],
    },
    "application/vnd.nokia.ncd": { source: "iana" },
    "application/vnd.nokia.pcd+wbxml": { source: "iana" },
    "application/vnd.nokia.pcd+xml": { source: "iana", compressible: !0 },
    "application/vnd.nokia.radio-preset": {
      source: "iana",
      extensions: ["rpst"],
    },
    "application/vnd.nokia.radio-presets": {
      source: "iana",
      extensions: ["rpss"],
    },
    "application/vnd.novadigm.edm": { source: "iana", extensions: ["edm"] },
    "application/vnd.novadigm.edx": { source: "iana", extensions: ["edx"] },
    "application/vnd.novadigm.ext": { source: "iana", extensions: ["ext"] },
    "application/vnd.ntt-local.content-share": { source: "iana" },
    "application/vnd.ntt-local.file-transfer": { source: "iana" },
    "application/vnd.ntt-local.ogw_remote-access": { source: "iana" },
    "application/vnd.ntt-local.sip-ta_remote": { source: "iana" },
    "application/vnd.ntt-local.sip-ta_tcp_stream": { source: "iana" },
    "application/vnd.oasis.opendocument.chart": {
      source: "iana",
      extensions: ["odc"],
    },
    "application/vnd.oasis.opendocument.chart-template": {
      source: "iana",
      extensions: ["otc"],
    },
    "application/vnd.oasis.opendocument.database": {
      source: "iana",
      extensions: ["odb"],
    },
    "application/vnd.oasis.opendocument.formula": {
      source: "iana",
      extensions: ["odf"],
    },
    "application/vnd.oasis.opendocument.formula-template": {
      source: "iana",
      extensions: ["odft"],
    },
    "application/vnd.oasis.opendocument.graphics": {
      source: "iana",
      compressible: !1,
      extensions: ["odg"],
    },
    "application/vnd.oasis.opendocument.graphics-template": {
      source: "iana",
      extensions: ["otg"],
    },
    "application/vnd.oasis.opendocument.image": {
      source: "iana",
      extensions: ["odi"],
    },
    "application/vnd.oasis.opendocument.image-template": {
      source: "iana",
      extensions: ["oti"],
    },
    "application/vnd.oasis.opendocument.presentation": {
      source: "iana",
      compressible: !1,
      extensions: ["odp"],
    },
    "application/vnd.oasis.opendocument.presentation-template": {
      source: "iana",
      extensions: ["otp"],
    },
    "application/vnd.oasis.opendocument.spreadsheet": {
      source: "iana",
      compressible: !1,
      extensions: ["ods"],
    },
    "application/vnd.oasis.opendocument.spreadsheet-template": {
      source: "iana",
      extensions: ["ots"],
    },
    "application/vnd.oasis.opendocument.text": {
      source: "iana",
      compressible: !1,
      extensions: ["odt"],
    },
    "application/vnd.oasis.opendocument.text-master": {
      source: "iana",
      extensions: ["odm"],
    },
    "application/vnd.oasis.opendocument.text-template": {
      source: "iana",
      extensions: ["ott"],
    },
    "application/vnd.oasis.opendocument.text-web": {
      source: "iana",
      extensions: ["oth"],
    },
    "application/vnd.obn": { source: "iana" },
    "application/vnd.ocf+cbor": { source: "iana" },
    "application/vnd.oci.image.manifest.v1+json": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oftn.l10n+json": { source: "iana", compressible: !0 },
    "application/vnd.oipf.contentaccessdownload+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oipf.contentaccessstreaming+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oipf.cspg-hexbinary": { source: "iana" },
    "application/vnd.oipf.dae.svg+xml": { source: "iana", compressible: !0 },
    "application/vnd.oipf.dae.xhtml+xml": { source: "iana", compressible: !0 },
    "application/vnd.oipf.mippvcontrolmessage+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oipf.pae.gem": { source: "iana" },
    "application/vnd.oipf.spdiscovery+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oipf.spdlist+xml": { source: "iana", compressible: !0 },
    "application/vnd.oipf.ueprofile+xml": { source: "iana", compressible: !0 },
    "application/vnd.oipf.userprofile+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.olpc-sugar": { source: "iana", extensions: ["xo"] },
    "application/vnd.oma-scws-config": { source: "iana" },
    "application/vnd.oma-scws-http-request": { source: "iana" },
    "application/vnd.oma-scws-http-response": { source: "iana" },
    "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oma.bcast.drm-trigger+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oma.bcast.imd+xml": { source: "iana", compressible: !0 },
    "application/vnd.oma.bcast.ltkm": { source: "iana" },
    "application/vnd.oma.bcast.notification+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oma.bcast.provisioningtrigger": { source: "iana" },
    "application/vnd.oma.bcast.sgboot": { source: "iana" },
    "application/vnd.oma.bcast.sgdd+xml": { source: "iana", compressible: !0 },
    "application/vnd.oma.bcast.sgdu": { source: "iana" },
    "application/vnd.oma.bcast.simple-symbol-container": { source: "iana" },
    "application/vnd.oma.bcast.smartcard-trigger+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oma.bcast.sprov+xml": { source: "iana", compressible: !0 },
    "application/vnd.oma.bcast.stkm": { source: "iana" },
    "application/vnd.oma.cab-address-book+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oma.cab-feature-handler+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oma.cab-pcc+xml": { source: "iana", compressible: !0 },
    "application/vnd.oma.cab-subs-invite+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oma.cab-user-prefs+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oma.dcd": { source: "iana" },
    "application/vnd.oma.dcdc": { source: "iana" },
    "application/vnd.oma.dd2+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["dd2"],
    },
    "application/vnd.oma.drm.risd+xml": { source: "iana", compressible: !0 },
    "application/vnd.oma.group-usage-list+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oma.lwm2m+cbor": { source: "iana" },
    "application/vnd.oma.lwm2m+json": { source: "iana", compressible: !0 },
    "application/vnd.oma.lwm2m+tlv": { source: "iana" },
    "application/vnd.oma.pal+xml": { source: "iana", compressible: !0 },
    "application/vnd.oma.poc.detailed-progress-report+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oma.poc.final-report+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oma.poc.groups+xml": { source: "iana", compressible: !0 },
    "application/vnd.oma.poc.invocation-descriptor+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oma.poc.optimized-progress-report+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oma.push": { source: "iana" },
    "application/vnd.oma.scidm.messages+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oma.xcap-directory+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.omads-email+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/vnd.omads-file+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/vnd.omads-folder+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/vnd.omaloc-supl-init": { source: "iana" },
    "application/vnd.onepager": { source: "iana" },
    "application/vnd.onepagertamp": { source: "iana" },
    "application/vnd.onepagertamx": { source: "iana" },
    "application/vnd.onepagertat": { source: "iana" },
    "application/vnd.onepagertatp": { source: "iana" },
    "application/vnd.onepagertatx": { source: "iana" },
    "application/vnd.openblox.game+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["obgx"],
    },
    "application/vnd.openblox.game-binary": { source: "iana" },
    "application/vnd.openeye.oeb": { source: "iana" },
    "application/vnd.openofficeorg.extension": {
      source: "apache",
      extensions: ["oxt"],
    },
    "application/vnd.openstreetmap.data+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["osm"],
    },
    "application/vnd.opentimestamps.ots": { source: "iana" },
    "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.openxmlformats-officedocument.drawing+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.presentationml.comments+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      { source: "iana", compressible: !1, extensions: ["pptx"] },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.presentationml.slide": {
      source: "iana",
      extensions: ["sldx"],
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
      source: "iana",
      extensions: ["ppsx"],
    },
    "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.openxmlformats-officedocument.presentationml.template": {
      source: "iana",
      extensions: ["potx"],
    },
    "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
      source: "iana",
      compressible: !1,
      extensions: ["xlsx"],
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
      source: "iana",
      extensions: ["xltx"],
    },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.theme+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.openxmlformats-officedocument.vmldrawing": {
      source: "iana",
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
      source: "iana",
      compressible: !1,
      extensions: ["docx"],
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
      source: "iana",
      extensions: ["dotx"],
    },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-package.core-properties+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml":
      { source: "iana", compressible: !0 },
    "application/vnd.openxmlformats-package.relationships+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.oracle.resource+json": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.orange.indata": { source: "iana" },
    "application/vnd.osa.netdeploy": { source: "iana" },
    "application/vnd.osgeo.mapguide.package": {
      source: "iana",
      extensions: ["mgp"],
    },
    "application/vnd.osgi.bundle": { source: "iana" },
    "application/vnd.osgi.dp": { source: "iana", extensions: ["dp"] },
    "application/vnd.osgi.subsystem": { source: "iana", extensions: ["esa"] },
    "application/vnd.otps.ct-kip+xml": { source: "iana", compressible: !0 },
    "application/vnd.oxli.countgraph": { source: "iana" },
    "application/vnd.pagerduty+json": { source: "iana", compressible: !0 },
    "application/vnd.palm": {
      source: "iana",
      extensions: ["pdb", "pqa", "oprc"],
    },
    "application/vnd.panoply": { source: "iana" },
    "application/vnd.paos.xml": { source: "iana" },
    "application/vnd.patentdive": { source: "iana" },
    "application/vnd.patientecommsdoc": { source: "iana" },
    "application/vnd.pawaafile": { source: "iana", extensions: ["paw"] },
    "application/vnd.pcos": { source: "iana" },
    "application/vnd.pg.format": { source: "iana", extensions: ["str"] },
    "application/vnd.pg.osasli": { source: "iana", extensions: ["ei6"] },
    "application/vnd.piaccess.application-licence": { source: "iana" },
    "application/vnd.picsel": { source: "iana", extensions: ["efif"] },
    "application/vnd.pmi.widget": { source: "iana", extensions: ["wg"] },
    "application/vnd.poc.group-advertisement+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.pocketlearn": { source: "iana", extensions: ["plf"] },
    "application/vnd.powerbuilder6": { source: "iana", extensions: ["pbd"] },
    "application/vnd.powerbuilder6-s": { source: "iana" },
    "application/vnd.powerbuilder7": { source: "iana" },
    "application/vnd.powerbuilder7-s": { source: "iana" },
    "application/vnd.powerbuilder75": { source: "iana" },
    "application/vnd.powerbuilder75-s": { source: "iana" },
    "application/vnd.preminet": { source: "iana" },
    "application/vnd.previewsystems.box": {
      source: "iana",
      extensions: ["box"],
    },
    "application/vnd.proteus.magazine": { source: "iana", extensions: ["mgz"] },
    "application/vnd.psfs": { source: "iana" },
    "application/vnd.publishare-delta-tree": {
      source: "iana",
      extensions: ["qps"],
    },
    "application/vnd.pvi.ptid1": { source: "iana", extensions: ["ptid"] },
    "application/vnd.pwg-multiplexed": { source: "iana" },
    "application/vnd.pwg-xhtml-print+xml": { source: "iana", compressible: !0 },
    "application/vnd.qualcomm.brew-app-res": { source: "iana" },
    "application/vnd.quarantainenet": { source: "iana" },
    "application/vnd.quark.quarkxpress": {
      source: "iana",
      extensions: ["qxd", "qxt", "qwd", "qwt", "qxl", "qxb"],
    },
    "application/vnd.quobject-quoxdocument": { source: "iana" },
    "application/vnd.radisys.moml+xml": { source: "iana", compressible: !0 },
    "application/vnd.radisys.msml+xml": { source: "iana", compressible: !0 },
    "application/vnd.radisys.msml-audit+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.radisys.msml-audit-conf+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.radisys.msml-audit-conn+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.radisys.msml-audit-dialog+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.radisys.msml-audit-stream+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.radisys.msml-conf+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.radisys.msml-dialog+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.radisys.msml-dialog-base+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.radisys.msml-dialog-fax-detect+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.radisys.msml-dialog-group+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.radisys.msml-dialog-speech+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.radisys.msml-dialog-transform+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.rainstor.data": { source: "iana" },
    "application/vnd.rapid": { source: "iana" },
    "application/vnd.rar": { source: "iana", extensions: ["rar"] },
    "application/vnd.realvnc.bed": { source: "iana", extensions: ["bed"] },
    "application/vnd.recordare.musicxml": {
      source: "iana",
      extensions: ["mxl"],
    },
    "application/vnd.recordare.musicxml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["musicxml"],
    },
    "application/vnd.renlearn.rlprint": { source: "iana" },
    "application/vnd.resilient.logic": { source: "iana" },
    "application/vnd.restful+json": { source: "iana", compressible: !0 },
    "application/vnd.rig.cryptonote": {
      source: "iana",
      extensions: ["cryptonote"],
    },
    "application/vnd.rim.cod": { source: "apache", extensions: ["cod"] },
    "application/vnd.rn-realmedia": { source: "apache", extensions: ["rm"] },
    "application/vnd.rn-realmedia-vbr": {
      source: "apache",
      extensions: ["rmvb"],
    },
    "application/vnd.route66.link66+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["link66"],
    },
    "application/vnd.rs-274x": { source: "iana" },
    "application/vnd.ruckus.download": { source: "iana" },
    "application/vnd.s3sms": { source: "iana" },
    "application/vnd.sailingtracker.track": {
      source: "iana",
      extensions: ["st"],
    },
    "application/vnd.sar": { source: "iana" },
    "application/vnd.sbm.cid": { source: "iana" },
    "application/vnd.sbm.mid2": { source: "iana" },
    "application/vnd.scribus": { source: "iana" },
    "application/vnd.sealed.3df": { source: "iana" },
    "application/vnd.sealed.csf": { source: "iana" },
    "application/vnd.sealed.doc": { source: "iana" },
    "application/vnd.sealed.eml": { source: "iana" },
    "application/vnd.sealed.mht": { source: "iana" },
    "application/vnd.sealed.net": { source: "iana" },
    "application/vnd.sealed.ppt": { source: "iana" },
    "application/vnd.sealed.tiff": { source: "iana" },
    "application/vnd.sealed.xls": { source: "iana" },
    "application/vnd.sealedmedia.softseal.html": { source: "iana" },
    "application/vnd.sealedmedia.softseal.pdf": { source: "iana" },
    "application/vnd.seemail": { source: "iana", extensions: ["see"] },
    "application/vnd.seis+json": { source: "iana", compressible: !0 },
    "application/vnd.sema": { source: "iana", extensions: ["sema"] },
    "application/vnd.semd": { source: "iana", extensions: ["semd"] },
    "application/vnd.semf": { source: "iana", extensions: ["semf"] },
    "application/vnd.shade-save-file": { source: "iana" },
    "application/vnd.shana.informed.formdata": {
      source: "iana",
      extensions: ["ifm"],
    },
    "application/vnd.shana.informed.formtemplate": {
      source: "iana",
      extensions: ["itp"],
    },
    "application/vnd.shana.informed.interchange": {
      source: "iana",
      extensions: ["iif"],
    },
    "application/vnd.shana.informed.package": {
      source: "iana",
      extensions: ["ipk"],
    },
    "application/vnd.shootproof+json": { source: "iana", compressible: !0 },
    "application/vnd.shopkick+json": { source: "iana", compressible: !0 },
    "application/vnd.shp": { source: "iana" },
    "application/vnd.shx": { source: "iana" },
    "application/vnd.sigrok.session": { source: "iana" },
    "application/vnd.simtech-mindmapper": {
      source: "iana",
      extensions: ["twd", "twds"],
    },
    "application/vnd.siren+json": { source: "iana", compressible: !0 },
    "application/vnd.smaf": { source: "iana", extensions: ["mmf"] },
    "application/vnd.smart.notebook": { source: "iana" },
    "application/vnd.smart.teacher": {
      source: "iana",
      extensions: ["teacher"],
    },
    "application/vnd.snesdev-page-table": { source: "iana" },
    "application/vnd.software602.filler.form+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["fo"],
    },
    "application/vnd.software602.filler.form-xml-zip": { source: "iana" },
    "application/vnd.solent.sdkm+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["sdkm", "sdkd"],
    },
    "application/vnd.spotfire.dxp": { source: "iana", extensions: ["dxp"] },
    "application/vnd.spotfire.sfs": { source: "iana", extensions: ["sfs"] },
    "application/vnd.sqlite3": { source: "iana" },
    "application/vnd.sss-cod": { source: "iana" },
    "application/vnd.sss-dtf": { source: "iana" },
    "application/vnd.sss-ntf": { source: "iana" },
    "application/vnd.stardivision.calc": {
      source: "apache",
      extensions: ["sdc"],
    },
    "application/vnd.stardivision.draw": {
      source: "apache",
      extensions: ["sda"],
    },
    "application/vnd.stardivision.impress": {
      source: "apache",
      extensions: ["sdd"],
    },
    "application/vnd.stardivision.math": {
      source: "apache",
      extensions: ["smf"],
    },
    "application/vnd.stardivision.writer": {
      source: "apache",
      extensions: ["sdw", "vor"],
    },
    "application/vnd.stardivision.writer-global": {
      source: "apache",
      extensions: ["sgl"],
    },
    "application/vnd.stepmania.package": {
      source: "iana",
      extensions: ["smzip"],
    },
    "application/vnd.stepmania.stepchart": {
      source: "iana",
      extensions: ["sm"],
    },
    "application/vnd.street-stream": { source: "iana" },
    "application/vnd.sun.wadl+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["wadl"],
    },
    "application/vnd.sun.xml.calc": { source: "apache", extensions: ["sxc"] },
    "application/vnd.sun.xml.calc.template": {
      source: "apache",
      extensions: ["stc"],
    },
    "application/vnd.sun.xml.draw": { source: "apache", extensions: ["sxd"] },
    "application/vnd.sun.xml.draw.template": {
      source: "apache",
      extensions: ["std"],
    },
    "application/vnd.sun.xml.impress": {
      source: "apache",
      extensions: ["sxi"],
    },
    "application/vnd.sun.xml.impress.template": {
      source: "apache",
      extensions: ["sti"],
    },
    "application/vnd.sun.xml.math": { source: "apache", extensions: ["sxm"] },
    "application/vnd.sun.xml.writer": { source: "apache", extensions: ["sxw"] },
    "application/vnd.sun.xml.writer.global": {
      source: "apache",
      extensions: ["sxg"],
    },
    "application/vnd.sun.xml.writer.template": {
      source: "apache",
      extensions: ["stw"],
    },
    "application/vnd.sus-calendar": {
      source: "iana",
      extensions: ["sus", "susp"],
    },
    "application/vnd.svd": { source: "iana", extensions: ["svd"] },
    "application/vnd.swiftview-ics": { source: "iana" },
    "application/vnd.sycle+xml": { source: "iana", compressible: !0 },
    "application/vnd.syft+json": { source: "iana", compressible: !0 },
    "application/vnd.symbian.install": {
      source: "apache",
      extensions: ["sis", "sisx"],
    },
    "application/vnd.syncml+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
      extensions: ["xsm"],
    },
    "application/vnd.syncml.dm+wbxml": {
      source: "iana",
      charset: "UTF-8",
      extensions: ["bdm"],
    },
    "application/vnd.syncml.dm+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
      extensions: ["xdm"],
    },
    "application/vnd.syncml.dm.notification": { source: "iana" },
    "application/vnd.syncml.dmddf+wbxml": { source: "iana" },
    "application/vnd.syncml.dmddf+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
      extensions: ["ddf"],
    },
    "application/vnd.syncml.dmtnds+wbxml": { source: "iana" },
    "application/vnd.syncml.dmtnds+xml": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
    },
    "application/vnd.syncml.ds.notification": { source: "iana" },
    "application/vnd.tableschema+json": { source: "iana", compressible: !0 },
    "application/vnd.tao.intent-module-archive": {
      source: "iana",
      extensions: ["tao"],
    },
    "application/vnd.tcpdump.pcap": {
      source: "iana",
      extensions: ["pcap", "cap", "dmp"],
    },
    "application/vnd.think-cell.ppttc+json": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.tmd.mediaflex.api+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/vnd.tml": { source: "iana" },
    "application/vnd.tmobile-livetv": { source: "iana", extensions: ["tmo"] },
    "application/vnd.tri.onesource": { source: "iana" },
    "application/vnd.trid.tpt": { source: "iana", extensions: ["tpt"] },
    "application/vnd.triscape.mxs": { source: "iana", extensions: ["mxs"] },
    "application/vnd.trueapp": { source: "iana", extensions: ["tra"] },
    "application/vnd.truedoc": { source: "iana" },
    "application/vnd.ubisoft.webplayer": { source: "iana" },
    "application/vnd.ufdl": { source: "iana", extensions: ["ufd", "ufdl"] },
    "application/vnd.uiq.theme": { source: "iana", extensions: ["utz"] },
    "application/vnd.umajin": { source: "iana", extensions: ["umj"] },
    "application/vnd.unity": { source: "iana", extensions: ["unityweb"] },
    "application/vnd.uoml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["uoml"],
    },
    "application/vnd.uplanet.alert": { source: "iana" },
    "application/vnd.uplanet.alert-wbxml": { source: "iana" },
    "application/vnd.uplanet.bearer-choice": { source: "iana" },
    "application/vnd.uplanet.bearer-choice-wbxml": { source: "iana" },
    "application/vnd.uplanet.cacheop": { source: "iana" },
    "application/vnd.uplanet.cacheop-wbxml": { source: "iana" },
    "application/vnd.uplanet.channel": { source: "iana" },
    "application/vnd.uplanet.channel-wbxml": { source: "iana" },
    "application/vnd.uplanet.list": { source: "iana" },
    "application/vnd.uplanet.list-wbxml": { source: "iana" },
    "application/vnd.uplanet.listcmd": { source: "iana" },
    "application/vnd.uplanet.listcmd-wbxml": { source: "iana" },
    "application/vnd.uplanet.signal": { source: "iana" },
    "application/vnd.uri-map": { source: "iana" },
    "application/vnd.valve.source.material": { source: "iana" },
    "application/vnd.vcx": { source: "iana", extensions: ["vcx"] },
    "application/vnd.vd-study": { source: "iana" },
    "application/vnd.vectorworks": { source: "iana" },
    "application/vnd.vel+json": { source: "iana", compressible: !0 },
    "application/vnd.verimatrix.vcas": { source: "iana" },
    "application/vnd.veritone.aion+json": { source: "iana", compressible: !0 },
    "application/vnd.veryant.thin": { source: "iana" },
    "application/vnd.ves.encrypted": { source: "iana" },
    "application/vnd.vidsoft.vidconference": { source: "iana" },
    "application/vnd.visio": {
      source: "iana",
      extensions: ["vsd", "vst", "vss", "vsw"],
    },
    "application/vnd.visionary": { source: "iana", extensions: ["vis"] },
    "application/vnd.vividence.scriptfile": { source: "iana" },
    "application/vnd.vsf": { source: "iana", extensions: ["vsf"] },
    "application/vnd.wap.sic": { source: "iana" },
    "application/vnd.wap.slc": { source: "iana" },
    "application/vnd.wap.wbxml": {
      source: "iana",
      charset: "UTF-8",
      extensions: ["wbxml"],
    },
    "application/vnd.wap.wmlc": { source: "iana", extensions: ["wmlc"] },
    "application/vnd.wap.wmlscriptc": { source: "iana", extensions: ["wmlsc"] },
    "application/vnd.webturbo": { source: "iana", extensions: ["wtb"] },
    "application/vnd.wfa.dpp": { source: "iana" },
    "application/vnd.wfa.p2p": { source: "iana" },
    "application/vnd.wfa.wsc": { source: "iana" },
    "application/vnd.windows.devicepairing": { source: "iana" },
    "application/vnd.wmc": { source: "iana" },
    "application/vnd.wmf.bootstrap": { source: "iana" },
    "application/vnd.wolfram.mathematica": { source: "iana" },
    "application/vnd.wolfram.mathematica.package": { source: "iana" },
    "application/vnd.wolfram.player": { source: "iana", extensions: ["nbp"] },
    "application/vnd.wordperfect": { source: "iana", extensions: ["wpd"] },
    "application/vnd.wqd": { source: "iana", extensions: ["wqd"] },
    "application/vnd.wrq-hp3000-labelled": { source: "iana" },
    "application/vnd.wt.stf": { source: "iana", extensions: ["stf"] },
    "application/vnd.wv.csp+wbxml": { source: "iana" },
    "application/vnd.wv.csp+xml": { source: "iana", compressible: !0 },
    "application/vnd.wv.ssp+xml": { source: "iana", compressible: !0 },
    "application/vnd.xacml+json": { source: "iana", compressible: !0 },
    "application/vnd.xara": { source: "iana", extensions: ["xar"] },
    "application/vnd.xfdl": { source: "iana", extensions: ["xfdl"] },
    "application/vnd.xfdl.webform": { source: "iana" },
    "application/vnd.xmi+xml": { source: "iana", compressible: !0 },
    "application/vnd.xmpie.cpkg": { source: "iana" },
    "application/vnd.xmpie.dpkg": { source: "iana" },
    "application/vnd.xmpie.plan": { source: "iana" },
    "application/vnd.xmpie.ppkg": { source: "iana" },
    "application/vnd.xmpie.xlim": { source: "iana" },
    "application/vnd.yamaha.hv-dic": { source: "iana", extensions: ["hvd"] },
    "application/vnd.yamaha.hv-script": { source: "iana", extensions: ["hvs"] },
    "application/vnd.yamaha.hv-voice": { source: "iana", extensions: ["hvp"] },
    "application/vnd.yamaha.openscoreformat": {
      source: "iana",
      extensions: ["osf"],
    },
    "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["osfpvg"],
    },
    "application/vnd.yamaha.remote-setup": { source: "iana" },
    "application/vnd.yamaha.smaf-audio": {
      source: "iana",
      extensions: ["saf"],
    },
    "application/vnd.yamaha.smaf-phrase": {
      source: "iana",
      extensions: ["spf"],
    },
    "application/vnd.yamaha.through-ngn": { source: "iana" },
    "application/vnd.yamaha.tunnel-udpencap": { source: "iana" },
    "application/vnd.yaoweme": { source: "iana" },
    "application/vnd.yellowriver-custom-menu": {
      source: "iana",
      extensions: ["cmp"],
    },
    "application/vnd.youtube.yt": { source: "iana" },
    "application/vnd.zul": { source: "iana", extensions: ["zir", "zirz"] },
    "application/vnd.zzazz.deck+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["zaz"],
    },
    "application/voicexml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["vxml"],
    },
    "application/voucher-cms+json": { source: "iana", compressible: !0 },
    "application/vq-rtcpxr": { source: "iana" },
    "application/wasm": {
      source: "iana",
      compressible: !0,
      extensions: ["wasm"],
    },
    "application/watcherinfo+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["wif"],
    },
    "application/webpush-options+json": { source: "iana", compressible: !0 },
    "application/whoispp-query": { source: "iana" },
    "application/whoispp-response": { source: "iana" },
    "application/widget": { source: "iana", extensions: ["wgt"] },
    "application/winhlp": { source: "apache", extensions: ["hlp"] },
    "application/wita": { source: "iana" },
    "application/wordperfect5.1": { source: "iana" },
    "application/wsdl+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["wsdl"],
    },
    "application/wspolicy+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["wspolicy"],
    },
    "application/x-7z-compressed": {
      source: "apache",
      compressible: !1,
      extensions: ["7z"],
    },
    "application/x-abiword": { source: "apache", extensions: ["abw"] },
    "application/x-ace-compressed": { source: "apache", extensions: ["ace"] },
    "application/x-amf": { source: "apache" },
    "application/x-apple-diskimage": { source: "apache", extensions: ["dmg"] },
    "application/x-arj": { compressible: !1, extensions: ["arj"] },
    "application/x-authorware-bin": {
      source: "apache",
      extensions: ["aab", "x32", "u32", "vox"],
    },
    "application/x-authorware-map": { source: "apache", extensions: ["aam"] },
    "application/x-authorware-seg": { source: "apache", extensions: ["aas"] },
    "application/x-bcpio": { source: "apache", extensions: ["bcpio"] },
    "application/x-bdoc": { compressible: !1, extensions: ["bdoc"] },
    "application/x-bittorrent": { source: "apache", extensions: ["torrent"] },
    "application/x-blorb": { source: "apache", extensions: ["blb", "blorb"] },
    "application/x-bzip": {
      source: "apache",
      compressible: !1,
      extensions: ["bz"],
    },
    "application/x-bzip2": {
      source: "apache",
      compressible: !1,
      extensions: ["bz2", "boz"],
    },
    "application/x-cbr": {
      source: "apache",
      extensions: ["cbr", "cba", "cbt", "cbz", "cb7"],
    },
    "application/x-cdlink": { source: "apache", extensions: ["vcd"] },
    "application/x-cfs-compressed": { source: "apache", extensions: ["cfs"] },
    "application/x-chat": { source: "apache", extensions: ["chat"] },
    "application/x-chess-pgn": { source: "apache", extensions: ["pgn"] },
    "application/x-chrome-extension": { extensions: ["crx"] },
    "application/x-cocoa": { source: "nginx", extensions: ["cco"] },
    "application/x-compress": { source: "apache" },
    "application/x-conference": { source: "apache", extensions: ["nsc"] },
    "application/x-cpio": { source: "apache", extensions: ["cpio"] },
    "application/x-csh": { source: "apache", extensions: ["csh"] },
    "application/x-deb": { compressible: !1 },
    "application/x-debian-package": {
      source: "apache",
      extensions: ["deb", "udeb"],
    },
    "application/x-dgc-compressed": { source: "apache", extensions: ["dgc"] },
    "application/x-director": {
      source: "apache",
      extensions: [
        "dir",
        "dcr",
        "dxr",
        "cst",
        "cct",
        "cxt",
        "w3d",
        "fgd",
        "swa",
      ],
    },
    "application/x-doom": { source: "apache", extensions: ["wad"] },
    "application/x-dtbncx+xml": {
      source: "apache",
      compressible: !0,
      extensions: ["ncx"],
    },
    "application/x-dtbook+xml": {
      source: "apache",
      compressible: !0,
      extensions: ["dtb"],
    },
    "application/x-dtbresource+xml": {
      source: "apache",
      compressible: !0,
      extensions: ["res"],
    },
    "application/x-dvi": {
      source: "apache",
      compressible: !1,
      extensions: ["dvi"],
    },
    "application/x-envoy": { source: "apache", extensions: ["evy"] },
    "application/x-eva": { source: "apache", extensions: ["eva"] },
    "application/x-font-bdf": { source: "apache", extensions: ["bdf"] },
    "application/x-font-dos": { source: "apache" },
    "application/x-font-framemaker": { source: "apache" },
    "application/x-font-ghostscript": { source: "apache", extensions: ["gsf"] },
    "application/x-font-libgrx": { source: "apache" },
    "application/x-font-linux-psf": { source: "apache", extensions: ["psf"] },
    "application/x-font-pcf": { source: "apache", extensions: ["pcf"] },
    "application/x-font-snf": { source: "apache", extensions: ["snf"] },
    "application/x-font-speedo": { source: "apache" },
    "application/x-font-sunos-news": { source: "apache" },
    "application/x-font-type1": {
      source: "apache",
      extensions: ["pfa", "pfb", "pfm", "afm"],
    },
    "application/x-font-vfont": { source: "apache" },
    "application/x-freearc": { source: "apache", extensions: ["arc"] },
    "application/x-futuresplash": { source: "apache", extensions: ["spl"] },
    "application/x-gca-compressed": { source: "apache", extensions: ["gca"] },
    "application/x-glulx": { source: "apache", extensions: ["ulx"] },
    "application/x-gnumeric": { source: "apache", extensions: ["gnumeric"] },
    "application/x-gramps-xml": { source: "apache", extensions: ["gramps"] },
    "application/x-gtar": { source: "apache", extensions: ["gtar"] },
    "application/x-gzip": { source: "apache" },
    "application/x-hdf": { source: "apache", extensions: ["hdf"] },
    "application/x-httpd-php": { compressible: !0, extensions: ["php"] },
    "application/x-install-instructions": {
      source: "apache",
      extensions: ["install"],
    },
    "application/x-iso9660-image": { source: "apache", extensions: ["iso"] },
    "application/x-iwork-keynote-sffkey": { extensions: ["key"] },
    "application/x-iwork-numbers-sffnumbers": { extensions: ["numbers"] },
    "application/x-iwork-pages-sffpages": { extensions: ["pages"] },
    "application/x-java-archive-diff": {
      source: "nginx",
      extensions: ["jardiff"],
    },
    "application/x-java-jnlp-file": {
      source: "apache",
      compressible: !1,
      extensions: ["jnlp"],
    },
    "application/x-javascript": { compressible: !0 },
    "application/x-keepass2": { extensions: ["kdbx"] },
    "application/x-latex": {
      source: "apache",
      compressible: !1,
      extensions: ["latex"],
    },
    "application/x-lua-bytecode": { extensions: ["luac"] },
    "application/x-lzh-compressed": {
      source: "apache",
      extensions: ["lzh", "lha"],
    },
    "application/x-makeself": { source: "nginx", extensions: ["run"] },
    "application/x-mie": { source: "apache", extensions: ["mie"] },
    "application/x-mobipocket-ebook": {
      source: "apache",
      extensions: ["prc", "mobi"],
    },
    "application/x-mpegurl": { compressible: !1 },
    "application/x-ms-application": {
      source: "apache",
      extensions: ["application"],
    },
    "application/x-ms-shortcut": { source: "apache", extensions: ["lnk"] },
    "application/x-ms-wmd": { source: "apache", extensions: ["wmd"] },
    "application/x-ms-wmz": { source: "apache", extensions: ["wmz"] },
    "application/x-ms-xbap": { source: "apache", extensions: ["xbap"] },
    "application/x-msaccess": { source: "apache", extensions: ["mdb"] },
    "application/x-msbinder": { source: "apache", extensions: ["obd"] },
    "application/x-mscardfile": { source: "apache", extensions: ["crd"] },
    "application/x-msclip": { source: "apache", extensions: ["clp"] },
    "application/x-msdos-program": { extensions: ["exe"] },
    "application/x-msdownload": {
      source: "apache",
      extensions: ["exe", "dll", "com", "bat", "msi"],
    },
    "application/x-msmediaview": {
      source: "apache",
      extensions: ["mvb", "m13", "m14"],
    },
    "application/x-msmetafile": {
      source: "apache",
      extensions: ["wmf", "wmz", "emf", "emz"],
    },
    "application/x-msmoney": { source: "apache", extensions: ["mny"] },
    "application/x-mspublisher": { source: "apache", extensions: ["pub"] },
    "application/x-msschedule": { source: "apache", extensions: ["scd"] },
    "application/x-msterminal": { source: "apache", extensions: ["trm"] },
    "application/x-mswrite": { source: "apache", extensions: ["wri"] },
    "application/x-netcdf": { source: "apache", extensions: ["nc", "cdf"] },
    "application/x-ns-proxy-autoconfig": {
      compressible: !0,
      extensions: ["pac"],
    },
    "application/x-nzb": { source: "apache", extensions: ["nzb"] },
    "application/x-perl": { source: "nginx", extensions: ["pl", "pm"] },
    "application/x-pilot": { source: "nginx", extensions: ["prc", "pdb"] },
    "application/x-pkcs12": {
      source: "apache",
      compressible: !1,
      extensions: ["p12", "pfx"],
    },
    "application/x-pkcs7-certificates": {
      source: "apache",
      extensions: ["p7b", "spc"],
    },
    "application/x-pkcs7-certreqresp": {
      source: "apache",
      extensions: ["p7r"],
    },
    "application/x-pki-message": { source: "iana" },
    "application/x-rar-compressed": {
      source: "apache",
      compressible: !1,
      extensions: ["rar"],
    },
    "application/x-redhat-package-manager": {
      source: "nginx",
      extensions: ["rpm"],
    },
    "application/x-research-info-systems": {
      source: "apache",
      extensions: ["ris"],
    },
    "application/x-sea": { source: "nginx", extensions: ["sea"] },
    "application/x-sh": {
      source: "apache",
      compressible: !0,
      extensions: ["sh"],
    },
    "application/x-shar": { source: "apache", extensions: ["shar"] },
    "application/x-shockwave-flash": {
      source: "apache",
      compressible: !1,
      extensions: ["swf"],
    },
    "application/x-silverlight-app": { source: "apache", extensions: ["xap"] },
    "application/x-sql": { source: "apache", extensions: ["sql"] },
    "application/x-stuffit": {
      source: "apache",
      compressible: !1,
      extensions: ["sit"],
    },
    "application/x-stuffitx": { source: "apache", extensions: ["sitx"] },
    "application/x-subrip": { source: "apache", extensions: ["srt"] },
    "application/x-sv4cpio": { source: "apache", extensions: ["sv4cpio"] },
    "application/x-sv4crc": { source: "apache", extensions: ["sv4crc"] },
    "application/x-t3vm-image": { source: "apache", extensions: ["t3"] },
    "application/x-tads": { source: "apache", extensions: ["gam"] },
    "application/x-tar": {
      source: "apache",
      compressible: !0,
      extensions: ["tar"],
    },
    "application/x-tcl": { source: "apache", extensions: ["tcl", "tk"] },
    "application/x-tex": { source: "apache", extensions: ["tex"] },
    "application/x-tex-tfm": { source: "apache", extensions: ["tfm"] },
    "application/x-texinfo": {
      source: "apache",
      extensions: ["texinfo", "texi"],
    },
    "application/x-tgif": { source: "apache", extensions: ["obj"] },
    "application/x-ustar": { source: "apache", extensions: ["ustar"] },
    "application/x-virtualbox-hdd": { compressible: !0, extensions: ["hdd"] },
    "application/x-virtualbox-ova": { compressible: !0, extensions: ["ova"] },
    "application/x-virtualbox-ovf": { compressible: !0, extensions: ["ovf"] },
    "application/x-virtualbox-vbox": { compressible: !0, extensions: ["vbox"] },
    "application/x-virtualbox-vbox-extpack": {
      compressible: !1,
      extensions: ["vbox-extpack"],
    },
    "application/x-virtualbox-vdi": { compressible: !0, extensions: ["vdi"] },
    "application/x-virtualbox-vhd": { compressible: !0, extensions: ["vhd"] },
    "application/x-virtualbox-vmdk": { compressible: !0, extensions: ["vmdk"] },
    "application/x-wais-source": { source: "apache", extensions: ["src"] },
    "application/x-web-app-manifest+json": {
      compressible: !0,
      extensions: ["webapp"],
    },
    "application/x-www-form-urlencoded": { source: "iana", compressible: !0 },
    "application/x-x509-ca-cert": {
      source: "iana",
      extensions: ["der", "crt", "pem"],
    },
    "application/x-x509-ca-ra-cert": { source: "iana" },
    "application/x-x509-next-ca-cert": { source: "iana" },
    "application/x-xfig": { source: "apache", extensions: ["fig"] },
    "application/x-xliff+xml": {
      source: "apache",
      compressible: !0,
      extensions: ["xlf"],
    },
    "application/x-xpinstall": {
      source: "apache",
      compressible: !1,
      extensions: ["xpi"],
    },
    "application/x-xz": { source: "apache", extensions: ["xz"] },
    "application/x-zmachine": {
      source: "apache",
      extensions: ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8"],
    },
    "application/x400-bp": { source: "iana" },
    "application/xacml+xml": { source: "iana", compressible: !0 },
    "application/xaml+xml": {
      source: "apache",
      compressible: !0,
      extensions: ["xaml"],
    },
    "application/xcap-att+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xav"],
    },
    "application/xcap-caps+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xca"],
    },
    "application/xcap-diff+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xdf"],
    },
    "application/xcap-el+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xel"],
    },
    "application/xcap-error+xml": { source: "iana", compressible: !0 },
    "application/xcap-ns+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xns"],
    },
    "application/xcon-conference-info+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/xcon-conference-info-diff+xml": {
      source: "iana",
      compressible: !0,
    },
    "application/xenc+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xenc"],
    },
    "application/xhtml+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xhtml", "xht"],
    },
    "application/xhtml-voice+xml": { source: "apache", compressible: !0 },
    "application/xliff+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xlf"],
    },
    "application/xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xml", "xsl", "xsd", "rng"],
    },
    "application/xml-dtd": {
      source: "iana",
      compressible: !0,
      extensions: ["dtd"],
    },
    "application/xml-external-parsed-entity": { source: "iana" },
    "application/xml-patch+xml": { source: "iana", compressible: !0 },
    "application/xmpp+xml": { source: "iana", compressible: !0 },
    "application/xop+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xop"],
    },
    "application/xproc+xml": {
      source: "apache",
      compressible: !0,
      extensions: ["xpl"],
    },
    "application/xslt+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["xsl", "xslt"],
    },
    "application/xspf+xml": {
      source: "apache",
      compressible: !0,
      extensions: ["xspf"],
    },
    "application/xv+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["mxml", "xhvml", "xvml", "xvm"],
    },
    "application/yang": { source: "iana", extensions: ["yang"] },
    "application/yang-data+json": { source: "iana", compressible: !0 },
    "application/yang-data+xml": { source: "iana", compressible: !0 },
    "application/yang-patch+json": { source: "iana", compressible: !0 },
    "application/yang-patch+xml": { source: "iana", compressible: !0 },
    "application/yin+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["yin"],
    },
    "application/zip": {
      source: "iana",
      compressible: !1,
      extensions: ["zip"],
    },
    "application/zlib": { source: "iana" },
    "application/zstd": { source: "iana" },
    "audio/1d-interleaved-parityfec": { source: "iana" },
    "audio/32kadpcm": { source: "iana" },
    "audio/3gpp": { source: "iana", compressible: !1, extensions: ["3gpp"] },
    "audio/3gpp2": { source: "iana" },
    "audio/aac": { source: "iana" },
    "audio/ac3": { source: "iana" },
    "audio/adpcm": { source: "apache", extensions: ["adp"] },
    "audio/amr": { source: "iana", extensions: ["amr"] },
    "audio/amr-wb": { source: "iana" },
    "audio/amr-wb+": { source: "iana" },
    "audio/aptx": { source: "iana" },
    "audio/asc": { source: "iana" },
    "audio/atrac-advanced-lossless": { source: "iana" },
    "audio/atrac-x": { source: "iana" },
    "audio/atrac3": { source: "iana" },
    "audio/basic": {
      source: "iana",
      compressible: !1,
      extensions: ["au", "snd"],
    },
    "audio/bv16": { source: "iana" },
    "audio/bv32": { source: "iana" },
    "audio/clearmode": { source: "iana" },
    "audio/cn": { source: "iana" },
    "audio/dat12": { source: "iana" },
    "audio/dls": { source: "iana" },
    "audio/dsr-es201108": { source: "iana" },
    "audio/dsr-es202050": { source: "iana" },
    "audio/dsr-es202211": { source: "iana" },
    "audio/dsr-es202212": { source: "iana" },
    "audio/dv": { source: "iana" },
    "audio/dvi4": { source: "iana" },
    "audio/eac3": { source: "iana" },
    "audio/encaprtp": { source: "iana" },
    "audio/evrc": { source: "iana" },
    "audio/evrc-qcp": { source: "iana" },
    "audio/evrc0": { source: "iana" },
    "audio/evrc1": { source: "iana" },
    "audio/evrcb": { source: "iana" },
    "audio/evrcb0": { source: "iana" },
    "audio/evrcb1": { source: "iana" },
    "audio/evrcnw": { source: "iana" },
    "audio/evrcnw0": { source: "iana" },
    "audio/evrcnw1": { source: "iana" },
    "audio/evrcwb": { source: "iana" },
    "audio/evrcwb0": { source: "iana" },
    "audio/evrcwb1": { source: "iana" },
    "audio/evs": { source: "iana" },
    "audio/flexfec": { source: "iana" },
    "audio/fwdred": { source: "iana" },
    "audio/g711-0": { source: "iana" },
    "audio/g719": { source: "iana" },
    "audio/g722": { source: "iana" },
    "audio/g7221": { source: "iana" },
    "audio/g723": { source: "iana" },
    "audio/g726-16": { source: "iana" },
    "audio/g726-24": { source: "iana" },
    "audio/g726-32": { source: "iana" },
    "audio/g726-40": { source: "iana" },
    "audio/g728": { source: "iana" },
    "audio/g729": { source: "iana" },
    "audio/g7291": { source: "iana" },
    "audio/g729d": { source: "iana" },
    "audio/g729e": { source: "iana" },
    "audio/gsm": { source: "iana" },
    "audio/gsm-efr": { source: "iana" },
    "audio/gsm-hr-08": { source: "iana" },
    "audio/ilbc": { source: "iana" },
    "audio/ip-mr_v2.5": { source: "iana" },
    "audio/isac": { source: "apache" },
    "audio/l16": { source: "iana" },
    "audio/l20": { source: "iana" },
    "audio/l24": { source: "iana", compressible: !1 },
    "audio/l8": { source: "iana" },
    "audio/lpc": { source: "iana" },
    "audio/melp": { source: "iana" },
    "audio/melp1200": { source: "iana" },
    "audio/melp2400": { source: "iana" },
    "audio/melp600": { source: "iana" },
    "audio/mhas": { source: "iana" },
    "audio/midi": {
      source: "apache",
      extensions: ["mid", "midi", "kar", "rmi"],
    },
    "audio/mobile-xmf": { source: "iana", extensions: ["mxmf"] },
    "audio/mp3": { compressible: !1, extensions: ["mp3"] },
    "audio/mp4": {
      source: "iana",
      compressible: !1,
      extensions: ["m4a", "mp4a"],
    },
    "audio/mp4a-latm": { source: "iana" },
    "audio/mpa": { source: "iana" },
    "audio/mpa-robust": { source: "iana" },
    "audio/mpeg": {
      source: "iana",
      compressible: !1,
      extensions: ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"],
    },
    "audio/mpeg4-generic": { source: "iana" },
    "audio/musepack": { source: "apache" },
    "audio/ogg": {
      source: "iana",
      compressible: !1,
      extensions: ["oga", "ogg", "spx", "opus"],
    },
    "audio/opus": { source: "iana" },
    "audio/parityfec": { source: "iana" },
    "audio/pcma": { source: "iana" },
    "audio/pcma-wb": { source: "iana" },
    "audio/pcmu": { source: "iana" },
    "audio/pcmu-wb": { source: "iana" },
    "audio/prs.sid": { source: "iana" },
    "audio/qcelp": { source: "iana" },
    "audio/raptorfec": { source: "iana" },
    "audio/red": { source: "iana" },
    "audio/rtp-enc-aescm128": { source: "iana" },
    "audio/rtp-midi": { source: "iana" },
    "audio/rtploopback": { source: "iana" },
    "audio/rtx": { source: "iana" },
    "audio/s3m": { source: "apache", extensions: ["s3m"] },
    "audio/scip": { source: "iana" },
    "audio/silk": { source: "apache", extensions: ["sil"] },
    "audio/smv": { source: "iana" },
    "audio/smv-qcp": { source: "iana" },
    "audio/smv0": { source: "iana" },
    "audio/sofa": { source: "iana" },
    "audio/sp-midi": { source: "iana" },
    "audio/speex": { source: "iana" },
    "audio/t140c": { source: "iana" },
    "audio/t38": { source: "iana" },
    "audio/telephone-event": { source: "iana" },
    "audio/tetra_acelp": { source: "iana" },
    "audio/tetra_acelp_bb": { source: "iana" },
    "audio/tone": { source: "iana" },
    "audio/tsvcis": { source: "iana" },
    "audio/uemclip": { source: "iana" },
    "audio/ulpfec": { source: "iana" },
    "audio/usac": { source: "iana" },
    "audio/vdvi": { source: "iana" },
    "audio/vmr-wb": { source: "iana" },
    "audio/vnd.3gpp.iufp": { source: "iana" },
    "audio/vnd.4sb": { source: "iana" },
    "audio/vnd.audiokoz": { source: "iana" },
    "audio/vnd.celp": { source: "iana" },
    "audio/vnd.cisco.nse": { source: "iana" },
    "audio/vnd.cmles.radio-events": { source: "iana" },
    "audio/vnd.cns.anp1": { source: "iana" },
    "audio/vnd.cns.inf1": { source: "iana" },
    "audio/vnd.dece.audio": { source: "iana", extensions: ["uva", "uvva"] },
    "audio/vnd.digital-winds": { source: "iana", extensions: ["eol"] },
    "audio/vnd.dlna.adts": { source: "iana" },
    "audio/vnd.dolby.heaac.1": { source: "iana" },
    "audio/vnd.dolby.heaac.2": { source: "iana" },
    "audio/vnd.dolby.mlp": { source: "iana" },
    "audio/vnd.dolby.mps": { source: "iana" },
    "audio/vnd.dolby.pl2": { source: "iana" },
    "audio/vnd.dolby.pl2x": { source: "iana" },
    "audio/vnd.dolby.pl2z": { source: "iana" },
    "audio/vnd.dolby.pulse.1": { source: "iana" },
    "audio/vnd.dra": { source: "iana", extensions: ["dra"] },
    "audio/vnd.dts": { source: "iana", extensions: ["dts"] },
    "audio/vnd.dts.hd": { source: "iana", extensions: ["dtshd"] },
    "audio/vnd.dts.uhd": { source: "iana" },
    "audio/vnd.dvb.file": { source: "iana" },
    "audio/vnd.everad.plj": { source: "iana" },
    "audio/vnd.hns.audio": { source: "iana" },
    "audio/vnd.lucent.voice": { source: "iana", extensions: ["lvp"] },
    "audio/vnd.ms-playready.media.pya": { source: "iana", extensions: ["pya"] },
    "audio/vnd.nokia.mobile-xmf": { source: "iana" },
    "audio/vnd.nortel.vbk": { source: "iana" },
    "audio/vnd.nuera.ecelp4800": { source: "iana", extensions: ["ecelp4800"] },
    "audio/vnd.nuera.ecelp7470": { source: "iana", extensions: ["ecelp7470"] },
    "audio/vnd.nuera.ecelp9600": { source: "iana", extensions: ["ecelp9600"] },
    "audio/vnd.octel.sbc": { source: "iana" },
    "audio/vnd.presonus.multitrack": { source: "iana" },
    "audio/vnd.qcelp": { source: "iana" },
    "audio/vnd.rhetorex.32kadpcm": { source: "iana" },
    "audio/vnd.rip": { source: "iana", extensions: ["rip"] },
    "audio/vnd.rn-realaudio": { compressible: !1 },
    "audio/vnd.sealedmedia.softseal.mpeg": { source: "iana" },
    "audio/vnd.vmx.cvsd": { source: "iana" },
    "audio/vnd.wave": { compressible: !1 },
    "audio/vorbis": { source: "iana", compressible: !1 },
    "audio/vorbis-config": { source: "iana" },
    "audio/wav": { compressible: !1, extensions: ["wav"] },
    "audio/wave": { compressible: !1, extensions: ["wav"] },
    "audio/webm": { source: "apache", compressible: !1, extensions: ["weba"] },
    "audio/x-aac": { source: "apache", compressible: !1, extensions: ["aac"] },
    "audio/x-aiff": { source: "apache", extensions: ["aif", "aiff", "aifc"] },
    "audio/x-caf": { source: "apache", compressible: !1, extensions: ["caf"] },
    "audio/x-flac": { source: "apache", extensions: ["flac"] },
    "audio/x-m4a": { source: "nginx", extensions: ["m4a"] },
    "audio/x-matroska": { source: "apache", extensions: ["mka"] },
    "audio/x-mpegurl": { source: "apache", extensions: ["m3u"] },
    "audio/x-ms-wax": { source: "apache", extensions: ["wax"] },
    "audio/x-ms-wma": { source: "apache", extensions: ["wma"] },
    "audio/x-pn-realaudio": { source: "apache", extensions: ["ram", "ra"] },
    "audio/x-pn-realaudio-plugin": { source: "apache", extensions: ["rmp"] },
    "audio/x-realaudio": { source: "nginx", extensions: ["ra"] },
    "audio/x-tta": { source: "apache" },
    "audio/x-wav": { source: "apache", extensions: ["wav"] },
    "audio/xm": { source: "apache", extensions: ["xm"] },
    "chemical/x-cdx": { source: "apache", extensions: ["cdx"] },
    "chemical/x-cif": { source: "apache", extensions: ["cif"] },
    "chemical/x-cmdf": { source: "apache", extensions: ["cmdf"] },
    "chemical/x-cml": { source: "apache", extensions: ["cml"] },
    "chemical/x-csml": { source: "apache", extensions: ["csml"] },
    "chemical/x-pdb": { source: "apache" },
    "chemical/x-xyz": { source: "apache", extensions: ["xyz"] },
    "font/collection": { source: "iana", extensions: ["ttc"] },
    "font/otf": { source: "iana", compressible: !0, extensions: ["otf"] },
    "font/sfnt": { source: "iana" },
    "font/ttf": { source: "iana", compressible: !0, extensions: ["ttf"] },
    "font/woff": { source: "iana", extensions: ["woff"] },
    "font/woff2": { source: "iana", extensions: ["woff2"] },
    "image/aces": { source: "iana", extensions: ["exr"] },
    "image/apng": { compressible: !1, extensions: ["apng"] },
    "image/avci": { source: "iana", extensions: ["avci"] },
    "image/avcs": { source: "iana", extensions: ["avcs"] },
    "image/avif": { source: "iana", compressible: !1, extensions: ["avif"] },
    "image/bmp": { source: "iana", compressible: !0, extensions: ["bmp"] },
    "image/cgm": { source: "iana", extensions: ["cgm"] },
    "image/dicom-rle": { source: "iana", extensions: ["drle"] },
    "image/emf": { source: "iana", extensions: ["emf"] },
    "image/fits": { source: "iana", extensions: ["fits"] },
    "image/g3fax": { source: "iana", extensions: ["g3"] },
    "image/gif": { source: "iana", compressible: !1, extensions: ["gif"] },
    "image/heic": { source: "iana", extensions: ["heic"] },
    "image/heic-sequence": { source: "iana", extensions: ["heics"] },
    "image/heif": { source: "iana", extensions: ["heif"] },
    "image/heif-sequence": { source: "iana", extensions: ["heifs"] },
    "image/hej2k": { source: "iana", extensions: ["hej2"] },
    "image/hsj2": { source: "iana", extensions: ["hsj2"] },
    "image/ief": { source: "iana", extensions: ["ief"] },
    "image/jls": { source: "iana", extensions: ["jls"] },
    "image/jp2": {
      source: "iana",
      compressible: !1,
      extensions: ["jp2", "jpg2"],
    },
    "image/jpeg": {
      source: "iana",
      compressible: !1,
      extensions: ["jpeg", "jpg", "jpe"],
    },
    "image/jph": { source: "iana", extensions: ["jph"] },
    "image/jphc": { source: "iana", extensions: ["jhc"] },
    "image/jpm": { source: "iana", compressible: !1, extensions: ["jpm"] },
    "image/jpx": {
      source: "iana",
      compressible: !1,
      extensions: ["jpx", "jpf"],
    },
    "image/jxr": { source: "iana", extensions: ["jxr"] },
    "image/jxra": { source: "iana", extensions: ["jxra"] },
    "image/jxrs": { source: "iana", extensions: ["jxrs"] },
    "image/jxs": { source: "iana", extensions: ["jxs"] },
    "image/jxsc": { source: "iana", extensions: ["jxsc"] },
    "image/jxsi": { source: "iana", extensions: ["jxsi"] },
    "image/jxss": { source: "iana", extensions: ["jxss"] },
    "image/ktx": { source: "iana", extensions: ["ktx"] },
    "image/ktx2": { source: "iana", extensions: ["ktx2"] },
    "image/naplps": { source: "iana" },
    "image/pjpeg": { compressible: !1 },
    "image/png": { source: "iana", compressible: !1, extensions: ["png"] },
    "image/prs.btif": { source: "iana", extensions: ["btif"] },
    "image/prs.pti": { source: "iana", extensions: ["pti"] },
    "image/pwg-raster": { source: "iana" },
    "image/sgi": { source: "apache", extensions: ["sgi"] },
    "image/svg+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["svg", "svgz"],
    },
    "image/t38": { source: "iana", extensions: ["t38"] },
    "image/tiff": {
      source: "iana",
      compressible: !1,
      extensions: ["tif", "tiff"],
    },
    "image/tiff-fx": { source: "iana", extensions: ["tfx"] },
    "image/vnd.adobe.photoshop": {
      source: "iana",
      compressible: !0,
      extensions: ["psd"],
    },
    "image/vnd.airzip.accelerator.azv": { source: "iana", extensions: ["azv"] },
    "image/vnd.cns.inf2": { source: "iana" },
    "image/vnd.dece.graphic": {
      source: "iana",
      extensions: ["uvi", "uvvi", "uvg", "uvvg"],
    },
    "image/vnd.djvu": { source: "iana", extensions: ["djvu", "djv"] },
    "image/vnd.dvb.subtitle": { source: "iana", extensions: ["sub"] },
    "image/vnd.dwg": { source: "iana", extensions: ["dwg"] },
    "image/vnd.dxf": { source: "iana", extensions: ["dxf"] },
    "image/vnd.fastbidsheet": { source: "iana", extensions: ["fbs"] },
    "image/vnd.fpx": { source: "iana", extensions: ["fpx"] },
    "image/vnd.fst": { source: "iana", extensions: ["fst"] },
    "image/vnd.fujixerox.edmics-mmr": { source: "iana", extensions: ["mmr"] },
    "image/vnd.fujixerox.edmics-rlc": { source: "iana", extensions: ["rlc"] },
    "image/vnd.globalgraphics.pgb": { source: "iana" },
    "image/vnd.microsoft.icon": {
      source: "iana",
      compressible: !0,
      extensions: ["ico"],
    },
    "image/vnd.mix": { source: "iana" },
    "image/vnd.mozilla.apng": { source: "iana" },
    "image/vnd.ms-dds": { compressible: !0, extensions: ["dds"] },
    "image/vnd.ms-modi": { source: "iana", extensions: ["mdi"] },
    "image/vnd.ms-photo": { source: "apache", extensions: ["wdp"] },
    "image/vnd.net-fpx": { source: "iana", extensions: ["npx"] },
    "image/vnd.pco.b16": { source: "iana", extensions: ["b16"] },
    "image/vnd.radiance": { source: "iana" },
    "image/vnd.sealed.png": { source: "iana" },
    "image/vnd.sealedmedia.softseal.gif": { source: "iana" },
    "image/vnd.sealedmedia.softseal.jpg": { source: "iana" },
    "image/vnd.svf": { source: "iana" },
    "image/vnd.tencent.tap": { source: "iana", extensions: ["tap"] },
    "image/vnd.valve.source.texture": { source: "iana", extensions: ["vtf"] },
    "image/vnd.wap.wbmp": { source: "iana", extensions: ["wbmp"] },
    "image/vnd.xiff": { source: "iana", extensions: ["xif"] },
    "image/vnd.zbrush.pcx": { source: "iana", extensions: ["pcx"] },
    "image/webp": { source: "apache", extensions: ["webp"] },
    "image/wmf": { source: "iana", extensions: ["wmf"] },
    "image/x-3ds": { source: "apache", extensions: ["3ds"] },
    "image/x-cmu-raster": { source: "apache", extensions: ["ras"] },
    "image/x-cmx": { source: "apache", extensions: ["cmx"] },
    "image/x-freehand": {
      source: "apache",
      extensions: ["fh", "fhc", "fh4", "fh5", "fh7"],
    },
    "image/x-icon": { source: "apache", compressible: !0, extensions: ["ico"] },
    "image/x-jng": { source: "nginx", extensions: ["jng"] },
    "image/x-mrsid-image": { source: "apache", extensions: ["sid"] },
    "image/x-ms-bmp": {
      source: "nginx",
      compressible: !0,
      extensions: ["bmp"],
    },
    "image/x-pcx": { source: "apache", extensions: ["pcx"] },
    "image/x-pict": { source: "apache", extensions: ["pic", "pct"] },
    "image/x-portable-anymap": { source: "apache", extensions: ["pnm"] },
    "image/x-portable-bitmap": { source: "apache", extensions: ["pbm"] },
    "image/x-portable-graymap": { source: "apache", extensions: ["pgm"] },
    "image/x-portable-pixmap": { source: "apache", extensions: ["ppm"] },
    "image/x-rgb": { source: "apache", extensions: ["rgb"] },
    "image/x-tga": { source: "apache", extensions: ["tga"] },
    "image/x-xbitmap": { source: "apache", extensions: ["xbm"] },
    "image/x-xcf": { compressible: !1 },
    "image/x-xpixmap": { source: "apache", extensions: ["xpm"] },
    "image/x-xwindowdump": { source: "apache", extensions: ["xwd"] },
    "message/cpim": { source: "iana" },
    "message/delivery-status": { source: "iana" },
    "message/disposition-notification": {
      source: "iana",
      extensions: ["disposition-notification"],
    },
    "message/external-body": { source: "iana" },
    "message/feedback-report": { source: "iana" },
    "message/global": { source: "iana", extensions: ["u8msg"] },
    "message/global-delivery-status": { source: "iana", extensions: ["u8dsn"] },
    "message/global-disposition-notification": {
      source: "iana",
      extensions: ["u8mdn"],
    },
    "message/global-headers": { source: "iana", extensions: ["u8hdr"] },
    "message/http": { source: "iana", compressible: !1 },
    "message/imdn+xml": { source: "iana", compressible: !0 },
    "message/news": { source: "iana" },
    "message/partial": { source: "iana", compressible: !1 },
    "message/rfc822": {
      source: "iana",
      compressible: !0,
      extensions: ["eml", "mime"],
    },
    "message/s-http": { source: "iana" },
    "message/sip": { source: "iana" },
    "message/sipfrag": { source: "iana" },
    "message/tracking-status": { source: "iana" },
    "message/vnd.si.simp": { source: "iana" },
    "message/vnd.wfa.wsc": { source: "iana", extensions: ["wsc"] },
    "model/3mf": { source: "iana", extensions: ["3mf"] },
    "model/e57": { source: "iana" },
    "model/gltf+json": {
      source: "iana",
      compressible: !0,
      extensions: ["gltf"],
    },
    "model/gltf-binary": {
      source: "iana",
      compressible: !0,
      extensions: ["glb"],
    },
    "model/iges": {
      source: "iana",
      compressible: !1,
      extensions: ["igs", "iges"],
    },
    "model/mesh": {
      source: "iana",
      compressible: !1,
      extensions: ["msh", "mesh", "silo"],
    },
    "model/mtl": { source: "iana", extensions: ["mtl"] },
    "model/obj": { source: "iana", extensions: ["obj"] },
    "model/step": { source: "iana" },
    "model/step+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["stpx"],
    },
    "model/step+zip": {
      source: "iana",
      compressible: !1,
      extensions: ["stpz"],
    },
    "model/step-xml+zip": {
      source: "iana",
      compressible: !1,
      extensions: ["stpxz"],
    },
    "model/stl": { source: "iana", extensions: ["stl"] },
    "model/vnd.collada+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["dae"],
    },
    "model/vnd.dwf": { source: "iana", extensions: ["dwf"] },
    "model/vnd.flatland.3dml": { source: "iana" },
    "model/vnd.gdl": { source: "iana", extensions: ["gdl"] },
    "model/vnd.gs-gdl": { source: "apache" },
    "model/vnd.gs.gdl": { source: "iana" },
    "model/vnd.gtw": { source: "iana", extensions: ["gtw"] },
    "model/vnd.moml+xml": { source: "iana", compressible: !0 },
    "model/vnd.mts": { source: "iana", extensions: ["mts"] },
    "model/vnd.opengex": { source: "iana", extensions: ["ogex"] },
    "model/vnd.parasolid.transmit.binary": {
      source: "iana",
      extensions: ["x_b"],
    },
    "model/vnd.parasolid.transmit.text": {
      source: "iana",
      extensions: ["x_t"],
    },
    "model/vnd.pytha.pyox": { source: "iana" },
    "model/vnd.rosette.annotated-data-model": { source: "iana" },
    "model/vnd.sap.vds": { source: "iana", extensions: ["vds"] },
    "model/vnd.usdz+zip": {
      source: "iana",
      compressible: !1,
      extensions: ["usdz"],
    },
    "model/vnd.valve.source.compiled-map": {
      source: "iana",
      extensions: ["bsp"],
    },
    "model/vnd.vtu": { source: "iana", extensions: ["vtu"] },
    "model/vrml": {
      source: "iana",
      compressible: !1,
      extensions: ["wrl", "vrml"],
    },
    "model/x3d+binary": {
      source: "apache",
      compressible: !1,
      extensions: ["x3db", "x3dbz"],
    },
    "model/x3d+fastinfoset": { source: "iana", extensions: ["x3db"] },
    "model/x3d+vrml": {
      source: "apache",
      compressible: !1,
      extensions: ["x3dv", "x3dvz"],
    },
    "model/x3d+xml": {
      source: "iana",
      compressible: !0,
      extensions: ["x3d", "x3dz"],
    },
    "model/x3d-vrml": { source: "iana", extensions: ["x3dv"] },
    "multipart/alternative": { source: "iana", compressible: !1 },
    "multipart/appledouble": { source: "iana" },
    "multipart/byteranges": { source: "iana" },
    "multipart/digest": { source: "iana" },
    "multipart/encrypted": { source: "iana", compressible: !1 },
    "multipart/form-data": { source: "iana", compressible: !1 },
    "multipart/header-set": { source: "iana" },
    "multipart/mixed": { source: "iana" },
    "multipart/multilingual": { source: "iana" },
    "multipart/parallel": { source: "iana" },
    "multipart/related": { source: "iana", compressible: !1 },
    "multipart/report": { source: "iana" },
    "multipart/signed": { source: "iana", compressible: !1 },
    "multipart/vnd.bint.med-plus": { source: "iana" },
    "multipart/voice-message": { source: "iana" },
    "multipart/x-mixed-replace": { source: "iana" },
    "text/1d-interleaved-parityfec": { source: "iana" },
    "text/cache-manifest": {
      source: "iana",
      compressible: !0,
      extensions: ["appcache", "manifest"],
    },
    "text/calendar": { source: "iana", extensions: ["ics", "ifb"] },
    "text/calender": { compressible: !0 },
    "text/cmd": { compressible: !0 },
    "text/coffeescript": { extensions: ["coffee", "litcoffee"] },
    "text/cql": { source: "iana" },
    "text/cql-expression": { source: "iana" },
    "text/cql-identifier": { source: "iana" },
    "text/css": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
      extensions: ["css"],
    },
    "text/csv": { source: "iana", compressible: !0, extensions: ["csv"] },
    "text/csv-schema": { source: "iana" },
    "text/directory": { source: "iana" },
    "text/dns": { source: "iana" },
    "text/ecmascript": { source: "iana" },
    "text/encaprtp": { source: "iana" },
    "text/enriched": { source: "iana" },
    "text/fhirpath": { source: "iana" },
    "text/flexfec": { source: "iana" },
    "text/fwdred": { source: "iana" },
    "text/gff3": { source: "iana" },
    "text/grammar-ref-list": { source: "iana" },
    "text/html": {
      source: "iana",
      compressible: !0,
      extensions: ["html", "htm", "shtml"],
    },
    "text/jade": { extensions: ["jade"] },
    "text/javascript": { source: "iana", compressible: !0 },
    "text/jcr-cnd": { source: "iana" },
    "text/jsx": { compressible: !0, extensions: ["jsx"] },
    "text/less": { compressible: !0, extensions: ["less"] },
    "text/markdown": {
      source: "iana",
      compressible: !0,
      extensions: ["markdown", "md"],
    },
    "text/mathml": { source: "nginx", extensions: ["mml"] },
    "text/mdx": { compressible: !0, extensions: ["mdx"] },
    "text/mizar": { source: "iana" },
    "text/n3": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
      extensions: ["n3"],
    },
    "text/parameters": { source: "iana", charset: "UTF-8" },
    "text/parityfec": { source: "iana" },
    "text/plain": {
      source: "iana",
      compressible: !0,
      extensions: ["txt", "text", "conf", "def", "list", "log", "in", "ini"],
    },
    "text/provenance-notation": { source: "iana", charset: "UTF-8" },
    "text/prs.fallenstein.rst": { source: "iana" },
    "text/prs.lines.tag": { source: "iana", extensions: ["dsc"] },
    "text/prs.prop.logic": { source: "iana" },
    "text/raptorfec": { source: "iana" },
    "text/red": { source: "iana" },
    "text/rfc822-headers": { source: "iana" },
    "text/richtext": { source: "iana", compressible: !0, extensions: ["rtx"] },
    "text/rtf": { source: "iana", compressible: !0, extensions: ["rtf"] },
    "text/rtp-enc-aescm128": { source: "iana" },
    "text/rtploopback": { source: "iana" },
    "text/rtx": { source: "iana" },
    "text/sgml": { source: "iana", extensions: ["sgml", "sgm"] },
    "text/shaclc": { source: "iana" },
    "text/shex": { source: "iana", extensions: ["shex"] },
    "text/slim": { extensions: ["slim", "slm"] },
    "text/spdx": { source: "iana", extensions: ["spdx"] },
    "text/strings": { source: "iana" },
    "text/stylus": { extensions: ["stylus", "styl"] },
    "text/t140": { source: "iana" },
    "text/tab-separated-values": {
      source: "iana",
      compressible: !0,
      extensions: ["tsv"],
    },
    "text/troff": {
      source: "iana",
      extensions: ["t", "tr", "roff", "man", "me", "ms"],
    },
    "text/turtle": { source: "iana", charset: "UTF-8", extensions: ["ttl"] },
    "text/ulpfec": { source: "iana" },
    "text/uri-list": {
      source: "iana",
      compressible: !0,
      extensions: ["uri", "uris", "urls"],
    },
    "text/vcard": { source: "iana", compressible: !0, extensions: ["vcard"] },
    "text/vnd.a": { source: "iana" },
    "text/vnd.abc": { source: "iana" },
    "text/vnd.ascii-art": { source: "iana" },
    "text/vnd.curl": { source: "iana", extensions: ["curl"] },
    "text/vnd.curl.dcurl": { source: "apache", extensions: ["dcurl"] },
    "text/vnd.curl.mcurl": { source: "apache", extensions: ["mcurl"] },
    "text/vnd.curl.scurl": { source: "apache", extensions: ["scurl"] },
    "text/vnd.debian.copyright": { source: "iana", charset: "UTF-8" },
    "text/vnd.dmclientscript": { source: "iana" },
    "text/vnd.dvb.subtitle": { source: "iana", extensions: ["sub"] },
    "text/vnd.esmertec.theme-descriptor": { source: "iana", charset: "UTF-8" },
    "text/vnd.familysearch.gedcom": { source: "iana", extensions: ["ged"] },
    "text/vnd.ficlab.flt": { source: "iana" },
    "text/vnd.fly": { source: "iana", extensions: ["fly"] },
    "text/vnd.fmi.flexstor": { source: "iana", extensions: ["flx"] },
    "text/vnd.gml": { source: "iana" },
    "text/vnd.graphviz": { source: "iana", extensions: ["gv"] },
    "text/vnd.hans": { source: "iana" },
    "text/vnd.hgl": { source: "iana" },
    "text/vnd.in3d.3dml": { source: "iana", extensions: ["3dml"] },
    "text/vnd.in3d.spot": { source: "iana", extensions: ["spot"] },
    "text/vnd.iptc.newsml": { source: "iana" },
    "text/vnd.iptc.nitf": { source: "iana" },
    "text/vnd.latex-z": { source: "iana" },
    "text/vnd.motorola.reflex": { source: "iana" },
    "text/vnd.ms-mediapackage": { source: "iana" },
    "text/vnd.net2phone.commcenter.command": { source: "iana" },
    "text/vnd.radisys.msml-basic-layout": { source: "iana" },
    "text/vnd.senx.warpscript": { source: "iana" },
    "text/vnd.si.uricatalogue": { source: "iana" },
    "text/vnd.sosi": { source: "iana" },
    "text/vnd.sun.j2me.app-descriptor": {
      source: "iana",
      charset: "UTF-8",
      extensions: ["jad"],
    },
    "text/vnd.trolltech.linguist": { source: "iana", charset: "UTF-8" },
    "text/vnd.wap.si": { source: "iana" },
    "text/vnd.wap.sl": { source: "iana" },
    "text/vnd.wap.wml": { source: "iana", extensions: ["wml"] },
    "text/vnd.wap.wmlscript": { source: "iana", extensions: ["wmls"] },
    "text/vtt": {
      source: "iana",
      charset: "UTF-8",
      compressible: !0,
      extensions: ["vtt"],
    },
    "text/x-asm": { source: "apache", extensions: ["s", "asm"] },
    "text/x-c": {
      source: "apache",
      extensions: ["c", "cc", "cxx", "cpp", "h", "hh", "dic"],
    },
    "text/x-component": { source: "nginx", extensions: ["htc"] },
    "text/x-fortran": {
      source: "apache",
      extensions: ["f", "for", "f77", "f90"],
    },
    "text/x-gwt-rpc": { compressible: !0 },
    "text/x-handlebars-template": { extensions: ["hbs"] },
    "text/x-java-source": { source: "apache", extensions: ["java"] },
    "text/x-jquery-tmpl": { compressible: !0 },
    "text/x-lua": { extensions: ["lua"] },
    "text/x-markdown": { compressible: !0, extensions: ["mkd"] },
    "text/x-nfo": { source: "apache", extensions: ["nfo"] },
    "text/x-opml": { source: "apache", extensions: ["opml"] },
    "text/x-org": { compressible: !0, extensions: ["org"] },
    "text/x-pascal": { source: "apache", extensions: ["p", "pas"] },
    "text/x-processing": { compressible: !0, extensions: ["pde"] },
    "text/x-sass": { extensions: ["sass"] },
    "text/x-scss": { extensions: ["scss"] },
    "text/x-setext": { source: "apache", extensions: ["etx"] },
    "text/x-sfv": { source: "apache", extensions: ["sfv"] },
    "text/x-suse-ymp": { compressible: !0, extensions: ["ymp"] },
    "text/x-uuencode": { source: "apache", extensions: ["uu"] },
    "text/x-vcalendar": { source: "apache", extensions: ["vcs"] },
    "text/x-vcard": { source: "apache", extensions: ["vcf"] },
    "text/xml": { source: "iana", compressible: !0, extensions: ["xml"] },
    "text/xml-external-parsed-entity": { source: "iana" },
    "text/yaml": { compressible: !0, extensions: ["yaml", "yml"] },
    "video/1d-interleaved-parityfec": { source: "iana" },
    "video/3gpp": { source: "iana", extensions: ["3gp", "3gpp"] },
    "video/3gpp-tt": { source: "iana" },
    "video/3gpp2": { source: "iana", extensions: ["3g2"] },
    "video/av1": { source: "iana" },
    "video/bmpeg": { source: "iana" },
    "video/bt656": { source: "iana" },
    "video/celb": { source: "iana" },
    "video/dv": { source: "iana" },
    "video/encaprtp": { source: "iana" },
    "video/ffv1": { source: "iana" },
    "video/flexfec": { source: "iana" },
    "video/h261": { source: "iana", extensions: ["h261"] },
    "video/h263": { source: "iana", extensions: ["h263"] },
    "video/h263-1998": { source: "iana" },
    "video/h263-2000": { source: "iana" },
    "video/h264": { source: "iana", extensions: ["h264"] },
    "video/h264-rcdo": { source: "iana" },
    "video/h264-svc": { source: "iana" },
    "video/h265": { source: "iana" },
    "video/iso.segment": { source: "iana", extensions: ["m4s"] },
    "video/jpeg": { source: "iana", extensions: ["jpgv"] },
    "video/jpeg2000": { source: "iana" },
    "video/jpm": { source: "apache", extensions: ["jpm", "jpgm"] },
    "video/jxsv": { source: "iana" },
    "video/mj2": { source: "iana", extensions: ["mj2", "mjp2"] },
    "video/mp1s": { source: "iana" },
    "video/mp2p": { source: "iana" },
    "video/mp2t": { source: "iana", extensions: ["ts"] },
    "video/mp4": {
      source: "iana",
      compressible: !1,
      extensions: ["mp4", "mp4v", "mpg4"],
    },
    "video/mp4v-es": { source: "iana" },
    "video/mpeg": {
      source: "iana",
      compressible: !1,
      extensions: ["mpeg", "mpg", "mpe", "m1v", "m2v"],
    },
    "video/mpeg4-generic": { source: "iana" },
    "video/mpv": { source: "iana" },
    "video/nv": { source: "iana" },
    "video/ogg": { source: "iana", compressible: !1, extensions: ["ogv"] },
    "video/parityfec": { source: "iana" },
    "video/pointer": { source: "iana" },
    "video/quicktime": {
      source: "iana",
      compressible: !1,
      extensions: ["qt", "mov"],
    },
    "video/raptorfec": { source: "iana" },
    "video/raw": { source: "iana" },
    "video/rtp-enc-aescm128": { source: "iana" },
    "video/rtploopback": { source: "iana" },
    "video/rtx": { source: "iana" },
    "video/scip": { source: "iana" },
    "video/smpte291": { source: "iana" },
    "video/smpte292m": { source: "iana" },
    "video/ulpfec": { source: "iana" },
    "video/vc1": { source: "iana" },
    "video/vc2": { source: "iana" },
    "video/vnd.cctv": { source: "iana" },
    "video/vnd.dece.hd": { source: "iana", extensions: ["uvh", "uvvh"] },
    "video/vnd.dece.mobile": { source: "iana", extensions: ["uvm", "uvvm"] },
    "video/vnd.dece.mp4": { source: "iana" },
    "video/vnd.dece.pd": { source: "iana", extensions: ["uvp", "uvvp"] },
    "video/vnd.dece.sd": { source: "iana", extensions: ["uvs", "uvvs"] },
    "video/vnd.dece.video": { source: "iana", extensions: ["uvv", "uvvv"] },
    "video/vnd.directv.mpeg": { source: "iana" },
    "video/vnd.directv.mpeg-tts": { source: "iana" },
    "video/vnd.dlna.mpeg-tts": { source: "iana" },
    "video/vnd.dvb.file": { source: "iana", extensions: ["dvb"] },
    "video/vnd.fvt": { source: "iana", extensions: ["fvt"] },
    "video/vnd.hns.video": { source: "iana" },
    "video/vnd.iptvforum.1dparityfec-1010": { source: "iana" },
    "video/vnd.iptvforum.1dparityfec-2005": { source: "iana" },
    "video/vnd.iptvforum.2dparityfec-1010": { source: "iana" },
    "video/vnd.iptvforum.2dparityfec-2005": { source: "iana" },
    "video/vnd.iptvforum.ttsavc": { source: "iana" },
    "video/vnd.iptvforum.ttsmpeg2": { source: "iana" },
    "video/vnd.motorola.video": { source: "iana" },
    "video/vnd.motorola.videop": { source: "iana" },
    "video/vnd.mpegurl": { source: "iana", extensions: ["mxu", "m4u"] },
    "video/vnd.ms-playready.media.pyv": { source: "iana", extensions: ["pyv"] },
    "video/vnd.nokia.interleaved-multimedia": { source: "iana" },
    "video/vnd.nokia.mp4vr": { source: "iana" },
    "video/vnd.nokia.videovoip": { source: "iana" },
    "video/vnd.objectvideo": { source: "iana" },
    "video/vnd.radgamettools.bink": { source: "iana" },
    "video/vnd.radgamettools.smacker": { source: "iana" },
    "video/vnd.sealed.mpeg1": { source: "iana" },
    "video/vnd.sealed.mpeg4": { source: "iana" },
    "video/vnd.sealed.swf": { source: "iana" },
    "video/vnd.sealedmedia.softseal.mov": { source: "iana" },
    "video/vnd.uvvu.mp4": { source: "iana", extensions: ["uvu", "uvvu"] },
    "video/vnd.vivo": { source: "iana", extensions: ["viv"] },
    "video/vnd.youtube.yt": { source: "iana" },
    "video/vp8": { source: "iana" },
    "video/vp9": { source: "iana" },
    "video/webm": { source: "apache", compressible: !1, extensions: ["webm"] },
    "video/x-f4v": { source: "apache", extensions: ["f4v"] },
    "video/x-fli": { source: "apache", extensions: ["fli"] },
    "video/x-flv": { source: "apache", compressible: !1, extensions: ["flv"] },
    "video/x-m4v": { source: "apache", extensions: ["m4v"] },
    "video/x-matroska": {
      source: "apache",
      compressible: !1,
      extensions: ["mkv", "mk3d", "mks"],
    },
    "video/x-mng": { source: "apache", extensions: ["mng"] },
    "video/x-ms-asf": { source: "apache", extensions: ["asf", "asx"] },
    "video/x-ms-vob": { source: "apache", extensions: ["vob"] },
    "video/x-ms-wm": { source: "apache", extensions: ["wm"] },
    "video/x-ms-wmv": {
      source: "apache",
      compressible: !1,
      extensions: ["wmv"],
    },
    "video/x-ms-wmx": { source: "apache", extensions: ["wmx"] },
    "video/x-ms-wvx": { source: "apache", extensions: ["wvx"] },
    "video/x-msvideo": { source: "apache", extensions: ["avi"] },
    "video/x-sgi-movie": { source: "apache", extensions: ["movie"] },
    "video/x-smv": { source: "apache", extensions: ["smv"] },
    "x-conference/x-cooltalk": { source: "apache", extensions: ["ice"] },
    "x-shader/x-fragment": { compressible: !0 },
    "x-shader/x-vertex": { compressible: !0 },
  };
(({
  get exports() {
    return k;
  },
  set exports(e) {
    k = e;
  },
}).exports = j),
  /*!
   * mime-types
   * Copyright(c) 2014 Jonathan Ong
   * Copyright(c) 2015 Douglas Christopher Wilson
   * MIT Licensed
   */
  (function (e) {
    var n,
      t,
      i,
      o = k,
      s = a.extname,
      r = /^\s*([^;\s]*)(?:;|\s|$)/,
      c = /^text\//i;
    function p(e) {
      if (!e || "string" != typeof e) return !1;
      var n = r.exec(e),
        a = n && o[n[1].toLowerCase()];
      return a && a.charset ? a.charset : !(!n || !c.test(n[1])) && "UTF-8";
    }
    (e.charset = p),
      (e.charsets = { lookup: p }),
      (e.contentType = function (n) {
        if (!n || "string" != typeof n) return !1;
        var a = -1 === n.indexOf("/") ? e.lookup(n) : n;
        if (!a) return !1;
        if (-1 === a.indexOf("charset")) {
          var t = e.charset(a);
          t && (a += "; charset=" + t.toLowerCase());
        }
        return a;
      }),
      (e.extension = function (n) {
        if (!n || "string" != typeof n) return !1;
        var a = r.exec(n),
          t = a && e.extensions[a[1].toLowerCase()];
        if (!t || !t.length) return !1;
        return t[0];
      }),
      (e.extensions = Object.create(null)),
      (e.lookup = function (n) {
        if (!n || "string" != typeof n) return !1;
        var a = s("x." + n)
          .toLowerCase()
          .substr(1);
        if (!a) return !1;
        return e.types[a] || !1;
      }),
      (e.types = Object.create(null)),
      (n = e.extensions),
      (t = e.types),
      (i = ["nginx", "apache", void 0, "iana"]),
      Object.keys(o).forEach(function (e) {
        var a = o[e],
          s = a.extensions;
        if (s && s.length) {
          n[e] = s;
          for (var r = 0; r < s.length; r++) {
            var c = s[r];
            if (t[c]) {
              var p = i.indexOf(o[t[c]].source),
                l = i.indexOf(a.source);
              if (
                "application/octet-stream" !== t[c] &&
                (p > l || (p === l && "application/" === t[c].substr(0, 12)))
              )
                continue;
            }
            t[c] = e;
          }
        }
      });
  })(_);
var E = function (e) {
    var n =
      "function" == typeof setImmediate
        ? setImmediate
        : "object" == typeof process && "function" == typeof process.nextTick
        ? process.nextTick
        : null;
    n ? n(e) : setTimeout(e, 0);
  },
  R = function (e) {
    var n = !1;
    return (
      E(function () {
        n = !0;
      }),
      function (a, t) {
        n
          ? e(a, t)
          : E(function () {
              e(a, t);
            });
      }
    );
  };
var C = function (e) {
  Object.keys(e.jobs).forEach(S.bind(e)), (e.jobs = {});
};
function S(e) {
  "function" == typeof this.jobs[e] && this.jobs[e]();
}
var O = R,
  A = C,
  T = function (e, n, a, t) {
    var i = a.keyedList ? a.keyedList[a.index] : a.index;
    a.jobs[i] = (function (e, n, a, t) {
      var i;
      i = 2 == e.length ? e(a, O(t)) : e(a, n, O(t));
      return i;
    })(n, i, e[i], function (e, n) {
      i in a.jobs &&
        (delete a.jobs[i], e ? A(a) : (a.results[i] = n), t(e, a.results));
    });
  };
var F = function (e, n) {
  var a = !Array.isArray(e),
    t = {
      index: 0,
      keyedList: a || n ? Object.keys(e) : null,
      jobs: {},
      results: a ? {} : [],
      size: a ? Object.keys(e).length : e.length,
    };
  n &&
    t.keyedList.sort(
      a
        ? n
        : function (a, t) {
            return n(e[a], e[t]);
          }
    );
  return t;
};
var P = C,
  L = R,
  B = function (e) {
    if (!Object.keys(this.jobs).length) return;
    (this.index = this.size), P(this), L(e)(null, this.results);
  };
var z = T,
  N = F,
  U = B,
  q = function (e, n, a) {
    var t = N(e);
    for (; t.index < (t.keyedList || e).length; )
      z(e, n, t, function (e, n) {
        e ? a(e, n) : 0 !== Object.keys(t.jobs).length || a(null, t.results);
      }),
        t.index++;
    return U.bind(t, a);
  };
var D = {},
  I = T,
  M = F,
  H = B;
function $(e, n) {
  return e < n ? -1 : e > n ? 1 : 0;
}
(({
  get exports() {
    return D;
  },
  set exports(e) {
    D = e;
  },
}).exports = function (e, n, a, t) {
  var i = M(e, a);
  return (
    I(e, n, i, function a(o, s) {
      o
        ? t(o, s)
        : (i.index++,
          i.index < (i.keyedList || e).length
            ? I(e, n, i, a)
            : t(null, i.results));
    }),
    H.bind(i, t)
  );
}),
  (D.ascending = $),
  (D.descending = function (e, n) {
    return -1 * $(e, n);
  });
var W = D;
var G = {
    parallel: q,
    serial: function (e, n, a) {
      return W(e, n, null, a);
    },
    serialOrdered: D,
  },
  V = y,
  J = e,
  K = a,
  Q = t,
  Y = i,
  X = o.parse,
  Z = s,
  ee = n.Stream,
  ne = _,
  ae = G,
  te = function (e, n) {
    return (
      Object.keys(n).forEach(function (a) {
        e[a] = e[a] || n[a];
      }),
      e
    );
  },
  ie = oe;
function oe(e) {
  if (!(this instanceof oe)) return new oe(e);
  for (var n in ((this._overheadLength = 0),
  (this._valueLength = 0),
  (this._valuesToMeasure = []),
  V.call(this),
  (e = e || {})))
    this[n] = e[n];
}
J.inherits(oe, V),
  (oe.LINE_BREAK = "\r\n"),
  (oe.DEFAULT_CONTENT_TYPE = "application/octet-stream"),
  (oe.prototype.append = function (e, n, a) {
    "string" == typeof (a = a || {}) && (a = { filename: a });
    var t = V.prototype.append.bind(this);
    if (("number" == typeof n && (n = "" + n), J.isArray(n)))
      this._error(new Error("Arrays are not supported."));
    else {
      var i = this._multiPartHeader(e, n, a),
        o = this._multiPartFooter();
      t(i), t(n), t(o), this._trackLength(i, n, a);
    }
  }),
  (oe.prototype._trackLength = function (e, n, a) {
    var t = 0;
    null != a.knownLength
      ? (t += +a.knownLength)
      : Buffer.isBuffer(n)
      ? (t = n.length)
      : "string" == typeof n && (t = Buffer.byteLength(n)),
      (this._valueLength += t),
      (this._overheadLength += Buffer.byteLength(e) + oe.LINE_BREAK.length),
      n &&
        (n.path ||
          (n.readable && n.hasOwnProperty("httpVersion")) ||
          n instanceof ee) &&
        (a.knownLength || this._valuesToMeasure.push(n));
  }),
  (oe.prototype._lengthRetriever = function (e, n) {
    e.hasOwnProperty("fd")
      ? null != e.end && e.end != 1 / 0 && null != e.start
        ? n(null, e.end + 1 - (e.start ? e.start : 0))
        : Z.stat(e.path, function (a, t) {
            var i;
            a ? n(a) : ((i = t.size - (e.start ? e.start : 0)), n(null, i));
          })
      : e.hasOwnProperty("httpVersion")
      ? n(null, +e.headers["content-length"])
      : e.hasOwnProperty("httpModule")
      ? (e.on("response", function (a) {
          e.pause(), n(null, +a.headers["content-length"]);
        }),
        e.resume())
      : n("Unknown stream");
  }),
  (oe.prototype._multiPartHeader = function (e, n, a) {
    if ("string" == typeof a.header) return a.header;
    var t,
      i = this._getContentDisposition(n, a),
      o = this._getContentType(n, a),
      s = "",
      r = {
        "Content-Disposition": ["form-data", 'name="' + e + '"'].concat(
          i || []
        ),
        "Content-Type": [].concat(o || []),
      };
    for (var c in ("object" == typeof a.header && te(r, a.header), r))
      r.hasOwnProperty(c) &&
        null != (t = r[c]) &&
        (Array.isArray(t) || (t = [t]),
        t.length && (s += c + ": " + t.join("; ") + oe.LINE_BREAK));
    return "--" + this.getBoundary() + oe.LINE_BREAK + s + oe.LINE_BREAK;
  }),
  (oe.prototype._getContentDisposition = function (e, n) {
    var a, t;
    return (
      "string" == typeof n.filepath
        ? (a = K.normalize(n.filepath).replace(/\\/g, "/"))
        : n.filename || e.name || e.path
        ? (a = K.basename(n.filename || e.name || e.path))
        : e.readable &&
          e.hasOwnProperty("httpVersion") &&
          (a = K.basename(e.client._httpMessage.path || "")),
      a && (t = 'filename="' + a + '"'),
      t
    );
  }),
  (oe.prototype._getContentType = function (e, n) {
    var a = n.contentType;
    return (
      !a && e.name && (a = ne.lookup(e.name)),
      !a && e.path && (a = ne.lookup(e.path)),
      !a &&
        e.readable &&
        e.hasOwnProperty("httpVersion") &&
        (a = e.headers["content-type"]),
      a ||
        (!n.filepath && !n.filename) ||
        (a = ne.lookup(n.filepath || n.filename)),
      a || "object" != typeof e || (a = oe.DEFAULT_CONTENT_TYPE),
      a
    );
  }),
  (oe.prototype._multiPartFooter = function () {
    return function (e) {
      var n = oe.LINE_BREAK;
      0 === this._streams.length && (n += this._lastBoundary()), e(n);
    }.bind(this);
  }),
  (oe.prototype._lastBoundary = function () {
    return "--" + this.getBoundary() + "--" + oe.LINE_BREAK;
  }),
  (oe.prototype.getHeaders = function (e) {
    var n,
      a = {
        "content-type": "multipart/form-data; boundary=" + this.getBoundary(),
      };
    for (n in e) e.hasOwnProperty(n) && (a[n.toLowerCase()] = e[n]);
    return a;
  }),
  (oe.prototype.setBoundary = function (e) {
    this._boundary = e;
  }),
  (oe.prototype.getBoundary = function () {
    return this._boundary || this._generateBoundary(), this._boundary;
  }),
  (oe.prototype.getBuffer = function () {
    for (
      var e = new Buffer.alloc(0),
        n = this.getBoundary(),
        a = 0,
        t = this._streams.length;
      a < t;
      a++
    )
      "function" != typeof this._streams[a] &&
        ((e = Buffer.isBuffer(this._streams[a])
          ? Buffer.concat([e, this._streams[a]])
          : Buffer.concat([e, Buffer.from(this._streams[a])])),
        ("string" == typeof this._streams[a] &&
          this._streams[a].substring(2, n.length + 2) === n) ||
          (e = Buffer.concat([e, Buffer.from(oe.LINE_BREAK)])));
    return Buffer.concat([e, Buffer.from(this._lastBoundary())]);
  }),
  (oe.prototype._generateBoundary = function () {
    for (var e = "--------------------------", n = 0; n < 24; n++)
      e += Math.floor(10 * Math.random()).toString(16);
    this._boundary = e;
  }),
  (oe.prototype.getLengthSync = function () {
    var e = this._overheadLength + this._valueLength;
    return (
      this._streams.length && (e += this._lastBoundary().length),
      this.hasKnownLength() ||
        this._error(
          new Error("Cannot calculate proper length in synchronous way.")
        ),
      e
    );
  }),
  (oe.prototype.hasKnownLength = function () {
    var e = !0;
    return this._valuesToMeasure.length && (e = !1), e;
  }),
  (oe.prototype.getLength = function (e) {
    var n = this._overheadLength + this._valueLength;
    this._streams.length && (n += this._lastBoundary().length),
      this._valuesToMeasure.length
        ? ae.parallel(
            this._valuesToMeasure,
            this._lengthRetriever,
            function (a, t) {
              a
                ? e(a)
                : (t.forEach(function (e) {
                    n += e;
                  }),
                  e(null, n));
            }
          )
        : process.nextTick(e.bind(this, null, n));
  }),
  (oe.prototype.submit = function (e, n) {
    var a,
      t,
      i = { method: "post" };
    return (
      "string" == typeof e
        ? ((e = X(e)),
          (t = te(
            {
              port: e.port,
              path: e.pathname,
              host: e.hostname,
              protocol: e.protocol,
            },
            i
          )))
        : (t = te(e, i)).port || (t.port = "https:" == t.protocol ? 443 : 80),
      (t.headers = this.getHeaders(e.headers)),
      (a = "https:" == t.protocol ? Y.request(t) : Q.request(t)),
      this.getLength(
        function (e, t) {
          if (e && "Unknown stream" !== e) this._error(e);
          else if ((t && a.setHeader("Content-Length", t), this.pipe(a), n)) {
            var i,
              o = function (e, t) {
                return (
                  a.removeListener("error", o),
                  a.removeListener("response", i),
                  n.call(this, e, t)
                );
              };
            (i = o.bind(this, null)), a.on("error", o), a.on("response", i);
          }
        }.bind(this)
      ),
      a
    );
  }),
  (oe.prototype._error = function (e) {
    this.error || ((this.error = e), this.pause(), this.emit("error", e));
  }),
  (oe.prototype.toString = function () {
    return "[object FormData]";
  });
var se = 1e3,
  re = 60 * se,
  ce = 60 * re,
  pe = 24 * ce,
  le = 7 * pe,
  ue = 365.25 * pe,
  de = function (e, n) {
    n = n || {};
    var a = typeof e;
    if ("string" === a && e.length > 0)
      return (function (e) {
        if ((e = String(e)).length > 100) return;
        var n =
          /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
            e
          );
        if (!n) return;
        var a = parseFloat(n[1]);
        switch ((n[2] || "ms").toLowerCase()) {
          case "years":
          case "year":
          case "yrs":
          case "yr":
          case "y":
            return a * ue;
          case "weeks":
          case "week":
          case "w":
            return a * le;
          case "days":
          case "day":
          case "d":
            return a * pe;
          case "hours":
          case "hour":
          case "hrs":
          case "hr":
          case "h":
            return a * ce;
          case "minutes":
          case "minute":
          case "mins":
          case "min":
          case "m":
            return a * re;
          case "seconds":
          case "second":
          case "secs":
          case "sec":
          case "s":
            return a * se;
          case "milliseconds":
          case "millisecond":
          case "msecs":
          case "msec":
          case "ms":
            return a;
          default:
            return;
        }
      })(e);
    if ("number" === a && isFinite(e))
      return n.long
        ? (function (e) {
            var n = Math.abs(e);
            if (n >= pe) return me(e, n, pe, "day");
            if (n >= ce) return me(e, n, ce, "hour");
            if (n >= re) return me(e, n, re, "minute");
            if (n >= se) return me(e, n, se, "second");
            return e + " ms";
          })(e)
        : (function (e) {
            var n = Math.abs(e);
            if (n >= pe) return Math.round(e / pe) + "d";
            if (n >= ce) return Math.round(e / ce) + "h";
            if (n >= re) return Math.round(e / re) + "m";
            if (n >= se) return Math.round(e / se) + "s";
            return e + "ms";
          })(e);
    throw new Error(
      "val is not a non-empty string or a valid number. val=" +
        JSON.stringify(e)
    );
  };
function me(e, n, a, t) {
  var i = n >= 1.5 * a;
  return Math.round(e / a) + " " + t + (i ? "s" : "");
}
var fe,
  he,
  xe,
  ve,
  be = Array.prototype.slice,
  ge = Object.prototype.toString,
  ye = function (e) {
    var n = this;
    if ("function" != typeof n || "[object Function]" !== ge.call(n))
      throw new TypeError(
        "Function.prototype.bind called on incompatible " + n
      );
    for (
      var a,
        t = be.call(arguments, 1),
        i = Math.max(0, n.length - t.length),
        o = [],
        s = 0;
      s < i;
      s++
    )
      o.push("$" + s);
    if (
      ((a = Function(
        "binder",
        "return function (" +
          o.join(",") +
          "){ return binder.apply(this,arguments); }"
      )(function () {
        if (this instanceof a) {
          var i = n.apply(this, t.concat(be.call(arguments)));
          return Object(i) === i ? i : this;
        }
        return n.apply(e, t.concat(be.call(arguments)));
      })),
      n.prototype)
    ) {
      var r = function () {};
      (r.prototype = n.prototype),
        (a.prototype = new r()),
        (r.prototype = null);
    }
    return a;
  },
  we = Function.prototype.bind || ye,
  _e = we.call(Function.call, Object.prototype.hasOwnProperty);
function ke() {
  return he
    ? fe
    : ((he = 1),
      (fe = (e, n = process.argv) => {
        const a = e.startsWith("-") ? "" : 1 === e.length ? "-" : "--",
          t = n.indexOf(a + e),
          i = n.indexOf("--");
        return -1 !== t && (-1 === i || t < i);
      }));
}
function je() {
  if (ve) return xe;
  ve = 1;
  const e = u,
    n = c,
    a = ke(),
    { env: t } = process;
  let i;
  function o(e) {
    return (
      0 !== e && { level: e, hasBasic: !0, has256: e >= 2, has16m: e >= 3 }
    );
  }
  function s(n, o) {
    if (0 === i) return 0;
    if (a("color=16m") || a("color=full") || a("color=truecolor")) return 3;
    if (a("color=256")) return 2;
    if (n && !o && void 0 === i) return 0;
    const s = i || 0;
    if ("dumb" === t.TERM) return s;
    if ("win32" === process.platform) {
      const n = e.release().split(".");
      return Number(n[0]) >= 10 && Number(n[2]) >= 10586
        ? Number(n[2]) >= 14931
          ? 3
          : 2
        : 1;
    }
    if ("CI" in t)
      return [
        "TRAVIS",
        "CIRCLECI",
        "APPVEYOR",
        "GITLAB_CI",
        "GITHUB_ACTIONS",
        "BUILDKITE",
      ].some((e) => e in t) || "codeship" === t.CI_NAME
        ? 1
        : s;
    if ("TEAMCITY_VERSION" in t)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(t.TEAMCITY_VERSION) ? 1 : 0;
    if ("truecolor" === t.COLORTERM) return 3;
    if ("TERM_PROGRAM" in t) {
      const e = parseInt((t.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (t.TERM_PROGRAM) {
        case "iTerm.app":
          return e >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    return /-256(color)?$/i.test(t.TERM)
      ? 2
      : /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(
          t.TERM
        ) || "COLORTERM" in t
      ? 1
      : s;
  }
  return (
    a("no-color") || a("no-colors") || a("color=false") || a("color=never")
      ? (i = 0)
      : (a("color") || a("colors") || a("color=true") || a("color=always")) &&
        (i = 1),
    "FORCE_COLOR" in t &&
      (i =
        "true" === t.FORCE_COLOR
          ? 1
          : "false" === t.FORCE_COLOR
          ? 0
          : 0 === t.FORCE_COLOR.length
          ? 1
          : Math.min(parseInt(t.FORCE_COLOR, 10), 3)),
    (xe = {
      supportsColor: function (e) {
        return o(s(e, e && e.isTTY));
      },
      stdout: o(s(!0, n.isatty(1))),
      stderr: o(s(!0, n.isatty(2))),
    }),
    xe
  );
}
function Ee(e, n) {
  return function () {
    return e.apply(n, arguments);
  };
}
!(function (a) {
  var s = ie,
    u = o,
    m = t,
    f = i,
    h = e,
    x = n,
    v = r,
    b = de,
    g = c,
    y = p,
    w = l,
    _ = we,
    k = _e;
  function j(e, n) {
    return function () {
      return e.apply(n, arguments);
    };
  }
  const { toString: E } = Object.prototype,
    { getPrototypeOf: R } = Object,
    C =
      ((S = Object.create(null)),
      (e) => {
        const n = E.call(e);
        return S[n] || (S[n] = n.slice(8, -1).toLowerCase());
      });
  var S;
  const O = (e) => ((e = e.toLowerCase()), (n) => C(n) === e),
    A = (e) => (n) => typeof n === e,
    { isArray: T } = Array,
    F = A("undefined"),
    P = O("ArrayBuffer"),
    L = A("string"),
    B = A("function"),
    z = A("number"),
    N = (e) => null !== e && "object" == typeof e,
    U = (e) => {
      if ("object" !== C(e)) return !1;
      const n = R(e);
      return !(
        (null !== n &&
          n !== Object.prototype &&
          null !== Object.getPrototypeOf(n)) ||
        Symbol.toStringTag in e ||
        Symbol.iterator in e
      );
    },
    q = O("Date"),
    D = O("File"),
    I = O("Blob"),
    M = O("FileList"),
    H = O("URLSearchParams");
  function $(e, n, { allOwnKeys: a = !1 } = {}) {
    if (null == e) return;
    let t, i;
    if (("object" != typeof e && (e = [e]), T(e)))
      for (t = 0, i = e.length; t < i; t++) n.call(null, e[t], t, e);
    else {
      const i = a ? Object.getOwnPropertyNames(e) : Object.keys(e),
        o = i.length;
      let s;
      for (t = 0; t < o; t++) (s = i[t]), n.call(null, e[s], s, e);
    }
  }
  function W(e, n) {
    n = n.toLowerCase();
    const a = Object.keys(e);
    let t,
      i = a.length;
    for (; i-- > 0; ) if (((t = a[i]), n === t.toLowerCase())) return t;
    return null;
  }
  const G =
      "undefined" != typeof globalThis
        ? globalThis
        : "undefined" != typeof self
        ? self
        : "undefined" != typeof window
        ? window
        : d,
    V = (e) => !F(e) && e !== G,
    J = (
      (e) => (n) =>
        e && n instanceof e
    )("undefined" != typeof Uint8Array && R(Uint8Array)),
    K = O("HTMLFormElement"),
    Q = (
      ({ hasOwnProperty: e }) =>
      (n, a) =>
        e.call(n, a)
    )(Object.prototype),
    Y = O("RegExp"),
    X = (e, n) => {
      const a = Object.getOwnPropertyDescriptors(e),
        t = {};
      $(a, (a, i) => {
        !1 !== n(a, i, e) && (t[i] = a);
      }),
        Object.defineProperties(e, t);
    },
    Z = "abcdefghijklmnopqrstuvwxyz",
    ee = "0123456789",
    ne = { DIGIT: ee, ALPHA: Z, ALPHA_DIGIT: Z + Z.toUpperCase() + ee };
  var ae = {
    isArray: T,
    isArrayBuffer: P,
    isBuffer: function (e) {
      return (
        null !== e &&
        !F(e) &&
        null !== e.constructor &&
        !F(e.constructor) &&
        B(e.constructor.isBuffer) &&
        e.constructor.isBuffer(e)
      );
    },
    isFormData: (e) => {
      const n = "[object FormData]";
      return (
        e &&
        (("function" == typeof FormData && e instanceof FormData) ||
          E.call(e) === n ||
          (B(e.toString) && e.toString() === n))
      );
    },
    isArrayBufferView: function (e) {
      let n;
      return (
        (n =
          "undefined" != typeof ArrayBuffer && ArrayBuffer.isView
            ? ArrayBuffer.isView(e)
            : e && e.buffer && P(e.buffer)),
        n
      );
    },
    isString: L,
    isNumber: z,
    isBoolean: (e) => !0 === e || !1 === e,
    isObject: N,
    isPlainObject: U,
    isUndefined: F,
    isDate: q,
    isFile: D,
    isBlob: I,
    isRegExp: Y,
    isFunction: B,
    isStream: (e) => N(e) && B(e.pipe),
    isURLSearchParams: H,
    isTypedArray: J,
    isFileList: M,
    forEach: $,
    merge: function e() {
      const { caseless: n } = (V(this) && this) || {},
        a = {},
        t = (t, i) => {
          const o = (n && W(a, i)) || i;
          U(a[o]) && U(t)
            ? (a[o] = e(a[o], t))
            : U(t)
            ? (a[o] = e({}, t))
            : T(t)
            ? (a[o] = t.slice())
            : (a[o] = t);
        };
      for (let e = 0, n = arguments.length; e < n; e++)
        arguments[e] && $(arguments[e], t);
      return a;
    },
    extend: (e, n, a, { allOwnKeys: t } = {}) => (
      $(
        n,
        (n, t) => {
          a && B(n) ? (e[t] = j(n, a)) : (e[t] = n);
        },
        { allOwnKeys: t }
      ),
      e
    ),
    trim: (e) =>
      e.trim ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""),
    stripBOM: (e) => (65279 === e.charCodeAt(0) && (e = e.slice(1)), e),
    inherits: (e, n, a, t) => {
      (e.prototype = Object.create(n.prototype, t)),
        (e.prototype.constructor = e),
        Object.defineProperty(e, "super", { value: n.prototype }),
        a && Object.assign(e.prototype, a);
    },
    toFlatObject: (e, n, a, t) => {
      let i, o, s;
      const r = {};
      if (((n = n || {}), null == e)) return n;
      do {
        for (i = Object.getOwnPropertyNames(e), o = i.length; o-- > 0; )
          (s = i[o]),
            (t && !t(s, e, n)) || r[s] || ((n[s] = e[s]), (r[s] = !0));
        e = !1 !== a && R(e);
      } while (e && (!a || a(e, n)) && e !== Object.prototype);
      return n;
    },
    kindOf: C,
    kindOfTest: O,
    endsWith: (e, n, a) => {
      (e = String(e)),
        (void 0 === a || a > e.length) && (a = e.length),
        (a -= n.length);
      const t = e.indexOf(n, a);
      return -1 !== t && t === a;
    },
    toArray: (e) => {
      if (!e) return null;
      if (T(e)) return e;
      let n = e.length;
      if (!z(n)) return null;
      const a = new Array(n);
      for (; n-- > 0; ) a[n] = e[n];
      return a;
    },
    forEachEntry: (e, n) => {
      const a = (e && e[Symbol.iterator]).call(e);
      let t;
      for (; (t = a.next()) && !t.done; ) {
        const a = t.value;
        n.call(e, a[0], a[1]);
      }
    },
    matchAll: (e, n) => {
      let a;
      const t = [];
      for (; null !== (a = e.exec(n)); ) t.push(a);
      return t;
    },
    isHTMLForm: K,
    hasOwnProperty: Q,
    hasOwnProp: Q,
    reduceDescriptors: X,
    freezeMethods: (e) => {
      X(e, (n, a) => {
        if (B(e) && -1 !== ["arguments", "caller", "callee"].indexOf(a))
          return !1;
        const t = e[a];
        B(t) &&
          ((n.enumerable = !1),
          "writable" in n
            ? (n.writable = !1)
            : n.set ||
              (n.set = () => {
                throw Error("Can not rewrite read-only method '" + a + "'");
              }));
      });
    },
    toObjectSet: (e, n) => {
      const a = {},
        t = (e) => {
          e.forEach((e) => {
            a[e] = !0;
          });
        };
      return T(e) ? t(e) : t(String(e).split(n)), a;
    },
    toCamelCase: (e) =>
      e.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function (e, n, a) {
        return n.toUpperCase() + a;
      }),
    noop: () => {},
    toFiniteNumber: (e, n) => ((e = +e), Number.isFinite(e) ? e : n),
    findKey: W,
    global: G,
    isContextDefined: V,
    ALPHABET: ne,
    generateString: (e = 16, n = ne.ALPHA_DIGIT) => {
      let a = "";
      const { length: t } = n;
      for (; e--; ) a += n[(Math.random() * t) | 0];
      return a;
    },
    isSpecCompliantForm: function (e) {
      return !!(
        e &&
        B(e.append) &&
        "FormData" === e[Symbol.toStringTag] &&
        e[Symbol.iterator]
      );
    },
    toJSONObject: (e) => {
      const n = new Array(10),
        a = (e, t) => {
          if (N(e)) {
            if (n.indexOf(e) >= 0) return;
            if (!("toJSON" in e)) {
              n[t] = e;
              const i = T(e) ? [] : {};
              return (
                $(e, (e, n) => {
                  const o = a(e, t + 1);
                  !F(o) && (i[n] = o);
                }),
                (n[t] = void 0),
                i
              );
            }
          }
          return e;
        };
      return a(e, 0);
    },
  };
  function te(e, n, a, t, i) {
    Error.call(this),
      Error.captureStackTrace
        ? Error.captureStackTrace(this, this.constructor)
        : (this.stack = new Error().stack),
      (this.message = e),
      (this.name = "AxiosError"),
      n && (this.code = n),
      a && (this.config = a),
      t && (this.request = t),
      i && (this.response = i);
  }
  ae.inherits(te, Error, {
    toJSON: function () {
      return {
        message: this.message,
        name: this.name,
        description: this.description,
        number: this.number,
        fileName: this.fileName,
        lineNumber: this.lineNumber,
        columnNumber: this.columnNumber,
        stack: this.stack,
        config: ae.toJSONObject(this.config),
        code: this.code,
        status:
          this.response && this.response.status ? this.response.status : null,
      };
    },
  });
  const oe = te.prototype,
    se = {};
  function re(e) {
    return ae.isPlainObject(e) || ae.isArray(e);
  }
  function ce(e) {
    return ae.endsWith(e, "[]") ? e.slice(0, -2) : e;
  }
  function pe(e, n, a) {
    return e
      ? e
          .concat(n)
          .map(function (e, n) {
            return (e = ce(e)), !a && n ? "[" + e + "]" : e;
          })
          .join(a ? "." : "")
      : n;
  }
  [
    "ERR_BAD_OPTION_VALUE",
    "ERR_BAD_OPTION",
    "ECONNABORTED",
    "ETIMEDOUT",
    "ERR_NETWORK",
    "ERR_FR_TOO_MANY_REDIRECTS",
    "ERR_DEPRECATED",
    "ERR_BAD_RESPONSE",
    "ERR_BAD_REQUEST",
    "ERR_CANCELED",
    "ERR_NOT_SUPPORT",
    "ERR_INVALID_URL",
  ].forEach((e) => {
    se[e] = { value: e };
  }),
    Object.defineProperties(te, se),
    Object.defineProperty(oe, "isAxiosError", { value: !0 }),
    (te.from = (e, n, a, t, i, o) => {
      const s = Object.create(oe);
      return (
        ae.toFlatObject(
          e,
          s,
          function (e) {
            return e !== Error.prototype;
          },
          (e) => "isAxiosError" !== e
        ),
        te.call(s, e.message, n, a, t, i),
        (s.cause = e),
        (s.name = e.name),
        o && Object.assign(s, o),
        s
      );
    });
  const le = ae.toFlatObject(ae, {}, null, function (e) {
    return /^is[A-Z]/.test(e);
  });
  function ue(e, n, a) {
    if (!ae.isObject(e)) throw new TypeError("target must be an object");
    n = n || new (s || FormData)();
    const t = (a = ae.toFlatObject(
        a,
        { metaTokens: !0, dots: !1, indexes: !1 },
        !1,
        function (e, n) {
          return !ae.isUndefined(n[e]);
        }
      )).metaTokens,
      i = a.visitor || l,
      o = a.dots,
      r = a.indexes,
      c =
        (a.Blob || ("undefined" != typeof Blob && Blob)) &&
        ae.isSpecCompliantForm(n);
    if (!ae.isFunction(i)) throw new TypeError("visitor must be a function");
    function p(e) {
      if (null === e) return "";
      if (ae.isDate(e)) return e.toISOString();
      if (!c && ae.isBlob(e))
        throw new te("Blob is not supported. Use a Buffer instead.");
      return ae.isArrayBuffer(e) || ae.isTypedArray(e)
        ? c && "function" == typeof Blob
          ? new Blob([e])
          : Buffer.from(e)
        : e;
    }
    function l(e, a, i) {
      let s = e;
      if (e && !i && "object" == typeof e)
        if (ae.endsWith(a, "{}"))
          (a = t ? a : a.slice(0, -2)), (e = JSON.stringify(e));
        else if (
          (ae.isArray(e) &&
            (function (e) {
              return ae.isArray(e) && !e.some(re);
            })(e)) ||
          ((ae.isFileList(e) || ae.endsWith(a, "[]")) && (s = ae.toArray(e)))
        )
          return (
            (a = ce(a)),
            s.forEach(function (e, t) {
              !ae.isUndefined(e) &&
                null !== e &&
                n.append(
                  !0 === r ? pe([a], t, o) : null === r ? a : a + "[]",
                  p(e)
                );
            }),
            !1
          );
      return !!re(e) || (n.append(pe(i, a, o), p(e)), !1);
    }
    const u = [],
      d = Object.assign(le, {
        defaultVisitor: l,
        convertValue: p,
        isVisitable: re,
      });
    if (!ae.isObject(e)) throw new TypeError("data must be an object");
    return (
      (function e(a, t) {
        if (!ae.isUndefined(a)) {
          if (-1 !== u.indexOf(a))
            throw Error("Circular reference detected in " + t.join("."));
          u.push(a),
            ae.forEach(a, function (a, o) {
              !0 ===
                (!(ae.isUndefined(a) || null === a) &&
                  i.call(n, a, ae.isString(o) ? o.trim() : o, t, d)) &&
                e(a, t ? t.concat(o) : [o]);
            }),
            u.pop();
        }
      })(e),
      n
    );
  }
  function me(e) {
    const n = {
      "!": "%21",
      "'": "%27",
      "(": "%28",
      ")": "%29",
      "~": "%7E",
      "%20": "+",
      "%00": "\0",
    };
    return encodeURIComponent(e).replace(/[!'()~]|%20|%00/g, function (e) {
      return n[e];
    });
  }
  function fe(e, n) {
    (this._pairs = []), e && ue(e, this, n);
  }
  const he = fe.prototype;
  function xe(e) {
    return encodeURIComponent(e)
      .replace(/%3A/gi, ":")
      .replace(/%24/g, "$")
      .replace(/%2C/gi, ",")
      .replace(/%20/g, "+")
      .replace(/%5B/gi, "[")
      .replace(/%5D/gi, "]");
  }
  function ve(e, n, a) {
    if (!n) return e;
    const t = (a && a.encode) || xe,
      i = a && a.serialize;
    let o;
    if (
      ((o = i
        ? i(n, a)
        : ae.isURLSearchParams(n)
        ? n.toString()
        : new fe(n, a).toString(t)),
      o)
    ) {
      const n = e.indexOf("#");
      -1 !== n && (e = e.slice(0, n)),
        (e += (-1 === e.indexOf("?") ? "?" : "&") + o);
    }
    return e;
  }
  (he.append = function (e, n) {
    this._pairs.push([e, n]);
  }),
    (he.toString = function (e) {
      const n = e
        ? function (n) {
            return e.call(this, n, me);
          }
        : me;
      return this._pairs
        .map(function (e) {
          return n(e[0]) + "=" + n(e[1]);
        }, "")
        .join("&");
    });
  var be = class {
      constructor() {
        this.handlers = [];
      }
      use(e, n, a) {
        return (
          this.handlers.push({
            fulfilled: e,
            rejected: n,
            synchronous: !!a && a.synchronous,
            runWhen: a ? a.runWhen : null,
          }),
          this.handlers.length - 1
        );
      }
      eject(e) {
        this.handlers[e] && (this.handlers[e] = null);
      }
      clear() {
        this.handlers && (this.handlers = []);
      }
      forEach(e) {
        ae.forEach(this.handlers, function (n) {
          null !== n && e(n);
        });
      }
    },
    ge = {
      silentJSONParsing: !0,
      forcedJSONParsing: !0,
      clarifyTimeoutError: !1,
    },
    ye = {
      isNode: !0,
      classes: {
        URLSearchParams: u.URLSearchParams,
        FormData: s,
        Blob: ("undefined" != typeof Blob && Blob) || null,
      },
      protocols: ["http", "https", "file", "data"],
    };
  function ke(e) {
    function n(e, a, t, i) {
      let o = e[i++];
      const s = Number.isFinite(+o),
        r = i >= e.length;
      return (
        (o = !o && ae.isArray(t) ? t.length : o),
        r
          ? (ae.hasOwnProp(t, o) ? (t[o] = [t[o], a]) : (t[o] = a), !s)
          : ((t[o] && ae.isObject(t[o])) || (t[o] = []),
            n(e, a, t[o], i) &&
              ae.isArray(t[o]) &&
              (t[o] = (function (e) {
                const n = {},
                  a = Object.keys(e);
                let t;
                const i = a.length;
                let o;
                for (t = 0; t < i; t++) (o = a[t]), (n[o] = e[o]);
                return n;
              })(t[o])),
            !s)
      );
    }
    if (ae.isFormData(e) && ae.isFunction(e.entries)) {
      const a = {};
      return (
        ae.forEachEntry(e, (e, t) => {
          n(
            (function (e) {
              return ae
                .matchAll(/\w+|\[(\w*)]/g, e)
                .map((e) => ("[]" === e[0] ? "" : e[1] || e[0]));
            })(e),
            t,
            a,
            0
          );
        }),
        a
      );
    }
    return null;
  }
  const Ee = { "Content-Type": void 0 },
    Re = {
      transitional: ge,
      adapter: ["xhr", "http"],
      transformRequest: [
        function (e, n) {
          const a = n.getContentType() || "",
            t = a.indexOf("application/json") > -1,
            i = ae.isObject(e);
          if (
            (i && ae.isHTMLForm(e) && (e = new FormData(e)), ae.isFormData(e))
          )
            return t && t ? JSON.stringify(ke(e)) : e;
          if (
            ae.isArrayBuffer(e) ||
            ae.isBuffer(e) ||
            ae.isStream(e) ||
            ae.isFile(e) ||
            ae.isBlob(e)
          )
            return e;
          if (ae.isArrayBufferView(e)) return e.buffer;
          if (ae.isURLSearchParams(e))
            return (
              n.setContentType(
                "application/x-www-form-urlencoded;charset=utf-8",
                !1
              ),
              e.toString()
            );
          let o;
          if (i) {
            if (a.indexOf("application/x-www-form-urlencoded") > -1)
              return (function (e, n) {
                return ue(
                  e,
                  new ye.classes.URLSearchParams(),
                  Object.assign(
                    {
                      visitor: function (e, n, a, t) {
                        return ae.isBuffer(e)
                          ? (this.append(n, e.toString("base64")), !1)
                          : t.defaultVisitor.apply(this, arguments);
                      },
                    },
                    n
                  )
                );
              })(e, this.formSerializer).toString();
            if (
              (o = ae.isFileList(e)) ||
              a.indexOf("multipart/form-data") > -1
            ) {
              const n = this.env && this.env.FormData;
              return ue(
                o ? { "files[]": e } : e,
                n && new n(),
                this.formSerializer
              );
            }
          }
          return i || t
            ? (n.setContentType("application/json", !1),
              (function (e, n, a) {
                if (ae.isString(e))
                  try {
                    return (0, JSON.parse)(e), ae.trim(e);
                  } catch (e) {
                    if ("SyntaxError" !== e.name) throw e;
                  }
                return (0, JSON.stringify)(e);
              })(e))
            : e;
        },
      ],
      transformResponse: [
        function (e) {
          const n = this.transitional || Re.transitional,
            a = n && n.forcedJSONParsing,
            t = "json" === this.responseType;
          if (e && ae.isString(e) && ((a && !this.responseType) || t)) {
            const a = !(n && n.silentJSONParsing) && t;
            try {
              return JSON.parse(e);
            } catch (e) {
              if (a) {
                if ("SyntaxError" === e.name)
                  throw te.from(
                    e,
                    te.ERR_BAD_RESPONSE,
                    this,
                    null,
                    this.response
                  );
                throw e;
              }
            }
          }
          return e;
        },
      ],
      timeout: 0,
      xsrfCookieName: "XSRF-TOKEN",
      xsrfHeaderName: "X-XSRF-TOKEN",
      maxContentLength: -1,
      maxBodyLength: -1,
      env: { FormData: ye.classes.FormData, Blob: ye.classes.Blob },
      validateStatus: function (e) {
        return e >= 200 && e < 300;
      },
      headers: { common: { Accept: "application/json, text/plain, */*" } },
    };
  ae.forEach(["delete", "get", "head"], function (e) {
    Re.headers[e] = {};
  }),
    ae.forEach(["post", "put", "patch"], function (e) {
      Re.headers[e] = ae.merge(Ee);
    });
  var Ce = Re;
  const Se = ae.toObjectSet([
      "age",
      "authorization",
      "content-length",
      "content-type",
      "etag",
      "expires",
      "from",
      "host",
      "if-modified-since",
      "if-unmodified-since",
      "last-modified",
      "location",
      "max-forwards",
      "proxy-authorization",
      "referer",
      "retry-after",
      "user-agent",
    ]),
    Oe = Symbol("internals");
  function Ae(e) {
    return e && String(e).trim().toLowerCase();
  }
  function Te(e) {
    return !1 === e || null == e ? e : ae.isArray(e) ? e.map(Te) : String(e);
  }
  function Fe(e, n, a, t) {
    return ae.isFunction(t)
      ? t.call(this, n, a)
      : ae.isString(n)
      ? ae.isString(t)
        ? -1 !== n.indexOf(t)
        : ae.isRegExp(t)
        ? t.test(n)
        : void 0
      : void 0;
  }
  class Pe {
    constructor(e) {
      e && this.set(e);
    }
    set(e, n, a) {
      const t = this;
      function i(e, n, a) {
        const i = Ae(n);
        if (!i) throw new Error("header name must be a non-empty string");
        const o = ae.findKey(t, i);
        (!o || void 0 === t[o] || !0 === a || (void 0 === a && !1 !== t[o])) &&
          (t[o || n] = Te(e));
      }
      const o = (e, n) => ae.forEach(e, (e, a) => i(e, a, n));
      return (
        ae.isPlainObject(e) || e instanceof this.constructor
          ? o(e, n)
          : ae.isString(e) && (e = e.trim()) && !/^[-_a-zA-Z]+$/.test(e.trim())
          ? o(
              ((e) => {
                const n = {};
                let a, t, i;
                return (
                  e &&
                    e.split("\n").forEach(function (e) {
                      (i = e.indexOf(":")),
                        (a = e.substring(0, i).trim().toLowerCase()),
                        (t = e.substring(i + 1).trim()),
                        !a ||
                          (n[a] && Se[a]) ||
                          ("set-cookie" === a
                            ? n[a]
                              ? n[a].push(t)
                              : (n[a] = [t])
                            : (n[a] = n[a] ? n[a] + ", " + t : t));
                    }),
                  n
                );
              })(e),
              n
            )
          : null != e && i(n, e, a),
        this
      );
    }
    get(e, n) {
      if ((e = Ae(e))) {
        const a = ae.findKey(this, e);
        if (a) {
          const e = this[a];
          if (!n) return e;
          if (!0 === n)
            return (function (e) {
              const n = Object.create(null),
                a = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
              let t;
              for (; (t = a.exec(e)); ) n[t[1]] = t[2];
              return n;
            })(e);
          if (ae.isFunction(n)) return n.call(this, e, a);
          if (ae.isRegExp(n)) return n.exec(e);
          throw new TypeError("parser must be boolean|regexp|function");
        }
      }
    }
    has(e, n) {
      if ((e = Ae(e))) {
        const a = ae.findKey(this, e);
        return !(!a || void 0 === this[a] || (n && !Fe(0, this[a], a, n)));
      }
      return !1;
    }
    delete(e, n) {
      const a = this;
      let t = !1;
      function i(e) {
        if ((e = Ae(e))) {
          const i = ae.findKey(a, e);
          !i || (n && !Fe(0, a[i], i, n)) || (delete a[i], (t = !0));
        }
      }
      return ae.isArray(e) ? e.forEach(i) : i(e), t;
    }
    clear(e) {
      const n = Object.keys(this);
      let a = n.length,
        t = !1;
      for (; a--; ) {
        const i = n[a];
        (e && !Fe(0, this[i], i, e)) || (delete this[i], (t = !0));
      }
      return t;
    }
    normalize(e) {
      const n = this,
        a = {};
      return (
        ae.forEach(this, (t, i) => {
          const o = ae.findKey(a, i);
          if (o) return (n[o] = Te(t)), void delete n[i];
          const s = e
            ? (function (e) {
                return e
                  .trim()
                  .toLowerCase()
                  .replace(/([a-z\d])(\w*)/g, (e, n, a) => n.toUpperCase() + a);
              })(i)
            : String(i).trim();
          s !== i && delete n[i], (n[s] = Te(t)), (a[s] = !0);
        }),
        this
      );
    }
    concat(...e) {
      return this.constructor.concat(this, ...e);
    }
    toJSON(e) {
      const n = Object.create(null);
      return (
        ae.forEach(this, (a, t) => {
          null != a &&
            !1 !== a &&
            (n[t] = e && ae.isArray(a) ? a.join(", ") : a);
        }),
        n
      );
    }
    [Symbol.iterator]() {
      return Object.entries(this.toJSON())[Symbol.iterator]();
    }
    toString() {
      return Object.entries(this.toJSON())
        .map(([e, n]) => e + ": " + n)
        .join("\n");
    }
    get [Symbol.toStringTag]() {
      return "AxiosHeaders";
    }
    static from(e) {
      return e instanceof this ? e : new this(e);
    }
    static concat(e, ...n) {
      const a = new this(e);
      return n.forEach((e) => a.set(e)), a;
    }
    static accessor(e) {
      const n = (this[Oe] = this[Oe] = { accessors: {} }).accessors,
        a = this.prototype;
      function t(e) {
        const t = Ae(e);
        n[t] ||
          ((function (e, n) {
            const a = ae.toCamelCase(" " + n);
            ["get", "set", "has"].forEach((t) => {
              Object.defineProperty(e, t + a, {
                value: function (e, a, i) {
                  return this[t].call(this, n, e, a, i);
                },
                configurable: !0,
              });
            });
          })(a, e),
          (n[t] = !0));
      }
      return ae.isArray(e) ? e.forEach(t) : t(e), this;
    }
  }
  Pe.accessor([
    "Content-Type",
    "Content-Length",
    "Accept",
    "Accept-Encoding",
    "User-Agent",
    "Authorization",
  ]),
    ae.freezeMethods(Pe.prototype),
    ae.freezeMethods(Pe);
  var Le = Pe;
  function Be(e, n) {
    const a = this || Ce,
      t = n || a,
      i = Le.from(t.headers);
    let o = t.data;
    return (
      ae.forEach(e, function (e) {
        o = e.call(a, o, i.normalize(), n ? n.status : void 0);
      }),
      i.normalize(),
      o
    );
  }
  function ze(e) {
    return !(!e || !e.__CANCEL__);
  }
  function Ne(e, n, a) {
    te.call(this, null == e ? "canceled" : e, te.ERR_CANCELED, n, a),
      (this.name = "CanceledError");
  }
  function Ue(e, n, a) {
    const t = a.config.validateStatus;
    a.status && t && !t(a.status)
      ? n(
          new te(
            "Request failed with status code " + a.status,
            [te.ERR_BAD_REQUEST, te.ERR_BAD_RESPONSE][
              Math.floor(a.status / 100) - 4
            ],
            a.config,
            a.request,
            a
          )
        )
      : e(a);
  }
  function qe(e, n) {
    return e &&
      !(function (e) {
        return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(e);
      })(n)
      ? (function (e, n) {
          return n ? e.replace(/\/+$/, "") + "/" + n.replace(/^\/+/, "") : e;
        })(e, n)
      : n;
  }
  ae.inherits(Ne, te, { __CANCEL__: !0 });
  var De = u.parse,
    Ie = { ftp: 21, gopher: 70, http: 80, https: 443, ws: 80, wss: 443 },
    Me =
      String.prototype.endsWith ||
      function (e) {
        return (
          e.length <= this.length &&
          -1 !== this.indexOf(e, this.length - e.length)
        );
      };
  function He(e) {
    return process.env[e.toLowerCase()] || process.env[e.toUpperCase()] || "";
  }
  var $e,
    We,
    Ge,
    Ve = {},
    Je = {
      get exports() {
        return Ve;
      },
      set exports(e) {
        Ve = e;
      },
    },
    Ke = {},
    Qe = {
      get exports() {
        return Ke;
      },
      set exports(e) {
        Ke = e;
      },
    },
    Ye = {},
    Xe = {
      get exports() {
        return Ye;
      },
      set exports(e) {
        Ye = e;
      },
    };
  function Ze() {
    return (
      We ||
        ((We = 1),
        ($e = function (e) {
          function n(e) {
            let t,
              i,
              o,
              s = null;
            function r(...e) {
              if (!r.enabled) return;
              const a = r,
                i = Number(new Date()),
                o = i - (t || i);
              (a.diff = o),
                (a.prev = t),
                (a.curr = i),
                (t = i),
                (e[0] = n.coerce(e[0])),
                "string" != typeof e[0] && e.unshift("%O");
              let s = 0;
              (e[0] = e[0].replace(/%([a-zA-Z%])/g, (t, i) => {
                if ("%%" === t) return "%";
                s++;
                const o = n.formatters[i];
                if ("function" == typeof o) {
                  const n = e[s];
                  (t = o.call(a, n)), e.splice(s, 1), s--;
                }
                return t;
              })),
                n.formatArgs.call(a, e),
                (a.log || n.log).apply(a, e);
            }
            return (
              (r.namespace = e),
              (r.useColors = n.useColors()),
              (r.color = n.selectColor(e)),
              (r.extend = a),
              (r.destroy = n.destroy),
              Object.defineProperty(r, "enabled", {
                enumerable: !0,
                configurable: !1,
                get: () =>
                  null !== s
                    ? s
                    : (i !== n.namespaces &&
                        ((i = n.namespaces), (o = n.enabled(e))),
                      o),
                set: (e) => {
                  s = e;
                },
              }),
              "function" == typeof n.init && n.init(r),
              r
            );
          }
          function a(e, a) {
            const t = n(this.namespace + (void 0 === a ? ":" : a) + e);
            return (t.log = this.log), t;
          }
          function t(e) {
            return e
              .toString()
              .substring(2, e.toString().length - 2)
              .replace(/\.\*\?$/, "*");
          }
          return (
            (n.debug = n),
            (n.default = n),
            (n.coerce = function (e) {
              return e instanceof Error ? e.stack || e.message : e;
            }),
            (n.disable = function () {
              const e = [
                ...n.names.map(t),
                ...n.skips.map(t).map((e) => "-" + e),
              ].join(",");
              return n.enable(""), e;
            }),
            (n.enable = function (e) {
              let a;
              n.save(e), (n.namespaces = e), (n.names = []), (n.skips = []);
              const t = ("string" == typeof e ? e : "").split(/[\s,]+/),
                i = t.length;
              for (a = 0; a < i; a++)
                t[a] &&
                  ("-" === (e = t[a].replace(/\*/g, ".*?"))[0]
                    ? n.skips.push(new RegExp("^" + e.slice(1) + "$"))
                    : n.names.push(new RegExp("^" + e + "$")));
            }),
            (n.enabled = function (e) {
              if ("*" === e[e.length - 1]) return !0;
              let a, t;
              for (a = 0, t = n.skips.length; a < t; a++)
                if (n.skips[a].test(e)) return !1;
              for (a = 0, t = n.names.length; a < t; a++)
                if (n.names[a].test(e)) return !0;
              return !1;
            }),
            (n.humanize = b),
            (n.destroy = function () {
              console.warn(
                "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
              );
            }),
            Object.keys(e).forEach((a) => {
              n[a] = e[a];
            }),
            (n.names = []),
            (n.skips = []),
            (n.formatters = {}),
            (n.selectColor = function (e) {
              let a = 0;
              for (let n = 0; n < e.length; n++)
                (a = (a << 5) - a + e.charCodeAt(n)), (a |= 0);
              return n.colors[Math.abs(a) % n.colors.length];
            }),
            n.enable(n.load()),
            n
          );
        })),
      $e
    );
  }
  var en,
    nn,
    an,
    tn = {},
    on = {
      get exports() {
        return tn;
      },
      set exports(e) {
        tn = e;
      },
    };
  function sn() {
    return (
      nn ||
        ((nn = 1),
        (e = Qe),
        "undefined" == typeof process ||
        "renderer" === process.type ||
        !0 === process.browser ||
        process.__nwjs
          ? (e.exports =
              (Ge ||
                ((Ge = 1),
                (function (e, n) {
                  (n.formatArgs = function (n) {
                    if (
                      ((n[0] =
                        (this.useColors ? "%c" : "") +
                        this.namespace +
                        (this.useColors ? " %c" : " ") +
                        n[0] +
                        (this.useColors ? "%c " : " ") +
                        "+" +
                        e.exports.humanize(this.diff)),
                      !this.useColors)
                    )
                      return;
                    const a = "color: " + this.color;
                    n.splice(1, 0, a, "color: inherit");
                    let t = 0,
                      i = 0;
                    n[0].replace(/%[a-zA-Z%]/g, (e) => {
                      "%%" !== e && (t++, "%c" === e && (i = t));
                    }),
                      n.splice(i, 0, a);
                  }),
                    (n.save = function (e) {
                      try {
                        e
                          ? n.storage.setItem("debug", e)
                          : n.storage.removeItem("debug");
                      } catch (e) {}
                    }),
                    (n.load = function () {
                      let e;
                      try {
                        e = n.storage.getItem("debug");
                      } catch (e) {}
                      return (
                        !e &&
                          "undefined" != typeof process &&
                          "env" in process &&
                          (e = process.env.DEBUG),
                        e
                      );
                    }),
                    (n.useColors = function () {
                      return (
                        !(
                          "undefined" == typeof window ||
                          !window.process ||
                          ("renderer" !== window.process.type &&
                            !window.process.__nwjs)
                        ) ||
                        (("undefined" == typeof navigator ||
                          !navigator.userAgent ||
                          !navigator.userAgent
                            .toLowerCase()
                            .match(/(edge|trident)\/(\d+)/)) &&
                          (("undefined" != typeof document &&
                            document.documentElement &&
                            document.documentElement.style &&
                            document.documentElement.style.WebkitAppearance) ||
                            ("undefined" != typeof window &&
                              window.console &&
                              (window.console.firebug ||
                                (window.console.exception &&
                                  window.console.table))) ||
                            ("undefined" != typeof navigator &&
                              navigator.userAgent &&
                              navigator.userAgent
                                .toLowerCase()
                                .match(/firefox\/(\d+)/) &&
                              parseInt(RegExp.$1, 10) >= 31) ||
                            ("undefined" != typeof navigator &&
                              navigator.userAgent &&
                              navigator.userAgent
                                .toLowerCase()
                                .match(/applewebkit\/(\d+)/))))
                      );
                    }),
                    (n.storage = (function () {
                      try {
                        return localStorage;
                      } catch (e) {}
                    })()),
                    (n.destroy = (() => {
                      let e = !1;
                      return () => {
                        e ||
                          ((e = !0),
                          console.warn(
                            "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
                          ));
                      };
                    })()),
                    (n.colors = [
                      "#0000CC",
                      "#0000FF",
                      "#0033CC",
                      "#0033FF",
                      "#0066CC",
                      "#0066FF",
                      "#0099CC",
                      "#0099FF",
                      "#00CC00",
                      "#00CC33",
                      "#00CC66",
                      "#00CC99",
                      "#00CCCC",
                      "#00CCFF",
                      "#3300CC",
                      "#3300FF",
                      "#3333CC",
                      "#3333FF",
                      "#3366CC",
                      "#3366FF",
                      "#3399CC",
                      "#3399FF",
                      "#33CC00",
                      "#33CC33",
                      "#33CC66",
                      "#33CC99",
                      "#33CCCC",
                      "#33CCFF",
                      "#6600CC",
                      "#6600FF",
                      "#6633CC",
                      "#6633FF",
                      "#66CC00",
                      "#66CC33",
                      "#9900CC",
                      "#9900FF",
                      "#9933CC",
                      "#9933FF",
                      "#99CC00",
                      "#99CC33",
                      "#CC0000",
                      "#CC0033",
                      "#CC0066",
                      "#CC0099",
                      "#CC00CC",
                      "#CC00FF",
                      "#CC3300",
                      "#CC3333",
                      "#CC3366",
                      "#CC3399",
                      "#CC33CC",
                      "#CC33FF",
                      "#CC6600",
                      "#CC6633",
                      "#CC9900",
                      "#CC9933",
                      "#CCCC00",
                      "#CCCC33",
                      "#FF0000",
                      "#FF0033",
                      "#FF0066",
                      "#FF0099",
                      "#FF00CC",
                      "#FF00FF",
                      "#FF3300",
                      "#FF3333",
                      "#FF3366",
                      "#FF3399",
                      "#FF33CC",
                      "#FF33FF",
                      "#FF6600",
                      "#FF6633",
                      "#FF9900",
                      "#FF9933",
                      "#FFCC00",
                      "#FFCC33",
                    ]),
                    (n.log = console.debug || console.log || (() => {})),
                    (e.exports = Ze()(n));
                  const { formatters: a } = e.exports;
                  a.j = function (e) {
                    try {
                      return JSON.stringify(e);
                    } catch (e) {
                      return "[UnexpectedJSONParseError]: " + e.message;
                    }
                  };
                })(Xe, Ye)),
              Ye))
          : (e.exports =
              (en ||
                ((en = 1),
                (function (e, n) {
                  const a = g,
                    t = h;
                  (n.init = function (e) {
                    e.inspectOpts = {};
                    const a = Object.keys(n.inspectOpts);
                    for (let t = 0; t < a.length; t++)
                      e.inspectOpts[a[t]] = n.inspectOpts[a[t]];
                  }),
                    (n.log = function (...e) {
                      return process.stderr.write(t.format(...e) + "\n");
                    }),
                    (n.formatArgs = function (a) {
                      const { namespace: t, useColors: i } = this;
                      if (i) {
                        const n = this.color,
                          i = "[3" + (n < 8 ? n : "8;5;" + n),
                          o = `  ${i};1m${t} [0m`;
                        (a[0] = o + a[0].split("\n").join("\n" + o)),
                          a.push(i + "m+" + e.exports.humanize(this.diff) + "[0m");
                      } else
                        a[0] =
                          (n.inspectOpts.hideDate
                            ? ""
                            : new Date().toISOString() + " ") +
                          t +
                          " " +
                          a[0];
                    }),
                    (n.save = function (e) {
                      e ? (process.env.DEBUG = e) : delete process.env.DEBUG;
                    }),
                    (n.load = function () {
                      return process.env.DEBUG;
                    }),
                    (n.useColors = function () {
                      return "colors" in n.inspectOpts
                        ? Boolean(n.inspectOpts.colors)
                        : a.isatty(process.stderr.fd);
                    }),
                    (n.destroy = t.deprecate(() => {},
                    "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.")),
                    (n.colors = [6, 2, 3, 4, 5, 1]);
                  try {
                    const e = je();
                    e &&
                      (e.stderr || e).level >= 2 &&
                      (n.colors = [
                        20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45,
                        56, 57, 62, 63, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81,
                        92, 93, 98, 99, 112, 113, 128, 129, 134, 135, 148, 149,
                        160, 161, 162, 163, 164, 165, 166, 167, 168, 169, 170,
                        171, 172, 173, 178, 179, 184, 185, 196, 197, 198, 199,
                        200, 201, 202, 203, 204, 205, 206, 207, 208, 209, 214,
                        215, 220, 221,
                      ]);
                  } catch (e) {}
                  (n.inspectOpts = Object.keys(process.env)
                    .filter((e) => /^debug_/i.test(e))
                    .reduce((e, n) => {
                      const a = n
                        .substring(6)
                        .toLowerCase()
                        .replace(/_([a-z])/g, (e, n) => n.toUpperCase());
                      let t = process.env[n];
                      return (
                        (t =
                          !!/^(yes|on|true|enabled)$/i.test(t) ||
                          (!/^(no|off|false|disabled)$/i.test(t) &&
                            ("null" === t ? null : Number(t)))),
                        (e[a] = t),
                        e
                      );
                    }, {})),
                    (e.exports = Ze()(n));
                  const { formatters: i } = e.exports;
                  (i.o = function (e) {
                    return (
                      (this.inspectOpts.colors = this.useColors),
                      t
                        .inspect(e, this.inspectOpts)
                        .split("\n")
                        .map((e) => e.trim())
                        .join(" ")
                    );
                  }),
                    (i.O = function (e) {
                      return (
                        (this.inspectOpts.colors = this.useColors),
                        t.inspect(e, this.inspectOpts)
                      );
                    });
                })(on, tn)),
              tn))),
      Ke
    );
    var e;
  }
  var rn = u,
    cn = rn.URL,
    pn = m,
    ln = f,
    un = x.Writable,
    dn = v,
    mn = function () {
      if (!an) {
        try {
          an = sn()("follow-redirects");
        } catch (e) {}
        "function" != typeof an && (an = function () {});
      }
      an.apply(null, arguments);
    },
    fn = ["abort", "aborted", "connect", "error", "socket", "timeout"],
    hn = Object.create(null);
  fn.forEach(function (e) {
    hn[e] = function (n, a, t) {
      this._redirectable.emit(e, n, a, t);
    };
  });
  var xn = Rn("ERR_INVALID_URL", "Invalid URL", TypeError),
    vn = Rn("ERR_FR_REDIRECTION_FAILURE", "Redirected request failed"),
    bn = Rn(
      "ERR_FR_TOO_MANY_REDIRECTS",
      "Maximum number of redirects exceeded"
    ),
    gn = Rn(
      "ERR_FR_MAX_BODY_LENGTH_EXCEEDED",
      "Request body larger than maxBodyLength limit"
    ),
    yn = Rn("ERR_STREAM_WRITE_AFTER_END", "write after end");
  function wn(e, n) {
    un.call(this),
      this._sanitizeOptions(e),
      (this._options = e),
      (this._ended = !1),
      (this._ending = !1),
      (this._redirectCount = 0),
      (this._redirects = []),
      (this._requestBodyLength = 0),
      (this._requestBodyBuffers = []),
      n && this.on("response", n);
    var a = this;
    (this._onNativeResponse = function (e) {
      a._processResponse(e);
    }),
      this._performRequest();
  }
  function _n(e) {
    var n = { maxRedirects: 21, maxBodyLength: 10485760 },
      a = {};
    return (
      Object.keys(e).forEach(function (t) {
        var i = t + ":",
          o = (a[i] = e[t]),
          s = (n[t] = Object.create(o));
        Object.defineProperties(s, {
          request: {
            value: function (e, t, o) {
              if (Sn(e)) {
                var s;
                try {
                  s = jn(new cn(e));
                } catch (n) {
                  s = rn.parse(e);
                }
                if (!Sn(s.protocol)) throw new xn({ input: e });
                e = s;
              } else
                cn && e instanceof cn
                  ? (e = jn(e))
                  : ((o = t), (t = e), (e = { protocol: i }));
              return (
                On(t) && ((o = t), (t = null)),
                ((t = Object.assign(
                  {
                    maxRedirects: n.maxRedirects,
                    maxBodyLength: n.maxBodyLength,
                  },
                  e,
                  t
                )).nativeProtocols = a),
                Sn(t.host) || Sn(t.hostname) || (t.hostname = "::1"),
                dn.equal(t.protocol, i, "protocol mismatch"),
                mn("options", t),
                new wn(t, o)
              );
            },
            configurable: !0,
            enumerable: !0,
            writable: !0,
          },
          get: {
            value: function (e, n, a) {
              var t = s.request(e, n, a);
              return t.end(), t;
            },
            configurable: !0,
            enumerable: !0,
            writable: !0,
          },
        });
      }),
      n
    );
  }
  function kn() {}
  function jn(e) {
    var n = {
      protocol: e.protocol,
      hostname: e.hostname.startsWith("[")
        ? e.hostname.slice(1, -1)
        : e.hostname,
      hash: e.hash,
      search: e.search,
      pathname: e.pathname,
      path: e.pathname + e.search,
      href: e.href,
    };
    return "" !== e.port && (n.port = Number(e.port)), n;
  }
  function En(e, n) {
    var a;
    for (var t in n) e.test(t) && ((a = n[t]), delete n[t]);
    return null == a ? void 0 : String(a).trim();
  }
  function Rn(e, n, a) {
    function t(a) {
      Error.captureStackTrace(this, this.constructor),
        Object.assign(this, a || {}),
        (this.code = e),
        (this.message = this.cause ? n + ": " + this.cause.message : n);
    }
    return (
      (t.prototype = new (a || Error)()),
      (t.prototype.constructor = t),
      (t.prototype.name = "Error [" + e + "]"),
      t
    );
  }
  function Cn(e) {
    for (var n of fn) e.removeListener(n, hn[n]);
    e.on("error", kn), e.abort();
  }
  function Sn(e) {
    return "string" == typeof e || e instanceof String;
  }
  function On(e) {
    return "function" == typeof e;
  }
  (wn.prototype = Object.create(un.prototype)),
    (wn.prototype.abort = function () {
      Cn(this._currentRequest), this.emit("abort");
    }),
    (wn.prototype.write = function (e, n, a) {
      if (this._ending) throw new yn();
      if (!(Sn(e) || ("object" == typeof (t = e) && "length" in t)))
        throw new TypeError("data should be a string, Buffer or Uint8Array");
      var t;
      On(n) && ((a = n), (n = null)),
        0 !== e.length
          ? this._requestBodyLength + e.length <= this._options.maxBodyLength
            ? ((this._requestBodyLength += e.length),
              this._requestBodyBuffers.push({ data: e, encoding: n }),
              this._currentRequest.write(e, n, a))
            : (this.emit("error", new gn()), this.abort())
          : a && a();
    }),
    (wn.prototype.end = function (e, n, a) {
      if (
        (On(e) ? ((a = e), (e = n = null)) : On(n) && ((a = n), (n = null)), e)
      ) {
        var t = this,
          i = this._currentRequest;
        this.write(e, n, function () {
          (t._ended = !0), i.end(null, null, a);
        }),
          (this._ending = !0);
      } else
        (this._ended = this._ending = !0),
          this._currentRequest.end(null, null, a);
    }),
    (wn.prototype.setHeader = function (e, n) {
      (this._options.headers[e] = n), this._currentRequest.setHeader(e, n);
    }),
    (wn.prototype.removeHeader = function (e) {
      delete this._options.headers[e], this._currentRequest.removeHeader(e);
    }),
    (wn.prototype.setTimeout = function (e, n) {
      var a = this;
      function t(n) {
        n.setTimeout(e),
          n.removeListener("timeout", n.destroy),
          n.addListener("timeout", n.destroy);
      }
      function i(n) {
        a._timeout && clearTimeout(a._timeout),
          (a._timeout = setTimeout(function () {
            a.emit("timeout"), o();
          }, e)),
          t(n);
      }
      function o() {
        a._timeout && (clearTimeout(a._timeout), (a._timeout = null)),
          a.removeListener("abort", o),
          a.removeListener("error", o),
          a.removeListener("response", o),
          n && a.removeListener("timeout", n),
          a.socket || a._currentRequest.removeListener("socket", i);
      }
      return (
        n && this.on("timeout", n),
        this.socket ? i(this.socket) : this._currentRequest.once("socket", i),
        this.on("socket", t),
        this.on("abort", o),
        this.on("error", o),
        this.on("response", o),
        this
      );
    }),
    ["flushHeaders", "getHeader", "setNoDelay", "setSocketKeepAlive"].forEach(
      function (e) {
        wn.prototype[e] = function (n, a) {
          return this._currentRequest[e](n, a);
        };
      }
    ),
    ["aborted", "connection", "socket"].forEach(function (e) {
      Object.defineProperty(wn.prototype, e, {
        get: function () {
          return this._currentRequest[e];
        },
      });
    }),
    (wn.prototype._sanitizeOptions = function (e) {
      if (
        (e.headers || (e.headers = {}),
        e.host && (e.hostname || (e.hostname = e.host), delete e.host),
        !e.pathname && e.path)
      ) {
        var n = e.path.indexOf("?");
        n < 0
          ? (e.pathname = e.path)
          : ((e.pathname = e.path.substring(0, n)),
            (e.search = e.path.substring(n)));
      }
    }),
    (wn.prototype._performRequest = function () {
      var e = this._options.protocol,
        n = this._options.nativeProtocols[e];
      if (n) {
        if (this._options.agents) {
          var a = e.slice(0, -1);
          this._options.agent = this._options.agents[a];
        }
        var t = (this._currentRequest = n.request(
          this._options,
          this._onNativeResponse
        ));
        for (var i of ((t._redirectable = this), fn)) t.on(i, hn[i]);
        if (
          ((this._currentUrl = /^\//.test(this._options.path)
            ? rn.format(this._options)
            : this._options.path),
          this._isRedirect)
        ) {
          var o = 0,
            s = this,
            r = this._requestBodyBuffers;
          !(function e(n) {
            if (t === s._currentRequest)
              if (n) s.emit("error", n);
              else if (o < r.length) {
                var a = r[o++];
                t.finished || t.write(a.data, a.encoding, e);
              } else s._ended && t.end();
          })();
        }
      } else this.emit("error", new TypeError("Unsupported protocol " + e));
    }),
    (wn.prototype._processResponse = function (e) {
      var n = e.statusCode;
      this._options.trackRedirects &&
        this._redirects.push({
          url: this._currentUrl,
          headers: e.headers,
          statusCode: n,
        });
      var a = e.headers.location;
      if (!a || !1 === this._options.followRedirects || n < 300 || n >= 400)
        return (
          (e.responseUrl = this._currentUrl),
          (e.redirects = this._redirects),
          this.emit("response", e),
          void (this._requestBodyBuffers = [])
        );
      if (
        (Cn(this._currentRequest),
        e.destroy(),
        ++this._redirectCount > this._options.maxRedirects)
      )
        this.emit("error", new bn());
      else {
        var t,
          i = this._options.beforeRedirect;
        i &&
          (t = Object.assign(
            { Host: e.req.getHeader("host") },
            this._options.headers
          ));
        var o = this._options.method;
        (((301 === n || 302 === n) && "POST" === this._options.method) ||
          (303 === n && !/^(?:GET|HEAD)$/.test(this._options.method))) &&
          ((this._options.method = "GET"),
          (this._requestBodyBuffers = []),
          En(/^content-/i, this._options.headers));
        var s,
          r = En(/^host$/i, this._options.headers),
          c = rn.parse(this._currentUrl),
          p = r || c.host,
          l = /^\w+:/.test(a)
            ? this._currentUrl
            : rn.format(Object.assign(c, { host: p }));
        try {
          s = rn.resolve(l, a);
        } catch (e) {
          return void this.emit("error", new vn({ cause: e }));
        }
        mn("redirecting to", s), (this._isRedirect = !0);
        var u = rn.parse(s);
        if (
          (Object.assign(this._options, u),
          ((u.protocol !== c.protocol && "https:" !== u.protocol) ||
            (u.host !== p &&
              !(function (e, n) {
                dn(Sn(e) && Sn(n));
                var a = e.length - n.length - 1;
                return a > 0 && "." === e[a] && e.endsWith(n);
              })(u.host, p))) &&
            En(/^(?:authorization|cookie)$/i, this._options.headers),
          On(i))
        ) {
          var d = { headers: e.headers, statusCode: n },
            m = { url: l, method: o, headers: t };
          try {
            i(this._options, d, m);
          } catch (e) {
            return void this.emit("error", e);
          }
          this._sanitizeOptions(this._options);
        }
        try {
          this._performRequest();
        } catch (e) {
          this.emit("error", new vn({ cause: e }));
        }
      }
    }),
    (Je.exports = _n({ http: pn, https: ln })),
    (Ve.wrap = _n);
  const An = "1.3.2";
  function Tn(e) {
    const n = /^([-+\w]{1,25})(:?\/\/|:)/.exec(e);
    return (n && n[1]) || "";
  }
  const Fn = /^(?:([^;]+);)?(?:[^;]+;)?(base64|),([\s\S]*)$/;
  function Pn(e, n) {
    e = e || 10;
    const a = new Array(e),
      t = new Array(e);
    let i,
      o = 0,
      s = 0;
    return (
      (n = void 0 !== n ? n : 1e3),
      function (r) {
        const c = Date.now(),
          p = t[s];
        i || (i = c), (a[o] = r), (t[o] = c);
        let l = s,
          u = 0;
        for (; l !== o; ) (u += a[l++]), (l %= e);
        if (((o = (o + 1) % e), o === s && (s = (s + 1) % e), c - i < n))
          return;
        const d = p && c - p;
        return d ? Math.round((1e3 * u) / d) : void 0;
      }
    );
  }
  const Ln = Symbol("internals");
  class Bn extends x.Transform {
    constructor(e) {
      super({
        readableHighWaterMark: (e = ae.toFlatObject(
          e,
          {
            maxRate: 0,
            chunkSize: 65536,
            minChunkSize: 100,
            timeWindow: 500,
            ticksRate: 2,
            samplesCount: 15,
          },
          null,
          (e, n) => !ae.isUndefined(n[e])
        )).chunkSize,
      });
      const n = this,
        a = (this[Ln] = {
          length: e.length,
          timeWindow: e.timeWindow,
          ticksRate: e.ticksRate,
          chunkSize: e.chunkSize,
          maxRate: e.maxRate,
          minChunkSize: e.minChunkSize,
          bytesSeen: 0,
          isCaptured: !1,
          notifiedBytesLoaded: 0,
          ts: Date.now(),
          bytes: 0,
          onReadCallback: null,
        }),
        t = Pn(a.ticksRate * e.samplesCount, a.timeWindow);
      this.on("newListener", (e) => {
        "progress" === e && (a.isCaptured || (a.isCaptured = !0));
      });
      let i = 0;
      a.updateProgress = (function (e, n) {
        let a = 0;
        const t = 1e3 / n;
        let i = null;
        return function (n, o) {
          const s = Date.now();
          if (n || s - a > t)
            return (
              i && (clearTimeout(i), (i = null)), (a = s), e.apply(null, o)
            );
          i ||
            (i = setTimeout(
              () => ((i = null), (a = Date.now()), e.apply(null, o)),
              t - (s - a)
            ));
        };
      })(function () {
        const e = a.length,
          o = a.bytesSeen,
          s = o - i;
        if (!s || n.destroyed) return;
        const r = t(s);
        (i = o),
          process.nextTick(() => {
            n.emit("progress", {
              loaded: o,
              total: e,
              progress: e ? o / e : void 0,
              bytes: s,
              rate: r || void 0,
              estimated: r && e && o <= e ? (e - o) / r : void 0,
            });
          });
      }, a.ticksRate);
      const o = () => {
        a.updateProgress(!0);
      };
      this.once("end", o), this.once("error", o);
    }
    _read(e) {
      const n = this[Ln];
      return n.onReadCallback && n.onReadCallback(), super._read(e);
    }
    _transform(e, n, a) {
      const t = this,
        i = this[Ln],
        o = i.maxRate,
        s = this.readableHighWaterMark,
        r = i.timeWindow,
        c = o / (1e3 / r),
        p = !1 !== i.minChunkSize ? Math.max(i.minChunkSize, 0.01 * c) : 0,
        l = (e, n) => {
          const a = Buffer.byteLength(e);
          let l,
            u = null,
            d = s,
            m = 0;
          if (o) {
            const e = Date.now();
            (!i.ts || (m = e - i.ts) >= r) &&
              ((i.ts = e),
              (l = c - i.bytes),
              (i.bytes = l < 0 ? -l : 0),
              (m = 0)),
              (l = c - i.bytes);
          }
          if (o) {
            if (l <= 0)
              return setTimeout(() => {
                n(null, e);
              }, r - m);
            l < d && (d = l);
          }
          d &&
            a > d &&
            a - d > p &&
            ((u = e.subarray(d)), (e = e.subarray(0, d))),
            (function (e, n) {
              const a = Buffer.byteLength(e);
              (i.bytesSeen += a),
                (i.bytes += a),
                i.isCaptured && i.updateProgress(),
                t.push(e)
                  ? process.nextTick(n)
                  : (i.onReadCallback = () => {
                      (i.onReadCallback = null), process.nextTick(n);
                    });
            })(
              e,
              u
                ? () => {
                    process.nextTick(n, null, u);
                  }
                : n
            );
        };
      l(e, function e(n, t) {
        if (n) return a(n);
        t ? l(t, e) : a(null);
      });
    }
    setLength(e) {
      return (this[Ln].length = +e), this;
    }
  }
  var zn = Bn;
  const { asyncIterator: Nn } = Symbol;
  var Un = async function* (e) {
    e.stream
      ? yield* e.stream()
      : e.arrayBuffer
      ? yield await e.arrayBuffer()
      : e[Nn]
      ? yield* e[Nn]()
      : yield e;
  };
  const qn = ae.ALPHABET.ALPHA_DIGIT + "-_",
    Dn = new h.TextEncoder(),
    In = "\r\n",
    Mn = Dn.encode(In);
  class Hn {
    constructor(e, n) {
      const { escapeName: a } = this.constructor,
        t = ae.isString(n);
      let i = `Content-Disposition: form-data; name="${a(e)}"${
        !t && n.name ? `; filename="${a(n.name)}"` : ""
      }${In}`;
      t
        ? (n = Dn.encode(String(n).replace(/\r?\n|\r\n?/g, In)))
        : (i += `Content-Type: ${n.type || "application/octet-stream"}${In}`),
        (this.headers = Dn.encode(i + In)),
        (this.contentLength = t ? n.byteLength : n.size),
        (this.size = this.headers.byteLength + this.contentLength + 2),
        (this.name = e),
        (this.value = n);
    }
    async *encode() {
      yield this.headers;
      const { value: e } = this;
      ae.isTypedArray(e) ? yield e : yield* Un(e), yield Mn;
    }
    static escapeName(e) {
      return String(e).replace(
        /[\r\n"]/g,
        (e) => ({ "\r": "%0D", "\n": "%0A", '"': "%22" }[e])
      );
    }
  }
  class $n extends x.Transform {
    __transform(e, n, a) {
      this.push(e), a();
    }
    _transform(e, n, a) {
      if (
        0 !== e.length &&
        ((this._transform = this.__transform), 120 !== e[0])
      ) {
        const e = Buffer.alloc(2);
        (e[0] = 120), (e[1] = 156), this.push(e, n);
      }
      this.__transform(e, n, a);
    }
  }
  var Wn = $n;
  const Gn = {
      flush: y.constants.Z_SYNC_FLUSH,
      finishFlush: y.constants.Z_SYNC_FLUSH,
    },
    Vn = {
      flush: y.constants.BROTLI_OPERATION_FLUSH,
      finishFlush: y.constants.BROTLI_OPERATION_FLUSH,
    },
    Jn = ae.isFunction(y.createBrotliDecompress),
    { http: Kn, https: Qn } = Ve,
    Yn = /https:?/,
    Xn = ye.protocols.map((e) => e + ":");
  function Zn(e) {
    e.beforeRedirects.proxy && e.beforeRedirects.proxy(e),
      e.beforeRedirects.config && e.beforeRedirects.config(e);
  }
  function ea(e, n, a) {
    let t = n;
    if (!t && !1 !== t) {
      const e = (function (e) {
        var n = "string" == typeof e ? De(e) : e || {},
          a = n.protocol,
          t = n.host,
          i = n.port;
        if ("string" != typeof t || !t || "string" != typeof a) return "";
        if (
          ((a = a.split(":", 1)[0]),
          !(function (e, n) {
            var a = (He("npm_config_no_proxy") || He("no_proxy")).toLowerCase();
            return (
              !a ||
              ("*" !== a &&
                a.split(/[,\s]/).every(function (a) {
                  if (!a) return !0;
                  var t = a.match(/^(.+):(\d+)$/),
                    i = t ? t[1] : a,
                    o = t ? parseInt(t[2]) : 0;
                  return (
                    !(!o || o === n) ||
                    (/^[.*]/.test(i)
                      ? ("*" === i.charAt(0) && (i = i.slice(1)),
                        !Me.call(e, i))
                      : e !== i)
                  );
                }))
            );
          })((t = t.replace(/:\d*$/, "")), (i = parseInt(i) || Ie[a] || 0)))
        )
          return "";
        var o =
          He("npm_config_" + a + "_proxy") ||
          He(a + "_proxy") ||
          He("npm_config_proxy") ||
          He("all_proxy");
        return o && -1 === o.indexOf("://") && (o = a + "://" + o), o;
      })(a);
      e && (t = new URL(e));
    }
    if (t) {
      if (
        (t.username && (t.auth = (t.username || "") + ":" + (t.password || "")),
        t.auth)
      ) {
        (t.auth.username || t.auth.password) &&
          (t.auth = (t.auth.username || "") + ":" + (t.auth.password || ""));
        const n = Buffer.from(t.auth, "utf8").toString("base64");
        e.headers["Proxy-Authorization"] = "Basic " + n;
      }
      e.headers.host = e.hostname + (e.port ? ":" + e.port : "");
      const n = t.hostname || t.host;
      (e.hostname = n),
        (e.host = n),
        (e.port = t.port),
        (e.path = a),
        t.protocol &&
          (e.protocol = t.protocol.includes(":")
            ? t.protocol
            : `${t.protocol}:`);
    }
    e.beforeRedirects.proxy = function (e) {
      ea(e, n, e.href);
    };
  }
  var na =
      "undefined" != typeof process &&
      "process" === ae.kindOf(process) &&
      function (e) {
        return new Promise(async function (n, a) {
          let t = e.data;
          const i = e.responseType,
            o = e.responseEncoding,
            s = e.method.toUpperCase();
          let r,
            c,
            p,
            l = !1;
          const u = new w();
          function d() {
            r ||
              ((r = !0),
              e.cancelToken && e.cancelToken.unsubscribe(_),
              e.signal && e.signal.removeEventListener("abort", _),
              u.removeAllListeners());
          }
          function v(e, t) {
            c || ((c = !0), t && ((l = !0), d()), t ? a(e) : n(e));
          }
          const b = function (e) {
              v(e);
            },
            g = function (e) {
              v(e, !0);
            };
          function _(n) {
            u.emit("abort", !n || n.type ? new Ne(null, e, p) : n);
          }
          u.once("abort", g),
            (e.cancelToken || e.signal) &&
              (e.cancelToken && e.cancelToken.subscribe(_),
              e.signal &&
                (e.signal.aborted
                  ? _()
                  : e.signal.addEventListener("abort", _)));
          const k = qe(e.baseURL, e.url),
            j = new URL(k, "http://localhost"),
            E = j.protocol || Xn[0];
          if ("data:" === E) {
            let a;
            if ("GET" !== s)
              return Ue(b, g, {
                status: 405,
                statusText: "method not allowed",
                headers: {},
                config: e,
              });
            try {
              a = (function (e, n, a) {
                const t = (a && a.Blob) || ye.classes.Blob,
                  i = Tn(e);
                if ((void 0 === n && t && (n = !0), "data" === i)) {
                  e = i.length ? e.slice(i.length + 1) : e;
                  const a = Fn.exec(e);
                  if (!a) throw new te("Invalid URL", te.ERR_INVALID_URL);
                  const o = a[1],
                    s = a[2],
                    r = a[3],
                    c = Buffer.from(
                      decodeURIComponent(r),
                      s ? "base64" : "utf8"
                    );
                  if (n) {
                    if (!t)
                      throw new te("Blob is not supported", te.ERR_NOT_SUPPORT);
                    return new t([c], { type: o });
                  }
                  return c;
                }
                throw new te("Unsupported protocol " + i, te.ERR_NOT_SUPPORT);
              })(e.url, "blob" === i, { Blob: e.env && e.env.Blob });
            } catch (n) {
              throw te.from(n, te.ERR_BAD_REQUEST, e);
            }
            return (
              "text" === i
                ? ((a = a.toString(o)),
                  (o && "utf8" !== o) || (a = ae.stripBOM(a)))
                : "stream" === i && (a = x.Readable.from(a)),
              Ue(b, g, {
                data: a,
                status: 200,
                statusText: "OK",
                headers: new Le(),
                config: e,
              })
            );
          }
          if (-1 === Xn.indexOf(E))
            return g(
              new te("Unsupported protocol " + E, te.ERR_BAD_REQUEST, e)
            );
          const R = Le.from(e.headers).normalize();
          R.set("User-Agent", "axios/" + An, !1);
          const C = e.onDownloadProgress,
            S = e.onUploadProgress,
            O = e.maxRate;
          let A, T;
          if (ae.isSpecCompliantForm(t)) {
            const e = R.getContentType(/boundary=([-_\w\d]{10,70})/i);
            t = ((e, n, a) => {
              const {
                tag: t = "form-data-boundary",
                size: i = 25,
                boundary: o = t + "-" + ae.generateString(i, qn),
              } = a || {};
              if (!ae.isFormData(e))
                throw TypeError("FormData instance required");
              if (o.length < 1 || o.length > 70)
                throw Error("boundary must be 10-70 characters long");
              const s = Dn.encode("--" + o + In),
                r = Dn.encode("--" + o + "--" + In + In);
              let c = r.byteLength;
              const p = Array.from(e.entries()).map(([e, n]) => {
                const a = new Hn(e, n);
                return (c += a.size), a;
              });
              (c += s.byteLength * p.length), (c = ae.toFiniteNumber(c));
              const l = {
                "Content-Type": `multipart/form-data; boundary=${o}`,
              };
              return (
                Number.isFinite(c) && (l["Content-Length"] = c),
                n && n(l),
                x.Readable.from(
                  (async function* () {
                    for (const e of p) yield s, yield* e.encode();
                    yield r;
                  })()
                )
              );
            })(
              t,
              (e) => {
                R.set(e);
              },
              { tag: `axios-${An}-boundary`, boundary: (e && e[1]) || void 0 }
            );
          } else if (ae.isFormData(t) && ae.isFunction(t.getHeaders)) {
            if ((R.set(t.getHeaders()), !R.hasContentLength()))
              try {
                const e = await h.promisify(t.getLength).call(t);
                R.setContentLength(e);
              } catch (e) {}
          } else if (ae.isBlob(t))
            t.size && R.setContentType(t.type || "application/octet-stream"),
              R.setContentLength(t.size || 0),
              (t = x.Readable.from(Un(t)));
          else if (t && !ae.isStream(t)) {
            if (Buffer.isBuffer(t));
            else if (ae.isArrayBuffer(t)) t = Buffer.from(new Uint8Array(t));
            else {
              if (!ae.isString(t))
                return g(
                  new te(
                    "Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream",
                    te.ERR_BAD_REQUEST,
                    e
                  )
                );
              t = Buffer.from(t, "utf-8");
            }
            if (
              (R.setContentLength(t.length, !1),
              e.maxBodyLength > -1 && t.length > e.maxBodyLength)
            )
              return g(
                new te(
                  "Request body larger than maxBodyLength limit",
                  te.ERR_BAD_REQUEST,
                  e
                )
              );
          }
          const F = ae.toFiniteNumber(R.getContentLength());
          let P, L;
          ae.isArray(O) ? ((A = O[0]), (T = O[1])) : (A = T = O),
            t &&
              (S || A) &&
              (ae.isStream(t) || (t = x.Readable.from(t, { objectMode: !1 })),
              (t = x.pipeline(
                [t, new zn({ length: F, maxRate: ae.toFiniteNumber(A) })],
                ae.noop
              )),
              S &&
                t.on("progress", (e) => {
                  S(Object.assign(e, { upload: !0 }));
                })),
            e.auth &&
              (P = (e.auth.username || "") + ":" + (e.auth.password || "")),
            !P && j.username && (P = j.username + ":" + j.password),
            P && R.delete("authorization");
          try {
            L = ve(j.pathname + j.search, e.params, e.paramsSerializer).replace(
              /^\?/,
              ""
            );
          } catch (n) {
            const a = new Error(n.message);
            return (a.config = e), (a.url = e.url), (a.exists = !0), g(a);
          }
          R.set(
            "Accept-Encoding",
            "gzip, compress, deflate" + (Jn ? ", br" : ""),
            !1
          );
          const B = {
            path: L,
            method: s,
            headers: R.toJSON(),
            agents: { http: e.httpAgent, https: e.httpsAgent },
            auth: P,
            protocol: E,
            beforeRedirect: Zn,
            beforeRedirects: {},
          };
          let z;
          e.socketPath
            ? (B.socketPath = e.socketPath)
            : ((B.hostname = j.hostname),
              (B.port = j.port),
              ea(
                B,
                e.proxy,
                E + "//" + j.hostname + (j.port ? ":" + j.port : "") + B.path
              ));
          const N = Yn.test(B.protocol);
          if (
            ((B.agent = N ? e.httpsAgent : e.httpAgent),
            e.transport
              ? (z = e.transport)
              : 0 === e.maxRedirects
              ? (z = N ? f : m)
              : (e.maxRedirects && (B.maxRedirects = e.maxRedirects),
                e.beforeRedirect &&
                  (B.beforeRedirects.config = e.beforeRedirect),
                (z = N ? Qn : Kn)),
            e.maxBodyLength > -1
              ? (B.maxBodyLength = e.maxBodyLength)
              : (B.maxBodyLength = 1 / 0),
            e.insecureHTTPParser &&
              (B.insecureHTTPParser = e.insecureHTTPParser),
            (p = z.request(B, function (n) {
              if (p.destroyed) return;
              const a = [n],
                t = +n.headers["content-length"];
              if (C) {
                const e = new zn({
                  length: ae.toFiniteNumber(t),
                  maxRate: ae.toFiniteNumber(T),
                });
                C &&
                  e.on("progress", (e) => {
                    C(Object.assign(e, { download: !0 }));
                  }),
                  a.push(e);
              }
              let r = n;
              const c = n.req || p;
              if (!1 !== e.decompress && n.headers["content-encoding"])
                switch (
                  (("HEAD" !== s && 204 !== n.statusCode) ||
                    delete n.headers["content-encoding"],
                  n.headers["content-encoding"])
                ) {
                  case "gzip":
                  case "x-gzip":
                  case "compress":
                  case "x-compress":
                    a.push(y.createUnzip(Gn)),
                      delete n.headers["content-encoding"];
                    break;
                  case "deflate":
                    a.push(new Wn()),
                      a.push(y.createUnzip(Gn)),
                      delete n.headers["content-encoding"];
                    break;
                  case "br":
                    Jn &&
                      (a.push(y.createBrotliDecompress(Vn)),
                      delete n.headers["content-encoding"]);
                }
              r = a.length > 1 ? x.pipeline(a, ae.noop) : a[0];
              const m = x.finished(r, () => {
                  m(), d();
                }),
                f = {
                  status: n.statusCode,
                  statusText: n.statusMessage,
                  headers: new Le(n.headers),
                  config: e,
                  request: c,
                };
              if ("stream" === i) (f.data = r), Ue(b, g, f);
              else {
                const n = [];
                let a = 0;
                r.on("data", function (t) {
                  n.push(t),
                    (a += t.length),
                    e.maxContentLength > -1 &&
                      a > e.maxContentLength &&
                      ((l = !0),
                      r.destroy(),
                      g(
                        new te(
                          "maxContentLength size of " +
                            e.maxContentLength +
                            " exceeded",
                          te.ERR_BAD_RESPONSE,
                          e,
                          c
                        )
                      ));
                }),
                  r.on("aborted", function () {
                    if (l) return;
                    const n = new te(
                      "maxContentLength size of " +
                        e.maxContentLength +
                        " exceeded",
                      te.ERR_BAD_RESPONSE,
                      e,
                      c
                    );
                    r.destroy(n), g(n);
                  }),
                  r.on("error", function (n) {
                    p.destroyed || g(te.from(n, null, e, c));
                  }),
                  r.on("end", function () {
                    try {
                      let e = 1 === n.length ? n[0] : Buffer.concat(n);
                      "arraybuffer" !== i &&
                        ((e = e.toString(o)),
                        (o && "utf8" !== o) || (e = ae.stripBOM(e))),
                        (f.data = e);
                    } catch (n) {
                      g(te.from(n, null, e, f.request, f));
                    }
                    Ue(b, g, f);
                  });
              }
              u.once("abort", (e) => {
                r.destroyed || (r.emit("error", e), r.destroy());
              });
            })),
            u.once("abort", (e) => {
              g(e), p.destroy(e);
            }),
            p.on("error", function (n) {
              g(te.from(n, null, e, p));
            }),
            p.on("socket", function (e) {
              e.setKeepAlive(!0, 6e4);
            }),
            e.timeout)
          ) {
            const n = parseInt(e.timeout, 10);
            if (isNaN(n))
              return void g(
                new te(
                  "error trying to parse `config.timeout` to int",
                  te.ERR_BAD_OPTION_VALUE,
                  e,
                  p
                )
              );
            p.setTimeout(n, function () {
              if (c) return;
              let n = e.timeout
                ? "timeout of " + e.timeout + "ms exceeded"
                : "timeout exceeded";
              const a = e.transitional || ge;
              e.timeoutErrorMessage && (n = e.timeoutErrorMessage),
                g(
                  new te(
                    n,
                    a.clarifyTimeoutError ? te.ETIMEDOUT : te.ECONNABORTED,
                    e,
                    p
                  )
                ),
                _();
            });
          }
          if (ae.isStream(t)) {
            let n = !1,
              a = !1;
            t.on("end", () => {
              n = !0;
            }),
              t.once("error", (e) => {
                (a = !0), p.destroy(e);
              }),
              t.on("close", () => {
                n || a || _(new Ne("Request stream has been aborted", e, p));
              }),
              t.pipe(p);
          } else p.end(t);
        });
      },
    aa = ye.isStandardBrowserEnv
      ? {
          write: function (e, n, a, t, i, o) {
            const s = [];
            s.push(e + "=" + encodeURIComponent(n)),
              ae.isNumber(a) && s.push("expires=" + new Date(a).toGMTString()),
              ae.isString(t) && s.push("path=" + t),
              ae.isString(i) && s.push("domain=" + i),
              !0 === o && s.push("secure"),
              (document.cookie = s.join("; "));
          },
          read: function (e) {
            const n = document.cookie.match(
              new RegExp("(^|;\\s*)(" + e + ")=([^;]*)")
            );
            return n ? decodeURIComponent(n[3]) : null;
          },
          remove: function (e) {
            this.write(e, "", Date.now() - 864e5);
          },
        }
      : {
          write: function () {},
          read: function () {
            return null;
          },
          remove: function () {},
        },
    ta = ye.isStandardBrowserEnv
      ? (function () {
          const e = /(msie|trident)/i.test(navigator.userAgent),
            n = document.createElement("a");
          let a;
          function t(a) {
            let t = a;
            return (
              e && (n.setAttribute("href", t), (t = n.href)),
              n.setAttribute("href", t),
              {
                href: n.href,
                protocol: n.protocol ? n.protocol.replace(/:$/, "") : "",
                host: n.host,
                search: n.search ? n.search.replace(/^\?/, "") : "",
                hash: n.hash ? n.hash.replace(/^#/, "") : "",
                hostname: n.hostname,
                port: n.port,
                pathname:
                  "/" === n.pathname.charAt(0) ? n.pathname : "/" + n.pathname,
              }
            );
          }
          return (
            (a = t(window.location.href)),
            function (e) {
              const n = ae.isString(e) ? t(e) : e;
              return n.protocol === a.protocol && n.host === a.host;
            }
          );
        })()
      : function () {
          return !0;
        };
  function ia(e, n) {
    let a = 0;
    const t = Pn(50, 250);
    return (i) => {
      const o = i.loaded,
        s = i.lengthComputable ? i.total : void 0,
        r = o - a,
        c = t(r);
      a = o;
      const p = {
        loaded: o,
        total: s,
        progress: s ? o / s : void 0,
        bytes: r,
        rate: c || void 0,
        estimated: c && s && o <= s ? (s - o) / c : void 0,
        event: i,
      };
      (p[n ? "download" : "upload"] = !0), e(p);
    };
  }
  const oa = {
    http: na,
    xhr:
      "undefined" != typeof XMLHttpRequest &&
      function (e) {
        return new Promise(function (n, a) {
          let t = e.data;
          const i = Le.from(e.headers).normalize(),
            o = e.responseType;
          let s;
          function r() {
            e.cancelToken && e.cancelToken.unsubscribe(s),
              e.signal && e.signal.removeEventListener("abort", s);
          }
          ae.isFormData(t) &&
            (ye.isStandardBrowserEnv || ye.isStandardBrowserWebWorkerEnv) &&
            i.setContentType(!1);
          let c = new XMLHttpRequest();
          if (e.auth) {
            const n = e.auth.username || "",
              a = e.auth.password
                ? unescape(encodeURIComponent(e.auth.password))
                : "";
            i.set("Authorization", "Basic " + btoa(n + ":" + a));
          }
          const p = qe(e.baseURL, e.url);
          function l() {
            if (!c) return;
            const t = Le.from(
              "getAllResponseHeaders" in c && c.getAllResponseHeaders()
            );
            Ue(
              function (e) {
                n(e), r();
              },
              function (e) {
                a(e), r();
              },
              {
                data:
                  o && "text" !== o && "json" !== o
                    ? c.response
                    : c.responseText,
                status: c.status,
                statusText: c.statusText,
                headers: t,
                config: e,
                request: c,
              }
            ),
              (c = null);
          }
          if (
            (c.open(
              e.method.toUpperCase(),
              ve(p, e.params, e.paramsSerializer),
              !0
            ),
            (c.timeout = e.timeout),
            "onloadend" in c
              ? (c.onloadend = l)
              : (c.onreadystatechange = function () {
                  c &&
                    4 === c.readyState &&
                    (0 !== c.status ||
                      (c.responseURL &&
                        0 === c.responseURL.indexOf("file:"))) &&
                    setTimeout(l);
                }),
            (c.onabort = function () {
              c &&
                (a(new te("Request aborted", te.ECONNABORTED, e, c)),
                (c = null));
            }),
            (c.onerror = function () {
              a(new te("Network Error", te.ERR_NETWORK, e, c)), (c = null);
            }),
            (c.ontimeout = function () {
              let n = e.timeout
                ? "timeout of " + e.timeout + "ms exceeded"
                : "timeout exceeded";
              const t = e.transitional || ge;
              e.timeoutErrorMessage && (n = e.timeoutErrorMessage),
                a(
                  new te(
                    n,
                    t.clarifyTimeoutError ? te.ETIMEDOUT : te.ECONNABORTED,
                    e,
                    c
                  )
                ),
                (c = null);
            }),
            ye.isStandardBrowserEnv)
          ) {
            const n =
              (e.withCredentials || ta(p)) &&
              e.xsrfCookieName &&
              aa.read(e.xsrfCookieName);
            n && i.set(e.xsrfHeaderName, n);
          }
          void 0 === t && i.setContentType(null),
            "setRequestHeader" in c &&
              ae.forEach(i.toJSON(), function (e, n) {
                c.setRequestHeader(n, e);
              }),
            ae.isUndefined(e.withCredentials) ||
              (c.withCredentials = !!e.withCredentials),
            o && "json" !== o && (c.responseType = e.responseType),
            "function" == typeof e.onDownloadProgress &&
              c.addEventListener("progress", ia(e.onDownloadProgress, !0)),
            "function" == typeof e.onUploadProgress &&
              c.upload &&
              c.upload.addEventListener("progress", ia(e.onUploadProgress)),
            (e.cancelToken || e.signal) &&
              ((s = (n) => {
                c &&
                  (a(!n || n.type ? new Ne(null, e, c) : n),
                  c.abort(),
                  (c = null));
              }),
              e.cancelToken && e.cancelToken.subscribe(s),
              e.signal &&
                (e.signal.aborted
                  ? s()
                  : e.signal.addEventListener("abort", s)));
          const u = Tn(p);
          u && -1 === ye.protocols.indexOf(u)
            ? a(
                new te("Unsupported protocol " + u + ":", te.ERR_BAD_REQUEST, e)
              )
            : c.send(t || null);
        });
      },
  };
  ae.forEach(oa, (e, n) => {
    if (e) {
      try {
        Object.defineProperty(e, "name", { value: n });
      } catch (e) {}
      Object.defineProperty(e, "adapterName", { value: n });
    }
  });
  function sa(e) {
    if (
      (e.cancelToken && e.cancelToken.throwIfRequested(),
      e.signal && e.signal.aborted)
    )
      throw new Ne(null, e);
  }
  function ra(e) {
    return (
      sa(e),
      (e.headers = Le.from(e.headers)),
      (e.data = Be.call(e, e.transformRequest)),
      -1 !== ["post", "put", "patch"].indexOf(e.method) &&
        e.headers.setContentType("application/x-www-form-urlencoded", !1),
      ((e) => {
        e = ae.isArray(e) ? e : [e];
        const { length: n } = e;
        let a, t;
        for (
          let i = 0;
          i < n &&
          ((a = e[i]), !(t = ae.isString(a) ? oa[a.toLowerCase()] : a));
          i++
        );
        if (!t) {
          if (!1 === t)
            throw new te(
              `Adapter ${a} is not supported by the environment`,
              "ERR_NOT_SUPPORT"
            );
          throw new Error(
            ae.hasOwnProp(oa, a)
              ? `Adapter '${a}' is not available in the build`
              : `Unknown adapter '${a}'`
          );
        }
        if (!ae.isFunction(t)) throw new TypeError("adapter is not a function");
        return t;
      })(e.adapter || Ce.adapter)(e).then(
        function (n) {
          return (
            sa(e),
            (n.data = Be.call(e, e.transformResponse, n)),
            (n.headers = Le.from(n.headers)),
            n
          );
        },
        function (n) {
          return (
            ze(n) ||
              (sa(e),
              n &&
                n.response &&
                ((n.response.data = Be.call(
                  e,
                  e.transformResponse,
                  n.response
                )),
                (n.response.headers = Le.from(n.response.headers)))),
            Promise.reject(n)
          );
        }
      )
    );
  }
  const ca = (e) => (e instanceof Le ? e.toJSON() : e);
  function pa(e, n) {
    n = n || {};
    const a = {};
    function t(e, n, a) {
      return ae.isPlainObject(e) && ae.isPlainObject(n)
        ? ae.merge.call({ caseless: a }, e, n)
        : ae.isPlainObject(n)
        ? ae.merge({}, n)
        : ae.isArray(n)
        ? n.slice()
        : n;
    }
    function i(e, n, a) {
      return ae.isUndefined(n)
        ? ae.isUndefined(e)
          ? void 0
          : t(void 0, e, a)
        : t(e, n, a);
    }
    function o(e, n) {
      if (!ae.isUndefined(n)) return t(void 0, n);
    }
    function s(e, n) {
      return ae.isUndefined(n)
        ? ae.isUndefined(e)
          ? void 0
          : t(void 0, e)
        : t(void 0, n);
    }
    function r(a, i, o) {
      return o in n ? t(a, i) : o in e ? t(void 0, a) : void 0;
    }
    const c = {
      url: o,
      method: o,
      data: o,
      baseURL: s,
      transformRequest: s,
      transformResponse: s,
      paramsSerializer: s,
      timeout: s,
      timeoutMessage: s,
      withCredentials: s,
      adapter: s,
      responseType: s,
      xsrfCookieName: s,
      xsrfHeaderName: s,
      onUploadProgress: s,
      onDownloadProgress: s,
      decompress: s,
      maxContentLength: s,
      maxBodyLength: s,
      beforeRedirect: s,
      transport: s,
      httpAgent: s,
      httpsAgent: s,
      cancelToken: s,
      socketPath: s,
      responseEncoding: s,
      validateStatus: r,
      headers: (e, n) => i(ca(e), ca(n), !0),
    };
    return (
      ae.forEach(Object.keys(e).concat(Object.keys(n)), function (t) {
        const o = c[t] || i,
          s = o(e[t], n[t], t);
        (ae.isUndefined(s) && o !== r) || (a[t] = s);
      }),
      a
    );
  }
  const la = {};
  ["object", "boolean", "number", "function", "string", "symbol"].forEach(
    (e, n) => {
      la[e] = function (a) {
        return typeof a === e || "a" + (n < 1 ? "n " : " ") + e;
      };
    }
  );
  const ua = {};
  la.transitional = function (e, n, a) {
    function t(e, n) {
      return (
        "[Axios v1.3.2] Transitional option '" +
        e +
        "'" +
        n +
        (a ? ". " + a : "")
      );
    }
    return (a, i, o) => {
      if (!1 === e)
        throw new te(
          t(i, " has been removed" + (n ? " in " + n : "")),
          te.ERR_DEPRECATED
        );
      return (
        n &&
          !ua[i] &&
          ((ua[i] = !0),
          console.warn(
            t(
              i,
              " has been deprecated since v" +
                n +
                " and will be removed in the near future"
            )
          )),
        !e || e(a, i, o)
      );
    };
  };
  var da = {
    assertOptions: function (e, n, a) {
      if ("object" != typeof e)
        throw new te("options must be an object", te.ERR_BAD_OPTION_VALUE);
      const t = Object.keys(e);
      let i = t.length;
      for (; i-- > 0; ) {
        const o = t[i],
          s = n[o];
        if (s) {
          const n = e[o],
            a = void 0 === n || s(n, o, e);
          if (!0 !== a)
            throw new te(
              "option " + o + " must be " + a,
              te.ERR_BAD_OPTION_VALUE
            );
        } else if (!0 !== a)
          throw new te("Unknown option " + o, te.ERR_BAD_OPTION);
      }
    },
    validators: la,
  };
  const ma = da.validators;
  class fa {
    constructor(e) {
      (this.defaults = e),
        (this.interceptors = { request: new be(), response: new be() });
    }
    request(e, n) {
      "string" == typeof e ? ((n = n || {}).url = e) : (n = e || {}),
        (n = pa(this.defaults, n));
      const { transitional: a, paramsSerializer: t, headers: i } = n;
      let o;
      void 0 !== a &&
        da.assertOptions(
          a,
          {
            silentJSONParsing: ma.transitional(ma.boolean),
            forcedJSONParsing: ma.transitional(ma.boolean),
            clarifyTimeoutError: ma.transitional(ma.boolean),
          },
          !1
        ),
        void 0 !== t &&
          da.assertOptions(
            t,
            { encode: ma.function, serialize: ma.function },
            !0
          ),
        (n.method = (n.method || this.defaults.method || "get").toLowerCase()),
        (o = i && ae.merge(i.common, i[n.method])),
        o &&
          ae.forEach(
            ["delete", "get", "head", "post", "put", "patch", "common"],
            (e) => {
              delete i[e];
            }
          ),
        (n.headers = Le.concat(o, i));
      const s = [];
      let r = !0;
      this.interceptors.request.forEach(function (e) {
        ("function" == typeof e.runWhen && !1 === e.runWhen(n)) ||
          ((r = r && e.synchronous), s.unshift(e.fulfilled, e.rejected));
      });
      const c = [];
      let p;
      this.interceptors.response.forEach(function (e) {
        c.push(e.fulfilled, e.rejected);
      });
      let l,
        u = 0;
      if (!r) {
        const e = [ra.bind(this), void 0];
        for (
          e.unshift.apply(e, s),
            e.push.apply(e, c),
            l = e.length,
            p = Promise.resolve(n);
          u < l;

        )
          p = p.then(e[u++], e[u++]);
        return p;
      }
      l = s.length;
      let d = n;
      for (u = 0; u < l; ) {
        const n = s[u++],
          a = s[u++];
        try {
          d = n(d);
        } catch (e) {
          a.call(this, e);
          break;
        }
      }
      try {
        p = ra.call(this, d);
      } catch (e) {
        return Promise.reject(e);
      }
      for (u = 0, l = c.length; u < l; ) p = p.then(c[u++], c[u++]);
      return p;
    }
    getUri(e) {
      return ve(
        qe((e = pa(this.defaults, e)).baseURL, e.url),
        e.params,
        e.paramsSerializer
      );
    }
  }
  ae.forEach(["delete", "get", "head", "options"], function (e) {
    fa.prototype[e] = function (n, a) {
      return this.request(
        pa(a || {}, { method: e, url: n, data: (a || {}).data })
      );
    };
  }),
    ae.forEach(["post", "put", "patch"], function (e) {
      function n(n) {
        return function (a, t, i) {
          return this.request(
            pa(i || {}, {
              method: e,
              headers: n ? { "Content-Type": "multipart/form-data" } : {},
              url: a,
              data: t,
            })
          );
        };
      }
      (fa.prototype[e] = n()), (fa.prototype[e + "Form"] = n(!0));
    });
  var ha = fa;
  class xa {
    constructor(e) {
      if ("function" != typeof e)
        throw new TypeError("executor must be a function.");
      let n;
      this.promise = new Promise(function (e) {
        n = e;
      });
      const a = this;
      this.promise.then((e) => {
        if (!a._listeners) return;
        let n = a._listeners.length;
        for (; n-- > 0; ) a._listeners[n](e);
        a._listeners = null;
      }),
        (this.promise.then = (e) => {
          let n;
          const t = new Promise((e) => {
            a.subscribe(e), (n = e);
          }).then(e);
          return (
            (t.cancel = function () {
              a.unsubscribe(n);
            }),
            t
          );
        }),
        e(function (e, t, i) {
          a.reason || ((a.reason = new Ne(e, t, i)), n(a.reason));
        });
    }
    throwIfRequested() {
      if (this.reason) throw this.reason;
    }
    subscribe(e) {
      this.reason
        ? e(this.reason)
        : this._listeners
        ? this._listeners.push(e)
        : (this._listeners = [e]);
    }
    unsubscribe(e) {
      if (!this._listeners) return;
      const n = this._listeners.indexOf(e);
      -1 !== n && this._listeners.splice(n, 1);
    }
    static source() {
      let e;
      return {
        token: new xa(function (n) {
          e = n;
        }),
        cancel: e,
      };
    }
  }
  var va = xa;
  const ba = {
    Continue: 100,
    SwitchingProtocols: 101,
    Processing: 102,
    EarlyHints: 103,
    Ok: 200,
    Created: 201,
    Accepted: 202,
    NonAuthoritativeInformation: 203,
    NoContent: 204,
    ResetContent: 205,
    PartialContent: 206,
    MultiStatus: 207,
    AlreadyReported: 208,
    ImUsed: 226,
    MultipleChoices: 300,
    MovedPermanently: 301,
    Found: 302,
    SeeOther: 303,
    NotModified: 304,
    UseProxy: 305,
    Unused: 306,
    TemporaryRedirect: 307,
    PermanentRedirect: 308,
    BadRequest: 400,
    Unauthorized: 401,
    PaymentRequired: 402,
    Forbidden: 403,
    NotFound: 404,
    MethodNotAllowed: 405,
    NotAcceptable: 406,
    ProxyAuthenticationRequired: 407,
    RequestTimeout: 408,
    Conflict: 409,
    Gone: 410,
    LengthRequired: 411,
    PreconditionFailed: 412,
    PayloadTooLarge: 413,
    UriTooLong: 414,
    UnsupportedMediaType: 415,
    RangeNotSatisfiable: 416,
    ExpectationFailed: 417,
    ImATeapot: 418,
    MisdirectedRequest: 421,
    UnprocessableEntity: 422,
    Locked: 423,
    FailedDependency: 424,
    TooEarly: 425,
    UpgradeRequired: 426,
    PreconditionRequired: 428,
    TooManyRequests: 429,
    RequestHeaderFieldsTooLarge: 431,
    UnavailableForLegalReasons: 451,
    InternalServerError: 500,
    NotImplemented: 501,
    BadGateway: 502,
    ServiceUnavailable: 503,
    GatewayTimeout: 504,
    HttpVersionNotSupported: 505,
    VariantAlsoNegotiates: 506,
    InsufficientStorage: 507,
    LoopDetected: 508,
    NotExtended: 510,
    NetworkAuthenticationRequired: 511,
  };
  Object.entries(ba).forEach(([e, n]) => {
    ba[n] = e;
  });
  var ga = ba;
  const ya = (function e(n) {
    const a = new ha(n),
      t = j(ha.prototype.request, a);
    return (
      ae.extend(t, ha.prototype, a, { allOwnKeys: !0 }),
      ae.extend(t, a, null, { allOwnKeys: !0 }),
      (t.create = function (a) {
        return e(pa(n, a));
      }),
      t
    );
  })(Ce);
  (ya.Axios = ha),
    (ya.CanceledError = Ne),
    (ya.CancelToken = va),
    (ya.isCancel = ze),
    (ya.VERSION = An),
    (ya.toFormData = ue),
    (ya.AxiosError = te),
    (ya.Cancel = ya.CanceledError),
    (ya.all = function (e) {
      return Promise.all(e);
    }),
    (ya.spread = function (e) {
      return function (n) {
        return e.apply(null, n);
      };
    }),
    (ya.isAxiosError = function (e) {
      return ae.isObject(e) && !0 === e.isAxiosError;
    }),
    (ya.mergeConfig = pa),
    (ya.AxiosHeaders = Le),
    (ya.formToJSON = (e) => ke(ae.isHTMLForm(e) ? new FormData(e) : e)),
    (ya.HttpStatusCode = ga),
    (ya.default = ya);
  var wa,
    _a = ya,
    ka = "undefined" != typeof Symbol && Symbol,
    ja = SyntaxError,
    Ea = Function,
    Ra = TypeError,
    Ca = function (e) {
      try {
        return Ea('"use strict"; return (' + e + ").constructor;")();
      } catch (e) {}
    },
    Sa = Object.getOwnPropertyDescriptor;
  if (Sa)
    try {
      Sa({}, "");
    } catch (s) {
      Sa = null;
    }
  var Oa = function () {
      throw new Ra();
    },
    Aa = Sa
      ? (function () {
          try {
            return Oa;
          } catch (e) {
            try {
              return Sa(arguments, "callee").get;
            } catch (e) {
              return Oa;
            }
          }
        })()
      : Oa,
    Ta =
      "function" == typeof ka &&
      "function" == typeof Symbol &&
      "symbol" == typeof ka("foo") &&
      "symbol" == typeof Symbol("bar") &&
      (function () {
        if (
          "function" != typeof Symbol ||
          "function" != typeof Object.getOwnPropertySymbols
        )
          return !1;
        if ("symbol" == typeof Symbol.iterator) return !0;
        var e = {},
          n = Symbol("test"),
          a = Object(n);
        if ("string" == typeof n) return !1;
        if ("[object Symbol]" !== Object.prototype.toString.call(n)) return !1;
        if ("[object Symbol]" !== Object.prototype.toString.call(a)) return !1;
        for (n in ((e[n] = 42), e)) return !1;
        if ("function" == typeof Object.keys && 0 !== Object.keys(e).length)
          return !1;
        if (
          "function" == typeof Object.getOwnPropertyNames &&
          0 !== Object.getOwnPropertyNames(e).length
        )
          return !1;
        var t = Object.getOwnPropertySymbols(e);
        if (1 !== t.length || t[0] !== n) return !1;
        if (!Object.prototype.propertyIsEnumerable.call(e, n)) return !1;
        if ("function" == typeof Object.getOwnPropertyDescriptor) {
          var i = Object.getOwnPropertyDescriptor(e, n);
          if (42 !== i.value || !0 !== i.enumerable) return !1;
        }
        return !0;
      })(),
    Fa =
      Object.getPrototypeOf ||
      function (e) {
        return e.__proto__;
      },
    Pa = {},
    La = "undefined" == typeof Uint8Array ? wa : Fa(Uint8Array),
    Ba = {
      "%AggregateError%":
        "undefined" == typeof AggregateError ? wa : AggregateError,
      "%Array%": Array,
      "%ArrayBuffer%": "undefined" == typeof ArrayBuffer ? wa : ArrayBuffer,
      "%ArrayIteratorPrototype%": Ta ? Fa([][Symbol.iterator]()) : wa,
      "%AsyncFromSyncIteratorPrototype%": wa,
      "%AsyncFunction%": Pa,
      "%AsyncGenerator%": Pa,
      "%AsyncGeneratorFunction%": Pa,
      "%AsyncIteratorPrototype%": Pa,
      "%Atomics%": "undefined" == typeof Atomics ? wa : Atomics,
      "%BigInt%": "undefined" == typeof BigInt ? wa : BigInt,
      "%BigInt64Array%":
        "undefined" == typeof BigInt64Array ? wa : BigInt64Array,
      "%BigUint64Array%":
        "undefined" == typeof BigUint64Array ? wa : BigUint64Array,
      "%Boolean%": Boolean,
      "%DataView%": "undefined" == typeof DataView ? wa : DataView,
      "%Date%": Date,
      "%decodeURI%": decodeURI,
      "%decodeURIComponent%": decodeURIComponent,
      "%encodeURI%": encodeURI,
      "%encodeURIComponent%": encodeURIComponent,
      "%Error%": Error,
      "%eval%": eval,
      "%EvalError%": EvalError,
      "%Float32Array%": "undefined" == typeof Float32Array ? wa : Float32Array,
      "%Float64Array%": "undefined" == typeof Float64Array ? wa : Float64Array,
      "%FinalizationRegistry%":
        "undefined" == typeof FinalizationRegistry ? wa : FinalizationRegistry,
      "%Function%": Ea,
      "%GeneratorFunction%": Pa,
      "%Int8Array%": "undefined" == typeof Int8Array ? wa : Int8Array,
      "%Int16Array%": "undefined" == typeof Int16Array ? wa : Int16Array,
      "%Int32Array%": "undefined" == typeof Int32Array ? wa : Int32Array,
      "%isFinite%": isFinite,
      "%isNaN%": isNaN,
      "%IteratorPrototype%": Ta ? Fa(Fa([][Symbol.iterator]())) : wa,
      "%JSON%": "object" == typeof JSON ? JSON : wa,
      "%Map%": "undefined" == typeof Map ? wa : Map,
      "%MapIteratorPrototype%":
        "undefined" != typeof Map && Ta ? Fa(new Map()[Symbol.iterator]()) : wa,
      "%Math%": Math,
      "%Number%": Number,
      "%Object%": Object,
      "%parseFloat%": parseFloat,
      "%parseInt%": parseInt,
      "%Promise%": "undefined" == typeof Promise ? wa : Promise,
      "%Proxy%": "undefined" == typeof Proxy ? wa : Proxy,
      "%RangeError%": RangeError,
      "%ReferenceError%": ReferenceError,
      "%Reflect%": "undefined" == typeof Reflect ? wa : Reflect,
      "%RegExp%": RegExp,
      "%Set%": "undefined" == typeof Set ? wa : Set,
      "%SetIteratorPrototype%":
        "undefined" != typeof Set && Ta ? Fa(new Set()[Symbol.iterator]()) : wa,
      "%SharedArrayBuffer%":
        "undefined" == typeof SharedArrayBuffer ? wa : SharedArrayBuffer,
      "%String%": String,
      "%StringIteratorPrototype%": Ta ? Fa(""[Symbol.iterator]()) : wa,
      "%Symbol%": Ta ? Symbol : wa,
      "%SyntaxError%": ja,
      "%ThrowTypeError%": Aa,
      "%TypedArray%": La,
      "%TypeError%": Ra,
      "%Uint8Array%": "undefined" == typeof Uint8Array ? wa : Uint8Array,
      "%Uint8ClampedArray%":
        "undefined" == typeof Uint8ClampedArray ? wa : Uint8ClampedArray,
      "%Uint16Array%": "undefined" == typeof Uint16Array ? wa : Uint16Array,
      "%Uint32Array%": "undefined" == typeof Uint32Array ? wa : Uint32Array,
      "%URIError%": URIError,
      "%WeakMap%": "undefined" == typeof WeakMap ? wa : WeakMap,
      "%WeakRef%": "undefined" == typeof WeakRef ? wa : WeakRef,
      "%WeakSet%": "undefined" == typeof WeakSet ? wa : WeakSet,
    };
  try {
    null.error;
  } catch (s) {
    var za = Fa(Fa(s));
    Ba["%Error.prototype%"] = za;
  }
  var Na = function e(n) {
      var a;
      if ("%AsyncFunction%" === n) a = Ca("async function () {}");
      else if ("%GeneratorFunction%" === n) a = Ca("function* () {}");
      else if ("%AsyncGeneratorFunction%" === n)
        a = Ca("async function* () {}");
      else if ("%AsyncGenerator%" === n) {
        var t = e("%AsyncGeneratorFunction%");
        t && (a = t.prototype);
      } else if ("%AsyncIteratorPrototype%" === n) {
        var i = e("%AsyncGenerator%");
        i && (a = Fa(i.prototype));
      }
      return (Ba[n] = a), a;
    },
    Ua = {
      "%ArrayBufferPrototype%": ["ArrayBuffer", "prototype"],
      "%ArrayPrototype%": ["Array", "prototype"],
      "%ArrayProto_entries%": ["Array", "prototype", "entries"],
      "%ArrayProto_forEach%": ["Array", "prototype", "forEach"],
      "%ArrayProto_keys%": ["Array", "prototype", "keys"],
      "%ArrayProto_values%": ["Array", "prototype", "values"],
      "%AsyncFunctionPrototype%": ["AsyncFunction", "prototype"],
      "%AsyncGenerator%": ["AsyncGeneratorFunction", "prototype"],
      "%AsyncGeneratorPrototype%": [
        "AsyncGeneratorFunction",
        "prototype",
        "prototype",
      ],
      "%BooleanPrototype%": ["Boolean", "prototype"],
      "%DataViewPrototype%": ["DataView", "prototype"],
      "%DatePrototype%": ["Date", "prototype"],
      "%ErrorPrototype%": ["Error", "prototype"],
      "%EvalErrorPrototype%": ["EvalError", "prototype"],
      "%Float32ArrayPrototype%": ["Float32Array", "prototype"],
      "%Float64ArrayPrototype%": ["Float64Array", "prototype"],
      "%FunctionPrototype%": ["Function", "prototype"],
      "%Generator%": ["GeneratorFunction", "prototype"],
      "%GeneratorPrototype%": ["GeneratorFunction", "prototype", "prototype"],
      "%Int8ArrayPrototype%": ["Int8Array", "prototype"],
      "%Int16ArrayPrototype%": ["Int16Array", "prototype"],
      "%Int32ArrayPrototype%": ["Int32Array", "prototype"],
      "%JSONParse%": ["JSON", "parse"],
      "%JSONStringify%": ["JSON", "stringify"],
      "%MapPrototype%": ["Map", "prototype"],
      "%NumberPrototype%": ["Number", "prototype"],
      "%ObjectPrototype%": ["Object", "prototype"],
      "%ObjProto_toString%": ["Object", "prototype", "toString"],
      "%ObjProto_valueOf%": ["Object", "prototype", "valueOf"],
      "%PromisePrototype%": ["Promise", "prototype"],
      "%PromiseProto_then%": ["Promise", "prototype", "then"],
      "%Promise_all%": ["Promise", "all"],
      "%Promise_reject%": ["Promise", "reject"],
      "%Promise_resolve%": ["Promise", "resolve"],
      "%RangeErrorPrototype%": ["RangeError", "prototype"],
      "%ReferenceErrorPrototype%": ["ReferenceError", "prototype"],
      "%RegExpPrototype%": ["RegExp", "prototype"],
      "%SetPrototype%": ["Set", "prototype"],
      "%SharedArrayBufferPrototype%": ["SharedArrayBuffer", "prototype"],
      "%StringPrototype%": ["String", "prototype"],
      "%SymbolPrototype%": ["Symbol", "prototype"],
      "%SyntaxErrorPrototype%": ["SyntaxError", "prototype"],
      "%TypedArrayPrototype%": ["TypedArray", "prototype"],
      "%TypeErrorPrototype%": ["TypeError", "prototype"],
      "%Uint8ArrayPrototype%": ["Uint8Array", "prototype"],
      "%Uint8ClampedArrayPrototype%": ["Uint8ClampedArray", "prototype"],
      "%Uint16ArrayPrototype%": ["Uint16Array", "prototype"],
      "%Uint32ArrayPrototype%": ["Uint32Array", "prototype"],
      "%URIErrorPrototype%": ["URIError", "prototype"],
      "%WeakMapPrototype%": ["WeakMap", "prototype"],
      "%WeakSetPrototype%": ["WeakSet", "prototype"],
    },
    qa = _,
    Da = k,
    Ia = qa.call(Function.call, Array.prototype.concat),
    Ma = qa.call(Function.apply, Array.prototype.splice),
    Ha = qa.call(Function.call, String.prototype.replace),
    $a = qa.call(Function.call, String.prototype.slice),
    Wa = qa.call(Function.call, RegExp.prototype.exec),
    Ga =
      /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g,
    Va = /\\(\\)?/g,
    Ja = function (e, n) {
      var a,
        t = e;
      if ((Da(Ua, t) && (t = "%" + (a = Ua[t])[0] + "%"), Da(Ba, t))) {
        var i = Ba[t];
        if ((i === Pa && (i = Na(t)), void 0 === i && !n))
          throw new Ra(
            "intrinsic " +
              e +
              " exists, but is not available. Please file an issue!"
          );
        return { alias: a, name: t, value: i };
      }
      throw new ja("intrinsic " + e + " does not exist!");
    },
    Ka = function (e, n) {
      if ("string" != typeof e || 0 === e.length)
        throw new Ra("intrinsic name must be a non-empty string");
      if (arguments.length > 1 && "boolean" != typeof n)
        throw new Ra('"allowMissing" argument must be a boolean');
      if (null === Wa(/^%?[^%]*%?$/, e))
        throw new ja(
          "`%` may not be present anywhere but at the beginning and end of the intrinsic name"
        );
      var a = (function (e) {
          var n = $a(e, 0, 1),
            a = $a(e, -1);
          if ("%" === n && "%" !== a)
            throw new ja("invalid intrinsic syntax, expected closing `%`");
          if ("%" === a && "%" !== n)
            throw new ja("invalid intrinsic syntax, expected opening `%`");
          var t = [];
          return (
            Ha(e, Ga, function (e, n, a, i) {
              t[t.length] = a ? Ha(i, Va, "$1") : n || e;
            }),
            t
          );
        })(e),
        t = a.length > 0 ? a[0] : "",
        i = Ja("%" + t + "%", n),
        o = i.name,
        s = i.value,
        r = !1,
        c = i.alias;
      c && ((t = c[0]), Ma(a, Ia([0, 1], c)));
      for (var p = 1, l = !0; p < a.length; p += 1) {
        var u = a[p],
          d = $a(u, 0, 1),
          m = $a(u, -1);
        if (
          ('"' === d ||
            "'" === d ||
            "`" === d ||
            '"' === m ||
            "'" === m ||
            "`" === m) &&
          d !== m
        )
          throw new ja("property names with quotes must have matching quotes");
        if (
          (("constructor" !== u && l) || (r = !0),
          Da(Ba, (o = "%" + (t += "." + u) + "%")))
        )
          s = Ba[o];
        else if (null != s) {
          if (!(u in s)) {
            if (!n)
              throw new Ra(
                "base intrinsic for " +
                  e +
                  " exists, but the property is not available."
              );
            return;
          }
          if (Sa && p + 1 >= a.length) {
            var f = Sa(s, u);
            s =
              (l = !!f) && "get" in f && !("originalValue" in f.get)
                ? f.get
                : s[u];
          } else (l = Da(s, u)), (s = s[u]);
          l && !r && (Ba[o] = s);
        }
      }
      return s;
    },
    Qa = {};
  !(function (e) {
    var n = _,
      a = Ka,
      t = a("%Function.prototype.apply%"),
      i = a("%Function.prototype.call%"),
      o = a("%Reflect.apply%", !0) || n.call(i, t),
      s = a("%Object.getOwnPropertyDescriptor%", !0),
      r = a("%Object.defineProperty%", !0),
      c = a("%Math.max%");
    if (r)
      try {
        r({}, "a", { value: 1 });
      } catch (e) {
        r = null;
      }
    e.exports = function (e) {
      var a = o(n, i, arguments);
      s &&
        r &&
        s(a, "length").configurable &&
        r(a, "length", { value: 1 + c(0, e.length - (arguments.length - 1)) });
      return a;
    };
    var p = function () {
      return o(n, t, arguments);
    };
    r ? r(e.exports, "apply", { value: p }) : (e.exports.apply = p);
  })({
    get exports() {
      return Qa;
    },
    set exports(e) {
      Qa = e;
    },
  });
  var Ya = Ka,
    Xa = Qa,
    Za = Xa(Ya("String.prototype.indexOf")),
    et = h.inspect,
    nt = "function" == typeof Map && Map.prototype,
    at =
      Object.getOwnPropertyDescriptor && nt
        ? Object.getOwnPropertyDescriptor(Map.prototype, "size")
        : null,
    tt = nt && at && "function" == typeof at.get ? at.get : null,
    it = nt && Map.prototype.forEach,
    ot = "function" == typeof Set && Set.prototype,
    st =
      Object.getOwnPropertyDescriptor && ot
        ? Object.getOwnPropertyDescriptor(Set.prototype, "size")
        : null,
    rt = ot && st && "function" == typeof st.get ? st.get : null,
    ct = ot && Set.prototype.forEach,
    pt =
      "function" == typeof WeakMap && WeakMap.prototype
        ? WeakMap.prototype.has
        : null,
    lt =
      "function" == typeof WeakSet && WeakSet.prototype
        ? WeakSet.prototype.has
        : null,
    ut =
      "function" == typeof WeakRef && WeakRef.prototype
        ? WeakRef.prototype.deref
        : null,
    dt = Boolean.prototype.valueOf,
    mt = Object.prototype.toString,
    ft = Function.prototype.toString,
    ht = String.prototype.match,
    xt = String.prototype.slice,
    vt = String.prototype.replace,
    bt = String.prototype.toUpperCase,
    gt = String.prototype.toLowerCase,
    yt = RegExp.prototype.test,
    wt = Array.prototype.concat,
    _t = Array.prototype.join,
    kt = Array.prototype.slice,
    jt = Math.floor,
    Et = "function" == typeof BigInt ? BigInt.prototype.valueOf : null,
    Rt = Object.getOwnPropertySymbols,
    Ct =
      "function" == typeof Symbol && "symbol" == typeof Symbol.iterator
        ? Symbol.prototype.toString
        : null,
    St = "function" == typeof Symbol && "object" == typeof Symbol.iterator,
    Ot =
      "function" == typeof Symbol &&
      Symbol.toStringTag &&
      (Symbol.toStringTag, 1)
        ? Symbol.toStringTag
        : null,
    At = Object.prototype.propertyIsEnumerable,
    Tt =
      ("function" == typeof Reflect
        ? Reflect.getPrototypeOf
        : Object.getPrototypeOf) ||
      ([].__proto__ === Array.prototype
        ? function (e) {
            return e.__proto__;
          }
        : null);
  function Ft(e, n) {
    if (
      e === 1 / 0 ||
      e === -1 / 0 ||
      e != e ||
      (e && e > -1e3 && e < 1e3) ||
      yt.call(/e/, n)
    )
      return n;
    var a = /[0-9](?=(?:[0-9]{3})+(?![0-9]))/g;
    if ("number" == typeof e) {
      var t = e < 0 ? -jt(-e) : jt(e);
      if (t !== e) {
        var i = String(t),
          o = xt.call(n, i.length + 1);
        return (
          vt.call(i, a, "$&_") +
          "." +
          vt.call(vt.call(o, /([0-9]{3})/g, "$&_"), /_$/, "")
        );
      }
    }
    return vt.call(n, a, "$&_");
  }
  var Pt = et,
    Lt = Pt.custom,
    Bt = Dt(Lt) ? Lt : null;
  function zt(e, n, a) {
    var t = "double" === (a.quoteStyle || n) ? '"' : "'";
    return t + e + t;
  }
  function Nt(e) {
    return vt.call(String(e), /"/g, "&quot;");
  }
  function Ut(e) {
    return !(
      "[object Array]" !== Ht(e) ||
      (Ot && "object" == typeof e && Ot in e)
    );
  }
  function qt(e) {
    return !(
      "[object RegExp]" !== Ht(e) ||
      (Ot && "object" == typeof e && Ot in e)
    );
  }
  function Dt(e) {
    if (St) return e && "object" == typeof e && e instanceof Symbol;
    if ("symbol" == typeof e) return !0;
    if (!e || "object" != typeof e || !Ct) return !1;
    try {
      return Ct.call(e), !0;
    } catch (e) {}
    return !1;
  }
  var It =
    Object.prototype.hasOwnProperty ||
    function (e) {
      return e in this;
    };
  function Mt(e, n) {
    return It.call(e, n);
  }
  function Ht(e) {
    return mt.call(e);
  }
  function $t(e, n) {
    if (e.indexOf) return e.indexOf(n);
    for (var a = 0, t = e.length; a < t; a++) if (e[a] === n) return a;
    return -1;
  }
  function Wt(e, n) {
    if (e.length > n.maxStringLength) {
      var a = e.length - n.maxStringLength,
        t = "... " + a + " more character" + (a > 1 ? "s" : "");
      return Wt(xt.call(e, 0, n.maxStringLength), n) + t;
    }
    return zt(
      vt.call(vt.call(e, /(['\\])/g, "\\$1"), /[\x00-\x1f]/g, Gt),
      "single",
      n
    );
  }
  function Gt(e) {
    var n = e.charCodeAt(0),
      a = { 8: "b", 9: "t", 10: "n", 12: "f", 13: "r" }[n];
    return a ? "\\" + a : "\\x" + (n < 16 ? "0" : "") + bt.call(n.toString(16));
  }
  function Vt(e) {
    return "Object(" + e + ")";
  }
  function Jt(e) {
    return e + " { ? }";
  }
  function Kt(e, n, a, t) {
    return e + " (" + n + ") {" + (t ? Qt(a, t) : _t.call(a, ", ")) + "}";
  }
  function Qt(e, n) {
    if (0 === e.length) return "";
    var a = "\n" + n.prev + n.base;
    return a + _t.call(e, "," + a) + "\n" + n.prev;
  }
  function Yt(e, n) {
    var a = Ut(e),
      t = [];
    if (a) {
      t.length = e.length;
      for (var i = 0; i < e.length; i++) t[i] = Mt(e, i) ? n(e[i], e) : "";
    }
    var o,
      s = "function" == typeof Rt ? Rt(e) : [];
    if (St) {
      o = {};
      for (var r = 0; r < s.length; r++) o["$" + s[r]] = s[r];
    }
    for (var c in e)
      Mt(e, c) &&
        ((a && String(Number(c)) === c && c < e.length) ||
          (St && o["$" + c] instanceof Symbol) ||
          (yt.call(/[^\w$]/, c)
            ? t.push(n(c, e) + ": " + n(e[c], e))
            : t.push(c + ": " + n(e[c], e))));
    if ("function" == typeof Rt)
      for (var p = 0; p < s.length; p++)
        At.call(e, s[p]) && t.push("[" + n(s[p]) + "]: " + n(e[s[p]], e));
    return t;
  }
  var Xt,
    Zt,
    ei,
    ni,
    ai = Ka,
    ti = function (e, n) {
      var a = Ya(e, !!n);
      return "function" == typeof a && Za(e, ".prototype.") > -1 ? Xa(a) : a;
    },
    ii = function e(n, a, t, i) {
      var o = a || {};
      if (
        Mt(o, "quoteStyle") &&
        "single" !== o.quoteStyle &&
        "double" !== o.quoteStyle
      )
        throw new TypeError('option "quoteStyle" must be "single" or "double"');
      if (
        Mt(o, "maxStringLength") &&
        ("number" == typeof o.maxStringLength
          ? o.maxStringLength < 0 && o.maxStringLength !== 1 / 0
          : null !== o.maxStringLength)
      )
        throw new TypeError(
          'option "maxStringLength", if provided, must be a positive integer, Infinity, or `null`'
        );
      var s = !Mt(o, "customInspect") || o.customInspect;
      if ("boolean" != typeof s && "symbol" !== s)
        throw new TypeError(
          "option \"customInspect\", if provided, must be `true`, `false`, or `'symbol'`"
        );
      if (
        Mt(o, "indent") &&
        null !== o.indent &&
        "\t" !== o.indent &&
        !(parseInt(o.indent, 10) === o.indent && o.indent > 0)
      )
        throw new TypeError(
          'option "indent" must be "\\t", an integer > 0, or `null`'
        );
      if (Mt(o, "numericSeparator") && "boolean" != typeof o.numericSeparator)
        throw new TypeError(
          'option "numericSeparator", if provided, must be `true` or `false`'
        );
      var r = o.numericSeparator;
      if (void 0 === n) return "undefined";
      if (null === n) return "null";
      if ("boolean" == typeof n) return n ? "true" : "false";
      if ("string" == typeof n) return Wt(n, o);
      if ("number" == typeof n) {
        if (0 === n) return 1 / 0 / n > 0 ? "0" : "-0";
        var c = String(n);
        return r ? Ft(n, c) : c;
      }
      if ("bigint" == typeof n) {
        var p = String(n) + "n";
        return r ? Ft(n, p) : p;
      }
      var l = void 0 === o.depth ? 5 : o.depth;
      if ((void 0 === t && (t = 0), t >= l && l > 0 && "object" == typeof n))
        return Ut(n) ? "[Array]" : "[Object]";
      var u = (function (e, n) {
        var a;
        if ("\t" === e.indent) a = "\t";
        else {
          if (!("number" == typeof e.indent && e.indent > 0)) return null;
          a = _t.call(Array(e.indent + 1), " ");
        }
        return { base: a, prev: _t.call(Array(n + 1), a) };
      })(o, t);
      if (void 0 === i) i = [];
      else if ($t(i, n) >= 0) return "[Circular]";
      function d(n, a, s) {
        if ((a && (i = kt.call(i)).push(a), s)) {
          var r = { depth: o.depth };
          return (
            Mt(o, "quoteStyle") && (r.quoteStyle = o.quoteStyle),
            e(n, r, t + 1, i)
          );
        }
        return e(n, o, t + 1, i);
      }
      if ("function" == typeof n && !qt(n)) {
        var m = (function (e) {
            if (e.name) return e.name;
            var n = ht.call(ft.call(e), /^function\s*([\w$]+)/);
            return n ? n[1] : null;
          })(n),
          f = Yt(n, d);
        return (
          "[Function" +
          (m ? ": " + m : " (anonymous)") +
          "]" +
          (f.length > 0 ? " { " + _t.call(f, ", ") + " }" : "")
        );
      }
      if (Dt(n)) {
        var h = St
          ? vt.call(String(n), /^(Symbol\(.*\))_[^)]*$/, "$1")
          : Ct.call(n);
        return "object" != typeof n || St ? h : Vt(h);
      }
      if (
        (function (e) {
          return (
            !(!e || "object" != typeof e) &&
            (("undefined" != typeof HTMLElement && e instanceof HTMLElement) ||
              ("string" == typeof e.nodeName &&
                "function" == typeof e.getAttribute))
          );
        })(n)
      ) {
        for (
          var x = "<" + gt.call(String(n.nodeName)),
            v = n.attributes || [],
            b = 0;
          b < v.length;
          b++
        )
          x += " " + v[b].name + "=" + zt(Nt(v[b].value), "double", o);
        return (
          (x += ">"),
          n.childNodes && n.childNodes.length && (x += "..."),
          x + "</" + gt.call(String(n.nodeName)) + ">"
        );
      }
      if (Ut(n)) {
        if (0 === n.length) return "[]";
        var g = Yt(n, d);
        return u &&
          !(function (e) {
            for (var n = 0; n < e.length; n++)
              if ($t(e[n], "\n") >= 0) return !1;
            return !0;
          })(g)
          ? "[" + Qt(g, u) + "]"
          : "[ " + _t.call(g, ", ") + " ]";
      }
      if (
        (function (e) {
          return !(
            "[object Error]" !== Ht(e) ||
            (Ot && "object" == typeof e && Ot in e)
          );
        })(n)
      ) {
        var y = Yt(n, d);
        return "cause" in Error.prototype ||
          !("cause" in n) ||
          At.call(n, "cause")
          ? 0 === y.length
            ? "[" + String(n) + "]"
            : "{ [" + String(n) + "] " + _t.call(y, ", ") + " }"
          : "{ [" +
              String(n) +
              "] " +
              _t.call(wt.call("[cause]: " + d(n.cause), y), ", ") +
              " }";
      }
      if ("object" == typeof n && s) {
        if (Bt && "function" == typeof n[Bt] && Pt)
          return Pt(n, { depth: l - t });
        if ("symbol" !== s && "function" == typeof n.inspect)
          return n.inspect();
      }
      if (
        (function (e) {
          if (!tt || !e || "object" != typeof e) return !1;
          try {
            tt.call(e);
            try {
              rt.call(e);
            } catch (e) {
              return !0;
            }
            return e instanceof Map;
          } catch (e) {}
          return !1;
        })(n)
      ) {
        var w = [];
        return (
          it &&
            it.call(n, function (e, a) {
              w.push(d(a, n, !0) + " => " + d(e, n));
            }),
          Kt("Map", tt.call(n), w, u)
        );
      }
      if (
        (function (e) {
          if (!rt || !e || "object" != typeof e) return !1;
          try {
            rt.call(e);
            try {
              tt.call(e);
            } catch (e) {
              return !0;
            }
            return e instanceof Set;
          } catch (e) {}
          return !1;
        })(n)
      ) {
        var _ = [];
        return (
          ct &&
            ct.call(n, function (e) {
              _.push(d(e, n));
            }),
          Kt("Set", rt.call(n), _, u)
        );
      }
      if (
        (function (e) {
          if (!pt || !e || "object" != typeof e) return !1;
          try {
            pt.call(e, pt);
            try {
              lt.call(e, lt);
            } catch (e) {
              return !0;
            }
            return e instanceof WeakMap;
          } catch (e) {}
          return !1;
        })(n)
      )
        return Jt("WeakMap");
      if (
        (function (e) {
          if (!lt || !e || "object" != typeof e) return !1;
          try {
            lt.call(e, lt);
            try {
              pt.call(e, pt);
            } catch (e) {
              return !0;
            }
            return e instanceof WeakSet;
          } catch (e) {}
          return !1;
        })(n)
      )
        return Jt("WeakSet");
      if (
        (function (e) {
          if (!ut || !e || "object" != typeof e) return !1;
          try {
            return ut.call(e), !0;
          } catch (e) {}
          return !1;
        })(n)
      )
        return Jt("WeakRef");
      if (
        (function (e) {
          return !(
            "[object Number]" !== Ht(e) ||
            (Ot && "object" == typeof e && Ot in e)
          );
        })(n)
      )
        return Vt(d(Number(n)));
      if (
        (function (e) {
          if (!e || "object" != typeof e || !Et) return !1;
          try {
            return Et.call(e), !0;
          } catch (e) {}
          return !1;
        })(n)
      )
        return Vt(d(Et.call(n)));
      if (
        (function (e) {
          return !(
            "[object Boolean]" !== Ht(e) ||
            (Ot && "object" == typeof e && Ot in e)
          );
        })(n)
      )
        return Vt(dt.call(n));
      if (
        (function (e) {
          return !(
            "[object String]" !== Ht(e) ||
            (Ot && "object" == typeof e && Ot in e)
          );
        })(n)
      )
        return Vt(d(String(n)));
      if (
        !(function (e) {
          return !(
            "[object Date]" !== Ht(e) ||
            (Ot && "object" == typeof e && Ot in e)
          );
        })(n) &&
        !qt(n)
      ) {
        var k = Yt(n, d),
          j = Tt
            ? Tt(n) === Object.prototype
            : n instanceof Object || n.constructor === Object,
          E = n instanceof Object ? "" : "null prototype",
          R =
            !j && Ot && Object(n) === n && Ot in n
              ? xt.call(Ht(n), 8, -1)
              : E
              ? "Object"
              : "",
          C =
            (j || "function" != typeof n.constructor
              ? ""
              : n.constructor.name
              ? n.constructor.name + " "
              : "") +
            (R || E
              ? "[" + _t.call(wt.call([], R || [], E || []), ": ") + "] "
              : "");
        return 0 === k.length
          ? C + "{}"
          : u
          ? C + "{" + Qt(k, u) + "}"
          : C + "{ " + _t.call(k, ", ") + " }";
      }
      return String(n);
    },
    oi = ai("%TypeError%"),
    si = ai("%WeakMap%", !0),
    ri = ai("%Map%", !0),
    ci = ti("WeakMap.prototype.get", !0),
    pi = ti("WeakMap.prototype.set", !0),
    li = ti("WeakMap.prototype.has", !0),
    ui = ti("Map.prototype.get", !0),
    di = ti("Map.prototype.set", !0),
    mi = ti("Map.prototype.has", !0),
    fi = function (e, n) {
      for (var a, t = e; null !== (a = t.next); t = a)
        if (a.key === n)
          return (t.next = a.next), (a.next = e.next), (e.next = a), a;
    },
    hi = String.prototype.replace,
    xi = /%20/g,
    vi = "RFC3986",
    bi = {
      default: vi,
      formatters: {
        RFC1738: function (e) {
          return hi.call(e, xi, "+");
        },
        RFC3986: function (e) {
          return String(e);
        },
      },
      RFC1738: "RFC1738",
      RFC3986: vi,
    },
    gi = bi,
    yi = Object.prototype.hasOwnProperty,
    wi = Array.isArray,
    _i = (function () {
      for (var e = [], n = 0; n < 256; ++n)
        e.push("%" + ((n < 16 ? "0" : "") + n.toString(16)).toUpperCase());
      return e;
    })(),
    ki = function (e, n) {
      for (
        var a = n && n.plainObjects ? Object.create(null) : {}, t = 0;
        t < e.length;
        ++t
      )
        void 0 !== e[t] && (a[t] = e[t]);
      return a;
    },
    ji = {
      arrayToObject: ki,
      assign: function (e, n) {
        return Object.keys(n).reduce(function (e, a) {
          return (e[a] = n[a]), e;
        }, e);
      },
      combine: function (e, n) {
        return [].concat(e, n);
      },
      compact: function (e) {
        for (
          var n = [{ obj: { o: e }, prop: "o" }], a = [], t = 0;
          t < n.length;
          ++t
        )
          for (
            var i = n[t], o = i.obj[i.prop], s = Object.keys(o), r = 0;
            r < s.length;
            ++r
          ) {
            var c = s[r],
              p = o[c];
            "object" == typeof p &&
              null !== p &&
              -1 === a.indexOf(p) &&
              (n.push({ obj: o, prop: c }), a.push(p));
          }
        return (
          (function (e) {
            for (; e.length > 1; ) {
              var n = e.pop(),
                a = n.obj[n.prop];
              if (wi(a)) {
                for (var t = [], i = 0; i < a.length; ++i)
                  void 0 !== a[i] && t.push(a[i]);
                n.obj[n.prop] = t;
              }
            }
          })(n),
          e
        );
      },
      decode: function (e, n, a) {
        var t = e.replace(/\+/g, " ");
        if ("iso-8859-1" === a) return t.replace(/%[0-9a-f]{2}/gi, unescape);
        try {
          return decodeURIComponent(t);
        } catch (e) {
          return t;
        }
      },
      encode: function (e, n, a, t, i) {
        if (0 === e.length) return e;
        var o = e;
        if (
          ("symbol" == typeof e
            ? (o = Symbol.prototype.toString.call(e))
            : "string" != typeof e && (o = String(e)),
          "iso-8859-1" === a)
        )
          return escape(o).replace(/%u[0-9a-f]{4}/gi, function (e) {
            return "%26%23" + parseInt(e.slice(2), 16) + "%3B";
          });
        for (var s = "", r = 0; r < o.length; ++r) {
          var c = o.charCodeAt(r);
          45 === c ||
          46 === c ||
          95 === c ||
          126 === c ||
          (c >= 48 && c <= 57) ||
          (c >= 65 && c <= 90) ||
          (c >= 97 && c <= 122) ||
          (i === gi.RFC1738 && (40 === c || 41 === c))
            ? (s += o.charAt(r))
            : c < 128
            ? (s += _i[c])
            : c < 2048
            ? (s += _i[192 | (c >> 6)] + _i[128 | (63 & c)])
            : c < 55296 || c >= 57344
            ? (s +=
                _i[224 | (c >> 12)] +
                _i[128 | ((c >> 6) & 63)] +
                _i[128 | (63 & c)])
            : ((r += 1),
              (c = 65536 + (((1023 & c) << 10) | (1023 & o.charCodeAt(r)))),
              (s +=
                _i[240 | (c >> 18)] +
                _i[128 | ((c >> 12) & 63)] +
                _i[128 | ((c >> 6) & 63)] +
                _i[128 | (63 & c)]));
        }
        return s;
      },
      isBuffer: function (e) {
        return !(
          !e ||
          "object" != typeof e ||
          !(
            e.constructor &&
            e.constructor.isBuffer &&
            e.constructor.isBuffer(e)
          )
        );
      },
      isRegExp: function (e) {
        return "[object RegExp]" === Object.prototype.toString.call(e);
      },
      maybeMap: function (e, n) {
        if (wi(e)) {
          for (var a = [], t = 0; t < e.length; t += 1) a.push(n(e[t]));
          return a;
        }
        return n(e);
      },
      merge: function e(n, a, t) {
        if (!a) return n;
        if ("object" != typeof a) {
          if (wi(n)) n.push(a);
          else {
            if (!n || "object" != typeof n) return [n, a];
            ((t && (t.plainObjects || t.allowPrototypes)) ||
              !yi.call(Object.prototype, a)) &&
              (n[a] = !0);
          }
          return n;
        }
        if (!n || "object" != typeof n) return [n].concat(a);
        var i = n;
        return (
          wi(n) && !wi(a) && (i = ki(n, t)),
          wi(n) && wi(a)
            ? (a.forEach(function (a, i) {
                if (yi.call(n, i)) {
                  var o = n[i];
                  o && "object" == typeof o && a && "object" == typeof a
                    ? (n[i] = e(o, a, t))
                    : n.push(a);
                } else n[i] = a;
              }),
              n)
            : Object.keys(a).reduce(function (n, i) {
                var o = a[i];
                return yi.call(n, i) ? (n[i] = e(n[i], o, t)) : (n[i] = o), n;
              }, i)
        );
      },
    },
    Ei = function () {
      var e,
        n,
        a,
        t = {
          assert: function (e) {
            if (!t.has(e))
              throw new oi("Side channel does not contain " + ii(e));
          },
          get: function (t) {
            if (si && t && ("object" == typeof t || "function" == typeof t)) {
              if (e) return ci(e, t);
            } else if (ri) {
              if (n) return ui(n, t);
            } else if (a)
              return (function (e, n) {
                var a = fi(e, n);
                return a && a.value;
              })(a, t);
          },
          has: function (t) {
            if (si && t && ("object" == typeof t || "function" == typeof t)) {
              if (e) return li(e, t);
            } else if (ri) {
              if (n) return mi(n, t);
            } else if (a)
              return (function (e, n) {
                return !!fi(e, n);
              })(a, t);
            return !1;
          },
          set: function (t, i) {
            si && t && ("object" == typeof t || "function" == typeof t)
              ? (e || (e = new si()), pi(e, t, i))
              : ri
              ? (n || (n = new ri()), di(n, t, i))
              : (a || (a = { key: {}, next: null }),
                (function (e, n, a) {
                  var t = fi(e, n);
                  t
                    ? (t.value = a)
                    : (e.next = { key: n, next: e.next, value: a });
                })(a, t, i));
          },
        };
      return t;
    },
    Ri = ji,
    Ci = bi,
    Si = Object.prototype.hasOwnProperty,
    Oi = {
      brackets: function (e) {
        return e + "[]";
      },
      comma: "comma",
      indices: function (e, n) {
        return e + "[" + n + "]";
      },
      repeat: function (e) {
        return e;
      },
    },
    Ai = Array.isArray,
    Ti = Array.prototype.push,
    Fi = function (e, n) {
      Ti.apply(e, Ai(n) ? n : [n]);
    },
    Pi = Date.prototype.toISOString,
    Li = Ci.default,
    Bi = {
      addQueryPrefix: !1,
      allowDots: !1,
      charset: "utf-8",
      charsetSentinel: !1,
      delimiter: "&",
      encode: !0,
      encoder: Ri.encode,
      encodeValuesOnly: !1,
      format: Li,
      formatter: Ci.formatters[Li],
      indices: !1,
      serializeDate: function (e) {
        return Pi.call(e);
      },
      skipNulls: !1,
      strictNullHandling: !1,
    },
    zi = {},
    Ni = function e(n, a, t, i, o, s, r, c, p, l, u, d, m, f, h, x) {
      for (
        var v, b = n, g = x, y = 0, w = !1;
        void 0 !== (g = g.get(zi)) && !w;

      ) {
        var _ = g.get(n);
        if (((y += 1), void 0 !== _)) {
          if (_ === y) throw new RangeError("Cyclic object value");
          w = !0;
        }
        void 0 === g.get(zi) && (y = 0);
      }
      if (
        ("function" == typeof c
          ? (b = c(a, b))
          : b instanceof Date
          ? (b = u(b))
          : "comma" === t &&
            Ai(b) &&
            (b = Ri.maybeMap(b, function (e) {
              return e instanceof Date ? u(e) : e;
            })),
        null === b)
      ) {
        if (o) return r && !f ? r(a, Bi.encoder, h, "key", d) : a;
        b = "";
      }
      if (
        "string" == typeof (v = b) ||
        "number" == typeof v ||
        "boolean" == typeof v ||
        "symbol" == typeof v ||
        "bigint" == typeof v ||
        Ri.isBuffer(b)
      )
        return r
          ? [
              m(f ? a : r(a, Bi.encoder, h, "key", d)) +
                "=" +
                m(r(b, Bi.encoder, h, "value", d)),
            ]
          : [m(a) + "=" + m(String(b))];
      var k,
        j = [];
      if (void 0 === b) return j;
      if ("comma" === t && Ai(b))
        f && r && (b = Ri.maybeMap(b, r)),
          (k = [{ value: b.length > 0 ? b.join(",") || null : void 0 }]);
      else if (Ai(c)) k = c;
      else {
        var E = Object.keys(b);
        k = p ? E.sort(p) : E;
      }
      for (
        var R = i && Ai(b) && 1 === b.length ? a + "[]" : a, C = 0;
        C < k.length;
        ++C
      ) {
        var S = k[C],
          O = "object" == typeof S && void 0 !== S.value ? S.value : b[S];
        if (!s || null !== O) {
          var A = Ai(b)
            ? "function" == typeof t
              ? t(R, S)
              : R
            : R + (l ? "." + S : "[" + S + "]");
          x.set(n, y);
          var T = Ei();
          T.set(zi, x),
            Fi(
              j,
              e(
                O,
                A,
                t,
                i,
                o,
                s,
                "comma" === t && f && Ai(b) ? null : r,
                c,
                p,
                l,
                u,
                d,
                m,
                f,
                h,
                T
              )
            );
        }
      }
      return j;
    },
    Ui = ji,
    qi =
      (Object.prototype.hasOwnProperty,
      Array.isArray,
      Ui.decode,
      function (e, n) {
        var a,
          t = e,
          i = (function (e) {
            if (!e) return Bi;
            if (
              null !== e.encoder &&
              void 0 !== e.encoder &&
              "function" != typeof e.encoder
            )
              throw new TypeError("Encoder has to be a function.");
            var n = e.charset || Bi.charset;
            if (
              void 0 !== e.charset &&
              "utf-8" !== e.charset &&
              "iso-8859-1" !== e.charset
            )
              throw new TypeError(
                "The charset option must be either utf-8, iso-8859-1, or undefined"
              );
            var a = Ci.default;
            if (void 0 !== e.format) {
              if (!Si.call(Ci.formatters, e.format))
                throw new TypeError("Unknown format option provided.");
              a = e.format;
            }
            var t = Ci.formatters[a],
              i = Bi.filter;
            return (
              ("function" == typeof e.filter || Ai(e.filter)) && (i = e.filter),
              {
                addQueryPrefix:
                  "boolean" == typeof e.addQueryPrefix
                    ? e.addQueryPrefix
                    : Bi.addQueryPrefix,
                allowDots:
                  void 0 === e.allowDots ? Bi.allowDots : !!e.allowDots,
                charset: n,
                charsetSentinel:
                  "boolean" == typeof e.charsetSentinel
                    ? e.charsetSentinel
                    : Bi.charsetSentinel,
                delimiter: void 0 === e.delimiter ? Bi.delimiter : e.delimiter,
                encode: "boolean" == typeof e.encode ? e.encode : Bi.encode,
                encoder:
                  "function" == typeof e.encoder ? e.encoder : Bi.encoder,
                encodeValuesOnly:
                  "boolean" == typeof e.encodeValuesOnly
                    ? e.encodeValuesOnly
                    : Bi.encodeValuesOnly,
                filter: i,
                format: a,
                formatter: t,
                serializeDate:
                  "function" == typeof e.serializeDate
                    ? e.serializeDate
                    : Bi.serializeDate,
                skipNulls:
                  "boolean" == typeof e.skipNulls ? e.skipNulls : Bi.skipNulls,
                sort: "function" == typeof e.sort ? e.sort : null,
                strictNullHandling:
                  "boolean" == typeof e.strictNullHandling
                    ? e.strictNullHandling
                    : Bi.strictNullHandling,
              }
            );
          })(n);
        "function" == typeof i.filter
          ? (t = (0, i.filter)("", t))
          : Ai(i.filter) && (a = i.filter);
        var o,
          s = [];
        if ("object" != typeof t || null === t) return "";
        o =
          n && n.arrayFormat in Oi
            ? n.arrayFormat
            : n && "indices" in n
            ? n.indices
              ? "indices"
              : "repeat"
            : "indices";
        var r = Oi[o];
        if (n && "commaRoundTrip" in n && "boolean" != typeof n.commaRoundTrip)
          throw new TypeError("`commaRoundTrip` must be a boolean, or absent");
        var c = "comma" === r && n && n.commaRoundTrip;
        a || (a = Object.keys(t)), i.sort && a.sort(i.sort);
        for (var p = Ei(), l = 0; l < a.length; ++l) {
          var u = a[l];
          (i.skipNulls && null === t[u]) ||
            Fi(
              s,
              Ni(
                t[u],
                u,
                r,
                c,
                i.strictNullHandling,
                i.skipNulls,
                i.encode ? i.encoder : null,
                i.filter,
                i.sort,
                i.allowDots,
                i.serializeDate,
                i.format,
                i.formatter,
                i.encodeValuesOnly,
                i.charset,
                p
              )
            );
        }
        var d = s.join(i.delimiter),
          m = !0 === i.addQueryPrefix ? "?" : "";
        return (
          i.charsetSentinel &&
            ("iso-8859-1" === i.charset
              ? (m += "utf8=%26%2310003%3B&")
              : (m += "utf8=%E2%9C%93&")),
          d.length > 0 ? m + d : ""
        );
      });
  function Di(e, n) {
    return e.replace(/\${([^{}]*)}/g, (e, a) => {
      const t = n[a];
      return "string" == typeof t || "number" == typeof t ? t : e;
    });
  }
  async function Ii(e, n) {
    const a = qi({ ...n, grant_type: "refresh_token" });
    return (
      await _a({
        method: "POST",
        url: e,
        data: a,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      })
    ).data;
  }
  async function Mi(e, n) {
    const a = {};
    return (
      Object.keys(e).forEach((t) => {
        a[t] = e[t] ? Di(e[t], n) : e[t];
      }),
      a
    );
  }
  class Hi {
    pathRegex;
    method;
    constructor(e, n) {
      (this.pathRegex = e),
        (this.method =
          "string" == typeof n
            ? n.toLowerCase()
            : n.map((e) => e.toLowerCase()));
    }
    isMatchingMethod(e) {
      return "string" == typeof this.method
        ? this.method === e.toLowerCase()
        : this.method.includes(e.toLowerCase());
    }
    isPath(e, n) {
      return this.pathRegex.test(e) && this.isMatchingMethod(n);
    }
    async baseRun(e, n, a, t) {
      try {
        const i = await this.run(e, n, a, t);
        if (a.proxy) return i;
        const o = { data: i.data };
        if (i.meta && Array.isArray(i.data)) {
          const e = await this.getMetaParams(i, a);
          o.meta = e;
        }
        const s = !0 === a.queryParams?.raw || "true" === a.queryParams?.raw;
        if (Array.isArray(o.data))
          o.data = o.data.map(({ raw: e, ...n }) => ({
            ...n,
            ...(s ? { raw: e } : {}),
          }));
        else {
          const { raw: e, ...n } = o.data;
          o.data = { ...n, ...(s ? { raw: e } : {}) };
        }
        return o;
      } catch (e) {
        return { data: {}, error: e };
      }
    }
    async getMetaParams(e, n) {
      let a =
        "string" == typeof n.queryParams?.cursor ? n.queryParams?.cursor : "";
      e.meta && e.meta.current && (a = e.meta.current);
      const t = e.meta ? e.meta.next : "",
        i = e.meta ? e.meta.previous ?? "" : "";
      return {
        limit: n.queryParams?.limit,
        cursors: { previous: i, current: a, next: t },
      };
    }
    async run(e, n, a, t) {
      return {};
    }
  }
  (a.BlockType = void 0),
    ((Xt = a.BlockType || (a.BlockType = {})).block_card = "block_card"),
    (Xt.bookmark = "bookmark"),
    (Xt.bookmark_text = "bookmark_text"),
    (Xt.breadcrumb = "breadcrumb"),
    (Xt.bulleted_list_item = "bulleted_list_item"),
    (Xt.callout = "callout"),
    (Xt.child_database = "child_database"),
    (Xt.child_page = "child_page"),
    (Xt.code = "code"),
    (Xt.column = "column"),
    (Xt.column_list = "column_list"),
    (Xt.divider = "divider"),
    (Xt.date = "date"),
    (Xt.embed = "embed"),
    (Xt.equation = "equation"),
    (Xt.file = "file"),
    (Xt.heading_1 = "heading_1"),
    (Xt.heading_2 = "heading_2"),
    (Xt.heading_3 = "heading_3"),
    (Xt.heading_4 = "heading_4"),
    (Xt.heading_5 = "heading_5"),
    (Xt.heading_6 = "heading_6"),
    (Xt.image = "image"),
    (Xt.inline_card = "inline_card"),
    (Xt.link_preview = "link_preview"),
    (Xt.link_to_page = "link_to_page"),
    (Xt.list_item = "list_item"),
    (Xt.numbered_list_item = "numbered_list_item"),
    (Xt.paragraph = "paragraph"),
    (Xt.pdf = "pdf"),
    (Xt.quote = "quote"),
    (Xt.synced_block = "synced_block"),
    (Xt.table = "table"),
    (Xt.table_of_contents = "table_of_contents"),
    (Xt.table_row = "table_row"),
    (Xt.table_cell = "table_cell"),
    (Xt.table_header = "table_header"),
    (Xt.template = "template"),
    (Xt.text = "text"),
    (Xt.to_do = "to_do"),
    (Xt.toggle = "toggle"),
    (Xt.unsupported = "unsupported"),
    (Xt.video = "video"),
    (a.StatusType = void 0),
    ((Zt = a.StatusType || (a.StatusType = {})).free = "free"),
    (Zt.busy = "busy"),
    (a.PaymentMethodType = void 0),
    ((ei =
      a.PaymentMethodType || (a.PaymentMethodType = {})).ach_credit_transfer =
      "ach_credit_transfer"),
    (ei.ach_debit = "ach_debit"),
    (ei.acss_debit = "acss_debit"),
    (ei.alipay = "alipay"),
    (ei.au_becs_debit = "au_becs_debit"),
    (ei.bancontact = "bancontact"),
    (ei.card = "card"),
    (ei.card_present = "card_present"),
    (ei.eps = "eps"),
    (ei.giropay = "giropay"),
    (ei.ideal = "ideal"),
    (ei.klarna = "klarna"),
    (ei.multibanco = "multibanco"),
    (ei.p24 = "p24"),
    (ei.sepa_debit = "sepa_debit"),
    (ei.sofort = "sofort"),
    (ei.stripe_account = "stripe_account"),
    (ei.wechat = "wechat"),
    (ei.netbank = "netbank"),
    (ei.wallet = "wallet"),
    (ei.emi = "emi"),
    (ei.upi = "upi"),
    (a.PaymentMethodStatus = void 0),
    ((ni = a.PaymentMethodStatus || (a.PaymentMethodStatus = {})).created =
      "created"),
    (ni.authorized = "authorized"),
    (ni.succeeded = "succeeded"),
    (ni.refunded = "refunded"),
    (ni.failed = "failed"),
    (a.BaseIntegration = class {
      async spec() {
        return { auth_specification: {} };
      }
      async check(e) {
        const n = await this.authHeaders(e);
        return 0 === Object.keys(n).length
          ? { status: !1, error: "Check failed" }
          : { status: !0, error: "" };
      }
      async authHeaders(e) {
        try {
          let n = {},
            a = {};
          if ("OAuth2" === e.authType) {
            const t = (await this.spec()).auth_specification.OAuth2;
            (a = t.headers ?? {}),
              (n = await Ii(Di(t.token_url, e), e)),
              (a = {
                ...a,
                Authorization: `Bearer ${n.access_token}`,
                "refresh-token": n.refresh_token ?? "",
                expiry: `${n.expires_in}`,
              });
          } else {
            const n = e.authType;
            a = (await this.spec()).auth_specification[n].headers ?? {};
          }
          return Mi(a || {}, { token: n.access_token, ...e });
        } catch (e) {
          return console.log(e), {};
        }
      }
      paths() {
        return [];
      }
      async run(e, n, a, t, i) {
        const o = this.paths().find((a) => a.isPath(e, n));
        if (o) {
          let e = t;
          return (
            t || (e = await this.authHeaders(a)), await o.baseRun(n, e, i, a)
          );
        }
        return {
          status: !1,
          error: "This Integration doesn't support this path/model",
        };
      }
      async runCommand(e, n) {
        switch (e) {
          case "SPEC":
            return await this.spec();
          case "CHECK":
            return await this.check(n.config);
          case "HEADERS":
            return await this.authHeaders(n.config);
          case "RUN":
            return n?.params?.proxy
              ? await this.run(
                  "/proxy",
                  n.method,
                  n.config,
                  n.headers,
                  n.params
                )
              : await this.run(n.path, n.method, n.config, n.headers, n.params);
          default:
            return { status: !1, error: "Command not found" };
        }
      }
    }),
    (a.BasePath = Hi),
    (a.MessageSchema = {
      type: "object",
      properties: {
        id: { type: "string", default: "" },
        date: { type: "string", default: "" },
        body: { type: "string", default: "" },
        html_body: { type: "string", default: "" },
        user_id: { type: "string", default: "" },
        snippet: { type: "string", default: "" },
        subject: { type: "string", default: "" },
        thread_id: { type: "string", default: "" },
        starred: { type: "boolean", default: !1 },
        unread: { type: "boolean", default: "" },
        bcc: {
          type: "array",
          default: [],
          items: [
            {
              type: "object",
              properties: {
                email: { type: "string", default: "" },
                name: { type: "string", default: "" },
              },
              required: ["email", "name"],
            },
          ],
        },
        cc: {
          type: "array",
          default: [],
          items: [
            {
              type: "object",
              properties: {
                email: { type: "string", default: "" },
                name: { type: "string", default: "" },
              },
              required: ["email", "name"],
            },
          ],
        },
        from: {
          type: "array",
          default: [],
          items: [
            {
              type: "object",
              properties: {
                email: { type: "string", default: "" },
                name: { type: "string", default: "" },
              },
              required: ["email", "name"],
            },
          ],
        },
        reply_to: {
          type: "array",
          default: [],
          items: [
            {
              type: "object",
              properties: {
                email: { type: "string", default: "" },
                name: { type: "string", default: "" },
              },
              required: ["email", "name"],
            },
          ],
        },
        labels: {
          type: "array",
          default: [],
          items: [{ type: "string", default: "" }],
        },
      },
    }),
    (a.ProxyPath = class extends Hi {
      async run(e, n, a) {
        const t = { url: a.url, method: e, headers: n };
        return (
          a.requestBody && (t.data = a.requestBody),
          a.queryParams && (t.params = a.queryParams),
          (await _a(t)).data
        );
      }
    }),
    (a.ThreadSchema = {
      type: "object",
      properties: {
        id: { type: "string", default: "" },
        history_id: { type: "string", default: "" },
        messages: {
          type: "array",
          default: [],
          items: [
            {
              type: "object",
              properties: {
                id: { type: "string", default: "" },
                date: { type: "string", default: "" },
                body: { type: "string", default: "" },
                html_body: { type: "string", default: "" },
                user_id: { type: "string", default: "" },
                snippet: { type: "string", default: "" },
                subject: { type: "string", default: "" },
                thread_id: { type: "string", default: "" },
                starred: { type: "boolean", default: !1 },
                unread: { type: "boolean", default: "" },
                bcc: {
                  type: "array",
                  default: [],
                  items: [
                    {
                      type: "object",
                      properties: {
                        email: { type: "string", default: "" },
                        name: { type: "string", default: "" },
                      },
                      required: ["email", "name"],
                    },
                  ],
                },
                cc: {
                  type: "array",
                  default: [],
                  items: [
                    {
                      type: "object",
                      properties: {
                        email: { type: "string", default: "" },
                        name: { type: "string", default: "" },
                      },
                      required: ["email", "name"],
                    },
                  ],
                },
                from: {
                  type: "array",
                  default: [],
                  items: [
                    {
                      type: "object",
                      properties: {
                        email: { type: "string", default: "" },
                        name: { type: "string", default: "" },
                      },
                      required: ["email", "name"],
                    },
                  ],
                },
                reply_to: {
                  type: "array",
                  default: [],
                  items: [
                    {
                      type: "object",
                      properties: {
                        email: { type: "string", default: "" },
                        name: { type: "string", default: "" },
                      },
                      required: ["email", "name"],
                    },
                  ],
                },
                labels: {
                  type: "array",
                  default: [],
                  items: [{ type: "string", default: "" }],
                },
              },
              required: [],
            },
          ],
        },
      },
    }),
    (a.UserSchema = {
      type: "object",
      properties: {
        id: { type: "string", default: "" },
        name: { type: "string", default: "" },
        email_address: { type: "string", default: "" },
        avatar: { type: "string", default: "" },
      },
    }),
    (a.convertToRequestBody = (e, n) => {
      const a = {};
      for (const t in n) {
        const i = n[t],
          o = e[t];
        void 0 !== o && (a[i] = o);
      }
      return a;
    }),
    (a.getAccessToken = Ii),
    (a.interpolateHeaders = Mi),
    (a.interpolateString = Di);
})(m);
const { toString: Re } = Object.prototype,
  { getPrototypeOf: Ce } = Object,
  Se =
    ((Oe = Object.create(null)),
    (e) => {
      const n = Re.call(e);
      return Oe[n] || (Oe[n] = n.slice(8, -1).toLowerCase());
    });
var Oe;
const Ae = (e) => ((e = e.toLowerCase()), (n) => Se(n) === e),
  Te = (e) => (n) => typeof n === e,
  { isArray: Fe } = Array,
  Pe = Te("undefined");
const Le = Ae("ArrayBuffer");
const Be = Te("string"),
  ze = Te("function"),
  Ne = Te("number"),
  Ue = (e) => null !== e && "object" == typeof e,
  qe = (e) => {
    if ("object" !== Se(e)) return !1;
    const n = Ce(e);
    return !(
      (null !== n &&
        n !== Object.prototype &&
        null !== Object.getPrototypeOf(n)) ||
      Symbol.toStringTag in e ||
      Symbol.iterator in e
    );
  },
  De = Ae("Date"),
  Ie = Ae("File"),
  Me = Ae("Blob"),
  He = Ae("FileList"),
  $e = Ae("URLSearchParams");
function We(e, n, { allOwnKeys: a = !1 } = {}) {
  if (null == e) return;
  let t, i;
  if (("object" != typeof e && (e = [e]), Fe(e)))
    for (t = 0, i = e.length; t < i; t++) n.call(null, e[t], t, e);
  else {
    const i = a ? Object.getOwnPropertyNames(e) : Object.keys(e),
      o = i.length;
    let s;
    for (t = 0; t < o; t++) (s = i[t]), n.call(null, e[s], s, e);
  }
}
function Ge(e, n) {
  n = n.toLowerCase();
  const a = Object.keys(e);
  let t,
    i = a.length;
  for (; i-- > 0; ) if (((t = a[i]), n === t.toLowerCase())) return t;
  return null;
}
const Ve =
    "undefined" != typeof globalThis
      ? globalThis
      : "undefined" != typeof self
      ? self
      : "undefined" != typeof window
      ? window
      : global,
  Je = (e) => !Pe(e) && e !== Ve;
const Ke =
  ((Qe = "undefined" != typeof Uint8Array && Ce(Uint8Array)),
  (e) => Qe && e instanceof Qe);
var Qe;
const Ye = Ae("HTMLFormElement"),
  Xe = (
    ({ hasOwnProperty: e }) =>
    (n, a) =>
      e.call(n, a)
  )(Object.prototype),
  Ze = Ae("RegExp"),
  en = (e, n) => {
    const a = Object.getOwnPropertyDescriptors(e),
      t = {};
    We(a, (a, i) => {
      !1 !== n(a, i, e) && (t[i] = a);
    }),
      Object.defineProperties(e, t);
  },
  nn = "abcdefghijklmnopqrstuvwxyz",
  an = "0123456789",
  tn = { DIGIT: an, ALPHA: nn, ALPHA_DIGIT: nn + nn.toUpperCase() + an };
const on = Ae("AsyncFunction");
var sn = {
  isArray: Fe,
  isArrayBuffer: Le,
  isBuffer: function (e) {
    return (
      null !== e &&
      !Pe(e) &&
      null !== e.constructor &&
      !Pe(e.constructor) &&
      ze(e.constructor.isBuffer) &&
      e.constructor.isBuffer(e)
    );
  },
  isFormData: (e) => {
    let n;
    return (
      e &&
      (("function" == typeof FormData && e instanceof FormData) ||
        (ze(e.append) &&
          ("formdata" === (n = Se(e)) ||
            ("object" === n &&
              ze(e.toString) &&
              "[object FormData]" === e.toString()))))
    );
  },
  isArrayBufferView: function (e) {
    let n;
    return (
      (n =
        "undefined" != typeof ArrayBuffer && ArrayBuffer.isView
          ? ArrayBuffer.isView(e)
          : e && e.buffer && Le(e.buffer)),
      n
    );
  },
  isString: Be,
  isNumber: Ne,
  isBoolean: (e) => !0 === e || !1 === e,
  isObject: Ue,
  isPlainObject: qe,
  isUndefined: Pe,
  isDate: De,
  isFile: Ie,
  isBlob: Me,
  isRegExp: Ze,
  isFunction: ze,
  isStream: (e) => Ue(e) && ze(e.pipe),
  isURLSearchParams: $e,
  isTypedArray: Ke,
  isFileList: He,
  forEach: We,
  merge: function e() {
    const { caseless: n } = (Je(this) && this) || {},
      a = {},
      t = (t, i) => {
        const o = (n && Ge(a, i)) || i;
        qe(a[o]) && qe(t)
          ? (a[o] = e(a[o], t))
          : qe(t)
          ? (a[o] = e({}, t))
          : Fe(t)
          ? (a[o] = t.slice())
          : (a[o] = t);
      };
    for (let e = 0, n = arguments.length; e < n; e++)
      arguments[e] && We(arguments[e], t);
    return a;
  },
  extend: (e, n, a, { allOwnKeys: t } = {}) => (
    We(
      n,
      (n, t) => {
        a && ze(n) ? (e[t] = Ee(n, a)) : (e[t] = n);
      },
      { allOwnKeys: t }
    ),
    e
  ),
  trim: (e) =>
    e.trim ? e.trim() : e.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, ""),
  stripBOM: (e) => (65279 === e.charCodeAt(0) && (e = e.slice(1)), e),
  inherits: (e, n, a, t) => {
    (e.prototype = Object.create(n.prototype, t)),
      (e.prototype.constructor = e),
      Object.defineProperty(e, "super", { value: n.prototype }),
      a && Object.assign(e.prototype, a);
  },
  toFlatObject: (e, n, a, t) => {
    let i, o, s;
    const r = {};
    if (((n = n || {}), null == e)) return n;
    do {
      for (i = Object.getOwnPropertyNames(e), o = i.length; o-- > 0; )
        (s = i[o]), (t && !t(s, e, n)) || r[s] || ((n[s] = e[s]), (r[s] = !0));
      e = !1 !== a && Ce(e);
    } while (e && (!a || a(e, n)) && e !== Object.prototype);
    return n;
  },
  kindOf: Se,
  kindOfTest: Ae,
  endsWith: (e, n, a) => {
    (e = String(e)),
      (void 0 === a || a > e.length) && (a = e.length),
      (a -= n.length);
    const t = e.indexOf(n, a);
    return -1 !== t && t === a;
  },
  toArray: (e) => {
    if (!e) return null;
    if (Fe(e)) return e;
    let n = e.length;
    if (!Ne(n)) return null;
    const a = new Array(n);
    for (; n-- > 0; ) a[n] = e[n];
    return a;
  },
  forEachEntry: (e, n) => {
    const a = (e && e[Symbol.iterator]).call(e);
    let t;
    for (; (t = a.next()) && !t.done; ) {
      const a = t.value;
      n.call(e, a[0], a[1]);
    }
  },
  matchAll: (e, n) => {
    let a;
    const t = [];
    for (; null !== (a = e.exec(n)); ) t.push(a);
    return t;
  },
  isHTMLForm: Ye,
  hasOwnProperty: Xe,
  hasOwnProp: Xe,
  reduceDescriptors: en,
  freezeMethods: (e) => {
    en(e, (n, a) => {
      if (ze(e) && -1 !== ["arguments", "caller", "callee"].indexOf(a))
        return !1;
      const t = e[a];
      ze(t) &&
        ((n.enumerable = !1),
        "writable" in n
          ? (n.writable = !1)
          : n.set ||
            (n.set = () => {
              throw Error("Can not rewrite read-only method '" + a + "'");
            }));
    });
  },
  toObjectSet: (e, n) => {
    const a = {},
      t = (e) => {
        e.forEach((e) => {
          a[e] = !0;
        });
      };
    return Fe(e) ? t(e) : t(String(e).split(n)), a;
  },
  toCamelCase: (e) =>
    e.toLowerCase().replace(/[-_\s]([a-z\d])(\w*)/g, function (e, n, a) {
      return n.toUpperCase() + a;
    }),
  noop: () => {},
  toFiniteNumber: (e, n) => ((e = +e), Number.isFinite(e) ? e : n),
  findKey: Ge,
  global: Ve,
  isContextDefined: Je,
  ALPHABET: tn,
  generateString: (e = 16, n = tn.ALPHA_DIGIT) => {
    let a = "";
    const { length: t } = n;
    for (; e--; ) a += n[(Math.random() * t) | 0];
    return a;
  },
  isSpecCompliantForm: function (e) {
    return !!(
      e &&
      ze(e.append) &&
      "FormData" === e[Symbol.toStringTag] &&
      e[Symbol.iterator]
    );
  },
  toJSONObject: (e) => {
    const n = new Array(10),
      a = (e, t) => {
        if (Ue(e)) {
          if (n.indexOf(e) >= 0) return;
          if (!("toJSON" in e)) {
            n[t] = e;
            const i = Fe(e) ? [] : {};
            return (
              We(e, (e, n) => {
                const o = a(e, t + 1);
                !Pe(o) && (i[n] = o);
              }),
              (n[t] = void 0),
              i
            );
          }
        }
        return e;
      };
    return a(e, 0);
  },
  isAsyncFn: on,
  isThenable: (e) => e && (Ue(e) || ze(e)) && ze(e.then) && ze(e.catch),
};
function rn(e, n, a, t, i) {
  Error.call(this),
    Error.captureStackTrace
      ? Error.captureStackTrace(this, this.constructor)
      : (this.stack = new Error().stack),
    (this.message = e),
    (this.name = "AxiosError"),
    n && (this.code = n),
    a && (this.config = a),
    t && (this.request = t),
    i && (this.response = i);
}
sn.inherits(rn, Error, {
  toJSON: function () {
    return {
      message: this.message,
      name: this.name,
      description: this.description,
      number: this.number,
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      config: sn.toJSONObject(this.config),
      code: this.code,
      status:
        this.response && this.response.status ? this.response.status : null,
    };
  },
});
const cn = rn.prototype,
  pn = {};
function ln(e) {
  return sn.isPlainObject(e) || sn.isArray(e);
}
function un(e) {
  return sn.endsWith(e, "[]") ? e.slice(0, -2) : e;
}
function dn(e, n, a) {
  return e
    ? e
        .concat(n)
        .map(function (e, n) {
          return (e = un(e)), !a && n ? "[" + e + "]" : e;
        })
        .join(a ? "." : "")
    : n;
}
[
  "ERR_BAD_OPTION_VALUE",
  "ERR_BAD_OPTION",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED",
  "ERR_NOT_SUPPORT",
  "ERR_INVALID_URL",
].forEach((e) => {
  pn[e] = { value: e };
}),
  Object.defineProperties(rn, pn),
  Object.defineProperty(cn, "isAxiosError", { value: !0 }),
  (rn.from = (e, n, a, t, i, o) => {
    const s = Object.create(cn);
    return (
      sn.toFlatObject(
        e,
        s,
        function (e) {
          return e !== Error.prototype;
        },
        (e) => "isAxiosError" !== e
      ),
      rn.call(s, e.message, n, a, t, i),
      (s.cause = e),
      (s.name = e.name),
      o && Object.assign(s, o),
      s
    );
  });
const mn = sn.toFlatObject(sn, {}, null, function (e) {
  return /^is[A-Z]/.test(e);
});
function fn(e, n, a) {
  if (!sn.isObject(e)) throw new TypeError("target must be an object");
  n = n || new (ie || FormData)();
  const t = (a = sn.toFlatObject(
      a,
      { metaTokens: !0, dots: !1, indexes: !1 },
      !1,
      function (e, n) {
        return !sn.isUndefined(n[e]);
      }
    )).metaTokens,
    i = a.visitor || p,
    o = a.dots,
    s = a.indexes,
    r =
      (a.Blob || ("undefined" != typeof Blob && Blob)) &&
      sn.isSpecCompliantForm(n);
  if (!sn.isFunction(i)) throw new TypeError("visitor must be a function");
  function c(e) {
    if (null === e) return "";
    if (sn.isDate(e)) return e.toISOString();
    if (!r && sn.isBlob(e))
      throw new rn("Blob is not supported. Use a Buffer instead.");
    return sn.isArrayBuffer(e) || sn.isTypedArray(e)
      ? r && "function" == typeof Blob
        ? new Blob([e])
        : Buffer.from(e)
      : e;
  }
  function p(e, a, i) {
    let r = e;
    if (e && !i && "object" == typeof e)
      if (sn.endsWith(a, "{}"))
        (a = t ? a : a.slice(0, -2)), (e = JSON.stringify(e));
      else if (
        (sn.isArray(e) &&
          (function (e) {
            return sn.isArray(e) && !e.some(ln);
          })(e)) ||
        ((sn.isFileList(e) || sn.endsWith(a, "[]")) && (r = sn.toArray(e)))
      )
        return (
          (a = un(a)),
          r.forEach(function (e, t) {
            !sn.isUndefined(e) &&
              null !== e &&
              n.append(
                !0 === s ? dn([a], t, o) : null === s ? a : a + "[]",
                c(e)
              );
          }),
          !1
        );
    return !!ln(e) || (n.append(dn(i, a, o), c(e)), !1);
  }
  const l = [],
    u = Object.assign(mn, {
      defaultVisitor: p,
      convertValue: c,
      isVisitable: ln,
    });
  if (!sn.isObject(e)) throw new TypeError("data must be an object");
  return (
    (function e(a, t) {
      if (!sn.isUndefined(a)) {
        if (-1 !== l.indexOf(a))
          throw Error("Circular reference detected in " + t.join("."));
        l.push(a),
          sn.forEach(a, function (a, o) {
            !0 ===
              (!(sn.isUndefined(a) || null === a) &&
                i.call(n, a, sn.isString(o) ? o.trim() : o, t, u)) &&
              e(a, t ? t.concat(o) : [o]);
          }),
          l.pop();
      }
    })(e),
    n
  );
}
function hn(e) {
  const n = {
    "!": "%21",
    "'": "%27",
    "(": "%28",
    ")": "%29",
    "~": "%7E",
    "%20": "+",
    "%00": "\0",
  };
  return encodeURIComponent(e).replace(/[!'()~]|%20|%00/g, function (e) {
    return n[e];
  });
}
function xn(e, n) {
  (this._pairs = []), e && fn(e, this, n);
}
const vn = xn.prototype;
function bn(e) {
  return encodeURIComponent(e)
    .replace(/%3A/gi, ":")
    .replace(/%24/g, "$")
    .replace(/%2C/gi, ",")
    .replace(/%20/g, "+")
    .replace(/%5B/gi, "[")
    .replace(/%5D/gi, "]");
}
function gn(e, n, a) {
  if (!n) return e;
  const t = (a && a.encode) || bn,
    i = a && a.serialize;
  let o;
  if (
    ((o = i
      ? i(n, a)
      : sn.isURLSearchParams(n)
      ? n.toString()
      : new xn(n, a).toString(t)),
    o)
  ) {
    const n = e.indexOf("#");
    -1 !== n && (e = e.slice(0, n)),
      (e += (-1 === e.indexOf("?") ? "?" : "&") + o);
  }
  return e;
}
(vn.append = function (e, n) {
  this._pairs.push([e, n]);
}),
  (vn.toString = function (e) {
    const n = e
      ? function (n) {
          return e.call(this, n, hn);
        }
      : hn;
    return this._pairs
      .map(function (e) {
        return n(e[0]) + "=" + n(e[1]);
      }, "")
      .join("&");
  });
var yn = class {
    constructor() {
      this.handlers = [];
    }
    use(e, n, a) {
      return (
        this.handlers.push({
          fulfilled: e,
          rejected: n,
          synchronous: !!a && a.synchronous,
          runWhen: a ? a.runWhen : null,
        }),
        this.handlers.length - 1
      );
    }
    eject(e) {
      this.handlers[e] && (this.handlers[e] = null);
    }
    clear() {
      this.handlers && (this.handlers = []);
    }
    forEach(e) {
      sn.forEach(this.handlers, function (n) {
        null !== n && e(n);
      });
    }
  },
  wn = {
    silentJSONParsing: !0,
    forcedJSONParsing: !0,
    clarifyTimeoutError: !1,
  },
  _n = {
    isNode: !0,
    classes: {
      URLSearchParams: o.URLSearchParams,
      FormData: ie,
      Blob: ("undefined" != typeof Blob && Blob) || null,
    },
    protocols: ["http", "https", "file", "data"],
  };
function kn(e) {
  function n(e, a, t, i) {
    let o = e[i++];
    const s = Number.isFinite(+o),
      r = i >= e.length;
    if (((o = !o && sn.isArray(t) ? t.length : o), r))
      return sn.hasOwnProp(t, o) ? (t[o] = [t[o], a]) : (t[o] = a), !s;
    (t[o] && sn.isObject(t[o])) || (t[o] = []);
    return (
      n(e, a, t[o], i) &&
        sn.isArray(t[o]) &&
        (t[o] = (function (e) {
          const n = {},
            a = Object.keys(e);
          let t;
          const i = a.length;
          let o;
          for (t = 0; t < i; t++) (o = a[t]), (n[o] = e[o]);
          return n;
        })(t[o])),
      !s
    );
  }
  if (sn.isFormData(e) && sn.isFunction(e.entries)) {
    const a = {};
    return (
      sn.forEachEntry(e, (e, t) => {
        n(
          (function (e) {
            return sn
              .matchAll(/\w+|\[(\w*)]/g, e)
              .map((e) => ("[]" === e[0] ? "" : e[1] || e[0]));
          })(e),
          t,
          a,
          0
        );
      }),
      a
    );
  }
  return null;
}
const jn = { "Content-Type": void 0 };
const En = {
  transitional: wn,
  adapter: ["xhr", "http"],
  transformRequest: [
    function (e, n) {
      const a = n.getContentType() || "",
        t = a.indexOf("application/json") > -1,
        i = sn.isObject(e);
      i && sn.isHTMLForm(e) && (e = new FormData(e));
      if (sn.isFormData(e)) return t && t ? JSON.stringify(kn(e)) : e;
      if (
        sn.isArrayBuffer(e) ||
        sn.isBuffer(e) ||
        sn.isStream(e) ||
        sn.isFile(e) ||
        sn.isBlob(e)
      )
        return e;
      if (sn.isArrayBufferView(e)) return e.buffer;
      if (sn.isURLSearchParams(e))
        return (
          n.setContentType(
            "application/x-www-form-urlencoded;charset=utf-8",
            !1
          ),
          e.toString()
        );
      let o;
      if (i) {
        if (a.indexOf("application/x-www-form-urlencoded") > -1)
          return (function (e, n) {
            return fn(
              e,
              new _n.classes.URLSearchParams(),
              Object.assign(
                {
                  visitor: function (e, n, a, t) {
                    return sn.isBuffer(e)
                      ? (this.append(n, e.toString("base64")), !1)
                      : t.defaultVisitor.apply(this, arguments);
                  },
                },
                n
              )
            );
          })(e, this.formSerializer).toString();
        if ((o = sn.isFileList(e)) || a.indexOf("multipart/form-data") > -1) {
          const n = this.env && this.env.FormData;
          return fn(
            o ? { "files[]": e } : e,
            n && new n(),
            this.formSerializer
          );
        }
      }
      return i || t
        ? (n.setContentType("application/json", !1),
          (function (e, n, a) {
            if (sn.isString(e))
              try {
                return (n || JSON.parse)(e), sn.trim(e);
              } catch (e) {
                if ("SyntaxError" !== e.name) throw e;
              }
            return (a || JSON.stringify)(e);
          })(e))
        : e;
    },
  ],
  transformResponse: [
    function (e) {
      const n = this.transitional || En.transitional,
        a = n && n.forcedJSONParsing,
        t = "json" === this.responseType;
      if (e && sn.isString(e) && ((a && !this.responseType) || t)) {
        const a = !(n && n.silentJSONParsing) && t;
        try {
          return JSON.parse(e);
        } catch (e) {
          if (a) {
            if ("SyntaxError" === e.name)
              throw rn.from(e, rn.ERR_BAD_RESPONSE, this, null, this.response);
            throw e;
          }
        }
      }
      return e;
    },
  ],
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: { FormData: _n.classes.FormData, Blob: _n.classes.Blob },
  validateStatus: function (e) {
    return e >= 200 && e < 300;
  },
  headers: { common: { Accept: "application/json, text/plain, */*" } },
};
sn.forEach(["delete", "get", "head"], function (e) {
  En.headers[e] = {};
}),
  sn.forEach(["post", "put", "patch"], function (e) {
    En.headers[e] = sn.merge(jn);
  });
var Rn = En;
const Cn = sn.toObjectSet([
  "age",
  "authorization",
  "content-length",
  "content-type",
  "etag",
  "expires",
  "from",
  "host",
  "if-modified-since",
  "if-unmodified-since",
  "last-modified",
  "location",
  "max-forwards",
  "proxy-authorization",
  "referer",
  "retry-after",
  "user-agent",
]);
const Sn = Symbol("internals");
function On(e) {
  return e && String(e).trim().toLowerCase();
}
function An(e) {
  return !1 === e || null == e ? e : sn.isArray(e) ? e.map(An) : String(e);
}
function Tn(e, n, a, t, i) {
  return sn.isFunction(t)
    ? t.call(this, n, a)
    : (i && (n = a),
      sn.isString(n)
        ? sn.isString(t)
          ? -1 !== n.indexOf(t)
          : sn.isRegExp(t)
          ? t.test(n)
          : void 0
        : void 0);
}
class Fn {
  constructor(e) {
    e && this.set(e);
  }
  set(e, n, a) {
    const t = this;
    function i(e, n, a) {
      const i = On(n);
      if (!i) throw new Error("header name must be a non-empty string");
      const o = sn.findKey(t, i);
      (!o || void 0 === t[o] || !0 === a || (void 0 === a && !1 !== t[o])) &&
        (t[o || n] = An(e));
    }
    const o = (e, n) => sn.forEach(e, (e, a) => i(e, a, n));
    return (
      sn.isPlainObject(e) || e instanceof this.constructor
        ? o(e, n)
        : sn.isString(e) &&
          (e = e.trim()) &&
          !/^[-_a-zA-Z0-9^`|~,!#$%&'*+.]+$/.test(e.trim())
        ? o(
            ((e) => {
              const n = {};
              let a, t, i;
              return (
                e &&
                  e.split("\n").forEach(function (e) {
                    (i = e.indexOf(":")),
                      (a = e.substring(0, i).trim().toLowerCase()),
                      (t = e.substring(i + 1).trim()),
                      !a ||
                        (n[a] && Cn[a]) ||
                        ("set-cookie" === a
                          ? n[a]
                            ? n[a].push(t)
                            : (n[a] = [t])
                          : (n[a] = n[a] ? n[a] + ", " + t : t));
                  }),
                n
              );
            })(e),
            n
          )
        : null != e && i(n, e, a),
      this
    );
  }
  get(e, n) {
    if ((e = On(e))) {
      const a = sn.findKey(this, e);
      if (a) {
        const e = this[a];
        if (!n) return e;
        if (!0 === n)
          return (function (e) {
            const n = Object.create(null),
              a = /([^\s,;=]+)\s*(?:=\s*([^,;]+))?/g;
            let t;
            for (; (t = a.exec(e)); ) n[t[1]] = t[2];
            return n;
          })(e);
        if (sn.isFunction(n)) return n.call(this, e, a);
        if (sn.isRegExp(n)) return n.exec(e);
        throw new TypeError("parser must be boolean|regexp|function");
      }
    }
  }
  has(e, n) {
    if ((e = On(e))) {
      const a = sn.findKey(this, e);
      return !(!a || void 0 === this[a] || (n && !Tn(0, this[a], a, n)));
    }
    return !1;
  }
  delete(e, n) {
    const a = this;
    let t = !1;
    function i(e) {
      if ((e = On(e))) {
        const i = sn.findKey(a, e);
        !i || (n && !Tn(0, a[i], i, n)) || (delete a[i], (t = !0));
      }
    }
    return sn.isArray(e) ? e.forEach(i) : i(e), t;
  }
  clear(e) {
    const n = Object.keys(this);
    let a = n.length,
      t = !1;
    for (; a--; ) {
      const i = n[a];
      (e && !Tn(0, this[i], i, e, !0)) || (delete this[i], (t = !0));
    }
    return t;
  }
  normalize(e) {
    const n = this,
      a = {};
    return (
      sn.forEach(this, (t, i) => {
        const o = sn.findKey(a, i);
        if (o) return (n[o] = An(t)), void delete n[i];
        const s = e
          ? (function (e) {
              return e
                .trim()
                .toLowerCase()
                .replace(/([a-z\d])(\w*)/g, (e, n, a) => n.toUpperCase() + a);
            })(i)
          : String(i).trim();
        s !== i && delete n[i], (n[s] = An(t)), (a[s] = !0);
      }),
      this
    );
  }
  concat(...e) {
    return this.constructor.concat(this, ...e);
  }
  toJSON(e) {
    const n = Object.create(null);
    return (
      sn.forEach(this, (a, t) => {
        null != a && !1 !== a && (n[t] = e && sn.isArray(a) ? a.join(", ") : a);
      }),
      n
    );
  }
  [Symbol.iterator]() {
    return Object.entries(this.toJSON())[Symbol.iterator]();
  }
  toString() {
    return Object.entries(this.toJSON())
      .map(([e, n]) => e + ": " + n)
      .join("\n");
  }
  get [Symbol.toStringTag]() {
    return "AxiosHeaders";
  }
  static from(e) {
    return e instanceof this ? e : new this(e);
  }
  static concat(e, ...n) {
    const a = new this(e);
    return n.forEach((e) => a.set(e)), a;
  }
  static accessor(e) {
    const n = (this[Sn] = this[Sn] = { accessors: {} }).accessors,
      a = this.prototype;
    function t(e) {
      const t = On(e);
      n[t] ||
        (!(function (e, n) {
          const a = sn.toCamelCase(" " + n);
          ["get", "set", "has"].forEach((t) => {
            Object.defineProperty(e, t + a, {
              value: function (e, a, i) {
                return this[t].call(this, n, e, a, i);
              },
              configurable: !0,
            });
          });
        })(a, e),
        (n[t] = !0));
    }
    return sn.isArray(e) ? e.forEach(t) : t(e), this;
  }
}
Fn.accessor([
  "Content-Type",
  "Content-Length",
  "Accept",
  "Accept-Encoding",
  "User-Agent",
  "Authorization",
]),
  sn.freezeMethods(Fn.prototype),
  sn.freezeMethods(Fn);
var Pn = Fn;
function Ln(e, n) {
  const a = this || Rn,
    t = n || a,
    i = Pn.from(t.headers);
  let o = t.data;
  return (
    sn.forEach(e, function (e) {
      o = e.call(a, o, i.normalize(), n ? n.status : void 0);
    }),
    i.normalize(),
    o
  );
}
function Bn(e) {
  return !(!e || !e.__CANCEL__);
}
function zn(e, n, a) {
  rn.call(this, null == e ? "canceled" : e, rn.ERR_CANCELED, n, a),
    (this.name = "CanceledError");
}
function Nn(e, n, a) {
  const t = a.config.validateStatus;
  a.status && t && !t(a.status)
    ? n(
        new rn(
          "Request failed with status code " + a.status,
          [rn.ERR_BAD_REQUEST, rn.ERR_BAD_RESPONSE][
            Math.floor(a.status / 100) - 4
          ],
          a.config,
          a.request,
          a
        )
      )
    : e(a);
}
function Un(e, n) {
  return e &&
    !(function (e) {
      return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(e);
    })(n)
    ? (function (e, n) {
        return n ? e.replace(/\/+$/, "") + "/" + n.replace(/^\/+/, "") : e;
      })(e, n)
    : n;
}
sn.inherits(zn, rn, { __CANCEL__: !0 });
var qn = o.parse,
  Dn = { ftp: 21, gopher: 70, http: 80, https: 443, ws: 80, wss: 443 },
  In =
    String.prototype.endsWith ||
    function (e) {
      return (
        e.length <= this.length &&
        -1 !== this.indexOf(e, this.length - e.length)
      );
    };
function Mn(e) {
  return process.env[e.toLowerCase()] || process.env[e.toUpperCase()] || "";
}
var Hn,
  $n,
  Wn,
  Gn = function (e) {
    var n = "string" == typeof e ? qn(e) : e || {},
      a = n.protocol,
      t = n.host,
      i = n.port;
    if ("string" != typeof t || !t || "string" != typeof a) return "";
    if (
      ((a = a.split(":", 1)[0]),
      !(function (e, n) {
        var a = (Mn("npm_config_no_proxy") || Mn("no_proxy")).toLowerCase();
        if (!a) return !0;
        if ("*" === a) return !1;
        return a.split(/[,\s]/).every(function (a) {
          if (!a) return !0;
          var t = a.match(/^(.+):(\d+)$/),
            i = t ? t[1] : a,
            o = t ? parseInt(t[2]) : 0;
          return (
            !(!o || o === n) ||
            (/^[.*]/.test(i)
              ? ("*" === i.charAt(0) && (i = i.slice(1)), !In.call(e, i))
              : e !== i)
          );
        });
      })((t = t.replace(/:\d*$/, "")), (i = parseInt(i) || Dn[a] || 0)))
    )
      return "";
    var o =
      Mn("npm_config_" + a + "_proxy") ||
      Mn(a + "_proxy") ||
      Mn("npm_config_proxy") ||
      Mn("all_proxy");
    return o && -1 === o.indexOf("://") && (o = a + "://" + o), o;
  },
  Vn = {},
  Jn = {
    get exports() {
      return Vn;
    },
    set exports(e) {
      Vn = e;
    },
  },
  Kn = {},
  Qn = {
    get exports() {
      return Kn;
    },
    set exports(e) {
      Kn = e;
    },
  },
  Yn = {},
  Xn = {
    get exports() {
      return Yn;
    },
    set exports(e) {
      Yn = e;
    },
  };
function Zn() {
  if ($n) return Hn;
  return (
    ($n = 1),
    (Hn = function (e) {
      function n(e) {
        let t,
          i,
          o,
          s = null;
        function r(...e) {
          if (!r.enabled) return;
          const a = r,
            i = Number(new Date()),
            o = i - (t || i);
          (a.diff = o),
            (a.prev = t),
            (a.curr = i),
            (t = i),
            (e[0] = n.coerce(e[0])),
            "string" != typeof e[0] && e.unshift("%O");
          let s = 0;
          (e[0] = e[0].replace(/%([a-zA-Z%])/g, (t, i) => {
            if ("%%" === t) return "%";
            s++;
            const o = n.formatters[i];
            if ("function" == typeof o) {
              const n = e[s];
              (t = o.call(a, n)), e.splice(s, 1), s--;
            }
            return t;
          })),
            n.formatArgs.call(a, e);
          (a.log || n.log).apply(a, e);
        }
        return (
          (r.namespace = e),
          (r.useColors = n.useColors()),
          (r.color = n.selectColor(e)),
          (r.extend = a),
          (r.destroy = n.destroy),
          Object.defineProperty(r, "enabled", {
            enumerable: !0,
            configurable: !1,
            get: () =>
              null !== s
                ? s
                : (i !== n.namespaces &&
                    ((i = n.namespaces), (o = n.enabled(e))),
                  o),
            set: (e) => {
              s = e;
            },
          }),
          "function" == typeof n.init && n.init(r),
          r
        );
      }
      function a(e, a) {
        const t = n(this.namespace + (void 0 === a ? ":" : a) + e);
        return (t.log = this.log), t;
      }
      function t(e) {
        return e
          .toString()
          .substring(2, e.toString().length - 2)
          .replace(/\.\*\?$/, "*");
      }
      return (
        (n.debug = n),
        (n.default = n),
        (n.coerce = function (e) {
          if (e instanceof Error) return e.stack || e.message;
          return e;
        }),
        (n.disable = function () {
          const e = [
            ...n.names.map(t),
            ...n.skips.map(t).map((e) => "-" + e),
          ].join(",");
          return n.enable(""), e;
        }),
        (n.enable = function (e) {
          let a;
          n.save(e), (n.namespaces = e), (n.names = []), (n.skips = []);
          const t = ("string" == typeof e ? e : "").split(/[\s,]+/),
            i = t.length;
          for (a = 0; a < i; a++)
            t[a] &&
              ("-" === (e = t[a].replace(/\*/g, ".*?"))[0]
                ? n.skips.push(new RegExp("^" + e.slice(1) + "$"))
                : n.names.push(new RegExp("^" + e + "$")));
        }),
        (n.enabled = function (e) {
          if ("*" === e[e.length - 1]) return !0;
          let a, t;
          for (a = 0, t = n.skips.length; a < t; a++)
            if (n.skips[a].test(e)) return !1;
          for (a = 0, t = n.names.length; a < t; a++)
            if (n.names[a].test(e)) return !0;
          return !1;
        }),
        (n.humanize = de),
        (n.destroy = function () {
          console.warn(
            "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
          );
        }),
        Object.keys(e).forEach((a) => {
          n[a] = e[a];
        }),
        (n.names = []),
        (n.skips = []),
        (n.formatters = {}),
        (n.selectColor = function (e) {
          let a = 0;
          for (let n = 0; n < e.length; n++)
            (a = (a << 5) - a + e.charCodeAt(n)), (a |= 0);
          return n.colors[Math.abs(a) % n.colors.length];
        }),
        n.enable(n.load()),
        n
      );
    }),
    Hn
  );
}
var ea,
  na,
  aa,
  ta = {},
  ia = {
    get exports() {
      return ta;
    },
    set exports(e) {
      ta = e;
    },
  };
function oa() {
  return (
    ea ||
      ((ea = 1),
      (function (n, a) {
        const t = c,
          i = e;
        (a.init = function (e) {
          e.inspectOpts = {};
          const n = Object.keys(a.inspectOpts);
          for (let t = 0; t < n.length; t++)
            e.inspectOpts[n[t]] = a.inspectOpts[n[t]];
        }),
          (a.log = function (...e) {
            return process.stderr.write(i.format(...e) + "\n");
          }),
          (a.formatArgs = function (e) {
            const { namespace: t, useColors: i } = this;
            if (i) {
              const a = this.color,
                i = "[3" + (a < 8 ? a : "8;5;" + a),
                o = `  ${i};1m${t} [0m`;
              (e[0] = o + e[0].split("\n").join("\n" + o)),
                e.push(i + "m+" + n.exports.humanize(this.diff) + "[0m");
            } else
              e[0] =
                (function () {
                  if (a.inspectOpts.hideDate) return "";
                  return new Date().toISOString() + " ";
                })() +
                t +
                " " +
                e[0];
          }),
          (a.save = function (e) {
            e ? (process.env.DEBUG = e) : delete process.env.DEBUG;
          }),
          (a.load = function () {
            return process.env.DEBUG;
          }),
          (a.useColors = function () {
            return "colors" in a.inspectOpts
              ? Boolean(a.inspectOpts.colors)
              : t.isatty(process.stderr.fd);
          }),
          (a.destroy = i.deprecate(() => {},
          "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.")),
          (a.colors = [6, 2, 3, 4, 5, 1]);
        try {
          const e = je();
          e &&
            (e.stderr || e).level >= 2 &&
            (a.colors = [
              20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57,
              62, 63, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99,
              112, 113, 128, 129, 134, 135, 148, 149, 160, 161, 162, 163, 164,
              165, 166, 167, 168, 169, 170, 171, 172, 173, 178, 179, 184, 185,
              196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208,
              209, 214, 215, 220, 221,
            ]);
        } catch (e) {}
        (a.inspectOpts = Object.keys(process.env)
          .filter((e) => /^debug_/i.test(e))
          .reduce((e, n) => {
            const a = n
              .substring(6)
              .toLowerCase()
              .replace(/_([a-z])/g, (e, n) => n.toUpperCase());
            let t = process.env[n];
            return (
              (t =
                !!/^(yes|on|true|enabled)$/i.test(t) ||
                (!/^(no|off|false|disabled)$/i.test(t) &&
                  ("null" === t ? null : Number(t)))),
              (e[a] = t),
              e
            );
          }, {})),
          (n.exports = Zn()(a));
        const { formatters: o } = n.exports;
        (o.o = function (e) {
          return (
            (this.inspectOpts.colors = this.useColors),
            i
              .inspect(e, this.inspectOpts)
              .split("\n")
              .map((e) => e.trim())
              .join(" ")
          );
        }),
          (o.O = function (e) {
            return (
              (this.inspectOpts.colors = this.useColors),
              i.inspect(e, this.inspectOpts)
            );
          });
      })(ia, ta)),
    ta
  );
}
function sa() {
  return (
    na ||
      ((na = 1),
      (e = Qn),
      "undefined" == typeof process ||
      "renderer" === process.type ||
      !0 === process.browser ||
      process.__nwjs
        ? (e.exports =
            (Wn ||
              ((Wn = 1),
              (function (e, n) {
                (n.formatArgs = function (n) {
                  if (
                    ((n[0] =
                      (this.useColors ? "%c" : "") +
                      this.namespace +
                      (this.useColors ? " %c" : " ") +
                      n[0] +
                      (this.useColors ? "%c " : " ") +
                      "+" +
                      e.exports.humanize(this.diff)),
                    !this.useColors)
                  )
                    return;
                  const a = "color: " + this.color;
                  n.splice(1, 0, a, "color: inherit");
                  let t = 0,
                    i = 0;
                  n[0].replace(/%[a-zA-Z%]/g, (e) => {
                    "%%" !== e && (t++, "%c" === e && (i = t));
                  }),
                    n.splice(i, 0, a);
                }),
                  (n.save = function (e) {
                    try {
                      e
                        ? n.storage.setItem("debug", e)
                        : n.storage.removeItem("debug");
                    } catch (e) {}
                  }),
                  (n.load = function () {
                    let e;
                    try {
                      e = n.storage.getItem("debug");
                    } catch (e) {}
                    return (
                      !e &&
                        "undefined" != typeof process &&
                        "env" in process &&
                        (e = process.env.DEBUG),
                      e
                    );
                  }),
                  (n.useColors = function () {
                    return (
                      !(
                        "undefined" == typeof window ||
                        !window.process ||
                        ("renderer" !== window.process.type &&
                          !window.process.__nwjs)
                      ) ||
                      (("undefined" == typeof navigator ||
                        !navigator.userAgent ||
                        !navigator.userAgent
                          .toLowerCase()
                          .match(/(edge|trident)\/(\d+)/)) &&
                        (("undefined" != typeof document &&
                          document.documentElement &&
                          document.documentElement.style &&
                          document.documentElement.style.WebkitAppearance) ||
                          ("undefined" != typeof window &&
                            window.console &&
                            (window.console.firebug ||
                              (window.console.exception &&
                                window.console.table))) ||
                          ("undefined" != typeof navigator &&
                            navigator.userAgent &&
                            navigator.userAgent
                              .toLowerCase()
                              .match(/firefox\/(\d+)/) &&
                            parseInt(RegExp.$1, 10) >= 31) ||
                          ("undefined" != typeof navigator &&
                            navigator.userAgent &&
                            navigator.userAgent
                              .toLowerCase()
                              .match(/applewebkit\/(\d+)/))))
                    );
                  }),
                  (n.storage = (function () {
                    try {
                      return localStorage;
                    } catch (e) {}
                  })()),
                  (n.destroy = (() => {
                    let e = !1;
                    return () => {
                      e ||
                        ((e = !0),
                        console.warn(
                          "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
                        ));
                    };
                  })()),
                  (n.colors = [
                    "#0000CC",
                    "#0000FF",
                    "#0033CC",
                    "#0033FF",
                    "#0066CC",
                    "#0066FF",
                    "#0099CC",
                    "#0099FF",
                    "#00CC00",
                    "#00CC33",
                    "#00CC66",
                    "#00CC99",
                    "#00CCCC",
                    "#00CCFF",
                    "#3300CC",
                    "#3300FF",
                    "#3333CC",
                    "#3333FF",
                    "#3366CC",
                    "#3366FF",
                    "#3399CC",
                    "#3399FF",
                    "#33CC00",
                    "#33CC33",
                    "#33CC66",
                    "#33CC99",
                    "#33CCCC",
                    "#33CCFF",
                    "#6600CC",
                    "#6600FF",
                    "#6633CC",
                    "#6633FF",
                    "#66CC00",
                    "#66CC33",
                    "#9900CC",
                    "#9900FF",
                    "#9933CC",
                    "#9933FF",
                    "#99CC00",
                    "#99CC33",
                    "#CC0000",
                    "#CC0033",
                    "#CC0066",
                    "#CC0099",
                    "#CC00CC",
                    "#CC00FF",
                    "#CC3300",
                    "#CC3333",
                    "#CC3366",
                    "#CC3399",
                    "#CC33CC",
                    "#CC33FF",
                    "#CC6600",
                    "#CC6633",
                    "#CC9900",
                    "#CC9933",
                    "#CCCC00",
                    "#CCCC33",
                    "#FF0000",
                    "#FF0033",
                    "#FF0066",
                    "#FF0099",
                    "#FF00CC",
                    "#FF00FF",
                    "#FF3300",
                    "#FF3333",
                    "#FF3366",
                    "#FF3399",
                    "#FF33CC",
                    "#FF33FF",
                    "#FF6600",
                    "#FF6633",
                    "#FF9900",
                    "#FF9933",
                    "#FFCC00",
                    "#FFCC33",
                  ]),
                  (n.log = console.debug || console.log || (() => {})),
                  (e.exports = Zn()(n));
                const { formatters: a } = e.exports;
                a.j = function (e) {
                  try {
                    return JSON.stringify(e);
                  } catch (e) {
                    return "[UnexpectedJSONParseError]: " + e.message;
                  }
                };
              })(Xn, Yn)),
            Yn))
        : (e.exports = oa())),
    Kn
  );
  var e;
}
var ra = o,
  ca = ra.URL,
  pa = t,
  la = i,
  ua = n.Writable,
  da = r,
  ma = function () {
    if (!aa) {
      try {
        aa = sa()("follow-redirects");
      } catch (e) {}
      "function" != typeof aa && (aa = function () {});
    }
    aa.apply(null, arguments);
  },
  fa = ["abort", "aborted", "connect", "error", "socket", "timeout"],
  ha = Object.create(null);
fa.forEach(function (e) {
  ha[e] = function (n, a, t) {
    this._redirectable.emit(e, n, a, t);
  };
});
var xa = Ra("ERR_INVALID_URL", "Invalid URL", TypeError),
  va = Ra("ERR_FR_REDIRECTION_FAILURE", "Redirected request failed"),
  ba = Ra("ERR_FR_TOO_MANY_REDIRECTS", "Maximum number of redirects exceeded"),
  ga = Ra(
    "ERR_FR_MAX_BODY_LENGTH_EXCEEDED",
    "Request body larger than maxBodyLength limit"
  ),
  ya = Ra("ERR_STREAM_WRITE_AFTER_END", "write after end");
function wa(e, n) {
  ua.call(this),
    this._sanitizeOptions(e),
    (this._options = e),
    (this._ended = !1),
    (this._ending = !1),
    (this._redirectCount = 0),
    (this._redirects = []),
    (this._requestBodyLength = 0),
    (this._requestBodyBuffers = []),
    n && this.on("response", n);
  var a = this;
  (this._onNativeResponse = function (e) {
    a._processResponse(e);
  }),
    this._performRequest();
}
function _a(e) {
  var n = { maxRedirects: 21, maxBodyLength: 10485760 },
    a = {};
  return (
    Object.keys(e).forEach(function (t) {
      var i = t + ":",
        o = (a[i] = e[t]),
        s = (n[t] = Object.create(o));
      Object.defineProperties(s, {
        request: {
          value: function (e, t, o) {
            if (Sa(e)) {
              var s;
              try {
                s = ja(new ca(e));
              } catch (n) {
                s = ra.parse(e);
              }
              if (!Sa(s.protocol)) throw new xa({ input: e });
              e = s;
            } else
              ca && e instanceof ca
                ? (e = ja(e))
                : ((o = t), (t = e), (e = { protocol: i }));
            return (
              Oa(t) && ((o = t), (t = null)),
              ((t = Object.assign(
                {
                  maxRedirects: n.maxRedirects,
                  maxBodyLength: n.maxBodyLength,
                },
                e,
                t
              )).nativeProtocols = a),
              Sa(t.host) || Sa(t.hostname) || (t.hostname = "::1"),
              da.equal(t.protocol, i, "protocol mismatch"),
              ma("options", t),
              new wa(t, o)
            );
          },
          configurable: !0,
          enumerable: !0,
          writable: !0,
        },
        get: {
          value: function (e, n, a) {
            var t = s.request(e, n, a);
            return t.end(), t;
          },
          configurable: !0,
          enumerable: !0,
          writable: !0,
        },
      });
    }),
    n
  );
}
function ka() {}
function ja(e) {
  var n = {
    protocol: e.protocol,
    hostname: e.hostname.startsWith("[") ? e.hostname.slice(1, -1) : e.hostname,
    hash: e.hash,
    search: e.search,
    pathname: e.pathname,
    path: e.pathname + e.search,
    href: e.href,
  };
  return "" !== e.port && (n.port = Number(e.port)), n;
}
function Ea(e, n) {
  var a;
  for (var t in n) e.test(t) && ((a = n[t]), delete n[t]);
  return null == a ? void 0 : String(a).trim();
}
function Ra(e, n, a) {
  function t(a) {
    Error.captureStackTrace(this, this.constructor),
      Object.assign(this, a || {}),
      (this.code = e),
      (this.message = this.cause ? n + ": " + this.cause.message : n);
  }
  return (
    (t.prototype = new (a || Error)()),
    (t.prototype.constructor = t),
    (t.prototype.name = "Error [" + e + "]"),
    t
  );
}
function Ca(e) {
  for (var n of fa) e.removeListener(n, ha[n]);
  e.on("error", ka), e.abort();
}
function Sa(e) {
  return "string" == typeof e || e instanceof String;
}
function Oa(e) {
  return "function" == typeof e;
}
(wa.prototype = Object.create(ua.prototype)),
  (wa.prototype.abort = function () {
    Ca(this._currentRequest), this.emit("abort");
  }),
  (wa.prototype.write = function (e, n, a) {
    if (this._ending) throw new ya();
    if (!Sa(e) && ("object" != typeof (t = e) || !("length" in t)))
      throw new TypeError("data should be a string, Buffer or Uint8Array");
    var t;
    Oa(n) && ((a = n), (n = null)),
      0 !== e.length
        ? this._requestBodyLength + e.length <= this._options.maxBodyLength
          ? ((this._requestBodyLength += e.length),
            this._requestBodyBuffers.push({ data: e, encoding: n }),
            this._currentRequest.write(e, n, a))
          : (this.emit("error", new ga()), this.abort())
        : a && a();
  }),
  (wa.prototype.end = function (e, n, a) {
    if (
      (Oa(e) ? ((a = e), (e = n = null)) : Oa(n) && ((a = n), (n = null)), e)
    ) {
      var t = this,
        i = this._currentRequest;
      this.write(e, n, function () {
        (t._ended = !0), i.end(null, null, a);
      }),
        (this._ending = !0);
    } else
      (this._ended = this._ending = !0),
        this._currentRequest.end(null, null, a);
  }),
  (wa.prototype.setHeader = function (e, n) {
    (this._options.headers[e] = n), this._currentRequest.setHeader(e, n);
  }),
  (wa.prototype.removeHeader = function (e) {
    delete this._options.headers[e], this._currentRequest.removeHeader(e);
  }),
  (wa.prototype.setTimeout = function (e, n) {
    var a = this;
    function t(n) {
      n.setTimeout(e),
        n.removeListener("timeout", n.destroy),
        n.addListener("timeout", n.destroy);
    }
    function i(n) {
      a._timeout && clearTimeout(a._timeout),
        (a._timeout = setTimeout(function () {
          a.emit("timeout"), o();
        }, e)),
        t(n);
    }
    function o() {
      a._timeout && (clearTimeout(a._timeout), (a._timeout = null)),
        a.removeListener("abort", o),
        a.removeListener("error", o),
        a.removeListener("response", o),
        n && a.removeListener("timeout", n),
        a.socket || a._currentRequest.removeListener("socket", i);
    }
    return (
      n && this.on("timeout", n),
      this.socket ? i(this.socket) : this._currentRequest.once("socket", i),
      this.on("socket", t),
      this.on("abort", o),
      this.on("error", o),
      this.on("response", o),
      this
    );
  }),
  ["flushHeaders", "getHeader", "setNoDelay", "setSocketKeepAlive"].forEach(
    function (e) {
      wa.prototype[e] = function (n, a) {
        return this._currentRequest[e](n, a);
      };
    }
  ),
  ["aborted", "connection", "socket"].forEach(function (e) {
    Object.defineProperty(wa.prototype, e, {
      get: function () {
        return this._currentRequest[e];
      },
    });
  }),
  (wa.prototype._sanitizeOptions = function (e) {
    if (
      (e.headers || (e.headers = {}),
      e.host && (e.hostname || (e.hostname = e.host), delete e.host),
      !e.pathname && e.path)
    ) {
      var n = e.path.indexOf("?");
      n < 0
        ? (e.pathname = e.path)
        : ((e.pathname = e.path.substring(0, n)),
          (e.search = e.path.substring(n)));
    }
  }),
  (wa.prototype._performRequest = function () {
    var e = this._options.protocol,
      n = this._options.nativeProtocols[e];
    if (n) {
      if (this._options.agents) {
        var a = e.slice(0, -1);
        this._options.agent = this._options.agents[a];
      }
      var t = (this._currentRequest = n.request(
        this._options,
        this._onNativeResponse
      ));
      for (var i of ((t._redirectable = this), fa)) t.on(i, ha[i]);
      if (
        ((this._currentUrl = /^\//.test(this._options.path)
          ? ra.format(this._options)
          : this._options.path),
        this._isRedirect)
      ) {
        var o = 0,
          s = this,
          r = this._requestBodyBuffers;
        !(function e(n) {
          if (t === s._currentRequest)
            if (n) s.emit("error", n);
            else if (o < r.length) {
              var a = r[o++];
              t.finished || t.write(a.data, a.encoding, e);
            } else s._ended && t.end();
        })();
      }
    } else this.emit("error", new TypeError("Unsupported protocol " + e));
  }),
  (wa.prototype._processResponse = function (e) {
    var n = e.statusCode;
    this._options.trackRedirects &&
      this._redirects.push({
        url: this._currentUrl,
        headers: e.headers,
        statusCode: n,
      });
    var a = e.headers.location;
    if (!a || !1 === this._options.followRedirects || n < 300 || n >= 400)
      return (
        (e.responseUrl = this._currentUrl),
        (e.redirects = this._redirects),
        this.emit("response", e),
        void (this._requestBodyBuffers = [])
      );
    if (
      (Ca(this._currentRequest),
      e.destroy(),
      ++this._redirectCount > this._options.maxRedirects)
    )
      this.emit("error", new ba());
    else {
      var t,
        i = this._options.beforeRedirect;
      i &&
        (t = Object.assign(
          { Host: e.req.getHeader("host") },
          this._options.headers
        ));
      var o = this._options.method;
      (((301 === n || 302 === n) && "POST" === this._options.method) ||
        (303 === n && !/^(?:GET|HEAD)$/.test(this._options.method))) &&
        ((this._options.method = "GET"),
        (this._requestBodyBuffers = []),
        Ea(/^content-/i, this._options.headers));
      var s,
        r = Ea(/^host$/i, this._options.headers),
        c = ra.parse(this._currentUrl),
        p = r || c.host,
        l = /^\w+:/.test(a)
          ? this._currentUrl
          : ra.format(Object.assign(c, { host: p }));
      try {
        s = ra.resolve(l, a);
      } catch (e) {
        return void this.emit("error", new va({ cause: e }));
      }
      ma("redirecting to", s), (this._isRedirect = !0);
      var u = ra.parse(s);
      if (
        (Object.assign(this._options, u),
        ((u.protocol !== c.protocol && "https:" !== u.protocol) ||
          (u.host !== p &&
            !(function (e, n) {
              da(Sa(e) && Sa(n));
              var a = e.length - n.length - 1;
              return a > 0 && "." === e[a] && e.endsWith(n);
            })(u.host, p))) &&
          Ea(/^(?:authorization|cookie)$/i, this._options.headers),
        Oa(i))
      ) {
        var d = { headers: e.headers, statusCode: n },
          m = { url: l, method: o, headers: t };
        try {
          i(this._options, d, m);
        } catch (e) {
          return void this.emit("error", e);
        }
        this._sanitizeOptions(this._options);
      }
      try {
        this._performRequest();
      } catch (e) {
        this.emit("error", new va({ cause: e }));
      }
    }
  }),
  (Jn.exports = _a({ http: pa, https: la })),
  (Vn.wrap = _a);
const Aa = "1.4.0";
function Ta(e) {
  const n = /^([-+\w]{1,25})(:?\/\/|:)/.exec(e);
  return (n && n[1]) || "";
}
const Fa = /^(?:([^;]+);)?(?:[^;]+;)?(base64|),([\s\S]*)$/;
function Pa(e, n) {
  e = e || 10;
  const a = new Array(e),
    t = new Array(e);
  let i,
    o = 0,
    s = 0;
  return (
    (n = void 0 !== n ? n : 1e3),
    function (r) {
      const c = Date.now(),
        p = t[s];
      i || (i = c), (a[o] = r), (t[o] = c);
      let l = s,
        u = 0;
      for (; l !== o; ) (u += a[l++]), (l %= e);
      if (((o = (o + 1) % e), o === s && (s = (s + 1) % e), c - i < n)) return;
      const d = p && c - p;
      return d ? Math.round((1e3 * u) / d) : void 0;
    }
  );
}
const La = Symbol("internals");
class Ba extends n.Transform {
  constructor(e) {
    super({
      readableHighWaterMark: (e = sn.toFlatObject(
        e,
        {
          maxRate: 0,
          chunkSize: 65536,
          minChunkSize: 100,
          timeWindow: 500,
          ticksRate: 2,
          samplesCount: 15,
        },
        null,
        (e, n) => !sn.isUndefined(n[e])
      )).chunkSize,
    });
    const n = this,
      a = (this[La] = {
        length: e.length,
        timeWindow: e.timeWindow,
        ticksRate: e.ticksRate,
        chunkSize: e.chunkSize,
        maxRate: e.maxRate,
        minChunkSize: e.minChunkSize,
        bytesSeen: 0,
        isCaptured: !1,
        notifiedBytesLoaded: 0,
        ts: Date.now(),
        bytes: 0,
        onReadCallback: null,
      }),
      t = Pa(a.ticksRate * e.samplesCount, a.timeWindow);
    this.on("newListener", (e) => {
      "progress" === e && (a.isCaptured || (a.isCaptured = !0));
    });
    let i = 0;
    a.updateProgress = (function (e, n) {
      let a = 0;
      const t = 1e3 / n;
      let i = null;
      return function (n, o) {
        const s = Date.now();
        if (n || s - a > t)
          return i && (clearTimeout(i), (i = null)), (a = s), e.apply(null, o);
        i ||
          (i = setTimeout(
            () => ((i = null), (a = Date.now()), e.apply(null, o)),
            t - (s - a)
          ));
      };
    })(function () {
      const e = a.length,
        o = a.bytesSeen,
        s = o - i;
      if (!s || n.destroyed) return;
      const r = t(s);
      (i = o),
        process.nextTick(() => {
          n.emit("progress", {
            loaded: o,
            total: e,
            progress: e ? o / e : void 0,
            bytes: s,
            rate: r || void 0,
            estimated: r && e && o <= e ? (e - o) / r : void 0,
          });
        });
    }, a.ticksRate);
    const o = () => {
      a.updateProgress(!0);
    };
    this.once("end", o), this.once("error", o);
  }
  _read(e) {
    const n = this[La];
    return n.onReadCallback && n.onReadCallback(), super._read(e);
  }
  _transform(e, n, a) {
    const t = this,
      i = this[La],
      o = i.maxRate,
      s = this.readableHighWaterMark,
      r = i.timeWindow,
      c = o / (1e3 / r),
      p = !1 !== i.minChunkSize ? Math.max(i.minChunkSize, 0.01 * c) : 0;
    const l = (e, n) => {
      const a = Buffer.byteLength(e);
      let l,
        u = null,
        d = s,
        m = 0;
      if (o) {
        const e = Date.now();
        (!i.ts || (m = e - i.ts) >= r) &&
          ((i.ts = e), (l = c - i.bytes), (i.bytes = l < 0 ? -l : 0), (m = 0)),
          (l = c - i.bytes);
      }
      if (o) {
        if (l <= 0)
          return setTimeout(() => {
            n(null, e);
          }, r - m);
        l < d && (d = l);
      }
      d && a > d && a - d > p && ((u = e.subarray(d)), (e = e.subarray(0, d))),
        (function (e, n) {
          const a = Buffer.byteLength(e);
          (i.bytesSeen += a),
            (i.bytes += a),
            i.isCaptured && i.updateProgress(),
            t.push(e)
              ? process.nextTick(n)
              : (i.onReadCallback = () => {
                  (i.onReadCallback = null), process.nextTick(n);
                });
        })(
          e,
          u
            ? () => {
                process.nextTick(n, null, u);
              }
            : n
        );
    };
    l(e, function e(n, t) {
      if (n) return a(n);
      t ? l(t, e) : a(null);
    });
  }
  setLength(e) {
    return (this[La].length = +e), this;
  }
}
var za = Ba;
const { asyncIterator: Na } = Symbol;
var Ua = async function* (e) {
  e.stream
    ? yield* e.stream()
    : e.arrayBuffer
    ? yield await e.arrayBuffer()
    : e[Na]
    ? yield* e[Na]()
    : yield e;
};
const qa = sn.ALPHABET.ALPHA_DIGIT + "-_",
  Da = new e.TextEncoder(),
  Ia = "\r\n",
  Ma = Da.encode(Ia);
class Ha {
  constructor(e, n) {
    const { escapeName: a } = this.constructor,
      t = sn.isString(n);
    let i = `Content-Disposition: form-data; name="${a(e)}"${
      !t && n.name ? `; filename="${a(n.name)}"` : ""
    }${Ia}`;
    t
      ? (n = Da.encode(String(n).replace(/\r?\n|\r\n?/g, Ia)))
      : (i += `Content-Type: ${n.type || "application/octet-stream"}${Ia}`),
      (this.headers = Da.encode(i + Ia)),
      (this.contentLength = t ? n.byteLength : n.size),
      (this.size = this.headers.byteLength + this.contentLength + 2),
      (this.name = e),
      (this.value = n);
  }
  async *encode() {
    yield this.headers;
    const { value: e } = this;
    sn.isTypedArray(e) ? yield e : yield* Ua(e), yield Ma;
  }
  static escapeName(e) {
    return String(e).replace(
      /[\r\n"]/g,
      (e) => ({ "\r": "%0D", "\n": "%0A", '"': "%22" }[e])
    );
  }
}
var $a = (e, a, t) => {
  const {
    tag: i = "form-data-boundary",
    size: o = 25,
    boundary: s = i + "-" + sn.generateString(o, qa),
  } = t || {};
  if (!sn.isFormData(e)) throw TypeError("FormData instance required");
  if (s.length < 1 || s.length > 70)
    throw Error("boundary must be 10-70 characters long");
  const r = Da.encode("--" + s + Ia),
    c = Da.encode("--" + s + "--" + Ia + Ia);
  let p = c.byteLength;
  const l = Array.from(e.entries()).map(([e, n]) => {
    const a = new Ha(e, n);
    return (p += a.size), a;
  });
  (p += r.byteLength * l.length), (p = sn.toFiniteNumber(p));
  const u = { "Content-Type": `multipart/form-data; boundary=${s}` };
  return (
    Number.isFinite(p) && (u["Content-Length"] = p),
    a && a(u),
    n.Readable.from(
      (async function* () {
        for (const e of l) yield r, yield* e.encode();
        yield c;
      })()
    )
  );
};
class Wa extends n.Transform {
  __transform(e, n, a) {
    this.push(e), a();
  }
  _transform(e, n, a) {
    if (
      0 !== e.length &&
      ((this._transform = this.__transform), 120 !== e[0])
    ) {
      const e = Buffer.alloc(2);
      (e[0] = 120), (e[1] = 156), this.push(e, n);
    }
    this.__transform(e, n, a);
  }
}
var Ga = Wa;
var Va = (e, n) =>
  sn.isAsyncFn(e)
    ? function (...a) {
        const t = a.pop();
        e.apply(this, a).then((e) => {
          try {
            n ? t(null, ...n(e)) : t(null, e);
          } catch (e) {
            t(e);
          }
        }, t);
      }
    : e;
const Ja = {
    flush: p.constants.Z_SYNC_FLUSH,
    finishFlush: p.constants.Z_SYNC_FLUSH,
  },
  Ka = {
    flush: p.constants.BROTLI_OPERATION_FLUSH,
    finishFlush: p.constants.BROTLI_OPERATION_FLUSH,
  },
  Qa = sn.isFunction(p.createBrotliDecompress),
  { http: Ya, https: Xa } = Vn,
  Za = /https:?/,
  et = _n.protocols.map((e) => e + ":");
function nt(e) {
  e.beforeRedirects.proxy && e.beforeRedirects.proxy(e),
    e.beforeRedirects.config && e.beforeRedirects.config(e);
}
function at(e, n, a) {
  let t = n;
  if (!t && !1 !== t) {
    const e = Gn(a);
    e && (t = new URL(e));
  }
  if (t) {
    if (
      (t.username && (t.auth = (t.username || "") + ":" + (t.password || "")),
      t.auth)
    ) {
      (t.auth.username || t.auth.password) &&
        (t.auth = (t.auth.username || "") + ":" + (t.auth.password || ""));
      const n = Buffer.from(t.auth, "utf8").toString("base64");
      e.headers["Proxy-Authorization"] = "Basic " + n;
    }
    e.headers.host = e.hostname + (e.port ? ":" + e.port : "");
    const n = t.hostname || t.host;
    (e.hostname = n),
      (e.host = n),
      (e.port = t.port),
      (e.path = a),
      t.protocol &&
        (e.protocol = t.protocol.includes(":") ? t.protocol : `${t.protocol}:`);
  }
  e.beforeRedirects.proxy = function (e) {
    at(e, n, e.href);
  };
}
const tt = "undefined" != typeof process && "process" === sn.kindOf(process);
var it =
    tt &&
    function (a) {
      return (
        (o = async function (o, s, r) {
          let { data: c, lookup: u, family: d } = a;
          const { responseType: m, responseEncoding: f } = a,
            h = a.method.toUpperCase();
          let x,
            v,
            b = !1;
          u &&
            sn.isAsyncFn(u) &&
            (u = Va(u, (e) => {
              if (sn.isString(e)) e = [e, e.indexOf(".") < 0 ? 6 : 4];
              else if (!sn.isArray(e))
                throw new TypeError(
                  "lookup async function must return an array [ip: string, family: number]]"
                );
              return e;
            }));
          const g = new l(),
            y = () => {
              a.cancelToken && a.cancelToken.unsubscribe(w),
                a.signal && a.signal.removeEventListener("abort", w),
                g.removeAllListeners();
            };
          function w(e) {
            g.emit("abort", !e || e.type ? new zn(null, a, v) : e);
          }
          r((e, n) => {
            (x = !0), n && ((b = !0), y());
          }),
            g.once("abort", s),
            (a.cancelToken || a.signal) &&
              (a.cancelToken && a.cancelToken.subscribe(w),
              a.signal &&
                (a.signal.aborted
                  ? w()
                  : a.signal.addEventListener("abort", w)));
          const _ = Un(a.baseURL, a.url),
            k = new URL(_, "http://localhost"),
            j = k.protocol || et[0];
          if ("data:" === j) {
            let e;
            if ("GET" !== h)
              return Nn(o, s, {
                status: 405,
                statusText: "method not allowed",
                headers: {},
                config: a,
              });
            try {
              e = (function (e, n, a) {
                const t = (a && a.Blob) || _n.classes.Blob,
                  i = Ta(e);
                if ((void 0 === n && t && (n = !0), "data" === i)) {
                  e = i.length ? e.slice(i.length + 1) : e;
                  const a = Fa.exec(e);
                  if (!a) throw new rn("Invalid URL", rn.ERR_INVALID_URL);
                  const o = a[1],
                    s = a[2],
                    r = a[3],
                    c = Buffer.from(
                      decodeURIComponent(r),
                      s ? "base64" : "utf8"
                    );
                  if (n) {
                    if (!t)
                      throw new rn("Blob is not supported", rn.ERR_NOT_SUPPORT);
                    return new t([c], { type: o });
                  }
                  return c;
                }
                throw new rn("Unsupported protocol " + i, rn.ERR_NOT_SUPPORT);
              })(a.url, "blob" === m, { Blob: a.env && a.env.Blob });
            } catch (e) {
              throw rn.from(e, rn.ERR_BAD_REQUEST, a);
            }
            return (
              "text" === m
                ? ((e = e.toString(f)),
                  (f && "utf8" !== f) || (e = sn.stripBOM(e)))
                : "stream" === m && (e = n.Readable.from(e)),
              Nn(o, s, {
                data: e,
                status: 200,
                statusText: "OK",
                headers: new Pn(),
                config: a,
              })
            );
          }
          if (-1 === et.indexOf(j))
            return s(
              new rn("Unsupported protocol " + j, rn.ERR_BAD_REQUEST, a)
            );
          const E = Pn.from(a.headers).normalize();
          E.set("User-Agent", "axios/" + Aa, !1);
          const R = a.onDownloadProgress,
            C = a.onUploadProgress,
            S = a.maxRate;
          let O, A;
          if (sn.isSpecCompliantForm(c)) {
            const e = E.getContentType(/boundary=([-_\w\d]{10,70})/i);
            c = $a(
              c,
              (e) => {
                E.set(e);
              },
              { tag: `axios-${Aa}-boundary`, boundary: (e && e[1]) || void 0 }
            );
          } else if (sn.isFormData(c) && sn.isFunction(c.getHeaders)) {
            if ((E.set(c.getHeaders()), !E.hasContentLength()))
              try {
                const n = await e.promisify(c.getLength).call(c);
                Number.isFinite(n) && n >= 0 && E.setContentLength(n);
              } catch (e) {}
          } else if (sn.isBlob(c))
            c.size && E.setContentType(c.type || "application/octet-stream"),
              E.setContentLength(c.size || 0),
              (c = n.Readable.from(Ua(c)));
          else if (c && !sn.isStream(c)) {
            if (Buffer.isBuffer(c));
            else if (sn.isArrayBuffer(c)) c = Buffer.from(new Uint8Array(c));
            else {
              if (!sn.isString(c))
                return s(
                  new rn(
                    "Data after transformation must be a string, an ArrayBuffer, a Buffer, or a Stream",
                    rn.ERR_BAD_REQUEST,
                    a
                  )
                );
              c = Buffer.from(c, "utf-8");
            }
            if (
              (E.setContentLength(c.length, !1),
              a.maxBodyLength > -1 && c.length > a.maxBodyLength)
            )
              return s(
                new rn(
                  "Request body larger than maxBodyLength limit",
                  rn.ERR_BAD_REQUEST,
                  a
                )
              );
          }
          const T = sn.toFiniteNumber(E.getContentLength());
          let F, P;
          sn.isArray(S) ? ((O = S[0]), (A = S[1])) : (O = A = S),
            c &&
              (C || O) &&
              (sn.isStream(c) || (c = n.Readable.from(c, { objectMode: !1 })),
              (c = n.pipeline(
                [c, new za({ length: T, maxRate: sn.toFiniteNumber(O) })],
                sn.noop
              )),
              C &&
                c.on("progress", (e) => {
                  C(Object.assign(e, { upload: !0 }));
                })),
            a.auth &&
              (F = (a.auth.username || "") + ":" + (a.auth.password || "")),
            !F && k.username && (F = k.username + ":" + k.password),
            F && E.delete("authorization");
          try {
            P = gn(k.pathname + k.search, a.params, a.paramsSerializer).replace(
              /^\?/,
              ""
            );
          } catch (e) {
            const n = new Error(e.message);
            return (n.config = a), (n.url = a.url), (n.exists = !0), s(n);
          }
          E.set(
            "Accept-Encoding",
            "gzip, compress, deflate" + (Qa ? ", br" : ""),
            !1
          );
          const L = {
            path: P,
            method: h,
            headers: E.toJSON(),
            agents: { http: a.httpAgent, https: a.httpsAgent },
            auth: F,
            protocol: j,
            family: d,
            lookup: u,
            beforeRedirect: nt,
            beforeRedirects: {},
          };
          let B;
          a.socketPath
            ? (L.socketPath = a.socketPath)
            : ((L.hostname = k.hostname),
              (L.port = k.port),
              at(
                L,
                a.proxy,
                j + "//" + k.hostname + (k.port ? ":" + k.port : "") + L.path
              ));
          const z = Za.test(L.protocol);
          if (
            ((L.agent = z ? a.httpsAgent : a.httpAgent),
            a.transport
              ? (B = a.transport)
              : 0 === a.maxRedirects
              ? (B = z ? i : t)
              : (a.maxRedirects && (L.maxRedirects = a.maxRedirects),
                a.beforeRedirect &&
                  (L.beforeRedirects.config = a.beforeRedirect),
                (B = z ? Xa : Ya)),
            a.maxBodyLength > -1
              ? (L.maxBodyLength = a.maxBodyLength)
              : (L.maxBodyLength = 1 / 0),
            a.insecureHTTPParser &&
              (L.insecureHTTPParser = a.insecureHTTPParser),
            (v = B.request(L, function (e) {
              if (v.destroyed) return;
              const t = [e],
                i = +e.headers["content-length"];
              if (R) {
                const e = new za({
                  length: sn.toFiniteNumber(i),
                  maxRate: sn.toFiniteNumber(A),
                });
                R &&
                  e.on("progress", (e) => {
                    R(Object.assign(e, { download: !0 }));
                  }),
                  t.push(e);
              }
              let r = e;
              const c = e.req || v;
              if (!1 !== a.decompress && e.headers["content-encoding"])
                switch (
                  (("HEAD" !== h && 204 !== e.statusCode) ||
                    delete e.headers["content-encoding"],
                  e.headers["content-encoding"])
                ) {
                  case "gzip":
                  case "x-gzip":
                  case "compress":
                  case "x-compress":
                    t.push(p.createUnzip(Ja)),
                      delete e.headers["content-encoding"];
                    break;
                  case "deflate":
                    t.push(new Ga()),
                      t.push(p.createUnzip(Ja)),
                      delete e.headers["content-encoding"];
                    break;
                  case "br":
                    Qa &&
                      (t.push(p.createBrotliDecompress(Ka)),
                      delete e.headers["content-encoding"]);
                }
              r = t.length > 1 ? n.pipeline(t, sn.noop) : t[0];
              const l = n.finished(r, () => {
                  l(), y();
                }),
                u = {
                  status: e.statusCode,
                  statusText: e.statusMessage,
                  headers: new Pn(e.headers),
                  config: a,
                  request: c,
                };
              if ("stream" === m) (u.data = r), Nn(o, s, u);
              else {
                const e = [];
                let n = 0;
                r.on("data", function (t) {
                  e.push(t),
                    (n += t.length),
                    a.maxContentLength > -1 &&
                      n > a.maxContentLength &&
                      ((b = !0),
                      r.destroy(),
                      s(
                        new rn(
                          "maxContentLength size of " +
                            a.maxContentLength +
                            " exceeded",
                          rn.ERR_BAD_RESPONSE,
                          a,
                          c
                        )
                      ));
                }),
                  r.on("aborted", function () {
                    if (b) return;
                    const e = new rn(
                      "maxContentLength size of " +
                        a.maxContentLength +
                        " exceeded",
                      rn.ERR_BAD_RESPONSE,
                      a,
                      c
                    );
                    r.destroy(e), s(e);
                  }),
                  r.on("error", function (e) {
                    v.destroyed || s(rn.from(e, null, a, c));
                  }),
                  r.on("end", function () {
                    try {
                      let n = 1 === e.length ? e[0] : Buffer.concat(e);
                      "arraybuffer" !== m &&
                        ((n = n.toString(f)),
                        (f && "utf8" !== f) || (n = sn.stripBOM(n))),
                        (u.data = n);
                    } catch (e) {
                      s(rn.from(e, null, a, u.request, u));
                    }
                    Nn(o, s, u);
                  });
              }
              g.once("abort", (e) => {
                r.destroyed || (r.emit("error", e), r.destroy());
              });
            })),
            g.once("abort", (e) => {
              s(e), v.destroy(e);
            }),
            v.on("error", function (e) {
              s(rn.from(e, null, a, v));
            }),
            v.on("socket", function (e) {
              e.setKeepAlive(!0, 6e4);
            }),
            a.timeout)
          ) {
            const e = parseInt(a.timeout, 10);
            if (isNaN(e))
              return void s(
                new rn(
                  "error trying to parse `config.timeout` to int",
                  rn.ERR_BAD_OPTION_VALUE,
                  a,
                  v
                )
              );
            v.setTimeout(e, function () {
              if (x) return;
              let e = a.timeout
                ? "timeout of " + a.timeout + "ms exceeded"
                : "timeout exceeded";
              const n = a.transitional || wn;
              a.timeoutErrorMessage && (e = a.timeoutErrorMessage),
                s(
                  new rn(
                    e,
                    n.clarifyTimeoutError ? rn.ETIMEDOUT : rn.ECONNABORTED,
                    a,
                    v
                  )
                ),
                w();
            });
          }
          if (sn.isStream(c)) {
            let e = !1,
              n = !1;
            c.on("end", () => {
              e = !0;
            }),
              c.once("error", (e) => {
                (n = !0), v.destroy(e);
              }),
              c.on("close", () => {
                e || n || w(new zn("Request stream has been aborted", a, v));
              }),
              c.pipe(v);
          } else v.end(c);
        }),
        new Promise((e, n) => {
          let a, t;
          const i = (e, n) => {
              t || ((t = !0), a && a(e, n));
            },
            s = (e) => {
              i(e, !0), n(e);
            };
          o(
            (n) => {
              i(n), e(n);
            },
            s,
            (e) => (a = e)
          ).catch(s);
        })
      );
      var o;
    },
  ot = _n.isStandardBrowserEnv
    ? {
        write: function (e, n, a, t, i, o) {
          const s = [];
          s.push(e + "=" + encodeURIComponent(n)),
            sn.isNumber(a) && s.push("expires=" + new Date(a).toGMTString()),
            sn.isString(t) && s.push("path=" + t),
            sn.isString(i) && s.push("domain=" + i),
            !0 === o && s.push("secure"),
            (document.cookie = s.join("; "));
        },
        read: function (e) {
          const n = document.cookie.match(
            new RegExp("(^|;\\s*)(" + e + ")=([^;]*)")
          );
          return n ? decodeURIComponent(n[3]) : null;
        },
        remove: function (e) {
          this.write(e, "", Date.now() - 864e5);
        },
      }
    : {
        write: function () {},
        read: function () {
          return null;
        },
        remove: function () {},
      },
  st = _n.isStandardBrowserEnv
    ? (function () {
        const e = /(msie|trident)/i.test(navigator.userAgent),
          n = document.createElement("a");
        let a;
        function t(a) {
          let t = a;
          return (
            e && (n.setAttribute("href", t), (t = n.href)),
            n.setAttribute("href", t),
            {
              href: n.href,
              protocol: n.protocol ? n.protocol.replace(/:$/, "") : "",
              host: n.host,
              search: n.search ? n.search.replace(/^\?/, "") : "",
              hash: n.hash ? n.hash.replace(/^#/, "") : "",
              hostname: n.hostname,
              port: n.port,
              pathname:
                "/" === n.pathname.charAt(0) ? n.pathname : "/" + n.pathname,
            }
          );
        }
        return (
          (a = t(window.location.href)),
          function (e) {
            const n = sn.isString(e) ? t(e) : e;
            return n.protocol === a.protocol && n.host === a.host;
          }
        );
      })()
    : function () {
        return !0;
      };
function rt(e, n) {
  let a = 0;
  const t = Pa(50, 250);
  return (i) => {
    const o = i.loaded,
      s = i.lengthComputable ? i.total : void 0,
      r = o - a,
      c = t(r);
    a = o;
    const p = {
      loaded: o,
      total: s,
      progress: s ? o / s : void 0,
      bytes: r,
      rate: c || void 0,
      estimated: c && s && o <= s ? (s - o) / c : void 0,
      event: i,
    };
    (p[n ? "download" : "upload"] = !0), e(p);
  };
}
const ct = {
  http: it,
  xhr:
    "undefined" != typeof XMLHttpRequest &&
    function (e) {
      return new Promise(function (n, a) {
        let t = e.data;
        const i = Pn.from(e.headers).normalize(),
          o = e.responseType;
        let s;
        function r() {
          e.cancelToken && e.cancelToken.unsubscribe(s),
            e.signal && e.signal.removeEventListener("abort", s);
        }
        sn.isFormData(t) &&
          (_n.isStandardBrowserEnv || _n.isStandardBrowserWebWorkerEnv
            ? i.setContentType(!1)
            : i.setContentType("multipart/form-data;", !1));
        let c = new XMLHttpRequest();
        if (e.auth) {
          const n = e.auth.username || "",
            a = e.auth.password
              ? unescape(encodeURIComponent(e.auth.password))
              : "";
          i.set("Authorization", "Basic " + btoa(n + ":" + a));
        }
        const p = Un(e.baseURL, e.url);
        function l() {
          if (!c) return;
          const t = Pn.from(
            "getAllResponseHeaders" in c && c.getAllResponseHeaders()
          );
          Nn(
            function (e) {
              n(e), r();
            },
            function (e) {
              a(e), r();
            },
            {
              data:
                o && "text" !== o && "json" !== o ? c.response : c.responseText,
              status: c.status,
              statusText: c.statusText,
              headers: t,
              config: e,
              request: c,
            }
          ),
            (c = null);
        }
        if (
          (c.open(
            e.method.toUpperCase(),
            gn(p, e.params, e.paramsSerializer),
            !0
          ),
          (c.timeout = e.timeout),
          "onloadend" in c
            ? (c.onloadend = l)
            : (c.onreadystatechange = function () {
                c &&
                  4 === c.readyState &&
                  (0 !== c.status ||
                    (c.responseURL && 0 === c.responseURL.indexOf("file:"))) &&
                  setTimeout(l);
              }),
          (c.onabort = function () {
            c &&
              (a(new rn("Request aborted", rn.ECONNABORTED, e, c)), (c = null));
          }),
          (c.onerror = function () {
            a(new rn("Network Error", rn.ERR_NETWORK, e, c)), (c = null);
          }),
          (c.ontimeout = function () {
            let n = e.timeout
              ? "timeout of " + e.timeout + "ms exceeded"
              : "timeout exceeded";
            const t = e.transitional || wn;
            e.timeoutErrorMessage && (n = e.timeoutErrorMessage),
              a(
                new rn(
                  n,
                  t.clarifyTimeoutError ? rn.ETIMEDOUT : rn.ECONNABORTED,
                  e,
                  c
                )
              ),
              (c = null);
          }),
          _n.isStandardBrowserEnv)
        ) {
          const n =
            (e.withCredentials || st(p)) &&
            e.xsrfCookieName &&
            ot.read(e.xsrfCookieName);
          n && i.set(e.xsrfHeaderName, n);
        }
        void 0 === t && i.setContentType(null),
          "setRequestHeader" in c &&
            sn.forEach(i.toJSON(), function (e, n) {
              c.setRequestHeader(n, e);
            }),
          sn.isUndefined(e.withCredentials) ||
            (c.withCredentials = !!e.withCredentials),
          o && "json" !== o && (c.responseType = e.responseType),
          "function" == typeof e.onDownloadProgress &&
            c.addEventListener("progress", rt(e.onDownloadProgress, !0)),
          "function" == typeof e.onUploadProgress &&
            c.upload &&
            c.upload.addEventListener("progress", rt(e.onUploadProgress)),
          (e.cancelToken || e.signal) &&
            ((s = (n) => {
              c &&
                (a(!n || n.type ? new zn(null, e, c) : n),
                c.abort(),
                (c = null));
            }),
            e.cancelToken && e.cancelToken.subscribe(s),
            e.signal &&
              (e.signal.aborted ? s() : e.signal.addEventListener("abort", s)));
        const u = Ta(p);
        u && -1 === _n.protocols.indexOf(u)
          ? a(new rn("Unsupported protocol " + u + ":", rn.ERR_BAD_REQUEST, e))
          : c.send(t || null);
      });
    },
};
sn.forEach(ct, (e, n) => {
  if (e) {
    try {
      Object.defineProperty(e, "name", { value: n });
    } catch (e) {}
    Object.defineProperty(e, "adapterName", { value: n });
  }
});
var pt = (e) => {
  e = sn.isArray(e) ? e : [e];
  const { length: n } = e;
  let a, t;
  for (
    let i = 0;
    i < n && ((a = e[i]), !(t = sn.isString(a) ? ct[a.toLowerCase()] : a));
    i++
  );
  if (!t) {
    if (!1 === t)
      throw new rn(
        `Adapter ${a} is not supported by the environment`,
        "ERR_NOT_SUPPORT"
      );
    throw new Error(
      sn.hasOwnProp(ct, a)
        ? `Adapter '${a}' is not available in the build`
        : `Unknown adapter '${a}'`
    );
  }
  if (!sn.isFunction(t)) throw new TypeError("adapter is not a function");
  return t;
};
function lt(e) {
  if (
    (e.cancelToken && e.cancelToken.throwIfRequested(),
    e.signal && e.signal.aborted)
  )
    throw new zn(null, e);
}
function ut(e) {
  lt(e),
    (e.headers = Pn.from(e.headers)),
    (e.data = Ln.call(e, e.transformRequest)),
    -1 !== ["post", "put", "patch"].indexOf(e.method) &&
      e.headers.setContentType("application/x-www-form-urlencoded", !1);
  return pt(e.adapter || Rn.adapter)(e).then(
    function (n) {
      return (
        lt(e),
        (n.data = Ln.call(e, e.transformResponse, n)),
        (n.headers = Pn.from(n.headers)),
        n
      );
    },
    function (n) {
      return (
        Bn(n) ||
          (lt(e),
          n &&
            n.response &&
            ((n.response.data = Ln.call(e, e.transformResponse, n.response)),
            (n.response.headers = Pn.from(n.response.headers)))),
        Promise.reject(n)
      );
    }
  );
}
const dt = (e) => (e instanceof Pn ? e.toJSON() : e);
function mt(e, n) {
  n = n || {};
  const a = {};
  function t(e, n, a) {
    return sn.isPlainObject(e) && sn.isPlainObject(n)
      ? sn.merge.call({ caseless: a }, e, n)
      : sn.isPlainObject(n)
      ? sn.merge({}, n)
      : sn.isArray(n)
      ? n.slice()
      : n;
  }
  function i(e, n, a) {
    return sn.isUndefined(n)
      ? sn.isUndefined(e)
        ? void 0
        : t(void 0, e, a)
      : t(e, n, a);
  }
  function o(e, n) {
    if (!sn.isUndefined(n)) return t(void 0, n);
  }
  function s(e, n) {
    return sn.isUndefined(n)
      ? sn.isUndefined(e)
        ? void 0
        : t(void 0, e)
      : t(void 0, n);
  }
  function r(a, i, o) {
    return o in n ? t(a, i) : o in e ? t(void 0, a) : void 0;
  }
  const c = {
    url: o,
    method: o,
    data: o,
    baseURL: s,
    transformRequest: s,
    transformResponse: s,
    paramsSerializer: s,
    timeout: s,
    timeoutMessage: s,
    withCredentials: s,
    adapter: s,
    responseType: s,
    xsrfCookieName: s,
    xsrfHeaderName: s,
    onUploadProgress: s,
    onDownloadProgress: s,
    decompress: s,
    maxContentLength: s,
    maxBodyLength: s,
    beforeRedirect: s,
    transport: s,
    httpAgent: s,
    httpsAgent: s,
    cancelToken: s,
    socketPath: s,
    responseEncoding: s,
    validateStatus: r,
    headers: (e, n) => i(dt(e), dt(n), !0),
  };
  return (
    sn.forEach(Object.keys(Object.assign({}, e, n)), function (t) {
      const o = c[t] || i,
        s = o(e[t], n[t], t);
      (sn.isUndefined(s) && o !== r) || (a[t] = s);
    }),
    a
  );
}
const ft = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach(
  (e, n) => {
    ft[e] = function (a) {
      return typeof a === e || "a" + (n < 1 ? "n " : " ") + e;
    };
  }
);
const ht = {};
ft.transitional = function (e, n, a) {
  function t(e, n) {
    return (
      "[Axios v1.4.0] Transitional option '" + e + "'" + n + (a ? ". " + a : "")
    );
  }
  return (a, i, o) => {
    if (!1 === e)
      throw new rn(
        t(i, " has been removed" + (n ? " in " + n : "")),
        rn.ERR_DEPRECATED
      );
    return (
      n &&
        !ht[i] &&
        ((ht[i] = !0),
        console.warn(
          t(
            i,
            " has been deprecated since v" +
              n +
              " and will be removed in the near future"
          )
        )),
      !e || e(a, i, o)
    );
  };
};
var xt = {
  assertOptions: function (e, n, a) {
    if ("object" != typeof e)
      throw new rn("options must be an object", rn.ERR_BAD_OPTION_VALUE);
    const t = Object.keys(e);
    let i = t.length;
    for (; i-- > 0; ) {
      const o = t[i],
        s = n[o];
      if (s) {
        const n = e[o],
          a = void 0 === n || s(n, o, e);
        if (!0 !== a)
          throw new rn(
            "option " + o + " must be " + a,
            rn.ERR_BAD_OPTION_VALUE
          );
      } else if (!0 !== a)
        throw new rn("Unknown option " + o, rn.ERR_BAD_OPTION);
    }
  },
  validators: ft,
};
const vt = xt.validators;
class bt {
  constructor(e) {
    (this.defaults = e),
      (this.interceptors = { request: new yn(), response: new yn() });
  }
  request(e, n) {
    "string" == typeof e ? ((n = n || {}).url = e) : (n = e || {}),
      (n = mt(this.defaults, n));
    const { transitional: a, paramsSerializer: t, headers: i } = n;
    let o;
    void 0 !== a &&
      xt.assertOptions(
        a,
        {
          silentJSONParsing: vt.transitional(vt.boolean),
          forcedJSONParsing: vt.transitional(vt.boolean),
          clarifyTimeoutError: vt.transitional(vt.boolean),
        },
        !1
      ),
      null != t &&
        (sn.isFunction(t)
          ? (n.paramsSerializer = { serialize: t })
          : xt.assertOptions(
              t,
              { encode: vt.function, serialize: vt.function },
              !0
            )),
      (n.method = (n.method || this.defaults.method || "get").toLowerCase()),
      (o = i && sn.merge(i.common, i[n.method])),
      o &&
        sn.forEach(
          ["delete", "get", "head", "post", "put", "patch", "common"],
          (e) => {
            delete i[e];
          }
        ),
      (n.headers = Pn.concat(o, i));
    const s = [];
    let r = !0;
    this.interceptors.request.forEach(function (e) {
      ("function" == typeof e.runWhen && !1 === e.runWhen(n)) ||
        ((r = r && e.synchronous), s.unshift(e.fulfilled, e.rejected));
    });
    const c = [];
    let p;
    this.interceptors.response.forEach(function (e) {
      c.push(e.fulfilled, e.rejected);
    });
    let l,
      u = 0;
    if (!r) {
      const e = [ut.bind(this), void 0];
      for (
        e.unshift.apply(e, s),
          e.push.apply(e, c),
          l = e.length,
          p = Promise.resolve(n);
        u < l;

      )
        p = p.then(e[u++], e[u++]);
      return p;
    }
    l = s.length;
    let d = n;
    for (u = 0; u < l; ) {
      const e = s[u++],
        n = s[u++];
      try {
        d = e(d);
      } catch (e) {
        n.call(this, e);
        break;
      }
    }
    try {
      p = ut.call(this, d);
    } catch (e) {
      return Promise.reject(e);
    }
    for (u = 0, l = c.length; u < l; ) p = p.then(c[u++], c[u++]);
    return p;
  }
  getUri(e) {
    return gn(
      Un((e = mt(this.defaults, e)).baseURL, e.url),
      e.params,
      e.paramsSerializer
    );
  }
}
sn.forEach(["delete", "get", "head", "options"], function (e) {
  bt.prototype[e] = function (n, a) {
    return this.request(
      mt(a || {}, { method: e, url: n, data: (a || {}).data })
    );
  };
}),
  sn.forEach(["post", "put", "patch"], function (e) {
    function n(n) {
      return function (a, t, i) {
        return this.request(
          mt(i || {}, {
            method: e,
            headers: n ? { "Content-Type": "multipart/form-data" } : {},
            url: a,
            data: t,
          })
        );
      };
    }
    (bt.prototype[e] = n()), (bt.prototype[e + "Form"] = n(!0));
  });
var gt = bt;
class yt {
  constructor(e) {
    if ("function" != typeof e)
      throw new TypeError("executor must be a function.");
    let n;
    this.promise = new Promise(function (e) {
      n = e;
    });
    const a = this;
    this.promise.then((e) => {
      if (!a._listeners) return;
      let n = a._listeners.length;
      for (; n-- > 0; ) a._listeners[n](e);
      a._listeners = null;
    }),
      (this.promise.then = (e) => {
        let n;
        const t = new Promise((e) => {
          a.subscribe(e), (n = e);
        }).then(e);
        return (
          (t.cancel = function () {
            a.unsubscribe(n);
          }),
          t
        );
      }),
      e(function (e, t, i) {
        a.reason || ((a.reason = new zn(e, t, i)), n(a.reason));
      });
  }
  throwIfRequested() {
    if (this.reason) throw this.reason;
  }
  subscribe(e) {
    this.reason
      ? e(this.reason)
      : this._listeners
      ? this._listeners.push(e)
      : (this._listeners = [e]);
  }
  unsubscribe(e) {
    if (!this._listeners) return;
    const n = this._listeners.indexOf(e);
    -1 !== n && this._listeners.splice(n, 1);
  }
  static source() {
    let e;
    return {
      token: new yt(function (n) {
        e = n;
      }),
      cancel: e,
    };
  }
}
var wt = yt;
const _t = {
  Continue: 100,
  SwitchingProtocols: 101,
  Processing: 102,
  EarlyHints: 103,
  Ok: 200,
  Created: 201,
  Accepted: 202,
  NonAuthoritativeInformation: 203,
  NoContent: 204,
  ResetContent: 205,
  PartialContent: 206,
  MultiStatus: 207,
  AlreadyReported: 208,
  ImUsed: 226,
  MultipleChoices: 300,
  MovedPermanently: 301,
  Found: 302,
  SeeOther: 303,
  NotModified: 304,
  UseProxy: 305,
  Unused: 306,
  TemporaryRedirect: 307,
  PermanentRedirect: 308,
  BadRequest: 400,
  Unauthorized: 401,
  PaymentRequired: 402,
  Forbidden: 403,
  NotFound: 404,
  MethodNotAllowed: 405,
  NotAcceptable: 406,
  ProxyAuthenticationRequired: 407,
  RequestTimeout: 408,
  Conflict: 409,
  Gone: 410,
  LengthRequired: 411,
  PreconditionFailed: 412,
  PayloadTooLarge: 413,
  UriTooLong: 414,
  UnsupportedMediaType: 415,
  RangeNotSatisfiable: 416,
  ExpectationFailed: 417,
  ImATeapot: 418,
  MisdirectedRequest: 421,
  UnprocessableEntity: 422,
  Locked: 423,
  FailedDependency: 424,
  TooEarly: 425,
  UpgradeRequired: 426,
  PreconditionRequired: 428,
  TooManyRequests: 429,
  RequestHeaderFieldsTooLarge: 431,
  UnavailableForLegalReasons: 451,
  InternalServerError: 500,
  NotImplemented: 501,
  BadGateway: 502,
  ServiceUnavailable: 503,
  GatewayTimeout: 504,
  HttpVersionNotSupported: 505,
  VariantAlsoNegotiates: 506,
  InsufficientStorage: 507,
  LoopDetected: 508,
  NotExtended: 510,
  NetworkAuthenticationRequired: 511,
};
Object.entries(_t).forEach(([e, n]) => {
  _t[n] = e;
});
var kt = _t;
const jt = (function e(n) {
  const a = new gt(n),
    t = Ee(gt.prototype.request, a);
  return (
    sn.extend(t, gt.prototype, a, { allOwnKeys: !0 }),
    sn.extend(t, a, null, { allOwnKeys: !0 }),
    (t.create = function (a) {
      return e(mt(n, a));
    }),
    t
  );
})(Rn);
(jt.Axios = gt),
  (jt.CanceledError = zn),
  (jt.CancelToken = wt),
  (jt.isCancel = Bn),
  (jt.VERSION = Aa),
  (jt.toFormData = fn),
  (jt.AxiosError = rn),
  (jt.Cancel = jt.CanceledError),
  (jt.all = function (e) {
    return Promise.all(e);
  }),
  (jt.spread = function (e) {
    return function (n) {
      return e.apply(null, n);
    };
  }),
  (jt.isAxiosError = function (e) {
    return sn.isObject(e) && !0 === e.isAxiosError;
  }),
  (jt.mergeConfig = mt),
  (jt.AxiosHeaders = Pn),
  (jt.formToJSON = (e) => kn(sn.isHTMLForm(e) ? new FormData(e) : e)),
  (jt.HttpStatusCode = kt),
  (jt.default = jt);
var Et = jt;
class Rt extends m.BasePath {
  async run(e, n, a) {
    const t = { url: a.url, method: e, headers: n };
    a.requestBody && (t.data = a.requestBody),
      a.queryParams && (t.params = a.queryParams);
    return (await Et(t)).data;
  }
}
const Ct = "https://api.stripe.com/v1";
function St(e, n) {
  return {
    previous: "",
    current: n,
    next: e.has_more ? e.data[e.data.length - 1].id : "",
  };
}
function Ot(e) {
  return new Date(Number(e)).toISOString();
}
function At(e) {
  return new Date(e).getTime() / 1e3;
}
function Tt(e) {
  const n = e.type;
  return { type: e.type, details: e[n] };
}
function Ft(e) {
  return {
    id: e.id,
    amount: e.amount,
    amount_refunded: e.amount_refunded,
    application: e.application,
    application_fee_amount: e.application_fee_amount,
    billing_details:
      ((a = e.billing_details),
      {
        address: {
          city: a.address.city,
          country: a.address.country,
          line1: a.address.line1,
          line2: a.address.line2,
          postal_code: a.address.postal_code,
          state: a.address.state,
        },
        email: a.email,
        name: a.name,
        phone: a.phone,
      }),
    captured: e.captured,
    created_at: Ot(e.created),
    currency: e.currency,
    description: e.description,
    disputed: e.disputed,
    failure_code: e.failure_code,
    failure_message: e.failure_message,
    invoice: e.invoice,
    metadata: e.metadata,
    outcome:
      ((n = e.outcome),
      {
        network_status: n.network_status,
        reason: n.reason,
        risk_level: n.risk_level,
        seller_message: n.seller_message,
        type: n.type,
      }),
    paid: e.paid,
    payment_method: Tt(e.payment_method_details),
    email: e.receipt_email,
    contact: e.receipt_number,
    status: e.status,
    raw: e,
  };
  var n, a;
}
class Pt extends m.BasePath {
  async fetchSingleCharge(e, n) {
    return { data: Ft((await Et({ url: e, headers: n })).data) };
  }
  async run(e, n, a, t) {
    const i = `${Ct}/charges/${a.pathParams?.charge_id}`;
    return this.fetchSingleCharge(i, n);
  }
}
class Lt extends m.BasePath {
  async fetchCharges(e, n, a) {
    const t = At(a.queryParams.created_after),
      i = {
        limit: a.queryParams?.limit,
        ...(a.queryParams.cursor
          ? { starting_after: a.queryParams.cursor }
          : {}),
        ...(a.queryParams.created_after ? { "created[gt]": t } : {}),
      },
      o = await Et({ url: e, headers: n, params: i });
    return {
      data: o.data.data.map((e) => Ft(e)),
      meta: St(o.data, a.queryParams.cursor),
    };
  }
  async run(e, n, a, t) {
    const i = `${Ct}/charges`;
    return this.fetchCharges(i, n, a);
  }
}
function Bt(e) {
  return {
    access_activity_log: e.evidence.access_activity_log,
    billing_address: e.evidence.billing_address,
    cancellation_policy: e.evidence.cancellation_policy,
    cancellation_policy_disclosure: e.evidence.cancellation_policy_disclosure,
    cancellation_rebuttal: e.evidence.cancellation_rebuttal,
    customer_communication: e.evidence.customer_communication,
    customer_email_address: e.evidence.customer_email_address,
    customer_name: e.evidence.customer_name,
    customer_purchase_ip: e.evidence.customer_purchase_ip,
    customer_signature: e.evidence.customer_signature,
    duplicate_charge_documentation: e.evidence.duplicate_charge_documentation,
    duplicate_charge_explanation: e.evidence.duplicate_charge_explanation,
    duplicate_charge_id: e.evidence.duplicate_charge_id,
    product_description: e.evidence.product_description,
    receipt: e.evidence.receipt,
    refund_policy: e.evidence.refund_policy,
    refund_policy_disclosure: e.evidence.refund_policy_disclosure,
    refund_refusal_explanation: e.evidence.refund_refusal_explanation,
    service_date: e.evidence.service_date,
    service_documentation: e.evidence.service_documentation,
    shipping_address: e.evidence.shipping_address,
    shipping_carrier: e.evidence.shipping_carrier,
    shipping_date: e.evidence.shipping_date,
    shipping_documentation: e.evidence.shipping_documentation,
    shipping_tracking_number: e.evidence.shipping_tracking_number,
    uncategorized_file: e.evidence.uncategorized_file,
    uncategorized_text: e.evidence.uncategorized_text,
    due_by: Ot(e.evidence_details.due_by),
    has_evidence: e.evidence_details.has_evidence,
    past_due: e.evidence_details.past_due,
    submission_count: e.evidence_details.submission_count,
  };
}
function zt(e) {
  return {
    id: e.id,
    amount: e.amount,
    charge_id: e.charge,
    currency: e.currency,
    evidence: Bt(e),
    status: e.status,
    priority: e.priority,
    reason: e.reason,
    created_at: Ot(e.created),
    is_charge_refundable: e.is_charge_refundable,
    raw: e,
  };
}
class Nt extends m.BasePath {
  async fetchSingleDispute(e, n, a) {
    return { data: zt((await Et({ url: e, headers: n })).data) };
  }
  async run(e, n, a, t) {
    let i = `${Ct}/disputes/${a.pathParams.dispute_id}`;
    if ("GET" === e) return this.fetchSingleDispute(i, n, a);
    throw new Error("Method not found");
  }
}
class Ut extends m.BasePath {
  async getDisputes(e, n, a) {
    const t = At(a.queryParams.created_after),
      i = {
        limit: a.queryParams?.limit,
        ...(a.queryParams.cursor
          ? { starting_after: a.queryParams.cursor }
          : {}),
        ...(a.queryParams.created_after ? { "created[gt]": t } : {}),
      },
      o = await Et({ url: e, headers: n, params: i });
    return {
      data: o.data.data.map((e) => zt(e)),
      meta: St(o.data, a.queryParams.cursor),
    };
  }
  async run(e, n, a, t) {
    let i = `${Ct}/disputes`;
    if ("GET" === e) return this.getDisputes(i, n, a);
    throw new Error("Method not found");
  }
}
var qt = {
  auth_specification: {
    "Api Key": {
      input_specification: {
        type: "object",
        properties: {
          api_key: {
            type: "string",
            title: "Api Key",
            description: "Enter the API Key",
          },
        },
      },
      headers: { Authorization: "Bearer ${api_key}" },
    },
  },
};
class Dt extends m.BaseIntegration {
  async spec() {
    return qt;
  }
  async check(e) {
    try {
      const n = await this.authHeaders(e);
      return (
        await Et({ url: "https://api.stripe.com/v1/customers", headers: n }),
        { status: !0, error: "" }
      );
    } catch (e) {
      return { status: !1, error: e.message };
    }
  }
  paths() {
    return [
      new Rt(/^\/?proxy$/g, ["GET", "POST", "PATCH", "DELETE"]),
      new Lt(/^\/?charges$/g, "GET"),
      new Pt(/^\/?charges+/g, "GET"),
      new Ut(/^\/?disputes$/g, "GET"),
      new Nt(/^\/?disputes+/g, "GET"),
    ];
  }
}
async function It(e, n) {
  const a = new Dt();
  return await a.runCommand(e, n);
}
(exports.default = It), (exports.main = It);
//# sourceMappingURL=index.js.map
