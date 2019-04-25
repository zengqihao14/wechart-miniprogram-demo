import SVGAVideoEntity from './videoEntity'

export default class Parser {

  constructor(worker, dbClass) {
    if (dbClass && Parser.database === undefined) {
      this.database = new dbClass();
    }
  }

  loadFile(data, callback) {
    let arrayBuffer = wx.base64ToArrayBuffer(data);
    let uintArray = new Uint8Array(arrayBuffer);
    lib.zip.createReader(new lib.zip.UInt8Reader(uintArray), (zipReader) => {
      zipReader.getEntries((entries) => {
        let files = {};
        this.readFiles(files, entries, () => {
          if (files["movie.spec"] === undefined) {
            console.error("invalid svga file [missing movie.spec].");
            return;
          }
          let videoItem = new SVGAVideoEntity(JSON.parse(lib.Base64.decode(files["movie.spec"])), files);
          callback(videoItem);
        });
      });
    }, (err) => {
      console.error(err);
    });
  }

  load(url, callback) {
    wx.request({
      url: url,
      success: (res) => {
        let arrayBuffer = wx.base64ToArrayBuffer(res.data);
        let uintArray = new Uint8Array(arrayBuffer);
        lib.zip.createReader(new lib.zip.UInt8Reader(uintArray), (zipReader) => {
          zipReader.getEntries((entries) => {
            let files = {};
            this.readFiles(files, entries, () => {
              if (files["movie.spec"] === undefined) {
                console.error("invalid svga file [missing movie.spec].");
                return;
              }
              let videoItem = new SVGAVideoEntity(JSON.parse(lib.Base64.decode(files["movie.spec"])), files);
              callback(videoItem);
            });
          });
        }, (err) => {
          console.error(err);
        });
      }
    })
  }

  readFiles(files, entries, callback) {
    let count = entries.length;
    let current = 0;
    entries.forEach(entry => {
      let writer = new lib.zip.UInt8Writer();
      entry.getData(writer, (uint8Array) => {
        if (entry.filename.endsWith(".png")) {
          files[entry.filename] = wx.arrayBufferToBase64(uint8Array);
          current++;
          if (current >= count) {
            callback();
          }
        }
        else {
          files[entry.filename] = wx.arrayBufferToBase64(uint8Array);
          current++;
          if (current >= count) {
            callback();
          }
        }
      });
    });
  }
}

var lib = {};

//@see https://github.com/dankogai/js-base64/blob/master/base64.js
(function (global) {
  'use strict';
  // existing version for noConflict()
  var _Base64 = global.Base64;
  var version = "2.1.9";
  // if node.js, we use Buffer
  var buffer;
  if (typeof module !== 'undefined' && module.exports) {
    try {
      buffer = require('buffer').Buffer;
    } catch (err) { }
  }
  // constants
  var b64chars
      = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  var b64tab = function (bin) {
    var t = {};
    for (var i = 0, l = bin.length; i < l; i++) t[bin.charAt(i)] = i;
    return t;
  }(b64chars);
  var fromCharCode = String.fromCharCode;
  // encoder stuff
  var cb_utob = function (c) {
    if (c.length < 2) {
      var cc = c.charCodeAt(0);
      return cc < 0x80 ? c
          : cc < 0x800 ? (fromCharCode(0xc0 | (cc >>> 6))
              + fromCharCode(0x80 | (cc & 0x3f)))
              : (fromCharCode(0xe0 | ((cc >>> 12) & 0x0f))
                  + fromCharCode(0x80 | ((cc >>> 6) & 0x3f))
                  + fromCharCode(0x80 | (cc & 0x3f)));
    } else {
      var cc = 0x10000
          + (c.charCodeAt(0) - 0xD800) * 0x400
          + (c.charCodeAt(1) - 0xDC00);
      return (fromCharCode(0xf0 | ((cc >>> 18) & 0x07))
          + fromCharCode(0x80 | ((cc >>> 12) & 0x3f))
          + fromCharCode(0x80 | ((cc >>> 6) & 0x3f))
          + fromCharCode(0x80 | (cc & 0x3f)));
    }
  };
  var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
  var utob = function (u) {
    return u.replace(re_utob, cb_utob);
  };
  var cb_encode = function (ccc) {
    var padlen = [0, 2, 1][ccc.length % 3],
        ord = ccc.charCodeAt(0) << 16
            | ((ccc.length > 1 ? ccc.charCodeAt(1) : 0) << 8)
            | ((ccc.length > 2 ? ccc.charCodeAt(2) : 0)),
        chars = [
          b64chars.charAt(ord >>> 18),
          b64chars.charAt((ord >>> 12) & 63),
          padlen >= 2 ? '=' : b64chars.charAt((ord >>> 6) & 63),
          padlen >= 1 ? '=' : b64chars.charAt(ord & 63)
        ];
    return chars.join('');
  };
  var btoa = global.btoa ? function (b) {
    return global.btoa(b);
  } : function (b) {
    return b.replace(/[\s\S]{1,3}/g, cb_encode);
  };
  var _encode = buffer ? function (u) {
        return (u.constructor === buffer.constructor ? u : new buffer(u))
            .toString('base64')
      }
      : function (u) { return btoa(utob(u)) }
  ;
  var encode = function (u, urisafe) {
    return !urisafe
        ? _encode(String(u))
        : _encode(String(u)).replace(/[+\/]/g, function (m0) {
          return m0 == '+' ? '-' : '_';
        }).replace(/=/g, '');
  };
  var encodeURI = function (u) { return encode(u, true) };
  // decoder stuff
  var re_btou = new RegExp([
    '[\xC0-\xDF][\x80-\xBF]',
    '[\xE0-\xEF][\x80-\xBF]{2}',
    '[\xF0-\xF7][\x80-\xBF]{3}'
  ].join('|'), 'g');
  var cb_btou = function (cccc) {
    switch (cccc.length) {
      case 4:
        var cp = ((0x07 & cccc.charCodeAt(0)) << 18)
            | ((0x3f & cccc.charCodeAt(1)) << 12)
            | ((0x3f & cccc.charCodeAt(2)) << 6)
            | (0x3f & cccc.charCodeAt(3)),
            offset = cp - 0x10000;
        return (fromCharCode((offset >>> 10) + 0xD800)
            + fromCharCode((offset & 0x3FF) + 0xDC00));
      case 3:
        return fromCharCode(
            ((0x0f & cccc.charCodeAt(0)) << 12)
            | ((0x3f & cccc.charCodeAt(1)) << 6)
            | (0x3f & cccc.charCodeAt(2))
        );
      default:
        return fromCharCode(
            ((0x1f & cccc.charCodeAt(0)) << 6)
            | (0x3f & cccc.charCodeAt(1))
        );
    }
  };
  var btou = function (b) {
    return b.replace(re_btou, cb_btou);
  };
  var cb_decode = function (cccc) {
    var len = cccc.length,
        padlen = len % 4,
        n = (len > 0 ? b64tab[cccc.charAt(0)] << 18 : 0)
            | (len > 1 ? b64tab[cccc.charAt(1)] << 12 : 0)
            | (len > 2 ? b64tab[cccc.charAt(2)] << 6 : 0)
            | (len > 3 ? b64tab[cccc.charAt(3)] : 0),
        chars = [
          fromCharCode(n >>> 16),
          fromCharCode((n >>> 8) & 0xff),
          fromCharCode(n & 0xff)
        ];
    chars.length -= [0, 0, 2, 1][padlen];
    return chars.join('');
  };
  var atob = global.atob ? function (a) {
    return global.atob(a);
  } : function (a) {
    return a.replace(/[\s\S]{1,4}/g, cb_decode);
  };
  var _decode = buffer ? function (a) {
        return (a.constructor === buffer.constructor
            ? a : new buffer(a, 'base64')).toString();
      }
      : function (a) { return btou(atob(a)) };
  var decode = function (a) {
    return _decode(
        String(a).replace(/[-_]/g, function (m0) { return m0 == '-' ? '+' : '/' })
            .replace(/[^A-Za-z0-9\+\/]/g, '')
    );
  };
  var noConflict = function () {
    var Base64 = global.Base64;
    global.Base64 = _Base64;
    return Base64;
  };
  // export Base64
  global.Base64 = {
    VERSION: version,
    atob: atob,
    btoa: btoa,
    fromBase64: decode,
    toBase64: encode,
    utob: utob,
    encode: encode,
    encodeURI: encodeURI,
    btou: btou,
    decode: decode,
    noConflict: noConflict
  };
  // if ES5 is available, make Base64.extendString() available
  if (typeof Object.defineProperty === 'function') {
    var noEnum = function (v) {
      return { value: v, enumerable: false, writable: true, configurable: true };
    };
    global.Base64.extendString = function () {
      Object.defineProperty(
          String.prototype, 'fromBase64', noEnum(function () {
            return decode(this)
          }));
      Object.defineProperty(
          String.prototype, 'toBase64', noEnum(function (urisafe) {
            return encode(this, urisafe)
          }));
      Object.defineProperty(
          String.prototype, 'toBase64URI', noEnum(function () {
            return encode(this, true)
          }));
    };
  }
  // that's it!
  if (global['Meteor']) {
    Base64 = global.Base64; // for normal export in Meteor.js
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports.Base64 = global.Base64;
  }
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], function () { return global.Base64 });
  }
})(lib);

