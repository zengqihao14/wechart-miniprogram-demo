import SVGABezierPath from './bezierPath'
import SVGAEllipsePath from './ellipsePath'
import SVGARectPath from './rectPath'

/**
 * Unmatrix: parse the values of the matrix
 *
 * Algorithm from:
 *
 * - http://hg.mozilla.org/mozilla-central/file/7cb3e9795d04/layout/style/nsStyleAnimation.cpp
 *
 * @param {String} str
 * @return {Object}
 * @api public
 */

function parseMatrix(matrix) {
  var m = matrix;
  var A = m[0];
  var B = m[1];
  var C = m[2];
  var D = m[3];

  // if (A * D == B * C) throw new Error('transform#unmatrix: matrix is singular');

  // step (3)
  var scaleX = Math.sqrt(A * A + B * B);
  A /= scaleX;
  B /= scaleX;

  // step (4)
  var skew = A * C + B * D;
  C -= A * skew;
  D -= B * skew;

  // step (5)
  var scaleY = Math.sqrt(C * C + D * D);
  C /= scaleY;
  D /= scaleY;
  skew /= scaleY;

  // step (6)
  if (A * D < B * C) {
    A = -A;
    B = -B;
    skew = -skew;
    scaleX = -scaleX;
  }

  return {
    translateX: m[4],
    translateY: m[5],
    rotate: rtod(Math.atan2(B, A)),
    skew: rtod(Math.atan(skew)),
    scaleX: round(scaleX),
    scaleY: round(scaleY)
  };
};

/**
 * Get the computed style
 *
 * @param {Element} el
 * @return {String}
 * @api private
 */

function style(el) {
  var style = computed(el);

  return style.getPropertyValue('transform')
    || style.getPropertyValue('-webkit-transform')
    || style.getPropertyValue('-moz-transform')
    || style.getPropertyValue('-ms-transform')
    || style.getPropertyValue('-o-transform');
};

/**
 * Radians to degrees
 *
 * @param {Number} radians
 * @return {Number} degrees
 * @api private
 */

function rtod(radians) {
  var deg = radians * 180 / Math.PI;
  return round(deg);
}

/**
 * Round to the nearest hundredth
 *
 * @param {Number} n
 * @return {Number}
 * @api private
 */

function round(n) {
  return Math.round(n * 100) / 100;
}

export default class WXRender { }

WXRender.Stage = function (arg1, arg2, arg3) {
  return {
    setState: () => { },
    removeAllChildren: () => { },
    addChild: () => { },
    update: (player) => {
      WXRender.Draw(player);
    },
  };
}

