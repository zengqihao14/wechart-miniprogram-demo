//svga.js
import SVGAPlayer from "../../vendor/wx.svga/player"
import SVGAParser from "../../vendor/wx.svga/parser"
import {SVGA_TITLE, SVGA_SOURCES, BUTTONS} from "../../constants/index"

const app = getApp()

Page({
  data: {
    svgaTitle: SVGA_TITLE,
    svgaSources: SVGA_SOURCES,
    svgaLoaded: false,
    radarImg: ''
  },
  onLoad: function () {
    setTimeout(() => {
      this.loadSVGA()
    }, 1000)
    this.createCanvas()
  },
  handleSVGATab: function(e) {
    console.log('handleSVGATab: do something', e)
    wx.navigateTo({
      url: BUTTONS.INDEX.PATH
    })
  },
  loadSVGA: function() {
    console.log('loadSVGA')
    const parser = new SVGAParser();
    this.data.svgaSources.forEach((item, index) => {
      const player = new SVGAPlayer(`svga-canvas-${index}`, 80, 80);
      parser.load(item.url, (videoItem) => {
        this.setData({
          svgaLoaded: true
        });
        player.setVideoItem(videoItem);
        player.startAnimation();
        setTimeout(() => {
          this.handleCanvarToImg(`svga-canvas-${index}`, 80, 80);
        }, 1800)
      });
    })
  },
  createCanvas: function() {
    const myCanvas = wx.createCanvasContext('svga-canvas-test');
    myCanvas.save()
    myCanvas.setFillStyle('red')
    myCanvas.fillRect(0, 0, 80, 80)
    myCanvas.draw();
  },

  handleCanvarToImg(id, width, height) {
    wx.canvasToTempFilePath({
      x: 0,
      y: 0,
      width,
      height,
      canvasId: id,
      success: (res) => {
        console.log('res.tempFilePath', res.tempFilePath)
        this.setData({
          radarImg: res.tempFilePath
        });
      }
    });
  },
  _encodeToBase64(input) {
    const _keyStr = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    let chr1, chr2, chr3, enc1, enc2, enc3, enc4;
    let i = 0;
    input = this._utf8_encode(input);
    while (i < input.length) {
      chr1 = input.charCodeAt(i++);
      chr2 = input.charCodeAt(i++);
      chr3 = input.charCodeAt(i++);
      enc1 = chr1 >> 2;
      enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
      enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
      enc4 = chr3 & 63;
      if (isNaN(chr2)) {
        enc3 = enc4 = 64;
      } else if (isNaN(chr3)) {
        enc4 = 64;
      }
      output = output +
          _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
          _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
    }
    return output;
  },
  _utf8_encode(string) {
    string = string.replace(/\r\n/g,'\n');
    let utftext = '';
    for (let n = 0; n < string.length; n++) {
      let c = string.charCodeAt(n);
      if (c < 128) {
        utftext += String.fromCharCode(c);
      } else if((c > 127) && (c < 2048)) {
        utftext += String.fromCharCode((c >> 6) | 192);
        utftext += String.fromCharCode((c & 63) | 128);
      } else {
        utftext += String.fromCharCode((c >> 12) | 224);
        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
        utftext += String.fromCharCode((c & 63) | 128);
      }

    }
    return utftext;
  }
})