// @see https://github.com/gildas-lormeau/zip.js
(function (obj) {
  "use strict";

  var ERR_BAD_FORMAT = "File format is not recognized.";
  var ERR_CRC = "CRC failed.";
  var ERR_ENCRYPTED = "File contains encrypted entry.";
  var ERR_ZIP64 = "File is using Zip64 (4gb+ file size).";
  var ERR_READ = "Error while reading zip file.";
  var ERR_WRITE = "Error while writing zip file.";
  var ERR_WRITE_DATA = "Error while writing file data.";
  var ERR_READ_DATA = "Error while reading file data.";
  var ERR_DUPLICATED_NAME = "File already exists.";
  var CHUNK_SIZE = 512 * 1024;

  var TEXT_PLAIN = "text/plain";

  function Crc32() {
    this.crc = -1;
  }
  Crc32.prototype.append = function append(data) {
    var crc = this.crc | 0, table = this.table;
    for (var offset = 0, len = data.length | 0; offset < len; offset++)
      crc = (crc >>> 8) ^ table[(crc ^ data[offset]) & 0xFF];
    this.crc = crc;
  };
  Crc32.prototype.get = function get() {
    return ~this.crc;
  };
  Crc32.prototype.table = (function () {
    var i, j, t, table = []; // Uint32Array is actually slower than []
    for (i = 0; i < 256; i++) {
      t = i;
      for (j = 0; j < 8; j++)
        if (t & 1)
          t = (t >>> 1) ^ 0xEDB88320;
        else
          t = t >>> 1;
      table[i] = t;
    }
    return table;
  })();

  // "no-op" codec
  function NOOP() { }
  NOOP.prototype.append = function append(bytes, onprogress) {
    return bytes;
  };
  NOOP.prototype.flush = function flush() { };

  function getDataHelper(byteLength, bytes) {
    var dataBuffer, dataArray;
    dataBuffer = new ArrayBuffer(byteLength);
    dataArray = new Uint8Array(dataBuffer);
    if (bytes)
      dataArray.set(bytes, 0);
    return {
      buffer: dataBuffer,
      array: dataArray,
      view: new DataView(dataBuffer)
    };
  }

  // Readers
  function Reader() {
  }

  function UInt8Reader(array) {
    var that = this;

    function init(callback) {
      that.size = array.length;
      callback();
    }

    function readUint8Array(index, length, callback, onerror) {
      callback(array.slice(index, index + length));
    }

    that.size = 0;
    that.init = init;
    that.readUint8Array = readUint8Array;
  }
  UInt8Reader.prototype = new Reader();
  UInt8Reader.prototype.constructor = UInt8Reader;

  // Writers

  function Writer() {
  }
  Writer.prototype.getData = function (callback) {
    callback(this.data);
  };

  function UInt8Writer() {
    var arr, that = this;

    function init(callback) {
      arr = [];
      callback();
    }

    function writeUint8Array(array, callback) {
      for (let index = 0; index < array.length; index++) {
        arr.push(array[index]);
      }
      callback();
    }

    function getData(callback) {
      callback(arr);
    }

    that.init = init;
    that.writeUint8Array = writeUint8Array;
    that.getData = getData;
  }
  UInt8Writer.prototype = new Writer();
  UInt8Writer.prototype.constructor = UInt8Writer;

  function launchProcess(process, reader, writer, offset, size, crcType, onprogress, onend, onreaderror, onwriteerror) {
    var chunkIndex = 0, index, outputSize = 0,
        crcInput = crcType === 'input',
        crcOutput = crcType === 'output',
        crc = new Crc32();
    function step() {
      var outputData;
      index = chunkIndex * CHUNK_SIZE;
      if (index < size)
        reader.readUint8Array(offset + index, Math.min(CHUNK_SIZE, size - index), function (inputData) {
          var outputData;
          try {
            outputData = process.append(inputData, function (loaded) {
              if (onprogress)
                onprogress(index + loaded, size);
            });
          } catch (e) {
            onreaderror(e);
            return;
          }
          if (outputData) {
            outputSize += outputData.length;
            writer.writeUint8Array(outputData, function () {
              chunkIndex++;
              setTimeout(step, 1);
            }, onwriteerror);
            if (crcOutput)
              crc.append(outputData);
          } else {
            chunkIndex++;
            setTimeout(step, 1);
          }
          if (crcInput)
            crc.append(inputData);
          if (onprogress)
            onprogress(index, size);
        }, onreaderror);
      else {
        try {
          outputData = process.flush();
        } catch (e) {
          onreaderror(e);
          return;
        }
        if (outputData) {
          if (crcOutput)
            crc.append(outputData);
          outputSize += outputData.length;
          writer.writeUint8Array(outputData, function () {
            onend(outputSize, crc.get());
          }, onwriteerror);
        } else
          onend(outputSize, crc.get());
      }
    }

    step();
  }

  function inflate(worker, sn, reader, writer, offset, size, computeCrc32, onend, onprogress, onreaderror, onwriteerror) {
    var crcType = computeCrc32 ? 'output' : 'none';
    if (obj.zip.useWebWorkers) {
      var initialMessage = {
        sn: sn,
        codecClass: 'Inflater',
        crcType: crcType,
      };
      launchWorkerProcess(worker, initialMessage, reader, writer, offset, size, onprogress, onend, onreaderror, onwriteerror);
    } else
      launchProcess(new obj.zip.Inflater(), reader, writer, offset, size, crcType, onprogress, onend, onreaderror, onwriteerror);
  }

  // ZipReader

  function decodeASCII(str) {
    var i, out = "", charCode, extendedASCII = ['\u00C7', '\u00FC', '\u00E9', '\u00E2', '\u00E4', '\u00E0', '\u00E5', '\u00E7', '\u00EA', '\u00EB',
      '\u00E8', '\u00EF', '\u00EE', '\u00EC', '\u00C4', '\u00C5', '\u00C9', '\u00E6', '\u00C6', '\u00F4', '\u00F6', '\u00F2', '\u00FB', '\u00F9',
      '\u00FF', '\u00D6', '\u00DC', '\u00F8', '\u00A3', '\u00D8', '\u00D7', '\u0192', '\u00E1', '\u00ED', '\u00F3', '\u00FA', '\u00F1', '\u00D1',
      '\u00AA', '\u00BA', '\u00BF', '\u00AE', '\u00AC', '\u00BD', '\u00BC', '\u00A1', '\u00AB', '\u00BB', '_', '_', '_', '\u00A6', '\u00A6',
      '\u00C1', '\u00C2', '\u00C0', '\u00A9', '\u00A6', '\u00A6', '+', '+', '\u00A2', '\u00A5', '+', '+', '-', '-', '+', '-', '+', '\u00E3',
      '\u00C3', '+', '+', '-', '-', '\u00A6', '-', '+', '\u00A4', '\u00F0', '\u00D0', '\u00CA', '\u00CB', '\u00C8', 'i', '\u00CD', '\u00CE',
      '\u00CF', '+', '+', '_', '_', '\u00A6', '\u00CC', '_', '\u00D3', '\u00DF', '\u00D4', '\u00D2', '\u00F5', '\u00D5', '\u00B5', '\u00FE',
      '\u00DE', '\u00DA', '\u00DB', '\u00D9', '\u00FD', '\u00DD', '\u00AF', '\u00B4', '\u00AD', '\u00B1', '_', '\u00BE', '\u00B6', '\u00A7',
      '\u00F7', '\u00B8', '\u00B0', '\u00A8', '\u00B7', '\u00B9', '\u00B3', '\u00B2', '_', ' '];
    for (i = 0; i < str.length; i++) {
      charCode = str.charCodeAt(i) & 0xFF;
      if (charCode > 127)
        out += extendedASCII[charCode - 128];
      else
        out += String.fromCharCode(charCode);
    }
    return out;
  }

  function decodeUTF8(string) {
    return decodeURIComponent(escape(string));
  }

  function getString(bytes) {
    var i, str = "";
    for (i = 0; i < bytes.length; i++)
      str += String.fromCharCode(bytes[i]);
    return str;
  }

  function getDate(timeRaw) {
    var date = (timeRaw & 0xffff0000) >> 16, time = timeRaw & 0x0000ffff;
    try {
      return new Date(1980 + ((date & 0xFE00) >> 9), ((date & 0x01E0) >> 5) - 1, date & 0x001F, (time & 0xF800) >> 11, (time & 0x07E0) >> 5,
          (time & 0x001F) * 2, 0);
    } catch (e) {
    }
  }

  function readCommonHeader(entry, data, index, centralDirectory, onerror) {
    entry.version = data.view.getUint16(index, true);
    entry.bitFlag = data.view.getUint16(index + 2, true);
    entry.compressionMethod = data.view.getUint16(index + 4, true);
    entry.lastModDateRaw = data.view.getUint32(index + 6, true);
    entry.lastModDate = getDate(entry.lastModDateRaw);
    if ((entry.bitFlag & 0x01) === 0x01) {
      onerror(ERR_ENCRYPTED);
      return;
    }
    if (centralDirectory || (entry.bitFlag & 0x0008) != 0x0008) {
      entry.crc32 = data.view.getUint32(index + 10, true);
      entry.compressedSize = data.view.getUint32(index + 14, true);
      entry.uncompressedSize = data.view.getUint32(index + 18, true);
    }
    if (entry.compressedSize === 0xFFFFFFFF || entry.uncompressedSize === 0xFFFFFFFF) {
      onerror(ERR_ZIP64);
      return;
    }
    entry.filenameLength = data.view.getUint16(index + 22, true);
    entry.extraFieldLength = data.view.getUint16(index + 24, true);
  }

  function createZipReader(reader, callback, onerror) {
    var inflateSN = 0;

    function Entry() {
    }

    Entry.prototype.getData = function (writer, onend, onprogress, checkCrc32) {
      var that = this;

      function testCrc32(crc32) {
        var dataCrc32 = getDataHelper(4);
        dataCrc32.view.setUint32(0, crc32);
        return that.crc32 == dataCrc32.view.getUint32(0);
      }

      function getWriterData(uncompressedSize, crc32) {
        if (checkCrc32 && !testCrc32(crc32))
          onerror(ERR_CRC);
        else
          writer.getData(function (data) {
            onend(data);
          });
      }

      function onreaderror(err) {
        onerror(err || ERR_READ_DATA);
      }

      function onwriteerror(err) {
        onerror(err || ERR_WRITE_DATA);
      }

      reader.readUint8Array(that.offset, 30, function (bytes) {
        var data = getDataHelper(bytes.length, bytes), dataOffset;
        if (data.view.getUint32(0) != 0x504b0304) {
          onerror(ERR_BAD_FORMAT);
          return;
        }
        readCommonHeader(that, data, 4, false, onerror);
        dataOffset = that.offset + 30 + that.filenameLength + that.extraFieldLength;
        writer.init(function () {
          if (that.compressionMethod === 0)
            copy(that._worker, inflateSN++, reader, writer, dataOffset, that.compressedSize, checkCrc32, getWriterData, onprogress, onreaderror, onwriteerror);
          else
            inflate(that._worker, inflateSN++, reader, writer, dataOffset, that.compressedSize, checkCrc32, getWriterData, onprogress, onreaderror, onwriteerror);
        }, onwriteerror);
      }, onreaderror);
    };

    function seekEOCDR(eocdrCallback) {
      // "End of central directory record" is the last part of a zip archive, and is at least 22 bytes long.
      // Zip file comment is the last part of EOCDR and has max length of 64KB,
      // so we only have to search the last 64K + 22 bytes of a archive for EOCDR signature (0x06054b50).
      var EOCDR_MIN = 22;
      if (reader.size < EOCDR_MIN) {
        onerror(ERR_BAD_FORMAT);
        return;
      }
      var ZIP_COMMENT_MAX = 256 * 256, EOCDR_MAX = EOCDR_MIN + ZIP_COMMENT_MAX;

      // In most cases, the EOCDR is EOCDR_MIN bytes long
      doSeek(EOCDR_MIN, function () {
        // If not found, try within EOCDR_MAX bytes
        doSeek(Math.min(EOCDR_MAX, reader.size), function () {
          onerror(ERR_BAD_FORMAT);
        });
      });

      // seek last length bytes of file for EOCDR
      function doSeek(length, eocdrNotFoundCallback) {
        reader.readUint8Array(reader.size - length, length, function (bytes) {
          for (var i = bytes.length - EOCDR_MIN; i >= 0; i--) {
            if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) {
              eocdrCallback(new DataView(bytes.buffer, i, EOCDR_MIN));
              return;
            }
          }
          eocdrNotFoundCallback();
        }, function () {
          onerror(ERR_READ);
        });
      }
    }

    var zipReader = {
      getEntries: function (callback) {
        var worker = this._worker;
        // look for End of central directory record
        seekEOCDR(function (dataView) {
          var datalength, fileslength;
          datalength = dataView.getUint32(16, true);
          fileslength = dataView.getUint16(8, true);
          if (datalength < 0 || datalength >= reader.size) {
            onerror(ERR_BAD_FORMAT);
            return;
          }
          reader.readUint8Array(datalength, reader.size - datalength, function (bytes) {
            var i, index = 0, entries = [], entry, filename, comment, data = getDataHelper(bytes.length, bytes);
            for (i = 0; i < fileslength; i++) {
              entry = new Entry();
              entry._worker = worker;
              if (data.view.getUint32(index) != 0x504b0102) {
                onerror(ERR_BAD_FORMAT);
                return;
              }
              readCommonHeader(entry, data, index + 6, true, onerror);
              entry.commentLength = data.view.getUint16(index + 32, true);
              entry.directory = ((data.view.getUint8(index + 38) & 0x10) == 0x10);
              entry.offset = data.view.getUint32(index + 42, true);
              filename = getString(data.array.subarray(index + 46, index + 46 + entry.filenameLength));
              entry.filename = ((entry.bitFlag & 0x0800) === 0x0800) ? decodeUTF8(filename) : decodeASCII(filename);
              if (!entry.directory && entry.filename.charAt(entry.filename.length - 1) == "/")
                entry.directory = true;
              comment = getString(data.array.subarray(index + 46 + entry.filenameLength + entry.extraFieldLength, index + 46
                  + entry.filenameLength + entry.extraFieldLength + entry.commentLength));
              entry.comment = ((entry.bitFlag & 0x0800) === 0x0800) ? decodeUTF8(comment) : decodeASCII(comment);
              entries.push(entry);
              index += 46 + entry.filenameLength + entry.extraFieldLength + entry.commentLength;
            }
            callback(entries);
          }, function () {
            onerror(ERR_READ);
          });
        });
      },
      close: function (callback) {
        if (this._worker) {
          this._worker.terminate();
          this._worker = null;
        }
        if (callback)
          callback();
      },
      _worker: null
    };

    callback(zipReader);
  }

  // ZipWriter

  function encodeUTF8(string) {
    return unescape(encodeURIComponent(string));
  }

  function getBytes(str) {
    var i, array = [];
    for (i = 0; i < str.length; i++)
      array.push(str.charCodeAt(i));
    return array;
  }

  function createZipWriter(writer, callback, onerror, dontDeflate) {
    var files = {}, filenames = [], datalength = 0;
    var deflateSN = 0;

    function onwriteerror(err) {
      onerror(err || ERR_WRITE);
    }

    function onreaderror(err) {
      onerror(err || ERR_READ_DATA);
    }

    var zipWriter = {
      add: function (name, reader, onend, onprogress, options) {
        var header, filename, date;
        var worker = this._worker;

        function writeHeader(callback) {
          var data;
          date = options.lastModDate || new Date();
          header = getDataHelper(26);
          files[name] = {
            headerArray: header.array,
            directory: options.directory,
            filename: filename,
            offset: datalength,
            comment: getBytes(encodeUTF8(options.comment || ""))
          };
          header.view.setUint32(0, 0x14000808);
          if (options.version)
            header.view.setUint8(0, options.version);
          if (!dontDeflate && options.level !== 0 && !options.directory)
            header.view.setUint16(4, 0x0800);
          header.view.setUint16(6, (((date.getHours() << 6) | date.getMinutes()) << 5) | date.getSeconds() / 2, true);
          header.view.setUint16(8, ((((date.getFullYear() - 1980) << 4) | (date.getMonth() + 1)) << 5) | date.getDate(), true);
          header.view.setUint16(22, filename.length, true);
          data = getDataHelper(30 + filename.length);
          data.view.setUint32(0, 0x504b0304);
          data.array.set(header.array, 4);
          data.array.set(filename, 30);
          datalength += data.array.length;
          writer.writeUint8Array(data.array, callback, onwriteerror);
        }

        function writeFooter(compressedLength, crc32) {
          var footer = getDataHelper(16);
          datalength += compressedLength || 0;
          footer.view.setUint32(0, 0x504b0708);
          if (typeof crc32 != "undefined") {
            header.view.setUint32(10, crc32, true);
            footer.view.setUint32(4, crc32, true);
          }
          if (reader) {
            footer.view.setUint32(8, compressedLength, true);
            header.view.setUint32(14, compressedLength, true);
            footer.view.setUint32(12, reader.size, true);
            header.view.setUint32(18, reader.size, true);
          }
          writer.writeUint8Array(footer.array, function () {
            datalength += 16;
            onend();
          }, onwriteerror);
        }

        function writeFile() {
          options = options || {};
          name = name.trim();
          if (options.directory && name.charAt(name.length - 1) != "/")
            name += "/";
          if (files.hasOwnProperty(name)) {
            onerror(ERR_DUPLICATED_NAME);
            return;
          }
          filename = getBytes(encodeUTF8(name));
          filenames.push(name);
          writeHeader(function () {
            if (reader)
              if (dontDeflate || options.level === 0)
                copy(worker, deflateSN++, reader, writer, 0, reader.size, true, writeFooter, onprogress, onreaderror, onwriteerror);
              else
                deflate(worker, deflateSN++, reader, writer, options.level, writeFooter, onprogress, onreaderror, onwriteerror);
            else
              writeFooter();
          }, onwriteerror);
        }

        if (reader)
          reader.init(writeFile, onreaderror);
        else
          writeFile();
      },
      close: function (callback) {
        if (this._worker) {
          this._worker.terminate();
          this._worker = null;
        }

        var data, length = 0, index = 0, indexFilename, file;
        for (indexFilename = 0; indexFilename < filenames.length; indexFilename++) {
          file = files[filenames[indexFilename]];
          length += 46 + file.filename.length + file.comment.length;
        }
        data = getDataHelper(length + 22);
        for (indexFilename = 0; indexFilename < filenames.length; indexFilename++) {
          file = files[filenames[indexFilename]];
          data.view.setUint32(index, 0x504b0102);
          data.view.setUint16(index + 4, 0x1400);
          data.array.set(file.headerArray, index + 6);
          data.view.setUint16(index + 32, file.comment.length, true);
          if (file.directory)
            data.view.setUint8(index + 38, 0x10);
          data.view.setUint32(index + 42, file.offset, true);
          data.array.set(file.filename, index + 46);
          data.array.set(file.comment, index + 46 + file.filename.length);
          index += 46 + file.filename.length + file.comment.length;
        }
        data.view.setUint32(index, 0x504b0506);
        data.view.setUint16(index + 8, filenames.length, true);
        data.view.setUint16(index + 10, filenames.length, true);
        data.view.setUint32(index + 12, length, true);
        data.view.setUint32(index + 16, datalength, true);
        writer.writeUint8Array(data.array, function () {
          writer.getData(callback);
        }, onwriteerror);
      },
      _worker: null
    };

    callback(zipWriter);
  }

  function resolveURLs(urls) {
    var a = document.createElement('a');
    return urls.map(function (url) {
      a.href = url;
      return a.href;
    });
  }

  function onerror_default(error) {
    console.error(error);
  }
  obj.zip = {
    Reader: Reader,
    Writer: Writer,
    UInt8Reader: UInt8Reader,
    UInt8Writer: UInt8Writer,
    createReader: function (reader, callback, onerror) {
      onerror = onerror || onerror_default;

      reader.init(function () {
        createZipReader(reader, callback, onerror);
      }, onerror);
    },
    createWriter: function (writer, callback, onerror, dontDeflate) {
      onerror = onerror || onerror_default;
      dontDeflate = !!dontDeflate;

      writer.init(function () {
        createZipWriter(writer, callback, onerror, dontDeflate);
      }, onerror);
    },
    useWebWorkers: false,
  };

})(lib);