WXRender.Draw = function (player, onCtx, inRect) {
  if (!player._canvasAnimating && player.clearsAfterStop) {
    return;
  }
  if (player._videoItem.bitmapCache === undefined) {
    player._videoItem.bitmapCache = {};
  }
  var ctx = onCtx || player._canvas;
  if (inRect === undefined) {
    inRect = { x: 0, y: 0, width: player._targetWidth, height: player._targetHeight }
  }
  ctx.save();
  ctx.translate(inRect.x, (inRect.height - inRect.width / player._videoItem.videoSize.width * player._videoItem.videoSize.height) / 2.0 + inRect.y);
  ctx.scale(inRect.width / player._videoItem.videoSize.width, inRect.width / player._videoItem.videoSize.width);
  player._videoItem.sprites.forEach(sprite => {
    ctx.setGlobalAlpha(0.0);
    let frameItem = sprite.frames[player._currentFrame];
    if (frameItem.alpha < 0.05) {
      return;
    }
    ctx.save();
    ctx.setGlobalAlpha(frameItem.alpha);
    let matrix = parseMatrix([frameItem.transform.a, frameItem.transform.b, frameItem.transform.c, frameItem.transform.d, frameItem.transform.tx, frameItem.transform.ty]);
    ctx.translate(matrix.translateX, matrix.translateY);
    ctx.rotate(matrix.rotate * Math.PI / 180);
    ctx.scale(matrix.scaleX, matrix.scaleY);
    let src = player._dynamicImage[sprite.imageKey] || player._videoItem.images[sprite.imageKey] || player._videoItem.images[sprite.imageKey + ".png"];
    if (typeof src === "string" && src.startsWith("iVBO")) {
      // todo: 小程序的绘图性能非常糟糕，暂时不能渲染位图。
      // ctx.drawImage("data:image/png;base64," + src, 0, 0, frameItem.layout.width, frameItem.layout.height);
    }
    frameItem.shapes && frameItem.shapes.forEach(shape => {
      if (shape.type === "shape" && shape.args && shape.args.d) {
        new SVGABezierPath(shape.args.d, shape.transform, shape.styles).getShape(WXRender).draw(ctx);
      }
      if (shape.type === "ellipse" && shape.args) {
        let ellipse = new SVGAEllipsePath(parseFloat(shape.args.x) || 0.0, parseFloat(shape.args.y) || 0.0, parseFloat(shape.args.radiusX) || 0.0, parseFloat(shape.args.radiusY) || 0.0, shape.transform, shape.styles);
        ellipse.getShape(WXRender).draw(ctx);
      }
      if (shape.type === "rect" && shape.args) {
        let rect = new SVGARectPath(parseFloat(shape.args.x) || 0.0, parseFloat(shape.args.y) || 0.0, parseFloat(shape.args.width) || 0.0, parseFloat(shape.args.height) || 0.0, parseFloat(shape.args.cornerRadius) || 0.0, shape.transform, shape.styles);
        rect.getShape(WXRender).draw(ctx);
      }
    })
    let dynamicText = player._dynamicText[sprite.imageKey];
    if (dynamicText !== undefined) {
      ctx.textBaseline = "middle";
      ctx.font = dynamicText.style;
      let textWidth = ctx.measureText(dynamicText.text).width
      ctx.fillStyle = dynamicText.color;
      let offsetX = (dynamicText.offset !== undefined && dynamicText.offset.x !== undefined) ? isNaN(parseFloat(dynamicText.offset.x)) ? 0 : parseFloat(dynamicText.offset.x) : 0;
      let offsetY = (dynamicText.offset !== undefined && dynamicText.offset.y !== undefined) ? isNaN(parseFloat(dynamicText.offset.y)) ? 0 : parseFloat(dynamicText.offset.y) : 0;
      ctx.fillText(dynamicText.text, (frameItem.layout.width - textWidth) / 2 + offsetX, frameItem.layout.height / 2 + offsetY);
    }
    ctx.restore();
  });
  ctx.draw(false);
  ctx.restore();
}

WXRender.Container = function () {
  return {
    setState: () => { },
    removeAllChildren: () => { },
    addChild: () => { },
    children: () => [],
  };
}

WXRender.AddTimer = function (callee, callback) {
  callee._canvasAnimating = true;
  callee.drawOnCanvas = (canvas, x, y, width, height) => { WXRender.Draw(callee, canvas, { x, y, width, height }); }
  let cancelled = false;
  let doFrame = () => {
    setTimeout(() => {
      if (cancelled === false) {
        callback && callback.call(callee);
        doFrame();
      }
    }, 16);
  }
  doFrame();
  return () => { callee._canvasAnimating = false; cancelled = true; };
}

WXRender.RemoveTimer = function (callee, handler) {
  return handler && handler();
}

WXRender.Matrix2D = function (a, b, c, d, tx, ty) {
  return { a, b, c, d, tx, ty };
}

WXRender.Shape = function () {
  let layer = {
    draw: (ctx, noFill) => {
      ctx.save();
      if (layer.transform !== undefined && layer.transform !== null) {
        let matrix = parseMatrix([layer.transform.a, layer.transform.b, layer.transform.c, layer.transform.d, layer.transform.tx, layer.transform.ty]);
        ctx.translate(matrix.translateX, matrix.translateY);
        ctx.rotate(matrix.rotate * Math.PI / 180);
        ctx.scale(matrix.scaleX, matrix.scaleY);
      }
      ctx.setFillStyle(layer.graphics.fillStyle);
      ctx.setStrokeStyle(layer.graphics.strokeStyle);
      ctx.setLineCap(layer.graphics.lineCap);
      ctx.setLineJoin(layer.graphics.lineJoin);
      ctx.setLineWidth(layer.graphics.lineWidth);
      ctx.setMiterLimit(layer.graphics.miterLimit);
      if (layer.graphics.strokeDash !== undefined) {
        const { arr, arg } = layer.graphics.strokeDash;
        const newArr = [];
        arr.forEach(item => newArr.push(item));
        newArr.push(arg);
        // ctx.setLineDash(newArr); // todo: 小程序不支持虚线
      }
      if (layer.graphics.currentPath instanceof Array) {
        ctx.beginPath();
        layer.graphics.currentPath.forEach((item) => {
          if (item[0] === "moveTo") {
            ctx.moveTo(item[1], item[2]);
          }
          else if (item[0] === "lineTo") {
            ctx.lineTo(item[1], item[2]);
          }
          else if (item[0] === "bezierCurveTo") {
            ctx.bezierCurveTo(item[1], item[2], item[3], item[4], item[5], item[6]);
          }
          else if (item[0] === "quadraticCurveTo") {
            ctx.quadraticCurveTo(item[1], item[2], item[3], item[4]);
          }
          else if (item[0] === "closePath") {
            ctx.closePath();
          }
          else if (item[0] === "ellipse") {
            let x = item[1];
            let y = item[2];
            let w = item[3];
            let h = item[4];
            var kappa = .5522848,
              ox = (w / 2) * kappa,
              oy = (h / 2) * kappa,
              xe = x + w,
              ye = y + h,
              xm = x + w / 2,
              ym = y + h / 2;

            ctx.beginPath();
            ctx.moveTo(x, ym);
            ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
            ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
            ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
            ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
          }
          else if (item[0] === "rect") {
            let x = item[1];
            let y = item[2];
            let width = item[3];
            let height = item[4];
            let radius = item[5];
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + width - radius, y);
            ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
            ctx.lineTo(x + width, y + height - radius);
            ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
            ctx.lineTo(x + radius, y + height);
            ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
            ctx.lineTo(x, y + radius);
            ctx.quadraticCurveTo(x, y, x + radius, y);
            ctx.closePath();
          }
        })
      }
      layer.graphics.fillStyle && noFill !== true && ctx.fill();
      layer.graphics.strokeStyle && ctx.stroke();
      ctx.restore();
    },
  };
  layer.setState = (state) => { layer.transform = state.transform; };
  layer.graphics = {};
  layer.graphics.currentPath = [];
  layer.graphics.beginFill = (fillStyle) => {
    layer.graphics.fillStyle = fillStyle;
  }
  layer.graphics.beginStroke = (stroke) => {
    layer.graphics.strokeStyle = stroke;
  }
  layer.graphics.setStrokeStyle = (width, caps, joints, miterLimit) => {
    layer.graphics.lineCap = caps;
    layer.graphics.lineJoin = joints;
    layer.graphics.lineWidth = width;
    layer.graphics.miterLimit = miterLimit;
  }
  layer.graphics.setStrokeDash = (arr, arg) => {
    layer.graphics.strokeDash = { arr, arg }
  }
  layer.graphics.st = (x, y) => {
    layer.graphics.currentPath = [];
  }
  layer.graphics.mt = (x, y) => {
    layer.graphics.currentPath.push(["moveTo", x, y]);
  }
  layer.graphics.lt = (x, y) => {
    layer.graphics.currentPath.push(["lineTo", x, y]);
  }
  layer.graphics.bt = (x1, y1, x2, y2, x, y) => {
    layer.graphics.currentPath.push(["bezierCurveTo", x1, y1, x2, y2, x, y]);
  }
  layer.graphics.qt = (x1, y1, x, y) => {
    layer.graphics.currentPath.push(["quadraticCurveTo", x1, y1, x, y]);
  }
  layer.graphics.cp = () => {
    layer.graphics.currentPath.push(["closePath"]);
  }
  layer.graphics.drawEllipse = (left, top, dX, dY) => {
    layer.graphics.currentPath.push(["ellipse", left, top, dX, dY]);
  }
  layer.graphics.drawRoundRect = (x, y, width, height, cornerRadius) => {
    layer.graphics.currentPath.push(["rect", x, y, width, height, cornerRadius]);
  }
  return layer;
}

WXRender.Bitmap = function (src) {
  return {};
}

WXRender.Text = function (text, style, color) {
  return { text, style, color };
}

WXRender.setBounds = function (layer, bounds) {
  return undefined;
}