(function (global) {
  var MAX_BITS = 15; var Z_OK = 0; var Z_STREAM_END = 1; var Z_NEED_DICT = 2; var Z_STREAM_ERROR = -2; var Z_DATA_ERROR = -3; var Z_MEM_ERROR = -4; var Z_BUF_ERROR = -5; var inflate_mask = [0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023, 2047, 4095, 8191, 16383, 32767, 65535]; var MANY = 1440; var Z_NO_FLUSH = 0; var Z_FINISH = 4; var fixed_bl = 9; var fixed_bd = 5; var fixed_tl = [96, 7, 256, 0, 8, 80, 0, 8, 16, 84, 8, 115, 82, 7, 31, 0, 8, 112, 0, 8, 48, 0, 9, 192, 80, 7, 10, 0, 8, 96, 0, 8, 32, 0, 9, 160, 0, 8, 0, 0, 8, 128, 0, 8, 64, 0, 9, 224, 80, 7, 6, 0, 8, 88, 0, 8, 24, 0, 9, 144, 83, 7, 59, 0, 8, 120, 0, 8, 56, 0, 9, 208, 81, 7, 17, 0, 8, 104, 0, 8, 40, 0, 9, 176, 0, 8, 8, 0, 8, 136, 0, 8, 72, 0, 9, 240, 80, 7, 4, 0, 8, 84, 0, 8, 20, 85, 8, 227, 83, 7, 43, 0, 8, 116, 0, 8, 52, 0, 9, 200, 81, 7, 13, 0, 8, 100, 0, 8, 36, 0, 9, 168, 0, 8, 4, 0, 8, 132, 0, 8, 68, 0, 9, 232, 80, 7, 8, 0, 8, 92, 0, 8, 28, 0, 9, 152, 84, 7, 83, 0, 8, 124, 0, 8, 60, 0, 9, 216, 82, 7, 23, 0, 8, 108, 0, 8, 44, 0, 9, 184, 0, 8, 12, 0, 8, 140, 0, 8, 76, 0, 9, 248, 80, 7, 3, 0, 8, 82, 0, 8, 18, 85, 8, 163, 83, 7, 35, 0, 8, 114, 0, 8, 50, 0, 9, 196, 81, 7, 11, 0, 8, 98, 0, 8, 34, 0, 9, 164, 0, 8, 2, 0, 8, 130, 0, 8, 66, 0, 9, 228, 80, 7, 7, 0, 8, 90, 0, 8, 26, 0, 9, 148, 84, 7, 67, 0, 8, 122, 0, 8, 58, 0, 9, 212, 82, 7, 19, 0, 8, 106, 0, 8, 42, 0, 9, 180, 0, 8, 10, 0, 8, 138, 0, 8, 74, 0, 9, 244, 80, 7, 5, 0, 8, 86, 0, 8, 22, 192, 8, 0, 83, 7, 51, 0, 8, 118, 0, 8, 54, 0, 9, 204, 81, 7, 15, 0, 8, 102, 0, 8, 38, 0, 9, 172, 0, 8, 6, 0, 8, 134, 0, 8, 70, 0, 9, 236, 80, 7, 9, 0, 8, 94, 0, 8, 30, 0, 9, 156, 84, 7, 99, 0, 8, 126, 0, 8, 62, 0, 9, 220, 82, 7, 27, 0, 8, 110, 0, 8, 46, 0, 9, 188, 0, 8, 14, 0, 8, 142, 0, 8, 78, 0, 9, 252, 96, 7, 256, 0, 8, 81, 0, 8, 17, 85, 8, 131, 82, 7, 31, 0, 8, 113, 0, 8, 49, 0, 9, 194, 80, 7, 10, 0, 8, 97, 0, 8, 33, 0, 9, 162, 0, 8, 1, 0, 8, 129, 0, 8, 65, 0, 9, 226, 80, 7, 6, 0, 8, 89, 0, 8, 25, 0, 9, 146, 83, 7, 59, 0, 8, 121, 0, 8, 57, 0, 9, 210, 81, 7, 17, 0, 8, 105, 0, 8, 41, 0, 9, 178, 0, 8, 9, 0, 8, 137, 0, 8, 73, 0, 9, 242, 80, 7, 4, 0, 8, 85, 0, 8, 21, 80, 8, 258, 83, 7, 43, 0, 8, 117, 0, 8, 53, 0, 9, 202, 81, 7, 13, 0, 8, 101, 0, 8, 37, 0, 9, 170, 0, 8, 5, 0, 8, 133, 0, 8, 69, 0, 9, 234, 80, 7, 8, 0, 8, 93, 0, 8, 29, 0, 9, 154, 84, 7, 83, 0, 8, 125, 0, 8, 61, 0, 9, 218, 82, 7, 23, 0, 8, 109, 0, 8, 45, 0, 9, 186, 0, 8, 13, 0, 8, 141, 0, 8, 77, 0, 9, 250, 80, 7, 3, 0, 8, 83, 0, 8, 19, 85, 8, 195, 83, 7, 35, 0, 8, 115, 0, 8, 51, 0, 9, 198, 81, 7, 11, 0, 8, 99, 0, 8, 35, 0, 9, 166, 0, 8, 3, 0, 8, 131, 0, 8, 67, 0, 9, 230, 80, 7, 7, 0, 8, 91, 0, 8, 27, 0, 9, 150, 84, 7, 67, 0, 8, 123, 0, 8, 59, 0, 9, 214, 82, 7, 19, 0, 8, 107, 0, 8, 43, 0, 9, 182, 0, 8, 11, 0, 8, 139, 0, 8, 75, 0, 9, 246, 80, 7, 5, 0, 8, 87, 0, 8, 23, 192, 8, 0, 83, 7, 51, 0, 8, 119, 0, 8, 55, 0, 9, 206, 81, 7, 15, 0, 8, 103, 0, 8, 39, 0, 9, 174, 0, 8, 7, 0, 8, 135, 0, 8, 71, 0, 9, 238, 80, 7, 9, 0, 8, 95, 0, 8, 31, 0, 9, 158, 84, 7, 99, 0, 8, 127, 0, 8, 63, 0, 9, 222, 82, 7, 27, 0, 8, 111, 0, 8, 47, 0, 9, 190, 0, 8, 15, 0, 8, 143, 0, 8, 79, 0, 9, 254, 96, 7, 256, 0, 8, 80, 0, 8, 16, 84, 8, 115, 82, 7, 31, 0, 8, 112, 0, 8, 48, 0, 9, 193, 80, 7, 10, 0, 8, 96, 0, 8, 32, 0, 9, 161, 0, 8, 0, 0, 8, 128, 0, 8, 64, 0, 9, 225, 80, 7, 6, 0, 8, 88, 0, 8, 24, 0, 9, 145, 83, 7, 59, 0, 8, 120, 0, 8, 56, 0, 9, 209, 81, 7, 17, 0, 8, 104, 0, 8, 40, 0, 9, 177, 0, 8, 8, 0, 8, 136, 0, 8, 72, 0, 9, 241, 80, 7, 4, 0, 8, 84, 0, 8, 20, 85, 8, 227, 83, 7, 43, 0, 8, 116, 0, 8, 52, 0, 9, 201, 81, 7, 13, 0, 8, 100, 0, 8, 36, 0, 9, 169, 0, 8, 4, 0, 8, 132, 0, 8, 68, 0, 9, 233, 80, 7, 8, 0, 8, 92, 0, 8, 28, 0, 9, 153, 84, 7, 83, 0, 8, 124, 0, 8, 60, 0, 9, 217, 82, 7, 23, 0, 8, 108, 0, 8, 44, 0, 9, 185, 0, 8, 12, 0, 8, 140, 0, 8, 76, 0, 9, 249, 80, 7, 3, 0, 8, 82, 0, 8, 18, 85, 8, 163, 83, 7, 35, 0, 8, 114, 0, 8, 50, 0, 9, 197, 81, 7, 11, 0, 8, 98, 0, 8, 34, 0, 9, 165, 0, 8, 2, 0, 8, 130, 0, 8, 66, 0, 9, 229, 80, 7, 7, 0, 8, 90, 0, 8, 26, 0, 9, 149, 84, 7, 67, 0, 8, 122, 0, 8, 58, 0, 9, 213, 82, 7, 19, 0, 8, 106, 0, 8, 42, 0, 9, 181, 0, 8, 10, 0, 8, 138, 0, 8, 74, 0, 9, 245, 80, 7, 5, 0, 8, 86, 0, 8, 22, 192, 8, 0, 83, 7, 51, 0, 8, 118, 0, 8, 54, 0, 9, 205, 81, 7, 15, 0, 8, 102, 0, 8, 38, 0, 9, 173, 0, 8, 6, 0, 8, 134, 0, 8, 70, 0, 9, 237, 80, 7, 9, 0, 8, 94, 0, 8, 30, 0, 9, 157, 84, 7, 99, 0, 8, 126, 0, 8, 62, 0, 9, 221, 82, 7, 27, 0, 8, 110, 0, 8, 46, 0, 9, 189, 0, 8, 14, 0, 8, 142, 0, 8, 78, 0, 9, 253, 96, 7, 256, 0, 8, 81, 0, 8, 17, 85, 8, 131, 82, 7, 31, 0, 8, 113, 0, 8, 49, 0, 9, 195, 80, 7, 10, 0, 8, 97, 0, 8, 33, 0, 9, 163, 0, 8, 1, 0, 8, 129, 0, 8, 65, 0, 9, 227, 80, 7, 6, 0, 8, 89, 0, 8, 25, 0, 9, 147, 83, 7, 59, 0, 8, 121, 0, 8, 57, 0, 9, 211, 81, 7, 17, 0, 8, 105, 0, 8, 41, 0, 9, 179, 0, 8, 9, 0, 8, 137, 0, 8, 73, 0, 9, 243, 80, 7, 4, 0, 8, 85, 0, 8, 21, 80, 8, 258, 83, 7, 43, 0, 8, 117, 0, 8, 53, 0, 9, 203, 81, 7, 13, 0, 8, 101, 0, 8, 37, 0, 9, 171, 0, 8, 5, 0, 8, 133, 0, 8, 69, 0, 9, 235, 80, 7, 8, 0, 8, 93, 0, 8, 29, 0, 9, 155, 84, 7, 83, 0, 8, 125, 0, 8, 61, 0, 9, 219, 82, 7, 23, 0, 8, 109, 0, 8, 45, 0, 9, 187, 0, 8, 13, 0, 8, 141, 0, 8, 77, 0, 9, 251, 80, 7, 3, 0, 8, 83, 0, 8, 19, 85, 8, 195, 83, 7, 35, 0, 8, 115, 0, 8, 51, 0, 9, 199, 81, 7, 11, 0, 8, 99, 0, 8, 35, 0, 9, 167, 0, 8, 3, 0, 8, 131, 0, 8, 67, 0, 9, 231, 80, 7, 7, 0, 8, 91, 0, 8, 27, 0, 9, 151, 84, 7, 67, 0, 8, 123, 0, 8, 59, 0, 9, 215, 82, 7, 19, 0, 8, 107, 0, 8, 43, 0, 9, 183, 0, 8, 11, 0, 8, 139, 0, 8, 75, 0, 9, 247, 80, 7, 5, 0, 8, 87, 0, 8, 23, 192, 8, 0, 83, 7, 51, 0, 8, 119, 0, 8, 55, 0, 9, 207, 81, 7, 15, 0, 8, 103, 0, 8, 39, 0, 9, 175, 0, 8, 7, 0, 8, 135, 0, 8, 71, 0, 9, 239, 80, 7, 9, 0, 8, 95, 0, 8, 31, 0, 9, 159, 84, 7, 99, 0, 8, 127, 0, 8, 63, 0, 9, 223, 82, 7, 27, 0, 8, 111, 0, 8, 47, 0, 9, 191, 0, 8, 15, 0, 8, 143, 0, 8, 79, 0, 9, 255]; var fixed_td = [80, 5, 1, 87, 5, 257, 83, 5, 17, 91, 5, 4097, 81, 5, 5, 89, 5, 1025, 85, 5, 65, 93, 5, 16385, 80, 5, 3, 88, 5, 513, 84, 5, 33, 92, 5, 8193, 82, 5, 9, 90, 5, 2049, 86, 5, 129, 192, 5, 24577, 80, 5, 2, 87, 5, 385, 83, 5, 25, 91, 5, 6145, 81, 5, 7, 89, 5, 1537, 85, 5, 97, 93, 5, 24577, 80, 5, 4, 88, 5, 769, 84, 5, 49, 92, 5, 12289, 82, 5, 13, 90, 5, 3073, 86, 5, 193, 192, 5, 24577];
  var cplens = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 0, 0]; var cplext = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 112, 112]; var cpdist = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577]; var cpdext = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13]; var BMAX = 15; function InfTree() { var that = this; var hn; var v; var c; var r; var u; var x; function huft_build(b, bindex, n, s, d, e, t, m, hp, hn, v) { var a; var f; var g; var h; var i; var j; var k; var l; var mask; var p; var q; var w; var xp; var y; var z; p = 0; i = n; do { c[b[bindex + p]]++; p++; i-- } while (i !== 0); if (c[0] == n) { t[0] = -1; m[0] = 0; return Z_OK } l = m[0]; for (j = 1; j <= BMAX; j++) { if (c[j] !== 0) { break } } k = j; if (l < j) { l = j } for (i = BMAX; i !== 0; i--) { if (c[i] !== 0) { break } } g = i; if (l > i) { l = i } m[0] = l; for (y = 1 << j; j < i; j++ , y <<= 1) { if ((y -= c[j]) < 0) { return Z_DATA_ERROR } } if ((y -= c[i]) < 0) { return Z_DATA_ERROR } c[i] += y; x[1] = j = 0; p = 1; xp = 2; while (--i !== 0) { x[xp] = (j += c[p]); xp++; p++ } i = 0; p = 0; do { if ((j = b[bindex + p]) !== 0) { v[x[j]++] = i } p++ } while (++i < n); n = x[g]; x[0] = i = 0; p = 0; h = -1; w = -l; u[0] = 0; q = 0; z = 0; for (; k <= g; k++) { a = c[k]; while (a-- !== 0) { while (k > w + l) { h++; w += l; z = g - w; z = (z > l) ? l : z; if ((f = 1 << (j = k - w)) > a + 1) { f -= a + 1; xp = k; if (j < z) { while (++j < z) { if ((f <<= 1) <= c[++xp]) { break } f -= c[xp] } } } z = 1 << j; if (hn[0] + z > MANY) { return Z_DATA_ERROR } u[h] = q = hn[0]; hn[0] += z; if (h !== 0) { x[h] = i; r[0] = j; r[1] = l; j = i >>> (w - l); r[2] = (q - u[h - 1] - j); hp.set(r, (u[h - 1] + j) * 3) } else { t[0] = q } } r[1] = (k - w); if (p >= n) { r[0] = 128 + 64 } else { if (v[p] < s) { r[0] = (v[p] < 256 ? 0 : 32 + 64); r[2] = v[p++] } else { r[0] = (e[v[p] - s] + 16 + 64); r[2] = d[v[p++] - s] } } f = 1 << (k - w); for (j = i >>> w; j < z; j += f) { hp.set(r, (q + j) * 3) } for (j = 1 << (k - 1); (i & j) !== 0; j >>>= 1) { i ^= j } i ^= j; mask = (1 << w) - 1; while ((i & mask) != x[h]) { h--; w -= l; mask = (1 << w) - 1 } } } return y !== 0 && g != 1 ? Z_BUF_ERROR : Z_OK } function initWorkArea(vsize) { var i; if (!hn) { hn = []; v = []; c = new Int32Array(BMAX + 1); r = []; u = new Int32Array(BMAX); x = new Int32Array(BMAX + 1) } if (v.length < vsize) { v = [] } for (i = 0; i < vsize; i++) { v[i] = 0 } for (i = 0; i < BMAX + 1; i++) { c[i] = 0 } for (i = 0; i < 3; i++) { r[i] = 0 } u.set(c.subarray(0, BMAX), 0); x.set(c.subarray(0, BMAX + 1), 0) } that.inflate_trees_bits = function (c, bb, tb, hp, z) { var result; initWorkArea(19); hn[0] = 0; result = huft_build(c, 0, 19, 19, null, null, tb, bb, hp, hn, v); if (result == Z_DATA_ERROR) { z.msg = "oversubscribed dynamic bit lengths tree" } else { if (result == Z_BUF_ERROR || bb[0] === 0) { z.msg = "incomplete dynamic bit lengths tree"; result = Z_DATA_ERROR } } return result }; that.inflate_trees_dynamic = function (nl, nd, c, bl, bd, tl, td, hp, z) { var result; initWorkArea(288); hn[0] = 0; result = huft_build(c, 0, nl, 257, cplens, cplext, tl, bl, hp, hn, v); if (result != Z_OK || bl[0] === 0) { if (result == Z_DATA_ERROR) { z.msg = "oversubscribed literal/length tree" } else { if (result != Z_MEM_ERROR) { z.msg = "incomplete literal/length tree"; result = Z_DATA_ERROR } } return result } initWorkArea(288); result = huft_build(c, nl, nd, 0, cpdist, cpdext, td, bd, hp, hn, v); if (result != Z_OK || (bd[0] === 0 && nl > 257)) { if (result == Z_DATA_ERROR) { z.msg = "oversubscribed distance tree" } else { if (result == Z_BUF_ERROR) { z.msg = "incomplete distance tree"; result = Z_DATA_ERROR } else { if (result != Z_MEM_ERROR) { z.msg = "empty distance tree with lengths"; result = Z_DATA_ERROR } } } return result } return Z_OK } } InfTree.inflate_trees_fixed = function (bl, bd, tl, td) { bl[0] = fixed_bl; bd[0] = fixed_bd; tl[0] = fixed_tl; td[0] = fixed_td; return Z_OK }; var START = 0; var LEN = 1; var LENEXT = 2; var DIST = 3; var DISTEXT = 4; var COPY = 5; var LIT = 6; var WASH = 7; var END = 8; var BADCODE = 9; function InfCodes() {
    var that = this; var mode; var len = 0; var tree; var tree_index = 0; var need = 0; var lit = 0; var get = 0; var dist = 0; var lbits = 0; var dbits = 0; var ltree; var ltree_index = 0; var dtree; var dtree_index = 0; function inflate_fast(bl, bd, tl, tl_index, td, td_index, s, z) {
      var t; var tp; var tp_index; var e; var b; var k; var p; var n; var q; var m; var ml; var md; var c; var d; var r; var tp_index_t_3; p = z.next_in_index; n = z.avail_in; b = s.bitb; k = s.bitk; q = s.write; m = q < s.read ? s.read - q - 1 : s.end - q; ml = inflate_mask[bl]; md = inflate_mask[bd]; do {
        while (k < (20)) { n--; b |= (z.read_byte(p++) & 255) << k; k += 8 } t = b & ml; tp = tl; tp_index = tl_index; tp_index_t_3 = (tp_index + t) * 3; if ((e = tp[tp_index_t_3]) === 0) { b >>= (tp[tp_index_t_3 + 1]); k -= (tp[tp_index_t_3 + 1]); s.window[q++] = tp[tp_index_t_3 + 2]; m--; continue } do {
          b >>= (tp[tp_index_t_3 + 1]); k -= (tp[tp_index_t_3 + 1]); if ((e & 16) !== 0) {
            e &= 15; c = tp[tp_index_t_3 + 2] + (b & inflate_mask[e]); b >>= e; k -= e; while (k < (15)) { n--; b |= (z.read_byte(p++) & 255) << k; k += 8 } t = b & md; tp = td; tp_index = td_index; tp_index_t_3 = (tp_index + t) * 3; e = tp[tp_index_t_3]; do {
              b >>= (tp[tp_index_t_3 + 1]); k -= (tp[tp_index_t_3 + 1]); if ((e & 16) !== 0) {
                e &= 15; while (k < (e)) { n--; b |= (z.read_byte(p++) & 255) << k; k += 8 } d = tp[tp_index_t_3 + 2] + (b & inflate_mask[e]); b >>= (e); k -= (e); m -= c; if (q >= d) { r = q - d; if (q - r > 0 && 2 > (q - r)) { s.window[q++] = s.window[r++]; s.window[q++] = s.window[r++]; c -= 2 } else { s.window.set(s.window.subarray(r, r + 2), q); q += 2; r += 2; c -= 2 } } else { r = q - d; do { r += s.end } while (r < 0); e = s.end - r; if (c > e) { c -= e; if (q - r > 0 && e > (q - r)) { do { s.window[q++] = s.window[r++] } while (--e !== 0) } else { s.window.set(s.window.subarray(r, r + e), q); q += e; r += e; e = 0 } r = 0 } } if (q - r > 0 && c > (q - r)) { do { s.window[q++] = s.window[r++] } while (--c !== 0) } else {
                  s.window.set(s.window.subarray(r, r + c), q); q += c; r += c;
                  c = 0
                } break
              } else { if ((e & 64) === 0) { t += tp[tp_index_t_3 + 2]; t += (b & inflate_mask[e]); tp_index_t_3 = (tp_index + t) * 3; e = tp[tp_index_t_3] } else { z.msg = "invalid distance code"; c = z.avail_in - n; c = (k >> 3) < c ? k >> 3 : c; n += c; p -= c; k -= c << 3; s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return Z_DATA_ERROR } }
            } while (true); break
          } if ((e & 64) === 0) { t += tp[tp_index_t_3 + 2]; t += (b & inflate_mask[e]); tp_index_t_3 = (tp_index + t) * 3; if ((e = tp[tp_index_t_3]) === 0) { b >>= (tp[tp_index_t_3 + 1]); k -= (tp[tp_index_t_3 + 1]); s.window[q++] = tp[tp_index_t_3 + 2]; m--; break } } else { if ((e & 32) !== 0) { c = z.avail_in - n; c = (k >> 3) < c ? k >> 3 : c; n += c; p -= c; k -= c << 3; s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return Z_STREAM_END } else { z.msg = "invalid literal/length code"; c = z.avail_in - n; c = (k >> 3) < c ? k >> 3 : c; n += c; p -= c; k -= c << 3; s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return Z_DATA_ERROR } }
        } while (true)
      } while (m >= 258 && n >= 10); c = z.avail_in - n; c = (k >> 3) < c ? k >> 3 : c; n += c; p -= c; k -= c << 3; s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return Z_OK
    } that.init = function (bl, bd, tl, tl_index, td, td_index) { mode = START; lbits = bl; dbits = bd; ltree = tl; ltree_index = tl_index; dtree = td; dtree_index = td_index; tree = null }; that.proc = function (s, z, r) {
      var j; var tindex; var e; var b = 0; var k = 0; var p = 0; var n; var q; var m; var f; p = z.next_in_index; n = z.avail_in; b = s.bitb; k = s.bitk; q = s.write; m = q < s.read ? s.read - q - 1 : s.end - q; while (true) {
        switch (mode) {
          case START: if (m >= 258 && n >= 10) { s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; r = inflate_fast(lbits, dbits, ltree, ltree_index, dtree, dtree_index, s, z); p = z.next_in_index; n = z.avail_in; b = s.bitb; k = s.bitk; q = s.write; m = q < s.read ? s.read - q - 1 : s.end - q; if (r != Z_OK) { mode = r == Z_STREAM_END ? WASH : BADCODE; break } } need = lbits; tree = ltree; tree_index = ltree_index; mode = LEN; case LEN: j = need; while (k < (j)) { if (n !== 0) { r = Z_OK } else { s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return s.inflate_flush(z, r) } n--; b |= (z.read_byte(p++) & 255) << k; k += 8 } tindex = (tree_index + (b & inflate_mask[j])) * 3; b >>>= (tree[tindex + 1]); k -= (tree[tindex + 1]); e = tree[tindex]; if (e === 0) { lit = tree[tindex + 2]; mode = LIT; break } if ((e & 16) !== 0) { get = e & 15; len = tree[tindex + 2]; mode = LENEXT; break } if ((e & 64) === 0) { need = e; tree_index = tindex / 3 + tree[tindex + 2]; break } if ((e & 32) !== 0) { mode = WASH; break } mode = BADCODE; z.msg = "invalid literal/length code"; r = Z_DATA_ERROR; s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return s.inflate_flush(z, r); case LENEXT: j = get; while (k < (j)) { if (n !== 0) { r = Z_OK } else { s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return s.inflate_flush(z, r) } n--; b |= (z.read_byte(p++) & 255) << k; k += 8 } len += (b & inflate_mask[j]); b >>= j; k -= j; need = dbits; tree = dtree; tree_index = dtree_index; mode = DIST; case DIST: j = need; while (k < (j)) { if (n !== 0) { r = Z_OK } else { s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return s.inflate_flush(z, r) } n--; b |= (z.read_byte(p++) & 255) << k; k += 8 } tindex = (tree_index + (b & inflate_mask[j])) * 3; b >>= tree[tindex + 1]; k -= tree[tindex + 1]; e = (tree[tindex]); if ((e & 16) !== 0) { get = e & 15; dist = tree[tindex + 2]; mode = DISTEXT; break } if ((e & 64) === 0) { need = e; tree_index = tindex / 3 + tree[tindex + 2]; break } mode = BADCODE; z.msg = "invalid distance code"; r = Z_DATA_ERROR; s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return s.inflate_flush(z, r); case DISTEXT: j = get; while (k < (j)) { if (n !== 0) { r = Z_OK } else { s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return s.inflate_flush(z, r) } n--; b |= (z.read_byte(p++) & 255) << k; k += 8 } dist += (b & inflate_mask[j]); b >>= j; k -= j; mode = COPY; case COPY: f = q - dist; while (f < 0) { f += s.end } while (len !== 0) { if (m === 0) { if (q == s.end && s.read !== 0) { q = 0; m = q < s.read ? s.read - q - 1 : s.end - q } if (m === 0) { s.write = q; r = s.inflate_flush(z, r); q = s.write; m = q < s.read ? s.read - q - 1 : s.end - q; if (q == s.end && s.read !== 0) { q = 0; m = q < s.read ? s.read - q - 1 : s.end - q } if (m === 0) { s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return s.inflate_flush(z, r) } } } s.window[q++] = s.window[f++]; m--; if (f == s.end) { f = 0 } len-- } mode = START; break; case LIT: if (m === 0) { if (q == s.end && s.read !== 0) { q = 0; m = q < s.read ? s.read - q - 1 : s.end - q } if (m === 0) { s.write = q; r = s.inflate_flush(z, r); q = s.write; m = q < s.read ? s.read - q - 1 : s.end - q; if (q == s.end && s.read !== 0) { q = 0; m = q < s.read ? s.read - q - 1 : s.end - q } if (m === 0) { s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return s.inflate_flush(z, r) } } } r = Z_OK; s.window[q++] = lit; m--; mode = START; break; case WASH: if (k > 7) { k -= 8; n++; p-- } s.write = q; r = s.inflate_flush(z, r); q = s.write; m = q < s.read ? s.read - q - 1 : s.end - q; if (s.read != s.write) { s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return s.inflate_flush(z, r) } mode = END; case END: r = Z_STREAM_END; s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return s.inflate_flush(z, r); case BADCODE: r = Z_DATA_ERROR; s.bitb = b; s.bitk = k; z.avail_in = n;
            z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return s.inflate_flush(z, r); default: r = Z_STREAM_ERROR; s.bitb = b; s.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; s.write = q; return s.inflate_flush(z, r)
        }
      }
    }; that.free = function () { }
  } var border = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]; var TYPE = 0; var LENS = 1; var STORED = 2; var TABLE = 3; var BTREE = 4; var DTREE = 5; var CODES = 6; var DRY = 7; var DONELOCKS = 8; var BADBLOCKS = 9; function InfBlocks(z, w) {
    var that = this; var mode = TYPE; var left = 0; var table = 0; var index = 0; var blens; var bb = [0]; var tb = [0]; var codes = new InfCodes(); var last = 0; var hufts = new Int32Array(MANY * 3); var check = 0; var inftree = new InfTree(); that.bitk = 0; that.bitb = 0; that.window = new Uint8Array(w); that.end = w; that.read = 0; that.write = 0; that.reset = function (z, c) { if (c) { c[0] = check } if (mode == CODES) { codes.free(z) } mode = TYPE; that.bitk = 0; that.bitb = 0; that.read = that.write = 0 }; that.reset(z, null); that.inflate_flush = function (z, r) { var n; var p; var q; p = z.next_out_index; q = that.read; n = ((q <= that.write ? that.write : that.end) - q); if (n > z.avail_out) { n = z.avail_out } if (n !== 0 && r == Z_BUF_ERROR) { r = Z_OK } z.avail_out -= n; z.total_out += n; z.next_out.set(that.window.subarray(q, q + n), p); p += n; q += n; if (q == that.end) { q = 0; if (that.write == that.end) { that.write = 0 } n = that.write - q; if (n > z.avail_out) { n = z.avail_out } if (n !== 0 && r == Z_BUF_ERROR) { r = Z_OK } z.avail_out -= n; z.total_out += n; z.next_out.set(that.window.subarray(q, q + n), p); p += n; q += n } z.next_out_index = p; that.read = q; return r }; that.proc = function (z, r) {
      var t; var b; var k; var p; var n; var q; var m; var i; p = z.next_in_index; n = z.avail_in; b = that.bitb; k = that.bitk; q = that.write; m = (q < that.read ? that.read - q - 1 : that.end - q); while (true) {
        switch (mode) {
          case TYPE: while (k < (3)) { if (n !== 0) { r = Z_OK } else { that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r) } n--; b |= (z.read_byte(p++) & 255) << k; k += 8 } t = (b & 7); last = t & 1; switch (t >>> 1) { case 0: b >>>= (3); k -= (3); t = k & 7; b >>>= (t); k -= (t); mode = LENS; break; case 1: var bl = []; var bd = []; var tl = [[]]; var td = [[]]; InfTree.inflate_trees_fixed(bl, bd, tl, td); codes.init(bl[0], bd[0], tl[0], 0, td[0], 0); b >>>= (3); k -= (3); mode = CODES; break; case 2: b >>>= (3); k -= (3); mode = TABLE; break; case 3: b >>>= (3); k -= (3); mode = BADBLOCKS; z.msg = "invalid block type"; r = Z_DATA_ERROR; that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r) }break; case LENS: while (k < (32)) { if (n !== 0) { r = Z_OK } else { that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r) } n--; b |= (z.read_byte(p++) & 255) << k; k += 8 } if ((((~b) >>> 16) & 65535) != (b & 65535)) { mode = BADBLOCKS; z.msg = "invalid stored block lengths"; r = Z_DATA_ERROR; that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r) } left = (b & 65535); b = k = 0; mode = left !== 0 ? STORED : (last !== 0 ? DRY : TYPE); break; case STORED: if (n === 0) { that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r) } if (m === 0) { if (q == that.end && that.read !== 0) { q = 0; m = (q < that.read ? that.read - q - 1 : that.end - q) } if (m === 0) { that.write = q; r = that.inflate_flush(z, r); q = that.write; m = (q < that.read ? that.read - q - 1 : that.end - q); if (q == that.end && that.read !== 0) { q = 0; m = (q < that.read ? that.read - q - 1 : that.end - q) } if (m === 0) { that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r) } } } r = Z_OK; t = left; if (t > n) { t = n } if (t > m) { t = m } that.window.set(z.read_buf(p, t), q); p += t; n -= t; q += t; m -= t; if ((left -= t) !== 0) { break } mode = last !== 0 ? DRY : TYPE; break; case TABLE: while (k < (14)) { if (n !== 0) { r = Z_OK } else { that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r) } n--; b |= (z.read_byte(p++) & 255) << k; k += 8 } table = t = (b & 16383); if ((t & 31) > 29 || ((t >> 5) & 31) > 29) { mode = BADBLOCKS; z.msg = "too many length or distance symbols"; r = Z_DATA_ERROR; that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r) } t = 258 + (t & 31) + ((t >> 5) & 31); if (!blens || blens.length < t) { blens = [] } else { for (i = 0; i < t; i++) { blens[i] = 0 } } b >>>= (14); k -= (14); index = 0; mode = BTREE; case BTREE: while (index < 4 + (table >>> 10)) { while (k < (3)) { if (n !== 0) { r = Z_OK } else { that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r) } n--; b |= (z.read_byte(p++) & 255) << k; k += 8 } blens[border[index++]] = b & 7; b >>>= (3); k -= (3) } while (index < 19) { blens[border[index++]] = 0 } bb[0] = 7; t = inftree.inflate_trees_bits(blens, bb, tb, hufts, z); if (t != Z_OK) { r = t; if (r == Z_DATA_ERROR) { blens = null; mode = BADBLOCKS } that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r) } index = 0; mode = DTREE; case DTREE: while (true) {
            t = table; if (index >= 258 + (t & 31) + ((t >> 5) & 31)) { break } var j, c; t = bb[0]; while (k < (t)) {
              if (n !== 0) { r = Z_OK } else {
                that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r)
              } n--; b |= (z.read_byte(p++) & 255) << k; k += 8
            } t = hufts[(tb[0] + (b & inflate_mask[t])) * 3 + 1]; c = hufts[(tb[0] + (b & inflate_mask[t])) * 3 + 2]; if (c < 16) { b >>>= (t); k -= (t); blens[index++] = c } else { i = c == 18 ? 7 : c - 14; j = c == 18 ? 11 : 3; while (k < (t + i)) { if (n !== 0) { r = Z_OK } else { that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r) } n--; b |= (z.read_byte(p++) & 255) << k; k += 8 } b >>>= (t); k -= (t); j += (b & inflate_mask[i]); b >>>= (i); k -= (i); i = index; t = table; if (i + j > 258 + (t & 31) + ((t >> 5) & 31) || (c == 16 && i < 1)) { blens = null; mode = BADBLOCKS; z.msg = "invalid bit length repeat"; r = Z_DATA_ERROR; that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r) } c = c == 16 ? blens[i - 1] : 0; do { blens[i++] = c } while (--j !== 0); index = i }
          } tb[0] = -1; var bl_ = []; var bd_ = []; var tl_ = []; var td_ = []; bl_[0] = 9; bd_[0] = 6; t = table; t = inftree.inflate_trees_dynamic(257 + (t & 31), 1 + ((t >> 5) & 31), blens, bl_, bd_, tl_, td_, hufts, z); if (t != Z_OK) { if (t == Z_DATA_ERROR) { blens = null; mode = BADBLOCKS } r = t; that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r) } codes.init(bl_[0], bd_[0], hufts, tl_[0], hufts, td_[0]); mode = CODES; case CODES: that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; if ((r = codes.proc(that, z, r)) != Z_STREAM_END) { return that.inflate_flush(z, r) } r = Z_OK; codes.free(z); p = z.next_in_index; n = z.avail_in; b = that.bitb; k = that.bitk; q = that.write; m = (q < that.read ? that.read - q - 1 : that.end - q); if (last === 0) { mode = TYPE; break } mode = DRY; case DRY: that.write = q; r = that.inflate_flush(z, r); q = that.write; m = (q < that.read ? that.read - q - 1 : that.end - q); if (that.read != that.write) { that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r) } mode = DONELOCKS; case DONELOCKS: r = Z_STREAM_END; that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r); case BADBLOCKS: r = Z_DATA_ERROR; that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r); default: r = Z_STREAM_ERROR; that.bitb = b; that.bitk = k; z.avail_in = n; z.total_in += p - z.next_in_index; z.next_in_index = p; that.write = q; return that.inflate_flush(z, r)
        }
      }
    }; that.free = function (z) { that.reset(z, null); that.window = null; hufts = null }; that.set_dictionary = function (d, start, n) { that.window.set(d.subarray(start, start + n), 0); that.read = that.write = n }; that.sync_point = function () { return mode == LENS ? 1 : 0 }
  } var PRESET_DICT = 32; var Z_DEFLATED = 8; var METHOD = 0; var FLAG = 1; var DICT4 = 2; var DICT3 = 3; var DICT2 = 4; var DICT1 = 5; var DICT0 = 6; var BLOCKS = 7; var DONE = 12; var BAD = 13; var mark = [0, 0, 255, 255]; function Inflate() {
    var that = this; that.mode = 0; that.method = 0; that.was = [0]; that.need = 0; that.marker = 0; that.wbits = 0; function inflateReset(z) { if (!z || !z.istate) { return Z_STREAM_ERROR } z.total_in = z.total_out = 0; z.msg = null; z.istate.mode = BLOCKS; z.istate.blocks.reset(z, null); return Z_OK } that.inflateEnd = function (z) { if (that.blocks) { that.blocks.free(z) } that.blocks = null; return Z_OK }; that.inflateInit = function (z, w) { z.msg = null; that.blocks = null; if (w < 8 || w > 15) { that.inflateEnd(z); return Z_STREAM_ERROR } that.wbits = w; z.istate.blocks = new InfBlocks(z, 1 << w); inflateReset(z); return Z_OK }; that.inflate = function (z, f) {
      var r; var b; if (!z || !z.istate || !z.next_in) { return Z_STREAM_ERROR } f = f == Z_FINISH ? Z_BUF_ERROR : Z_OK; r = Z_BUF_ERROR; while (true) {
        switch (z.istate.mode) {
          case METHOD: if (z.avail_in === 0) { return r } r = f; z.avail_in--; z.total_in++; if (((z.istate.method = z.read_byte(z.next_in_index++)) & 15) != Z_DEFLATED) { z.istate.mode = BAD; z.msg = "unknown compression method"; z.istate.marker = 5; break } if ((z.istate.method >> 4) + 8 > z.istate.wbits) { z.istate.mode = BAD; z.msg = "invalid window size"; z.istate.marker = 5; break } z.istate.mode = FLAG; case FLAG: if (z.avail_in === 0) { return r } r = f; z.avail_in--; z.total_in++; b = (z.read_byte(z.next_in_index++)) & 255; if ((((z.istate.method << 8) + b) % 31) !== 0) { z.istate.mode = BAD; z.msg = "incorrect header check"; z.istate.marker = 5; break } if ((b & PRESET_DICT) === 0) { z.istate.mode = BLOCKS; break } z.istate.mode = DICT4; case DICT4: if (z.avail_in === 0) { return r } r = f; z.avail_in--; z.total_in++; z.istate.need = ((z.read_byte(z.next_in_index++) & 255) << 24) & 4278190080; z.istate.mode = DICT3; case DICT3: if (z.avail_in === 0) { return r } r = f; z.avail_in--; z.total_in++; z.istate.need += ((z.read_byte(z.next_in_index++) & 255) << 16) & 16711680; z.istate.mode = DICT2; case DICT2: if (z.avail_in === 0) { return r } r = f; z.avail_in--; z.total_in++; z.istate.need += ((z.read_byte(z.next_in_index++) & 255) << 8) & 65280; z.istate.mode = DICT1; case DICT1: if (z.avail_in === 0) { return r } r = f; z.avail_in--; z.total_in++; z.istate.need += (z.read_byte(z.next_in_index++) & 255); z.istate.mode = DICT0; return Z_NEED_DICT; case DICT0: z.istate.mode = BAD; z.msg = "need dictionary"; z.istate.marker = 0; return Z_STREAM_ERROR; case BLOCKS: r = z.istate.blocks.proc(z, r); if (r == Z_DATA_ERROR) { z.istate.mode = BAD; z.istate.marker = 0; break } if (r == Z_OK) { r = f } if (r != Z_STREAM_END) { return r } r = f; z.istate.blocks.reset(z, z.istate.was); z.istate.mode = DONE;
          case DONE: return Z_STREAM_END; case BAD: return Z_DATA_ERROR; default: return Z_STREAM_ERROR
        }
      }
    }; that.inflateSetDictionary = function (z, dictionary, dictLength) { var index = 0; var length = dictLength; if (!z || !z.istate || z.istate.mode != DICT0) { return Z_STREAM_ERROR } if (length >= (1 << z.istate.wbits)) { length = (1 << z.istate.wbits) - 1; index = dictLength - length } z.istate.blocks.set_dictionary(dictionary, index, length); z.istate.mode = BLOCKS; return Z_OK }; that.inflateSync = function (z) { var n; var p; var m; var r, w; if (!z || !z.istate) { return Z_STREAM_ERROR } if (z.istate.mode != BAD) { z.istate.mode = BAD; z.istate.marker = 0 } if ((n = z.avail_in) === 0) { return Z_BUF_ERROR } p = z.next_in_index; m = z.istate.marker; while (n !== 0 && m < 4) { if (z.read_byte(p) == mark[m]) { m++ } else { if (z.read_byte(p) !== 0) { m = 0 } else { m = 4 - m } } p++; n-- } z.total_in += p - z.next_in_index; z.next_in_index = p; z.avail_in = n; z.istate.marker = m; if (m != 4) { return Z_DATA_ERROR } r = z.total_in; w = z.total_out; inflateReset(z); z.total_in = r; z.total_out = w; z.istate.mode = BLOCKS; return Z_OK }; that.inflateSyncPoint = function (z) { if (!z || !z.istate || !z.istate.blocks) { return Z_STREAM_ERROR } return z.istate.blocks.sync_point() }
  } function ZStream() { } ZStream.prototype = { inflateInit: function (bits) { var that = this; that.istate = new Inflate(); if (!bits) { bits = MAX_BITS } return that.istate.inflateInit(that, bits) }, inflate: function (f) { var that = this; if (!that.istate) { return Z_STREAM_ERROR } return that.istate.inflate(that, f) }, inflateEnd: function () { var that = this; if (!that.istate) { return Z_STREAM_ERROR } var ret = that.istate.inflateEnd(that); that.istate = null; return ret }, inflateSync: function () { var that = this; if (!that.istate) { return Z_STREAM_ERROR } return that.istate.inflateSync(that) }, inflateSetDictionary: function (dictionary, dictLength) { var that = this; if (!that.istate) { return Z_STREAM_ERROR } return that.istate.inflateSetDictionary(that, dictionary, dictLength) }, read_byte: function (start) { var that = this; return that.next_in.subarray(start, start + 1)[0] }, read_buf: function (start, size) { var that = this; return that.next_in.subarray(start, start + size) } }; function Inflater() { var that = this; var z = new ZStream(); var bufsize = 512; var flush = Z_NO_FLUSH; var buf = new Uint8Array(bufsize); var nomoreinput = false; z.inflateInit(); z.next_out = buf; that.append = function (data, onprogress) { var err, buffers = [], lastIndex = 0, bufferIndex = 0, bufferSize = 0, array; if (data.length === 0) { return } z.next_in_index = 0; z.next_in = data; z.avail_in = data.length; do { z.next_out_index = 0; z.avail_out = bufsize; if ((z.avail_in === 0) && (!nomoreinput)) { z.next_in_index = 0; nomoreinput = true } err = z.inflate(flush); if (nomoreinput && (err === Z_BUF_ERROR)) { if (z.avail_in !== 0) { throw new Error("inflating: bad input") } } else { if (err !== Z_OK && err !== Z_STREAM_END) { throw new Error("inflating: " + z.msg) } } if ((nomoreinput || err === Z_STREAM_END) && (z.avail_in === data.length)) { throw new Error("inflating: bad input") } if (z.next_out_index) { if (z.next_out_index === bufsize) { buffers.push(new Uint8Array(buf)) } else { buffers.push(new Uint8Array(buf.subarray(0, z.next_out_index))) } } bufferSize += z.next_out_index; if (onprogress && z.next_in_index > 0 && z.next_in_index != lastIndex) { onprogress(z.next_in_index); lastIndex = z.next_in_index } } while (z.avail_in > 0 || z.avail_out === 0); array = new Uint8Array(bufferSize); buffers.forEach(function (chunk) { array.set(chunk, bufferIndex); bufferIndex += chunk.length }); return array }; that.flush = function () { z.inflateEnd() } } var env = global.zip || global; env.Inflater = env._jzlib_Inflater = Inflater
})(lib);